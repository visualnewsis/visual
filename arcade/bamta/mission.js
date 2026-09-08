export const ROOMS = [
  {id:'office',name:'편집국',x0:-8,x1:8,z0:-6,z1:10},
  {id:'entry',name:'사무실 입구',x0:7,x1:13,z0:-6,z1:-2},
  {id:'corridor',name:'복도',x0:10,x1:13,z0:-18,z1:-3},
  {id:'corner',name:'화장실 앞',x0:10,x1:24,z0:-21,z1:-17},
  {id:'restroom',name:'화장실',x0:15,x1:18,z0:-25,z1:-20},
  {id:'lobby',name:'12층 엘리베이터 홀',x0:20,x1:26,z0:-28,z1:-20},
  {id:'lift',name:'엘리베이터',x0:21,x1:24,z0:-31,z1:-27}
];
export const SPAWN={x:0,z:6,yaw:0};
export const SEAT={x:0,z:6};
export const CALL={x:24.8,z:-27.1};
export function floorAt(x,z){return ROOMS.some(r=>x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1);}
export function onFloor(x,z,r=.22){return [[-r,-r],[-r,r],[r,-r],[r,r]].every(([dx,dz])=>floorAt(x+dx,z+dz));}
export class Mission{
  constructor(){this.reset();}
  reset(){this.phase='outbound';this.time=0;this.total=0;this.door=0;this.events=[];}
  set(phase){this.phase=phase;this.time=0;this.events.push(phase);}
  act(event){
    if(event==='call'&&this.phase==='outbound')this.set('calling');
    else if(event==='board'&&this.phase==='boarding')this.set('closing');
    else if(event==='desk'&&this.phase==='return')this.set('finished');
    else if(event==='shoot'&&this.phase==='choice')this.set('escape');
    else if(event==='obey'&&this.phase==='choice')this.set('return');
  }
  tick(dt){
    this.time+=dt;if(this.phase!=='finished')this.total+=dt;
    if(this.phase==='calling'){this.door=Math.min(1,Math.max(0,(this.time-.8)/1.2));if(this.time>=2)this.set('boarding');}
    else if(this.phase==='closing'){this.door=Math.max(.02,1-this.time/2.7);if(this.time>=2.65)this.set('director');}
    else if(this.phase==='director'){this.door=Math.min(1,.02+this.time/.95);if(this.time>=4.2)this.set('choice');}
    else if(this.phase==='escape'){this.door=Math.max(0,1-Math.max(0,this.time-.8)/1.8);if(this.time>=3.4)this.set('escaped');}
  }
  drain(){return this.events.splice(0);}
}
