# iOS physical-device acceptance

**Status: BLOCKED_EXTERNAL.** `xcrun devicectl list devices` showed the attached iPhone as unavailable; only simulators were available.

## Verified

- Capacitor sync completed for the local iOS checkout.
- Unsigned iOS Simulator compilation succeeded.
- A prior iPhone 16 Pro Max Simulator launch reached the welcome screen. It did not cover authenticated navigation or the required trip lifecycle.
- The Simulator build used Site commit `ed602ac73a7b2ce36b99bc60e0b8b3c10014c4d4`, not the newer local Site commit in the current release manifest.

## Not verified

Physical install/launch, OTP, force-quit session restore, real GPS, background/screen-lock navigation, rerouting, APNs, Universal Links, QR camera, upload, rendezvous, two-device passenger/driver flow, signed archive, provisioning and TestFlight.

Do not treat Simulator evidence as physical-device acceptance.
