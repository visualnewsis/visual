const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');const crypto=require('node:crypto');
const path=require('node:path');
const assert=require('node:assert/strict');
const base=process.argv[2]||'http://127.0.0.1:8792';
const output=path.join(__dirname,'arcade-quality-evidence');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const report=[];
 try{
  if(base.startsWith('https')){
   const context=await browser.newContext();
   for(const game of ['words','brickrunch','chungmuman','puzzle','dododok']){
    for(const file of ['app.js','style.css']){
     const response=await context.request.get(`${base}/arcade/${game}/${file}?verify=799bad3`);
     assert.equal(response.status(),200);
     const actual=await response.body();
     const expected=fs.readFileSync(path.join(__dirname,'arcade-quality-20261025','arcade',game,file));
     const hash=b=>crypto.createHash('sha256').update(b.toString('utf8').replace(/\r\n/g,'\n')).digest('hex');
     assert.equal(hash(actual),hash(expected),`${game}/${file}: published file mismatch`);
    }console.log(`${game}: published JS and unchanged CSS match`);
   }await context.close();
  }
  for(const [device,viewport] of [['desktop',{width:1280,height:900}],['mobile',{width:390,height:844}]]){
   const context=await browser.newContext({viewport,isMobile:device==='mobile',hasTouch:device==='mobile'});
   for(const game of ['words','brickrunch','chungmuman','puzzle','dododok']){
    const page=await context.newPage();const errors=[],failed=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)failed.push([r.status(),r.url()])});
    const res=await page.goto(`${base}/arcade/${game}/`,{waitUntil:'load'});assert.equal(res.status(),200);
    await page.evaluate(()=>document.fonts.ready);
    if(game==='words'){
     await page.locator('#game').waitFor({state:'visible'});
     assert.ok(await page.locator('.clue-button').count()>=7);
     assert.equal(await page.locator('#error').isVisible(),false);
     await page.locator('#hint').click();assert.match(await page.locator('#progress').innerText(),/\d+ \/ 7/);
     await page.locator('#board').scrollIntoViewIfNeeded();
    }else if(game==='brickrunch'){
     await page.locator('#overlayStart').click();await page.locator('#canvas').press('Space');
     await page.locator('#canvas').press('ArrowRight');await page.locator('#canvas').scrollIntoViewIfNeeded();
    }else if(game==='chungmuman'){
     await page.locator('#startButton').click();await page.locator('#stage').press('Space');
     assert.equal(await page.locator('#startPanel').isVisible(),false);await page.locator('#stage').scrollIntoViewIfNeeded();
    }else if(game==='puzzle'){
     await page.locator('#puzzleBoard .piece').first().waitFor();
     for(let i=0;i<9;i++){
      const order=await page.locator('#puzzleBoard .piece').evaluateAll(els=>els.map(el=>{const [x,y]=el.style.backgroundPosition.split(' ').map(parseFloat);return y/50*3+x/50}));
      const source=order.indexOf(i);if(source!==i){await page.locator(`#puzzleBoard [data-index="${i}"]`).click();await page.locator(`#puzzleBoard [data-index="${source}"]`).click()}
     }
     await page.locator('#result').waitFor({state:'visible'});await page.locator('#shuffleButton').click();
     assert.equal(await page.locator('#result').isVisible(),false);assert.equal(await page.locator('#moves').innerText(),'0');
     await page.waitForFunction(()=>document.querySelector('#timer').textContent!=='00:00');
     await page.locator('#puzzleBoard').scrollIntoViewIfNeeded();
    }else{
     await page.locator('#headline').filter({hasText:/.+/}).waitFor();
     await page.locator('#typingInput').press('Enter');assert.equal(await page.locator('#acquiredCount').innerText(),'0');
     await page.locator('#typingInput').fill('가');await page.locator('#typingInput').press('Enter');
     assert.equal(await page.locator('#acquiredCount').innerText(),'1');await page.locator('#typingInput').scrollIntoViewIfNeeded();
    }
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,`${device}/${game} horizontal overflow`);
    assert.deepEqual(errors,[],`${device}/${game} JS exceptions`);assert.deepEqual(failed,[],`${device}/${game} local assets`);
    await page.screenshot({path:path.join(output,`${base.startsWith('https')?'live':'local'}-${device}-${game}.png`)});
    report.push({device,game,status:'passed',errors,failed});console.log(`${device}/${game}: PASS`);await page.close();
   }await context.close();
  }
  fs.writeFileSync(path.join(output,base.startsWith('https')?'live-report.json':'local-report.json'),JSON.stringify(report,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
