const fs = require('fs');
const path = require('path');
const root = process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(root,p),s);
function card(prefix,strip=false){return `<a class="ld-card ld-lab${strip?' ld-strip':''}" href="${prefix}goodeasy/">
      <div class="ld-copy"><span class="ld-kicker">안재현의</span><h2 class="ld-brand">굳이구지 <span>연구소</span><img src="${prefix}assets/menu-icon-goodeasy.svg" width="24" height="30" alt=""></h2><p>건반을 누르고,<br>한 음이 만들어지는 안쪽까지.</p><span class="ld-cta">연구소 들어가기 <span aria-hidden="true">↗</span></span></div>
      <img class="ld-art" src="${prefix}goodeasy/assets/landing-piano.webp" width="1672" height="941" alt="" loading="lazy" decoding="async">
    </a>`;}
let main=read('index.html');
main=main.replace('  <script defer src="./assets/visual-landing.js', '  <link rel="stylesheet" href="./assets/landing-discover.css?v=20261026-1">\n  <script defer src="./assets/visual-landing.js');
const start=main.indexOf(' <a class="vn-newsmap"');
const end=main.indexOf('\n <footer',start);
if(start<0||end<0)throw Error('Main marker');
main=main.slice(0,start)+` <nav class="landing-discover" aria-label="더 둘러보기">
    <a class="ld-card ld-map" href="./newsmap/">
      <div class="ld-copy"><span class="ld-kicker">뉴스가 빛나는 지도 · 여기뉴스</span><h2>여기 무슨<br>일 있어?</h2><p>궁금한 곳을 눌러보세요.<br>우리 동네 뉴스를 지도에서 만납니다.</p><span class="ld-cta">여기뉴스에서 찾아보기 <span aria-hidden="true">↗</span></span></div>
      <img class="ld-art" src="./newsmap/assets/here-news-thumbnail-360x240.jpg" width="360" height="240" alt="" loading="lazy" decoding="async">
    </a>
    ${card('./')}
  </nav>`+main.slice(end);
write('index.html',main);
let edit=read('editshop/index.html');
edit=edit.replace('  <style id="destination-icons-critical">','  <link rel="stylesheet" href="../assets/landing-discover.css?v=20261026-1">\n  <style id="destination-icons-critical">');
edit=edit.replace('    <section class="signature reveal"',`    <nav class="landing-discover ld-editshop" aria-label="굳이구지 연구소 둘러보기">\n    ${card('../',true)}\n    </nav>\n\n    <section class="signature reveal"`);
write('editshop/index.html',edit);
