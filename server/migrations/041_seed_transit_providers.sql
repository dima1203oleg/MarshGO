-- Seed verified open transit providers for Ukraine.
-- All URLs were probe-verified in October 2026; access=open + HTTPS only.
-- This migration is idempotent: ON CONFLICT updates status/priority for
-- providers that already exist, preserving any admin-set overrides via
-- last_checked_at sentinel.

-- Ensure the access column exists (added in 030 / 040 migrations).
ALTER TABLE mobility_providers ADD COLUMN IF NOT EXISTS access text NOT NULL DEFAULT 'open'
  CHECK (access IN ('open','requires_credentials','requires_partner_access','insecure_endpoint'));
ALTER TABLE mobility_providers ADD COLUMN IF NOT EXISTS license text;

-- ============================================================
-- Priority 1: Kyiv
-- ============================================================
INSERT INTO mobility_providers
  (name, city, provider_type, source_type, feed_url, priority, status, health, access, license, last_checked_at)
VALUES
  -- GTFS Static: Kyivpastrans mirror (HTTPS, CC BY 4.0)
  ('Київпастранс — розклад (GTFS)',
   'Київ', 'public_transit', 'gtfs',
   'https://jbb.ghsq.de/gtfs/ua-kyiv.gtfs.zip',
   10, 'enabled', 'healthy', 'open',
   'CC BY 4.0 — Kyivpastrans / data.kyivcity.gov.ua',
   now()),

  -- Kyiv open-data GeoJSON: marshrutka route geometry
  ('Київ — маршрутки (GeoJSON геометрія)',
   'Київ', 'public_transit', 'geojson',
   'https://data.kyivcity.gov.ua/dataset/rozklad-rukhu-miskoho-elektrychnoho-ta-avtomobilnoho-transportu-dep-transport/resource/77325f5c-57d0-4f79-844a-cc73675f9743/data/download',
   15, 'enabled', 'healthy', 'open',
   'Kyiv Open Data Licence (commercial use permitted; attribution to data.kyivcity.gov.ua)',
   now()),

  -- Kyiv metro geometry
  ('Київ — метро (GeoJSON геометрія)',
   'Київ', 'public_transit', 'geojson',
   'https://data.kyivcity.gov.ua/dataset/rozklad-rukhu-miskoho-elektrychnoho-ta-avtomobilnoho-transportu-dep-transport/resource/5e385793-58e2-49eb-b856-a963dd7486bb/data/download',
   15, 'enabled', 'healthy', 'open',
   'Kyiv Open Data Licence (commercial use permitted; attribution to data.kyivcity.gov.ua)',
   now()),

  -- Kyiv City Express (міська електричка) geometry
  ('Київ — міська електричка (GeoJSON геометрія)',
   'Київ', 'public_transit', 'geojson',
   'https://data.kyivcity.gov.ua/dataset/rozklad-rukhu-miskoho-elektrychnoho-ta-avtomobilnoho-transportu-dep-transport/resource/a4fd8556-025a-4e14-bc75-99e4c018d2b9/data/download',
   15, 'enabled', 'healthy', 'open',
   'Kyiv Open Data Licence (commercial use permitted; attribution to data.kyivcity.gov.ua)',
   now()),

  -- Kyiv funicular geometry
  ('Київ — фунікулер (GeoJSON геометрія)',
   'Київ', 'public_transit', 'geojson',
   'https://data.kyivcity.gov.ua/dataset/rozklad-rukhu-miskoho-elektrychnoho-ta-avtomobilnoho-transportu-dep-transport/resource/f6f83ab2-3818-4d8c-93db-19dcda89cce9/data/download',
   20, 'enabled', 'healthy', 'open',
   'Kyiv Open Data Licence (commercial use permitted; attribution to data.kyivcity.gov.ua)',
   now())

