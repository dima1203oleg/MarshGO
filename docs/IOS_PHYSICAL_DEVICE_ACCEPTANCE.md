# iOS physical-device acceptance

**Status: BLOCKED_EXTERNAL.** `xcrun devicectl list devices` showed the attached iPhone as unavailable; only simulators were available.

## Verified

- Capacitor sync completed from exact local iOS `cb32564`, Site `e47538b`, and Server `363532c` revisions; the embedded release manifest was checked against all three.
- Unsigned iOS Simulator compilation succeeded; the app installed and launched on the iPhone 16 Pro Max Simulator and rendered the MARSHGO welcome/onboarding screen. Screenshot: `/tmp/marshgo-ios-site-e475.png`.
- Unsigned iOS Release device archive compilation succeeded with those pinned local sources.
- The Simulator build uses `http://127.0.0.1:3002` as its API origin and does not represent a staging/production app.

## Not verified

Physical install/launch, OTP, force-quit session restore, real GPS, background/screen-lock navigation, rerouting, APNs, Universal Links, QR camera, upload, rendezvous, two-device passenger/driver flow, signed archive, provisioning and TestFlight.

Do not treat Simulator evidence as physical-device acceptance.
