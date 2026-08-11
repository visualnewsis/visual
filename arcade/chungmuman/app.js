const stage=document.querySelector('#stage');
const runner=document.querySelector('#runner');
const wall=document.querySelector('#deadline');
const layer=document.querySelector('#objects');
const startPanel=document.querySelector('#startPanel');
const scoreEl=document.querySelector('#score');
const comboEl=document.querySelector('#combo');
const distanceEl=document.querySelector('#distance');
const shieldEl=document.querySelector('#shield');
const result=document.querySelector('#result');

const articles=[
  {url:'https://www.newsis.com/',label:'오늘의 주요 뉴스'},
  {url:'https://visual.newsis.com/',label:'오늘의 비주얼 뉴스'},
  {url:'https://www.newsis.com/realnews/',label:'팩트체크 뉴스'}
];

const patterns=[
  {type:'beat',label:'취재거리',action:'jump',effect:'good',wall:32},
  {type:'fake',label:'가짜뉴스',action:'slide',effect:'bad',wall:48},
  {type:'coffee',label:'커피',action:'slide',effect:'shield'},
  {type:'gap',label:'뉴스 누락',action:'jump',effect:'bad',wall:58},
  {type:'beat',label:'취재거리',action:'jump',effect:'good',wall:32},
  {type:'false-tip',label:'허위제보',action:'slide',effect:'bad',wall:58},
  {type:'scoop',label:'단독',action:'double',effect:'good',wall:68},
  {type:'wide-gap',label:'큰 뉴스 누락',action:'double',effect:'bad',wall:72}
];

let playing=false,jumpLevel=0,sliding=false,shieldUntil=0;
let score=0,combo=0,distance=0,speed=6,wallGap=92,wallMotion=0,wallMotionUntil=0;
let lastSpawn=0,lastFrame=0,patternIndex=0,raf=0,pushedTimer=0,gestureStart=null;
let objects=[];
let playerY=0,verticalVelocity=0;

function toast(message,tone=''){
  const old=stage.querySelector('.toast'); if(old) old.remove();
  const el=document.createElement('div');el.className=`toast ${tone}`;el.textContent=message;stage.append(el);
  setTimeout(()=>el.remove(),1000);
}

function jump(){
  if(!playing||sliding||jumpLevel>=2)return;
  jumpLevel+=1;runner.classList.add('is-jumping');
  if(jumpLevel===1)verticalVelocity=520;
  else{verticalVelocity=455;runner.classList.add('is-double-jumping');toast('한 번 더!','good')}
  window.gtag?.('event',jumpLevel===2?'chungmuman_double_jump':'chungmuman_jump');
}

function slide(){
  if(!playing||sliding||jumpLevel>0)return;
  sliding=true;runner.classList.add('is-sliding');
  setTimeout(()=>{sliding=false;runner.classList.remove('is-sliding')},680);
  window.gtag?.('event','chungmuman_slide');
}

function spawn(){
  const spec=patterns[patternIndex%patterns.length];patternIndex+=1;
  const el=document.createElement('div');el.className=`object ${spec.type}`;el.dataset.label=spec.label;
  if(spec.type==='gap'||spec.type==='wide-gap')el.innerHTML='<i></i><b>뉴스 누락</b>';
  else el.textContent=spec.label;
  layer.append(el);objects.push({el,x:stage.clientWidth+80,spec,resolved:false});
}

function setWallMotion(direction,amount){
  const mobileScale=(stage.clientWidth < 720) ? 0.36 : 0.55;
  wallMotion=direction*amount*mobileScale;wallMotionUntil=performance.now()+1500;
  wall.classList.toggle('is-fast',direction<0);wall.classList.toggle('is-slow',direction>0);
}

function good(spec){
  score=Math.min(7,score+1);combo+=1;scoreEl.textContent=score;comboEl.textContent=combo;
  setWallMotion(1,spec.wall+Math.min(combo*3,15));toast(spec.type==='scoop'?'단독입니다!':'취재 확보!','good');
  if(runner.classList.contains('is-pushed')){runner.classList.remove('is-pushed');clearTimeout(pushedTimer)}
}

function bad(spec){
  if(performance.now()<shieldUntil){toast('커피 보호막!','good');return}
  combo=0;comboEl.textContent='0';setWallMotion(-1,spec.wall);toast(spec.label,'bad');
}

function resolve(object,success){
  if(object.resolved)return;object.resolved=true;
  const {spec}=object;
  if(spec.effect==='shield'&&success){shieldUntil=performance.now()+5000;shieldEl.textContent='커피 보호막 ON';stage.classList.add('has-shield');toast('잠깐은 괜찮아요','good')}
  else if(spec.effect==='good'){success?good(spec):bad({...spec,label:`${spec.label} 놓침`,wall:spec.wall*.7})}
  else if(spec.effect==='bad'&&!success)bad(spec);
  object.el.classList.add(success?'resolved':'missed');
}

function actionIsCorrect(spec){
  if(spec.type==='coffee')return sliding;
  if(spec.action==='slide')return sliding;
  if(spec.action==='double')return jumpLevel===2;
  if(spec.action==='jump')return jumpLevel>=1;
  return false;
}

function wallContact(){
  if(runner.classList.contains('is-pushed'))return;
  runner.classList.add('is-pushed');toast('밀리고 있어요!','bad');
  pushedTimer=setTimeout(()=>{
    if(wallGap<=22)fail();
    else runner.classList.remove('is-pushed');
  },2200);
}