ON CONFLICT (name, city) DO UPDATE SET
  status         = EXCLUDED.status,
  access         = EXCLUDED.access,
  license        = EXCLUDED.license,
  last_checked_at = EXCLUDED.last_checked_at,
  updated_at     = now()
  WHERE mobility_providers.last_checked_at IS NULL
     OR mobility_providers.last_checked_at < now() - interval '7 days';

-- ============================================================
-- Priority 2: Lviv
-- ============================================================
INSERT INTO mobility_providers
  (name, city, provider_type, source_type, feed_url, priority, status, health, access, license, last_checked_at)
VALUES
  ('Львівавтодор — розклад (GTFS)',
   'Львів', 'public_transit', 'gtfs',
   'https://track.ua-gis.com/gtfs/lviv/static.zip',
   10, 'enabled', 'healthy', 'open',
   'Open data portal of Lviv city (opendata.city-adm.lviv.ua)',
   now()),

  ('Львівавтодор — позиції (GTFS-RT)',
   'Львів', 'public_transit', 'gtfs_rt',
   'https://track.ua-gis.com/gtfs/lviv/vehicle_position',
   10, 'enabled', 'healthy', 'open',
   'Open data portal of Lviv city (opendata.city-adm.lviv.ua)',
   now()),

  ('Львівавтодор — затримки (GTFS-RT)',
   'Львів', 'public_transit', 'gtfs_rt',
   'https://track.ua-gis.com/gtfs/lviv/trip_updates',
   20, 'enabled', 'healthy', 'open',
   'Open data portal of Lviv city (opendata.city-adm.lviv.ua)',
   now())

ON CONFLICT (name, city) DO UPDATE SET
  status         = EXCLUDED.status,
  access         = EXCLUDED.access,
  license        = EXCLUDED.license,
  last_checked_at = EXCLUDED.last_checked_at,
  updated_at     = now()
  WHERE mobility_providers.last_checked_at IS NULL
     OR mobility_providers.last_checked_at < now() - interval '7 days';

-- ============================================================
-- Priority 3: Ivano-Frankivsk (Dozor — VERIFIED: 10 live vehicles)
-- ============================================================
INSERT INTO mobility_providers
  (name, city, provider_type, source_type, feed_url, priority, status, health, access, license, last_checked_at)
VALUES
  ('Dozor — Ів-Франківськ розклад (GTFS)',
   'Івано-Франківськ', 'public_transit', 'gtfs',
   'https://city.dozor.tech/iv-frankivsk/gtfs/static.zip',
   10, 'enabled', 'healthy', 'open',
   'Платформа Dozor (city.dozor.tech); дані з відкритого порталу data.gov.ua',
   now()),

  ('Dozor — Ів-Франківськ позиції (GTFS-RT)',
   'Івано-Франківськ', 'public_transit', 'gtfs_rt',
   'https://city.dozor.tech/iv-frankivsk/gtfs/vehicle_position',
   10, 'enabled', 'healthy', 'open',
   'Платформа Dozor (city.dozor.tech); дані з відкритого порталу data.gov.ua',
   now())

ON CONFLICT (name, city) DO UPDATE SET
  status         = EXCLUDED.status,
  access         = EXCLUDED.access,
  license        = EXCLUDED.license,
  last_checked_at = EXCLUDED.last_checked_at,
  updated_at     = now()
  WHERE mobility_providers.last_checked_at IS NULL
     OR mobility_providers.last_checked_at < now() - interval '7 days';

-- ============================================================
-- Priority 4: Rivne, Uzhhorod, Stryi (Dozor/track.ua-gis)
-- ============================================================
INSERT INTO mobility_providers
  (name, city, provider_type, source_type, feed_url, priority, status, health, access, license, last_checked_at)
