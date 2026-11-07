import {T,materials,makeStage} from './quality-kit.js?v=20261028-craft7';
import {buildKeyboardHero} from './models/keyboard-hero.js?v=20261030-craft-release1';
import {pressKeyboard,releaseKeyboard,stopKeyboard,setKeyboardAudioEnabled} from './keyboard-audio.js?v=20261028-uxaudio2';
const canvas=document.getElementById('landing-keyboard-canvas'),input=document.getElementById('landing-typing'),status=document.getElementById('landing-keyboard-status');
const owner='collection-keyboard',held=new Map();let stage,model,last='',timer=0,muted=false,lost=false,composing=false;
// Emit only an observed key/case attempt; never the key, text, pointer coordinates or a background miss.
const gestures=new Map();let validTapUntil=0;
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;validTapUntil=0;for(const g of gestures.values())g.cancelled=true;gestures.set(e.pointerId,{x:e.clientX,y:e.clientY,at:performance.now(),cancelled:gestures.size>0});});
canvas.addEventListener('pointermove',e=>{const g=gestures.get(e.pointerId);if(g&&Math.hypot(e.clientX-g.x,e.clientY-g.y)>7)g.cancelled=true;},{passive:true});
canvas.addEventListener('pointerup',e=>{const g=gestures.get(e.pointerId);if(g&&!g.cancelled&&gestures.size===1&&performance.now()-g.at<650&&Math.hypot(e.clientX-g.x,e.clientY-g.y)<=7)validTapUntil=performance.now()+250;gestures.delete(e.pointerId);});
canvas.addEventListener('pointercancel',e=>{gestures.delete(e.pointerId);validTapUntil=0;});
window.addEventListener('scroll',()=>{validTapUntil=0;for(const g of gestures.values())g.cancelled=true;},{passive:true});
function clearGestures(){gestures.clear();validTapUntil=0;}
window.addEventListener('blur',clearGestures);window.addEventListener('pagehide',clearGestures);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearGestures();});
function attempt(result){canvas.dispatchEvent(new CustomEvent('goodeasy:keyboard-attempt',{detail:{result}}));}
function draw(){if(!model||lost)return;const key=[...held.values()].at(-1)||last;model.update({key,travel:held.size?4:0});stage.draw();canvas.dataset.ready='true';document.body.classList.add('keyboard-ready');canvas.dataset.pressedKey=held.size?key:'';}
function down(id,key){if(held.has(id))return;held.set(id,key);last=key;draw();pressKeyboard(owner,id).then(result=>{canvas.dataset.audioState=result.state;if(result.state==='unavailable')status.textContent='소리를 켜지 못했습니다. 브라우저의 소리 설정을 확인해 주세요.';});}
function up(id){if(!held.has(id))return;held.delete(id);releaseKeyboard(owner,id);draw();}
function stop(){clearTimeout(timer);held.clear();stopKeyboard(owner);draw();}
function tap(key){clearTimeout(timer);up('tap');down('tap',key);timer=setTimeout(()=>up('tap'),100);}
const physical=e=>e.code.startsWith('Key')?e.code.slice(3):e.code.startsWith('Digit')?e.code.slice(5):e.key;
input.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key.length===1||['Backspace','Enter','Process'].includes(e.key)||e.isComposing||e.keyCode===229)down('physical:'+e.code,physical(e));});
input.addEventListener('keyup',e=>up('physical:'+e.code));
input.addEventListener('compositionstart',()=>{composing=true;});input.addEventListener('compositionend',()=>{composing=false;if(!held.size)tap(Array.from(input.value).at(-1)||' ');});
input.addEventListener('input',e=>{if(!composing&&!held.size&&e.inputType!=='insertFromPaste')tap(Array.from(e.data||input.value).at(-1)||'Backspace');});
input.addEventListener('blur',stop);
document.getElementById('landing-clear').addEventListener('click',()=>{stop();input.value='';input.focus();});
document.getElementById('landing-sound').addEventListener('click',e=>{muted=!muted;setKeyboardAudioEnabled(!muted);e.currentTarget.setAttribute('aria-pressed',String(!muted));e.currentTarget.textContent=muted?'스위치 소리 꺼짐':'스위치 소리 켜짐';status.textContent=muted?'소리를 껐습니다.':'소리가 납니다. 스피커를 켜거나 이어폰을 사용해 주세요.';});
try{stage=makeStage(canvas);model=buildKeyboardHero(T,materials);stage.setModel(model,model.eye);draw();new ResizeObserver(draw).observe(canvas.parentElement);
 const ray=new T.Raycaster(),point=new T.Vector2();
 canvas.addEventListener('click',e=>{if(lost)return;const valid=e.isTrusted&&e.detail>0&&performance.now()<validTapUntil;validTapUntil=0;const r=canvas.getBoundingClientRect();point.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(point,stage.camera);const hits=ray.intersectObject(model.group,true),hit=hits.find(h=>h.object.userData.action?.startsWith('key:'));if(!hit){if(valid&&hits.length)attempt('case');return;}const key=hit.object.userData.action.slice(4);input.value=(input.value+key).slice(-300);input.dispatchEvent(new Event('change',{bubbles:true}));attempt('key');tap(key);if(matchMedia('(pointer:fine)').matches)input.focus({preventScroll:true});});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;canvas.dataset.ready='false';gestures.clear();validTapUntil=0;stop();status.textContent='3D 화면이 중단됐습니다. 입력칸에서는 계속 타이핑할 수 있습니다.';});
 canvas.addEventListener('webglcontextrestored',()=>{lost=false;draw();});
}catch(error){canvas.hidden=true;status.textContent='입력칸에서 타이핑하거나 아래 링크로 키보드 본편을 열어보세요.';console.error(error);}
window.addEventListener('blur',stop);window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
