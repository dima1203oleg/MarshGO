# MARSHGO iOS app

MARSHGO now has a Capacitor iOS target that packages the existing React app in a native WKWebView. It uses bundle ID `ua.marshgo.app`, iOS 15 or later, the MARSHGO app icon, and portrait layout. This is a native shell around the current API-backed UI; it does not imply that the unfinished driver, demand, chat, navigation, or matching flows are implemented.

## Build and run on a simulator

Requirements: macOS, Xcode, Bun (the repository package manager), and an available iOS Simulator. The API must use a local development OTP adapter; the application must not use live SMS credentials during simulator testing.

```sh
docker compose up -d db redis
DATABASE_URL=postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo bun run db:migrate
DATABASE_URL=postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo \
NODE_ENV=development AUTH_DEV_OTP=true API_HOST=0.0.0.0 \
CORS_ORIGINS=capacitor://localhost,http://localhost:3000 \
SESSION_SECRET=local-simulator-only-secret bun run api
```

In another terminal, provide a simulator UDID from `xcrun simctl list devices available`:

```sh
SIMULATOR_UDID=<device-udid> bun run ios:simulator
```

The simulator build points at `http://localhost:3002`. The iOS target permits cleartext HTTP only for the `localhost` hostname for local development. Release builds must set `VITE_API_BASE_URL` to the HTTPS API origin; do not ship the simulator endpoint or local development OTP configuration.

## Native limitations and release work

* The current app relies on the existing browser session client. Validate refresh-cookie persistence across force-quit/relaunch on physical iOS devices before release.
* Foreground location and the native navigation experience are not wired to the UI. Background GPS, push notifications, camera upload, app review metadata, signing, privacy declarations, and physical-device testing remain separate work.
* No App Store archive, signing profile, public endpoint, production SMS, or external payment was created or used in simulator testing.
* This environment has the CoreSimulator runtime and `simctl` but does not include the graphical `Simulator.app`; `simctl` installed/launched the app and captured its production login screen, but interactive field entry and booking gestures could not be automated here.
