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
  offers(params: { origin: string; destination: string; date: string; seats: number }) {
    const query = new URLSearchParams({ ...params, seats: String(params.seats) });
    return request<ApiOffer[]>(`/offers?${query.toString()}`);
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
  me() { return request<ApiUser>('/users/me'); },
  vehicles() { return request<ApiVehicle[]>('/vehicles'); },
  enableRole(role: 'passenger' | 'driver') {
    return request<{ id: string; roles: string[] }>('/users/me/roles', { method: 'POST', body: JSON.stringify({ role }) });
  },
  createVehicle(input: { make: string; model: string; modelYear: number; seats: number }) {
    return request<ApiVehicle>('/vehicles', { method: 'POST', body: JSON.stringify(input) });
  },
  activateVehicle(id: string) { return request<ApiVehicle>(`/vehicles/${id}/activate`, { method: 'POST' }); },
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
