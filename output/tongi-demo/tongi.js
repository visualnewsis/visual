(() => {
 'use strict';
 const panel=document.querySelector('#tongi');
 if(!panel)return;
 const input=panel.querySelector('input'),form=panel.querySelector('form'),speech=panel.querySelector('#tongi-speech'),label=panel.querySelector('#tongi-state-label'),result=panel.querySelector('#tongi-result'),submit=panel.querySelector('.tongi-submit');
 let mode='find',busy=false,composing=false,taps=0,tapAt=0,revision=0,typingTimer,restTimer,searchTimer,scrollFrame;
 const states={idle:['무엇이 궁금하세요?','기다리는 중'],greeting:['안녕! 나는 통이예요.','반가워요'],listening:['응, 듣고 있어요.','귀 기울이는 중'],typing:['좋아요, 계속 말해주세요.','입력 듣는 중'],searching:['고글 동작을 보여드릴게요.','검색 동작 체험'],found:['검색 연결을 준비했어요.','전체 기사 연결 안내'],petting:['헤헤 간지러워요','기분 좋아요'],sulking:['아파요 -_-','잠깐 삐짐 · − _ −'],scrolling:['여기 있어요. 천천히 둘러봐요.','스크롤 따라보기']};
 function setState(name){panel.dataset.state=name;speech.textContent=states[name][0];label.textContent=states[name][1];}
 function rest(ms=2000){clearTimeout(restTimer);restTimer=setTimeout(()=>{if(!busy)setState(document.activeElement===input?'listening':'idle');},ms);}
 panel.addEventListener('tongi:react',e=>{if(!busy&&Object.hasOwn(states,e.detail)){clearTimeout(typingTimer);setState(e.detail);rest(2000);}});
 function stop(){revision++;clearTimeout(searchTimer);clearTimeout(typingTimer);clearTimeout(restTimer);busy=false;submit.disabled=false;form.removeAttribute('aria-busy');}
 const groups={money:[['퇴사할게여','퇴사 후 생활비와 통장 잔고','https://visual.newsis.com/quit/'],['이 집, 살 수 있겠습니까?','주택 · 대출 · 생활비','https://visual.newsis.com/buy-live/'],['계산대로','내 조건으로 직접 계산하기','https://visual.newsis.com/calculator/index.html']],ai:[['지금부터 당신을 대체합니다.','AI와 노동시장','https://visual.newsis.com/aijob/'],['회사가 고용한 SPAI','AI 직원 감시와 근무 기록','https://visual.newsis.com/spai/']],pension:[['국민연금, 믿어도 돼?','국민연금과 노후','https://visual.newsis.com/pension/'],['환갑이면 고령? 천만예요','고령화와 나이 기준','https://visual.newsis.com/senior/']]};
 function showSample(query){
  result.replaceChildren();
  const official=document.createElement('div');official.className='tongi-official';
  const scope=document.createElement('small');scope.textContent='NEWSIS · 전체 기사 검색';official.append(scope);
  const heading=document.createElement('h3');heading.textContent='“'+query+'” 뉴시스 전체 기사에서 찾기';official.append(heading);
  const explanation=document.createElement('p');explanation.textContent='통이의 검색 대상은 뉴시스 전체 기사로 확장합니다. 현재는 기사 데이터 연결 전이며, 공식 사이트의 검색 버튼을 눌러 위 키워드를 입력해 주세요. 이 화면에는 실제 기사 검색 결과가 표시되지 않습니다.';official.append(explanation);
  const open=document.createElement('a');open.href='https://www.newsis.com/';open.className='tongi-official-button';open.textContent='뉴시스 공식 사이트에서 검색하기 ↗';official.append(open);result.append(official);
  if(mode==='find'){result.hidden=false;return;}
  const tag=document.createElement('small');tag.textContent='SAMPLE RESPONSE · 전체 기사 AI 브리핑은 아직 연결 전입니다';result.append(tag);
  const title=document.createElement('h3');title.textContent=mode==='brief'?'관심 주제의 샘플 브리핑':'통이가 건네는 이야기';result.append(title);
  const key=/연금|노후|고령/.test(query)?'pension':/AI|인공지능|일자리|노동|감시/i.test(query)?'ai':/퇴사|생활비|돈|집|대출|계산|연봉/.test(query)?'money':null;
  const note=document.createElement('p');note.textContent=key?(mode==='brief'?'주제를 이해할 수 있도록 관련 작품을 묶었습니다. 이 화면은 동작 시연이며 최신 뉴스 요약이나 개인화 브리핑은 제공하지 않습니다.':'입력한 단어에 맞춰 미리 준비한 관련 작품을 보여드려요.'):'이 질문은 아직 준비된 샘플이 없어요. 대신 통이의 탐색 동작과 함께 둘러볼 수 있는 콘텐츠를 보여드릴게요.';result.append(note);
  const grid=document.createElement('div');grid.className='tongi-result-grid';
  (groups[key]||[groups.money[0],groups.ai[0],groups.pension[0]]).forEach(([name,desc,url])=>{const a=document.createElement('a');a.href=url;a.textContent=name+' ↗';const span=document.createElement('span');span.textContent=desc;a.append(span);grid.append(a);});result.append(grid);result.hidden=false;
 }
 form.addEventListener('submit',e=>{e.preventDefault();if(busy)return;if(!input.value.trim()){input.focus();speech.textContent='궁금한 내용을 먼저 적어주세요.';return;}clearTimeout(typingTimer);clearTimeout(restTimer);busy=true;submit.disabled=true;form.setAttribute('aria-busy','true');result.hidden=true;setState('searching');const ticket=++revision,query=input.value.trim();searchTimer=setTimeout(()=>{if(ticket!==revision)return;busy=false;submit.disabled=false;form.removeAttribute('aria-busy');showSample(query);setState('found');rest(4200);},1100);});
 input.addEventListener('focus',()=>{if(!busy&&panel.dataset.state!=='sulking'){clearTimeout(restTimer);setState('listening');}});
 input.addEventListener('input',()=>{if(busy)stop();setState('typing');panel.style.setProperty('--tg-look',((input.value.length%7)-3)+'px');clearTimeout(typingTimer);typingTimer=setTimeout(()=>{if(!busy){setState('listening');if(input.value)speech.textContent='준비되면 화살표를 눌러주세요.';}},850);});
 input.addEventListener('compositionstart',()=>{composing=true;});input.addEventListener('compositionend',()=>{composing=false;});input.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.isComposing||composing||e.keyCode===229))e.preventDefault();});
 input.addEventListener('blur',()=>{clearTimeout(typingTimer);if(!busy)rest(700);});
 panel.querySelectorAll('[data-query]').forEach(b=>b.addEventListener('click',()=>{if(busy)stop();input.value=b.dataset.query;input.focus();form.requestSubmit();}));
 const tabs=[...panel.querySelectorAll('[role=tab]')];
 function selectTab(tab){stop();mode=tab.dataset.mode;tabs.forEach(b=>{const selected=b===tab;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});panel.querySelector('[role=tabpanel]').setAttribute('aria-labelledby',tab.id);result.hidden=true;input.placeholder=mode==='brief'?'어떤 주제가 궁금하세요?':'키워드를 입력하세요';setState('idle');}
 tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();selectTab(tabs[n]);tabs[n].focus();});});
 const character=panel.querySelector('.tongi-character');
 let petLast=null,petDistance=0,petDirection=0,petTurns=0,petTime=0,suppressClickUntil=0;
 function clearPet(){petLast=null;petDistance=0;petDirection=0;petTurns=0;}
 character.addEventListener('pointerenter',clearPet);
 character.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')clearPet();});
 character.addEventListener('pointermove',e=>{
  if(busy)return;
  const now=performance.now();
  if(now-petTime>650)clearPet();
  petTime=now;
  if(!petLast){petLast={x:e.clientX,y:e.clientY};return;}
  const dx=e.clientX-petLast.x,dy=e.clientY-petLast.y;
  if(Math.abs(dx)<3)return;
  petLast={x:e.clientX,y:e.clientY};
  if(Math.abs(dy)>Math.abs(dx)*1.5)return;
  const direction=Math.sign(dx);
  if(petDirection&&direction!==petDirection)petTurns++;
  petDirection=direction;petDistance+=Math.min(Math.abs(dx),45);
  if(petDistance>=65&&petTurns>=1){
   clearTimeout(typingTimer);clearTimeout(restTimer);taps=0;
   setState('petting');suppressClickUntil=Date.now()+650;
   character.style.setProperty('--tg-pet-tilt',direction*5+'deg');
   rest(2200);
  }
 });
 character.addEventListener('pointerleave',clearPet);
 character.addEventListener('pointercancel',clearPet);
 character.addEventListener('click',e=>{if(busy||(e.detail>0&&Date.now()<suppressClickUntil))return;clearTimeout(restTimer);clearTimeout(typingTimer);const now=Date.now();taps=now-tapAt<1800?taps+1:1;tapAt=now;if(taps>=3){setState('sulking');taps=0;rest(2800);}else{setState('greeting');speech.textContent=taps===2?'살살 눌러주세요…':'반가워요! 궁금한 걸 적어주세요.';rest();}});
 panel.querySelector('#tongi-reset').addEventListener('click',()=>{stop();taps=0;input.value='';result.replaceChildren();result.hidden=true;selectTab(tabs[0]);setState('greeting');rest();});
 let visible=false,welcomed=false;
 if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&!welcomed){welcomed=true;setState('greeting');rest(2400);}},{threshold:.2}).observe(panel);else visible=true;
 window.addEventListener('scroll',()=>{if(scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;if(!visible||busy||document.activeElement===input||!['idle','scrolling'].includes(panel.dataset.state))return;const rect=panel.getBoundingClientRect();panel.style.setProperty('--tg-scroll',Math.max(-7,Math.min(7,(innerHeight/2-rect.top-rect.height/2)/35))+'deg');setState('scrolling');rest(550);});},{passive:true});
})();
