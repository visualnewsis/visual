const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const git=process.platform==='win32'?'C:/Program Files/Git/cmd/git.exe':'git';
const base=execFileSync(git,['show','origin/main:index.html'],{cwd:require('node:path').resolve(__dirname,'../..'),encoding:'utf8'}).replace(/(src|href)="\.\//g,'$1="https://visual.newsis.com/');
const main=s=>s.match(/<main\b[\s\S]*?<\/main>/)[0];
assert.equal(main(html),main(base),'Original landing main must remain byte-identical after URL rebasing');
let json=0;
for(const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){JSON.parse(match[1]);json++;}
assert.equal((html.match(/googletagmanager.com\/gtag\/js/g)||[]).length,1);
assert(html.includes('noindex,nofollow'));
assert.equal((html.match(/id="tg-dialog"/g)||[]).length,1);
console.log('PASS: original main unchanged, '+json+' JSON-LD parsed, one analytics tag, noindex, one dialog.');
