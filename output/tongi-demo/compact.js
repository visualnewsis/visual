(() => {
 'use strict';
 const panel=document.querySelector('#tongi');if(!panel)return;
 const input=panel.querySelector('#tongi-query'),form=panel.querySelector('form'),speech=panel.querySelector('#tongi-speech'),result=panel.querySelector('#tongi-result'),character=panel.querySelector('.tongi-character'),petRow=panel.querySelector('.tg-pet-row');
 let mood=0,taps=0,tapAt=0,extraTaps=0,restTimer,typingTimer,searchTimer;
 const states={idle:'오늘은 어떤 이야기가 궁금하세요?',greeting:'안녕! 나는 통이예요.',listening:'응, 듣고 있어요.',typing:'좋아요, 계속 말해주세요.',searching:'맞는 이야기를 골랐어요.',found:'왜 골랐는지도 함께 적었어요.',petting:'헤헤 간지러워요',sulking:'아파요 -_-',turned:'흥… 쓰다듬어 주면 돌아볼게요.'};
 function state(name){if(mood&&name!=='petting')name=mood===2?'turned':'sulking';panel.dataset.state=name;speech.textContent=states[name];petRow.hidden=!mood;character.setAttribute('aria-label',mood?'삐진 통이. 좌우로 쓰다듬거나 아래 쓰다듬기 버튼을 눌러 달래 주세요.':'통이와 인사하기. 좌우로 쓰다듬으면 좋아해요.');}
 function rest(ms=2000){clearTimeout(restTimer);if(mood)return;restTimer=setTimeout(()=>state(document.activeElement===input?'listening':'idle'),ms);}
 function forgive(){clearTimeout(typingTimer);clearTimeout(restTimer);clearTimeout(searchTimer);mood=0;extraTaps=0;taps=0;state('petting');rest(2200);}
 const items=[...document.querySelectorAll('.vn-story')].map(a=>({title:(a.querySelector('h3')?.innerText||a.querySelector('h3')?.textContent||'').replace(/\s+/g,' ').trim(),description:a.querySelector('p')?.textContent.trim()||'',url:a.href})).filter(x=>x.title&&new URL(x.url).hostname==='visual.newsis.com');
 function element(tag,text,className){const el=document.createElement(tag);if(text)el.textContent=text;if(className)el.className=className;return el;}
 const arcade=document.querySelector('.vn-game-top[href="https://visual.newsis.com/arcade/"]');if(arcade)items.push({title:'충무로딩',description:arcade.querySelector('p')?.textContent||'',url:arcade.href});
 const calculator=document.querySelector('.vn-calc-top');if(calculator)items.push({title:'계산대로',description:calculator.querySelector('p')?.textContent||'',url:calculator.href});
 function show(query){
  result.replaceChildren();result.hidden=false;
  const secret=TongiSearch.easterEgg(query);
  if(secret){result.append(element('small','통이의 아빠'),element('p',secret,'tg-easter-answer'));return 'easter-egg';}
  const match=TongiRecommend.recommend(query,items);
  result.append(element('h3',match.message));
  const related=element('div',null,'tg-related');
  match.items.forEach(item=>{const a=element('a');a.href=item.url;a.append(element('strong',item.title+' ↗'),element('span',item.reason),element('small',item.description));related.append(a);});
  result.append(related);
  if(!match.items.length){const note=element('p','비주얼뉴시스에 있는 콘텐츠만 골라드려요. 최신 뉴스 답변은 제공하지 않아요.','tg-empty');result.append(note);const all=element('a','전체 이야기 살펴보기 ↓','tg-all-stories');all.href='#vn-hub-archive-title';all.addEventListener('click',()=>document.querySelector('#tg-dialog').close());result.append(all);}
  return match.items.length?true:false;
 }
 form.addEventListener('submit',e=>{e.preventDefault();const q=input.value.trim();if(!q){input.focus();return;}clearTimeout(typingTimer);clearTimeout(restTimer);clearTimeout(searchTimer);const outcome=show(q);if(!outcome){state('listening');return;}if(outcome==='easter-egg'){state('greeting');if(!mood)speech.textContent='안재현 기자입니다';return;}state('searching');searchTimer=setTimeout(()=>{state('found');rest(3200);},400);});
 input.addEventListener('focus',()=>{clearTimeout(restTimer);state('listening');});input.addEventListener('input',()=>{clearTimeout(searchTimer);state('typing');clearTimeout(typingTimer);typingTimer=setTimeout(()=>state('listening'),800);});input.addEventListener('blur',()=>rest(700));input.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.isComposing||e.keyCode===229))e.preventDefault();});
 panel.querySelectorAll('[data-query]').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.query;form.requestSubmit();}));
 let petLast=null,petDistance=0,petDirection=0,petTurns=0,petTime=0,suppressClickUntil=0;function clearPet(){petLast=null;petDistance=0;petDirection=0;petTurns=0;}
 character.addEventListener('pointerenter',clearPet);character.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')clearPet();});character.addEventListener('pointermove',e=>{const now=performance.now();if(now-petTime>650)clearPet();petTime=now;if(!petLast){petLast={x:e.clientX,y:e.clientY};return;}const dx=e.clientX-petLast.x,dy=e.clientY-petLast.y;if(Math.abs(dx)<3)return;petLast={x:e.clientX,y:e.clientY};if(Math.abs(dy)>Math.abs(dx)*1.5)return;const direction=Math.sign(dx);if(petDirection&&direction!==petDirection)petTurns++;petDirection=direction;petDistance+=Math.min(Math.abs(dx),45);if(petDistance>=65&&petTurns>=1){forgive();suppressClickUntil=Date.now()+650;character.style.setProperty('--tg-pet-tilt',direction*5+'deg');}});character.addEventListener('pointerleave',clearPet);character.addEventListener('pointercancel',clearPet);
 character.addEventListener('click',e=>{if(e.detail>0&&Date.now()<suppressClickUntil)return;clearTimeout(restTimer);clearTimeout(typingTimer);if(mood===2){state('turned');return;}if(mood===1){if(++extraTaps>=2)mood=2;state(mood===2?'turned':'sulking');return;}const now=Date.now();taps=now-tapAt<1800?taps+1:1;tapAt=now;if(taps>=3){mood=1;extraTaps=0;taps=0;state('sulking');}else{state('greeting');speech.textContent=taps===2?'살살 눌러주세요…':'반가워요!';rest();}});panel.querySelector('#tg-forgive').addEventListener('click',forgive);
 const dialog=document.querySelector('#tg-dialog'),wrap=document.querySelector('.tg-launch-wrap'),launch=document.querySelector('.tg-launch');let lastFocus,oldOverflow,backdropDown=false;
 launch.addEventListener('click',()=>{wrap.dataset.noticed='true';},{once:true});
 function fitViewport(){const view=window.visualViewport;const height=view?.height||innerHeight;const bottom=Math.max(0,innerHeight-height-(view?.offsetTop||0));dialog.style.setProperty('--tg-visible-height',Math.max(120,height-32)+'px');dialog.style.setProperty('--tg-keyboard-offset',bottom+'px');}
 fitViewport();window.addEventListener('resize',fitViewport,{passive:true});window.visualViewport?.addEventListener('resize',fitViewport,{passive:true});window.visualViewport?.addEventListener('scroll',fitViewport,{passive:true});
 launch.addEventListener('click',()=>{lastFocus=document.activeElement;oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();wrap.style.visibility='hidden';launch.setAttribute('aria-expanded','true');document.querySelector('#tg-dialog-title').focus();});dialog.querySelector('.tg-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{document.body.style.overflow=oldOverflow||'';wrap.style.visibility='';launch.setAttribute('aria-expanded','false');lastFocus?.focus();});
 function outside(e){const r=dialog.getBoundingClientRect();return e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom);}dialog.addEventListener('pointerdown',e=>{backdropDown=outside(e);});dialog.addEventListener('pointercancel',()=>{backdropDown=false;});dialog.addEventListener('click',e=>{if(backdropDown&&outside(e))dialog.close();backdropDown=false;});
})();
