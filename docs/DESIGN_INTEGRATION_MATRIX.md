# MARSHGO — інтеграція design reference

Зв’язаний technical plan: [PRODUCTION_INTEGRATION_PLAN.md](PRODUCTION_INTEGRATION_PLAN.md). Базовий аналіз: [PRODUCTION_READINESS_REVIEW_2026-09-30.md](PRODUCTION_READINESS_REVIEW_2026-09-30.md).

## Поточне впровадження (2026-09-30)

- Оновлено спільні mobile-first токени/поверхні, системний шрифт із SF Pro fallback на iOS, поля без WKWebView zoom, focus ring, safe-area таббар, зменшений рух і вузькі 320 px правила у `src/index.css`.
- Welcome використовує окремий український міський splash-artwork `public/images/welcome-kyiv-v1.jpg`; логотип, написи, CTA та OTP залишаються доступними HTML-компонентами.
- Home акцентує маршрутний пошук, а не вигаданий каталог транспортних пропозицій; способи без реального джерела позначаються як «Скоро».
- Journey result показує шкалу відправлення/прибуття, фактичні час/пересадки/ходьбу, водія, ціновий стан API та застереження, що план не є бронюванням.
- Ті самі frontend-файли перенесені у MarshGO-Site та iOS `web/`; Capacitor лишається спільним renderer.
- Simulator capture перевірено на iPhone 15 Pro Max та 16 Pro Max. WKWebView може видати білий перший кадр одразу після встановлення; повторний запуск дав повний welcome на обох розмірах.
- Це візуальний перший прохід, а не остаточний піксельний паритет усіх восьми дошок. Production navigation ще використовує Leaflet, тестові/непідключені постачальники залишаються поза UI як дійсні функції, а активні Journey/Driver/Rendezvous/Profile екрани потребують окремого екран-за-екраном visual QA після MapLibre та карти тайлів.

## 1. Візуальна основа, яку потрібно зберегти

Існуючий мобільний продукт вже має M-логотип, MARSHGO blue/navy/white палітру, світлі rounded surfaces, великі торкальні зони, safe-area, іконки Lucide, нижній tab bar, українську локалізацію та нативний Capacitor shell. У попередніх знімках iPhone 15 Pro Max/16 Pro Max Home компонується без обрізання, Navigation має окрему карту й нижню панель. Ці screenshots не доводять паритет із новими референсами, роботу справжніх vector tiles чи всі interaction states.

Поточний production stack задає Plus Jakarta Sans, а reference board вказує SF Pro. На Web слід вибрати системний Apple stack `-apple-system, BlinkMacSystemFont, "SF Pro Text", ...` із fallback Android/Windows sans-serif; не завантажувати/копіювати proprietary SF шрифти. Виміряти українські glyphs та цифри. Зробити дизайн-токени: primary blue, deep navy, semantic success/warning/error, surface/background/border/text, radius, elevation, spacing, type scale. Конкретні HEX і масштаб погоджуються після звірки вихідного assets/brand; плакат має image-generation артефакти, тому не зчитувати з нього дрібний текст як точну специфікацію.

## 2. Матриця восьми референсних груп

| Група з плакатів | Реальні MARSHGO screen(s) | Зв’язок із даними/API | Критерій дизайну та поведінки |
|---|---|---|---|
| 1. Splash / welcome | Branded launch + welcome/login | Auth restore/OTP; статичні бренд assets | Глибокий синій launch, M-logo, CTA почати/увійти. Перший запуск пояснює послугу; не вимагати location permission перед використанням. Auth loading, offline та OTP resend/expiry виразні; не показувати social login до інтеграції |
| 2. Onboarding / permissions / Home | Intro slides, OTP, permission choice, Home route search | `/auth/*`, place suggestions, Journey search. Permission тільки на дії, де вона потрібна | Українські рядки не обрізаються; origin/destination з нормалізованого lookup, Kyiv date/time, passenger count, transport category; сортування strategy приходить із сервера. Показувати лише реальну наявність, freshness та empty/loading/errors |
| 3. Strategy / results / compare | Search strategy, Journey results/comparison | `POST /journeys/search`, server ranking і provider partial/freshness | П'ять strategy chips/cards; одна representative альтернатива на category, вся кількість пересадок, walking/access, duration, confirmed vs estimated total, confidence лише з виміряних полів. Current API one leg: не малювати фейкові автобус/потяг/taxi legs |
| 4. Journey detail / price / booking | Leg timeline, provider quote, booking confirmation | owner Journey + legs; Offer details; atomic server booking / Idempotency-Key | Timeline з departure/transfer/pickup/dropoff, map fit, source/expiry, fare transparency, vehicle/driver only authorized. CTA змінюється за status: plan→select, booking→confirmed/loading/error; no online/Apple Pay sandbox. Місце/ціна підтверджує API |
| 5. Active Journey / transit / rescue | Active leg, route map, transfer detail, delay & replan sheet, completion | NavigationCore state; live server evidence; Journey monitor, transfer risk, booking lifecycle | MapLibre road geometry + navigation card, route legend/stale banner, vehicle label/freshness лише live feed, planned vs actual ETA, next transfer countdown. Reroute sheet дає alternatives/price/time/risk з явним вибором; нічого не бронює без confirm. SOS/contact only if real workflow |
| 6. Driver home / live matching | Driver dashboard, create community trip, navigation, candidate, mutual confirmation, proposal | Verified garage vehicle; matching opt-in, pause/resume, real road detour, proposal and booking transactions | Offer creation and navigation separate. Candidate card shows pickup/detour/price only from server; “після безпечної зупинки”; press driver interest is not booking. Passenger explicit confirm → negotiate → passenger final accept → routeVersion/waypoints refresh. No placeholder passenger avatars/inventory |
| 7. Rendezvous / chat / boarding | Participant rendezvous map, short status choices, chat, boarding, trip start | confirmed booking participant APIs; ephemeral location; durable status event; signed ticket if selected | Show participant/pickup only after booking+activation and consent. Distances/ETAs have freshness and accuracy; statuses machine events, chat separate. Two sides confirm boarding; privacy, stale/lost connection, revoke/end and accessible controls. Share exact GPS with only matched booking participants |
| 8. Trips / Profile / Garage / notifications / Safety | Account roles, vehicle CRUD/photo status, docs verification, trips, messages/inbox, blocked list, reports | owner-scoped APIs and role guards | Reuse profile/trips visual patterns; verified/unverified badge is server status. Private docs signed URLs; no full phone/plate in public screens. Review only after complete. Inbox updates via API/WS, settings & sign out; Safety center only renders implemented escalation/service |

