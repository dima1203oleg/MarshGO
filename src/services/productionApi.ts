export type ApiUser = {
  id: string;
  display_name: string;
  phone_e164: string;
  email?: string | null;
  roles: string[];
  is_verified: boolean;
};

export type ApiOffer = {
  id: string;
  origin_name: string;
  destination_name: string;
  departure_at: string;
  arrival_at: string | null;
  distance_m: number | null;
  duration_s: number | null;
  route_source: string | null;
  price_per_seat_minor: number;
  currency: string;
  available_seats: number;
  total_seats: number;
  driver_name: string;
  average_rating: number | null;
  review_count: number;
  status?: string;
  vehicle_photo_url?: string | null;
};

export type ApiBooking = {
  id: string;
  offer_id: string;
  seat_count: number;
  total_price_minor: number;
  currency: string;
  status: string;
  origin_name: string;
  destination_name: string;
  departure_at: string;
  driver_name: string;
  passenger_name: string;
  current_user_is_driver: boolean;
};

export type ApiVehicle = {
  id: string;
  make: string;
  model: string;
  model_year: number;
  seat_count: number;
  verification_status: string;
  is_active: boolean;
};
export type ApiVehiclePhoto = { id: string; url: string; is_primary: boolean; created_at: string };
export type ApiVerificationRecord = {
  id: string; verification_type: 'vehicle' | 'driver_license' | 'identity' | 'commercial'; vehicle_id: string | null;
  status: 'pending' | 'approved' | 'rejected'; created_at: string; reviewed_at: string | null;
};
export type ApiVerificationQueueItem = ApiVerificationRecord & {
  user_id: string; display_name: string; make: string | null; model: string | null;
  model_year: number | null; seat_count: number | null;
};

export type ApiMessage = { id: string; sender_id: string; sender_name: string; body: string; created_at: string };
export type ApiConversation = { id: string; booking_id: string; created_at: string };
export type ApiPlace = { label: string; latitude: number; longitude: number; providerId: string };
export type ApiDemand = {
  id: string; origin_name: string; destination_name: string; earliest_departure: string; latest_departure: string;
  passenger_count: number; budget_minor: number | null; budget_type: 'total_all' | 'per_seat'; notes: string | null;
  requirements: Record<string, unknown>; status: string; created_at: string;
  proposal_count?: number;
};
export type ApiProposal = {
  id: string; demand_id: string; driver_id: string; driver_name: string; vehicle_id: string;
  make: string; model: string; model_year: number; price_minor: number; currency: string; departure_at: string;
  comment: string | null; status: string; expires_at: string; revision_number: number; last_actor_role: 'driver' | 'passenger' | null;
  last_comment: string | null;
};
export type ApiProposalRevision = {
  revision_number: number; actor_id: string; actor_role: 'driver' | 'passenger'; price_minor: number;
  departure_at: string; comment: string | null; created_at: string;
};

type ApiEnvelope<T> = { data: T };
const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
let accessToken: string | null = null;

async function request<T>(path: string, init: RequestInit = {}, retryAuth = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
  const response = await fetch(`${apiBase}/api/v1${path}`, { ...init, headers, credentials: 'include' });
  const body = await response.json().catch(() => null) as { data?: T; error?: { message?: string } } | null;
  if (response.status === 401 && retryAuth && accessToken && !path.startsWith('/auth/')) {
    try {
      const session = await request<{ user: ApiUser; accessToken: string }>('/auth/refresh', { method: 'POST' }, false);
      accessToken = session.accessToken;
      return request<T>(path, init, false);
    } catch {
      accessToken = null;
    }
  }
  if (!response.ok) throw new Error(body?.error?.message || `Request failed (${response.status})`);
  return (body as ApiEnvelope<T>).data;
}

