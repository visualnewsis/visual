from pathlib import Path
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');p=r/'goodeasy/gramophone/lateral-direction.test.mjs';p.write_text('''import test from 'node:test';import assert from 'node:assert/strict';import * as T from '../piano/vendor/three.module.min.js';import {buildGramophone} from './gramophone-model.js';
test('lateral-cut stylus vibration crosses the groove rather than running along it',()=>{
 const m=buildGramophone(T,{});
 for(const progress of[0,.25,.5,.75,1]){
  const points=[];for(const signal of[-.5,.5]){m.update({progress,angle:0,needleDown:true,signal});m.group.updateMatrixWorld(true);points.push(m.anchors.stylusTip.getWorldPosition(new T.Vector3()));}
  const motion=points[1].clone().sub(points[0]);motion.y=0;assert.ok(motion.length()>.0001);motion.normalize();const radial=points[0].clone().add(points[1]).multiplyScalar(.5).sub(new T.Vector3(...m.spec.discCenter));radial.y=0;radial.normalize();assert.ok(Math.abs(motion.dot(radial))>.96,'lateral movement must align with local disc radius, dot '+motion.dot(radial));
 }
});
''',encoding='utf-8')
# True liquid response replaces the obsolete all-foam roughness expectation, while continuity checks stay.
p=r/'goodeasy/espresso-final-material.test.mjs';s=p.read_text(encoding='utf-8').replace('liquid.material.roughness>=.55','liquid.material.roughness>=.24&&liquid.material.roughness<=.38');s+='''
test('beverage surface is dark opaque espresso and cannot inherit the all-foam appearance',()=>{const m=buildBrewRatio();m.update(m.defaults);const mat=m.group.getObjectByName('coffee surface').material;assert.equal(mat.transparent,false);assert.equal(mat.opacity,1);assert.equal(mat.transmission,0);const c=mat.color;assert.ok(c.r*.2126+c.g*.7152+c.b*.0722<.04);assert.equal(mat.userData.opaqueLiquid,true);assert.match(mat.customProgramCacheKey(),/opaque-espresso/);});
''';p.write_text(s,encoding='utf-8')
p=r/'goodeasy/espresso-crema-clearance.test.mjs';s=p.read_text(encoding='utf-8').replace('assert.ok(surface.material.roughness>=.55&&surface.material.roughness<=.75)','assert.ok(surface.material.roughness>=.24&&surface.material.roughness<=.38)');p.write_text(s,encoding='utf-8')
