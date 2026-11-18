# Transport feed audit

Probe date 2026-11-18. A feed counts as integrated only when URL → response → parse → import → active trips → graph → API route → browser card all succeed.

## National and regional feeds

| Feed | Operator | Mode | Status | Evidence |
| --- | --- | --- | --- | --- |
| https://jbb.ghsq.de/gtfs/ua-ukrzaliznytsya.gtfs.zip | OSM community (ODbL) | rail | VERIFIED_ACTIVE | 167 stops, service 2026-09-04 → 2027-12-11, 147 directions routed |
| https://jbb.ghsq.de/gtfs/ua-kyiv.gtfs.zip | Київпастранс (CC BY 4.0) | bus/tram/trolleybus | VERIFIED_ACTIVE | 205 routes, 1824 stops, identical to the operator endpoint (1,416,208 bytes, version 20261118) |
| https://track.ua-gis.com/gtfs/lviv/static.zip | Львівавтодор (CC BY 4.0) | bus/tram | VERIFIED_ACTIVE | routes appear in Lviv itineraries |
| https://track.ua-gis.com/gtfs/uzhhorod/static.zip | Ужгородська міська рада (CC BY 4.0) | bus | VERIFIED_ACTIVE | routes appear in Uzhhorod itineraries |
| https://track.ua-gis.com/gtfs/stryi/static.zip | Стрийська міська рада (CC BY 4.0) | bus | VERIFIED_ACTIVE | routes appear in Stryi itineraries |
| https://city.dozor.tech/iv-frankivsk/gtfs/static.zip | Івано-Франківськ (CC BY 4.0) | bus/trolleybus | VERIFIED_ACTIVE | routes appear in Ivano-Frankivsk itineraries |
| https://city.dozor.tech/rivne/gtfs/static.zip | Рівне | bus | LICENSE_REQUIRED | 200, 161,991 bytes, no explicit commercial licence |
| https://city.dozor.tech/kamyanec/gtfs/static.zip | Кам'янець-Подільський | bus | LICENSE_REQUIRED | 200, 189,065 bytes, no explicit commercial licence |
| https://city.dozor.tech/bila-cerkva/gtfs/static.zip | Біла Церква | bus | LICENSE_REQUIRED | 200, 34,495 bytes, licence text is the platform name only |
| https://city.dozor.tech/khmelnytskyi/gtfs/static.zip | Хмельницький | bus | SOURCE_UNAVAILABLE | 404 on all known slugs |
| https://vdexpress.net/api/gtfs/feed | VD-Express / BusPortal | intercity bus | SOURCE_AVAILABLE | 2 international routes, 37 stops, service 2026-11-21 → 2027-02-16; no domestic coverage |
| https://gtfs.fsn1.your-objectstorage.com/feeds/gtfs.zip | inbus.ua | intercity bus | LICENSE_REQUIRED | 4.5 KB, single Харків–Київ route, 3 stops |
| https://gw.x24.digital/api/bu/gtfs/v1/download/static | КП «Бучатранссервіс» | bus | INTEGRATION_FAILED | 401 anonymously |
| https://gw.x24.digital/api/od-all/gtfs/v1/download/static | Одеса (область) | bus | INTEGRATION_FAILED | 401 anonymously |
| http://193.23.225.211:8002/export-gtfs-static | Київпастранс | bus/tram/trolleybus | VERIFIED_ACTIVE (duplicate) | byte-identical to the jbb mirror, so no second registration |
| https://malin.kiev.ua/transport/gtfs.zip | Малин (community) | bus | INTEGRATION_FAILED | 302 redirect to an HTML page, no archive |

## Metro sources

| Source | Status | Evidence |
| --- | --- | --- |
| gisserver.kyivcity.gov.ua MapServer 4/5/12/13/14/15 | SOURCE_UNAVAILABLE | curl returns http=000 (no response) |
| data.kyivcity.gov.ua metro/funicular resources | SOURCE_UNAVAILABLE | 302 redirect, zero-byte payload |
| Київ — метро (GeoJSON геометрія) | SOURCE_UNAVAILABLE | same host |

Metro remains disabled. No metro itinerary is fabricated.

## Shared mobility

| Source | Mode | Status |
| --- | --- | --- |
| Zelectra GBFS 3.0 (Київ) | scooter | VERIFIED_ACTIVE (availability only, no routing segment) |
| Nextbike GBFS (Івано-Франківськ, Київ, Львів, Одеса) | bike | VERIFIED_ACTIVE (availability only) |
| Bikenow, Getmancar, Uklon, Bolt | bike/carsharing/taxi | LICENSE_REQUIRED (partner API) |
