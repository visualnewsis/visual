const route=[{x:1.8,z:6},{x:1.8,z:-4.6},{x:11.5,z:-4.6},{x:11.5,z:-19},{x:22.5,z:-19},{x:24.5,z:-26.7}];
const chapters={
  outbound:['01','퇴근 동선 확보','동료를 지나 엘리베이터 홀로 이동하세요.'],
  calling:['02','호출 완료','조금만 기다리면 문이 열립니다.'],
  boarding:['02','엘리베이터 도착','문 안쪽까지 들어가세요.'],
  closing:['03','거의 다 왔다','문이 닫히고 있습니다.'],
  director:['!','퇴근 보류','예상하지 못한 사람이 나타났습니다.'],
  choice:['!','마지막 선택','신문 한 부에 오늘의 퇴근이 달려 있습니다.'],
  escape:['03','퇴근 승인','문이 닫힐 때까지 기다리세요.'],
  return:['↶','자리로 복귀','지도를 따라 원래 자리로 돌아가세요.']
};
export class Dispatch{
  constructor(root){this.root=root;this.reset();}
  reset(){this.seen=new Set();this.memo=new Set();this.distance=0;this.previous=null;this.last='';}
  update(player,mission,room,toast){
    if(this.previous)this.distance+=Math.hypot(player.x-this.previous.x,player.z-this.previous.z);
    this.previous={x:player.x,z:player.z};
    const chapter=chapters[mission.phase]||chapters.outbound;
    const key=[...chapter,room].join();
    if(key!==this.last){this.last=key;this.root('#chapter-number').textContent=chapter[0];this.root('#chapter-title').textContent=chapter[1];this.root('#chapter-hint').textContent=mission.phase==='outbound'&&room==='lobby'?'엘리베이터 오른쪽의 호출 버튼을 누르세요.':chapter[2];}
    if(mission.phase==='outbound'&&!this.seen.has(room)){
      this.seen.add(room);
      if(room==='entry')toast('퇴근 인사는 마음속으로. 복도는 오른쪽이다.');
      if(room==='corner')toast('여기서 한 번 더 오른쪽. 엘리베이터가 보인다.');
      if(room==='lobby')toast('문 오른쪽의 ▼ 버튼. E를 눌러 호출하자.');
    }
    this.root('#route').setAttribute('data-progress',mission.phase==='outbound'?(room==='office'?0:1):mission.phase==='return'?0:2);
  }
  remember(id){const first=!this.memo.has(id);this.memo.add(id);return first;}
  stats(total){return {seconds:Math.floor(total),distance:Math.round(this.distance),memos:this.memo.size};}
}
export function drawRoute(c,player,mission,rooms,elapsed){
  const scale=4,tx=49,tz=135;
  c.clearRect(0,0,200,200);c.fillStyle='#10251eea';c.fillRect(0,0,200,200);
  c.fillStyle='#3c5c4c';for(const r of rooms)c.fillRect(tx+r.x0*scale,tz+r.z0*scale,(r.x1-r.x0)*scale,(r.z1-r.z0)*scale);
  c.strokeStyle='#a7bc9066';c.lineWidth=1;for(const r of rooms)c.strokeRect(tx+r.x0*scale,tz+r.z0*scale,(r.x1-r.x0)*scale,(r.z1-r.z0)*scale);
  c.strokeStyle='#c5e79988';c.setLineDash([2,4]);c.beginPath();route.forEach((p,i)=>{if(i)c.lineTo(tx+p.x*scale,tz+p.z*scale);else c.moveTo(tx+p.x*scale,tz+p.z*scale);});c.stroke();c.setLineDash([]);
  const target=mission.phase==='return'?{x:0,z:6}:{x:22.5,z:-29};
  c.strokeStyle='#d6e9ac';c.lineWidth=1;c.beginPath();c.arc(tx+target.x*scale,tz+target.z*scale,5+Math.sin(elapsed*2)*1,0,Math.PI*2);c.stroke();
  c.fillStyle='#c5e799';c.fillRect(tx+target.x*scale-2,tz+target.z*scale-2,4,4);
  c.save();c.translate(tx+player.x*scale,tz+player.z*scale);c.rotate(-player.yaw);c.fillStyle='#f0f4df';c.beginPath();c.moveTo(0,-6);c.lineTo(-4,4);c.lineTo(4,4);c.closePath();c.fill();c.restore();
  c.fillStyle='#b8ccad';c.font='8px monospace';c.fillText('12F / EXIT ROUTE',12,18);c.fillStyle='#e5ebce';c.font='9px sans-serif';c.fillText(mission.phase==='return'?'목적지 · 내 자리':'목적지 · 엘리베이터',12,187);
}
