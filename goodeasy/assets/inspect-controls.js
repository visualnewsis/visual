import * as T from '../piano/vendor/three.module.min.js';
import {wheelZoom,pinchZoom,zoomDistance,zoomPercent} from './anatomy-controls.js?v=20261027-detail1';
// Camera controls change only the observation; mechanism/input state stays untouched.
export function attachInspectControls(stage,canvas,{label='3D 모형',resetButton=null,onChange=null}={}){
 if(canvas.dataset.inspectControls)return stage.inspectControls;
 canvas.dataset.inspectControls='true';
 if(!document.getElementById('goodeasy-inspect-css')){const link=document.createElement('link');link.id='goodeasy-inspect-css';link.rel='stylesheet';link.href=new URL('./inspect-controls.css?v=20261028-uxaudio2',import.meta.url).href;document.head.append(link);}
 const tools=document.createElement('div');tools.className='inspect-controls';
 tools.innerHTML='<label><input type="checkbox" checked>돌려서 보기</label><button type="button" class="inspect-zoom" aria-label="모형 축소"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14"/></svg></button><output aria-label="확대 비율">100%</output><button type="button" class="inspect-zoom" aria-label="모형 확대"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14M12 5v14"/></svg></button><button type="button">전체 보기</button>';
 canvas.after(tools);const enabled=tools.querySelector('input'),buttons=tools.querySelectorAll('button'),output=tools.querySelector('output');
 const nativeFit=stage.fit.bind(stage),pointers=new Map();let width=-1,height=-1,base=null,pivot=null,yaw=0,pitch=0,zoom=1,pinch=0,dragged=false,shieldUntil=0;
 const up=new T.Vector3(0,1,0),right=new T.Vector3();
 stage.fit=()=>{if(!nativeFit())return false;const r=canvas.getBoundingClientRect();if(!base||r.width!==width||r.height!==height){width=r.width;height=r.height;pivot=stage.target.clone();base=stage.camera.position.clone().sub(pivot);}
 const offset=base.clone().applyAxisAngle(up,yaw);right.crossVectors(up,offset).normalize();offset.applyAxisAngle(right,pitch).multiplyScalar(zoom);stage.camera.position.copy(pivot).add(offset);stage.camera.lookAt(pivot);stage.camera.updateMatrixWorld();return true;};
 function draw(){output.textContent=zoomPercent(zoom)+'%';canvas.dataset.inspectZoom=String(zoom);canvas.dataset.inspectYaw=String(yaw);canvas.dataset.inspectPitch=String(pitch);stage.draw();onChange?.();canvas.dispatchEvent(new Event('inspectchange'));}
 function reset(){pivot=stage.target.clone();yaw=pitch=0;zoom=1;draw();}
 function mode(){pointers.clear();pinch=0;canvas.style.touchAction=enabled.checked?'none':'pan-y';canvas.setAttribute('aria-label',label+(enabled.checked?' · 드래그 회전, 휠 또는 두 손가락 확대·축소':' · 회전 꺼짐'));canvas.dataset.inspectEnabled=String(enabled.checked);}
 enabled.addEventListener('change',mode);buttons[0].onclick=()=>{zoom=zoomDistance(zoom,1.25);draw();};buttons[1].onclick=()=>{zoom=zoomDistance(zoom,.8);draw();};buttons[2].onclick=reset;resetButton?.addEventListener('click',reset);
 const gap=()=>{const a=[...pointers.values()];return a.length>1?Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y):0;};
 canvas.addEventListener('wheel',e=>{if(!enabled.checked)return;e.preventDefault();zoom=wheelZoom(zoom,e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1));draw();},{passive:false});
 canvas.addEventListener('pointerdown',e=>{if(!enabled.checked||e.button>0)return;if(!pointers.size)dragged=false;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});canvas.setPointerCapture(e.pointerId);pinch=gap();});
 canvas.addEventListener('pointermove',e=>{const previous=pointers.get(e.pointerId);if(!previous)return;const dx=e.clientX-previous.x,dy=e.clientY-previous.y;pointers.set(e.pointerId,{...previous,x:e.clientX,y:e.clientY});if(Math.hypot(e.clientX-previous.startX,e.clientY-previous.startY)>6)dragged=true;if(pointers.size>1){dragged=true;const next=gap();zoom=pinchZoom(zoom,pinch,next);pinch=next;}else{yaw-=dx*.008;pitch=Math.max(-1.3,Math.min(1.3,pitch-dy*.008));}draw();});
 const release=e=>{if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);pinch=gap();if(dragged)shieldUntil=performance.now()+250;};for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,release);
 window.addEventListener('blur',()=>{pointers.clear();pinch=0;});mode();draw();
 return stage.inspectControls={reset,focus(point,factor=.55,angles={}){if(!base)stage.fit();pivot=point.clone();yaw=angles.yaw||0;pitch=angles.pitch||0;zoom=zoomDistance(1,factor);draw();},consumeClick:()=>performance.now()<shieldUntil,get enabled(){return enabled.checked;},get zoom(){return zoom;}};
}