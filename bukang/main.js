(function(){
  "use strict";
  var M = window.BUKANGI_MAP;
  var NS = "http://www.w3.org/2000/svg";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 보도교 4번 → 6번 방향 수로 중심선 (OSM 수로 면에서 계산) */
  var EAST_ARM = "M 805 632 C 814.7 634.8 847.7 643.5 863 649 C 878.3 654.5 886.3 658.7 897 665 C 907.7 671.3 917.5 679.0 927 687 C 936.5 695.0 946.0 703.7 954 713 C 962.0 722.3 968.8 732.3 975 743 C 981.2 753.7 987.5 765.2 991 777 C 994.5 788.8 995.3 801.8 996 814 C 996.7 826.2 995.5 838.2 995 850 C 994.5 861.8 993.3 879.2 993 885";
  var SHARK = '<path d="M -14 0 C -7 -5 7 -5 14 0 C 7 4 -7 4 -14 0 Z M -2 -3.5 L 2 -11 L 5 -3.5 Z M -14 0 L -21 -6 L -18.5 0 L -21 6 Z" fill="#1D2530" stroke="#fff" stroke-width="1.2" paint-order="stroke"/>';
  var BOAT = '<g><path d="M -9 -4 L 7 -4 L 11 0 L 7 4 L -9 4 Z" fill="#fff" stroke="#1D2530" stroke-width="1.4"/><rect x="-5" y="-2.2" width="6" height="4.4" fill="#00B4C9"/></g>';

  /* 지도 데이터 범위 밖: 철창 화면과 같은 회색으로 칠함 */
  function outside(W,H,leftFill,leftOnly){
    var G="#4B5157", LF=leftFill||G;
    if(leftOnly) return '<g class="outside" pointer-events="none">'+
      '<rect x="-6000" y="-6000" width="'+(LF===G?6000:6001.5)+'" height="'+(H+12000)+'" fill="'+LF+'"/>'+
    '</g>';
    return '<g class="outside" pointer-events="none">'+
      '<rect x="-6000" y="-6000" width="'+(LF===G?6000:6001.5)+'" height="'+(H+12000)+'" fill="'+LF+'"/>'+
      '<rect x="'+W+'" y="-6000" width="6000" height="'+(H+12000)+'" fill="'+G+'"/>'+
      '<rect x="0" y="-6000" width="'+W+'" height="6000" fill="'+G+'"/>'+
      '<rect x="0" y="'+H+'" width="'+W+'" height="6000" fill="'+G+'"/>'+
    '</g>';
  }

  /* ---------- 지도 ① 부산항 전체 ---------- */
  function wideSVG(){
    var w = M.wide;
    return '<svg viewBox="0 0 '+w.W+' '+w.H+'" preserveAspectRatio="xMidYMid meet" role="img" aria-label="부산항 전체 지도와 북항 친수공원 수로의 위치">'+
      '<defs><marker id="arrW" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#00B4C9"/></marker></defs>'+
      '<rect x="-2000" y="-2000" width="6000" height="6000" fill="var(--sea)"/>'+
      '<path d="'+w.land+'" fill="var(--land)"/>'+
      '<path d="'+w.piersA+'" fill="var(--pier)"/>'+
      '<path d="'+w.breakwater+'" fill="none" stroke="#7D8793" stroke-width="4" stroke-linecap="round"/>'+
      '<path d="'+w.bridge+'" fill="#7D8793" stroke="#7D8793" stroke-width="3"/>'+
      '<path class="canal-glow layer" d="'+w.canal+'" fill="none" stroke="#00B4C9" stroke-width="9" stroke-linejoin="round" stroke-opacity=".45" vector-effect="non-scaling-stroke"/>'+
      '<path d="'+w.canal+'" fill="var(--canal)" stroke="var(--canal)" stroke-width="2.5" vector-effect="non-scaling-stroke"/>'+
      outside(w.W,w.H)+
      /* 전체 보기 라벨 */
      '<g class="layer L-full" font-weight="700">'+
        '<text x="1060" y="960" font-size="30" fill="#6E9AB3" letter-spacing="8" class="halo-sea">부산만</text>'+
        '<text x="560" y="690" font-size="30" fill="#A99C80" letter-spacing="10">영도</text>'+
        '<text x="520" y="200" font-size="22" fill="#6E9AB3" letter-spacing="4" class="halo-sea">북항</text>'+
        '<text x="150" y="700" font-size="18" fill="#6E9AB3" letter-spacing="4" class="halo-sea">남항</text>'+
        '<line x1="615" y1="338" x2="662" y2="262" stroke="var(--ink)" stroke-width="1.5"/>'+
        '<text x="666" y="250" font-size="16" font-weight="800" class="halo">부산항대교</text>'+
      '</g>'+
      '<g class="layer L-pulse"><circle class="pulse" cx="410" cy="300" r="16" fill="none" stroke="#00B4C9" stroke-width="4"/><circle cx="410" cy="300" r="6" fill="#00B4C9"/></g>'+
      /* 북항 확대 라벨 */
      '<g class="layer L-zoom" font-weight="700">'+
        '<text x="610" y="200" font-size="13" fill="#6E9AB3" letter-spacing="3" class="halo-sea">북항</text>'+
        '<text x="560" y="640" font-size="16" fill="#A99C80" letter-spacing="6">영도</text>'+
        '<circle cx="408" cy="300" r="58" fill="none" stroke="#00B4C9" stroke-width="2" stroke-dasharray="5 4"/>'+
        '<text x="408" y="230" text-anchor="middle" font-size="12" font-weight="800" class="halo">북항 친수공원 수로</text>'+
      '</g>'+
      /* 진입 경로 미확인 */
      '<g class="layer L-entry" font-weight="900">'+
        '<path d="M 1130 770 L 990 637" fill="none" stroke="#00B4C9" stroke-width="4" stroke-dasharray="3 10" stroke-linecap="round" marker-end="url(#arrW)"/>'+
        '<text x="1118" y="812" font-size="40" fill="#00B4C9" class="halo-sea">?</text>'+
        '<path d="M 252 648 L 236 560 L 238 500 L 296 480" fill="none" stroke="#00B4C9" stroke-width="4" stroke-dasharray="3 10" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#arrW)"/>'+
        '<text x="246" y="700" font-size="40" fill="#00B4C9" class="halo-sea">?</text>'+
                '<text x="268" y="745" font-size="15" fill="var(--sub)" font-weight="700" class="halo-sea">남항 쪽</text>'+
        '<text x="1050" y="868" font-size="15" fill="var(--sub)" font-weight="700" class="halo-sea">부산만 쪽</text>'+
      '</g>'+
      /* 수로 확대 라벨 */
      '<g class="layer L-canal">'+
        '<text x="410" y="236" text-anchor="middle" font-size="5" font-weight="800" class="halo" style="stroke-width:.8px">북항 친수공원 수로</text>'+
      '</g>'+
    '</svg>';
  }

  /* ---------- 외해 설명용 전체 조망 인셋 ---------- */
  function insetSVG(id){
    var w = M.wide;
    return '<svg viewBox="200 120 1000 900" preserveAspectRatio="xMidYMid meet">'+
      '<defs><marker id="arrI'+id+'" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#00B4C9"/></marker></defs>'+
      '<rect x="-2000" y="-2000" width="6000" height="6000" fill="var(--sea)"/>'+
      /* 항만 바깥 먼바다 쪽 (경계가 아니라 방향 표시 · 땅 아래에 깔아 바다 부분만 보이게) */
      '<path d="M 1085 535 L 1200 420 L 1200 1020 L 880 1020 L 905 770 L 1000 690 L 1008 612 Z" fill="#00B4C9" fill-opacity=".16"/>'+
      '<path d="'+w.land+'" fill="var(--land)"/>'+
      '<path d="'+w.piersA+'" fill="var(--pier)"/>'+
      '<path d="'+w.breakwater+'" fill="none" stroke="#5B6673" stroke-width="9" stroke-linecap="round"/>'+
      '<path d="'+w.canal+'" fill="var(--canal)" stroke="var(--canal)" stroke-width="6"/>'+
      '<path d="M 447 300 L 1050 700" fill="none" stroke="#00B4C9" stroke-width="6" stroke-dasharray="4 14" stroke-linecap="round" marker-end="url(#arrI'+id+')"/>'+
      '<circle class="inset-canal" cx="420" cy="300" r="16" fill="#00B4C9"/>'+
      '<text x="420" y="255" text-anchor="middle" font-size="40" font-weight="900" class="halo">수로</text>'+
      '<text x="1000" y="575" text-anchor="end" font-size="36" font-weight="800" fill="#5B6673" class="halo-sea">외곽 방파제</text>'+
      '<text x="1075" y="840" text-anchor="middle" font-size="40" font-weight="900" fill="#00B4C9" class="halo-sea">먼바다 쪽</text>'+
      '<text x="560" y="690" font-size="44" font-weight="700" fill="#A99C80">영도</text>'+
    '</svg>';
  }

  /* ---------- 지도 ③ 수로 상세 ---------- */
  function parkSVG(id){
    var p = M.park;
    return '<svg viewBox="200 380 1000 1000" preserveAspectRatio="xMidYMid meet" role="img" aria-label="북항 친수공원 수로 상세도">'+
      '<defs>'+
        '<filter id="glow'+id+'" filterUnits="userSpaceOnUse" x="730" y="560" width="380" height="400"><feGaussianBlur stdDeviation="9"/></filter>'+
        '<clipPath id="clip'+id+'"><path d="'+p.land+'"/></clipPath>'+
        '<marker id="arr'+id+'" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#1D2530"/></marker>'+
        '<marker id="arrH'+id+'" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#00B4C9"/></marker>'+
      '</defs>'+
      '<rect class="sea-fill" x="-2000" y="-2000" width="6000" height="6000" fill="#B7D5E6"/>'+
      '<path d="'+p.land+'" fill="var(--land)"/>'+
      '<path d="'+p.piersA+'" fill="var(--pier)"/>'+
      '<circle cx="790" cy="850" r="180" fill="var(--site)" opacity=".7" clip-path="url(#clip'+id+')"/>'+
      '<path d="'+p.canal+'" fill="var(--canal)"/>'+
      '<path d="'+p.road+'" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/>'+
      '<path d="'+p.foot+'" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'+
      outside(p.W,p.H,"#EFEBE3",true)+   /* 수로 상세도: 왼쪽만 육지 베이지로 · 오른쪽 바다는 그대로 */
      '<path class="track" d="'+EAST_ARM+'" fill="none" stroke="none"/>'+
      /* 기본 라벨 */
      '<g class="L-base">'+
        '<text class="site-lbl" x="790" y="850" text-anchor="middle" font-size="28" font-weight="800" fill="#8A7B5C">랜드마크 부지</text>'+
        '<text class="site-lbl" x="790" y="902" text-anchor="middle" font-size="18" fill="#8A7B5C">북항 친수공원</text>'+
        '<text class="lbl-cruise" x="1085" y="560" font-size="21" font-weight="700" fill="var(--sub)" text-anchor="middle" transform="rotate(-53 1085 560)">크루즈터미널 부두</text>'+
        '<text class="lbl-bukhang" x="940" y="1250" font-size="30" font-weight="700" fill="#6E9AB3" letter-spacing="6">북항</text>'+
      '</g>'+
      /* 주요 목격 추정 구간 */
      '<g class="layer L-hot">'+
        '<path d="'+EAST_ARM+'" fill="none" stroke="#00B4C9" stroke-width="64" stroke-linecap="round" opacity=".45" filter="url(#glow'+id+')"/>'+
        '<path d="'+EAST_ARM+'" fill="none" stroke="#00B4C9" stroke-width="3" stroke-dasharray="8 7"/>'+
        '<g class="hot-label"><line x1="950" y1="750" x2="966" y2="750" stroke="#00B4C9" stroke-width="2"/>'+
        '<text x="944" y="742" text-anchor="end" font-size="22" font-weight="800" fill="#00B4C9" class="halo">주요 목격</text>'+
        '<text x="944" y="768" text-anchor="end" font-size="22" font-weight="800" fill="#00B4C9" class="halo">추정 구간</text>'+
        '<text x="944" y="788" text-anchor="end" font-size="15" fill="var(--sub)" class="halo">보도교 4~6번 일대</text></g>'+
      '</g>'+
      /* 폭 비교 */
      '<g class="layer L-width">'+
                '<text x="600" y="585" text-anchor="middle" font-size="22" font-weight="800" class="halo">수로 길이 약 1.5km</text>'+
        '<text x="600" y="608" text-anchor="middle" font-size="16" fill="var(--sub)" class="halo">평균 폭 약 35m</text>'+
        '<text x="552" y="1011" font-size="19" font-weight="700" class="halo">폭 약 30m</text>'+
        '<line x1="530" y1="1005" x2="546" y2="1005" stroke="var(--ink)" stroke-width="1.5"/>'+
        '<g stroke="var(--ink)" stroke-width="2" stroke-linecap="round"><line x1="858" y1="664" x2="869" y2="634"/><line x1="852.4" y1="661.9" x2="863.6" y2="666.1"/><line x1="863.4" y1="631.9" x2="874.6" y2="636.1"/></g>'+
        '<text x="878" y="620" font-size="19" font-weight="700" class="halo">폭 약 40~50m</text>'+
      '</g>'+
      /* 출구 */
      '<g class="layer L-exits">'+
        '<circle class="pulse" cx="996" cy="905" r="16" fill="none" stroke="#00B4C9" stroke-width="4"/>'+
        '<circle class="pulse exit2" cx="440" cy="1255" r="16" fill="none" stroke="#00B4C9" stroke-width="4"/>'+
        '<line x1="1000" y1="912" x2="1010" y2="1030" stroke="var(--ink)" stroke-width="2.5" marker-end="url(#arr'+id+')"/>'+
        '<circle cx="990" cy="1060" r="15" fill="var(--ink)"/><text x="990" y="1066" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">1</text>'+
        '<text x="966" y="1058" text-anchor="end" font-size="20" font-weight="800" class="halo-sea">남동쪽 출구</text>'+
        '<text x="966" y="1080" text-anchor="end" font-size="15" fill="var(--sub)" class="halo-sea">북항으로 열림 · 유도 목표</text>'+
        '<g class="exit2">'+
        '<line x1="438" y1="1262" x2="420" y2="1300" stroke="var(--ink)" stroke-width="2.5" marker-end="url(#arr'+id+')"/>'+
        '<circle cx="408" cy="1322" r="15" fill="var(--ink)"/><text x="408" y="1328" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">2</text>'+
        '<text x="430" y="1320" font-size="20" font-weight="800" class="halo-sea">남서쪽 출구</text>'+
        '<text x="430" y="1342" font-size="15" fill="var(--sub)" class="halo-sea">연안 쪽 수면으로 열림</text></g>'+
      '</g>'+
      /* 북항 수역 연결 */
      '<g class="layer L-sea">'+
        '<text x="760" y="1190" text-anchor="middle" font-size="32" font-weight="900" fill="#2F7BAE" class="halo-sea">북항 수역</text>'+
      '</g>'+
      /* 보도에서 말하는 외해 */
      '<g class="layer L-oehae">'+
        '<path d="M 1018 904 L 1070 904" fill="none" stroke="#00B4C9" stroke-width="3" stroke-dasharray="6 6" marker-end="url(#arrH'+id+')"/>'+
        '<circle class="pulse" cx="1092" cy="904" r="14" fill="none" stroke="#00B4C9" stroke-width="3"/>'+
        '<circle class="oehae-pt" cx="1092" cy="904" r="7" fill="#00B4C9"/>'+
        '<text x="1112" y="858" text-anchor="end" font-size="24" font-weight="900" fill="#00B4C9" class="halo-sea">보도 속 ‘외해’</text>'+
        '<text x="1112" y="880" text-anchor="end" font-size="17" fill="var(--ink)" class="halo-sea">수로 바로 바깥 북항 수역</text>'+
      '</g>'+
      /* 보도교 4·5·6 */
      '<g class="layer L-bridges">'+
        '<g stroke="var(--ink)" stroke-width="1.5"><line x1="801" y1="610" x2="801" y2="582"/><line x1="1012" y1="742" x2="1040" y2="742"/><line x1="1006" y1="902" x2="1036" y2="920"/></g>'+
        '<g font-size="13" font-weight="800">'+
          '<text x="801" y="575" text-anchor="middle" class="halo">보도교 4번</text>'+
          '<text x="1044" y="746" class="halo">보도교 5번</text>'+
          '<text class="b6 halo-sea" x="1040" y="926">보도교 6번</text>'+
        '</g>'+
        '<text x="1040" y="942" font-size="10" fill="var(--sub)" class="halo-sea">바다 쪽 마지막 다리</text>'+
      '</g>'+
      /* 29일 */
      '<g class="layer L-29">'+
        '<path class="trail" d="" fill="none" stroke="#1D2530" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-dasharray="2 5" stroke-linecap="round" opacity=".6"/>'+
        '<g class="boat b1">'+BOAT+'</g><g class="boat b2">'+BOAT+'</g>'+
        '<g class="gap layer"><path class="gap-line" d="" fill="none" stroke="#00B4C9" stroke-width="2.2"/><text class="gap-text halo" x="0" y="0" text-anchor="end" font-size="13" font-weight="900" fill="#00B4C9">보도교 6번까지 약 10~20m</text></g>'+
      '</g>'+
      '<g class="layer L-shark"><g class="shark">'+SHARK+'</g></g>'+
      '<rect class="dim layer" x="-2000" y="-2000" width="6000" height="6000" fill="#F7F5F0" fill-opacity=".42" pointer-events="none"/>'+
    '</svg>';
  }

  /* ---------- 유틸 ---------- */
  function ease(t){ return t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }
  function tween(dur, fn, done){
    if(reduce){ fn(1); if(done) done(); return function(){}; }
    var start=null, raf, stop=false;
    function frame(ts){ if(stop) return; if(!start) start=ts; var k=Math.min(1,(ts-start)/dur); fn(ease(k)); if(k<1) raf=requestAnimationFrame(frame); else if(done) done(); }
    raf=requestAnimationFrame(frame);
    return function(){ stop=true; cancelAnimationFrame(raf); };
  }
  /* 화면에서 글자가 너무 작아지지 않도록 보정 */
  function legible(svg){
    var vb=svg.viewBox.baseVal, r=svg.getBoundingClientRect(); if(!vb||!vb.width||!r.width) return;
    var s=Math.min(r.width/vb.width, r.height/vb.height);
    svg.querySelectorAll("text").forEach(function(t){
      if(!t.dataset.fs) t.dataset.fs=t.getAttribute("font-size")||"14";
      var base=+t.dataset.fs, min=base>=20?15:11;
      t.setAttribute("font-size",(base*s<min ? min/s : base).toFixed(2));
    });
  }
  function viewBoxer(svg){
    var cur=svg.getAttribute("viewBox").split(" ").map(Number), cancel=function(){};
    return function(target){
      cancel(); var from=cur.slice();
      cancel=tween(1000,function(k){ cur=from.map(function(v,i){ return v+(target[i]-v)*k; }); svg.setAttribute("viewBox",cur.join(" ")); },function(){ legible(svg); });
    };
  }
  var portrait=function(){ return window.innerHeight>window.innerWidth*1.1; };
  function show(svg, cls, on){ var n=svg.querySelector("."+cls); if(n) n.classList.toggle("on",!!on); }

  /* 수로 위 상어·선박 위치 (0 = 보도교 4번 쪽, 1 = 보도교 6번 쪽) */
  function Mover(svg,k){
    k=k||1;
    var track=svg.querySelector(".track"), L=track.getTotalLength();
    var shark=svg.querySelector(".shark"), b1=svg.querySelector(".b1"), b2=svg.querySelector(".b2"), trail=svg.querySelector(".trail");
    var st={s:.18,b1:.06,b2:-.02,dir:1}, cancel=function(){};
    function place(g,t,dir){
      var tt=Math.max(0,Math.min(1,t)), a=track.getPointAtLength(tt*L), b=track.getPointAtLength(Math.min(L,tt*L+1));
      var ang=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI + (dir<0?180:0);
      g.setAttribute("transform","translate("+a.x.toFixed(1)+" "+a.y.toFixed(1)+") rotate("+ang.toFixed(1)+") scale("+k+")");
      g.style.opacity = t<0 ? 0 : 1;
    }
    function render(){ place(shark,st.s,st.dir); place(b1,st.b1,1); place(b2,st.b2,1); }
    render();
    return {
      to:function(target,dur,done){ cancel(); var from=Object.assign({},st); st.dir=target.dir||st.dir;
        cancel=tween(dur||1600,function(k){ ["s","b1","b2"].forEach(function(key){ if(target[key]!==undefined) st[key]=from[key]+(target[key]-from[key])*k; }); render(); },done); },
      trail:function(t0,t1){ if(t0===null){ trail.setAttribute("d",""); return; }
        var d="", n=24; for(var i=0;i<=n;i++){ var p=track.getPointAtLength((t0+(t1-t0)*i/n)*L); d+=(i?"L":"M")+p.x.toFixed(1)+" "+p.y.toFixed(1)+" "; } trail.setAttribute("d",d); },
      /* 지점에 가장 가까운 수로 위치 */
      nearest:function(x,y){ var best=0,bd=1e9; for(var i=0;i<=200;i++){ var p=track.getPointAtLength(i/200*L), dd=(p.x-x)*(p.x-x)+(p.y-y)*(p.y-y); if(dd<bd){bd=dd;best=i/200;} } return best; },
      /* 머리가 기준점 앞 gap(px)에 오도록 하는 위치 */
      stopBefore:function(pt,gap){ for(var t=1;t>.5;t-=.002){ var p=nose(t); if(Math.hypot(p.x-pt.x,p.y-pt.y)>=gap) return t; } return .95; },
      /* 머리와 기준점 사이 거리 표시 */
      gap:function(pt,t){ var p=nose(t), ox=18, line=svg.querySelector(".gap-line"), tx=svg.querySelector(".gap-text");
        line.setAttribute("d","M"+(p.x+ox)+" "+p.y+" L"+(pt.x+ox)+" "+pt.y+" M"+(p.x+ox-5)+" "+p.y+" L"+(p.x+ox+5)+" "+p.y+" M"+(pt.x+ox-5)+" "+pt.y+" L"+(pt.x+ox+5)+" "+pt.y);
        tx.setAttribute("x",(p.x-16).toFixed(1)); tx.setAttribute("y",((p.y+pt.y)/2+4).toFixed(1)); }
    };
    function nose(t){
      var a=track.getPointAtLength(t*L), c=track.getPointAtLength(Math.max(0,t*L-1)), dx=a.x-c.x, dy=a.y-c.y, m=Math.hypot(dx,dy)||1;
      return {x:a.x+dx/m*14*k, y:a.y+dy/m*14*k};
    }
  }

  /* ---------- 스크롤리 A ---------- */
  var A=document.getElementById("mapA");
  var wideBox=A.querySelector(".map-wide"), parkBox=A.querySelector(".map-park");
  wideBox.innerHTML=wideSVG(); parkBox.innerHTML=parkSVG("A");
  A.querySelectorAll(".inset-map").forEach(function(el,i){ el.innerHTML=insetSVG(i); });
  var wSvg=wideBox.querySelector("svg"), pSvg=parkBox.querySelector("svg");
  var wVB=viewBoxer(wSvg), pVB=viewBoxer(pSvg), mover=Mover(pSvg,.62);
  var VB_D={ full:[0,0,1200,1092], bukhang:[260,140,620,560], entry:[150,100,1050,800], canal:[338,222,144,170],
             park:[200,380,1000,1000], east:[690,520,470,470], oehae:[200,380,1000,1000] };
  var VB_P={ full:[120,0,960,1092], bukhang:[290,150,440,520], entry:[160,120,1040,840], canal:[345,218,130,175],
             park:[370,495,690,800], east:[760,512,370,440], oehae:[480,560,690,800] };
  function VB(key){ return (portrait()?VB_P:VB_D)[key]; }
  var START=.18;
  var popSeen={}, afterTimer=null;
  var B6={x:993,y:904};                 /* 보도교 6번이 수로 중심선을 지나는 점 */
  var T5=mover.nearest(980,749);        /* 보도교 5번 위치 */
  var END=mover.stopBefore(B6,13);      /* 상어 머리가 6번 다리 약 15m(13px) 앞 */
  var stageA=A.querySelector(".stage");

  function stateA(s){
    var isPark = s.charAt(0)==="p";
    wideBox.classList.toggle("is-on",!isPark); parkBox.classList.toggle("is-on",isPark);
    stageA.classList.toggle("show-note", false);
    stageA.classList.toggle("show-inset", false); scheduleConnector();
    if(!isPark){
      wVB(s==="w2"?VB("bukhang") : s==="w3"?VB("entry") : s==="w4"?VB("canal") : VB("full"));
      show(wSvg,"L-full", s==="w0"||s==="w1"||s==="w3");
      show(wSvg,"L-pulse", s==="w1");
      show(wSvg,"L-zoom", s==="w2");
      show(wSvg,"L-entry", s==="w3");
      show(wSvg,"L-canal", s==="w4");
      show(wSvg,"canal-glow", s==="w2"||s==="w4");
      return;
    }
    var n=parseInt(s.slice(1),10);
    var zoom=n>=8;                       /* 29일 재현은 보도교 4~6번 구간 확대 */
    stageA.classList.toggle("show-note", n>=7);
    stageA.classList.toggle("show-inset", n===7); scheduleConnector();
    pVB(zoom ? VB("east") : n===7 ? VB("oehae") : VB("park"));
    pSvg.querySelectorAll(".site-lbl").forEach(function(t){ t.style.opacity = zoom ? 0 : 1; });
    show(pSvg,"dim", false);
    /* 가운데 팝업(4 살 만한 곳인가 · 5 전문가 경고): 지도를 어둡게 하고 처음 볼 때 한동안 붙잡음 */
    A.querySelectorAll(".card.popup").forEach(function(p){ p.classList.toggle("is-in", p.closest(".step").dataset.state===s); });
    var isPop=(n===4||n===5);
    stageA.classList.toggle("dark", isPop);
    if(isPop && !popSeen[n]){ popSeen[n]=true; holdUntil=Math.max(holdUntil,Date.now()+2800); }
    /* 팝업 다음 카드는 팝업이 완전히 사라진 뒤에 나타남 */
    clearTimeout(afterTimer);
    A.querySelectorAll(".after-pop-step > .card").forEach(function(c){ c.classList.remove("show"); });
    var curStep=A.querySelector('.step[data-state="'+s+'"]');
    if(curStep && curStep.classList.contains("after-pop-step")){ afterTimer=setTimeout(function(){ curStep.querySelector(".card").classList.add("show"); },600); }
    show(pSvg,"L-hot", n>=2 && n<=5);
    show(pSvg,"L-width", n===3);
    show(pSvg,"L-exits", n===7);
    show(pSvg,"L-oehae", n===7);
    var bk=pSvg.querySelector(".lbl-bukhang"); if(bk) bk.style.opacity = n===7 ? 0 : 1;
    /* 모바일 확대 장면: 화면 끝에 잘리는 크루즈터미널 표기는 숨김 */
    var cz=pSvg.querySelector(".lbl-cruise"); if(cz) cz.style.opacity = (zoom && portrait()) ? 0 : 1;
    show(pSvg,"L-bridges", zoom);
    show(pSvg,"L-29", n>=7);
    show(pSvg,"L-shark", n>=7);
    show(pSvg,"gap", n===9);
    if(n<=7){ mover.to({s:START,b1:START-.12,b2:START-.2,dir:1},n===7?900:10); mover.trail(null); }
    if(n===8){ mover.to({s:T5,b1:T5-.12,b2:T5-.2,dir:1},1800); mover.trail(null); }
    if(n===9){ mover.to({s:END,b1:END-.13,b2:END-.22,dir:1},1800); mover.trail(null); mover.gap(B6,END); }
    if(n===10){
      returnSeen=true;
      startStoryHold("return",returnStep,0);
      mover.to({s:.3,b1:END-.13,b2:END-.22,dir:-1},2600,function(){ finishStoryHold("return"); });
      mover.trail(.3,END);
    }
  }

  /* 지도 위 '보도 속 외해' 점과 전체 조망 인셋의 수로 점을 잇는 선 */
  var conn=stageA.querySelector(".connector");
  function drawConnector(){
    if(!conn) return;
    var on=stageA.classList.contains("show-inset"), inset=stageA.querySelector(".oehae-inset");
    if(!on || !inset || getComputedStyle(inset).display==="none"){ conn.classList.remove("on"); return; }
    var s=stageA.getBoundingClientRect(), a=pSvg.querySelector(".oehae-pt").getBoundingClientRect(), b=inset.querySelector(".inset-canal").getBoundingClientRect();
    var x1=a.left+a.width/2-s.left, y1=a.top+a.height/2-s.top, x2=b.left+b.width/2-s.left, y2=b.top+b.height/2-s.top;
    var ln=conn.querySelector("line"), c=conn.querySelector("circle");
    ln.setAttribute("x1",x1); ln.setAttribute("y1",y1); ln.setAttribute("x2",x2); ln.setAttribute("y2",y2);
    c.setAttribute("cx",x2); c.setAttribute("cy",y2);
    conn.classList.add("on");
  }
  var connTimers=[];
  function scheduleConnector(){ connTimers.forEach(clearTimeout); if(conn) conn.classList.remove("on"); connTimers=[setTimeout(drawConnector,650),setTimeout(drawConnector,1150)]; }
  window.addEventListener("resize",drawConnector);

  /* ---------- 스크롤리 B (결론) ---------- */
  var B=document.getElementById("mapB");
  var p2Box=B.querySelector(".map-park2"); p2Box.innerHTML=parkSVG("B");
  var qSvg=p2Box.querySelector("svg"), mover2=Mover(qSvg,1.2);
  show(qSvg,"L-shark",true); show(qSvg,"L-29",true); mover2.to({s:.3,b1:-1,b2:-1,dir:-1},10);
  var stageB=B.querySelector(".stage"), afterTimerB=null;
  function stateB(s){
    if(s==="c1" && !lastCardSeen){ lastCardSeen=true; startStoryHold("last-card",lastCardStep,0,1000); }
    show(qSvg,"L-exits", s==="c2");
    mover2.trail(null); show(qSvg,"L-bridges",false);
    /* '그래서 살 만한 곳인가?' 팝업: 지도를 어둡게 하고 처음 볼 때 한동안 붙잡음 */
    B.querySelectorAll(".card.popup").forEach(function(p){ p.classList.toggle("is-in", p.closest(".step").dataset.state===s); });
    var isPop=(s==="c0");
    stageB.classList.toggle("dark", isPop);
    if(isPop && !popSeen.c0){ popSeen.c0=true; holdUntil=Math.max(holdUntil,Date.now()+2800); }
    /* 팝업 다음 카드는 팝업이 사라진 뒤 나타남 */
    clearTimeout(afterTimerB);
    B.querySelectorAll(".after-pop-step > .card").forEach(function(c){ c.classList.remove("show"); });
    var cur=B.querySelector('.step[data-state="'+s+'"]');
    if(cur && cur.classList.contains("after-pop-step")){ afterTimerB=setTimeout(function(){ cur.querySelector(".card").classList.add("show"); },600); }
  }

  /* ---------- 사진 시퀀스 ---------- */
  function photoSeq(sec){
    var figs=sec.querySelectorAll(".ph");
    return function(i){ figs.forEach(function(f){ f.classList.toggle("is-on", f.dataset.ph===String(i)); }); };
  }

  /* ---------- 카드가 화면에 보일 때 장면 전환 ----------
     카드 윗변이 화면 높이 78% 선을 넘은 카드 가운데 마지막 카드를 기준으로 삼는다.
     (모바일처럼 카드가 아래에 놓여도 카드가 보인 뒤에 지도가 바뀐다) */
  var cards=[].slice.call(document.querySelectorAll(".step > .card, .swap-pin > .card")), active=null, ticking=false;
  var swapStep=document.querySelector(".swap-step"); var swapSeen=false, swapPinned=false;
  var cage=document.querySelector(".beat.cage");
  var voice=document.querySelector(".voice"), voiceSeen=false;
  var morph=document.querySelector(".morph:not(.merge)"), holdUntil=0, seen={}, cageSeen=false;
  var HOLD_CARD=900, HOLD_CAGE=1500;

  /* ---------- 엔딩: '외해' → '왜' 애니메이션 (엔딩 카드가 처음 보일 때 한 번 재생 · 그동안 화면을 붙잡음) ---------- */
  var endState=0;   /* 0 대기 · 1 재생 중 · 2 완료 */
  function setMorph(p){
    if(!morph) return;
    var c=function(a,b){ return Math.max(0,Math.min(1,(p-a)/(b-a))); }, g=c(0,.3), d=1-c(.3,.5), k=c(.5,.8), f=c(.75,.95);
    var col=Math.round(255-130*g)+","+Math.round(255-122*g)+","+Math.round(255-115*g);
    morph.style.setProperty("--dc","rgb("+col+")"); morph.style.setProperty("--d",d); morph.style.setProperty("--k",k); morph.style.setProperty("--f",f);
  }
  function playEnding(){
    if(endState) return; endState=1; holdUntil=Date.now()+60000;
    setTimeout(function(){ tween(2200,function(t){ setMorph(t); },function(){ endState=2; holdUntil=Date.now()+1800; }); },600);
  }
  setMorph(0);

  /* 프롤로그 GIF: 화면을 맞춘 뒤 실제 로드부터 한 주기 동안 고정한다. */
  var introGif=document.querySelector(".gif-once");
  var introSection=introGif && introGif.closest(".photo-seq");
  var introStep=introSection && introSection.querySelector('.step[data-ph="0"]');
  var gifState=0, gifTimer=0, gifLoadTimer=0, gifStyles=null;
  var gifPreview=false;
  var gifBlob=null, gifFetch=0, gifWaiting=false;
  /* GIF는 처음부터 끝까지 다 받은 뒤에만 재생한다. 덜 받은 상태로 붙이면 받은 프레임까지만 돌다 멈춘다.
     그동안 화면에는 첫 프레임 정지 이미지(src)를 보여 준다.
     서비스 CSP(img-src)가 blob: 주소를 막으므로 받은 GIF는 data: 주소로 붙인다. */
  function attachGif(){
    if(introGif.getAttribute("src")!==gifBlob) introGif.src=gifBlob;
  }
  if(introGif && window.fetch && window.FileReader){
    fetch(introGif.dataset.src).then(function(r){ return r.ok ? r.blob() : null; }).then(function(b){
      if(!b) throw 0;
      return new Promise(function(ok,no){ var fr=new FileReader(); fr.onload=function(){ ok(fr.result); }; fr.onerror=no; fr.readAsDataURL(b); });
    }).then(function(data){
      gifBlob=data; gifFetch=1;
      if(gifWaiting){ gifWaiting=false; attachGif(); }
      else if(gifState===2 && !introGif.dataset.played){ attachGif(); }
    }).catch(function(){
      gifFetch=2;
      if(gifWaiting || gifState===2){ gifWaiting=false; introGif.src=introGif.dataset.src; }
    });
  }else if(introGif){ gifFetch=2; introGif.src=introGif.dataset.src; }
  function pinGif(){
    if(gifState!==1) return;
    var top=window.scrollY+introStep.getBoundingClientRect().top;
    if(Math.abs(window.scrollY-top)>.5) window.scrollTo(0,top);
  }
  function finishGif(ok){
    if(gifState!==1) return;
    clearTimeout(gifTimer); clearTimeout(gifLoadTimer);
    introGif.removeEventListener("load",gifLoaded);
    introGif.removeEventListener("error",gifFailed);
    pinGif(); gifState=2;
    introGif.dataset.playback=ok ? "complete" : "unavailable";
    if(ok) introGif.dataset.played="1";
    var style=document.documentElement.style;
    Object.keys(gifStyles).forEach(function(key){ style[key]=gifStyles[key]; });
  }
  function gifFailed(){ finishGif(false); }
  function gifLoaded(){
    if(gifState!==1) return;
    clearTimeout(gifLoadTimer); clearTimeout(gifTimer);
    introGif.dataset.playback="playing";
    // 28프레임 × 100ms. 첫 화면이 그려지는 여유를 포함해 해제한다.
    if(!document.hidden) gifTimer=setTimeout(function(){ finishGif(true); },(+introGif.dataset.dur||2800)+150);
  }
  function replayGif(){
    clearTimeout(gifTimer); clearTimeout(gifLoadTimer);
    introGif.dataset.playback="loading";
    gifLoadTimer=setTimeout(gifFailed,20000); // 느린 모바일 회선에서도 화면이 영구 잠기지 않도록 한다.
    if(gifBlob){                                // 다 받아 둔 GIF를 붙여 처음부터 재생
      if(introGif.getAttribute("src")===gifBlob) gifLoaded(); else attachGif();
      return;
    }
    if(gifFetch===0){ gifWaiting=true; return; } // 아직 받는 중: 다 받으면 그때 붙인다
    introGif.src=introGif.dataset.src;
  }
  function containGif(){
    if(!introStep || gifPreview || gifState===2) return;
    if(!gifState && introStep.getBoundingClientRect().top < -window.innerHeight*.5){
      /* 빠른 관성 스크롤로 이미 지나쳤으면 되돌려 붙잡지 않는다 (다른 장면으로 튀는 현상 방지) */
      gifState=2; replayGif(); clearTimeout(gifLoadTimer); return;
    }
    if(!gifState && introStep.getBoundingClientRect().top<=2){
      gifState=1;
      var style=document.documentElement.style;
      gifStyles={scrollSnapType:style.scrollSnapType,scrollBehavior:style.scrollBehavior,overflow:style.overflow};
      style.scrollSnapType="none"; style.scrollBehavior="auto"; style.overflow="hidden";
      pinGif();
      introGif.addEventListener("load",gifLoaded);
      introGif.addEventListener("error",gifFailed);
      replayGif();
    }
    pinGif(); // 큰 휠 입력·터치 관성·End·스크롤바로도 다음 장면을 건너뛰지 못한다.
  }
  document.addEventListener("visibilitychange",function(){
    if(gifState!==1) return;
    clearTimeout(gifTimer);
    if(!document.hidden) replayGif();
  });
  window.addEventListener("resize",pinGif);

  /* 회귀·엔딩의 필수 장면은 관성 스크롤까지 붙잡고 완료 후 해제한다. */
  var returnStep=A.querySelector('.step[data-state="p10"]'), returnSeen=false;
  var lastCardStep=B.querySelector('.step[data-state="c1"]'), lastCardSeen=false;
  var storyHold=null, storyTimer=0;
  var popSteps=[].map.call(document.querySelectorAll(".scrolly .step"),function(st){ return st.querySelector(".card.popup") ? {step:st,done:false} : null; }).filter(Boolean);
  function touchy(){ return portrait() || ("ontouchstart" in window) || navigator.maxTouchPoints>0; }
  function pinStoryHold(){
    if(!storyHold) return;
    var top=window.scrollY+storyHold.step.getBoundingClientRect().top+window.innerHeight*storyHold.ratio;
    if(Math.abs(window.scrollY-top)>.5) window.scrollTo(0,top);
  }
  function finishStoryHold(key){
    if(!storyHold || storyHold.key!==key) return;
    pinStoryHold(); clearTimeout(storyTimer);
    var style=document.documentElement.style, saved=storyHold.styles;
    delete storyHold.step.dataset.scrollLock;
    storyHold=null;
    Object.keys(saved).forEach(function(name){ style[name]=saved[name]; });
  }
  function startStoryHold(key,step,ratio,ms){
    if(!step || storyHold ) return;
    var style=document.documentElement.style;
    storyHold={key:key,step:step,ratio:ratio,styles:{scrollSnapType:style.scrollSnapType,scrollBehavior:style.scrollBehavior,overflow:style.overflow}};
    step.dataset.scrollLock=key;
    style.scrollSnapType="none"; style.scrollBehavior="auto"; style.overflow="hidden";
    pinStoryHold();
    if(ms) storyTimer=setTimeout(function(){ finishStoryHold(key); },ms);
  }
  function beginEndingChange(){
    swapSeen=true;
    // CSS 변환 1.35초 + 변환된 질문을 읽는 시간 2초.
    startStoryHold("ending-change",swapStep,1,(reduce?0:1350)+2000);
    swapStep.classList.add("swapped");
  }
  function containStory(){
    if(storyHold){ pinStoryHold(); return; }
    if(gifState===1 || gifPreview) return;
    /* 처음 도착했을 때만 붙잡는다. 관성으로 이미 반 화면 넘게 지나쳤으면 '본 것'으로만 처리해
       뒤늦게 그 장면으로 되돌아가 튀는 일을 막는다. */
    var past=-window.innerHeight*.5;
    function gone(el){ return el && el.getBoundingClientRect().top<past; }
    if(!returnSeen && gone(returnStep)) returnSeen=true;
    if(!lastCardSeen && gone(lastCardStep)) lastCardSeen=true;
    if(!voiceSeen && gone(voice)){ voiceSeen=true; voice.classList.add("in"); }
    if(!swapPinned && gone(swapStep)) swapPinned=true;
    if(!swapSeen && swapStep && swapStep.getBoundingClientRect().top < -window.innerHeight*1.2){ swapSeen=true; swapStep.classList.add("swapped"); }
    /* 모바일: 가운데 뜨는 전문가 경고·'살 만한 곳인가' 팝업은 손가락으로 빠르게 넘겨
       관성 스크롤이 몇 화면 지나쳐 가더라도 한 번은 그 자리로 붙잡아 2.8초 보여 준다. */
    if(touchy()){
      for(var pi2=0; pi2<popSteps.length; pi2++){
        var ps=popSteps[pi2]; if(ps.done) continue;
        var pt=ps.step.getBoundingClientRect().top;
        if(pt < -window.innerHeight*3){ ps.done=true; continue; }
        if(pt<=2){ ps.done=true; active=null; startStoryHold("pop",ps.step,0,2800); return; }
      }
    }
    if(!returnSeen && returnStep && returnStep.getBoundingClientRect().top<=2){
      returnSeen=true; active=null;
      startStoryHold("return",returnStep,0); // sync에서 회귀 애니메이션을 시작한다.
    }else if(!lastCardSeen && lastCardStep && lastCardStep.getBoundingClientRect().top<=2){
      lastCardSeen=true; active=null; startStoryHold("last-card",lastCardStep,0,1000);
    }else if(voice && !voiceSeen && voice.getBoundingClientRect().top<=2){
      /* 시민들의 바람 화면: 처음 도착하면 화면을 맞춰 고정하고 인용을 읽을 시간만큼 멈춤 */
      voiceSeen=true; voice.classList.add("in"); startStoryHold("voice",voice,0,4000);
    }else if(swapStep && !swapPinned && swapStep.getBoundingClientRect().top<=2){
      swapPinned=true; startStoryHold("ending-entry",swapStep,0,1100);
    }else if(swapStep && !swapSeen && swapStep.getBoundingClientRect().top<=-window.innerHeight*.35){
      beginEndingChange();
    }
  }
  window.addEventListener("resize",pinStoryHold);

  /* ---------- 다른 장면은 처음 지나갈 때만 잠깐 붙잡음 (위로 이동 가능) ---------- */
  var touchY=null;
  function down(e){
    if(e.type==="wheel") return e.deltaY>0;
    if(e.type==="keydown") return /^(ArrowDown|PageDown| |Spacebar|End)$/.test(e.key);
    if(e.type==="touchmove"){ var y=e.touches[0].clientY, dn=touchY!==null && y<touchY; touchY=y; return dn; }
    return false;
  }
  function gate(e){
    if(gifState===1 || storyHold){
      if(e.type!=="keydown" || /^(ArrowUp|ArrowDown|PageUp|PageDown| |Spacebar|Home|End)$/.test(e.key)) e.preventDefault();
      return;
    }
    var dn=down(e); if(!dn) return;
    if(Date.now()<holdUntil) e.preventDefault();
  }
  window.addEventListener("wheel",gate,{passive:false});
  window.addEventListener("touchstart",function(e){ touchY=e.touches[0].clientY; },{passive:true});
  window.addEventListener("touchmove",gate,{passive:false});
  window.addEventListener("keydown",gate);

  /* 팝업은 자기 화면을 일정 거리 지나면 먼저 닫힘 (다음 카드가 가려진 채 지나가지 않도록) */
  function popGone(){
    if(!active || !active.classList.contains("popup")) return;
    var ps=active.closest(".step"), gone=ps.getBoundingClientRect().top < -window.innerHeight*.4;
    active.classList.toggle("is-in", !gone);
    ps.closest(".scrolly").querySelector(".stage").classList.toggle("dark", !gone);
  }
  function sync(){
    ticking=false;
    containGif(); containStory();
    /* 엔딩: 스크롤을 더 내리면 '외해'가 '왜'로 바뀜 (처음 바뀔 때 잠깐 붙잡음) */
    if(swapStep && !storyHold){
      var r=swapStep.getBoundingClientRect();
      if(!swapPinned && r.top<=2){ swapPinned=true; startStoryHold("ending-entry",swapStep,0,1100); }
      else if(!swapSeen && r.top<=-window.innerHeight*.35) beginEndingChange();
      else swapStep.classList.toggle("swapped",r.top<=-window.innerHeight*.35);
    }
    /* 시민들의 바람: 화면 가운데에 오면 큰 인용이 떠오름 (처음 한 번 붙잡음) */
    if(voice){ var vr=voice.getBoundingClientRect(), vin=vr.top < window.innerHeight*.5 && vr.bottom > window.innerHeight*.5; voice.classList.toggle("in", vin); }
    /* 철창 화면이 들어오면 창살이 위에서 내려옴 (처음 한 번만 붙잡음) */
    if(cage){ var cr=cage.getBoundingClientRect(), vh=window.innerHeight, now=cr.top < vh*.55 && cr.bottom > vh*.45; cage.classList.toggle("drop", now); if(now && !cageSeen){ cageSeen=true; holdUntil=Date.now()+HOLD_CAGE; } }
    var line=window.innerHeight*.78, pick=null, pi=-1;
    /* 카드 윗변이 78% 선을 넘었거나, 카드 전체가 화면 안에 들어왔으면(모바일 하단 카드가 스냅 위치에 멈춘 경우) 활성 */
    for(var i=0;i<cards.length;i++){
      var ci=cards[i], isPop=ci.classList.contains("popup"), cr2=isPop ? null : ci.getBoundingClientRect();
      var top=isPop ? ci.parentElement.getBoundingClientRect().top+window.innerHeight*.3 : cr2.top;
      var inView=!isPop && cr2.top < window.innerHeight && cr2.bottom <= window.innerHeight*.985;
      if(top<line || inView){ pick=ci; pi=i; } else break;
    }
    // 모바일 하단 카드도 고정한 장면과 일치하도록 유지한다.
    [returnStep,lastCardStep].forEach(function(el){
      if(!el) return;
      var r=el.getBoundingClientRect();
      if(r.top<=2 && r.bottom>window.innerHeight*.5){ pick=el.querySelector(".card"); pi=cards.indexOf(pick); }
    });
    if(storyHold){ pick=storyHold.step.querySelector(".card"); pi=cards.indexOf(pick); }
    popGone();
    if(!pick || pick===active) return;
    active=pick;
    if(!seen[pi]){ seen[pi]=true; if(window.scrollY>20) holdUntil=Math.max(holdUntil,Date.now()+HOLD_CARD); }
    var step=pick.closest(".step"), sec=step.closest("section");
    if(sec.id!=="mapA"){ A.querySelectorAll(".card.popup").forEach(function(pp){ pp.classList.remove("is-in"); }); stageA.classList.remove("dark"); }
    if(sec.id!=="mapB"){ B.querySelectorAll(".card.popup").forEach(function(pp){ pp.classList.remove("is-in"); }); stageB.classList.remove("dark"); }
    if(step.dataset.state){ (sec.id==="mapA"?stateA:stateB)(step.dataset.state); }
    else if(step.dataset.ph!==undefined){ (sec._ph||(sec._ph=photoSeq(sec)))(step.dataset.ph); }
    popGone();
  }
  /* 모바일: 지도 위로 올라가는 설명 카드를 지도 아래 영역 윗선에서 잘라 사라지게 한다.
     카드가 원래 지도와 겹쳐 서는 높이면 그 위치(멈춘 자리)부터 잘린다. 팝업 카드는 제외. */
  var clipSecs=[].slice.call(document.querySelectorAll("section.scrolly"));
  function clipCards(){
    var on=portrait();
    clipSecs.forEach(function(sec){
      var stage=sec.querySelector(".stage"), line=stage.getBoundingClientRect().bottom;
      [].forEach.call(sec.querySelectorAll(".steps > .step"),function(step){
        var st=step.getBoundingClientRect().top;
        [].forEach.call(step.children,function(el){
          if(el.classList.contains("popup") || el.classList.contains("snap-pt")) return;
          var cut=0;
          if(on && st<0){ var top=el.getBoundingClientRect().top, rest=top-st; cut=Math.max(0,Math.min(line,rest)-top); }
          var v=cut>0 ? "inset("+Math.ceil(cut)+"px -40px -40px -40px)" : "";
          if(el.style.clipPath!==v){ el.style.clipPath=v; el.style.webkitClipPath=v; }
        });
      });
    });
  }
  window.addEventListener("scroll",function(){ containGif(); containStory(); clipCards(); if(!ticking){ ticking=true; requestAnimationFrame(sync); } },{passive:true});
  window.addEventListener("resize",clipCards);
  qSvg.setAttribute("viewBox",VB("park").join(" "));
  window.addEventListener("resize",function(){ qSvg.setAttribute("viewBox",VB("park").join(" ")); [wSvg,pSvg,qSvg].forEach(legible); });
  stateA("w0"); stateB("c2");
  [wSvg,pSvg,qSvg].forEach(legible);
  sync();

})();
