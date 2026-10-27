const { launch, name } = require('./browser-launch.cjs');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    const failures = [];
    page.on('console', m => { if (m.text().startsWith('drkr could not')) failures.push(m.text()); });
    const policy = "default-src 'self'; script-src 'none'; style-src 'self'; object-src 'none'";
    await page.route('https://strict.test/**', route => route.fulfill(route.request().url().endsWith('.css')
      ? { contentType: 'text/css', body: 'body{background:white;color:#222}body.native{background:#182126;color:#eee}.card{background:#eee;color:#222}' }
      : { contentType: 'text/html', headers: { 'Content-Security-Policy': policy }, body: '<!doctype html><html><head><link rel="stylesheet" href="/author.css"></head><body><h1>Strict policy</h1><div class="card">Original card</div><input value="Keep me"><div id="host"></div></body></html>' }));
    await page.goto('https://strict.test/');
    await page.evaluate(() => {
      window.listeners = [];
      window.browser = { storage: { local: { get: async () => ({settings:{mode:'on',sites:{},respectDark:true}}) }, onChanged:{addListener:fn=>listeners.push(fn)} }, runtime:{onMessage:{addListener:fn=>window.handler=fn}} };
      window.change = mode => listeners.forEach(fn=>fn({settings:{newValue:{mode,sites:{},respectDark:true}}},'local'));
      const shadow = document.getElementById('host').attachShadow({mode:'open'});
      const sheet = new CSSStyleSheet(); sheet.replaceSync('p{background:white;color:black}');
      shadow.adoptedStyleSheets = [sheet]; shadow.innerHTML='<p>Shadow content</p>';
    });
    // Runtime evaluation models an already-authorized content script while the
    // real response CSP still governs every DOM style element it creates.
    for (const file of ['settings.js','colors.js','site-rules.js','content.js']) await page.evaluate(fs.readFileSync(path.join(__dirname,'../extension',file),'utf8'));
    await page.waitForFunction(()=>document.documentElement.hasAttribute('data-drkr-ready'));
    await page.waitForFunction(()=>getComputedStyle(document.body).backgroundColor!=='rgb(255, 255, 255)');
    assert.equal(await page.$eval('#drkr-theme', el=>el.sheet), null, 'Fixture must exercise the blocked-style fallback');
    assert.notEqual(await page.evaluate(()=>getComputedStyle(document.getElementById('host').shadowRoot.querySelector('p')).backgroundColor),'rgb(255, 255, 255)');
    await page.evaluate(()=>change('off'));
    await page.waitForFunction(()=>getComputedStyle(document.body).backgroundColor==='rgb(255, 255, 255)');
    assert.equal(await page.inputValue('input'),'Keep me');
    assert.equal(await page.evaluate(()=>getComputedStyle(document.getElementById('host').shadowRoot.querySelector('p')).backgroundColor),'rgb(255, 255, 255)');
    await page.evaluate(()=>change('on'));
    await page.waitForFunction(()=>getComputedStyle(document.body).backgroundColor!=='rgb(255, 255, 255)');
    await page.evaluate(()=>document.getElementById('drkr-theme').remove());
    await page.waitForFunction(()=>document.getElementById('drkr-theme') && getComputedStyle(document.body).backgroundColor!=='rgb(255, 255, 255)');
    await page.evaluate(()=>document.body.classList.add('native'));
    await page.waitForFunction(()=>getComputedStyle(document.body).backgroundColor==='rgb(24, 33, 38)');
    assert.equal((await page.evaluate(()=>handler({type:'drkr-status'}))).nativeDark,true);
    assert.deepEqual(failures,[]);
    console.log(`PASS: ${name} strict CSP, document/shadow styling, Off restoration, marker recovery, and native dark preservation.`);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
