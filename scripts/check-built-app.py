#!/usr/bin/env python3
"""Reject a packaged app with missing or stale web-extension resources."""
import hashlib
import json
import plistlib
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
app = Path(sys.argv[1])
extension = app / 'Contents/PlugIns/Drkr Extension.appex/Contents'
resources = extension / 'Resources'
manifest = json.loads((root / 'extension/manifest.json').read_text())
files = {'manifest.json', manifest['action']['default_popup']}
files.update(manifest['icons'].values())
for entry in manifest['content_scripts']:
    files.update(entry.get('js', []))
    files.update(entry.get('css', []))
# Popup stylesheet and script references are static resources too.
files.update(['popup.css', 'popup.js'])
for file in sorted(files):
    original = root / 'extension' / file
    packaged = resources / file
    if not packaged.is_file() or hashlib.sha256(original.read_bytes()).digest() != hashlib.sha256(packaged.read_bytes()).digest():
        raise SystemExit(f'Missing or stale packaged resource: {file}')
with (app / 'Contents/Info.plist').open('rb') as f:
    app_info = plistlib.load(f)
with (extension / 'Info.plist').open('rb') as f:
    ext_info = plistlib.load(f)
if not ext_info['CFBundleIdentifier'].startswith(app_info['CFBundleIdentifier'] + '.'):
    raise SystemExit('App/extension bundle identifier prefixes do not match')
for info in [app_info, ext_info]:
    if info['CFBundleShortVersionString'] != manifest['version']:
        raise SystemExit('Native and web extension versions do not match')
for manifest_path in [app / 'Contents/Resources/PrivacyInfo.xcprivacy', resources / 'PrivacyInfo.xcprivacy']:
    with manifest_path.open('rb') as f:
        privacy = plistlib.load(f)
    if privacy.get('NSPrivacyTracking') is not False:
        raise SystemExit('Unexpected privacy tracking declaration')
release = json.loads((root / 'release-info.json').read_text())
if app_info['CFBundleIdentifier'] != release['bundle_identifier'] or ext_info['CFBundleIdentifier'] != release['extension_bundle_identifier']:
    raise SystemExit('Bundle identifiers do not match release-info.json')
print(f'Verified {len(files)} packaged resources, versions, and bundle identifiers.')
