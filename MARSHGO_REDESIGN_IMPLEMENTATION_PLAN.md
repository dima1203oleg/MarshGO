# MARSHGO — Redesign implementation plan

2026-11-14 · design direction «Лінія подорожі» · **NOT_RELEASED**.

Це executable handoff, не звіт про виконану реалізацію. Зміни UI дозволені тільки після збереження всіх7документів і проходження preflight відповідного batch. Реалізація має початися автоматично без нового погодження дизайну, **але не обходити відсутній browser auth, Git overlap або resource gate**.

## 0. Preflight / поточний blocker

- Canonical live: `https://marshgo-dima.shares.zrok.io`, `127.0.0.1:7777`, чинний PID4613, source `/Users/dima1203/.qoder/worktrees/app/330dd3/MarshGO-Site`.
- Нічого не стартувати на3000/4173/інших портах. Не перезапускати Vite/zrok. HMR уже є.
- Зараз браузер після aborted refresh →401 показує login. Захищені екрани неможливо перевіряти. **UI batch заблокований до ручного повторного входу у тому самому Qoder браузері.** Пароль/токени/куки не читати, не ін'єктувати і не обходити guard.
- Site baseline `b58cad91eddabbf89f016d438d446d36f169df87` + dirty. Source audit:46tracked files +1705/−532 і додаткові untracked. HEAD не дорівнює source snapshot.
- Перед кожним batch: свіжі status, branch, SHA, diff і current listener/cwd. Не overwrite чужу правку. Sensory/magnetic/ownership helpers уже існують, частина untracked; не створювати дублікати.
- Публічні PR142/143 уже створювалися попереднім етапом; self-containment143 не підтверджено. Не оголошувати CI/commit green за dirty-tree тестами. Повторний PR без потреби не створювати.
- Resource check: memory_pressure, swap, disk/CPU. Останній вимір27%free, swap9176MiB, disk20GiB — YELLOW; нові важкі процеси не запускати паралельно з browser.

Preflight done = authenticated UI recovered, relevant diff reviewed, no same-file overlap, exact tests selected, before screenshot state matched. Коли умови виконано, продовжити batch1 без повторного запиту дизайнерського рішення.

## 1. Межа змін

**Пишемо:** тільки canonical Site UI/styles/pure UI-state tests,7design docs і чесні checkpoint updates у поточному orchestration worktree.

**Не пишемо:** root legacy src, protected main/codex, Server routing/providers/migrations, iOS bundled assets до Web acceptance, Admin/Partner логіку, auth settings/credentials, zrok/proxy/CI settings, canonical reference image checksums.

**Не робимо у live audit:** реальні публікації, бронювання, повідомлення, блокування, видалення, boarding/finish без окремого належного test context. Фікстури дозволені лише у явно позначених test cases, не як «жива» демонстрація.

## 2. Послідовні batches

### B1 — Token foundation і базові стани

Файли: `src/index.css`, `src/styles/motion.css`, `src/design-system/ui/StatusBadge.tsx`, наявні shared controls за необхідності.

- Впровадити palette/type/spacing contracts із DESIGN_SYSTEM; зберегти token names і повний hsl color format.
- Привести mode tokens до light/dark palette; перевірити route scoped surface remap окремо.
- Узгодити durations/ідентичні fallback values. Не blanket replace literal colors у всьому repo.
- Functional border/focus/pressed/disabled відрізняються. Input16px, metadata≥12px,44targets.
- Навмисна зміна monochrome contract: перечитати `navy-monochrome-theme.test.ts`; оновлювати лише assertions, що прямо superseded новою затвердженою palette specification. Зберегти dark/surface та token parity checks; не видаляти suite.

Тести: `design-token-theme-parity`, `transport-color-token-parity`, `transport-mode-registry`, `map-theme-styles`, `home-fit-and-profile-ink`, relevant monochrome/canonical assertions. Gate: Search/Home/Route/Profile обидві теми, жодних contrast/overflow regressions.

### B2 — Global navigation і Home

Файли: `src/views/ProductionMarketplace.tsx` bottom-nav/create sections, `src/views/HomeHero.tsx`, `src/views/mapAwareBottomNavigation.ts`, `src/views/map-aware-bottom-navigation.css` якщо потрібно.

- Зберегти5пунктів; + пропонує driver offer/passenger demand; utility links лишаються в Home.
- Home4square actions2×2; не зменшувати їх для short-screen fit.
- MarshPass promo про підтверджену попутку, а не всі види міського транспорту. Domain eligibility не міняти.
- Safe-area reservation виміряна фактично, не довільний padding.

