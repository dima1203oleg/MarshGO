import { Pool } from 'pg';
import { composeKyivMultimodalChains } from '../server/journey/multimodalChainEngine';

async function main() {
  console.log('--- 1. Testing Kyiv Multimodal Chain Engine ---');
  // From Obolon (Heroiv Dnipra area: [30.498, 50.522]) to Kyiv Passenger Railway Station ([30.488, 50.441])
  const chains = await composeKyivMultimodalChains({
    origin: { name: 'Оболонь (Київ)', coordinates: [30.498, 50.522] },
    destination: { name: 'Київ-Пасажирський', coordinates: [30.488, 50.441] },
    departureAt: new Date(),
    passengers: 1,
    strategy: 'BALANCED',
    preferences: {
      allowPublicTransport: true,
      allowTaxi: true,
      allowedTransportTypes: ['metro', 'taxi', 'scooter', 'bike', 'bus'],
    },
  });

  console.log(`Produced ${chains.length} multimodal journey alternatives in Kyiv.`);
  for (const [idx, j] of chains.slice(0, 5).entries()) {
    console.log(`\nOption ${idx + 1}: ${j.providerName || j.source} (${j.strategy})`);
    console.log(`  Duration: ${Math.round(j.totalDurationSeconds / 60)} min | Price: ${j.totalPriceMinor ? j.totalPriceMinor / 100 + ' ₴' : 'N/A'} | Transfers: ${j.transfers}`);
    console.log(`  Legs (${j.legs.length}):`);
    for (const leg of j.legs) {
      console.log(`    - [${leg.mode}] ${leg.origin.name} → ${leg.destination.name} (${Math.round(leg.durationSeconds / 60)} хв, ${leg.priceMinor ? leg.priceMinor / 100 + ' ₴' : '0 ₴'}) [${leg.providerName || leg.source}]`);
    }
  }

  console.log('\n--- 2. Verifying Kyiv Providers in Database ---');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo_e2e' });
  const { rows } = await pool.query(
    `SELECT name, city, provider_type, source_type, health, status FROM mobility_providers WHERE city='Київ' ORDER BY provider_type, name`
  );
  console.log(`Active Kyiv providers in DB (${rows.length}):`);
  for (const r of rows) {
    console.log(`  - [${r.provider_type}/${r.source_type}] ${r.name} (${r.status}, ${r.health})`);
  }
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
