const { launch, name } = require('./browser-launch.cjs');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
(async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.text().startsWith('drkr could not')) errors.push(message.text()); });
    await page.setContent(`<!doctype html><html><head><style id="author">
      body{background:#fff;color:#222;font:16px system-ui}.card{background:#f1f3f6;color:#222;padding:10px;border:1px solid #ddd}
      #gradient{background:linear-gradient(120deg,#fff 20%,#ddd 80%);color:#222}
      #pseudo::before{content:'A label';background:#fff;color:#222}
      #art{background-image:url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="10" height="10"%3E%3Cpath fill="white" d="M0 0h10v10H0z"/%3E%3C/svg%3E');color:#222}
      #hover:hover{background:#fff;color:red}#hover{background:#eee;color:black}
      #modern{background:oklch(95% .03 120);color:color(display-p3 .1 .1 .1)}
    </style></head><body><div id="gradient">Gradient</div><div id="pseudo"></div><div id="art"><span id="art-text">Artwork caption</span></div>
    <div id="important" style="background:white!important;color:#111!important"><span id="important-text">Important author style</span></div>
    <button id="hover">Hover</button><button id="svg-button" aria-label="Icon button"><svg width="20" height="20"><path id="ui-path" fill="black" d="M0 0h20v20H0z"/><path id="color-path" fill="red" d="M0 0h5v5H0z"/></svg></button><svg width="20" height="20"><path id="art-path" fill="black" d="M0 0h20v20H0z"/></svg><input id="input" value="Keep this value"><div id="modern">Modern colors</div><div id="shadow-host"></div><div id="rows"></div></body></html>`);
    await page.evaluate(() => {
      const shadow = document.querySelector('#shadow-host').attachShadow({ mode: 'open' });
      shadow.innerHTML = '<style>.box{background:white;color:black}.box::after{content:"label";background:white;color:black}</style><div class="box">Shadow content</div>';
      window.saved = { mode: 'on', sites: {}, respectDark: true };
      window.listeners = [];
      window.browser = { storage: { local: { get: async () => ({ settings: saved }) }, onChanged: { addListener: fn => listeners.push(fn) } }, runtime: { onMessage: { addListener: fn => { window.statusHandler = fn; } } } };
      window.changeSettings = value => { window.saved = value; listeners.forEach(fn => fn({ settings: { newValue: value } }, 'local')); };
    });
    for (const name of ['settings.js', 'colors.js', 'site-rules.js', 'content.js']) await page.addScriptTag({ path: path.join(root, 'extension', name) });
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-drkr-ready'));
    const initial = await page.evaluate(() => {
      const style = id => getComputedStyle(document.getElementById(id));
      const shadow = document.getElementById('shadow-host').shadowRoot.querySelector('.box');
      return { gradient: style('gradient').backgroundImage, pseudo: getComputedStyle(document.getElementById('pseudo'), '::before').backgroundColor,
        artwork: style('art-text').color, important: style('important-text').color, importantBG: style('important').backgroundColor,
        input: document.getElementById('input').value, shadow: getComputedStyle(shadow).backgroundColor,
        shadowPseudo: getComputedStyle(shadow, '::after').backgroundColor, modern: style('modern').backgroundColor };
    });
    assert.match(initial.gradient, /linear-gradient\(120deg,/);
    assert.ok(!initial.gradient.includes('rgb(255, 255, 255)'));
    for (const key of ['pseudo', 'shadow', 'shadowPseudo']) assert.notEqual(initial[key], 'rgb(255, 255, 255)', key);
    assert.equal(initial.important, 'rgb(17, 17, 17)');
    assert.equal(initial.importantBG, 'rgb(255, 255, 255)');
    assert.equal(initial.artwork, 'rgb(34, 34, 34)');
    assert.equal(initial.input, 'Keep this value');
    assert.match(initial.modern, /^rgb/);
    assert.notEqual(await page.$eval('#ui-path', el => getComputedStyle(el).fill), 'rgb(0, 0, 0)');
    assert.equal(await page.$eval('#color-path', el => getComputedStyle(el).fill), 'rgb(255, 0, 0)');
    assert.equal(await page.$eval('#art-path', el => getComputedStyle(el).fill), 'rgb(0, 0, 0)');
    await page.evaluate(() => {
      const host = document.createElement('div'); host.id = 'late-host';
      host.attachShadow({ mode: 'open' }).innerHTML = '<style>p{background:white;color:black}</style><p>Late shadow content</p>';
      document.body.append(host);
    });
    await page.waitForFunction(() => getComputedStyle(document.getElementById('late-host').shadowRoot.querySelector('p')).backgroundColor !== 'rgb(255, 255, 255)');
    await page.evaluate(() => {
      document.getElementById('late-host').shadowRoot.querySelector('p').style.backgroundColor = '#eee';
      document.getElementById('author').firstChild.data += '#pseudo::before{background:#eee}';
    });
    await page.waitForFunction(() => getComputedStyle(document.getElementById('pseudo'), '::before').backgroundColor !== 'rgb(238, 238, 238)');
    // Form values, focus, and DOM nodes must survive appearance changes.
    await page.locator('#input').fill('New value');
    await page.evaluate(() => changeSettings({ mode: 'off', sites: {}, respectDark: true }));
    await page.waitForFunction(() => getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)');
    assert.equal(await page.inputValue('#input'), 'New value');
    assert.equal(await page.$eval('#ui-path', el => getComputedStyle(el).fill), 'rgb(0, 0, 0)');
    assert.equal(await page.$eval('#pseudo', el => getComputedStyle(el, '::before').backgroundColor), 'rgb(238, 238, 238)');
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#shadow-host').shadowRoot.querySelector('.box')).backgroundColor), 'rgb(255, 255, 255)');
    await page.evaluate(() => changeSettings({ mode: 'on', sites: {}, respectDark: true }));
    await page.waitForFunction(() => getComputedStyle(document.body).backgroundColor !== 'rgb(255, 255, 255)');
    console.log('PASS: gradients, pseudo-elements, modern CSS colors, original artwork/important panels, open shadow roots, live stylesheets, and form-state restoration.');

    // Large fixture: verify update scope, rule sharing, cleanup, and idle behavior.
    await page.evaluate(() => {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < 5000; i++) {
        const row = document.createElement('div'); row.className = 'card'; row.id = `row-${i}`;
        row.innerHTML = `<span>Item ${i}</span><a href="#">Read</a>`;
        fragment.append(row);
      }
      document.querySelector('#rows').append(fragment);
    });
    await page.waitForFunction(() => document.querySelector('#row-4999').hasAttribute('data-drkr-node'));
    const large = await page.evaluate(() => statusHandler({ type: 'drkr-diagnostics' }));
    assert.ok(large.groups < 100, `Expected shared rules for repeated cards, got ${large.groups}`);
    await page.evaluate(() => { const el = document.createElement('div'); el.id = 'one-new'; el.className = 'card'; el.textContent = 'One added card'; document.getElementById('rows').append(el); });
    await page.waitForFunction(() => document.querySelector('#one-new').hasAttribute('data-drkr-node'));
    const small = await page.evaluate(() => statusHandler({ type: 'drkr-diagnostics' }));
    assert.ok(small.processed < 100, `Small update scanned ${small.processed} elements`);
    await page.evaluate(() => document.getElementById('drkr-theme').remove());
    await page.waitForFunction(() => document.getElementById('drkr-theme')?.sheet?.cssRules.length > 5);
    assert.notEqual(await page.$eval('#row-4999', el => getComputedStyle(el).backgroundColor), 'rgb(241, 243, 246)');
    await page.evaluate(async () => {
      window.beforeRemovalScans = (await statusHandler({ type: 'drkr-diagnostics' })).scans;
      document.getElementById('rows').replaceChildren();
    });
    await page.waitForFunction(() => !document.querySelector('#row-4999'));
    // Observe counters over two animation-free intervals rather than assuming the
    // mutation debounce has completed at the instant DOM removal returns.
    await page.waitForFunction(() => {
      window.statusHandler({ type: 'drkr-diagnostics' }).then(s => { window.lastStats = s; });
      return window.lastStats && window.lastStats.scans > window.beforeRemovalScans;
    });
    const idleBefore = await page.evaluate(() => statusHandler({ type: 'drkr-diagnostics' }));
    await page.waitForTimeout(250);
    const idleAfter = await page.evaluate(() => statusHandler({ type: 'drkr-diagnostics' }));
    assert.equal(idleAfter.scans, idleBefore.scans, 'Engine should not rescan while page is idle');
    assert.deepEqual(errors, []);
    const result = { browser: await browser.version(), fixture: '5000 cards, 15000 descendants', largeUpdate: large, smallUpdate: small, idleStable: true };
    fs.mkdirSync(path.join(root, 'build'), { recursive: true });
    fs.writeFileSync(path.join(root, `build/performance-${name}.json`), JSON.stringify(result, null, 2));
    console.log('PASS: 5000-card fixture, shared rules, targeted updates, cleanup, and idle stability.', JSON.stringify(result));
    await page.screenshot({ path: path.join(root, 'build/hardening-preview.png'), fullPage: true });
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
