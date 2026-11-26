import {createConstructionScene} from './construction-scene.js?v=20261126-backhoe2';

const canvas=document.querySelector('#tower-canvas');
const stage=canvas.parentElement;
const poster=document.querySelector('#tower-poster');
const background=document.querySelector('#ground-photo');
const meter=document.querySelector('.tower-meter');
const ichonMarker=document.querySelector('#ichon-marker');
const floorLabel=document.querySelector('#floor-label');
const floorUnit=document.querySelector('.floor-unit');
const count=document.querySelector('#floor-count');
const tower=document.querySelector('#tower-view');
const runway=document.querySelector('#tower-runway');
const rideActions=document.querySelector('#ride-actions');
const rideToggle=document.querySelector('#ride-toggle');
const rideSkip=document.querySelector('#ride-skip');
const hint=document.querySelector('#descent-hint');
const slider=document.querySelector('#floor-slider');
const controls=document.querySelector('#tower-controls');
const build=document.querySelector('#build');
const work=document.querySelector('.construction');
const walk=document.querySelector('#walk-to-site');
const machineButton=document.querySelector('#machine-detail');
const foundationButton=document.querySelector('#foundation-detail');
const machineControls=document.querySelector('#machine-controls');
const machineSlider=document.querySelector('#machine-slider');
const status=document.querySelector('#build-status');
const fallbackNote=document.querySelector('#tower-fallback');
const stages=[...document.querySelectorAll('[data-floor]')];
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');

const startingFloor=Number(slider.max);
const pixelsPerFloor=14;
const travel=(startingFloor-1)*pixelsPerFloor;
let rideDistance=travel;
const phaseTimes={clear:1300,excavate:2130,rebar:3240,pour:4200,structure:5450};
const groundDuration=7000;
const ascentDuration=25000;
const endTime=groundDuration+ascentDuration;
let elevation=0;
let floors=0;
let elapsed=0;
let sceneTime=0;
let siteTime=-1;
let frame=0;
let descentFrame=0;
let skyFrame=0;
let descentStarted=0;
let stageInView=false;
let descending=false;
let descentFloor=null;
let paused=false;
let detail=false;
let detailTime=null;
let startX=null;
let available=true;
let runwayStart=0;
let stageMidpoint=0;
let lastDrivenScroll=null;
let previousFrame=null;

function collapseRunway() {
  if (!runway.hasAttribute('data-active')) return;
  const report=document.querySelector('#report');
  const anchor=report.getBoundingClientRect().top<innerHeight/2?report:tower;
  const oldTop=anchor.getBoundingClientRect().top;
  cancelAnimationFrame(skyFrame);
  skyFrame=0;
  descending=false;
  descentFloor=null;
  lastDrivenScroll=null;
  cancelAnimationFrame(descentFrame);
  descentFrame=0;
  delete runway.dataset.active;
  delete work.dataset.riding;
  rideActions.hidden=true;
  hint.hidden=true;
  window.scrollBy({top:anchor.getBoundingClientRect().top-oldTop,behavior:'instant'});
}

function hideInteraction() {
  available=false;
  cancelAnimationFrame(frame);
  cancelAnimationFrame(descentFrame);
  frame=descentFrame=0;
  if (runway.hasAttribute('data-active')) collapseRunway();
  for (const element of [canvas,meter,ichonMarker,controls,build,machineButton,foundationButton,machineControls,rideActions,hint]) {
    element.hidden=true;
  }
  poster.hidden=false;
  fallbackNote.hidden=false;
}

