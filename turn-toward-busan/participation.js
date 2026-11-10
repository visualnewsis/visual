/* Personal participation. No coordinates, headings or remembrance events are stored or sent. */
(() => {
  'use strict';
  const el = id => document.getElementById(id);
  if (!el('silence-experience') || !el('from-city')) return;
  const cities = {seoul:[37.5665,126.9780],gwangju:[35.1595,126.8526],jeju:[33.4996,126.5312],london:[51.5074,-.1278],ottawa:[45.4215,-75.6972],canberra:[-35.2809,149.1300]};
  const directions = ['북쪽','북북동쪽','북동쪽','동북동쪽','동쪽','동남동쪽','남동쪽','남남동쪽','남쪽','남남서쪽','남서쪽','서남서쪽','서쪽','서북서쪽','북서쪽','북북서쪽'];
  const rad = n => n * Math.PI / 180;
  const normalize = n => (n % 360 + 360) % 360;
  function bearing(lat,lon) {
    const a=rad(lat), b=rad(35.128), d=rad(129.097-lon);
    return normalize(Math.atan2(Math.sin(d)*Math.cos(b),Math.cos(a)*Math.sin(b)-Math.sin(a)*Math.cos(b)*Math.cos(d))*180/Math.PI);
  }
  function distance(lat,lon) {
    const a=Math.sin(rad(35.128-lat)/2)**2+Math.cos(rad(lat))*Math.cos(rad(35.128))*Math.sin(rad(129.097-lon)/2)**2;
    return 6371000*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)));
  }
  let origin='서울', target=bearing(...cities.seoul), locationRequest=0, sensorSession=0;
  let listening=false, sensorTimer, staleTimer, sensorProblem='';
  const status = message => { if(el('personal-status').textContent!==message) el('personal-status').textContent=message; };
  function draw(angle) { el('direction-arrow').setAttribute('transform',`rotate(${angle.toFixed(2)} 180 160)`); }
  function showOrigin() {
    const dir=directions[Math.round(target/22.5)%16];
    el('selected-city').textContent=origin;
    el('origin-label').textContent=origin;
    el('bearing-label').textContent=dir;
    el('silence-origin').textContent=`${origin}에서 부산 유엔기념공원은 대략 ${dir}입니다.`;
    draw(target);
  }
  function stopSensor(message) {
    const wasActive=listening || el('use-compass').disabled;
    sensorSession++;
    document.querySelector('.direction-drawing').classList.remove('is-compass');
    window.removeEventListener('deviceorientationabsolute',onOrientation);
    window.removeEventListener('deviceorientation',onOrientation);
    clearTimeout(sensorTimer); clearTimeout(staleTimer);
    listening=false;
    el('use-compass').disabled=false;
    el('stop-compass').hidden=true;
    el('drawing-mode').textContent='북쪽을 위로 둔 방향 그림 · 실제 휴대전화 방향 아님';
    draw(target);
    if (message) status(message);
    else if(wasActive) status('방향 센서를 멈췄습니다. 북쪽 기준 그림입니다.');
  }
  let lastDraw=0;
  function onOrientation(event) {
    if (!listening) return;
    // Only Earth-referenced readings. Relative alpha must never impersonate a compass.
    let heading;
    const ios=Number.isFinite(event.webkitCompassHeading);
    if (ios) {
      if (!Number.isFinite(event.webkitCompassAccuracy) || event.webkitCompassAccuracy<0 || event.webkitCompassAccuracy>30) {
        sensorProblem='accuracy';
        document.querySelector('.direction-drawing').classList.remove('is-compass');
        el('drawing-mode').textContent='센서 보정을 기다리는 중 · 북쪽 기준 그림'; draw(target);
        status('센서 오차가 커 보정을 기다리고 있습니다. 금속에서 떨어져 휴대전화를 평평하게 들어 주세요.'); return;
      }
      heading=event.webkitCompassHeading;
    } else if (event.absolute===true && Number.isFinite(event.alpha)) heading=360-event.alpha;
    else return;
    sensorProblem='';
    clearTimeout(sensorTimer); clearTimeout(staleTimer);
    staleTimer=setTimeout(()=>stopSensor(sensorProblem==='accuracy'?'센서 오차가 계속 커 방향 측정을 껐습니다. 북쪽 기준 그림으로 확인하거나 다시 시도해 주세요.':'센서 값이 끊겼습니다. 북쪽 기준 그림으로 돌아왔습니다.'),4000);
    if (!Number.isFinite(event.beta)||!Number.isFinite(event.gamma)||Math.abs(event.beta)>25||Math.abs(event.gamma)>25) {
      document.querySelector('.direction-drawing').classList.remove('is-compass');
      el('drawing-mode').textContent='휴대전화를 평평하게 들어 주세요 · 북쪽 기준 그림';
      draw(target); status('기울어진 상태에서는 방향을 표시하지 않습니다. 화면을 위로, 휴대전화를 평평하게 들어 주세요.'); return;
    }
    if (performance.now()-lastDraw<100) return;
    lastDraw=performance.now();
    const screenAngle=window.screen?.orientation?.angle ?? window.orientation ?? 0;
    heading=normalize(heading+Number(screenAngle));
    draw(normalize(target-heading));
    document.querySelector('.direction-drawing').classList.add('is-compass');
    el('drawing-mode').textContent='화면 위쪽 = 휴대전화 위쪽 · 화살표 = 부산 쪽의 대략적인 방향';
    status(`${origin}에서 부산 쪽을 가리킵니다. 휴대전화를 평평하게 든 채 천천히 몸을 돌려 보세요. 센서와 자북·진북의 차이에 따른 오차가 있습니다.`);
  }
  el('use-compass').addEventListener('click',async()=>{
    stopSensor(); sensorProblem=''; const session=sensorSession;
    if (!window.isSecureContext || !window.DeviceOrientationEvent) { status('이 기기에서는 방향 센서를 사용할 수 없습니다. 북쪽 기준 그림으로 방향을 확인하고 묵념에 참여할 수 있습니다.'); return; }
    el('use-compass').disabled=true;
    status('방향 센서를 확인하고 있습니다. 휴대전화를 평평하게 들어 주세요.');
    el('stop-compass').hidden=false;
    try {
      if (typeof DeviceOrientationEvent.requestPermission==='function') {
        const permission=await DeviceOrientationEvent.requestPermission(true);
        if (session!==sensorSession) return;
        if (permission!=='granted') { stopSensor('방향 권한이 허용되지 않았습니다. 북쪽 기준 그림과 묵념은 그대로 이용할 수 있습니다.'); return; }
      }
      if (session!==sensorSession) return;
      listening=true;
      window.addEventListener('deviceorientationabsolute',onOrientation);
      window.addEventListener('deviceorientation',onOrientation);
      sensorTimer=setTimeout(()=>stopSensor(sensorProblem==='accuracy'?'센서 오차가 줄어들지 않아 방향 측정을 껐습니다. 북쪽 기준 그림으로 확인하거나 다시 시도해 주세요.':'절대 방향 센서 값을 받지 못했습니다. 북쪽 기준 그림으로 방향을 확인해 주세요.'),7000);
    } catch (_) { if (session===sensorSession) stopSensor('방향 센서를 켜지 못했습니다. 북쪽 기준 그림으로 계속할 수 있습니다.'); }
  });
  el('stop-compass').addEventListener('click',()=>stopSensor('방향 센서를 껐습니다. 북쪽 기준 그림입니다.'));
  el('from-city').addEventListener('change',()=>{
    locationRequest++; el('use-location').disabled=false;
    stopSensor(); origin=el('from-city').selectedOptions[0].textContent.split(' · ')[0]; target=bearing(...cities[el('from-city').value]); showOrigin();
    status('선택한 도시 중심에서 바라본 방향입니다. 실제 휴대전화 방향은 측정하지 않습니다.');
  });
  el('use-location').addEventListener('click',()=>{
    stopSensor(); const request=++locationRequest;
    if (!window.isSecureContext || !navigator.geolocation) { status('현재 위치를 사용할 수 없습니다. 가까운 도시를 선택해 주세요.'); return; }
    el('use-location').disabled=true; status('브라우저에 현재 위치를 요청했습니다. 허용하지 않아도 도시 선택으로 계속할 수 있습니다.');
    navigator.geolocation.getCurrentPosition(position=>{
      if (request!==locationRequest) return;
      el('use-location').disabled=false;
      const {latitude:lat,longitude:lon,accuracy}=position.coords;
      if (![lat,lon,accuracy].every(Number.isFinite)||accuracy>50000) { status('위치 오차가 커 방향을 정하기 어렵습니다. 가까운 도시를 선택해 주세요.'); return; }
      if (distance(lat,lon)<Math.max(1000,accuracy*2)) { status('유엔기념공원 가까이 있거나 위치 오차 범위가 공원과 겹칩니다. 여기서는 방향을 정하지 않습니다.'); return; }
      origin='내 위치';target=bearing(lat,lon);showOrigin();
      const time=new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',hour:'numeric',minute:'numeric',hour12:true}).format(new Date('2026-11-11T02:00:00Z'));
      el('local-moment').textContent=`부산의 2026년 11월 11일 오전 11시는 이 기기의 시간대 설정으로 ${time}입니다.`;
      el('moment-discovery').textContent='같은 추모 순간입니다. 시간은 위치가 아니라 기기의 시간대 설정을 따릅니다.';
      status(`현재 위치에서 계산했습니다. 북쪽 기준 약 ${Math.round(target)}° 방향입니다. 휴대전화 방향 센서를 켜거나 주변에서 북쪽을 확인해 보세요.`);
    },error=>{
      if(request!==locationRequest)return;
      el('use-location').disabled=false;
      status(error.code===1?'위치 권한이 허용되지 않았습니다. 가까운 도시를 선택해도 참여할 수 있습니다.':'현재 위치를 확인하지 못했습니다. 가까운 도시를 선택해 주세요.');
    },{enableHighAccuracy:false,timeout:12000,maximumAge:60000});
  });
  document.querySelector('.personal-direction').hidden=false;
  showOrigin();

  // The reader ends remembrance. One minute is a quiet cue, never an automatic finish.
  const section=el('remembrance'), toggle=el('silence-toggle'), end=el('silence-end');
  let state='idle',started=0,timer;
  function cue() {
    if (state==='running' && Date.now()-started>=60000) {
      el('silence-status').textContent='1분이 지났습니다. 원하면 더 머물러도 됩니다.';
    }
  }
  function finish() {
    clearTimeout(timer); state='finished'; section.dataset.state=state;document.documentElement.classList.remove('is-remembering');
    el('silence-title').textContent='묵념을 마쳤습니다.';
    el('silence-context').textContent='';
    el('silence-status').textContent='';
    toggle.hidden=true;end.hidden=true;el('silence-after').hidden=false;el('silence-title').setAttribute('tabindex','-1');el('silence-title').focus({preventScroll:true});
  }
  toggle.addEventListener('click',()=>{
    state='running';started=Date.now();section.dataset.state=state;document.documentElement.classList.add('is-remembering');
    el('silence-title').innerHTML='부산을 향해<br>묵념합니다.';
    el('silence-context').textContent='6·25전쟁 유엔참전용사의 희생과 공헌을 기억합니다.';
    el('silence-status').textContent='화면을 끄거나 눈을 감아도 됩니다. 마칠 때 돌아와 주세요.';
    el('silence-after').hidden=true;toggle.hidden=true;end.hidden=false;end.focus({preventScroll:true});section.scrollIntoView({block:'start',behavior:'instant'});
    stopSensor();locationRequest++;el('use-location').disabled=false;
    clearTimeout(timer);timer=setTimeout(cue,60000);
  });
  end.addEventListener('click',()=>{finish();});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){stopSensor();locationRequest++;el('use-location').disabled=false;}
    else cue();
  });
  window.addEventListener('pagehide',()=>{stopSensor();locationRequest++;});
  window.addEventListener('pageshow',cue);
  el('silence-experience').hidden=false;
})();
