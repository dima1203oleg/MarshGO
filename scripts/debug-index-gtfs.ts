import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';
import { cachedGtfsTimetable, findGtfsItineraries, type GtfsTimetableSource } from '../server/journey/gtfsTimetable';
function bboxContains(box: [number, number, number, number], lon: number, lat: number) {
  return lon >= box[0] && lat >= box[1] && lon <= box[2] && lat <= box[3];
}
function intersects(a: [number, number, number, number], b: [number, number, number, number]) {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}
import { defaultSelection, toJourneyPreferences } from '../src/domain/transportPreferences';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function debugIndexGtfs() {
  const origin = { name: 'вул. Малоголосківська, Львів', coordinates: [24.0029933, 49.8681678] as [number, number] };
  const destination = { name: 'Сихів, Львів', coordinates: [24.057585, 49.794117] as [number, number] };

  const [originLon, originLat] = origin.coordinates;
  const [destinationLon, destinationLat] = destination.coordinates;
  const latitudeRadians = ((originLat + destinationLat) / 2) * Math.PI / 180;
  const routeDistanceMeters = 9118;
  const corridorWidthMeters = Math.max(12_000, Math.min(60_000, routeDistanceMeters * 0.2));
  const latitudePadding = corridorWidthMeters / 110_574 + 0.02;
  const longitudePadding = corridorWidthMeters / (111_320 * Math.max(0.2, Math.cos(latitudeRadians))) + 0.02;
  const corridorBox: [number, number, number, number] = [
    Math.min(originLon, destinationLon) - longitudePadding,
    Math.min(originLat, destinationLat) - latitudePadding,
    Math.max(originLon, destinationLon) + longitudePadding,
    Math.max(originLat, destinationLat) + latitudePadding,
  ];

  const { rows: gtfsProviders } = await pool.query<any>(
    `SELECT id,name,city,feed_url,last_sync_at,last_report FROM mobility_providers
      WHERE provider_type='public_transit' AND source_type='gtfs' AND access='open'
        AND status='enabled' AND health IN ('healthy','degraded')
      ORDER BY priority,name LIMIT 100`,
  );

  const eligibleGtfsProviders = gtfsProviders.filter((provider: any) => {
    if (routeDistanceMeters < 45_000 && provider.city === 'Україна') return false;
    const box = provider.last_report?.bbox;
    return Boolean(box && (bboxContains(box, originLon, originLat) || bboxContains(box, destinationLon, destinationLat) || intersects(box, corridorBox)));
  });
  console.log('Eligible GTFS providers:', eligibleGtfsProviders.map((p: any) => p.name));

  const feedSources: GtfsTimetableSource[] = [];
  for (const provider of eligibleGtfsProviders) {
    const feed = await cachedGtfsTimetable(provider.id, provider.feed_url);
    feedSources.push({ providerId: provider.id, providerName: provider.name, providerCity: provider.city, feed });
  }

  const provUrl = `http://127.0.0.1:3002/api/v1/mobility/providers?latitude=${originLat}&longitude=${originLon}`;
  const provRes = await fetch(provUrl, { headers: { Authorization: 'Bearer test' } }).catch(() => null);
  const provData = provRes ? await provRes.json() : null;
  const preferences = toJourneyPreferences(defaultSelection, provData?.data);

  for (const source of feedSources) {
    const departureAt = new Date(Date.now() + 3600_000);
    const itineraries = findGtfsItineraries(source.feed, {
      providerId: source.providerId,
      providerName: source.providerName,
      origin: origin.coordinates,
      destination: destination.coordinates,
      earliestDeparture: departureAt,
      latestDeparture: new Date(departureAt.getTime() + 120 * 60_000),
      limit: 100,
      maximumJourneySeconds: 24 * 60 * 60,
      maximumTransfers: 2,
      maximumWaitSeconds: 4 * 60 * 60,
      minimumTransferBufferSeconds: 600,
      maximumStopDistanceMeters: 2000,
      allowedModes: ['BUS', 'MINIBUS', 'RAIL', 'TRAM', 'TROLLEYBUS', 'METRO', 'FERRY', 'FUNICULAR'],
      allowedTransportTypes: preferences.allowedTransportTypes as any,
    });
    console.log(`findGtfsItineraries for ${source.providerName} (maxStopDist=2000): found ${itineraries.length}`);

    // What if maxStopDist=2500?
    const it2 = findGtfsItineraries(source.feed, {
      providerId: source.providerId,
      providerName: source.providerName,
      origin: origin.coordinates,
      destination: destination.coordinates,
      earliestDeparture: departureAt,
      latestDeparture: new Date(departureAt.getTime() + 120 * 60_000),
      limit: 100,
      maximumJourneySeconds: 24 * 60 * 60,
      maximumTransfers: 2,
      maximumWaitSeconds: 4 * 60 * 60,
      minimumTransferBufferSeconds: 600,
      maximumStopDistanceMeters: 2500,
      allowedModes: ['BUS', 'MINIBUS', 'RAIL', 'TRAM', 'TROLLEYBUS', 'METRO', 'FERRY', 'FUNICULAR'],
      allowedTransportTypes: preferences.allowedTransportTypes as any,
    });
    console.log(`findGtfsItineraries for ${source.providerName} (maxStopDist=2500): found ${it2.length}`);

    // Check closest stops to origin:
    const closestOrigin = [...source.feed.stops.values()]
      .map((s) => {
        const dLat = (s.lat - originLat) * Math.PI / 180;
        const dLon = (s.lon - originLon) * Math.PI / 180;
        const h = Math.sin(dLat/2)**2 + Math.cos(originLat*Math.PI/180)*Math.cos(s.lat*Math.PI/180)*Math.sin(dLon/2)**2;
        return { name: s.name, dist: Math.round(6371000 * 2 * Math.asin(Math.sqrt(h))) };
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5);
    console.log('Closest stops to Малоголосківська:', closestOrigin);
  }

  await pool.end();
}

debugIndexGtfs().catch(console.error);
