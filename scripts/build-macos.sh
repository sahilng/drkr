#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT="$ROOT/macos/Drkr/Drkr.xcodeproj"
if ! xcodebuild -version >/dev/null 2>&1; then
  echo "Install and open full Xcode, then select it with xcode-select."
  exit 1
fi
mkdir -p "$ROOT/build"
if [[ "${1:-}" == "--archive" ]]; then
  PUBLISHER_TEAM="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("apple_team_id") or "")' "$ROOT/release-info.json")"
  if [[ -z "$PUBLISHER_TEAM" ]]; then
    echo "Confirm a publisher-controlled Apple team and set apple_team_id in release-info.json before archiving."
    exit 1
  fi
  if [[ -n "${DEVELOPMENT_TEAM:-}" && "$DEVELOPMENT_TEAM" != "$PUBLISHER_TEAM" ]]; then
    echo "DEVELOPMENT_TEAM does not match the confirmed publisher team in release-info.json."
    exit 1
  fi
  xcodebuild -project "$PROJECT" -scheme Drkr -configuration Release \
    -destination 'generic/platform=macOS' -archivePath "$ROOT/build/Drkr.xcarchive" \
    -derivedDataPath "$ROOT/build/DerivedData" \
    DEVELOPMENT_TEAM="$PUBLISHER_TEAM" CODE_SIGN_STYLE=Automatic archive
  python3 "$ROOT/scripts/check-built-app.py" "$ROOT/build/Drkr.xcarchive/Products/Applications/Drkr.app"
  echo "Archive: $ROOT/build/Drkr.xcarchive (validate and distribute in Xcode Organizer)."
elif [[ $# -eq 0 ]]; then
  xcodebuild -project "$PROJECT" -scheme Drkr -configuration Debug \
    -destination 'platform=macOS' -derivedDataPath "$ROOT/build/DerivedData" \
    CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual DEVELOPMENT_TEAM= build
  /usr/bin/codesign --verify --deep --strict "$ROOT/build/DerivedData/Build/Products/Debug/Drkr.app"
  python3 "$ROOT/scripts/check-built-app.py" "$ROOT/build/DerivedData/Build/Products/Debug/Drkr.app"
  echo "Local build: $ROOT/build/DerivedData/Build/Products/Debug/Drkr.app"
else
  echo "Usage: bash scripts/build-macos.sh [--archive]"
  exit 2
fi
