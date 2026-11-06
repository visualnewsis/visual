from pathlib import Path
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');p=r/'goodeasy/assets/models/violin-fittings.js';s=p.read_text(encoding='utf-8').replace('cz=-.23,rx=.23,rz=.14','cz=-.26,rx=.23,rz=.11').replace('[-.16,-.27]','[-.20,-.27]')
s=s.replace("for(let j=0;j<cols;j++){const a=rows*stride+j,b=a+1;index.push(a,b,N+a,b,N+b,N+a);}","""// Dedicated wall vertices keep the ebony edge's normals separate from bowl/cork faces.
 for(let j=0;j<=cols;j++){const a=j/cols*Math.PI*2,n=new T.Vector3(Math.cos(a)/rx,0,Math.sin(a)/rz).normalize();for(const source of[rows*stride+j,N+rows*stride+j]){positions.push(...positions.slice(source*3,source*3+3));normals.push(n.x,0,n.z);}}
 const wallStart=N*2;for(let j=0;j<cols;j++){const a=wallStart+j*2,b=a+2;index.push(a,b,a+1,b,b+1,a+1);}""")
p.write_text(s,encoding='utf-8');print('Chinrest edge normals separated; side mount clears tailpiece')