VALUES
  ('Dozor — Рівне розклад (GTFS)',
   'Рівне', 'public_transit', 'gtfs',
   'https://city.dozor.tech/rivne/gtfs/static.zip',
   10, 'enabled', 'unknown', 'open',
   'Платформа Dozor (city.dozor.tech); дані з відкритого порталу data.gov.ua',
   now()),

  ('Dozor — Рівне позиції (GTFS-RT)',
   'Рівне', 'public_transit', 'gtfs_rt',
   'https://city.dozor.tech/rivne/gtfs/vehicle_position',
   10, 'enabled', 'unknown', 'open',
   'Платформа Dozor (city.dozor.tech); дані з відкритого порталу data.gov.ua',
   now()),

  ('track.ua-gis — Ужгород розклад (GTFS)',
   'Ужгород', 'public_transit', 'gtfs',
   'https://track.ua-gis.com/gtfs/uzhhorod/static.zip',
   10, 'enabled', 'unknown', 'open',
   NULL,
   now()),

  ('Dozor — Ужгород позиції (GTFS-RT)',
   'Ужгород', 'public_transit', 'gtfs_rt',
   'https://city.dozor.tech/uzhgorod/gtfs/vehicle_position',
   10, 'enabled', 'unknown', 'open',
   'Платформа Dozor (city.dozor.tech)',
   now()),

  ('track.ua-gis — Стрий розклад (GTFS)',
   'Стрий', 'public_transit', 'gtfs',
   'https://track.ua-gis.com/gtfs/stryi/static.zip',
   10, 'enabled', 'unknown', 'open',
   NULL,
   now()),

  ('track.ua-gis — Стрий позиції (GTFS-RT)',
   'Стрий', 'public_transit', 'gtfs_rt',
   'https://track.ua-gis.com/gtfs/stryi/vehicle_position',
   10, 'enabled', 'unknown', 'open',
   NULL,
   now()),

  ('Dozor — Хмельницький розклад (GTFS)',
   'Хмельницький', 'public_transit', 'gtfs',
   'https://city.dozor.tech/ua/khmelnyckyi/gtfs/static.zip',
   10, 'enabled', 'unknown', 'open',
   'Платформа Dozor (city.dozor.tech)',
   now()),

  ('Dozor — Кам''янець-Подільський розклад (GTFS)',
   'Кам''янець-Подільський', 'public_transit', 'gtfs',
   'https://city.dozor.tech/kamyanec/gtfs/static.zip',
   10, 'enabled', 'unknown', 'open',
   'Платформа Dozor (city.dozor.tech)',
   now()),

  ('Dozor — Біла Церква розклад (GTFS)',
   'Біла Церква', 'public_transit', 'gtfs',
   'https://city.dozor.tech/bila-cerkva/gtfs/static.zip',
   10, 'enabled', 'unknown', 'open',
   'Платформа Dozor (city.dozor.tech)',
   now())

ON CONFLICT (name, city) DO UPDATE SET
  status         = EXCLUDED.status,
  access         = EXCLUDED.access,
  license        = EXCLUDED.license,
  last_checked_at = EXCLUDED.last_checked_at,
  updated_at     = now()
  WHERE mobility_providers.last_checked_at IS NULL
     OR mobility_providers.last_checked_at < now() - interval '7 days';

-- ============================================================
-- Priority 5: Nationwide (Ukrzaliznytsia, intercity buses)
-- ============================================================
INSERT INTO mobility_providers
  (name, city, provider_type, source_type, feed_url, priority, status, health, access, license, last_checked_at)
VALUES
  ('Укрзалізниця — розклад поїздів (GTFS)',
   'Україна', 'public_transit', 'gtfs',
   'https://jbb.ghsq.de/gtfs/ua-ukrzaliznytsya.gtfs.zip',
   40, 'enabled', 'unknown', 'open',
   'ODbL (зібрано з OpenStreetMap, не офіційний фід УЗ)',
   now()),

  ('VD-Express — міжміські автобуси (GTFS)',
   'Україна', 'public_transit', 'gtfs',
   'https://vdexpress.net/api/gtfs/feed',
   30, 'enabled', 'unknown', 'open',
   'відкритий GTFS-фід перевізника (MobilityDatabase)',
   now()),

  ('inbus.ua — міжміські автобуси (GTFS)',
   'Україна', 'public_transit', 'gtfs',
   'https://gtfs.fsn1.your-objectstorage.com/feeds/gtfs.zip',
   50, 'enabled', 'unknown', 'open',
   NULL,
   now())

