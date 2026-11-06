const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');const path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
 for(const game of ['brickrunch','dododok']){
  const page=await browser.newPage({viewport:{width:1280,height:900}});const failures=[];
  page.on('requestfailed',r=>failures.push({url:r.url(),error:r.failure()?.errorText}));
  await page.goto(`https://visual.newsis.com/arcade/${game}/`,{waitUntil:'load'});
  await page.evaluate(()=>document.fonts.ready);
  const fonts=await page.evaluate(()=>({fonts:[...document.fonts].map(f=>({family:f.family,status:f.status})),heading:getComputedStyle(document.querySelector('h1')).fontFamily}));
  console.log(JSON.stringify({game,failures,fonts}));
  await page.screenshot({path:path.join(__dirname,'arcade-quality-evidence',`font-ready-${game}.png`)});await page.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