function fail(){
  playing=false;cancelAnimationFrame(raf);stage.classList.remove('is-playing');
  objects.forEach(object=>object.el.remove());objects=[];runner.classList.remove('is-pushed');
  startPanel.querySelector('p').innerHTML='<b>마감벽에 밀렸습니다.</b><br>좋은 취재거리를 놓치지 마세요.';
  startPanel.querySelector('button').textContent='다시 취재';startPanel.hidden=false;
  window.gtag?.('event','chungmuman_fail',{distance:Math.round(distance)});
}

function finish(){
  playing=false;cancelAnimationFrame(raf);stage.classList.remove('is-playing','has-shield');runner.classList.add('finish');
  objects.forEach(object=>object.el.remove());objects=[];
  const article=articles[Math.floor(Math.random()*articles.length)];const link=document.querySelector('#articleLink');
  link.href=article.url;link.textContent=`${article.label} 읽기`;result.hidden=false;
  result.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
  window.gtag?.('event','chungmuman_complete',{distance:Math.round(distance)});
}

function frame(now){
  if(!playing)return;
  const dt=Math.min(.04,(now-lastFrame)/1000||.016);lastFrame=now;distance+=dt*8;distanceEl.textContent=`${Math.round(distance)}m`;
  if(jumpLevel>0){
    playerY+=verticalVelocity*dt;verticalVelocity-=1180*dt;
    if(playerY<=0&&verticalVelocity<0){playerY=0;verticalVelocity=0;jumpLevel=0;runner.classList.remove('is-jumping','is-double-jumping')}
    runner.style.transform=`translateY(${-playerY}px)`;
  }else if(!runner.classList.contains('is-pushed'))runner.style.transform='';
  if(now>wallMotionUntil){wallMotion=0;wall.classList.remove('is-fast','is-slow')}
  wallGap=Math.max(0,Math.min(180,wallGap+wallMotion*dt));
  wall.style.transform=`translateX(${runner.offsetLeft-wallGap-wall.offsetWidth}px)`;
  if(wallGap<=18)wallContact();
  if(now>shieldUntil){shieldEl.textContent='보호막 없음';stage.classList.remove('has-shield')}
  if(now-lastSpawn>(stage.clientWidth<720?1950:1650)){spawn();lastSpawn=now}
  const runnerBox=runner.getBoundingClientRect();
  objects.forEach(object=>{
    object.x-=speed;object.el.style.transform=`translateX(${object.x-stage.clientWidth}px)`;
    const box=object.el.getBoundingClientRect();
    const crossing=object.x<stage.clientWidth*.2&&object.x>stage.clientWidth*.02;
    if(!object.resolved&&crossing){
      const correct=actionIsCorrect(object.spec);
      if(object.spec.effect==='bad')resolve(object,correct);
      else if(correct)resolve(object,true);
    }
    if(!object.resolved&&object.x<stage.clientWidth*.02)resolve(object,false);
  });
  objects=objects.filter(object=>{if(object.x< -240){object.el.remove();return false}return true});
  if(score>=7){finish();return}raf=requestAnimationFrame(frame);
}

function start(){
  score=0;combo=0;distance=0;speed=stage.clientWidth<720?4.7:6;wallGap=stage.clientWidth<720?48:92;wallMotion=0;shieldUntil=0;patternIndex=Math.floor(Math.random()*patterns.length);playerY=0;verticalVelocity=0;jumpLevel=0;sliding=false;
  scoreEl.textContent='0';comboEl.textContent='0';distanceEl.textContent='0m';shieldEl.textContent='보호막 없음';
  result.hidden=true;startPanel.hidden=true;runner.className='runner';wall.style.transform=`translateX(${runner.offsetLeft-wallGap-wall.offsetWidth}px)`;
  playing=true;stage.classList.add('is-playing');lastSpawn=performance.now();lastFrame=performance.now();stage.focus();raf=requestAnimationFrame(frame);
}

document.querySelector('#startButton').addEventListener('click',start);
document.querySelector('#retryButton').addEventListener('click',()=>{result.hidden=true;startPanel.hidden=false});
document.querySelector('#jumpButton').addEventListener('pointerdown',event=>{event.preventDefault();jump()});
document.querySelector('#slideButton').addEventListener('pointerdown',event=>{event.preventDefault();slide()});
stage.addEventListener('pointerdown',event=>{if(event.target.closest('button')||!playing)return;gestureStart={x:event.clientX,y:event.clientY,time:performance.now(),id:event.pointerId};stage.setPointerCapture?.(event.pointerId)});
stage.addEventListener('pointerup',event=>{if(!gestureStart||gestureStart.id!==event.pointerId)return;const dx=event.clientX-gestureStart.x,dy=event.clientY-gestureStart.y,elapsed=performance.now()-gestureStart.time;gestureStart=null;if(Math.abs(dy)>Math.abs(dx)&&dy<-30)jump();else if(Math.abs(dy)>Math.abs(dx)&&dy>30)slide();else if(elapsed<280&&Math.abs(dx)<20&&Math.abs(dy)<20)jump()});
stage.addEventListener('pointercancel',()=>{gestureStart=null});
window.addEventListener('keydown',event=>{if(['Space','ArrowUp'].includes(event.code)){event.preventDefault();jump()}if(event.code==='ArrowDown'){event.preventDefault();slide()}});
