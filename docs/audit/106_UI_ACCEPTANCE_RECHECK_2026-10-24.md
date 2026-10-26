# UI acceptance recheck — 2026-10-24

## Scope and exact sources

- Browser UI served from the locally built Site candidate at `/Users/dima1203/Desktop/MarshGO-Site-final-rc-20261024`, branch `codex/map-layers-reference-layout-20261024`. Changes below are committed as `5a96e85630428c2ffc15dfe67308334eda9d7398`, parent `d7fc931d80e76663b5dc24929f7b323651fbbffa`; candidate working tree is clean. Pushed to the existing [PR #22](https://github.com/dima1203oleg/MarshGO-Site/pull/22). Both GitHub `verify` jobs passed (runs `40119406496`, `40119409597`).
- Browser fixture API is the pinned Server source SHA `134ed017828a020e1d5f696b3cb9ea95527bb093` in the isolated local E2E environment. This is a mixed candidate/fixture run, not a release manifest tuple or live environment.
- Root orchestrator HEAD: `566a17e5c584efd4d68a97b381aabc068c87cf5c`; root tree already had extensive unrelated modifications. No reset, clean, deploy, or container/volume deletion was performed.

## UI changes under test

- Segment focus now retains the itinerary geometries and dims non-selected legs; tests assert selection, context, and overview restoration.
- The confirmed rendezvous map can expand full-screen, overlays the global tab bar, respects safe areas, and exposes its current approach/arrived/stop-sharing actions within the expanded view.
- Transport category accessibility labels now match visible singular labels.

## Evidence

- Candidate Site: `npm run typecheck`, `npm run lint`, `npm test -- --run`: PASS; unit tests **103/103**. Candidate production build had passed earlier in this work session.
- Orchestrator root `npm run check:production`: typecheck, lint, **256 PASS / 0 FAIL / 1 opt-in SKIP**, production build, and all 51 JS chunks within the configured gzip budget: PASS.
- Full local browser E2E on the candidate Site build plus pinned Server fixture, `E2E_SKIP_VISUAL=1`: **20/20 PASS**. Covered route search, selection, route map, categories, sign-in entry, two-account search/booking/demand/chat, driver GPS deviation/reroute, navigation recovery, URL restoration, and rendezvous consent/arrival/revocation.
- Route-map visual scenario: initial comparison found outdated light-layer snapshots. Manual inspection showed current grouped/icon layer controls agree more closely with the supplied reference than the old snapshot. Only `transport-map-layers-light-darwin.png` and `navigation-light-layers-darwin.png` were refreshed; the same visual scenario then passed **1/1 with screenshot comparison enabled and without snapshot updates**.
- Visible-control audit on the candidate browser build: **4/4 PASS**, **177** safe enabled controls clicked across the exercised main routes, no browser exceptions or unexpected HTTP 5xx. Fifteen heuristic no-visible-effect observations remain; selected/current controls, invalid empty forms, and navigation are among them. This is a broad sweep, not proof that every conditional, destructive, or role-protected action was exercised.
- Root ESLint for modified E2E specs and root `git diff --check`: PASS. Candidate `git diff --check`: PASS.

## Not established

- These are deterministic local fixtures, not provider-live GPS, licensed production map tiles, staging, or production smoke.
- All ten owner reference images were not exhaustively captured at matched screen/state; reference acceptance is incomplete.
- Authenticated Admin/Partner workflows, physical iPhone acceptance, production Safari/PWA acceptance, and live-provider acceptance are NOT_TESTED in this run.
- The candidate SHA is not in `RELEASE_MANIFEST.json`; no deployment was made. Keep `PRODUCTION_READY=false` and `RELEASE_STATUS=NOT_RELEASED`.

## Next exact actions

1. Review the candidate diff against the pinned Site SHA and applicable UX requirements; resolve any requirement conflict before integration.
2. Run authenticated Admin/Partner flows and conditional actions on an approved isolated environment; add test coverage for gaps rather than infer success from click counts.
3. Capture and compare each supplied reference against a matched viewport, theme, and UI state. Record accepted and mismatched states individually.
4. Continue staging/provider/device/release gates from the existing execution checkpoint; do not mark production released without the required external gates.