export const productionApi = {
  async restoreSession() {
    const session = await request<{ user: ApiUser; accessToken: string }>('/auth/refresh', { method: 'POST' });
    accessToken = session.accessToken;
    return session.user;
  },
  async requestOtp(phone: string, displayName: string) {
    return request<{ expiresInSeconds: number; delivery: string; developmentCode?: string }>('/auth/otp/request', {
      method: 'POST', body: JSON.stringify({ phone, displayName }),
    });
  },
  async verifyOtp(phone: string, code: string) {
    const session = await request<{ user: ApiUser; accessToken: string }>('/auth/otp/verify', {
      method: 'POST', body: JSON.stringify({ phone, code }),
    });
    accessToken = session.accessToken;
    return session.user;
  },
  async logout() {
    try { await request('/auth/logout'); } finally { accessToken = null; }
  },
  offers(params: { origin: string; destination: string; date: string; seats: number; originCoordinates?: [number, number]; destinationCoordinates?: [number, number] }) {
    const query = new URLSearchParams({ origin: params.origin, destination: params.destination, date: params.date, seats: String(params.seats) });
    if (params.originCoordinates) { query.set('originLon', String(params.originCoordinates[0])); query.set('originLat', String(params.originCoordinates[1])); }
    if (params.destinationCoordinates) { query.set('destinationLon', String(params.destinationCoordinates[0])); query.set('destinationLat', String(params.destinationCoordinates[1])); }
    return request<ApiOffer[]>(`/offers?${query.toString()}`);
  },
  myOffers() { return request<ApiOffer[]>('/offers/mine'); },
  createOffer(input: {
    vehicleId: string; originName: string; destinationName: string; origin: [number, number]; destination: [number, number];
    departureAt: string; pricePerSeatMinor: number; seats: number;
  }) {
    return request<{ id: string; origin_name: string; destination_name: string; departure_at: string; status: string }>(
      '/offers', { method: 'POST', body: JSON.stringify(input) },
    );
  },
  suggestPlaces(query: string) {
    return request<ApiPlace[]>(`/places/suggest?q=${encodeURIComponent(query)}`);
  },
  createDemand(input: {
    originName: string; destinationName: string; origin: [number, number]; destination: [number, number];
    earliestDeparture: string; latestDeparture: string; passengers: number; budgetMinor?: number;
    budgetType?: 'total_all' | 'per_seat'; notes?: string; requirements?: Record<string, boolean>;
  }) {
    return request<ApiDemand>('/demands', { method: 'POST', body: JSON.stringify(input) });
  },
  myDemands() { return request<ApiDemand[]>('/demands/mine'); },
  openDemands() { return request<ApiDemand[]>('/demands'); },
  demandProposals(demandId: string) { return request<ApiProposal[]>(`/demands/${demandId}/proposals`); },
  proposalRevisions(proposalId: string) { return request<ApiProposalRevision[]>(`/proposals/${proposalId}/revisions`); },
  createProposal(demandId: string, input: { vehicleId: string; priceMinor: number; departureAt: string; comment?: string }) {
    return request<ApiProposal>(`/demands/${demandId}/proposals`, { method: 'POST', body: JSON.stringify(input) });
  },
  counterProposal(proposalId: string, input: { priceMinor: number; departureAt: string; comment?: string }) {
    return request<ApiProposal>(`/proposals/${proposalId}/counter`, { method: 'POST', body: JSON.stringify(input) });
  },
  agreeProposal(proposalId: string) {
    return request<ApiProposal>(`/proposals/${proposalId}/agree`, { method: 'POST' });
  },
  acceptProposal(proposalId: string) {
    return request<ApiBooking>(`/proposals/${proposalId}/accept`, { method: 'POST' });
  },
  cancelDemand(demandId: string) {
    return request<{ id: string; status: string }>(`/demands/${demandId}/cancel`, { method: 'POST' });
  },
  bookings() { return request<ApiBooking[]>('/bookings'); },
  cancelBooking(bookingId: string) {
    return request<{ id: string; status: string; replayed?: boolean }>(`/bookings/${bookingId}/cancel`, { method: 'POST' });
  },
  me() { return request<ApiUser>('/users/me'); },
  vehicles() { return request<ApiVehicle[]>('/vehicles'); },
  enableRole(role: 'passenger' | 'driver') {
    return request<{ id: string; roles: string[] }>('/users/me/roles', { method: 'POST', body: JSON.stringify({ role }) });
  },
  createVehicle(input: { make: string; model: string; modelYear: number; seats: number }) {
    return request<ApiVehicle>('/vehicles', { method: 'POST', body: JSON.stringify(input) });
  },
  vehiclePhotos(vehicleId: string) { return request<ApiVehiclePhoto[]>(`/vehicles/${vehicleId}/photos`); },
  async uploadVehiclePhoto(vehicleId: string, file: File) {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowed.has(file.type) || file.size < 1 || file.size > 10 * 1024 * 1024) throw new Error('Додайте JPEG, PNG або WebP до 10 МБ.');
    const upload = await request<{ key: string; url: string; fields: Record<string, string>; maxBytes: number }>(`/vehicles/${vehicleId}/photos/upload-url`, {
      method: 'POST', body: JSON.stringify({ contentType: file.type }),
    });
    const form = new FormData();
    for (const [key, value] of Object.entries(upload.fields)) form.append(key, value);
    form.append('file', file);
    const uploaded = await fetch(upload.url, { method: 'POST', body: form });
    if (!uploaded.ok) throw new Error(`Сховище не прийняло фото (${uploaded.status}).`);
    return request<ApiVehiclePhoto>(`/vehicles/${vehicleId}/photos`, { method: 'POST', body: JSON.stringify({ key: upload.key, contentType: file.type }) });
  },
  setPrimaryVehiclePhoto(vehicleId: string, photoId: string) {
    return request<ApiVehiclePhoto>(`/vehicles/${vehicleId}/photos/${photoId}/primary`, { method: 'PATCH' });
  },
  deleteVehiclePhoto(vehicleId: string, photoId: string) {
    return request<{ id: string; deleted: boolean }>(`/vehicles/${vehicleId}/photos/${photoId}`, { method: 'DELETE' });
  },
  activateVehicle(id: string) { return request<ApiVehicle>(`/vehicles/${id}/activate`, { method: 'POST' }); },
  verificationRecords() { return request<ApiVerificationRecord[]>('/users/me/verification'); },
  verificationEvidenceUploadUrl(vehicleId: string, contentType: string) {
    return request<{ key: string; url: string; fields: Record<string, string>; expiresInSeconds: number; maxBytes: number }>(
      `/vehicles/${vehicleId}/verification/evidence/upload-url`, { method: 'POST', body: JSON.stringify({ contentType }) },
    );
  },
  async uploadVerificationEvidence(vehicleId: string, file: File) {
    const upload = await this.verificationEvidenceUploadUrl(vehicleId, file.type);
    if (file.size < 1 || file.size > upload.maxBytes) throw new Error('Документ має бути меншим за 8 МБ.');
    const form = new FormData();
    for (const [key, value] of Object.entries(upload.fields)) form.append(key, value);
    form.append('file', file);
    const response = await fetch(upload.url, { method: 'POST', body: form });
    if (!response.ok) throw new Error(`Сховище не прийняло документ (${response.status}).`);
    return { key: upload.key, contentType: file.type };
  },
  submitVehicleVerification(vehicleId: string, input: { registrationEvidenceKey: string; registrationContentType: string; driverLicenseEvidenceKey: string; driverLicenseContentType: string }) {
    return request<{ vehicleId: string; status: string }>(`/vehicles/${vehicleId}/verification`, { method: 'POST', body: JSON.stringify(input) });
  },
  adminVerificationQueue() { return request<ApiVerificationQueueItem[]>('/admin/verification'); },
  adminVerificationEvidence(id: string) { return request<{ url: string; expiresInSeconds: number }>(`/admin/verification/${id}/evidence`); },
  decideVerification(id: string, decision: 'approved' | 'rejected', note?: string) {
    return request<{ id: string; status: string; vehicleStatus: string | null }>(`/admin/verification/${id}/decision`, {
      method: 'POST', body: JSON.stringify({ decision, ...(note ? { note } : {}) }),
    });
  },
  conversation(bookingId: string) { return request<ApiConversation>(`/bookings/${bookingId}/conversation`); },
  messages(conversationId: string) { return request<ApiMessage[]>(`/conversations/${conversationId}/messages`); },
  sendMessage(conversationId: string, body: string) {
    return request<ApiMessage>(`/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ body }) });
  },
  book(offerId: string, seats: number) {
    return request<ApiBooking>('/bookings', {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ offerId, seats }),
    });
  },
};
