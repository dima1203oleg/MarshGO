#!/usr/bin/env bash
set -euo pipefail

SIMULATOR_UDID="${SIMULATOR_UDID:-}"
if [[ -z "$SIMULATOR_UDID" ]]; then
  echo "Set SIMULATOR_UDID to an available iOS Simulator device." >&2
  exit 2
fi

API_BASE_URL="${SIMULATOR_API_BASE_URL:-http://localhost:3002}"
SCREENSHOT_PATH="${SIMULATOR_SCREENSHOT_PATH:-/tmp/marshgo-ios-simulator.png}"
curl --fail --silent "$API_BASE_URL/healthz" >/dev/null || {
  echo "MARSHGO API is not reachable at $API_BASE_URL. Start PostgreSQL, apply migrations, then start the API." >&2
  exit 1
}

CAPACITOR_BUILD=true VITE_API_BASE_URL="$API_BASE_URL" npm run build
npx cap sync ios
xcrun simctl boot "$SIMULATOR_UDID" 2>/dev/null || true
xcrun simctl bootstatus "$SIMULATOR_UDID" -b
xcodebuild \
  -quiet \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,id=$SIMULATOR_UDID" \
  -derivedDataPath ios/build \
  CODE_SIGNING_ALLOWED=NO \
  build
xcrun simctl install "$SIMULATOR_UDID" ios/build/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch "$SIMULATOR_UDID" ua.marshgo.app
# Allow first boot, WebKit startup and the initial session refresh to settle.
# On a fresh iOS Simulator runtime this can take longer than 20 seconds.
sleep 35
xcrun simctl io "$SIMULATOR_UDID" screenshot "$SCREENSHOT_PATH"

echo "MARSHGO launched on simulator $SIMULATOR_UDID using API $API_BASE_URL"
echo "Simulator screenshot saved to $SCREENSHOT_PATH"
