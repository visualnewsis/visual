(() => {
  const $ = id => document.getElementById(id);
  const R = SonMosaicRenderer, data = mosaicData;
  const story = $('portrait'), windowEl = $('portrait-window');
  const canvas = $('mosaic-canvas'), context = canvas.getContext('2d');
  const fallback = story.querySelector('.portrait-fallback');
  const focusCard = $('record-focus');
  const heading = $('portrait-heading');
  const dialog = $('mosaic-dialog'), detailCanvas = $('mosaic-detail-canvas'), detailContext = detailCanvas.getContext('2d');
  const detailMap = $('mosaic-detail-map');
  let detailMobile = null;
  const picker = $('mosaic-goal-picker');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const touchPointer = matchMedia('(pointer: coarse)');
  const image = new Image(); image.decoding = 'async';
  let atlasReady=false;const atlasImage=new Image();atlasImage.decoding='async';
  atlasImage.onload=()=>{atlasReady=true;if(dialog.open)paintDetail();schedule();};
  atlasImage.src=data.atlas.src;
  let portraitReady=false;const portraitImage=new Image();portraitImage.decoding='async';
  portraitImage.onload=()=>{portraitReady=true;if(dialog.open)paintDetail();schedule();};
  portraitImage.src=data.portrait;
  let imageFailed=false, ready=false, storyGeometry=null, detailGeometry=null, frame=0, lastPhase=-1, paintedMainKey='';
  let detailZoom=1, anchor={x:data.width/2,y:data.height/2}, selected=null, selectedGoal=59;
  let menuDetail=false;
  let userZoom=1, userAnchor={x:data.width/2,y:data.height/2};
  let movieElapsed=0, movieLastTime=0, hovered=null, moviePaused=false, moviePaintTime=0;
  const film=SonIntroHighlights.create({data,image,getAtlas:()=>atlasReady?atlasImage:null,getPortrait:()=>portraitReady?portraitImage:null,onReady:()=>schedule()});
  // Hold the finished face, then the headline, before inviting exploration.
  const faceHold=700, afterglowDuration=1800, movieDuration=film.duration+afterglowDuration;
  const discover=$('mosaic-discover'), hoverCard=$('mosaic-hover');
  const previewDock=story.querySelector('.portrait-controls');
  const previewOpen=$('mosaic-preview-open'), previewClose=$('mosaic-preview-close');
  const introCinemaStep=4.2;
  const sampleCell={col:data.origin.col,row:data.origin.row,n:59};
  $('mosaic-sample-photo').src=recordMilestone.openingLastPhoto||recordMilestone.photo;
  const zoomStops=[1,2,4,8,16,32,64];

  for(let n=1;n<=59;n++){
    const option=document.createElement('option'); option.value=String(n);
    option.textContent=n===59?`59호골 · ${recordMilestone.confirmed?recordMilestone.opponent+'전 · 단독 1위':'경신 가정'}`:`${n}호골 · ${goalData[n-1][1]}전`;
    picker.append(option);
  }
  $('record-goal-placeholder').querySelector('span').textContent=recordMilestone.confirmed?'한국 남자 A매치 단독 최다골':'59호골 · 경신 후 발행 가정';
  if(recordMilestone.confirmed && recordMilestone.photo){
    const recordPhoto=$('record-goal-photo');recordPhoto.src=recordMilestone.mosaicPhoto||recordMilestone.photo;recordPhoto.alt='우즈베키스탄전 59호골 뒤 팬들에게 인사하는 손흥민의 뒷모습 · 등번호 7 확대';recordPhoto.hidden=false;
    $('record-goal-placeholder').hidden=true;
  }
  image.onload=()=>{ready=true;canvas.hidden=false;fallback.hidden=true;configure();};
  image.onerror=()=>{imageFailed=true;ready=false;canvas.hidden=true;fallback.hidden=false;configure();};
  image.src='assets/son-goal-mosaic-59.webp?v=20261007-crest-tone';

  function setSize(target, rect) {
    const ratio=Math.min(devicePixelRatio||1,1.6);
    const width=Math.max(1,Math.round(rect.width*ratio)),height=Math.max(1,Math.round(rect.height*ratio));
    if(target.width!==width||target.height!==height){target.width=width;target.height=height;}
    return ratio;
  }
  function updateStory(now=performance.now()) {
    frame=0;
    const enhanced=story.classList.contains('is-enhanced'), rectStory=story.getBoundingClientRect();
    const distance=Math.max(0,sonReadingTop()-rectStory.top), beat=Math.max(180,innerHeight*.4);
    const steps=distance/beat;
    const nameStep=enhanced?(steps<1.3?0:steps<2.1?1:steps<2.9?2:steps<introCinemaStep?3:4):4;
    if(nameStep===4&&story.dataset.nameStep==='4'&&movieElapsed<movieDuration&&!moviePaused&&!dialog.open&&now-moviePaintTime<32){schedule();return;}
    moviePaintTime=now;
    const rise=R.clamp(steps/.7,0,1), fade=R.clamp((steps-.85)/.45,0,1);
    $('opening-number').style.opacity=String(nameStep===0?(.22+.78*rise)*(1-fade):0);
    story.dataset.nameStep=String(nameStep);
    const visible=rectStory.top<innerHeight && rectStory.bottom>0;
    const cinemaVisible=visible&&rectStory.bottom>=innerHeight*.75;
    document.documentElement.classList.toggle('intro-names',enhanced&&nameStep<4&&visible);
    if(nameStep<4){if(movieElapsed)film.reset();movieElapsed=0;movieLastTime=0;userZoom=1;userAnchor={x:data.width/2,y:data.height/2};}
    else if(!enhanced){movieElapsed=movieDuration;movieLastTime=0;}
    else if(!cinemaVisible){movieLastTime=0;}
    else if(ready&&!document.hidden&&!dialog.open&&!moviePaused){
      const proposed=movieLastTime?Math.min(movieDuration,movieElapsed+Math.max(0,Math.min(100,now-movieLastTime))):movieElapsed;
      if(film.readyAt(proposed))movieElapsed=proposed;
      movieLastTime=now;
    }else movieLastTime=0;
    const phase=film.state(movieElapsed).phase;
    story.dataset.phase=String(phase);
    const revealStage=phase!==3?'none':(!enhanced||movieElapsed>=movieDuration)?'explore':movieElapsed<film.duration+faceHold?'face':'title';
    story.dataset.revealStage=revealStage;
    const interactive=phase===3&&nameStep===4&&revealStage==='explore';
    story.classList.toggle('is-mosaic-interactive',interactive);
    story.querySelector('.mosaic-inline-tools').inert=!interactive;
    discover.inert=!interactive;discover.setAttribute('aria-hidden',String(!interactive));
    story.querySelector('.portrait-controls').inert=!interactive;
    document.documentElement.classList.toggle('intro-cinema',enhanced&&nameStep===4&&(phase<3||revealStage!=='explore')&&cinemaVisible);
    if(lastPhase!==phase){
      lastPhase=phase;
      heading.innerHTML=phase===3?'전설로 남은 자리<br>마침내 <span class="title-hand">손</span>에 닿다':'기록을 바꾼<br>59호골.';
      $('mosaic-zoom-hint').textContent=phase===3?'작은 사진을 누르면, 그날의 골이 열립니다.':'';
    }
    story.classList.toggle('is-mosaic-zoomed',phase===3&&userZoom>1.001);
    if(phase===3){
      const touch=touchPointer.matches || innerWidth<=800;
      $('mosaic-zoom-hint').textContent=touch
        ? (userZoom>1.001?'끌어서 이동 · 사진 끝에서 다음 장으로 스크롤':'사진을 눌러 기록 보기 · 두 손가락 확대')
        : (userZoom>1.001?'끌어서 이동 · 사진을 눌러 기록 보기':'사진을 눌러 기록 보기 · 두 손가락 확대');
    }
    $('mosaic-inline-zoom').textContent=`${Number(userZoom.toFixed(1))}배`;
    focusCard.hidden=phase!==2;
    focusCard.setAttribute('aria-hidden',String(phase!==2||nameStep<4));
    $('mosaic-sample').disabled=!interactive;
    if(!interactive || !visible){hidePreview();$('mosaic-more').open=false;}
    if(ready&&context){
      const rect=windowEl.getBoundingClientRect();setSize(canvas,rect);
      if(phase===3){
        $('intro-highlights').hidden=true;
        const paintKey=`${canvas.width}:${canvas.height}:${userZoom}:${userAnchor.x}:${userAnchor.y}:${hovered?.col}:${hovered?.row}:${atlasReady}:${portraitReady}`;
        if(paintKey!==paintedMainKey){storyGeometry=R.paint(context,canvas.width,canvas.height,image,data,userZoom,userAnchor,hovered,atlasReady?atlasImage:null,null,portraitReady?portraitImage:null);paintedMainKey=paintKey;}
      }else{paintedMainKey='';storyGeometry=film.paint(context,canvas.width,canvas.height,movieElapsed,rect.width,rect.height).geometry;}
      const ratio=rect.width/canvas.width, ring=$('mosaic-sample-ring');
      const cellSize=data.tile*storyGeometry.scale*ratio,markSize=Math.max(8,cellSize),offset=(cellSize-markSize)/2;
      ring.style.left=`${(storyGeometry.x+sampleCell.col*data.tile*storyGeometry.scale)*ratio+offset}px`;
      ring.style.top=`${(storyGeometry.y+sampleCell.row*data.tile*storyGeometry.scale)*ratio+offset}px`;
      ring.style.width=ring.style.height=`${markSize}px`;
    }
    if(enhanced&&nameStep===4&&cinemaVisible&&ready&&!document.hidden&&!dialog.open&&!moviePaused&&movieElapsed<movieDuration)schedule();
  }
  function configure() {
    mainGestures.reset();detailGestures.reset();
    hidePreview();
    if(frame){cancelAnimationFrame(frame);frame=0;}
    const roomy=!imageFailed&&!reduceMotion.matches && innerHeight>=600 && Math.max(parseFloat(getComputedStyle(document.body).fontSize),parseFloat(getComputedStyle(document.documentElement).fontSize))<=20;
    story.classList.toggle('is-enhanced',roomy);
    const layout=story.querySelector('.portrait-layout');
    if(roomy){
      const overflow=layout.scrollHeight>layout.clientHeight+1 || story.querySelector('.portrait-copy').scrollHeight>innerHeight-160;
      if(overflow)story.classList.remove('is-enhanced');
    }
    document.documentElement.classList.remove('intro-pending');
    movieLastTime=0;moviePaintTime=0;updateStory();
    if(dialog.open){configureDetailMap();paintDetail();}
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(updateStory);}
  function configureDetailMap(reset=false) {
    const mobile=innerWidth<=800;
    if(reset || mobile!==detailMobile){detailMap.open=!mobile;detailMobile=mobile;}
  }
  detailMap.addEventListener('toggle',()=>{if(dialog.open && detailMap.open)requestAnimationFrame(paintDetail);});
  function paintDetail() {
    if(!ready||!detailContext||!detailMap.open)return;
    const rect=detailCanvas.getBoundingClientRect();setSize(detailCanvas,rect);
    detailGeometry=R.paint(detailContext,detailCanvas.width,detailCanvas.height,image,data,detailZoom,anchor,selected,atlasReady?atlasImage:null,null,portraitReady?portraitImage:null);
    $('mosaic-zoom-status').textContent=detailZoom<=1.001?'전체 보기':`${Number(detailZoom.toFixed(1))}배 확대`;
    $('mosaic-zoom-out').disabled=detailZoom<=1.001;
    $('mosaic-zoom-in').disabled=detailZoom>=64;
  }
  function selectGoal(n, cell=null) {
    n=R.clamp(Math.round(n),1,59);selectedGoal=n;picker.value=String(n);
    if(!cell){const index=data.cells.indexOf(n);cell={col:index%data.cols,row:Math.floor(index/data.cols),n};}
    selected=cell;
    const photo=$('mosaic-selected-photo'), number=$('mosaic-selected-number'), link=$('mosaic-go-to-archive');
    $('mosaic-record-article').hidden=n!==59;
    const source=innerWidth<=800?goalPhotoData[n]?.mobile:goalPhotoData[n]?.src;
    number.textContent=String(n).padStart(2,'0');number.hidden=!!source;
    photo.hidden=!source;
    if(source){photo.src=source;photo.alt=n===59?'실제 59호골 경신 경기 사진':`${goalData[n-1][0]} ${goalData[n-1][1]}전 손흥민 경기 사진`;}
    if(n===59){
      $('mosaic-selected-date').textContent=recordMilestone.date?.replaceAll('-','.')||'경신 후 발행 가정';
      $('mosaic-selected-title').textContent='기록을 바꾼 59번째 골.';
      $('mosaic-selected-description').textContent=recordMilestone.confirmed?recordMilestoneDescription:'실제 59호골의 날짜·상대·현장 사진을 확인한 뒤 이 자리를 채웁니다. 당일 60·61골 이상을 넣더라도 경신 순간은 59호골입니다.';
      $('mosaic-selected-credit').textContent=source?(recordMilestone.photoCredit||'59호골 경기 사진'):'현장 사진 미반영 · 59호골 번호 그래픽';link.hidden=false;
    }else{
      const [day,rival,city,score,competition]=goalData[n-1];
      const {goalsInMatch,ordinal}=goalMatchMeta[n-1];
      const sequence=goalsInMatch>1?` 이 경기에서 넣은 ${goalsInMatch}골 중 ${ordinal}번째 골.`:"";
      $('mosaic-selected-date').textContent=day.replaceAll('-','.');
      $('mosaic-selected-title').textContent=`${n}호골 · ${rival}전`;
      $('mosaic-selected-description').textContent=goalHighlights[n]?.[1]||`${competition}, ${city}.${sequence} 최종 스코어 한국 ${score.replace(':',' : ')} ${rival}.`;
      $('mosaic-selected-credit').textContent=source?[goalPhotoData[n].credit,goalPhotoData[n].captionSuffix].filter(Boolean).join(' · '):'해당 경기 사진 미확인 · 번호 그래픽';link.hidden=false;
    }
    paintDetail();
  }
  function openDetail(cell=null) {
    discover.classList.add('is-used');hidePreview();movieLastTime=0;
    configureDetailMap(true);
    if(!dialog.open)dialog.showModal();
    $('mosaic-dialog-scroll').scrollTop=0;
    $('mosaic-close').focus({preventScroll:true});
    detailZoom=1;anchor={x:data.width/2,y:data.height/2};
    selectGoal(cell?.n||59,cell);
    requestAnimationFrame(paintDetail);
  }
  $('mosaic-sample').addEventListener('click',()=>openDetail(sampleCell));
  dialog.addEventListener('close',()=>{detailGestures.reset();movieLastTime=0;if(menuDetail){menuDetail=false;$('mosaic-more-toggle').focus({preventScroll:true});}schedule();});
  $('mosaic-explore').addEventListener('click',()=>{
    $('mosaic-more').open=false;menuDetail=true;
    openDetail();picker.focus({preventScroll:true});picker.scrollIntoView({block:'nearest'});
  });
  $('mosaic-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  $('mosaic-go-to-archive').addEventListener('click',()=>{
    dialog.close();document.dispatchEvent(new CustomEvent('goal:select',{detail:selectedGoal}));
  });
  picker.addEventListener('change',()=>{selectGoal(Number(picker.value));anchor={x:(selected.col+.5)*data.tile,y:(selected.row+.5)*data.tile};paintDetail();});
  function changeZoom(direction) {
    detailZoom=(direction>0?zoomStops.find(z=>z>detailZoom+.001):[...zoomStops].reverse().find(z=>z<detailZoom-.001))|| (direction>0?64:1);
    if(selected && direction>0)anchor={x:(selected.col+.5)*data.tile,y:(selected.row+.5)*data.tile};
    paintDetail();
  }
  $('mosaic-zoom-in').addEventListener('click',()=>changeZoom(1));
  $('mosaic-zoom-out').addEventListener('click',()=>changeZoom(-1));
  $('mosaic-reset').addEventListener('click',()=>{detailZoom=1;anchor={x:data.width/2,y:data.height/2};paintDetail();});
  function localPoint(event,target) {
    const rect=target.getBoundingClientRect();return {x:(event.clientX-rect.left)*target.width/rect.width,y:(event.clientY-rect.top)*target.height/rect.height};
  }
  function hidePreview() {
    hovered=null;hoverCard.hidden=true;hoverCard.inert=true;
    hoverCard.classList.remove('is-touch-preview');story.classList.remove('has-touch-preview');
    hoverCard.classList.remove('is-docked-preview');
    if(hoverCard.parentElement!==windowEl)windowEl.append(hoverCard);
    previewOpen.tabIndex=-1;previewClose.hidden=true;
  }
  function showPreview(cell,touch=false) {
    hidePreview();if(!cell)return;$('mosaic-more').open=false;
    hovered=cell;hoverCard.hidden=false;hoverCard.inert=!touch;
    hoverCard.classList.toggle('is-touch-preview',touch);story.classList.toggle('has-touch-preview',touch);
    const docked=touch && innerWidth<=800;
    hoverCard.classList.toggle('is-docked-preview',docked);
    if(docked)previewDock.append(hoverCard);
    previewOpen.tabIndex=touch?0:-1;previewClose.hidden=!touch;
    const photo=$('mosaic-hover-photo'),number=$('mosaic-preview-number');
    const entry=goalPhotoData[cell.n];
    const source=(touch?entry?.mobile:entry?.src)||entry?.src||(cell.n===59?recordMilestone.photo:null);
    number.textContent=String(cell.n).padStart(2,'0');number.hidden=!!source;photo.hidden=!source;
    photo.onerror=()=>{if(hovered?.n===cell.n){photo.hidden=true;number.hidden=false;}};
    if(source)photo.src=source;
    const title=cell.n===59?`59호골 · ${recordMilestone.confirmed?recordMilestone.opponent+'전 · 단독 1위':'경신 가정'}`:`${cell.n}호골 · ${goalData[cell.n-1][1]}전`;
    $('mosaic-hover-title').textContent=title;previewOpen.setAttribute('aria-label',`${title} 상세 기록 보기`);
    $('mosaic-preview-hint').textContent=docked?'눌러서 기록 보기':touch?'미리보기를 눌러 기록 보기':'눌러서 그날의 골 보기 ↗';
  }
  previewOpen.addEventListener('click',()=>{if(!hoverCard.hidden && hoverCard.classList.contains('is-touch-preview') && hovered)openDetail(hovered);});
  previewClose.addEventListener('click',()=>{
    const docked=hoverCard.classList.contains('is-docked-preview');
    hidePreview();if(docked)$('mosaic-more-toggle').focus({preventScroll:true});schedule();
  });
  canvas.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse'||story.dataset.phase!=='3'||story.dataset.revealStage!=='explore'||story.dataset.nameStep!=='4'||!storyGeometry||dialog.open)return;
    const point=localPoint(event,canvas),cell=R.hit(point.x,point.y,storyGeometry,data);
    showPreview(cell);
    schedule();
  });
  canvas.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'){hidePreview();schedule();}});
  function renderMain(){if(frame){cancelAnimationFrame(frame);frame=0;}updateStory();}
  const mainGestures=SonMosaicGestures.bind(canvas,{
    data,enabled:()=>ready&&story.dataset.phase==='3'&&story.dataset.revealStage==='explore'&&story.dataset.nameStep==='4'&&!dialog.open,
    mouseDrag:true,
    getView:()=>({zoom:userZoom,geometry:storyGeometry}),
    setView:view=>{userZoom=view.zoom;userAnchor=view.anchor;hidePreview();renderMain();},
    onStart:()=>{hidePreview();schedule();},
    onScroll:top=>{
      document.documentElement.classList.add('is-scrolling-mosaic');
      window.scrollBy({top,behavior:'instant'});
    },
    onEnd:()=>document.documentElement.classList.remove('is-scrolling-mosaic'),
    onTap:(point,event)=>{
      if(!storyGeometry)return;
      const cell=R.hit(point.x,point.y,storyGeometry,data);
      if(event.pointerType==='mouse'){if(cell)openDetail(cell);}
      else{showPreview(cell,true);schedule();}
    }
  });
  const detailGestures=SonMosaicGestures.bind(detailCanvas,{
    data,enabled:()=>ready&&dialog.open,mouseDrag:true,
    getView:()=>({zoom:detailZoom,geometry:detailGeometry}),
    setView:view=>{detailZoom=view.zoom;anchor=view.anchor;paintDetail();},
    onTap:p=>{if(!detailGeometry)return;const cell=R.hit(p.x,p.y,detailGeometry,data);if(cell)selectGoal(cell.n,cell);}
  });
  $('mosaic-restore').addEventListener('click',()=>{hidePreview();userZoom=1;userAnchor={x:data.width/2,y:data.height/2};mainGestures.reset();renderMain();});
  $('mosaic-continue').addEventListener('click',()=>{
    hidePreview();mainGestures.reset();$('journey').scrollIntoView({behavior:reduceMotion.matches?'instant':'smooth',block:'start'});
  });
  detailCanvas.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(event.key))return;
    event.preventDefault();
    let cell=selected||{col:data.origin.col,row:data.origin.row};
    if(event.key==='ArrowLeft')cell={...cell,col:R.clamp(cell.col-1,0,data.cols-1)};
    if(event.key==='ArrowRight')cell={...cell,col:R.clamp(cell.col+1,0,data.cols-1)};
    if(event.key==='ArrowUp')cell={...cell,row:R.clamp(cell.row-1,0,data.rows-1)};
    if(event.key==='ArrowDown')cell={...cell,row:R.clamp(cell.row+1,0,data.rows-1)};
    cell.n=data.cells[cell.row*data.cols+cell.col];selectGoal(cell.n,cell);
    if(detailZoom>1)anchor={x:(cell.col+.5)*data.tile,y:(cell.row+.5)*data.tile};paintDetail();
  });
  $('mosaic-replay').addEventListener('click',()=>{
    $('mosaic-more').open=false;
    if(story.classList.contains('is-enhanced')){if(frame){cancelAnimationFrame(frame);frame=0;}film.reset();movieElapsed=0;movieLastTime=0;moviePaused=false;$('intro-pause').textContent='잠시 멈춤';$('intro-pause').setAttribute('aria-pressed','false');window.scrollTo({top:scrollY+story.getBoundingClientRect().top-sonReadingTop(),behavior:'instant'});updateStory();}
    else openDetail();
  });
  $('mosaic-more').addEventListener('keydown',event=>{
    if(event.key==='Escape' && $('mosaic-more').open){event.preventDefault();$('mosaic-more').open=false;$('mosaic-more-toggle').focus({preventScroll:true});}
  });
  $('intro-pause').addEventListener('click',()=>{
    moviePaused=!moviePaused;movieLastTime=0;$('intro-pause').textContent=moviePaused?'이어서 보기':'잠시 멈춤';
    $('intro-pause').setAttribute('aria-pressed',String(moviePaused));schedule();
  });
  function finishIntro(){movieElapsed=film.recordStart;movieLastTime=0;moviePaintTime=0;moviePaused=false;$('intro-pause').textContent='잠시 멈춤';$('intro-pause').setAttribute('aria-pressed','false');schedule();}
  $('intro-ending').addEventListener('click',finishIntro);
  document.addEventListener('visibilitychange',()=>{hidePreview();mainGestures.reset();detailGestures.reset();movieLastTime=0;schedule();});
  window.addEventListener('scroll',schedule,{passive:true});
  $('goal-archive').addEventListener('toggle',schedule);
  window.addEventListener('resize',configure);reduceMotion.addEventListener('change',configure);
  window.addEventListener('load',configure,{once:true});
  configure();
})();
