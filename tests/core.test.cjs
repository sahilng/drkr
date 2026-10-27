const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = vm.createContext({ URL });
for (const file of ['settings.js', 'colors.js', 'site-rules.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../extension', file), 'utf8'), context);
const S = context.DrkrSettings, C = context.DrkrColors;
test('site compatibility rules are restricted to the intended domain and logos', () => {
  const rules = context.DrkrSiteRules;
  assert.ok(rules.css('en.wikipedia.org').includes('.mw-logo-wordmark'));
  assert.equal(rules.css('wikipedia.org.evil.test'), '');
  assert.equal(rules.css('example.com'), '');
  assert.ok(!rules.css('en.wikipedia.org').includes('img{'));
});
test('settings normalize corrupt modes and site overrides', () => {
  assert.equal(S.normalize(null).mode, 'on');
  const s = S.normalize({ mode: 'invalid', sites: { 'example.com': 'off', 'bad.com': 'oops' } });
  assert.equal(s.mode, 'on');
  assert.equal(s.sites['example.com'], 'off');
  assert.equal(s.sites['bad.com'], undefined);
  assert.equal(s.respectDark, true);
});
test('per-site settings take precedence over global and system', () => {
  const s = S.normalize({ mode: 'system', sites: { 'a.com': 'on', 'b.com': 'off' } });
  assert.equal(S.enabled(s, 'a.com', false), true);
  assert.equal(S.enabled(s, 'b.com', true), false);
  assert.equal(S.enabled(s, 'c.com', false), false);
  assert.equal(S.enabled(s, 'c.com', true), true);
  assert.equal(S.enabled(S.normalize(), 'constructor', false), true);
  assert.equal(Object.keys(S.normalize({ sites: ['off'] }).sites).length, 0);
});
test('gradients retain structure, stop positions, transparency and artwork', () => {
  const result = C.gradient('linear-gradient(120deg, rgb(255, 255, 255) 20%, rgba(0, 0, 0, 0) 80%)');
  assert.match(result, /^linear-gradient\(120deg,/);
  assert.match(result, /20%, rgba\(0, 0, 0, 0\) 80%\)$/);
  assert.ok(!result.includes('rgb(255, 255, 255)'));
  assert.equal(C.gradient('url("photo.png"), linear-gradient(rgb(255, 255, 255), rgb(0, 0, 0))'), null);
});
test('only public web protocols allow per-site controls', () => {
  assert.equal(S.hostname('https://example.com/a'), 'example.com');
  for (const url of ['about:blank', 'file:///tmp/test', 'safari://settings', 'bad-url']) assert.equal(S.hostname(url), null);
});
test('color parsing supports legacy and modern rgb syntax and alpha', () => {
  assert.equal(JSON.stringify(C.parse('rgba(255, 128, 0, 0.5)')), '[255,128,0,0.5]');
  assert.ok(Math.abs(C.parse('rgb(100% 0% 0% / 50%)')[0] - 255) < .001);
  assert.equal(C.parse('rgb(10 20 30 / .5)')[3], .5);
  assert.equal(C.parse('transparent'), null);
  assert.equal(C.parse('rgb(nope 0 0)'), null);
});
test('maps light surfaces and dark text without changing transparent colors', () => {
  assert.match(C.map('rgb(255, 255, 255)', 'background'), /7\.5%/);
  assert.match(C.map('rgb(0, 0, 0)', 'text'), /88\.0%/);
  assert.equal(C.map('rgba(255, 255, 255, 0)', 'background'), null);
  assert.equal(C.map('rgb(10, 10, 10)', 'background'), null);
  assert.equal(C.luminance([0, 0, 0]), 0);
  assert.equal(C.luminance([255, 255, 255]), 1);
});
test('manifest resources exist and permissions stay minimal', () => {
  const root = path.join(__dirname, '../extension');
  const m = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')));
  assert.equal(m.manifest_version, 3);
  assert.deepEqual(m.permissions, ['storage', 'activeTab']);
  const files = [...Object.values(m.icons), m.action.default_popup, ...m.content_scripts.flatMap(s => [...s.js, ...(s.css || [])])];
  for (const file of files) assert.ok(fs.existsSync(path.join(root, file)), file);
});
test('checked-in native project includes every entry point and matches release versions', () => {
  const root = path.join(__dirname, '..');
  const m = JSON.parse(fs.readFileSync(path.join(root, 'extension/manifest.json')));
  const project = fs.readFileSync(path.join(root, 'macos/Drkr/Drkr.xcodeproj/project.pbxproj'), 'utf8');
  for (const file of [...m.content_scripts[0].js, ...m.content_scripts[0].css, m.action.default_popup]) {
    assert.ok(project.includes(`/* ${file} in Resources */`), `Missing native resource: ${file}`);
  }
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'package.json'))).version, m.version);
  assert.ok(project.includes(`MARKETING_VERSION = ${m.version};`));
  assert.ok(project.includes('PRODUCT_BUNDLE_IDENTIFIER = io.github.sahilng.drkr;'));
  assert.ok(project.includes('PRODUCT_BUNDLE_IDENTIFIER = io.github.sahilng.drkr.Extension;'));
  assert.ok(!project.includes('/Users/'), 'Native project must use portable resource paths');
});
