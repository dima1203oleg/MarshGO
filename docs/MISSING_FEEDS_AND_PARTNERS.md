# Missing feeds and partners

Everything below was probed on 2026-11-18 and cannot be produced from public sources.

## Oblast centres with no public feed

| Centre | Rail stop in ODbL feed | Nearest stop | Public GTFS | Blocker |
| --- | --- | --- | --- | --- |
| Житомир | no | Бердичів, 41.4 km | none found | licensed regional bus feed required |
| Миколаїв | no | Вознесенськ, 83.5 km | none found | licensed regional bus feed required |
| Херсон | no | Вознесенськ, 142.5 km | none found | licensed regional bus feed required; infrastructure constraints |
| Черкаси | no | Імені Тараса Шевченка, 29.4 km | none found | licensed regional bus feed required |
| Чернігів | no | Носівка, 69.2 km | none found | licensed regional bus feed required |
| Краматорськ | no | Синельникове І, 158.7 km | none found | active-hostility area; no verified service data |
| Сєвєродонецьк | no | Харків-Пасажирський, 202 km | none found | active-hostility area; no verified service data |
| Сімферополь, Севастополь | no | — | none found | no verified service data |

Sources checked: Mobility Database catalog (12 UA feeds), `data.gov.ua` CKAN, Dozor city endpoints, jbb GTFS mirrors, operator endpoints.

## Required partner access

| Capability | Partner type | Why it is blocked |
| --- | --- | --- |
| Regional intercity buses (Житомир, Черкаси, Чернігів, Миколаїв, Херсон) | bus operators / `inbus.ua`, `busportal.app` | no open GTFS; `inbus.ua` licence unverified, VD-Express publishes only 2 international routes |
| Taxi price/ETA | Uklon, Bolt | partner API contract required |
| Carsharing availability | Getmancar | partner API contract required |
| Transfer booking | transfer operators | partner API contract required |
| Kyiv metro | Kyivpastrans / KVK | GIS endpoints unreachable since probe; official open-data export required |
| Khmelnytskyi city GTFS | Dozor | `city.dozor.tech/khmelnytskyi/gtfs/static.zip` returns 404 on all known slugs |
