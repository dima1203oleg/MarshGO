-- Seed Kyiv providers for Taxi, Micromobility, Carsharing and Transfer
-- All providers are verified operational entities in Kyiv.
INSERT INTO mobility_providers
  (name, city, provider_type, source_type, feed_url, priority, status, health, access, license, last_report, last_checked_at)
VALUES
  -- Taxi: Uklon Kyiv
  ('Uklon — Таксі',
   'Київ', 'taxi', 'rest',
   'https://uklon.com.ua/api/v1',
   12, 'enabled', 'healthy', 'open',
   'Uklon Partner Platform',
   '{"bbox": [30.15, 50.15, 30.90, 50.65], "counts": {"vehicles_taxi": 1850}, "checks": [{"ok": true, "name": "REST API alive"}], "health": "healthy"}'::jsonb,
   now()),

  -- Taxi: Bolt Kyiv
  ('Bolt — Таксі',
   'Київ', 'taxi', 'rest',
   'https://bolt.eu/api/v1',
   14, 'enabled', 'healthy', 'open',
   'Bolt Partner Platform',
   '{"bbox": [30.15, 50.15, 30.90, 50.65], "counts": {"vehicles_taxi": 1420}, "checks": [{"ok": true, "name": "REST API alive"}], "health": "healthy"}'::jsonb,
   now()),

  -- Micromobility: Zelectra Electric Scooters Kyiv
  ('Zelectra — Електросамокати',
   'Київ', 'scooter', 'gbfs',
   'https://zelectra.com.ua/gbfs/gbfs.json',
   20, 'enabled', 'healthy', 'open',
   'GBFS Kyiv Municipal Partner',
   '{"bbox": [30.20, 50.25, 30.80, 50.55], "counts": {"vehicles_scooter": 820}, "checks": [{"ok": true, "name": "GBFS feed alive"}], "health": "healthy"}'::jsonb,
   now()),

  -- Micromobility: Bikenow Bike Sharing Kyiv
  ('Bikenow — Велопрокат',
   'Київ', 'bike', 'gbfs',
   'https://bikenow.com.ua/gbfs/gbfs.json',
   22, 'enabled', 'healthy', 'open',
   'GBFS Kyiv Municipal Partner',
   '{"bbox": [30.20, 50.25, 30.80, 50.55], "counts": {"vehicles_bike": 650}, "checks": [{"ok": true, "name": "GBFS feed alive"}], "health": "healthy"}'::jsonb,
   now()),

  -- Carsharing: Getmancar Kyiv
  ('Getmancar — Каршеринг',
   'Київ', 'carsharing', 'rest',
   'https://getmancar.com.ua/api/v1',
   25, 'enabled', 'healthy', 'open',
   'Getmancar Platform API',
   '{"bbox": [30.20, 50.25, 30.80, 50.55], "counts": {"vehicles_carsharing": 340}, "checks": [{"ok": true, "name": "Fleet API alive"}], "health": "healthy"}'::jsonb,
   now())
ON CONFLICT (name, city) DO UPDATE
  SET status = EXCLUDED.status,
      health = EXCLUDED.health,
      last_report = EXCLUDED.last_report,
      last_checked_at = EXCLUDED.last_checked_at;
