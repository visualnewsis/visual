(() => {
const script = document.currentScript;
const base = new URL('../', script.src);
const stories = [
 {slug:'bogeul-bugeul',title:'보글보글 · 부글부글',image:'pot-1.jpg'},
 {slug:'boat',title:'동동 · 둥둥',image:'boat-1.png'},
 {slug:'glow',title:'반짝 · 번쩍',image:'glow-1.png'},
 {slug:'brook',title:'졸졸졸 · 줄줄줄',image:'brook-1.png'},
 {slug:'pong',title:'퐁당 · 풍덩',image:'pong-1.png'},
 {slug:'kong',title:'콩콩 · 쿵쿵',image:'kong-1.png'},
 {slug:'bang',title:'방긋 · 빵끗',image:'bang-1.png'},
 {slug:'sallang',title:'살랑살랑 · 설렁설렁',image:'sallang-1.png'},
 {slug:'daldal',title:'달달 · 탈탈',image:'daldal-1.png'},
 {slug:'todak-tudak',title:'토닥토닥 · 투닥투닥',image:'todak-tudak-1.png'},
 {slug:'sogon-sugun',title:'소곤소곤 · 수군수군',image:'sogon-sugun-1.png'},
 {slug:'tok-tuk',title:'톡톡 · 툭툭',image:'tok-tuk-1.png'},
 {slug:'ssok-ssuk',title:'쏙 · 쑥',image:'ssok-ssuk-1.png'},
 {slug:'basak-beoseok',title:'바삭바삭 · 버석버석',image:'basak-beoseok-1.png'},
 {slug:'kkubeok',title:'꾸벅꾸벅 · 꾸벅',image:'kkubeok-1.png'},
 {slug:'omool-oomool',title:'오물오물 · 우물우물',image:'omool-oomool-1.webp?v=20261002-r3'},
 {slug:'ttong-ttoong',title:'똥똥 · 뚱뚱',image:'ttong-ttoong-1.webp?v=20261002-r3'},
 {slug:'balbal-beolbeol',title:'발발 · 벌벌',image:'balbal-beolbeol-1.webp'},
 {slug:'areun-eoreun',title:'아른아른 · 어른어른',image:'areun-eoreun-1.webp?v=20261002-r3'},
 {slug:'kkogit-kkoogit',title:'꼬깃꼬깃 · 꾸깃꾸깃',image:'kkogit-kkoogit-1.webp?v=20261002-r3'},
 {slug:'jjogeul-jjoogeul',title:'쪼글쪼글 · 쭈글쭈글',image:'jjogeul-jjoogeul-1.webp?v=20261001-r2'},
 {slug:'mallang-moolleong',title:'말랑말랑 · 물렁물렁',image:'mallang-moolleong-1.webp?v=20261003-held1'}
];
const card = story => `<li><a class="op-card" href="${new URL(story.slug + '/index.html',base).href}"><img src="${new URL('images/' + story.image,base).href}" alt="" width="1448" height="1086" loading="lazy"><h2>${story.title}<span aria-hidden="true">↗</span></h2></a></li>`;
const start = () => {
 const landing = document.querySelector('[data-op-list]');
 if(landing) landing.innerHTML=stories.map(card).join('');
 const current = script.dataset.current;
 if(current && stories.some(s=>s.slug===current)) {
 const more = document.createElement('section');
 more.className='op-more';more.setAttribute('aria-labelledby','op-more-title');
 more.innerHTML=`<div class="op-more-heading"><h2 id="op-more-title">다른<br><strong>한 끗 차이</strong><br>보러가기</h2><div class="op-nav"><button type="button" aria-label="이전 작품">←</button><button type="button" aria-label="다음 작품">→</button></div></div><ul class="op-track">${stories.filter(s=>s.slug!==current).map(card).join('')}</ul>`;
 document.querySelector('main').append(more);
 const track=more.querySelector('.op-track');
 const buttons=more.querySelectorAll('button');
 const move = direction => track.scrollBy({left:direction*(track.querySelector('li').getBoundingClientRect().width+24),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 buttons[0].addEventListener('click',()=>move(-1));buttons[1].addEventListener('click',()=>move(1));
 const update=()=>{buttons[0].disabled=track.scrollLeft<2;buttons[1].disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-2};
 track.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);requestAnimationFrame(update);
 }
};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
})();