## 3. Shared responsive rules

- Keep one React component system, CSS tokens and route DTO for web/PWA/iOS WKWebView; web version can use wider layout while phone stays mobile-first. App Store native chrome/status bar/safe-area remains native responsibility.
- At 320–430 CSS px and iPhone 15 Pro Max/16 Pro Max logical viewport, no horizontal scroll/clipping. Respect top/bottom safe area, keyboard viewport resize, scrollable form and fixed navigation. Bottom tab never covers content/primary CTA; map and sheet heights adapt to viewport.
- Minimum touch targets 44×44 CSS px; text contrast checked; icon buttons have Ukrainian accessible labels; status includes icon/text so color is not sole signal; large text/VoiceOver focus order verified. Prefer `prefers-reduced-motion` to suppress map/camera/transition animation.
- Every data screen has `loading`, `empty`, recoverable `error`, `offline/stale`, and `ready` state. A user-confirm action blocks duplicate submits, preserves idempotency and displays server result; optimistic state cannot imply seat, price, match, boarding or payment succeeded.
- Reuse cards/labels, not reference composite posters embedded as UI. Use production assets licensed to MARSHGO. Avatars, Kyiv/Lviv promotional photography and map iconography must have consent/license or remain neutral placeholders explicitly identified.

## 4. Map and motion rules

MapLibre lives inside `MapAdapter`; normal controls and sheet remain semantic DOM so VoiceOver can read them. Map style versions are independently cached; style source/attribution is visible. Route is blue, alternate is muted, traffic flows have text/severity patterns and disappear under `NoTrafficProvider`; missing base tiles produce a visible degraded map state. Vehicle pointer uses latest validated/matched fix, timestamp and uncertainty, never fake interpolation from sinusoid or only server request completion. Camera follow can animate bearing/pitch/zoom; user drag switches to FREE and a recenter control announces its action. Active route can draw geometry even while tiles fail, but labels it correctly.

Target boards show live speed limits, colored congestion, bus icons, incident and surface type. Ship only if sourced, licensed, fresh and device-tested. No speed camera, live vehicle, green segment, speaker instruction, estimated time or mileage claim can be derived from static mock data in production.

## 5. Visual review checklist

1. Capture the approved reference and implementation for corresponding screen, same iPhone logical viewport, scale, safe-area, state and scroll position.
2. Review typography hierarchy, content density, blue/navy contrast, card radius, icon weight, CTA placement, route timeline, map/sheet balance, tab layout. Track differences as concrete CSS/assets tasks; do not use pixel-perfect score on screenshots with changing data.
3. Repeat with long Ukrainian place/driver names, large number/currency, 0/1/multiple legs, large text, keyboard, loading/empty/network error, stale GPS, dark scheme/reduced motion.
4. Simulators: iPhone 15 Pro Max and iPhone 16 Pro Max, current supported iOS runtime. Device test includes physical GPS/background limitations and two independent participants; screenshots alone do not close it.
5. Add Playwright visual snapshot at fixed viewport/timezone only for stable owned data and local MapLibre fixture. Keep it separate from real external provider acceptance.
6. On visual failure, attach screenshot, URL/screen/state, device/runtime, viewport and exact test command to PR; record whether issue blocks visual parity, accessibility or product correctness.

## 6. Shipping limits for reference-only content

The posters show Apple/Google login, Apple Pay, taxi fleet dispatch, train/bus inventory, Web Push/APNs, SOS dispatch, insurance, multiple live transport modes, traffic speeds, CO₂ metrics and background driving. These are design concepts until an authorized API/provider, operational process, accessibility/safety behavior and acceptance evidence exist. Hide/disable with a truthful explanation; never place illustrative values into production result cards.
