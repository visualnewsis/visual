/* Eight selected matches; original photographs stay separate from the final mosaic reveal. */
(() => {
  const scenes=[
    {n:1,label:'2011 · 인도전 · 01호골',text:'열여덟, 첫 골.',frames:['1-1'],hold:1600,note:'당시 자료 사진'},
    {n:7,label:'2014 · 알제리전 · 07호골',text:'패배 속에 남은 첫 월드컵 골.',frames:['7-2'],hold:1500},
    {n:14,label:'2015 · 라오스전 · 12·13·14호골',text:'한 경기, 세 골. 첫 해트트릭.',frames:['14-2'],hold:1450},
    {n:22,label:'2018 · 멕시코전 · 22호골',text:'두 번째 월드컵에서도 골.',frames:['22-1'],hold:1400},
    {n:23,label:'2018 · 독일전 · 23호골',text:'카잔의 마지막 질주.',frames:['23-1','23-2'],holds:[1600,1200],frameTexts:['카잔의 마지막 질주.','끝까지 달린 뒤, 동료들의 품으로.']},
    {n:32,label:'2022 · 칠레전 · 32호골',text:'A매치 100번째 경기, 프리킥 골.',frames:['32-2'],hold:1450},
    {n:44,label:'2024 · 호주전 8강 · 44호골',text:'이번엔 연장을 끝낸 골.',frames:['44-3'],hold:1650},
    {n:59,label:'2026 · 우즈베키스탄전 · 59호골',opponent:'우즈베키스탄',text:'전설로 남은 자리, 마침내 손에.',frames:['59-1','59-2','59-3','59-4','59-5','59-6'],holds:[750,1050,1100,1100,1500,2200],frameTexts:['58골에서, 59골로.','58골을 넘어선 오른발.','한국 축구의 새 기록.','59번째 골, 터져 나온 환호.','동료들과 함께 나눈 기쁨.','전설로 남은 자리, 마침내 손에.'],note:'2026.10.06 · 우즈베키스탄전 · 사진 = 뉴시스'}
  ];
  function create({data,image,getAtlas,getPortrait=()=>null,onReady}){
    const R=SonMosaicRenderer,$=id=>document.getElementById(id);
    const panel=$('intro-highlights'),photo=$('intro-photo'),previous=$('intro-photo-previous');
    const record=$('record-focus'),placeholder=$('record-goal-placeholder');
    const timeline=[];let recordStart=0;
    scenes.forEach((scene,index)=>scene.frames.forEach((stem,frameIndex)=>{
      const hold=scene.holds?.[frameIndex]??scene.hold;
      timeline.push({...scene,index,frameIndex,stem,text:scene.frameTexts?.[frameIndex]??scene.text,start:recordStart,end:recordStart+hold});recordStart+=hold;
    }));
    const photosEnd=recordStart,silence=500;recordStart+=silence;
    const recordHold=600,finalReveal=3200,duration=recordStart+recordHold+finalReveal;
    let key='',oldSource='',pending='',blankTarget=null;
    const cache=new Map(),requests=new Map(),failed=new Set(),queue=[];let active=0;
    const source=stem=>`assets/${stem.startsWith('59-')?'intro':'goal-zip'}-${stem}${matchMedia('(max-width: 800px)').matches?'-mobile':''}.webp`;
    function state(time){
      time=R.clamp(time,0,duration);
      if(time>=recordStart)return {n:59,phase:time>=duration?3:2,reveal:R.clamp((time-recordStart-recordHold)/finalReveal,0,1)};
      if(time>=photosEnd)return {n:59,phase:1,reveal:0,quiet:true};
      return {...timeline.find(x=>time<x.end),phase:0,reveal:0};
    }
    function drain(){
      while(active<2&&queue.length){
        const {src,resolve}=queue.shift();active++;const im=new Image();im.decoding='async';
        let finished=false;const finish=ok=>{if(finished)return;finished=true;if(ok){cache.delete(src);cache.set(src,im);while(cache.size>3)cache.delete(cache.keys().next().value);}else failed.add(src);requests.delete(src);active--;resolve(ok?im:null);drain();};
        im.onload=async()=>{try{if(im.decode)await im.decode();finish(true);}catch{finish(false)}};im.onerror=()=>finish(false);im.src=src;
      }
    }
    function load(src){
      if(cache.has(src))return Promise.resolve(cache.get(src));if(failed.has(src))return Promise.resolve(null);if(requests.has(src))return requests.get(src);
      const p=new Promise(resolve=>queue.push({src,resolve}));requests.set(src,p);drain();return p;
    }
    function warm(time){const current=state(time);if(current.stem){load(source(current.stem));const next=state(current.end);if(next.stem){load(source(next.stem));if(current.n===59){const following=state(next.end);if(following.stem)load(source(following.stem));}}}}
    function readyAt(time){
      const s=state(time);if(!s.stem)return true;const src=source(s.stem);
      if(cache.has(src)||failed.has(src))return true;
      if(pending!==src){pending=src;load(src).then(()=>{if(pending===src)pending='';onReady();});}return false;
    }
    function camera(width,height,reveal){
      const fit=Math.min(width/data.width,height/data.height),startZoom=Math.max(width,height)/(fit*data.tile);
      const eased=reveal*reveal*(3-2*reveal),zoom=Math.exp(Math.log(startZoom)*(1-eased));
      const origin={x:(data.origin.col+.5)*data.tile,y:(data.origin.row+.5)*data.tile};
      const focus=R.clamp((zoom-1)/5,0,1),weight=focus*focus*(3-2*focus);
      return {zoom,anchor:{x:data.width/2+(origin.x-data.width/2)*weight,y:data.height/2+(origin.y-data.height/2)*weight}};
    }
    function paint(target,width,height,time,cssWidth,cssHeight){
      const s=state(time);panel.hidden=s.phase!==0;record.hidden=s.phase!==2;
      let geometry;
      if(s.phase<2){
        if(blankTarget!==target){target.clearRect(0,0,width,height);target.fillStyle='#070c12';target.fillRect(0,0,width,height);blankTarget=target;}
        geometry=R.geometry(width,height,data);
        if(s.quiet)return {state:s,geometry};
        const src=source(s.stem),loaded=cache.get(src);
        if(key!==src){
          oldSource=photo.hidden?'':photo.src;previous.style.transform=photo.style.transform||'none';previous.style.transformOrigin=photo.style.transformOrigin||'center';key=loaded||failed.has(src)?src:'';previous.hidden=!oldSource;if(oldSource)previous.src=oldSource;
          photo.hidden=!loaded;if(loaded){photo.src=loaded.src;photo.alt=`${s.opponent||goalData[s.n-1][1]}전 손흥민 ${s.n}호골 경기 사진`;}
          $('intro-label').textContent=s.label;$('intro-line').textContent=s.text;
          $('intro-credit').textContent=s.note||'';$('intro-credit').hidden=!s.note;$('intro-loading').hidden=!!loaded;
          $('intro-loading').textContent=failed.has(src)?'사진을 불러오지 못했습니다. 아래 골 기록에서 다시 볼 수 있어요.':'사진 준비 중';
        }
        // The six original record photos linger with a gentle push-in, then the
        // final photograph moves toward the shirt's real number 7.
        const closing=s.stem==='59-6';
        const focusProgress=closing?R.clamp((time-s.start-350)/(s.end-s.start-350),0,1):0;
        const eased=focusProgress*focusProgress*(3-2*focusProgress);
        const photoHeight=Math.max(1,cssHeight-180),fit=Math.min(cssWidth/1200,photoHeight/800);
        const fx=(cssWidth-1200*fit)/2+642*fit,fy=(photoHeight-800*fit)/2+622*fit;
        const shotProgress=R.clamp((time-s.start)/(s.end-s.start),0,1);
        const shotEase=shotProgress*shotProgress*(3-2*shotProgress);
        photo.style.transformOrigin=closing?`${fx}px ${fy}px`:'center';
        photo.style.transform=closing?`translate(${(cssWidth/2-fx)*eased}px,${(photoHeight/2-fy)*eased}px) scale(${1+1.8*eased})`:s.n===59?`scale(${1+.045*shotEase})`:'none';
        const fade=oldSource?R.clamp((time-s.start)/(s.n===59?400:280),0,1):1;
        photo.style.opacity=String(fade);previous.style.opacity=String(1-fade);warm(time);
      }else{
        blankTarget=null;const view=camera(width,height,s.reveal);
        geometry=R.paint(target,width,height,image,data,view.zoom,view.anchor,null,getAtlas(),data.origin,getPortrait());
        if(s.phase===2){
          const ratio=cssWidth/width,base=Math.max(cssWidth,cssHeight),size=data.tile*geometry.scale*ratio;
          const x=(geometry.x+data.origin.col*data.tile*geometry.scale)*ratio,y=(geometry.y+data.origin.row*data.tile*geometry.scale)*ratio;
          record.style.width=record.style.height=`${base}px`;record.style.transform=`translate3d(${x}px,${y}px,0) scale(${size/base})`;
          record.style.opacity=String(R.clamp((size-48)/96,0,1));record.style.setProperty('--record-number-size',`${base*.27}px`);
          placeholder.style.setProperty('--record-copy-opacity',String(1-R.clamp(s.reveal/.12,0,1)));
        }
      }
      return {state:s,geometry};
    }
    function reset(){key='';oldSource='';blankTarget=null;photo.hidden=previous.hidden=true;warm(0);}
    reset();
    return {duration,photosEnd,silence,recordStart,recordHold,finalReveal,state,readyAt,paint,camera,reset,stats:()=>({retained:cache.size,active,queued:queue.length})};
  }
  window.SonIntroHighlights={create,scenes};
})();
