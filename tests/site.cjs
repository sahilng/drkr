const { launch, name } = require('./browser-launch.cjs');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
(async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [], requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => requests.push(request.url()));
    await page.route('https://site.test/drkr/**', route => {
      const suffix = new URL(route.request().url()).pathname.slice('/drkr/'.length) || 'index.html';
      const file = path.join(root, 'docs', suffix);
      if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: 'Not found' });
      const contentType = file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'application/javascript' : file.endsWith('.png') ? 'image/png' : 'text/html';
      return route.fulfill({ contentType, body: fs.readFileSync(file) });
    });
    await page.goto('https://site.test/drkr/');
    assert.equal(await page.title(), 'drkr — A calmer look for Safari');
    assert.equal(await page.locator('#demo-toggle').getAttribute('aria-pressed'), 'true');
    await page.locator('#demo-toggle').click();
    assert.equal(await page.locator('#demo-toggle').getAttribute('aria-pressed'), 'false');
    await page.locator('#demo-toggle').press('Enter');
    assert.equal(await page.locator('#demo-toggle').getAttribute('aria-pressed'), 'true');
    fs.mkdirSync(path.join(root, 'build'), { recursive: true });
    await page.screenshot({ path: path.join(root, `build/site-desktop-${name}.png`), fullPage: true });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const file of ['index.html', 'support.html', 'privacy.html']) {
        await page.goto('https://site.test/drkr/' + file);
        await page.locator('h1').waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${file} overflows at ${width}px`);
        assert.equal(await page.evaluate(() => [...document.images].every(img => img.complete && img.naturalWidth > 0)), true);
        const links = await page.locator('a[href]').evaluateAll(links => links.map(a => a.getAttribute('href')));
        for (const link of links) {
          if (/^(?:https?:|#)/.test(link)) continue;
          const target = new URL(link, page.url()).pathname.slice('/drkr/'.length) || 'index.html';
          assert.ok(fs.existsSync(path.join(root, 'docs', target)), `${file} has broken relative link ${link}`);
        }
      }
    }
    await page.goto('https://site.test/drkr/');
    await page.getByRole('link', { name: 'Privacy', exact: true }).click();
    assert.match(page.url(), /privacy\.html$/);
    assert.ok((await page.textContent('main')).includes('does not transmit'));
    await page.goto('https://site.test/drkr/');
    await page.screenshot({ path: path.join(root, `build/site-mobile-${name}.png`), fullPage: true });
    assert.deepEqual(errors, []);
    assert.ok(requests.every(url => url.startsWith('https://site.test/')), 'Website must not load third-party scripts/assets');
    console.log(`PASS: ${name} Pages navigation, responsive layout, images, demo keyboard operation, local resources, and zero third-party requests.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
