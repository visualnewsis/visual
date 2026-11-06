from pathlib import Path
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');p=r/'goodeasy/violin-final-fit.test.mjs';s=p.read_text(encoding='utf-8');s+='''
test('chinrest edge uses dedicated outward wall normals and clears the ebony tailpiece',()=>{
 const bowl=m.group.getObjectByName('carved ebony chinrest bowl'),tail=m.group.getObjectByName('tapered ebony tailpiece'),p=bowl.geometry.attributes.position,n=bowl.geometry.attributes.normal;let walls=0;
 for(let i=0;i<p.count;i++)if(Math.abs(n.getY(i))<1e-8){walls++;assert.ok(Math.abs(Math.hypot(n.getX(i),n.getZ(i))-1)<1e-6);assert.ok((p.getX(i)-.94)*n.getX(i)+(p.getZ(i)+.26)*n.getZ(i)>0);}
 assert.equal(walls,146);
 for(let x=.70;x<1.18;x+=.012)for(let z=-.38;z<-.08;z+=.008){const a=heights(bowl,x,z),b=heights(tail,x,z);if(a.length&&b.length){const loA=Math.min(...a),hiA=Math.max(...a),loB=Math.min(...b),hiB=Math.max(...b);assert.ok(hiA<=loB||hiB<=loA,'tailpiece intersects chinrest '+x+','+z);}}
});
''';p.write_text(s,encoding='utf-8')
