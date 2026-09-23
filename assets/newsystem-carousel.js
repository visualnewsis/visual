(()=>{
  const script=document.currentScript;
  const current=script?.dataset.current||"";
  const items=[
    {slug:"heat-rain",num:"001",meta:"폭염 · 폭우 · 기후재난",title:"폭염 사이 폭우, 중간이 없다",image:"/heat-rain/images/low-heat-thermal.jpg",alt:"열화상으로 촬영한 폭염 현장"},
    {slug:"adult-missing",num:"002",meta:"성인 실종 · 경찰 초동대응 · 인터랙티브",title:"사람은 사라지고 확인도 실종됐다",image:"/adult-missing/images/chapter-hero.jpg",alt:"성인 실종자를 찾는 초동 대응 화면"},
    {slug:"nepal-flood",num:"003",meta:"네팔 · 빙하 붕괴 · 기후재난",title:"마른 하늘 대홍수, 뒤집힌 재난 공식",image:"/nepal-flood/images/hero-aftermath.webp",alt:"진흙과 잔해로 뒤덮인 네팔 마을을 바라보는 주민"},
    {slug:"moreno",num:"004",meta:"축구 · 국가대표 · 인터랙티브",title:"눈 앞의 기록, 눈 안의 열망",image:"/moreno/images/taegeukgi-crowd.jpg",alt:"대형 태극기가 펼쳐진 축구 경기장 관중석"}
  ];
  const mount=host=>{
    const visible=items.filter(item=>item.slug!==current);
    const section=document.createElement("section");
    section.className="vns-carousel";
    section.setAttribute("aria-labelledby","vns-carousel-title");
    section.innerHTML=`<div class="vns-carousel-inner"><div class="vns-carousel-head"><div><div class="vns-carousel-kicker">뉴시스템 · MORE ITEMS</div><h2 id="vns-carousel-title"><em>뉴시스템</em> <span>기사 더 보기</span></h2></div><div class="vns-carousel-tools"><a class="vns-carousel-all" href="https://visual.newsis.com/newsystem/#works">뉴시스템 전체 보기 ↗</a><button class="vns-carousel-button vns-prev" type="button" aria-label="이전 뉴시스템 아이템 보기">‹</button><button class="vns-carousel-button vns-next" type="button" aria-label="다음 뉴시스템 아이템 보기">›</button></div></div><div class="vns-carousel-track">${visible.map(item=>`<a class="vns-carousel-card" href="/${item.slug}/"><img src="${item.image}" alt="${item.alt}" loading="lazy"><span class="vns-carousel-copy"><small>ITEM ${item.num} · ${item.meta}</small><strong>${item.title}</strong><i>기사 보러가기 ↗</i></span></a>`).join("")}</div></div>`;
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
