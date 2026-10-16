import type { Bbox } from './types';

export interface TransportCityProvider {
  name: string;
  city: string;
  source_type: string;
  license: string | null;
  source_ref: string | null;
  last_report: { bbox?: Bbox; counts?: Record<string, number> } | null;
}

const CITY_METADATA: Record<string, { id: string; timezone: string; sourceUrl: string }> = {
  Львів: { id: 'lviv', timezone: 'Europe/Kyiv', sourceUrl: 'https://opendata.city-adm.lviv.ua/en/dataset/lviv-public-transport-gtfs-real-time' },
  Київ: { id: 'kyiv', timezone: 'Europe/Kyiv', sourceUrl: 'https://data.gov.ua/dataset/96128887-4f36-4c19-a96e-5d4765fade16' },
  Вінниця: { id: 'vinnytsia', timezone: 'Europe/Kyiv', sourceUrl: 'https://data.gov.ua/dataset/vinnytsia-transport' },
  Дніпро: { id: 'dnipro', timezone: 'Europe/Kyiv', sourceUrl: 'https://data.gov.ua/dataset/dnipro-transport' },
  'Кривий Ріг': { id: 'kryvyi-rih', timezone: 'Europe/Kyiv', sourceUrl: 'https://krmisto.gov.ua' },
  Одеса: { id: 'odesa', timezone: 'Europe/Kyiv', sourceUrl: 'https://omr.gov.ua/ua/city/departments/dtks/open-data/' },
  Харків: { id: 'kharkiv', timezone: 'Europe/Kyiv', sourceUrl: 'https://data.gov.ua/dataset/kharkiv-transport' },
  Запоріжжя: { id: 'zaporizhzhia', timezone: 'Europe/Kyiv', sourceUrl: 'https://data.gov.ua/dataset/zaporizhzhia-transport' },
  Житомир: { id: 'zhytomyr', timezone: 'Europe/Kyiv', sourceUrl: 'https://city.dozor.tech/zhytomyr' },
  'Івано-Франківськ': { id: 'ivano-frankivsk', timezone: 'Europe/Kyiv', sourceUrl: 'https://city.dozor.tech/iv-frankivsk' },
  Ужгород: { id: 'uzhhorod', timezone: 'Europe/Kyiv', sourceUrl: 'https://city.dozor.tech/uzhgorod' },
  Полтава: { id: 'poltava', timezone: 'Europe/Kyiv', sourceUrl: 'https://public.easyway.info' },
  Рівне: { id: 'rivne', timezone: 'Europe/Kyiv', sourceUrl: 'https://city.dozor.tech/rivne' },
  Суми: { id: 'sumy', timezone: 'Europe/Kyiv', sourceUrl: 'https://data.gov.ua/dataset/sumy-transport' },
  Тернопіль: { id: 'ternopil', timezone: 'Europe/Kyiv', sourceUrl: 'https://data.gov.ua/dataset/ternopil-transport' },
  Хмельницький: { id: 'khmelnytskyi', timezone: 'Europe/Kyiv', sourceUrl: 'https://city.dozor.tech/ua/khmelnyckyi' },
  Черкаси: { id: 'cherkasy', timezone: 'Europe/Kyiv', sourceUrl: 'https://city.dozor.tech/cherkasy' },
  Чернівці: { id: 'chernivtsi', timezone: 'Europe/Kyiv', sourceUrl: 'https://data.gov.ua/dataset/chernivtsi-transport' },
  Чернігів: { id: 'chernihiv', timezone: 'Europe/Kyiv', sourceUrl: 'https://city.dozor.tech/chernihiv' },
  Луцьк: { id: 'lutsk', timezone: 'Europe/Kyiv', sourceUrl: 'https://data.gov.ua/dataset/lutsk-transport' },
  Миколаїв: { id: 'mykolaiv', timezone: 'Europe/Kyiv', sourceUrl: 'https://data.gov.ua/dataset/mykolaiv-transport' },
  Кропивницький: { id: 'kropyvnytskyi', timezone: 'Europe/Kyiv', sourceUrl: 'https://data.gov.ua/dataset/kropyvnytskyi-transport' },
  'Біла Церква': { id: 'bila-tserkva', timezone: 'Europe/Kyiv', sourceUrl: 'https://city.dozor.tech/bila-cerkva' },
  'Кам’янець-Подільський': { id: 'kamianets-podilskyi', timezone: 'Europe/Kyiv', sourceUrl: 'https://city.dozor.tech/kamyanec' },
  Олександрія: { id: 'oleksandriia', timezone: 'Europe/Kyiv', sourceUrl: 'https://city.dozor.tech/oleksandriya' },
  Конотоп: { id: 'konotop', timezone: 'Europe/Kyiv', sourceUrl: 'https://public.easyway.info/gps/konotop.json' },
  Червоноград: { id: 'chervonohrad', timezone: 'Europe/Kyiv', sourceUrl: 'https://public.easyway.info/gps/chervonograd.json' },
  Стрий: { id: 'stryi', timezone: 'Europe/Kyiv', sourceUrl: 'https://track.ua-gis.com/gtfs/stryi/static.zip' },
  Кременчук: { id: 'kremenchuk', timezone: 'Europe/Kyiv', sourceUrl: 'https://data.gov.ua/dataset/kremenchuk-transport' },
};