Тести: `home-marshpass`, `header-marshpass-redesign`, `global-bottom-navigation-inset`, `map-aware-bottom-navigation`, `canonical-design`. Gate:320/390/desktop light+dark, passenger/driver,0booking/eligiblebooking, no nav duplicates.

### B3 — Search та форми місць

Файли: Marketplace searchForm/searchScreen, `components/TransportTypesPanel.tsx`, `design-system/transport/transportModeRegistry.ts`, `index.css`; suggestions/DateTimePicker лише потрібні presentation changes.

- Compact heading і route spine, desktop2regions; no8+4 modes;4×3mobile гарантовано.
- Зберегти одну trailing action кожного поля,12unique SVG, independent selection, API request mapping.
- Field labels/time/passengers/budget hierarchy; no invented flexible dates; honest provider descriptors з фактичних полів.
- Shared field extraction тільки після доведеної parity origin/destination/publish handlers; не змішувати різні validation contracts.

Тести: `transport-types-panel`, `transport-preferences`, `transport-availability-presentation`, `home-fit-and-profile-ink`, `canonical-design`. Gate:7viewport×2theme; actual search→results, empty/invalid/long input, keyboard suggestions, all/none, swaps and clear.

### B4 — Results / route ribbon / card hierarchy

Файли: `views/JourneyResultsPanel.tsx`, `design-system/journey/CanonicalRouteLip.tsx`, `JourneySegmentStrip.tsx`, `SavedJourneyCard.tsx`, existing result presentation helpers.

- Reuse strip/summary, не створювати alternate result model.
- Preserve3strategies, route order, fare provenance, accessibility/availability.
- Одна open-route action; unknown amounts stay unknown. Source/probe price mismatch розслідувати окремо, не cosmetic patch.
- Many-legs/long-label behavior має бути явно видимим і accessible.

Gate: actual results (не saved-only),3strategies, map selection, same route/fare consistency, keyboard, low/no-data states. Test additions виконують formatter/state logic; regex-only assertions не достатні.

### B5 — Route map, sheet і shared modal behavior

Файли: `JourneyRouteMapScreen.tsx`, `map/routeCameraController.ts`, `components/MapInteractionControls.tsx`, `MapLayersControl.tsx`, `MapPointPicker.tsx`.

- Preserve existing4detents/single map; зменшити duplicate metadata/controls.
- Підтвердити detent/padding camera drift probe; лише тоді вирівняти frozen-half behavior.
- Topmost Escape, focus trap/restore/background inert; modal footer не перекритий global nav.
- map-picker async lookup cancellation, theme updates та reduced motion — точково без нового map implementation.

Тести: `route-camera-focus`, `canonical-map-interactions`, `camera-motion`, `journey-route-map-canonical-modes`, `navigation-sheet`. Gate: drag/expand/collapse, keyboard alternatives, layers,2D3D, close/back, point selection,320landscape,one canvas.

### B6 — Independent preview / camera ownership

Файли: `JourneyActiveNavigation.tsx:474–666,703–713`, `JourneyRouteMapScreen.tsx:1499–1538`, `FlightTelemetry.tsx`, `map/hyperFlightEngine.ts`, `map/MapLibreAdapter.ts`, `navigation/journeyCameraOwnership.ts`; один новий shared playback controller допускається за потреби extraction.

- Виконати MOTION_SPEC state machine.
- Preview не монтує безумовний GPS effect active navigation; не викликає startJourneyNavigation.
- Всі ручні camera commands interrupt, не лише drag. Один range; play/pause/seek/step.
- Existing distance-aware engine reuse, no fake geometry. Reduced-motion manual only.

Тести: `hyper-flight-engine`, `journey-camera-ownership`, `journey-active-navigation`, `camera-motion`, `route-camera-focus` + нові behavioral boundary tests (GPS/API/store spies=0 у preview). Gate:valid short/long100–500+км,deniedGPS,seekback,end,hidden tab,manual zoom/pan/pitch,one map/slider.

### B7 — Real navigation і data honesty

Файли: `JourneyActiveNavigation.tsx`, `ProductionNavigation.tsx`, `TransportMapView.tsx`, status formatter modules.

- GPS errors видимі незалежно від following; source type не змішується з preview.
- Null speed→—, pause→«Навігацію призупинено»; ambiguous quick destination requires confirmation.
- Actual outage/staleness видно звичайному користувачу; diagnostics details лишаються окремо.
- Невикористані lifecycle callbacks спочатку дослідити tests/server contract, не прив'язувати completion до animation.

