const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..');
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const render=p=>p.startsWith('<a href="https://visual.newsis.com/newsmap/">')?p:esc(p);
async function main(){
 const shots=[['전국_실제화면_전체.png','01_대표_전국뉴스지도.jpg',1600,960],['용산구_실제화면.png','02_지역탐색_용산구.jpg',1600,1080],['한남동_실제화면.png','03_동네탐색_한남동.jpg',1600,1080]];
 for(const [src,dst,w,h] of shots) await sharp(path.join(__dirname,src)).resize(w,h,{fit:'contain',background:'#faf9f5'}).jpeg({quality:96,chromaSubsampling:'4:4:4'}).toFile(path.join(root,dst));
 const screenshot=await sharp(path.join(__dirname,'한남동_실제화면.png')).resize(680,630,{fit:'contain',background:'#faf9f5'}).png().toBuffer();
 const svg=`<svg width="1600" height="1200" xmlns="http://www.w3.org/2000/svg"><style>text{font-family:'Malgun Gothic',sans-serif} .label{fill:#008f9f;font-weight:700;font-size:24px}.title{fill:#142c32;font-weight:700;font-size:64px}.step{fill:#142c32;font-size:34px;font-weight:700}.body{fill:#51666b;font-size:25px}</style><rect width="1600" height="1200" fill="#faf9f5"/><rect x="64" y="64" width="72" height="7" rx="3" fill="#00a8b5"/><text x="64" y="118" class="label">VISUAL NEWSIS · 여기뉴스 이용 안내</text><text x="64" y="218" class="title">궁금한 곳을 고르면,</text><text x="64" y="298" class="title">그곳의 뉴스가 보입니다.</text><rect x="64" y="370" width="710" height="630" rx="24" fill="#e5efed"/><image x="79" y="370" width="680" height="630" href="data:image/png;base64,${screenshot.toString('base64')}"/>${[
 ['01','궁금한 지역 고르기','지도 위 원을 누르거나','지역 이름을 검색하세요.'],
 ['02','보고 싶은 기간 고르기','24시간·7일·30일 등','기사 기간을 바꿔보세요.'],
 ['03','제목 누르고 원문 읽기','관심 있는 기사를 누르면','뉴시스 원문으로 연결됩니다.']
 ].map((r,i)=>{let y=430+i*195;return `<circle cx="853" cy="${y-10}" r="30" fill="#008f9f"/><text x="853" y="${y-1}" text-anchor="middle" fill="white" font-size="23" font-weight="700">${r[0]}</text><text x="906" y="${y}" class="step">${r[1]}</text><text x="906" y="${y+48}" class="body">${r[2]}</text><text x="906" y="${y+85}" class="body">${r[3]}</text>`}).join('')}<path d="M64 1050H1536" stroke="#ccd9d6"/><text x="64" y="1111" fill="#008f9f" font-size="31" font-weight="700">visual.newsis.com/newsmap/</text><text x="1536" y="1108" text-anchor="end" class="body">기획·디자인·개발 = 안재현 기자</text><text x="64" y="1155" font-size="21" fill="#687a7a">일부 수집 기사를 표시합니다. 지도 위 원은 기사 묶음의 대표 위치입니다. · 화면: 2026.10.23 캡처</text></svg>`;
 fs.writeFileSync(path.join(__dirname,'이용안내.svg'),svg);
 await sharp(Buffer.from(svg)).jpeg({quality:96,chromaSubsampling:'4:4:4'}).toFile(path.join(root,'04_세단계_이용안내.jpg'));
 const imgs=fs.readdirSync(root).filter(x=>/^0[1-4]_.*jpg$/.test(x));
 const tiles=await Promise.all(imgs.map((f,i)=>sharp(path.join(root,f)).resize(760,520,{fit:'contain',background:'#eeeae1'}).jpeg().toBuffer().then(input=>({input,left:30+(i%2)*790,top:30+Math.floor(i/2)*550}))));
 await sharp({create:{width:1610,height:1130,channels:3,background:'#eeeae1'}}).composite(tiles).jpeg({quality:92}).toFile(path.join(root,'전체이미지_미리보기.jpg'));
 const article=fs.readFileSync(path.join(root,'00_출고원고.txt'),'utf8').replace(/\r\n/g,'\n').split('────────────────────────')[0];
 const paragraphs=article.split('\n\n');
 const h=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>여기뉴스 포털 출고 미리보기</title><style>body{background:#f3f2ee;color:#183139;margin:0;font-family:'Malgun Gothic',sans-serif}main{max-width:960px;margin:40px auto;background:white;padding:48px;border-radius:20px}h1{font-size:32px;line-height:1.5}p{font-size:18px;line-height:1.95;white-space:pre-wrap}figure{margin:32px 0}img{width:100%;height:auto}figcaption{font-size:14px;color:#687b80;padding:10px 0;line-height:1.6}a{color:#008b99}header{font-weight:bold;color:#008b99} .note{padding:20px;background:#edf6f4}@media(max-width:650px){main{margin:0;padding:24px;border-radius:0}h1{font-size:25px}}</style><main><header>포털 출고 원고 · 2026.10.23</header><h1>${esc(paragraphs[0].replace('제목\n',''))}</h1><p>${esc(paragraphs[1].replace('부제\n',''))}</p><figure><img src="${imgs[0]}"><figcaption>대표 이미지 · 여기뉴스 실제 서비스 화면. 기사와 수치는 캡처 당시 기준.</figcaption></figure>${paragraphs.slice(2).map((p,i)=>`<p>${render(p.replace(/^본문\n/,''))}</p>${i===3?`<figure><img src="${imgs[1]}"><figcaption>서울 용산구를 선택한 화면. (사진=여기뉴스 화면 캡처)</figcaption></figure>`:''}${i===5?`<figure><img src="${imgs[2]}"><figcaption>서울 용산구 한남동을 선택한 화면. (사진=여기뉴스 화면 캡처)</figcaption></figure>`:''}`).join('')}<figure><img src="${imgs[3]}"><figcaption>여기뉴스 이용 안내. (그래픽=안재현 기자)</figcaption></figure><p class="note">원고: 00_출고원고.txt<br>캡션·출처·자료사진 URL: 02_사진설명과배치.txt<br>서비스: <a href="https://visual.newsis.com/newsmap/">여기뉴스 바로가기</a></p></main></html>`;
 fs.writeFileSync(path.join(root,'출고_미리보기.html'),h);
 console.log(JSON.stringify(await Promise.all(imgs.map(async f=>({file:f,...await sharp(path.join(root,f)).metadata()}))),null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
