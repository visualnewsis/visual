// One original 24-drawing sequence, shared by the first experience and lessons.
export const FILM_FRAME_COUNT=24;
export const frameNumber=n=>((Math.floor(Number(n)||0)%FILM_FRAME_COUNT)+FILM_FRAME_COUNT)%FILM_FRAME_COUNT;
export function paintFilmFrame(ctx,frame,w,h){
 const n=frameNumber(frame),a=n/FILM_FRAME_COUNT*Math.PI*2;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#d9d0b9';ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='#b0a58c';ctx.lineWidth=Math.max(1,w/420);
 for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(0,h*(.12+i*.10));ctx.lineTo(w,h*(.12+i*.10));ctx.stroke();}
 const x=w*(.5+Math.sin(a)*.30),floor=h*.80,y=floor-h*(.08+.46*Math.abs(Math.cos(a))),r=h*.075;
 ctx.fillStyle='#ad9f81';ctx.beginPath();ctx.ellipse(x,floor+r*.7,r*1.25,r*.21,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#514c3e';ctx.lineWidth=Math.max(1.4,w/170);ctx.beginPath();ctx.moveTo(w*.06,floor+r);ctx.lineTo(w*.94,floor+r);ctx.stroke();
 ctx.fillStyle='#374c48';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#d3c39e';ctx.lineWidth=Math.max(1,w/270);ctx.beginPath();ctx.arc(x-r*.12,y-r*.06,r*.60,-Math.PI*.9,-Math.PI*.25);ctx.stroke();
 ctx.fillStyle='#5e6255';ctx.font=Math.max(9,Math.round(h*.05))+'px monospace';ctx.textAlign='left';ctx.fillText(String(n+1).padStart(2,'0')+' / 24',w*.055,h*.965);
}
