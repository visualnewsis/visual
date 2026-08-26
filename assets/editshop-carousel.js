(()=>{
  const script=document.currentScript;
  const current=script?.dataset.current||"";
  const stories=[
    {slug:"oil",num:"001",meta:"호르무즈 해협",title:"호르무즈가 멈추면",image:"/oil/images/visual-01.jpg",alt:"바다 위 대형 유조선"},
    {slug:"thief",num:"002",meta:"금리와 이자",title:"이자가 범인입니다",image:"/thief/images/visual-01.png",alt:"검은 복면을 쓴 인물"},
    {slug:"shelter",num:"003",meta:"민방위 대피",title:"대한민국, 준비됐나요?",image:"/shelter/images/thumbnail-emergency-bg-v1.png",alt:"재난 경보를 표현한 도시"},
    {slug:"temperature",num:"004",meta:"폭염과 열 노출",title:"당신의 온도",image:"/temperature/images/thermometer.jpg",alt:"폭염 속 온도계"},
    {slug:"kangin",num:"005",meta:"축구와 전술",title:"120%의 이강인",image:"/kangin/images/hero.jpg",alt:"경기장에서 달리는 이강인"},
    {slug:"children",num:"006",meta:"아이와 생활권",title:"아이가 자라는 동안",image:"/children/images/children-running.jpg",alt:"함께 달리는 아이들"},
    {slug:"buy-live",num:"007",meta:"주택과 생활비",title:"이 집, 살 수 있겠습니까?",image:"/buy-live/images/hero.jpg",alt:"도시의 주택과 아파트"}
  ];
  const start=()=>{
    const section=document.querySelector("section.more,section.editshop-next");
    if(!section)return;
    const visible=stories.filter(story=>story.slug!==current);
    section.className="ves-carousel";
    section.setAttribute("aria-labelledby","ves-carousel-title");
    section.innerHTML=`<div class="ves-carousel-inner"><div class="ves-carousel-head"><div><div class="ves-carousel-kicker">편집# · MORE STORIES</div><h2 id="ves-carousel-title">다른 편집#</h2></div><div class="ves-carousel-tools"><a class="ves-carousel-all" href="/editshop/">편집# 전체 시리즈 보기 ↗</a><button class="ves-carousel-button ves-prev" type="button" aria-label="이전 편집# 보기">‹</button><button class="ves-carousel-button ves-next" type="button" aria-label="다음 편집# 보기">›</button></div></div><div class="ves-carousel-track">${visible.map(story=>`<a class="ves-carousel-card" href="/${story.slug}/"><img src="${story.image}" alt="${story.alt}" loading="lazy"><span class="ves-carousel-copy"><small>편집#${story.num} · ${story.meta}</small><strong>${story.title}</strong><i>기사 보러가기 ↗</i></span></a>`).join("")}</div></div>`;
    const track=section.querySelector(".ves-carousel-track");
    const prev=section.querySelector(".ves-prev");
    const next=section.querySelector(".ves-next");
    const update=()=>{const max=track.scrollWidth-track.clientWidth;prev.disabled=track.scrollLeft<2;next.disabled=track.scrollLeft>max-2};
    const move=direction=>{const card=track.querySelector(".ves-carousel-card");const gap=parseFloat(getComputedStyle(track).columnGap)||0;track.scrollBy({left:direction*(card.getBoundingClientRect().width+gap),behavior:"smooth"})};
    prev.addEventListener("click",()=>move(-1));
    next.addEventListener("click",()=>move(1));
    track.addEventListener("scroll",update,{passive:true});
    addEventListener("resize",update,{passive:true});
    update();
  };
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",start):start();
})();
