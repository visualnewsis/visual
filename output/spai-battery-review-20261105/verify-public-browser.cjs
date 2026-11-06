const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=(v,m)=>{if(!v)throw Error(m)};
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const results=[];
try{for(const slug of ['spai','smartwatch'])for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/*googletagmanager*',r=>r.abort());
 const response=await page.goto('https://visual.newsis.com/'+slug+'/',{waitUntil:'domcontentloaded'});assert(response.status()===200,'page status');
 await page.evaluate(()=>document.fonts.ready);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow');
 assert(await page.locator('link[rel=stylesheet]').all().then(async links=>(await Promise.all(links.map(x=>x.getAttribute('href')))).some(s=>s.includes('20261105-copy-ux4'))),'public asset version');
 if(slug==='spai'){
  assert((await page.locator('.hero-lead').innerText()).includes('AI 통화 평가 보도'),'published copy');
  await page.locator('#startBtn').click();for(let i=0;i<4;i++){await page.locator('.choice').first().click();await page.locator('#nextBtn').click();}
  await page.locator('#flipBtn').click();await page.waitForTimeout(650);
  assert(await page.locator('#faceBack').getAttribute('aria-hidden')==='false','public flip state');
  assert((await page.locator('.bk-foot').innerText()).includes('실제로 한 일은 반영하지 않았다'),'public report copy');
  assert(await page.locator('#flipBtn').evaluate(e=>getComputedStyle(e).animationName)==='none','public pulse removed');
  await page.evaluate(()=>window.scrollTo(0,document.querySelector('#report').offsetTop));
 }else{
  assert((await page.locator('#explode-title').innerText())==='신고 버튼부터 통화 연결까지','public watch title');
  await page.locator('#opinion-text').fill('점검 절차 확인');assert((await page.locator('#opinion-count').innerText()).startsWith('8 /'),'public counter');
  await page.locator('.ending').scrollIntoViewIfNeeded();
 }
 await page.screenshot({path:path.join(__dirname,`public-${slug}-${width}.png`)});assert(!errors.length,'public JS errors '+errors);
 results.push({slug,width,status:response.status(),pageErrors:errors,passed:true});await context.close();
 }fs.writeFileSync(path.join(__dirname,'public-browser-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
