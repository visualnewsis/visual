(function(){
  var EV=[
    {t:0,   name:"이륙",            alt:0,    key:"이륙",       note:"낮 12시25분, 나로우주센터 제2발사대. 예정 시각 그대로 떠올랐습니다."},
    {t:123, name:"1단 분리",        alt:67,   key:"1단 분리",    note:"이륙 약 123초, 고도 67km."},
    {t:233, name:"페어링 분리",     alt:224,  key:"페어링",      note:"위성을 감싸던 덮개를 벗었습니다. 고도 224km."},
    {t:268, name:"2단 분리",        alt:277,  key:"2단 분리",    note:"이후 3단 엔진으로 목표 궤도를 향합니다."},
    {t:745.7,name:"목표 고도 도달", alt:575.4,key:"궤도 도달",   note:"항우연 원격측정 기준 약 745.7초. 성공 기준은 570±15km입니다."},
    {t:761, name:"3단 엔진 연소 종료",alt:575, note:"고도 575km에서 엔진이 꺼졌습니다."},
    {t:810, name:"네온샛 2호 분리", alt:575,  key:"위성 분리 시작",note:"주탑재 초소형군집위성 5기 중 첫 번째입니다."},
    {t:847, name:"네온샛 3호 분리", alt:575,  approx:1, note:"약 35~40초 간격으로 분리됩니다. 시각은 설명용 균등 배치입니다."},
    {t:885, name:"네온샛 4호 분리", alt:575,  approx:1, note:"약 35~40초 간격. 시각은 설명용 균등 배치입니다."},
    {t:922, name:"네온샛 5호 분리", alt:575,  approx:1, note:"약 35~40초 간격. 시각은 설명용 균등 배치입니다."},
    {t:960, name:"네온샛 6호 분리", alt:575,  key:"주탑재 5기 완료",approx:1, note:"주탑재위성 5기 분리 완료. 이후 6호는 남극 세종기지와 처음 교신했습니다."},
    {t:995, name:"큐브위성 1차 사출(2기)",alt:575,key:"큐브 사출",note:"이륙 약 995초부터 두 기씩, 약 10초 간격으로 다섯 차례 사출합니다."},
    {t:1005,name:"큐브위성 2차 사출(2기)",alt:575,calc:1,note:"약 10초 간격."},
    {t:1015,name:"큐브위성 3차 사출(2기)",alt:575,calc:1,note:"약 10초 간격."},
    {t:1025,name:"큐브위성 4차 사출(2기)",alt:575,calc:1,note:"약 10초 간격."},
    {t:1035,name:"큐브위성 마지막 사출",alt:575,key:"마지막 사출",note:"10기 중 9기만 분리됐습니다. 퍼샛02는 사출관 뚜껑이 열리지 않았고, 원인은 추가 분석 중입니다."}
  ];
  var NEON=[810,847,885,922,960], CUBE=[995,1005,1015,1025,1035], TMAX=1050;
  var PTS=[[0,0],[123,67],[233,224],[268,277],[745.7,575.4],[761,575],[1035,575]];
  var X0=44,X1=620,Y0=220,YH=200,AMAX=640;
  function px(t){return X0+t/1050*(X1-X0)}
  function py(a){return Y0-a/AMAX*YH}
  function altAt(t){
    for(var i=1;i<PTS.length;i++){
      if(t<=PTS[i][0]){var a=PTS[i-1],b=PTS[i];var f=(t-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*f}
    }
    return 575;
  }
  var $=function(id){return document.getElementById(id)};
  var svgNS="http://www.w3.org/2000/svg";
  function el(n,attrs,parent){var e=document.createElementNS(svgNS,n);for(var k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}

  /* chart static parts */
  var grid=$("grid");
  [0,200,400,600].forEach(function(a){
    el("line",{x1:X0,x2:X1,y1:py(a),y2:py(a),"class":"ax"},grid);
    var t=el("text",{x:X0-6,y:py(a)+3.5,"text-anchor":"end","class":"tick"},grid);t.textContent=a;
  });
  [0,250,500,750,1000].forEach(function(s){
    var t=el("text",{x:px(s),y:238,"text-anchor":"middle","class":"tick"},grid);t.textContent=s;
  });
  var ax=el("text",{x:X1,y:256,"text-anchor":"end","class":"tick"},grid);ax.textContent="이륙 후 시간(초) · 세로축 고도(km)";
  var pts=PTS.map(function(p){return px(p[0]).toFixed(1)+","+py(p[1]).toFixed(1)}).join(" ");
  $("pBase").setAttribute("points",pts);$("pOn").setAttribute("points",pts);
  var mk=$("mk"),nMk=[],cMk=[];
  NEON.forEach(function(t){nMk.push(el("circle",{cx:px(t),cy:py(575),r:3.6,"class":"mk-n"},mk))});
  CUBE.forEach(function(t){cMk.push(el("rect",{x:px(t)-2,y:py(575)+7,width:4,height:7,"class":"mk-c"},mk))});

  /* sat grids */
  var nEl=[],cEl=[];
  for(var i=0;i<5;i++){var d=document.createElement("span");d.className="dot";$("neon").appendChild(d);nEl.push(d)}
  for(var j=0;j<10;j++){var s=document.createElement("span");s.className="sq";$("cube").appendChild(s);cEl.push(s)}

  var rng=$("rng"),cur=1050;
  function fmt(t){var s=Math.floor(t);var m=Math.floor(s/60);var r=s%60;return (m<10?"0"+m:m)+":"+(r<10?"0"+r:r)}
  function evIndex(t){var k=0;for(var i=0;i<EV.length;i++){if(EV[i].t<=t)k=i}return k}
  function lastAlt(k){for(var i=k;i>=0;i--){if(EV[i].alt!=null)return EV[i].alt}return 0}

  function render(t){
    cur=t;
    rng.value=t;
    rng.setAttribute("aria-valuetext","이륙 후 "+Math.floor(t/60)+"분 "+Math.floor(t%60)+"초");
    $("clock").innerHTML=fmt(t)+"<small>이륙 후</small>";
    var k=evIndex(t);var e=EV[k];
    $("stName").textContent=t<EV[0].t?"발사 대기":e.name;
    $("stNote").textContent=e.note+(e.approx?"":"");
    var a=lastAlt(k);
    $("altv").textContent=(a===0?"지상":(Math.round(a*10)/10)+"km")+(e.t===745.7||k===4?" (측정값)":"");
    /* chart */
    var x=px(t),y=py(altAt(t));
    $("clipR").setAttribute("width",Math.max(0,x-X0));
    $("curL").setAttribute("x1",x);$("curL").setAttribute("x2",x);
    $("curD").setAttribute("cx",x);$("curD").setAttribute("cy",y);
    /* sats */
    var nn=NEON.filter(function(v){return t>=v}).length;
    var ce=CUBE.filter(function(v){return t>=v}).length;
    var cf=Math.min(9,ce*2);
    var lost=ce===5;
    nEl.forEach(function(d,i){d.className="dot"+(i<nn?" on":"")});
    cEl.forEach(function(d,i){d.className="sq"+(i<cf?" on":"")+((lost&&i===9)?" lost":"")});
    nMk.forEach(function(m,i){m.setAttribute("class","mk-n"+(i<nn?" on":""))});
    cMk.forEach(function(m,i){m.setAttribute("class","mk-c"+(i<ce?" on":"")+((lost&&i===4)?" lost":""))});
    $("nCnt").textContent=nn+"/5";
    $("cCnt").textContent=cf+"/10";
    $("tot").textContent=(nn+cf)+" / 15";
    $("satNote").textContent=lost?"× 표시가 사출되지 않은 퍼샛02입니다. 어느 차수에서 빠졌는지는 기사에 나오지 않아 마지막 칸에 표시했습니다.":(t>=995?"큐브위성은 두 기씩 약 10초 간격으로 나갑니다.":"");
    /* chips */
    chipEls.forEach(function(c){c.el.setAttribute("aria-pressed",c.i===k?"true":"false")});
  }

  /* chips */
  var chipEls=[];
  EV.forEach(function(e,i){
    if(!e.key)return;
    var b=document.createElement("button");b.type="button";b.className="chip";b.textContent=e.key;b.setAttribute("aria-pressed","false");
    b.addEventListener("click",function(){stop();render(Math.ceil(e.t))});
    $("chips").appendChild(b);chipEls.push({el:b,i:i});
  });
  /* chip pressed state: highlight the chip of the latest key event at or before current */
  var _render=render;
  render=function(t){
    _render(t);
    var k=evIndex(t),best=-1;
    chipEls.forEach(function(c){if(c.i<=k)best=c.i});
    chipEls.forEach(function(c){c.el.setAttribute("aria-pressed",c.i===best?"true":"false")});
  };

  rng.addEventListener("input",function(){stop();render(+rng.value)});

  /* playback */
  var playing=false,raf=0,timer=0,last=0;
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function stop(){playing=false;cancelAnimationFrame(raf);clearInterval(timer);$("play").textContent="▶ 재생"}
  function start(){
    if(cur>=TMAX-1)render(0);
    playing=true;$("play").textContent="❚❚ 멈춤";
    if(reduce){
      timer=setInterval(function(){
        var k=evIndex(cur);var nx=EV[k+1];
        if(!nx){stop();return}
        render(Math.ceil(nx.t));
      },1100);
    }else{
      last=performance.now();
      var step=function(now){
        if(!playing)return;
        var dt=(now-last)/1000;last=now;
        var nt=Math.min(TMAX,cur+dt*70);
        render(nt);
        if(nt>=TMAX){stop();return}
        raf=requestAnimationFrame(step);
      };
      raf=requestAnimationFrame(step);
    }
  }
  $("play").addEventListener("click",function(){playing?stop():start()});

  /* criteria */
  var CRIT=[
    {id:"time",name:"예정 시각에 이륙",fact:"12시25분 정시 이륙. 우주청장은 &lsquo;1분도 늦지 않았다&rsquo;고 설명했습니다.",met:true,txt:"충족"},
    {id:"alt",name:"목표 고도 도달",fact:"575.4km. 성공 기준은 570±15km입니다.",met:true,txt:"충족"},
    {id:"spd",name:"목표 속도 달성",fact:"우주청 판단. 속도 수치는 기사에 나오지 않았습니다.",met:true,txt:"충족"},
    {id:"main",name:"주탑재위성 5기 분리",fact:"네온샛 5기 모두 정상 분리, 6호는 세종기지와 첫 교신.",met:true,txt:"5/5"},
    {id:"cube",name:"큐브위성 10기 모두 분리",fact:"9기 분리. 퍼샛02는 사출관 뚜껑이 열리지 않았습니다.",met:false,txt:"9/10"}
  ];
  var sel={time:false,alt:true,spd:true,main:true,cube:false};
  var critEl=$("crit");
  CRIT.forEach(function(c){
    var row=document.createElement("div");row.className="crow";row.id="r-"+c.id;
    row.innerHTML='<button class="tog" type="button" aria-pressed="false" aria-label="'+c.name+' 기준에 포함" id="t-'+c.id+'">✓</button>'+
      '<div class="t"><b>'+c.name+'</b><span>'+c.fact+'</span></div>'+
      '<span class="pill '+(c.met?"ok":"no")+'">'+(c.met?"충족 ":"미충족 ")+(c.txt==="충족"?"":c.txt)+'</span>';
    critEl.appendChild(row);
    row.querySelector(".tog").addEventListener("click",function(){sel[c.id]=!sel[c.id];paint()});
  });
  function paint(){
    var n=0,ok=0,miss=[];
    CRIT.forEach(function(c){
      var on=!!sel[c.id];
      var r=$("r-"+c.id);r.className="crow"+(on?"":" off");
      r.querySelector(".tog").setAttribute("aria-pressed",on?"true":"false");
      if(on){n++;if(c.met)ok++;else miss.push(c.name)}
    });
    var v=$("verdict");
    if(n===0){v.className="verdict";v.innerHTML='<div class="v">기준을 고르세요</div><p class="sub">하나 이상 선택하면 결과가 나옵니다.</p>';return}
    if(miss.length===0){
      v.className="verdict pass";
      v.innerHTML='<div class="v">성공</div><p>고른 '+n+'개 기준을 모두 충족했습니다.</p>'+
        '<p class="sub">우주항공청도 이 방식으로 판단했습니다. 발사체가 목표 고도와 속도를 달성하고 주탑재위성을 정상 분리했는지가 기준이고, 큐브위성은 별도 사출장치 문제로 구분한다는 설명입니다.</p>';
    }else{
      v.className="verdict fail";
      v.innerHTML='<div class="v">완전한 성공은 아님</div><p>고른 '+n+'개 중 '+ok+'개 충족. 미충족: '+miss.join(", ")+'.</p>'+
        '<p class="sub">큐브위성 10기를 모두 내보내는 것까지 임무로 보면 이번 발사는 한 기가 모자랍니다. 같은 사실이 기준에 따라 다르게 읽힙니다.</p>';
    }
  }
  function setSel(o){for(var k in sel)sel[k]=!!o[k];paint()}
  $("pGov").addEventListener("click",function(){setSel({alt:1,spd:1,main:1})});
  $("pAll").addEventListener("click",function(){setSel({time:1,alt:1,spd:1,main:1,cube:1})});

  /* history */
  var H=[
    {n:"1차",y:"2021",h:"1시간 지연, 3단 조기 종료",p:"오후 4시 예정이 5시로 늦춰졌고, 3단 엔진이 계획보다 일찍 꺼져 위성모사체를 목표 궤도에 올리지 못했습니다."},
    {n:"2차",y:"2022",h:"6월 15일 → 21일 연기",p:"1단 산화제탱크 레벨측정 센서 이상으로 미뤄졌고, 재정비 뒤 발사는 성공했습니다."},
    {n:"3차",y:"2023",h:"하루 연기",p:"5월 25일 오후 6시24분 정각 이륙했고, 큐브위성 1기가 사출되지 않은 것으로 추정됐습니다."},
    {n:"4차",y:"2025",h:"18분 지연",p:"예정일은 지켰지만 0시55분이 1시13분으로 늦춰졌습니다. 주탑재위성과 큐브위성 12기는 모두 정상 분리됐습니다."},
    {n:"5차",y:"2026",h:"처음으로 정시 이륙",p:"12시25분 확정 시각 그대로 이륙했고 위성 15기를 실었습니다. 큐브위성 1기는 분리되지 못했습니다.",cur:1}
  ];
  H.forEach(function(r){
    var d=document.createElement("div");d.className="hrow"+(r.cur?" cur":"");
    d.innerHTML='<div class="n">'+r.n+'<small>'+r.y+'</small></div><div class="d"><b>'+r.h+'</b><p>'+r.p+'</p></div>';
    $("hist").appendChild(d);
  });

  paint();
  render(1050);
})();
