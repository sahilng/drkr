// Synthetic editor fixture: no document/account content is used.
const {launch,name}=require('./browser-launch.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await launch();
 try{
  const page=await browser.newPage({viewport:{width:1000,height:800}});
  await page.setContent(`<!doctype html><html><head><style>
   body{margin:0;background:white;color:#222}#viewport{height:700px;overflow:auto}#pages{padding:20px}.row{height:28px;background:white;color:#222}.row:hover{background:#eee}.row span{display:inline-block}.row:focus span{color:red}#cursor{position:absolute;top:0;left:0}
   </style></head><body><div id="viewport"><main id="pages"></main></div><div id="cursor">Cursor</div></body></html>`);
  await page.evaluate(()=>{
   const fragment=document.createDocumentFragment();for(let i=0;i<1500;i++){const row=document.createElement('div');row.className='row';row.id=`line-${i}`;row.innerHTML=`<span>Example line ${i}</span><span> — preview</span>`;fragment.append(row)}document.getElementById('pages').append(fragment);
   window.saved={mode:'on',sites:{},respectDark:true};window.browser={storage:{local:{get:async()=>({settings:saved})},onChanged:{addListener(){}}},runtime:{onMessage:{addListener:f=>window.handler=f}}};
   window.styleReads=0;const computed=window.getComputedStyle;window.getComputedStyle=(...args)=>{window.styleReads++;return computed(...args)};
  });
  for(const file of ['settings.js','colors.js','site-rules.js','content.js'])await page.evaluate(fs.readFileSync(path.join(__dirname,'../extension',file),'utf8'));
  await page.waitForFunction(()=>document.documentElement.hasAttribute('data-drkr-ready'));
  await page.locator('#line-0 span').first().hover();await page.waitForTimeout(120);
  const before=await page.evaluate(async()=>({stats:await handler({type:'drkr-diagnostics'}),reads:styleReads}));
  await page.locator('#line-1 span').first().hover();await page.waitForTimeout(120);
  const hover=await page.evaluate(async()=>({stats:await handler({type:'drkr-diagnostics'}),reads:styleReads}));
  const beforeMotion=hover.stats.scans;
  await page.evaluate(async()=>{for(let i=0;i<12;i++){document.getElementById('pages').style.transform=`translateY(${i%2}px)`;document.getElementById('cursor').style.top=`${i}px`;await new Promise(requestAnimationFrame)}});
  await page.waitForTimeout(120);
  const motion=await page.evaluate(()=>handler({type:'drkr-diagnostics'}));
  const result={browser:name,hoverElements:hover.stats.processed,hoverStyleReads:hover.reads-before.reads,motionScans:motion.scans-beforeMotion};
  console.log(JSON.stringify(result));
  assert.ok(result.hoverElements<100,`Moving between editor lines scanned ${result.hoverElements} elements`);
  assert.ok(result.hoverStyleReads<500,`Moving between lines read styles ${result.hoverStyleReads} times`);
  assert.equal(result.motionScans,0,'Position-only editor updates must not trigger color scans');
  await page.evaluate(()=>document.getElementById('pages').style.backgroundColor='rgb(240,240,240)');
  await page.waitForTimeout(120);
  assert.notEqual(await page.$eval('#pages',e=>getComputedStyle(e).backgroundColor),'rgb(240, 240, 240)','Paint changes must still be themed');
  assert.ok((await page.evaluate(()=>handler({type:'drkr-diagnostics'}))).scans>motion.scans);
  await page.evaluate(()=>{const row=document.getElementById('line-1');row.tabIndex=0;row.firstElementChild.tabIndex=0});
  await page.locator('#line-1').focus();await page.waitForTimeout(100);
  await page.locator('#line-1 span').first().focus();await page.waitForTimeout(100);
  assert.equal(await page.locator('#line-1 span').last().evaluate(e=>getComputedStyle(e).color),'rgb(224, 224, 224)','Moving focus into a child must refresh the parent focus paint');
  const beforeScroll=await page.evaluate(()=>handler({type:'drkr-diagnostics'}));
  await page.evaluate(async()=>{
   for(let i=0;i<10;i++){
    document.dispatchEvent(new Event('scroll'));
    document.getElementById('line-2').classList.toggle('updated');
    document.getElementById('line-2').style.backgroundColor=i%2?'#fafafa':'#eee';
    await new Promise(requestAnimationFrame);
   }
  });
  assert.equal((await page.evaluate(()=>handler({type:'drkr-diagnostics'}))).scans,beforeScroll.scans,'Paint scans must wait while scrolling is active');
  await page.waitForTimeout(200);
  assert.ok((await page.evaluate(()=>handler({type:'drkr-diagnostics'}))).scans>beforeScroll.scans,'Queued paint updates must run when scrolling settles');
  assert.notEqual(await page.$eval('#line-2',e=>getComputedStyle(e).backgroundColor),'rgb(250, 250, 250)');
  await page.evaluate(async()=>{
   document.dispatchEvent(new Event('scroll'));
   window.originalRAF=requestAnimationFrame;window.requestAnimationFrame=()=>123456;
   saved.mode='off';await handler({type:'drkr-refresh-settings'});
  });
  assert.equal(await page.$eval('body',e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)','Explicit refresh must apply Off without a storage event or animation frame');
  await page.evaluate(async()=>{saved.mode='on';await handler({type:'drkr-refresh-settings'});window.requestAnimationFrame=originalRAF});
  assert.notEqual(await page.$eval('body',e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)','Explicit refresh must also apply On immediately');
  console.log(`PASS: ${name} bounded pointer updates, skipped positioning churn, and live paint changes.`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
