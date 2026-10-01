# Production acceptance report — 2026-10-01

## Local automated checks

| Gate | Result | Evidence |
|---|---|---|
| Umbrella typecheck + full lint + unit + production build + bundle budget | PASS | Latest local run: typecheck/lint pass; 74 unit passed, 1 opt-in integration skipped; production build and gzip budget passed |
| Server integration | PASS | `npm run test:integration`; 17/17 PostGIS/Redis/API checks, including route-corridor Rescue matching |
| Browser E2E | PASS | Production Site bundle; 6/6 Chromium tests across driver/passenger contexts, booking/cancel/rebook, persisted chat, route-match UI and geolocation reroute |
| Browser engine/viewport matrix | PASS | Chromium/Firefox/WebKit, each run exercised 375, 430, 768, 1024, 1440, and 1920 widths; 3/3 projects passed |
| Public staging browser smoke | PARTIAL / PASS for smoke | Headed Chromium OTP signup/login passed; 18 direct routes returned 200; 1440×900 and 390×844 captures had no overflow. No complete paired-user flow on public staging. |
| Standalone Site | PASS | full-source lint, typecheck, production Vite build |
| Standalone Server unit | PASS | full-source lint, typecheck; 46 pass, 1 opt-in integration skipped |
| GitHub CI | PASS | Umbrella code baseline `172cf0e`; Server PR #2 `54ed3c8`; Site PR #2 `20a7579`; iOS `main` `b8b1fcb` checks passed |
| iOS Simulator | PASS for build/launch/onboarding render only | `npm run ios:simulator` built Debug, installed and launched on iPhone 16 Pro Max Simulator using pinned Site code `20a7579`; screenshot `.release/staging-ios-simulator.png`; no authenticated/native-flow test |
| S3-compatible local contract | PASS | Adobe S3Mock 5.2.2; AWS SDK upload, HEAD and download succeeded; synthetic test object retained |
| Backup cipher | PASS | AES-256-GCM stream roundtrip; tamper rejected and no plaintext output exposed |
| Isolated PostGIS backup/restore drill | PASS | Encrypted dump of synthetic schema/data restored into a separate empty database; integrity row `1|authenticated backup restore drill` verified |
| Production Compose syntax | PASS | `docker compose ... config --quiet` with non-production example values |
| Canonical source container builds | PASS for image build only | Materialized Server `bdfdf24` and Site `c7f76a4` by exact manifest SHA; both production images built from standalone repo contexts |
| Staging / production / physical phone | BLOCKED_EXTERNAL | No host/domain/provider credentials or two-device acceptance environment |

Adobe S3Mock is a test service, not proof of private production storage policy or an approved object store. The restore drill used a separately named disposable Compose project and did not modify the existing developer DB. During local service setup, Docker Compose created the new test containers but left them in `Created`; explicit `docker start` was needed before the S3 and backup drills. This makes those individual drills valid, but means the one-command bootstrap/full-stack start is not yet rehearsed end to end. The initial iOS capture at five seconds was a premature blank/splash screenshot; the capture wait was raised and the later screenshot shows the onboarding screen.

## Product acceptance not complete

No full golden-path claim is made. Current E2E covers the implemented web slices but does not exercise registration through verification approval, full trip boarding/completion/review, true route-overlap marketplace completion, multi-passenger journey lifecycle, Journey delay/replan/Rescue, push, background GPS, or native camera on physical hardware. Deterministic geocoder/routing/map fixtures are limited to tests.

**PRODUCTION_READY = NO.** See [FINAL_PRODUCTION_GAP_AUDIT.md](FINAL_PRODUCTION_GAP_AUDIT.md) and [OWNER_ACTIONS_REQUIRED.md](OWNER_ACTIONS_REQUIRED.md).
