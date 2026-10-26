#!/usr/bin/env python3
"""Package only tracked repository source; never include builds or credentials."""
import json
import subprocess
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
version = json.loads((root / 'package.json').read_text())['version']
paths = subprocess.check_output(['git', '-C', str(root), 'ls-files', '-z']).decode().split('\0')
output = root / 'build' / f'Drkr-{version}-source.zip'
output.parent.mkdir(exist_ok=True)
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for name in filter(None, paths):
        archive.write(root / name, 'Drkr/' + name)
print(output)
