import { composeKyivMultimodalChains } from '../server/journey/multimodalChainEngine';

async function main() {
  console.log('--- Testing Troieshchyna (Kyiv) to Kyiv-Pasazhyrskyi Multimodal Chains ---');
  // From Troieshchyna (Mayakovs'koho / Chervonoyi Kalyny Ave: [30.605, 50.515]) to Kyiv-Pasazhyrskyi ([30.488, 50.441])
  const chains = await composeKyivMultimodalChains({
    origin: { name: 'Троєщина (просп. Червоної Калини)', coordinates: [30.605, 50.515] },
    destination: { name: 'Київ-Пасажирський', coordinates: [30.488, 50.441] },
    departureAt: new Date(),
    passengers: 1,
    strategy: 'BALANCED',
    preferences: {
      allowPublicTransport: true,
      allowTaxi: true,
      allowedTransportTypes: ['metro', 'city_train', 'taxi', 'scooter', 'bike', 'bus'],
    },
  });

  console.log(`Found ${chains.length} multimodal combinations.`);
  for (const [idx, j] of chains.slice(0, 8).entries()) {
    console.log(`\nOption ${idx + 1}: ${j.providerName || j.source} (${j.strategy})`);
    console.log(`  Duration: ${Math.round(j.totalDurationSeconds / 60)} min | Total Price: ${j.totalPriceMinor ? j.totalPriceMinor / 100 + ' ₴' : 'N/A'} | Transfers: ${j.transfers}`);
    console.log(`  Legs (${j.legs.length}):`);
    for (const leg of j.legs) {
      console.log(`    - [${leg.mode}] ${leg.origin.name} → ${leg.destination.name} (${Math.round(leg.durationSeconds / 60)} хв, ${leg.priceMinor ? leg.priceMinor / 100 + ' ₴' : '0 ₴'}) [${leg.providerName || leg.source}]`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
