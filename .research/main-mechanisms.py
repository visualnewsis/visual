from pathlib import Path
import sys
r=Path(sys.argv[1])/'goodeasy';p=r/'assets/quality-machines.mjs';s=p.read_text(encoding='utf8')
a='const inner=.56*2.8/aperture;';assert a in s;s=s.replace(a,'const inner=.35*2.8/aperture;')
a='const gears=[gear(works,.57,.56,1.0,.2,36),gear(works,.34,1.21,1.01,-.28,28),gear(works,.27,1.18,1.01,.56,24)]';assert a in s;s=s.replace(a,'const gears=[gear(works,.54,.10,1.0,.12,36),gear(works,.27,.91,1.0,.12,18),gear(works,.27,1.45,1.0,.12,18)]')
a='gears.forEach((g,i)=>g.rotation.y=(s.elapsed||0)*.2*(i%2?-1:1));balance.rotation.y=Math.sin((s.elapsed||0)*15)*.7;';assert a in s;s=s.replace(a,"gears.forEach((g,i)=>g.rotation.y=-(s.elapsed||0)*TAU/3600*[1,-2,2][i]+(i===1?Math.PI/18:0));balance.rotation.y=Math.sin((s.elapsed||0)*TAU*1.875)*.7;escapement.visible=false;")
p.write_text(s,encoding='utf8')
p=r/'geometry-audit.test.mjs';s=p.read_text(encoding='utf8');s+='''
const {buildCamera,buildWatch}=await import('./assets/quality-machines.mjs');
const camera=buildCamera();camera.update({aperture:1.4});camera.group.updateMatrixWorld(true);const iris=camera.parts.aperture;
const probe=new T.Raycaster(new T.Vector3(.15,1.45,5),new T.Vector3(0,0,-1));assert.equal(probe.intersectObject(iris,true).length,0,'large aperture clears off-axis ray');camera.update({aperture:8});camera.group.updateMatrixWorld(true);assert.ok(probe.intersectObject(iris,true).length>0,'small aperture blocks the same ray');
const watch=buildWatch();watch.update({elapsed:60});const visibleWheels=watch.parts.gears.children.filter(o=>o.geometry?.type==='CylinderGeometry');console.log('PASS actual camera aperture ray occlusion at f/1.4 and f/8; watch first-view builder loaded');
''';p.write_text(s,encoding='utf8')
# Refreshed versions after first-view fixes.
for p in (r/'assets').rglob('*'):
 if p.suffix in ['.mjs','.js']:p.write_text(p.read_text(encoding='utf8').replace('20261024-r8','20261024-r9'),encoding='utf8')
for p in r.glob('*/index.html'):p.write_text(p.read_text(encoding='utf8').replace('20261024-r8','20261024-r9'),encoding='utf8')
print('First-view camera and watch corrections applied')
