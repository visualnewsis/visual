from pathlib import Path
import sys
r=Path(sys.argv[1])/'goodeasy';p=r/'piano/scene.js';s=p.read_text(encoding='utf8');a=' return {root,anchors,update(m,explode,time){';assert a in s
calibration=''' // Calibrate the authored felt surface against the string plane at normalized strike.
 root.updateWorldMatrix(true,true);const crownSamples=[];head.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){const v=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);hammer.worldToLocal(v);crownSamples.push(v);}});
 const crownY=angle=>hammer.position.y+Math.max(...crownSamples.map(v=>v.y*Math.cos(angle)-v.z*Math.sin(angle)));let low=0,high=1;for(let i=0;i<40;i++){const mid=(low+high)/2;if(crownY(mid)<3.66)low=mid;else high=mid;}const contactAngle=(low+high)/2;
 return {root,anchors,update(m,explode,time){'''
s=s.replace(a,calibration).replace('hammer.rotation.x=.59*m.hammer;','hammer.rotation.x=contactAngle*m.hammer;');p.write_text(s,encoding='utf8')
p=r/'geometry-audit.test.mjs';s=p.read_text(encoding='utf8').replace("console.log('PIANO hammer peak at strike:'", "assert.ok(Math.abs(maxY-3.66)<1e-5,'felt crown meets the string at strike without penetrating');\nconsole.log('PIANO hammer peak at strike:'");p.write_text(s,encoding='utf8')
for f in ['piano/observation.js','piano/index.html']:
 p=r/f;p.write_text(p.read_text(encoding='utf8').replace('20261024-audit1','20261024-audit2'),encoding='utf8')
print('Calibrated actual piano felt contact, regression assertion added')
