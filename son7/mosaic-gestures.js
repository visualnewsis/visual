/* Pointer gestures shared by the opening image and the photo explorer. */
(function (global) {
  function bind(target, options) {
    const pointers = new Map(), R = SonMosaicRenderer, data = options.data;
    let pinch = null, suppressUntil = 0;
    function local(pointer) {
      const rect = target.getBoundingClientRect();
      return {x:(pointer.x-rect.left)*target.width/rect.width, y:(pointer.y-rect.top)*target.height/rect.height};
    }
    function pair() {
      const [a,b] = [...pointers.values()].slice(0,2).map(local);
      return {x:(a.x+b.x)/2, y:(a.y+b.y)/2, distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))};
    }
    function startPinch() {
      if(pointers.size<2){pinch=null;return;}
      const p=pair(), view=options.getView(), g=view.geometry;
      if(!g)return;
      pinch={distance:p.distance,zoom:view.zoom,point:{x:(p.x-g.x)/g.scale,y:(p.y-g.y)/g.scale}};
      for(const pointer of pointers.values()){pointer.moved=true;pointer.pinched=true;pointer.scrolling=false;}
      suppressUntil=performance.now()+500;
    }
    function prevent(event){if(event.cancelable)event.preventDefault();}
    target.addEventListener('pointerdown',event=>{
      if(!options.enabled() || (event.pointerType==='mouse' && (event.button!==0 || !options.mouseDrag)))return;
      const p={x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false,pinched:false,scrolling:false};
      pointers.set(event.pointerId,p);target.setPointerCapture(event.pointerId);
      options.onStart?.();
      if(pointers.size>=2){prevent(event);startPinch();}
    });
    target.addEventListener('pointermove',event=>{
      const pointer=pointers.get(event.pointerId);if(!pointer)return;
      if(!options.enabled()){pointers.clear();pinch=null;options.onEnd?.();return;}
      const previous=local(pointer),previousY=pointer.y;pointer.x=event.clientX;pointer.y=event.clientY;
      pointer.moved ||= Math.hypot(pointer.x-pointer.startX,pointer.y-pointer.startY)>6;
      if(pointers.size>=2){
        prevent(event);if(!pinch)startPinch();if(!pinch)return;
        const p=pair(), zoom=R.clamp(pinch.zoom*p.distance/pinch.distance,1,64);
        const scale=Math.min(target.width/data.width,target.height/data.height)*zoom;
        options.setView({zoom,anchor:{x:pinch.point.x-(p.x-target.width/2)/scale,y:pinch.point.y-(p.y-target.height/2)/scale}});
        suppressUntil=performance.now()+500;
      }else{
        const view=options.getView(), g=view.geometry;
        const vertical=Math.abs(pointer.y-pointer.startY)>Math.abs(pointer.x-pointer.startX);
        const canScroll=options.onScroll && event.pointerType==='touch' && !pointer.pinched;
        // A fitted opening image passes vertical swipes to the article; the
        // same pointer stream remains available for an intentional pinch.
        if(canScroll && pointer.moved && view.zoom<=1.001 && (pointer.scrolling || vertical)){
          prevent(event);
          options.onScroll((pointer.scrolling?previousY:pointer.startY)-pointer.y);
          pointer.scrolling=true;suppressUntil=performance.now()+500;return;
        }
        // One finger only pans an already enlarged image. Never zoom on touch
        // or drag; enlargement requires a two-finger pinch or explicit control.
        if(!g || !pointer.moved || view.zoom<=1.001)return;
        prevent(event);const point=local(pointer);
        options.setView({zoom:view.zoom,anchor:{
          x:(previous.x-g.x)/g.scale-(point.x-target.width/2)/g.scale,
          y:(previous.y-g.y)/g.scale-(point.y-target.height/2)/g.scale
        }});
        if(canScroll && vertical){
          const after=options.getView().geometry,rect=target.getBoundingClientRect();
          const used=(after.y-g.y)*rect.height/target.height;
          const remainder=pointer.y-previousY-used;
          // Continue into the article after the image reaches its vertical edge.
          if(Math.abs(remainder)>.5)options.onScroll(-remainder);
        }
        if(pointer.moved)suppressUntil=performance.now()+500;
      }
    });
    function end(event,cancelled) {
      const pointer=pointers.get(event.pointerId);if(!pointer)return;
      pointer.moved ||= Math.hypot(event.clientX-pointer.startX,event.clientY-pointer.startY)>6;
      const wasPinch=!!pinch || pointers.size>1;
      pointers.delete(event.pointerId);
      if(wasPinch || pointer.moved)suppressUntil=performance.now()+500;
      if(!cancelled && !wasPinch && !pointer.moved && options.onTap){
        const p=local({x:event.clientX,y:event.clientY});options.onTap(p,event);
      }
      if(pointers.size>=2)startPinch();
      else{
        pinch=null;
        for(const p of pointers.values()){p.startX=p.x;p.startY=p.y;p.moved=true;}
      }
      if(!pointers.size)options.onEnd?.();
    }
    target.addEventListener('pointerup',event=>end(event,false));
    target.addEventListener('pointercancel',event=>end(event,true));
    target.addEventListener('lostpointercapture',event=>end(event,true));
    return {suppressClick:()=>performance.now()<suppressUntil,reset:()=>{pointers.clear();pinch=null;suppressUntil=0;options.onEnd?.();}};
  }
  global.SonMosaicGestures={bind};
})(globalThis);
