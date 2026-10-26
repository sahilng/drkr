#!/bin/bash
# Compatibility entry point; the native Xcode project is now checked in.
set -euo pipefail
exec bash "$(dirname "$0")/build-macos.sh" "$@"
