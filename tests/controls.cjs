// Regression for Semantic UI-style background shorthands and custom fields.
const {launch,name}=require('./browser-launch.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await launch();
 try{
  const page=await browser.newPage(); const errors=[];
  page.on('console',m=>{if(m.text().startsWith('drkr could not'))errors.push(m.text())});
  await page.setContent(`<!doctype html><html><head><style>
   body{background:white;color:#222;font:16px system-ui}.panel{padding:24px}
   .button{background:#e0e1e2 none;color:rgba(0,0,0,.6);padding:20px;border:0;transition:opacity .1s ease,background-color .1s ease,color .1s ease,box-shadow .1s ease,background .1s ease,-webkit-box-shadow .1s ease}
   .button:hover{background:#cacbcd;color:rgba(0,0,0,.8)}
   .ui.selection.dropdown{display:inline-block;min-width:220px;padding:18px;background:#fff;color:rgba(0,0,0,.87);transition:box-shadow .1s ease,width .1s ease,-webkit-box-shadow .1s ease}
   .ui.dropdown .menu{display:none;background:#fff;color:#222}.ui.dropdown.open .menu{display:block}.item:hover{background:#eee}
   </style></head><body><div class="panel"><button id="button" class="button"><span>Save</span></button><div id="mount"></div></div><div id="away">Away</div></body></html>`);
  await page.evaluate(()=>{
   window.listeners=[];window.browser={storage:{local:{get:async()=>({settings:{mode:'on',sites:{},respectDark:true}})},onChanged:{addListener:f=>listeners.push(f)}},runtime:{onMessage:{addListener:f=>window.handler=f}}};
   window.change=mode=>listeners.forEach(f=>f({settings:{newValue:{mode,sites:{},respectDark:true}}},'local'));
  });
  for(const file of ['settings.js','colors.js','site-rules.js','content.js'])await page.evaluate(fs.readFileSync(path.join(__dirname,'../extension',file),'utf8'));
  await page.waitForFunction(()=>document.documentElement.hasAttribute('data-drkr-ready'));
  const dark=color=>Math.max(...color.match(/[\d.]+/g).slice(0,3).map(Number))<110;
  const frames=[];
  for(let pass=0;pass<3;pass++){
   await page.locator('#button span').hover();
   frames.push(...await page.evaluate(async()=>{const out=[];for(let i=0;i<12;i++){await new Promise(requestAnimationFrame);out.push(getComputedStyle(document.getElementById('button')).backgroundColor)}return out}));
   await page.locator('#away').hover();
   frames.push(...await page.evaluate(async()=>{const out=[];for(let i=0;i<12;i++){await new Promise(requestAnimationFrame);out.push(getComputedStyle(document.getElementById('button')).backgroundColor)}return out}));
  }
  const first=await page.evaluate(async()=>{
   const mount=document.getElementById('mount');
   mount.innerHTML='<div id="custom" class="ui selection dropdown"><span>Select function</span><div class="menu"><div class="item">Engineering</div></div></div>';
   const frames=[];for(let i=0;i<18;i++){await new Promise(requestAnimationFrame);frames.push(getComputedStyle(document.getElementById('custom')).backgroundColor)}return frames;
  });
  console.log(JSON.stringify({browser:name,lightButtonFrames:frames.filter(c=>!dark(c)).length,customFrames:[...new Set(first)]}));
  assert.ok(frames.every(dark),'Shorthand transitions must never persist a light button background');
  assert.ok(first.every(dark),'Custom selection fields must be dark on every frame');
  assert.equal(new Set(first).size,1,'Custom fields must not change shade from fallback to settled theme');
  await page.evaluate(()=>document.getElementById('custom').classList.add('open'));
  await page.waitForTimeout(100);
  assert.ok(dark(await page.$eval('.menu',e=>getComputedStyle(e).backgroundColor)),'Opened menu must be dark');
  await page.evaluate(()=>change('off'));
  await page.waitForFunction(()=>getComputedStyle(document.body).backgroundColor==='rgb(255, 255, 255)');
  assert.equal(await page.$eval('#custom',e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${name} shorthand hover cycles, first-frame custom fields, menu opening, and Off restoration.`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
