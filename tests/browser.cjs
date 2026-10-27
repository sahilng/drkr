// Run with Playwright available via NODE_PATH. No extension logic is mocked;
// only the browser storage/messaging boundary is supplied to the page.
const { launch } = require('./browser-launch.cjs');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
(async () => {
  const browser = await launch();
  try {
    for (const mode of ['on', 'off', 'native', 'failure']) {
      const startup = await browser.newPage();
      await startup.setContent('<html><head><style>body{background:white;color:black}</style></head><body>Startup test</body></html>');
      if (mode === 'native') await startup.evaluate(() => { document.body.style.backgroundColor = '#161719'; });
      await startup.addStyleTag({ path: path.join(root, 'extension/startup.css') });
      await startup.evaluate(() => {
        window.browser = {
          storage: { local: { get: () => new Promise((resolve, reject) => { window.resolveStorage = resolve; window.rejectStorage = reject; }) }, onChanged: { addListener() {} } },
          runtime: { onMessage: { addListener() {} } }
        };
      });
      for (const name of ['settings.js', 'colors.js', 'site-rules.js', 'content.js']) await startup.addScriptTag({ path: path.join(root, 'extension', name) });
      assert.equal(await startup.evaluate(() => getComputedStyle(document.documentElement, '::before').backgroundColor), 'rgb(20, 22, 25)');
      assert.equal(await startup.evaluate(() => getComputedStyle(document.documentElement, '::before').visibility), 'visible');
      await startup.evaluate(mode => {
        if (mode === 'failure') window.rejectStorage(new Error('Test storage failure'));
        else window.resolveStorage({ settings: { mode: mode === 'off' ? 'off' : 'on', sites: {}, respectDark: true } });
      }, mode);
      await startup.waitForFunction(() => document.documentElement.hasAttribute('data-drkr-ready'));
      const bg = await startup.$eval('body', el => getComputedStyle(el).backgroundColor);
      if (mode === 'on') assert.notEqual(bg, 'rgb(255, 255, 255)');
      else assert.equal(bg, mode === 'native' ? 'rgb(22, 23, 25)' : 'rgb(255, 255, 255)');
      assert.equal(await startup.evaluate(() => getComputedStyle(document.documentElement, '::before').content), 'none');
      await startup.close();
    }
    const fallback = await browser.newPage();
    await fallback.setContent('<html><body>No content script</body></html>');
    await fallback.addStyleTag({ path: path.join(root, 'extension/startup.css') });
    await fallback.waitForFunction(() => getComputedStyle(document.documentElement, '::before').visibility === 'hidden');
    await fallback.close();
    console.log('PASS: startup cover precedes settings, reveals themed/original/native pages, and fails open on storage or script failure.');
    const page = await browser.newPage();
    await page.route('https://fixture.test/**', route => route.fulfill({ contentType: 'text/html', body: fs.readFileSync(path.join(__dirname, 'fixture.html'), 'utf8') }));
    await page.goto('https://fixture.test/');
    await page.evaluate(() => {
      window.saved = { mode: 'on', sites: {}, respectDark: true };
      window.listeners = [];
      window.browser = {
        storage: { local: { get: async () => ({ settings: window.saved }) }, onChanged: { addListener: fn => window.listeners.push(fn) } },
        runtime: { onMessage: { addListener: fn => { window.statusHandler = fn; } } }
      };
      window.changeSettings = value => { window.saved = value; window.listeners.forEach(fn => fn({ settings: { newValue: value } }, 'local')); };
    });
    for (const name of ['settings.js', 'colors.js', 'site-rules.js', 'content.js']) await page.addScriptTag({ path: path.join(root, 'extension', name) });
    const color = selector => page.$eval(selector, el => getComputedStyle(el).backgroundColor);
    await page.waitForFunction(() => document.getElementById('drkr-theme') && getComputedStyle(document.body).backgroundColor !== 'rgb(255, 255, 255)');
    assert.notEqual(await color('body'), 'rgb(255, 255, 255)', await page.evaluate(() => JSON.stringify({ theme: document.getElementById('drkr-theme')?.outerHTML, disabled: document.getElementById('drkr-theme')?.disabled, body: document.body.outerHTML.slice(0, 300) })));
    assert.equal(await page.$eval('img', el => getComputedStyle(el).filter), 'none');
    await page.click('#add');
    await page.waitForFunction(() => { const el = document.querySelector('.card:last-child'); return el && getComputedStyle(el).backgroundColor !== 'rgb(241, 243, 246)'; });
    await page.evaluate(() => changeSettings({ mode: 'off', sites: {}, respectDark: true }));
    await page.waitForFunction(() => getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)');
    assert.equal(await page.$eval('body', el => getComputedStyle(el).color), 'rgb(34, 34, 34)');
    await page.evaluate(() => { document.body.dataset.theme = 'dark'; changeSettings({ mode: 'on', sites: {}, respectDark: true }); });
    await page.waitForFunction(() => {
      window.statusHandler({ type: 'drkr-status' }).then(s => { window.latestStatus = s; });
      return window.latestStatus?.nativeDark;
    });
    assert.deepEqual(await page.evaluate(() => window.statusHandler({ type: 'drkr-status' })), { active: false, nativeDark: true });
    assert.equal(await color('body'), 'rgb(22, 23, 25)');
    await page.evaluate(() => { delete document.body.dataset.theme; });
    await page.waitForFunction(() => document.getElementById('drkr-theme') && getComputedStyle(document.body).backgroundColor !== 'rgb(255, 255, 255)');
    await page.evaluate(() => changeSettings({ mode: 'on', sites: { 'fixture.test': 'off' }, respectDark: true }));
    await page.waitForFunction(() => getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)');
    await page.evaluate(() => changeSettings({ mode: 'system', sites: {}, respectDark: true }));
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForFunction(() => document.getElementById('drkr-theme') && getComputedStyle(document.body).backgroundColor !== 'rgb(255, 255, 255)');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForFunction(() => getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)');
    console.log('PASS: dark mode, media preservation, dynamic content, restoration, native themes, per-site overrides, and system changes.');
    // Render the real popup with a simulated extension API for visual QA.
    await page.route('https://popup.test/**', route => {
      const file = path.join(root, 'extension', new URL(route.request().url()).pathname);
      const type = file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'application/javascript' : file.endsWith('.png') ? 'image/png' : 'text/html';
      return route.fulfill({ contentType: type, body: fs.readFileSync(file) });
    });
    await page.addInitScript(() => {
      let saved; window.testMessages = [];
      window.browser = { storage: { local: { get: async () => ({ settings: saved }), set: async value => { saved = value.settings; window.testSaved = saved; } } }, tabs: { query: async options => options.active ? [{ id: 1, url: 'https://example.com' }] : [{ id: 1 }, { id: 2 }], sendMessage: async (id, message) => { window.testMessages.push({ id, type: message.type }); return { active: true }; } } };
    });
    await page.setViewportSize({ width: 350, height: 610 });
    await page.goto('https://popup.test/popup.html');
    await page.waitForFunction(() => document.getElementById('hostname').textContent === 'example.com');
    await page.locator('input[value="system"]').check();
    await page.waitForFunction(() => window.testSaved?.mode === 'system');
    await page.selectOption('#site-mode', 'off');
    await page.waitForFunction(() => window.testSaved?.sites['example.com'] === 'off');
    await page.locator('#respect-dark').uncheck();
    await page.waitForFunction(() => window.testSaved?.respectDark === false);
    await page.selectOption('#site-mode', 'default');
    await page.waitForFunction(() => !window.testSaved?.sites['example.com']);
    await page.waitForFunction(() => [1, 2].every(id => testMessages.filter(m => m.id === id && m.type === 'drkr-refresh-settings').length >= 4));
    await page.screenshot({ path: path.join(root, 'build/popup-preview.png'), fullPage: true });
    console.log('PASS: popup settings persist, site overrides reset, screenshot saved.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