function cityId(name: string): string {
  return (CITY_METADATA[name]?.id ?? name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) || 'unknown';
}

export function buildTransportCities(providers: TransportCityProvider[]) {
  const cities = new Map<string, {
    id: string; name: string; timezone: string; bbox: Bbox | null; modes: Set<string>;
    routeCount: number; stopCount: number; providers: Map<string, { name: string; sourceType: string; license: string | null; sourceRef: string | null }>;
    realtimeAvailable: boolean;
  }>();

  for (const provider of providers) {
    const meta = CITY_METADATA[provider.city];
    const id = cityId(provider.city);
    const city = cities.get(id) ?? {
      id, name: provider.city, timezone: meta?.timezone ?? 'Europe/Kyiv', bbox: null, modes: new Set<string>(),
      routeCount: 0, stopCount: 0, providers: new Map(), realtimeAvailable: false,
    };
    const report = provider.last_report;
    const bbox = report?.bbox;
    if (bbox) city.bbox = city.bbox ? [Math.min(city.bbox[0], bbox[0]), Math.min(city.bbox[1], bbox[1]), Math.max(city.bbox[2], bbox[2]), Math.max(city.bbox[3], bbox[3])] : [...bbox];
    if (provider.source_type === 'gtfs' || provider.source_type === 'geojson') {
      city.routeCount += report?.counts?.routes ?? Object.entries(report?.counts ?? {}).filter(([key]) => key.startsWith('routes_')).reduce((sum, [, count]) => sum + count, 0);
      city.stopCount += report?.counts?.stops ?? Object.entries(report?.counts ?? {}).filter(([key]) => key.startsWith('stops_')).reduce((sum, [, count]) => sum + count, 0);
      for (const [key, count] of Object.entries(report?.counts ?? {})) {
        const match = /^routes_(bus|marshrutka|trolleybus|tram|metro|train|suburban|city_train|funicular|ferry)$/.exec(key);
        if (match && count > 0) city.modes.add(match[1]);
      }
    }
    if (provider.source_type === 'gtfs_rt') city.realtimeAvailable = true;
    city.providers.set(`${provider.name}:${provider.source_type}`, {
      name: provider.name.split(' — ')[0], sourceType: provider.source_type, license: provider.license, sourceRef: provider.source_ref,
    });
    cities.set(id, city);
  }

  return [...cities.values()].filter((city) => city.bbox).map((city) => ({
    id: city.id, name: city.name, timezone: city.timezone, bbox: city.bbox, modes: [...city.modes].sort(),
    routeCount: city.routeCount, stopCount: city.stopCount, realtimeAvailable: city.realtimeAvailable,
    sourceUrl: CITY_METADATA[city.name]?.sourceUrl ?? null, licenses: [...new Set([...city.providers.values()].map((provider) => provider.license).filter((license): license is string => Boolean(license)))], providers: [...city.providers.values()],
  })).sort((a, b) => a.name.localeCompare(b.name, 'uk'));
}
