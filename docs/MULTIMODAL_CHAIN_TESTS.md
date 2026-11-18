# Multimodal chain tests

Every corridor below was queried against the canonical Server on 2026-11-20 08:00 +02:00 and every returned journey was re-walked segment by segment.

Checks applied to each journey:
1. every leg departs before it arrives;
2. every transfer departs at or after the previous leg arrives (no physically impossible connection);
3. every transit leg carries route geometry;
4. the journey references a provider.

| Corridor | Journeys | Modes present | Max transfers | Multi-leg journeys | Findings |
| --- | --- | --- | --- | --- | --- |
| Київ → Львівська | 8 | BUS, RAIL, TRAM, WALK | 2 | 8 | none |
| Львівська → Київ | 8 | BUS, RAIL, TRAM, TROLLEYBUS, WALK | 2 | 8 | none |
| Київ → Запорізька | 7 | BUS, RAIL, WALK | 2 | 7 | none |
| Запорізька → Київ | 12 | BUS, RAIL, TROLLEYBUS, WALK | 3 | 12 | none |
| Київ → Чернівецька | 7 | BUS, RAIL, WALK | 2 | 7 | none |
| Львівська → Закарпатська | 8 | RAIL, TRAM, WALK | 2 | 8 | none |
| Харківська → Київ | 8 | BUS, RAIL, TROLLEYBUS, WALK | 4 | 8 | none |
| Київ → Харківська | 5 | BUS, RAIL, TROLLEYBUS, WALK | 3 | 5 | none |
| Дніпропетровська → Київ | 9 | BUS, RAIL, TROLLEYBUS, WALK | 2 | 9 | none |
| Одеська → Київ | 5 | BUS, RAIL, TROLLEYBUS, WALK | 2 | 5 | none |
| Івано-Франківська → Львівська | 8 | BUS, RAIL, TRAM, WALK | 2 | 8 | none |
| Київ → Тернопільська | 6 | BUS, RAIL, TROLLEYBUS, WALK | 2 | 6 | none |
| Київ → Полтавська | 4 | BUS, RAIL, WALK | 2 | 4 | none |
| Харківська → Одеська | 1 | RAIL, WALK | 0 | 1 | none |
| Київ → Рівненська | 7 | BUS, RAIL, WALK | 2 | 7 | none |
| Львівська → Чернівецька | 7 | RAIL, TRAM, WALK | 2 | 7 | none |
| Київ → Хмельницька | 7 | BUS, RAIL, TROLLEYBUS, WALK | 4 | 7 | none |
| Запорізька → Львівська | 10 | BUS, RAIL, TRAM, WALK | 2 | 10 | none |

Result: **18/18 corridors clean**, including 5-mode chains (walk → tram → rail → trolleybus → walk) and journeys with 3 transfers.