const scene=createConstructionScene({canvas,frame:stage,background,onLost:hideInteraction});
if (scene) {
  function render() {
    if (!available) return;
    const level=descentFloor ?? elevation;
    ichonMarker.hidden=level<39 || level>52 || (descentFloor===null && !frame && !paused && floors!==39);
    scene.render({floor:floors,elevation,siteTime,time:sceneTime,working:Boolean(frame||paused)&&elevation>0,
      descentFloor,detail,detailTime,
      wingTime:descending&&!reducedMotion.matches ? endTime+performance.now()-descentStarted : sceneTime});
  }

  const ruler=document.createElement('div');
  ruler.className='ride-ruler';
  ruler.setAttribute('aria-hidden','true');
  const marks=[1,20,39,...Array.from({length:14},(_,i)=>60+i*20)];
  for (const level of marks) {
    const mark=document.createElement('span');
    mark.textContent=level+'층';
    mark.style.top='calc(var(--ride-distance) * '+((startingFloor-level)/(startingFloor-1))+')';
    ruler.append(mark);
  }
  runway.append(ruler);
  tower.tabIndex=-1;
  runway.style.setProperty('--ride-distance',travel+'px');
  runway.style.setProperty('--five-floor-fraction',String(5/(startingFloor-1)));

  function measureRunway() {
    const headerHeight=document.querySelector('.vnh-header')?.offsetHeight ?? 0;
    runway.style.setProperty('--ride-top',headerHeight+'px');
    runwayStart=runway.getBoundingClientRect().top+window.scrollY-headerHeight;
    stageMidpoint=Math.round(stage.clientHeight*.53);
    ruler.style.top=stageMidpoint+'px';
  }

  function setAscentScroll() {
    const level=Math.max(1,elevation);
    // Headroom above the ground lets the browser climb. Newly built floors also
    // extend the article itself, leaving the full trip back down at the summit.
    const fraction=(level-1)/(startingFloor-1);
    const nextDistance=Math.round(travel*(.72+.28*fraction));
    if (rideDistance!==nextDistance) {
      rideDistance=nextDistance;
      runway.style.setProperty('--ride-distance',rideDistance+'px');
    }
    lastDrivenScroll=Math.round(runwayStart+(1-fraction)*rideDistance);
    window.scrollTo({top:lastDrivenScroll,behavior:'instant'});
    clipRuler();
  }

  function clipRuler() {
    // The graduations live in the document. Only the part beside the canvas is visible.
    const offset=window.scrollY-runwayStart-stageMidpoint;
    const top=Math.max(0,offset);
    const bottom=Math.max(0,rideDistance+24-offset-stage.clientHeight);
    ruler.style.clipPath='inset('+top+'px 0 '+bottom+'px 0)';
  }

  function enterRunway() {
    runway.dataset.active='';
    work.dataset.riding='';
    rideActions.hidden=false;
    measureRunway();
  }

  function setFloor(floor) {
    floors=floor;
    slider.value=String(floor);
    slider.setAttribute('aria-valuetext',floor===0?'지상':floor+'층');
    count.value=String(floor);
    count.hidden=floor===0;
    floorUnit.hidden=count.hidden;
    for (const button of stages) button.setAttribute('aria-pressed',String(Number(button.dataset.floor)===floor));
  }

  function setDetails() {
    const machine=detail && siteTime<phaseTimes.excavate;
    const footing=detail && !machine;
    machineButton.setAttribute('aria-pressed',String(machine));
    foundationButton.setAttribute('aria-pressed',String(footing));
    machineControls.hidden=!machine;
    stage.toggleAttribute('data-detail',detail);
  }

  function showPhase(time) {
    const phase=time<phaseTimes.clear?'기존 건물 철거'
      :time<phaseTimes.excavate?'부지 정리'
      :time<phaseTimes.rebar?'굴착과 흙막이'
      :time<phaseTimes.pour?'기초 철근'
      :time<phaseTimes.structure?'기초 콘크리트':'골조와 외장 공사';
    if (floorLabel.textContent!==phase) floorLabel.textContent=phase;
  }

  function buttonText() {
    let action='철거부터 시작';
    if (frame) action='공사 멈추기';
    else if (floors>=startingFloor) action='철거부터 다시 보기';
    else if (paused) action='공사 이어 보기';
    else if (floors>0) action='더 쌓기';
    build.firstChild.textContent=action+' ';
    build.querySelector('span').textContent=frame?'Ⅱ':'↑';
  }

  function stopBuilding() {
    if (!frame) return;
    cancelAnimationFrame(frame);
    frame=0;
    paused=true;
    const hadFocus=document.activeElement===rideToggle;
    collapseRunway();
    buttonText();
    if (hadFocus) build.focus({preventScroll:true});
  }

  // Wind and wingbeats continue while a reader stops scrolling beside a
  // flight. Pause the extra renders outside that scene or in a hidden tab.
  let lastSkyRender=0;
  function animateRestingSky(now) {
    skyFrame=0;
    if (!available || !descending || !stageInView || document.hidden ||
        reducedMotion.matches || descentFloor<4 || descentFloor>305) return;
    if (now-lastSkyRender>=1000/24) {
      render();
      lastSkyRender=now;
    }
    skyFrame=requestAnimationFrame(animateRestingSky);
  }
  function wakeSky() {
    if (!skyFrame && descending) skyFrame=requestAnimationFrame(animateRestingSky);
  }
  new IntersectionObserver(([entry])=>{
    stageInView=entry.isIntersecting;
    wakeSky();
  }).observe(stage);
  reducedMotion.addEventListener('change',wakeSky);
  document.addEventListener('visibilitychange',wakeSky);

  function updateDescent() {
    const offset=Math.min(travel,Math.max(0,window.scrollY-runwayStart));
    const level=startingFloor-offset/pixelsPerFloor;
    const displayed=Math.round(level);
    clipRuler();
    if (descentFloor===level) return;
    descentFloor=level;
    wakeSky();
    count.value=String(displayed);
    slider.value=String(displayed);
    slider.setAttribute('aria-valuetext',displayed+'층');
    for (const button of stages) button.setAttribute('aria-pressed',String(Number(button.dataset.floor)===displayed));
    sceneTime=endTime+(reducedMotion.matches?0:offset*1.5);
    hint.textContent=level===1?'1층 도착 · 계속 내리면 기사로 이어집니다':'↓ 스크롤해서 1층까지 내려가세요';
    if (level===1) status.textContent=hint.textContent;
    lastSkyRender=performance.now();
    render();
  }

  function finish() {
    frame=0;
    paused=false;
    descending=true;
    descentStarted=performance.now();
    descentFloor=null;
    if (!runway.hasAttribute('data-active')) enterRunway();
    setAscentScroll();
    hint.hidden=false;
    rideToggle.hidden=true;
    floorLabel.textContent='현재 높이';
    updateDescent();
    buttonText();
    status.textContent=startingFloor+'층에 도착했습니다. 아래로 스크롤하면 1층까지 내려갑니다.';
    tower.focus({preventScroll:true});
  }

  function floorAt(time) {
    const t=Math.max(0,Math.min(1,(time-groundDuration)/ascentDuration));
    return startingFloor*t*t*(3-2*t);
  }

  function timeAtFloor(floor) {
    if (!floor) return 0;
    const fraction=Math.min(1,floor/startingFloor);
    const t=.5-Math.sin(Math.asin(1-2*fraction)/3);
    return groundDuration+t*ascentDuration;
  }

  function selectFloor(floor,startDescent=true) {
    stopBuilding();
    collapseRunway();
    paused=false;
    detail=false;
    detailTime=null;
    elevation=floor;
    elapsed=timeAtFloor(floor);
    sceneTime=elapsed;
    siteTime=floor?phaseTimes.structure:-1;
    floorLabel.textContent=floor?'가상 모형':'철거 전';
    setFloor(floor);
    setDetails();
    buttonText();
    if (floor===startingFloor && startDescent) finish();
    else render();
  }

  function rise() {
    if (frame) {
      stopBuilding();
      status.textContent=floors?floors+'층에서 일시정지':floorLabel.textContent+' 중 일시정지';
      return;
    }
    collapseRunway();
    detail=false;
    detailTime=null;
    setDetails();
    paused=false;
    if (floors>=startingFloor) selectFloor(0);
    enterRunway();
    rideToggle.hidden=false;
    setAscentScroll();
    rideToggle.focus({preventScroll:true});
    if (reducedMotion.matches) {
      elevation=startingFloor;
      elapsed=endTime;
      siteTime=phaseTimes.structure;
      setFloor(startingFloor);
      finish();
      return;
    }
    previousFrame=null;
    function step(now) {
      if (lastDrivenScroll!==null && Math.abs(window.scrollY-lastDrivenScroll)>3) {
        stopBuilding();
        return;
      }
      elapsed=Math.min(endTime,elapsed+Math.max(0,now-(previousFrame??now)));
      previousFrame=now;
      sceneTime=elapsed;
      siteTime=Math.min(1,elapsed/groundDuration)*phaseTimes.structure;
      showPhase(siteTime);
      elevation=floorAt(elapsed);
      const next=Math.floor(elevation);
      if (next!==floors) setFloor(next);
      setAscentScroll();
      if (elapsed===endTime) finish();
      else {
        render();
        frame=requestAnimationFrame(step);
      }
    }
    frame=requestAnimationFrame(step);
    buttonText();
  }

  function inspect(foundation) {
    const isActive=detail&&(foundation?siteTime>=phaseTimes.excavate:siteTime<phaseTimes.excavate);
    if (isActive) {
      detail=false;
      detailTime=null;
    } else {
      stopBuilding();
      collapseRunway();
      detail=true;
      detailTime=0;
      machineSlider.value=0;
      elevation=0;
      siteTime=foundation?phaseTimes.pour-160:-1;
      elapsed=foundation?siteTime/phaseTimes.structure*groundDuration:0;
      sceneTime=elapsed;
      paused=foundation;
      setFloor(0);
      floorLabel.textContent=foundation?'기초 철근':'굴착기';
    }
    setDetails();
    buttonText();
    render();
  }

  canvas.hidden=false;
  poster.hidden=true;
  for (const element of [meter,controls,build,machineButton,foundationButton]) element.hidden=false;
  setFloor(0);
  render();
  new ResizeObserver(()=>{
    if (runway.hasAttribute('data-active')) {
      const offset=window.scrollY-runwayStart;
      const inDescent=descending && offset>=0 && offset<=travel;
      measureRunway();
      if (inDescent) window.scrollTo({top:runwayStart+offset,behavior:'instant'});
      if (descending) updateDescent();
      else if (frame) setAscentScroll();
    }
    render();
  }).observe(stage);

  build.addEventListener('click',rise);
  rideToggle.addEventListener('click',rise);
  rideSkip.addEventListener('click',event=>{
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (descending) selectFloor(Math.round(descentFloor),false);
    else stopBuilding();
    document.querySelector('#report').focus({preventScroll:true});
  });
  walk.addEventListener('click',event=>{
    if (!available || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (location.hash!==walk.hash) history.pushState(null,'',walk.hash);
    if (!frame && !descending) rise();
    else if (descending) {
      window.scrollTo({top:runwayStart,behavior:'instant'});
      tower.focus({preventScroll:true});
    } else setAscentScroll();
  });
  document.addEventListener('visibilitychange',()=>{previousFrame=null;});
  machineButton.addEventListener('click',()=>inspect(false));
  foundationButton.addEventListener('click',()=>inspect(true));
  machineSlider.addEventListener('input',()=>{
    detailTime=Number(machineSlider.value)*34;
    render();
  });
  slider.addEventListener('input',()=>selectFloor(Number(slider.value)));
  for (const button of stages) button.addEventListener('click',()=>{
    selectFloor(Number(button.dataset.floor));
  });
  window.addEventListener('scroll',()=>{
    if (!descending || descentFrame) return;
    descentFrame=requestAnimationFrame(()=>{
      descentFrame=0;
      updateDescent();
    });
  },{passive:true});
  canvas.addEventListener('pointerdown',event=>{
    if (!detail || !event.isPrimary) return;
    startX=event.clientX;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if (startX===null || !detail) return;
    scene.rotate((event.clientX-startX)*.005);
    startX=event.clientX;
    render();
  });
  for (const event of ['pointerup','pointercancel','lostpointercapture']) {
    canvas.addEventListener(event,()=>{startX=null;});
  }
} else {
  fallbackNote.hidden=false;
}
