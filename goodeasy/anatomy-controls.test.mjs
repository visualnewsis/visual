import test from 'node:test';
import assert from 'node:assert/strict';
import {zoomDistance,wheelZoom,pinchZoom,zoomPercent} from './assets/anatomy-controls.js';
test('wheel zoom permits both directions and reverses without drift',()=>{const out=wheelZoom(1,120);assert.ok(out>1);assert.ok(zoomPercent(out)<100);assert.ok(Math.abs(wheelZoom(out,-120)-1)<1e-12);assert.ok(wheelZoom(1,-120)<1);});
test('pinch spreading zooms in; pinching together zooms out',()=>{assert.equal(pinchZoom(1,100,200),.5);assert.equal(pinchZoom(1,200,100),2);assert.equal(pinchZoom(.5,0,100),.5);});
test('zoom buttons can return from close-up and remain finite at limits',()=>{let z=1;for(let i=0;i<30;i++)z=zoomDistance(z,.8);assert.equal(z,.2);for(let i=0;i<30;i++)z=zoomDistance(z,1.25);assert.equal(z,6);assert.equal(zoomDistance(z,NaN),6);assert.equal(zoomDistance(1,0),1);});