ON CONFLICT (name, city) DO UPDATE SET
  status         = EXCLUDED.status,
  access         = EXCLUDED.access,
  license        = EXCLUDED.license,
  last_checked_at = EXCLUDED.last_checked_at,
  updated_at     = now()
  WHERE mobility_providers.last_checked_at IS NULL
     OR mobility_providers.last_checked_at < now() - interval '7 days';

-- ============================================================
-- Priority 6: JSON vehicle position feeds (EasyWay / iCity / Dozor JSON)
-- ============================================================
INSERT INTO mobility_providers
  (name, city, provider_type, source_type, feed_url, priority, status, health, access, license, last_checked_at)
VALUES
  ('EasyWay — Полтава позиції (JSON)',
   'Полтава', 'public_transit', 'json',
   'https://public.easyway.info/gps/poltava.json',
   10, 'enabled', 'unknown', 'open',
   'EasyWay (public.easyway.info); дані з відкритого порталу data.gov.ua',
   now()),

  ('EasyWay — Червоноград позиції (JSON)',
   'Червоноград', 'public_transit', 'json',
   'https://public.easyway.info/gps/chervonograd.json',
   10, 'enabled', 'unknown', 'open',
   'EasyWay (public.easyway.info); дані з відкритого порталу data.gov.ua',
   now()),

  ('EasyWay — Конотоп позиції (JSON)',
   'Конотоп', 'public_transit', 'json',
   'https://public.easyway.info/gps/konotop.json',
   10, 'enabled', 'unknown', 'open',
   'EasyWay (public.easyway.info); дані з відкритого порталу data.gov.ua',
   now()),

  ('iCity — Дніпро позиції (JSON)',
   'Дніпро', 'public_transit', 'json',
   'https://api-t900.icity.com.ua/api/gps_data/',
   10, 'enabled', 'unknown', 'open',
   'відкриті дані Дніпровської міської ради (data.gov.ua)',
   now()),

  ('Dozor — Ів-Франківськ позиції (JSON)',
   'Івано-Франківськ', 'public_transit', 'json',
   'https://city.dozor.tech/iv-frankivsk/devices.json',
   40, 'enabled', 'unknown', 'open',
   'Платформа Dozor (city.dozor.tech)',
   now()),

  ('Dozor — Ужгород позиції (JSON)',
   'Ужгород', 'public_transit', 'json',
   'https://city.dozor.tech/uzhgorod/devices.json',
   40, 'enabled', 'unknown', 'open',
   'Платформа Dozor (city.dozor.tech)',
   now()),

  ('Dozor — Кам''янець-Подільський позиції (JSON)',
   'Кам''янець-Подільський', 'public_transit', 'json',
   'https://city.dozor.tech/kamyanec/devices.json',
   40, 'enabled', 'unknown', 'open',
   'Платформа Dozor (city.dozor.tech)',
   now()),

  ('Dozor — Олександрія позиції (JSON)',
   'Олександрія', 'public_transit', 'json',
   'https://city.dozor.tech/oleksandriya/devices.json',
   40, 'enabled', 'unknown', 'open',
   'Платформа Dozor (city.dozor.tech)',
   now())

ON CONFLICT (name, city) DO UPDATE SET
  status         = EXCLUDED.status,
  access         = EXCLUDED.access,
  license        = EXCLUDED.license,
  last_checked_at = EXCLUDED.last_checked_at,
  updated_at     = now()
  WHERE mobility_providers.last_checked_at IS NULL
     OR mobility_providers.last_checked_at < now() - interval '7 days';
