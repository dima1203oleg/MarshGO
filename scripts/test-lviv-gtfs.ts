import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';
import { cachedGtfsTimetable, findGtfsItineraries } from '../server/journey/gtfsTimetable';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const prov = await pool.query(`SELECT id, name, feed_url, last_report FROM mobility_providers WHERE name ILIKE '%Львівавтодор%GTFS%'`);
  console.log('Provider:', prov.rows[0]);
  if (!prov.rows[0]) return;

  const timetable = await cachedGtfsTimetable(prov.rows[0].id, prov.rows[0].feed_url);
  console.log('Feed stops count:', timetable.stops.size, 'routes count:', timetable.routes.size);

  const departure = new Date(Date.now() + 3600_000);
  const res = findGtfsItineraries(timetable, {
    providerId: prov.rows[0].id,
    providerName: prov.rows[0].name,
    origin: [24.0029933, 49.8681678],
    destination: [24.057585, 49.794117],
    earliestDeparture: departure,
    latestDeparture: new Date(departure.getTime() + 180 * 60_000),
    maximumStopDistanceMeters: 2500,
    maximumTransfers: 2,
    limit: 10,
  });

  console.log('GTFS itineraries found for Малоголосківська -> Сихів:', res.length);
  for (const it of res) {
    console.log(`- Dur: ${Math.round(it.durationSeconds/60)}m, Transfers: ${it.transfers}, Walk: ${it.walkingMeters}m`);
    for (const seg of it.segments) {
      console.log(`  -> [${seg.mode}] Route: ${seg.routeName} (${seg.headsign}) from ${seg.originStop.name} to ${seg.destinationStop.name}`);
    }
  }

  await pool.end();
}

run().catch(console.error);
