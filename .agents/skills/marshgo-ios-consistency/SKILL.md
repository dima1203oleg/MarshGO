---
name: marshgo-ios-consistency
description: Keep MarshGO-iOS aligned with the canonical PWA in MarshGO-Site. Use for iOS shell work, API base URL and auth parity, web checkout freshness, or iOS acceptance claims.
---

# MARSHGO iOS Consistency

## Фактична форма
`MarshGO-iOS` = Capacitor-оболонка (не нативний Swift): `@capacitor/core`+`ios` 8.5.2, `capacitor.config.ts` → `appId ua.marshgo.app`, `webDir: 'web/dist'`. Нативне — лише `ios/App/App/AppDelegate.swift`, `SceneDelegate.swift`, `CapApp-SPM`. Отже **UI-правки робляться в `MarshGO-Site`, а не в iOS**; тут правимо оболонку, конфіг і контракти.

## Синхронізація з канонічним PWA
- `npm run site:checkout` → `scripts/checkout-site.mjs`: `git init` + depth-1 fetch **github.com/dima1203oleg/MarshGO-Site**, ref `main` (або pinned `SITE_REF`); відмовляється, якщо `web/` уже існує. `web/` у `.gitignore`.
- Далі: `site:build` → `site:build-info` (`scripts/write-build-info.mjs`) → `sync` (`npx cap sync ios`) → `build:simulator` (`scripts/build-ios-simulator.sh`, жорстко вимагає `VITE_API_BASE_URL`).
- `npm run ios:sync` у iOS-репо **не існує** (такий скрит є в кореневому `MarshGO/package.json`) — не посилатися на нього.
- Пастка свіжості: checkout бере GitHub `main`, тож локальні `qoder/*`-гілки Site, які ще не влиті в `main`, до iOS не потрапляють. Перевіряй, на якому SHA стоїть `web/` (перевірено 2026-11-03: `ca5140c` 2026-10-30 проти Site HEAD `13a1106`) і повідомляй відставання, перш ніж робити висновок про паритет.

## Контракти
- Auth: Email/Password — `web/src/services/productionApi.ts` `login` (→`POST /auth/login`) і `register`; серверна схема `server/migrations/056_email_password_auth.sql`. OTP **вимкнено** на сервері (`server/index.ts:2160,2169`) — рецепти в root `docs/IOS.md` з `AUTH_DEV_OTP=true` застарілі й непрацюючі.
- Демо-шляхи: `web/src/App.tsx` має `import.meta.env.DEV && VITE_DEMO_MODE === 'true'` → `<DemoApp/>` (лише dev), runtime-перемикач `storage.getDemoMode()` і DEMO-бейдж у `components/AppHeader.tsx`; серверний `AUTH_DEV_BYPASS` відхиляється `server/config.ts` у production. У реліз-білді жодного bypass не повинно бути видно.

## Правила якості / перевірки
- Не заявляти iOS-готовність: `docs/IOS_PHYSICAL_DEVICE_ACCEPTANCE.md` = `BLOCKED_EXTERNAL` (перевірено лише встановлення й запуск у симуляторі до welcome-екрана; фізпристрій, APNs, GPS, TestFlight — не перевірено). `docs/IOS_TESTFLIGHT_ACCEPTANCE.md` — не почато далі запуску в симуляторі.
- Відкриті прогалини: background-GPS немає, стійкість сесії після force-quit не підтверджена, `NSLocationWhenInUseUsageDescription` лише, потрібні `ROUTING_ENGINE_URL` і `VITE_MAP_TILE_URL`, push/camera/upload не перевірені (`MarshGO-iOS/IOS.md`, root `NEXT_ACTIONS.md:54,63,74,411`; GATE-03 blocked, пристрій `00008130-000845182E60001C` потребує підпису).
- Паритет UX рахуємо за канонічним UI-контрактом `marshgo-web-ux` + `marshgo-design-system`; мовні правки — в Site, не в оболонці.
