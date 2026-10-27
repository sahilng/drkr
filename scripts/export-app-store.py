#!/usr/bin/env python3
"""Export an archive, or explicitly validate/upload it; never submit for review."""
import argparse
import datetime
import hashlib
import json
import plistlib
import re
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
mode = parser.add_mutually_exclusive_group()
mode.add_argument('--validate', action='store_true',
                  help='Upload for Apple validation only; do not submit for review.')
mode.add_argument('--upload', action='store_true',
                  help='Upload privately to App Store Connect; do not submit for review.')
args = parser.parse_args()
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
signing_identity = identity('Apple Distribution:')
profiles = {}
for bundle_key, filename in [('bundle_identifier', 'drkr-app-store.provisionprofile'),
                             ('extension_bundle_identifier', 'drkr-extension-app-store.provisionprofile')]:
    path = root / 'build/signing' / filename
    if not path.is_file():
        raise SystemExit(f'Download and install the Mac App Store profile first: {path}')
    profile = plistlib.loads(subprocess.check_output(
        ['security', 'cms', '-D', '-i', str(path)], stderr=subprocess.DEVNULL))
    if (profile.get('TeamIdentifier') != [team]
            or 'OSX' not in profile.get('Platform', [])
            or profile['Entitlements'].get('com.apple.application-identifier') != f'{team}.{release[bundle_key]}'
            or 'ProvisionedDevices' in profile or profile.get('ProvisionsAllDevices')
            or not any(hashlib.sha1(cert).hexdigest().upper() == signing_identity
                       for cert in profile.get('DeveloperCertificates', []))
            or profile['ExpirationDate'].replace(tzinfo=datetime.timezone.utc) <= datetime.datetime.now(datetime.timezone.utc)):
        raise SystemExit(f'Profile does not match the app, team, certificate, or distribution requirements: {path}')
    profiles[release[bundle_key]] = profile['UUID']
options = {'method': 'validation' if args.validate else 'app-store-connect',
           'destination': 'upload' if args.validate or args.upload else 'export', 'teamID': team,
           'signingStyle': 'manual', 'signingCertificate': signing_identity,
           'provisioningProfiles': profiles,
           'installerSigningCertificate': identity('3rd Party Mac Developer Installer:'),
           'manageAppVersionAndBuildNumber': False}
options_path = root / ('build/AppStoreValidationOptions.plist' if args.validate else 'build/AppStoreExportOptions.plist')
options_path.write_bytes(plistlib.dumps(options))
subprocess.run(['xcodebuild', '-exportArchive', '-archivePath', str(archive),
                '-exportPath', str(root / ('build/Validation' if args.validate else 'build/AppStore')),
                '-exportOptionsPlist', str(options_path)], check=True)
if not args.validate and not args.upload:
    subprocess.run(['pkgutil', '--check-signature', str(root / 'build/AppStore/Drkr.pkg')], check=True)
