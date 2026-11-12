export type PlaceSuggestion = {
  label: string;
  latitude: number;
  longitude: number;
  providerId: string;
};

export class GeocodingUnavailableError extends Error {
  constructor(message = 'Geocoding service is not configured') { super(message); }
}

export function parseNominatimSuggestions(payload: unknown): PlaceSuggestion[] {
  if (!Array.isArray(payload)) throw new GeocodingUnavailableError('Geocoder returned an invalid response');
  const items = payload.flatMap((item): Array<PlaceSuggestion & { score: number }> => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const label = typeof record.display_name === 'string' ? record.display_name.trim() : '';
    const latitude = typeof record.lat === 'string' || typeof record.lat === 'number' ? Number(record.lat) : NaN;
    const longitude = typeof record.lon === 'string' || typeof record.lon === 'number' ? Number(record.lon) : NaN;
    const providerId = record.place_id === undefined ? '' : String(record.place_id);
    // Rivers, lakes or forests named like a town ("Стрий" the river) must never become a pickup point.
    const category = String(record.category ?? record.class ?? '');
    const kind = String(record.type ?? '');
    if (category === 'waterway' || (category === 'natural' && /^(water|river|stream|bay|strait|wetland|coastline|spring|reservoir|wood|scrub|grassland|heath)$/.test(kind)) || category === 'landuse' || category === 'leisure') return [];
    if (!label || !providerId || !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return [];

    let score = typeof record.importance === 'number' ? record.importance : (Number(record.importance) || 0);
    // Major urban centers and districts have far higher passenger traffic than small rural villages with similar names
    const isMajorMetro = /(Львів|Київ|Харків|Одеса|Дніпро|Запоріжжя|Вінниця|Полтава|Черкаси|Житомир|Суми|Хмельницький|Чернівці|Рівне|Івано-Франківськ|Тернопіль|Луцьк|Ужгород)/i.test(label);
    if (isMajorMetro) {
      score += 0.05;
      if (kind === 'suburb' || kind === 'quarter' || kind === 'neighbourhood' || kind === 'district') {
        score += 0.03;
      }
    }
    return [{ label, latitude, longitude, providerId, score }];
  });

  return items
    .sort((a, b) => b.score - a.score)
    .map(({ label, latitude, longitude, providerId }) => ({ label, latitude, longitude, providerId }));
}

const reverseCache = new Map<string, { at: number; place: PlaceSuggestion }>();
const reverseCacheTtlMs = 10 * 60_000;

/** Map-picker pans fire many nearby lookups; a ~100 m grid cache keeps providers within their rate limits. */
export async function reverseGeocode(latitude: number, longitude: number): Promise<PlaceSuggestion> {
  const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const hit = reverseCache.get(key);
  if (hit && Date.now() - hit.at < reverseCacheTtlMs) return hit.place;
  const place = await reverseGeocodeUncached(latitude, longitude);
  if (reverseCache.size > 500) reverseCache.delete(reverseCache.keys().next().value as string);
  reverseCache.set(key, { at: Date.now(), place });
  return place;
}

async function reverseGeocodeUncached(latitude: number, longitude: number): Promise<PlaceSuggestion> {
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180) {
    throw new GeocodingUnavailableError('Reverse geocoding coordinates are invalid');
  }
  const endpoint = process.env.GEOCODING_REVERSE_URL;
  if (!endpoint) throw new GeocodingUnavailableError('Reverse geocoder is not configured');
  let url: URL;
  try { url = new URL(endpoint); }
  catch { throw new GeocodingUnavailableError('Reverse geocoder endpoint is invalid'); }
  if (url.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    throw new GeocodingUnavailableError('Production geocoder must use HTTPS');
  }
  url.searchParams.set('lat', String(latitude));
  url.searchParams.set('lon', String(longitude));
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('accept-language', 'uk');
  const headers = new Headers({ accept: 'application/json', 'user-agent': 'MARSHGO/1.0 (reverse geocoding)' });
  const apiKey = process.env.GEOCODING_API_KEY;
  if (apiKey) headers.set('authorization', `Bearer ${apiKey}`);
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(5_000) }).catch(() => null);
  if (!response?.ok) throw new GeocodingUnavailableError('Reverse geocoder request failed');
  const record = await response.json().catch(() => { throw new GeocodingUnavailableError('Reverse geocoder returned invalid JSON'); });
  const [place] = parseNominatimSuggestions([record]);
  if (!place) throw new GeocodingUnavailableError('Reverse geocoder returned no valid place');
  return place;
}

export async function suggestPlaces(query: string): Promise<PlaceSuggestion[]> {
  const endpoint = process.env.GEOCODING_ENGINE_URL;
  if (!endpoint) throw new GeocodingUnavailableError();
  let url: URL;
  try { url = new URL(endpoint); }
  catch { throw new GeocodingUnavailableError('Geocoder endpoint is invalid'); }
  if (url.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    throw new GeocodingUnavailableError('Production geocoder must use HTTPS');
  }
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('countrycodes', 'ua');
  url.searchParams.set('accept-language', 'uk');
  url.searchParams.set('limit', '6');

  const headers = new Headers({ accept: 'application/json', 'user-agent': 'MARSHGO/1.0 (place search)' });
  const apiKey = process.env.GEOCODING_API_KEY;
  if (apiKey) headers.set('authorization', `Bearer ${apiKey}`);
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(5_000) }).catch(() => null);
  if (!response?.ok) throw new GeocodingUnavailableError('Geocoder request failed');
  return parseNominatimSuggestions(await response.json());
}
