#!/usr/bin/env python3
"""Export an existing archive locally; never upload or create signing assets."""
import json
import plistlib
import re
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parent.parent
release = json.loads((root / 'release-info.json').read_text())
team = release.get('apple_team_id')
if not team or not re.fullmatch(r'[A-Z0-9]{10}', team):
    raise SystemExit('Configure the confirmed publisher team in release-info.json first.')
archive = root / 'build/Drkr.xcarchive'
app = archive / 'Products/Applications/Drkr.app'
subprocess.run(['python3', str(root / 'scripts/check-built-app.py'), str(app)], check=True)
for bundle in [app, app / 'Contents/PlugIns/Drkr Extension.appex']:
    subprocess.run(['codesign', '--verify', '--deep', '--strict', str(bundle)], check=True)
    signature = subprocess.run(['codesign', '-dv', str(bundle)], capture_output=True, text=True, check=True).stderr
    if f'TeamIdentifier={team}' not in signature.splitlines():
        raise SystemExit(f'Unexpected signing team: {bundle}')
identities = subprocess.check_output(['security', 'find-identity', '-v', '-p', 'basic'], text=True)
def identity(prefix):
    matches = [(sha, name) for sha, name in re.findall(r'([A-F0-9]{40}) "([^"]+)"', identities)
               if name.startswith(prefix) and name.endswith(f'({team})')]
    if len(matches) != 1:
        raise SystemExit(f'Expected one valid {prefix} identity for {team}; found {len(matches)}.')
    return matches[0][0]
options = {'method': 'app-store-connect', 'destination': 'export', 'teamID': team,
           'signingStyle': 'manual', 'signingCertificate': identity('Apple Distribution:'),
           'installerSigningCertificate': identity('3rd Party Mac Developer Installer:'),
           'manageAppVersionAndBuildNumber': False}
options_path = root / 'build/AppStoreExportOptions.plist'
options_path.write_bytes(plistlib.dumps(options))
subprocess.run(['xcodebuild', '-exportArchive', '-archivePath', str(archive),
                '-exportPath', str(root / 'build/AppStore'),
                '-exportOptionsPlist', str(options_path)], check=True)
subprocess.run(['pkgutil', '--check-signature', str(root / 'build/AppStore/Drkr.pkg')], check=True)
