import { fetchJson } from './safeFetch';
import type { ParkingFacility, TrafficIncident } from '../../shared/mobility/interfaces';

const KYIV_PARKING_RESOURCE_ID = '5f34f3aa-c9de-4415-8419-3adb7561c4a3';
const KYIV_ROAD_CLOSURES_RESOURCE_ID = '8a29f5a0-ca04-4058-b2af-4c75aef13550';

const CKAN_API_BASE = 'https://data.kyivcity.gov.ua/api/action/datastore_search';

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

let parkingCache: CacheEntry<ParkingFacility[]> | null = null;
let closuresCache: CacheEntry<TrafficIncident[]> | null = null;

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function fetchKyivParkingFacilities(): Promise<ParkingFacility[]> {
  const now = Date.now();
  if (parkingCache && now - parkingCache.cachedAt < CACHE_TTL_MS) {
    return parkingCache.data;
  }

  const url = `${CKAN_API_BASE}?resource_id=${KYIV_PARKING_RESOURCE_ID}&limit=1000`;
  try {
    const { data } = await fetchJson(url, 10000);
    const result = data as {
      result?: {
        records?: Array<{
          _id?: number | string;
          address?: string;
          name?: string;
          latitude?: string | number;
          longitude?: string | number;
          lat?: string | number;
          lon?: string | number;
          capacity?: string | number;
          tariff?: string | number;
          operator?: string;
          type?: string;
        }>;
      };
    };

    const records = result.result?.records ?? [];
    const facilities: ParkingFacility[] = [];

    for (const record of records) {
      const lat = Number(record.latitude ?? record.lat);
      const lon = Number(record.longitude ?? record.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        continue;
      }

      facilities.push({
        id: `kyiv-park-${record._id ?? facilities.length}`,
        name: record.name || record.address || 'Паркувальний майданчик',
        address: record.address,
        coordinate: [lon, lat],
        capacity: record.capacity ? Number(record.capacity) : undefined,
        tariffUahPerHour: record.tariff ? Number(record.tariff) : undefined,
        operator: record.operator || 'КП «Київтранспарксервіс»',
        isCovered: String(record.type || '').toLowerCase().includes('крит'),
      });
    }

    parkingCache = { data: facilities, cachedAt: now };
    return facilities;
  } catch (error) {
    console.warn('[KyivPublicData] Failed to fetch live parking data, returning cached or empty array:', error);
    return parkingCache ? parkingCache.data : [];
  }
}

export async function fetchKyivRoadClosures(): Promise<TrafficIncident[]> {
  const now = Date.now();
  if (closuresCache && now - closuresCache.cachedAt < CACHE_TTL_MS) {
    return closuresCache.data;
  }

  const url = `${CKAN_API_BASE}?resource_id=${KYIV_ROAD_CLOSURES_RESOURCE_ID}&limit=500`;
  try {
    const { data } = await fetchJson(url, 10000);
    const result = data as {
      result?: {
        records?: Array<{
          _id?: number | string;
          description?: string;
          location?: string;
          lat?: string | number;
          lon?: string | number;
          start_date?: string;
          end_date?: string;
          type?: string;
          severity?: string;
        }>;
      };
    };

    const records = result.result?.records ?? [];
    const incidents: TrafficIncident[] = [];

    for (const record of records) {
      const lat = Number(record.lat);
      const lon = Number(record.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        continue;
      }

      incidents.push({
        id: `kyiv-closure-${record._id ?? incidents.length}`,
        type: 'ROAD_CLOSURE',
        description: record.description || record.location || 'Обмеження або перекриття руху транспорту',
        coordinate: [lon, lat],
        startTime: record.start_date || new Date().toISOString(),
        endTime: record.end_date,
        severity: 'HIGH',
      });
    }

    closuresCache = { data: incidents, cachedAt: now };
    return incidents;
  } catch (error) {
    console.warn('[KyivPublicData] Failed to fetch live road closures, returning cached or empty array:', error);
    return closuresCache ? closuresCache.data : [];
  }
}
