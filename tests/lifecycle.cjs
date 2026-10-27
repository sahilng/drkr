const {launch,name}=require('./browser-launch.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await launch();
 try{
  const page=await browser.newPage();const failures=[];
  page.on('console',m=>{if(m.text().startsWith('drkr could not'))failures.push(m.text())});
  await page.route('https://lifecycle.test/**',r=>r.fulfill(r.request().url().endsWith('late.css')
   ?{contentType:'text/css',body:'#late{background:white;color:black}'}
   :{contentType:'text/html',body:`<!doctype html><html><head><style>
   body{background:white;color:#222;font:16px system-ui}nav{padding:20px}li{list-style:none}.submenu{display:none}.submenu a{display:block;padding:12px;color:#222;background:transparent}li:hover>.submenu,li:focus-within>.submenu{display:block}li:hover>.submenu a,li:focus-within>.submenu a{background:white}.submenu a:hover,.submenu a:focus{background:#f6e2e2}#late{padding:20px}#fade{opacity:0;transition:all .6s,transform .3s}#fade.show{opacity:1}body.hydrated #late{background:#fafafa}
   </style></head><body><nav><ul><li id="parent"><a id="open" href="#">About</a><ul class="submenu"><li><a id="sub" href="#">Nested item</a></li><li><a id="sibling" href="#">Another item</a></li></ul></li></ul></nav><section id="late">Late styling</section><div id="fade">Fading menu</div></body></html>`}));
  await page.goto('https://lifecycle.test/');
  await page.evaluate(()=>{window.listeners=[];window.browser={storage:{local:{get:async()=>({settings:{mode:'on',sites:{},respectDark:true}})},onChanged:{addListener:f=>listeners.push(f)}},runtime:{onMessage:{addListener:f=>window.handler=f}}}});
  for(const f of ['settings.js','colors.js','site-rules.js','content.js'])await page.evaluate(fs.readFileSync(path.join(__dirname,'../extension',f),'utf8'));
  await page.waitForFunction(()=>document.documentElement.hasAttribute('data-drkr-ready'));
  await page.locator('#open').hover();
  await page.waitForTimeout(120);
  assert.notEqual(await page.$eval('#sibling',e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)','Opening ancestor must theme the whole submenu');
  await page.locator('#sub').hover();
  await page.waitForTimeout(120);
  assert.notEqual(await page.$eval('#sub',e=>getComputedStyle(e).backgroundColor),'rgb(246, 226, 226)','Hovered child must be themed');
  await page.locator('#open').focus();await page.locator('#sub').focus();
  await page.waitForTimeout(120);
  assert.notEqual(await page.$eval('#sub',e=>getComputedStyle(e).backgroundColor),'rgb(246, 226, 226)','Keyboard focus must be themed');
  await page.evaluate(()=>document.getElementById('fade').classList.add('show'));
  await page.waitForTimeout(100);
  const opacity=await page.$eval('#fade',e=>Number(getComputedStyle(e).opacity));
  assert.ok(opacity>0&&opacity<.95,`Non-color menu fade must not be canceled (opacity ${opacity})`);
  const hydration=await page.evaluate(async()=>{document.body.classList.add('hydrated');await Promise.resolve();await new Promise(requestAnimationFrame);return getComputedStyle(document.getElementById('late')).backgroundColor});
  assert.notEqual(hydration,'rgb(250, 250, 250)','Hydration must be themed before the next paint');
  const late=await page.evaluate(async()=>{const l=document.createElement('link');l.rel='stylesheet';l.href='/late.css';const loaded=new Promise(r=>l.onload=r);document.head.append(l);await loaded;await new Promise(requestAnimationFrame);return getComputedStyle(document.getElementById('late')).backgroundColor});
  assert.notEqual(late,'rgb(255, 255, 255)','Late stylesheet must be themed before the next paint');
  assert.deepEqual(failures,[]);
  console.log(`PASS: ${name} nested hover/focus descendants, hydration, and late stylesheets before paint.`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
