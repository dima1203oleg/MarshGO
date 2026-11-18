import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';
import { composeUkraineMultimodalChains } from '../server/journey/multimodalChainEngine';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  // Малоголосківська: [24.0029933, 49.8681678]
  // Сихів, Львів: [24.057585, 49.794117]
  const origin = { name: 'вул. Малоголосківська, Львів', coordinates: [24.0029933, 49.8681678] as [number, number] };
  const destination = { name: 'Сихів, Львів', coordinates: [24.057585, 49.794117] as [number, number] };

  console.log('Distance between Малоголосківська and Сихів:');
  const dLat = (destination.coordinates[1] - origin.coordinates[1]) * Math.PI / 180;
  const dLon = (destination.coordinates[0] - origin.coordinates[0]) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(origin.coordinates[1]*Math.PI/180)*Math.cos(destination.coordinates[1]*Math.PI/180)*Math.sin(dLon/2)**2;
  const dist = 6371000 * 2 * Math.asin(Math.sqrt(a));
  console.log(Math.round(dist) + ' meters (~' + (dist/1000).toFixed(1) + ' km)');

  const chains = await composeUkraineMultimodalChains({
    origin,
    destination,
    departureAt: new Date(Date.now() + 3600_000),
    passengers: 1,
    strategy: 'BALANCED',
    preferences: { allowPublicTransport: true, allowBus: true, allowRail: true, allowTaxi: true },
    communityOffers: [],
  });

  console.log(`\nFound ${chains.length} multimodal chains for Малоголосківська -> Сихів (Львів):`);
  for (const c of chains) {
    console.log(`- Strategy: ${c.strategy}, Dur: ${Math.round(c.totalDurationSeconds/60)}m, Price: ${(c.totalPriceMinor ?? 0)/100} грн, Legs: ${c.legs.map(l => `${l.mode}(${l.routeName || l.providerName})`).join(' -> ')}`);
  }

  await pool.end();
}

run().catch(console.error);