Тести: `navigation-core`, `navigation-matching-consent`, `navigation-destination-name`, `transport-map-basemap-notice`, `transport-quality`, `offline-navigation-store`. Gate: real GPS/device integration окремо; fixtures не закривають live navigation.

### B8 — Trips, carpool, booking та MarshPass

Файли: Marketplace trips/offer/demand/booking branches, `bookingFailureState.ts`, `MarshPassTicket.tsx`, existing trip-management UI.

- Shared summary card, role-correct actions, scrollable confirmation dialog/name for Back.
- Transaction copy не стверджує reconciliation success до actual response; unknown outcome→checkTrips, без blind retry.
- Confirmed booking + refresh fail зберігає confirmed state; це не той самий випадок, що POST timeout.
- Kyiv date formatter у ticket, focus management, eligibility unchanged, QR authoritative.

Тести: `booking-failure-state`, `booking-result-refresh`, `home-marshpass`, `header-marshpass-redesign`. Gate: instrumented fixtures для timeout-after-commit та reconciliation failure з negative controls; live booking/boarding тільки у дозволеному test context.

### B9 — Profile, messages, remaining overlays

Файли: `ProfileSections.tsx`, Marketplace profile/chat/notification/verification/account overlays, existing component owners із SCREEN_MATRIX.

- Спільні headers/rows/status/spacing; тема й privacy зберігають behavior.
- Chat composer keyboard-safe, offline/reconnect honest; notifications no swallowed failures.
- Export/delete/safety/verification не переписувати, лише presentation/focus/errors.

Gate: all changed screens light/dark, passenger/driver,empty/error,keyboard; destructive submit не виконувати на реальних даних.

### B10 — Integration, performance, release evidence

- Source snapshot must be self-contained: relative imports tracked, no dependence on uncommitted helper. Review relevant dirty diff before staging.
- Повний typecheck/lint/tests один раз на integration checkpoint; canonical build/bundle gate у resource-safe window або CI без alternate dev server.
- Before/after same state, actual public zrok UI in Qoder; no console/network regression.
- Measure long tasks/frame distribution/map instance/memory; physical iOS і touch/VoiceOver окремий gate.
- Commit only scoped owned work, verify actual SHA and count. PR update only by applicable authorization; no merge/prod deployment.

## 3. Відомі доступні test entrypoints

Файли нижче реально знайдені у live Site2026-11-14; команди — **план**, у цьому redesign discovery вони не виконувалися.

```bash
npm exec -- tsx --test tests/transport-types-panel.test.ts tests/transport-mode-registry.test.ts tests/design-token-theme-parity.test.ts
npm exec -- tsx --test tests/hyper-flight-engine.test.ts tests/journey-camera-ownership.test.ts tests/journey-active-navigation.test.ts
npm exec -- tsx --test tests/booking-failure-state.test.ts tests/booking-result-refresh.test.ts tests/home-marshpass.test.ts
npm run typecheck
npm run lint:all
npm test
npm run build
npm run check:bundle
```

Запускати з live Site через tool working-directory в межах дозволеного workspace, не `cd` в original repository. Не запускати весь блок бездумно: лише tests affected batch, важкі tasks суворо послідовні. Full build не потрібен для кожного HMR редагування й не є підставою створити другий інтерфейс.

Для кожної команди зберігати SHA **і dirty diff identity**, actual pass/fail/skip, exit code,duration; старі869pass не переносяться на новий snapshot. Падіння не ховати, assertions/thresholds не послаблювати заради зеленого.

## 4. Evidence та rollback

- Перед batch зафіксувати вузький diff і before screenshot. Після — after у тій самій темі/viewport/route; дослідити DOM при сумнівному screenshot.
- Не перезаписувати canonical baselines; зміна нового стилю навмисна й описана цим пакетом.
- Збій batch: зупинити наступні edits; відновлювати тільки власний patch точковим reverse edit після fresh status. Не reset/clean/stashpop чужого дерева.
- Файли з autofill/QR/token/user PII не публікувати. Публічна evidence копія має безпечно приховані приватні дані без маскування UI-дефектів.
- NEXT_ACTIONS/CODEX_PROGRESS: actual state, not aspirational VERIFIED. Production лишається NOT_RELEASED до всіх gates та окремого deployment дозволу.

## 5. Поточний результат

Створено дослідницько-дизайнерський пакет; новий UI ще не внесено. **Наступна виконувана дія — відновити authorized Qoder session, пройти preflight, потім B1.** Це конкретний runtime blocker, не потреба нового творчого погодження і не привід підмінити реальний продукт демо.
