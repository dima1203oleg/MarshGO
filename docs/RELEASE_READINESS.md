# Release readiness

Status: **NOT_RELEASED**.

## Verified

- National API matrix executed end to end: 702 directions, 0 errors.
- 147/702 administrative directions return routes (baseline 124).
- Chain integrity: 18/18 audited corridors have time-monotonic legs, real transfer buffers and route geometry.
- Browser rendering: 31/40 corridors produce route cards in the real UI.
- Engine tests: `tests/gtfs-timetable.test.ts` 86/86, `tests/journey-search.test.ts` 6/6, `tsc --noEmit` clean.

## Blocking production

1. Six oblast centres (Житомир, Миколаїв, Херсон, Черкаси, Чернігів, Краматорськ) plus Crimea have no licensed feed. 396 of 702 directions touch them.
2. Kyiv metro is disabled: `gisserver.kyivcity.gov.ua` returns no response and `data.kyivcity.gov.ua` redirects without a data payload.
3. City GTFS for Рівне, Кам'янець-Подільський and Біла Церква are downloadable but carry no explicit commercial-use licence, so they stay out of journey search.
4. Taxi, carsharing and transfer integrations need partner contracts; no partner API is currently authorised.
5. Realtime is present only for a subset of city feeds; static schedules are used elsewhere and are labelled as scheduled, never as live.
