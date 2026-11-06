from pathlib import Path
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
p=r/'output/five-final-review-20261102/responsive.html';s=p.read_text(encoding='utf-8').replace('<span id="size">','<button id="top">화면 맨 위</button><span id="size">').replace("const p=document.getElementById('page'),e=document.getElementById('episode');", "const p=document.getElementById('page'),e=document.getElementById('episode');document.getElementById('top').onclick=()=>{window.scrollTo(0,0);p.contentWindow.scrollTo(0,0);};").replace("+'/?deep=20261102'+hash", "+'/?deep=20261102-'+Date.now()+hash");p.write_text(s,encoding='utf-8')
p=r/'goodeasy/violin-final-fit.test.mjs';s=p.read_text(encoding='utf-8').replace('Math.abs(p.getY(i)-.106),Math.abs(p.getY(i)+.105)', 'Math.abs(p.getY(i)-ribs.userData.violinRibs.yTop),Math.abs(p.getY(i)-ribs.userData.violinRibs.yBottom)')
s+='''
test('rib wall is inset from plate cut walls so the two cannot z-fight',()=>{
 const rib=m.parts.ribs,p=rib.geometry.attributes.position,edge=m.parts.top.geometry.attributes.position;
 for(let i=0;i<p.count;i++){let nearest=Infinity;for(let j=0;j<320;j++)nearest=Math.min(nearest,Math.hypot(p.getX(i)-edge.getX(j),p.getZ(i)-edge.getZ(j)));assert.ok(nearest>.009,'coincident or near-coincident outer wall '+nearest);}
 assert.ok(rib.userData.violinRibs.yTop<.106&&rib.userData.violinRibs.yTop>.092);assert.ok(rib.userData.violinRibs.yBottom<-.105&&rib.userData.violinRibs.yBottom>-.121);
});
test('fingerboard has outward triangles, positive closed volume and independent side normals',()=>{
 const g=m.parts.fingerboard.geometry,p=g.attributes.position,n=g.attributes.normal,idx=g.index;let volume=0,top=0;
 for(let i=0;i<idx.count;i+=3){const ids=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)],v=ids.map(i=>new T.Vector3().fromBufferAttribute(p,i)),face=new T.Vector3().crossVectors(v[1].clone().sub(v[0]),v[2].clone().sub(v[0])),avg=ids.map(i=>new T.Vector3().fromBufferAttribute(n,i)).reduce((a,b)=>a.add(b),new T.Vector3());assert.ok(face.dot(avg)>0,'inside-out ebony triangle');volume+=v[0].dot(new T.Vector3().crossVectors(v[1],v[2]))/6;if(ids.every(i=>n.getY(i)>.9))top++;}
 assert.ok(volume>.003&&top>500);
});
''';p.write_text(s,encoding='utf-8')
