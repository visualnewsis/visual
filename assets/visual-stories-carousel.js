(()=>{
  const script=document.currentScript;
  const current=script?.dataset.current||"";
  const stories=[
    {slug:"oil",num:"001",meta:"에너지 · 국제 · 데이터 스토리",title:"호르무즈가 멈추면",image:"/oil/images/visual-01.jpg",alt:"바다 위 대형 유조선"},
    {slug:"thief",num:"002",meta:"금리 · 가계경제 · 인터랙티브",title:"이자가 범인입니다",image:"/thief/images/visual-01.png",alt:"검은 복면을 쓴 인물"},
    {slug:"shelter",num:"003",meta:"민방위 · 재난대응 · 인터랙티브",title:"대한민국, 준비됐나요?",image:"/shelter/images/thumbnail-emergency-bg-v1.png",alt:"재난 경보를 표현한 도시"},
    {slug:"temperature",num:"004",meta:"폭염 · 열 노출 · 인터랙티브",title:"당신의 온도",image:"/temperature/images/thermometer.jpg",alt:"폭염 속 온도계"},
    {slug:"kangin",num:"005",meta:"축구 · 전술 · 인터랙티브",title:"120%의 이강인",image:"/kangin/images/hero.jpg",alt:"경기장에서 달리는 이강인"},
    {slug:"heat-rain",num:"006",meta:"폭염 · 폭우 · 기후재난",title:"폭염 사이 폭우, 중간이 없다",image:"/heat-rain/images/low-heat-thermal.jpg",alt:"열화상으로 촬영한 폭염 현장"},
    {slug:"children",num:"007",meta:"아이 · 생활권 · 인터랙티브",title:"아이가 자라는 동안",image:"/children/images/children-running.jpg",alt:"함께 달리는 아이들"},
    {slug:"buy-live",num:"008",meta:"주택 · 대출 · 생활비 · 인터랙티브",title:"이 집, 살 수 있겠습니까?",image:"/buy-live/images/hero.jpg",alt:"도시의 주택과 아파트"},
    {slug:"adult-missing",num:"009",meta:"성인 실종 · 경찰 초동대응 · 인터랙티브",title:"사람은 사라지고 확인도 실종됐다",image:"/adult-missing/images/chapter-hero.jpg",alt:"성인 실종자를 찾는 초동 대응 화면"},
    {slug:"battery",num:"010",meta:"리튬이온배터리 · 배터리 구조 · 인터랙티브",title:"한눈에 알아볼지도",image:"/battery/images/battery-model-v10.png",alt:"리튬이온배터리 내부 구조를 표현한 3D 렌더링"}
  ];
  const mount=host=>{
    const visible=stories.filter(story=>story.slug!==current);
    const section=document.createElement("section");
    section.className="vns-carousel";
    section.setAttribute("aria-labelledby","vns-carousel-title");
    section.innerHTML=`<div class="vns-carousel-inner"><div class="vns-carousel-head"><div><div class="vns-carousel-kicker">VISUAL NEWSIS · MORE STORIES</div><h2 id="vns-carousel-title"><em>비주얼 뉴시스</em> <span>더 보기</span></h2></div><div class="vns-carousel-tools"><a class="vns-carousel-all" href="/#archive-title">ALL STORIES 보기 ↗</a><button class="vns-carousel-button vns-prev" type="button" aria-label="이전 비주얼 기사 보기">‹</button><button class="vns-carousel-button vns-next" type="button" aria-label="다음 비주얼 기사 보기">›</button></div></div><div class="vns-carousel-track">${visible.map(story=>`<a class="vns-carousel-card" href="/${story.slug}/"><img src="${story.image}" alt="${story.alt}" loading="lazy"><span class="vns-carousel-copy"><small>STORY ${story.num} · ${story.meta}</small><strong>${story.title}</strong><i>기사 보러가기 ↗</i></span></a>`).join("")}</div></div>`;
    host.append(section);
    const track=section.querySelector(".vns-carousel-track");
    const prev=section.querySelector(".vns-prev");
    const next=section.querySelector(".vns-next");
    const update=()=>{const max=track.scrollWidth-track.clientWidth;prev.disabled=track.scrollLeft<2;next.disabled=track.scrollLeft>max-2};
    const move=direction=>{const card=track.querySelector(".vns-carousel-card");const gap=parseFloat(getComputedStyle(track).columnGap)||0;track.scrollBy({left:direction*(card.getBoundingClientRect().width+gap),behavior:"smooth"})};
    prev.addEventListener("click",()=>move(-1));
    next.addEventListener("click",()=>move(1));
    track.addEventListener("scroll",update,{passive:true});
    addEventListener("resize",update,{passive:true});
    update();
  };
  const start=()=>{
    const existing=document.querySelector("main");
    if(existing){mount(existing);return}
    const observer=new MutationObserver(()=>{
      const host=document.querySelector("main");
      if(host){observer.disconnect();mount(host)}
    });
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),10000);
  };
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",start):start();
})();
