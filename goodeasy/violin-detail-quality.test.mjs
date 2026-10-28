import test from 'node:test';import assert from 'node:assert/strict';import * as T from './piano/vendor/three.module.min.js';import {buildViolin} from './assets/models/violin.js';
test('four tuning pegs occupy four distinct stations and each passes through both pegbox cheeks',()=>{
 const m=buildViolin(T),xs=[];m.group.updateMatrixWorld(true);
 for(let i=0;i<4;i++){const peg=m.group.getObjectByName('tuning peg shaft '+i);assert.ok(peg);const b=new T.Box3().setFromObject(peg);assert.ok(b.max.z>.06&&b.min.z<-.06);xs.push(peg.position.x.toFixed(4));}
 assert.equal(new Set(xs).size,4);
 const plates=m.parts.scroll.children.filter(o=>o.name.startsWith('pegbox '));const ray=new T.Raycaster(new T.Vector3(-1.8,2,0),new T.Vector3(0,-1,0));const hits=ray.intersectObjects(plates,true);assert.ok(hits.length);assert.ok(Math.max(...hits.map(h=>h.point.y))<.10);
});
test('modern bow camber approaches its hair at centre while both hair ends meet real anchors',()=>{
 const m=buildViolin(T);m.group.updateMatrixWorld(true);const stick=m.group.getObjectByName('cambered bow stick'),path=stick.geometry.parameters.path;
 assert.ok(path.getPoint(.5).y<Math.min(path.getPoint(0).y,path.getPoint(1).y)-.02);
 const frog=new T.Box3().setFromObject(m.group.getObjectByName('frog ferrule anchoring hair')),tip=new T.Box3().setFromObject(m.group.getObjectByName('carved bow head anchoring hair tip')),y=m.bow.userData.hairCenterlineY;
 for(let k=0;k<11;k++){const x=.03+(k-5)*.0025;assert.ok(frog.containsPoint(new T.Vector3(x,y,-.67).applyMatrix4(m.bow.matrixWorld)));assert.ok(tip.containsPoint(new T.Vector3(x,y,.67).applyMatrix4(m.bow.matrixWorld)));}
});
