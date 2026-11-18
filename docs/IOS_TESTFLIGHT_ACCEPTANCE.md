# iOS TestFlight acceptance

## Current status

The Capacitor app builds, installs and launches in iOS Simulator against the local API. The most recent automated launch stopped at the welcome screen. No authenticated native flow, signed archive, TestFlight upload, APNs delivery, or physical iPhone acceptance has been completed.

## Required owner-provided release inputs

- Apple Developer team access, signing certificate and provisioning profile.
- App Store Connect/TestFlight access, bundle identifiers and release metadata.
- APNs key and production HTTPS API origin.
- At least two physical iPhones with separate driver/passenger accounts.

## Acceptance sequence

1. Build a signed archive using the release HTTPS API origin and production permission strings/privacy manifest.
2. Install the TestFlight build on both devices; verify OTP, session refresh after force quit/relaunch, logout and account isolation.
3. Verify location permission, foreground GPS, route display, GPS loss/recovery, reroute behavior, and that precise position is cleared after ending navigation.
4. Verify driver/passenger booking, chat/realtime, rendezvous location privacy and arrival actions, QR/manual boarding, push, cancellation/rescue, completion and review.
5. Repeat in weak network conditions and after background/foreground transitions; record device/iOS versions, traces, screenshots, battery observations, failures and retest results.
6. Confirm no debug auth, simulator URL, test provider, or development signing profile is present in the release archive.

Simulator success must not be reported as physical-device or TestFlight acceptance.
