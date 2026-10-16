import { spawn } from 'child_process';

async function main() {
  const port = 3399;
  const env = {
    ...process.env,
    API_PORT: String(port),
    API_HOST: '127.0.0.1',
    DATABASE_URL: process.env.DATABASE_URL || 'postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo_e2e',
    AUTH_DEV_OTP: 'true',
    AUTH_DEV_BYPASS: 'true',
    NODE_ENV: 'development',
  };

  const proc = spawn('npx', ['tsx', 'server/index.ts'], { env, stdio: ['ignore', 'pipe', 'inherit'] });

  // Wait for server to start
  await new Promise<void>((resolve, reject) => {
    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      if (text.includes('api.started') || text.includes('listening')) {
        resolve();
      }
    });
    proc.on('error', reject);
    setTimeout(resolve, 3000);
  });

  try {
    // Test 1: Providers endpoint for Kyiv
    console.log('\n--- 1. Testing GET /api/v1/mobility/providers for Kyiv ---');
    const provRes = await fetch(`http://127.0.0.1:${port}/api/v1/mobility/providers?lat=50.4501&lon=30.5234`, {
      headers: { 'x-dev-user-id': 'f0a35fb5-071f-4855-92f8-ace89a9b8b40' },
    });
    console.log(`Status: ${provRes.status}`);
    const provJson = await provRes.json();
    const availableTiles = provJson.data.filter((t: any) => t.providers.length > 0);
    console.log(`Tiles with active providers in Kyiv: ${availableTiles.length} of ${provJson.data.length}`);
    for (const t of availableTiles) {
      console.log(`  - [${t.transportType}] ${t.providers.map((p: any) => p.name).join(', ')}`);
    }

    // Test 2: Journey search endpoint in Kyiv (Obolon -> Railway Station)
    console.log('\n--- 2. Testing POST /api/v1/journeys/search in Kyiv ---');
    const searchRes = await fetch(`http://127.0.0.1:${port}/api/v1/journeys/search`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-dev-user-id': 'f0a35fb5-071f-4855-92f8-ace89a9b8b40',
      },
      body: JSON.stringify({
        origin: { name: 'ст. м. Оболонь', coordinates: [30.498, 50.501] },
        destination: { name: 'ст. м. Вокзальна', coordinates: [30.488, 50.441] },
        departureAt: new Date(Date.now() + 3600_000).toISOString(),
        passengers: 1,
        strategy: 'BALANCED',
        preferences: {
          allowPublicTransport: true,
          allowTaxi: true,
          allowedTransportTypes: ['metro', 'taxi', 'scooter', 'bike'],
        },
      }),
    });

    console.log(`Status: ${searchRes.status}`);
    const searchJson = await searchRes.json();
    if (searchJson.data) {
      console.log(`Found ${searchJson.data.journeys.length} saved journeys!`);
      console.log(`Blocked providers:`, searchJson.data.blockedProviders);
      console.log(`Unsupported preferences:`, searchJson.data.unsupportedPreferences);

      for (const [idx, j] of searchJson.data.journeys.entries()) {
        console.log(`\nJourney ${idx + 1} (ID: ${j.id}, Strategy: ${j.strategy}):`);
        console.log(`  Duration: ${Math.round(j.totalDurationSeconds / 60)} min | Price: ${j.totalPriceMinor ? j.totalPriceMinor / 100 + ' ₴' : 'N/A'}`);
        console.log(`  Legs (${j.legs.length}):`);
        for (const leg of j.legs) {
          console.log(`    - [${leg.mode}] ${leg.origin.name} → ${leg.destination.name} (${Math.round(leg.durationSeconds / 60)} min, ${leg.priceMinor ? leg.priceMinor / 100 + ' ₴' : '0 ₴'}) [${leg.providerName || leg.source}]`);
        }
      }
    } else {
      console.error('Error response:', searchJson);
    }
  } finally {
    proc.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
