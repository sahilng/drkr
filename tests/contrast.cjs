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
    await page.setContent(`<!doctype html><html><head><style>
      body{background:white;color:#111;transition:background-color .25s,color .25s}
      .card{display:block;background:white!important;color:#222;padding:20px;transition:color .1s,background-color .25s}
      .card:hover{background:#fafafa;color:#000}.card p{color:#444;transition:color .15s}.meta{color:rgba(0,0,0,.4)}
      input{background:white!important;color:#222;transition:background-color .2s,color .2s}
      input::placeholder{color:#888;opacity:.5}#count{color:black!important}
      #move{transition:transform .3s,opacity .2s;transform:translateX(0)}#move:hover{transform:translateX(5px)}
    </style></head><body><span id="count">Jobs found</span><a class="card" id="card" style="color:inherit!important"><h1>Readable title</h1><p>Readable description</p><span class="meta">Company name</span><input placeholder="Search jobs"></a><button id="move">Animated control</button><section id="late"></section></body></html>`);
    await page.evaluate(() => {
      window.listeners=[];
      window.browser={storage:{local:{get:async()=>({settings:{mode:'on',sites:{},respectDark:true}})},onChanged:{addListener:f=>listeners.push(f)}},runtime:{onMessage:{addListener:f=>window.handler=f}}};
      window.change=mode=>listeners.forEach(f=>f({settings:{newValue:{mode,sites:{},respectDark:true}}},'local'));
    });
    for (const file of ['settings.js','colors.js','site-rules.js','content.js']) await page.evaluate(fs.readFileSync(path.join(__dirname,'../extension',file),'utf8'));
    await page.waitForFunction(()=>document.documentElement.hasAttribute('data-drkr-ready'));
    await page.waitForFunction(()=>document.getElementById('card').hasAttribute('data-drkr-node'));
    const sample = () => page.evaluate(() => {
      const css=e=>getComputedStyle(e), card=document.getElementById('card'), count=document.getElementById('count');
      const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number);
      const luminance=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
      const background=e=>{for(;e;e=e.parentElement){if(css(e).backgroundColor!=='rgba(0, 0, 0, 0)')return rgb(css(e).backgroundColor)}return [255,255,255]};
      const contrast=e=>{const bg=background(e),parts=css(e).color.match(/[\d.]+/g).map(Number),alpha=(parts[3]===undefined?1:parts[3])*Number(css(e).opacity);const x=luminance(parts.slice(0,3).map((v,i)=>v*alpha+bg[i]*(1-alpha))),y=luminance(bg);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
      return {card:css(card).backgroundColor,title:contrast(card.querySelector('h1')),description:contrast(card.querySelector('p')),meta:contrast(card.querySelector('.meta')),count:contrast(count),transition:css(document.getElementById('move')).transitionProperty};
    });
    const first=await sample();
    assert.notEqual(first.card,'rgb(255, 255, 255)','inherit!important must not preserve a white card');
    for(const key of ['title','description','meta','count'])assert.ok(first[key]>=4.5,`${key} contrast ${first[key]}`);
    assert.match(first.transition,/transform/,'Measurement guard must restore page transitions');
    await page.locator('#card').hover();
    const frames=await page.evaluate(async()=>{
      const colors=[];for(let i=0;i<24;i++){await new Promise(requestAnimationFrame);colors.push(getComputedStyle(document.getElementById('card')).backgroundColor)}return colors;
    });
    assert.ok(frames.every(c=>Math.max(...c.match(/[\d.]+/g).slice(0,3).map(Number))<100),'No light intermediate transition frames');
    const late=await page.evaluate(async()=>{
      const input=document.createElement('input');input.placeholder='New field';document.getElementById('late').append(input);
      await new Promise(requestAnimationFrame);return {bg:getComputedStyle(input).backgroundColor,marked:input.hasAttribute('data-drkr-node')};
    });
    assert.notEqual(late.bg,'rgb(255, 255, 255)','New controls must be dark on their first frame');
    await page.evaluate(()=>change('off'));
    await page.waitForFunction(()=>getComputedStyle(document.body).backgroundColor==='rgb(255, 255, 255)');
    assert.equal(await page.$eval('#card',el=>el.style.getPropertyValue('color')),'inherit');
    assert.equal(await page.$eval('#card',el=>el.style.getPropertyPriority('color')),'important');
    assert.deepEqual(failures,[]);
    console.log(`PASS: ${name} important inherited text, 4.5:1 card/count contrast, transition frames, first-frame dynamic fields, and Off restoration.`);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
