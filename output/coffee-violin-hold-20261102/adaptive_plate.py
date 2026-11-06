from pathlib import Path
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');p=r/'goodeasy/assets/models/violin-surface.js';s=p.read_text(encoding='utf-8');start=s.index(' for(let pass=0;pass<3;pass++){');end=s.index(' triangles=triangles.map',start)
s=s[:start]+''' // Split only long edges, but split every adjacent triangle sharing that edge.
 // This bounds the actual carved surface spacing without enormous thin fan faces.
 const edgeLimit=.035;
 for(let pass=0;pass<10;pass++){
  const split=new Map(),key=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;
  for(const tri of triangles)for(let j=0;j<3;j++){const a=tri[j],b=tri[(j+1)%3],p=vertices[a],q=vertices[b];if(Math.hypot(p[0]-q[0],p[1]-q[1])>edgeLimit){const k=key(a,b);if(!split.has(k)){split.set(k,vertices.length);vertices.push([(p[0]+q[0])/2,(p[1]+q[1])/2]);}}}
  if(!split.size)break;const next=[];
  for(const [a,b,c]of triangles){const ab=split.get(key(a,b)),bc=split.get(key(b,c)),ca=split.get(key(c,a)),mask=(ab!==undefined?1:0)|(bc!==undefined?2:0)|(ca!==undefined?4:0);
   if(mask===0)next.push([a,b,c]);
   else if(mask===1)next.push([a,ab,c],[ab,b,c]);
   else if(mask===2)next.push([b,bc,a],[bc,c,a]);
   else if(mask===4)next.push([c,ca,b],[ca,a,b]);
   else if(mask===3)next.push([b,bc,ab],[a,ab,c],[ab,bc,c]);
   else if(mask===5)next.push([a,ab,ca],[ab,b,c],[ab,c,ca]);
   else if(mask===6)next.push([c,ca,bc],[a,b,ca],[b,bc,ca]);
   else next.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]);
  }triangles=next;
 }
'''+s[end:];p.write_text(s,encoding='utf-8')
print('Conforming adaptive plate subdivision: max edge 0.035 visualization units')
