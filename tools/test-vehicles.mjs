import fetch from 'node-fetch';

async function testVehicles() {
  const otpRes = await fetch('http://127.0.0.1:3002/api/v1/auth/otp/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+380501234567', displayName: 'Test User' })
  });
  const code = (await otpRes.json()).data.developmentCode;

  const verifyRes = await fetch('http://127.0.0.1:3002/api/v1/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+380501234567', code })
  });
  const token = (await verifyRes.json()).data.accessToken;

  const vehiclesRes = await fetch('http://127.0.0.1:3002/api/v1/transport/vehicles?bbox=22.0,44.0,40.0,52.0&types=bus,tram,trolleybus,subway', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const vehiclesData = await vehiclesRes.json();
  console.log('Response:', JSON.stringify(vehiclesData).slice(0, 1000));
}

testVehicles().catch(e => console.error(e));
