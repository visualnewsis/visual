const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'shelter', 'images');
const out = path.join(root, 'portal', 'shelter-portal');
const jpg = path.join(root, 'portal', 'shelter-portal-jpg');
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(jpg, { recursive: true });

const mint = '#00b4c9';
const font = `'Noto Sans KR','Noto Sans CJK KR',sans-serif`;
const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const svg = (w,h,body) => Buffer.from(`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
<style>
.kr{font-family:${font}} .meta{font-size:18px;font-weight:600;letter-spacing:3.2px} .title{font-size:126px;font-weight:900;letter-spacing:-8px} .deck{font-size:34px;font-weight:400;letter-spacing:-1.2px} .question{font-size:56px;font-weight:800;letter-spacing:-3px} .choice{font-size:34px;font-weight:500;letter-spacing:-1.4px}
</style>${body}</svg>`);

function chrome(h, dark=true, no='001') {
  const c=dark?'#f5f7f7':'#15191a', m=dark?'#a8b2b4':'#687174';
  return `<text x="78" y="72" class="kr meta" fill="${c}">VISUAL NEWSIS</text><line x1="78" y1="96" x2="230" y2="96" stroke="${mint}" stroke-width="4"/><text x="260" y="72" class="kr meta" fill="${m}">편집# 003 · ${no}</text><text x="78" y="${h-48}" class="kr" font-size="17" fill="${m}">대한민국, 준비됐나요?</text><text x="${1800-78}" y="${h-48}" class="kr" font-size="17" text-anchor="end" fill="${m}">기획·디렉터 = 안재현 기자</text>`;
}

async function background(name,w,h,position='centre') {
  return sharp(path.join(src,name)).resize(w,h,{fit:'cover',position}).modulate({saturation:.72}).linear(1.02,-2).png().toBuffer();
}
async function exportBoth(image,name) {
  await image.clone().png({compressionLevel:9}).toFile(path.join(out,`${name}.png`));
  await image.clone().jpeg({quality:92,progressive:true,mozjpeg:true}).toFile(path.join(jpg,`${name}.jpg`));
}

async function panel1(){
  const w=1800,h=1900,bg=await background('window-apartment.webp',w,h,'centre');
  const overlay=svg(w,h,`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".08"/><stop offset=".48" stop-color="#000" stop-opacity=".22"/><stop offset=".72" stop-color="#030607" stop-opacity=".9"/><stop offset="1" stop-color="#030607"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/>${chrome(h,true,'001')}<text x="82" y="1240" class="kr title" fill="#f7f9f9">대한민국,</text><text x="82" y="1390" class="kr title" fill="#f7f9f9">준비됐나요?</text><line x1="86" y1="1472" x2="210" y2="1472" stroke="${mint}" stroke-width="5"/><text x="245" y="1483" class="kr deck" fill="#d5dbdc">미사일 경보 이후 5분, 대한민국은 어떻게 움직일까요.</text>`);
  await exportBoth(sharp(bg).composite([{input:overlay}]),'01-cover');
}

async function panel2(){
  const w=1800,h=2700,frameH=820,gap=40,top=120;
  const names=['hallway.webp','window-apartment.webp','seoul.webp'];
  const imgs=await Promise.all(names.map(n=>background(n,w-156,frameH,'centre')));
  const base=await sharp({create:{width:w,height:h,channels:4,background:'#070b0c'}}).composite(imgs.map((input,i)=>({input,left:78,top:top+i*(frameH+gap)}))).png().toBuffer();
  const data=[['01','집을 나서야 합니다.','엘리베이터','계단'],['02','창문 밖에서 굉음이 들립니다.','창밖을 본다','창문에서 떨어진다'],['03','밖으로 이동해야 합니다.','자동차','가까운 대피시설']];
  let body=chrome(h,true,'002');
  data.forEach((v,i)=>{const y=top+i*(frameH+gap);body+=`<defs><linearGradient id="f${i}" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".92"/></linearGradient></defs><rect x="78" y="${y}" width="1644" height="${frameH}" fill="url(#f${i})"/><text x="120" y="${y+575}" class="kr meta" fill="${mint}">${v[0]}</text><text x="120" y="${y+650}" class="kr question" fill="#f7f9f9">${esc(v[1])}</text><text x="120" y="${y+735}" class="kr choice" fill="#d6dcdd">${esc(v[2])}</text><line x1="${w/2}" y1="${y+700}" x2="${w/2}" y2="${y+758}" stroke="#7b8588"/><text x="${w/2+58}" y="${y+735}" class="kr choice" fill="#d6dcdd">${esc(v[3])}</text>`});
  await exportBoth(sharp(base).composite([{input:svg(w,h,body)}]),'02-choices');
}

async function panel3(){
  const w=1800,h=1900,bg=await background('shelter.webp',w,h,'centre');
  const overlay=svg(w,h,`<defs><linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020405" stop-opacity=".35"/><stop offset=".42" stop-color="#020405" stop-opacity=".78"/><stop offset="1" stop-color="#020405"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g3)"/>${chrome(h,true,'003')}<text x="900" y="540" class="kr" font-size="30" font-weight="500" letter-spacing="2" text-anchor="middle" fill="#9eaaad">05:00</text><text x="900" y="735" class="kr" font-size="72" font-weight="800" letter-spacing="-4" text-anchor="middle" fill="#f7f9f9">당신은 어떤 선택을</text><text x="900" y="840" class="kr" font-size="72" font-weight="800" letter-spacing="-4" text-anchor="middle" fill="#f7f9f9">하시겠습니까?</text><line x1="790" y1="945" x2="1010" y2="945" stroke="${mint}" stroke-width="5"/><text x="900" y="1080" class="kr" font-size="32" font-weight="400" letter-spacing="-.8" text-anchor="middle" fill="#bdc6c8">답은 화면 밖에 있지 않습니다.</text><text x="900" y="1135" class="kr" font-size="32" font-weight="400" letter-spacing="-.8" text-anchor="middle" fill="#bdc6c8">당신의 선택 다음에 있습니다.</text><text x="900" y="1345" class="kr" font-size="30" font-weight="700" letter-spacing="1.2" text-anchor="middle" fill="#f7f9f9">인터랙티브 체험하기</text><text x="900" y="1402" class="kr" font-size="21" font-weight="400" letter-spacing=".5" text-anchor="middle" fill="${mint}">아래 링크를 눌러 이동하세요</text>`);
  await exportBoth(sharp(bg).composite([{input:overlay}]),'03-enter');
}

async function preview(){
  const files=['01-cover.png','02-choices.png','03-enter.png'];
  const thumbs=[]; for(const f of files) thumbs.push(await sharp(path.join(out,f)).resize({width:520,height:780,fit:'inside'}).jpeg().toBuffer());
  const canvas=await sharp({create:{width:1740,height:900,channels:3,background:'#e1e5e6'}}).composite(thumbs.map((input,i)=>({input,left:30+i*570,top:55}))).jpeg().toBuffer();
  const labels=svg(1740,900,files.map((f,i)=>`<text x="${30+i*570}" y="32" font-family="${font}" font-size="18" font-weight="700" fill="#252a2b">${f}</text>`).join(''));
  await sharp(canvas).composite([{input:labels}]).jpeg({quality:90}).toFile(path.join(out,'contact-sheet.jpg'));
}

(async()=>{await panel1();await panel2();await panel3();await preview();console.log('Rendered final portal teaser package');})().catch(e=>{console.error(e);process.exit(1)});
