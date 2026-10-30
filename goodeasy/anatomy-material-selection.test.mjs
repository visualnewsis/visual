import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as T from './piano/vendor/three.module.min.js';
const source=(await readFile(new URL('./assets/anatomy-viewer.js',import.meta.url),'utf8')).replace(/^import .*;\r?$/gm,'');
const context=vm.createContext({document:{body:{dataset:{}},getElementById:()=>null},window:{addEventListener(){}},location:{pathname:'/none/'},anatomyBuilders:{}});
vm.runInContext(source,context);
const {captureAnatomyMaterials,applyAnatomyHighlight,restoreAnatomyVisibility}=context;

test('multi-material cutaway fades every slot and restores original rendering properties',()=>{
 const root=new T.Group(),wood=new T.MeshStandardMaterial({opacity:.8,transparent:true,depthWrite:false,emissive:0x110804}),rim=new T.MeshStandardMaterial({opacity:1});
 const shell=new T.Mesh(new T.BoxGeometry(),[wood,rim,wood]),post=new T.Mesh(new T.BoxGeometry(),wood);root.add(shell,post);
 const entries=captureAnatomyMaterials(root);
 assert.equal(entries.length,2);assert.equal(entries[0].slots.length,2);
 assert.equal(shell.material[0],shell.material[2],'repeated slots share one cloned material');
 assert.notEqual(shell.material[0],wood);assert.notEqual(post.material,shell.material[0]);
 const original=shell.material.map(m=>({opacity:m.opacity,transparent:m.transparent,depth:m.depthWrite,color:m.emissive.clone()}));
 applyAnatomyHighlight(entries,new Set([post]),{selected:true});
 for(const m of shell.material){assert.equal(m.opacity,.13);assert.equal(m.transparent,true);assert.equal(m.depthWrite,false);}
 assert.equal(post.material.opacity,.8,'selected internal component remains visible');
 applyAnatomyHighlight(entries,new Set(),{selected:false});
 shell.material.forEach((m,i)=>{assert.equal(m.opacity,original[i].opacity);assert.equal(m.transparent,original[i].transparent);assert.equal(m.depthWrite,original[i].depth);assert.ok(m.emissive.equals(original[i].color));});
 assert.equal(wood.opacity,.8,'source material is untouched');
});

test('contact mode restores mesh visibility once even when slots repeat, preserving already hidden objects',()=>{
 const root=new T.Group(),m=new T.MeshStandardMaterial(),shell=new T.Mesh(new T.BoxGeometry(),[m,m]),hidden=new T.Mesh(new T.BoxGeometry(),[m,m]);hidden.visible=false;root.add(shell,hidden);
 const entries=captureAnatomyMaterials(root);
 applyAnatomyHighlight(entries,new Set(),{selected:true,contact:true});
 applyAnatomyHighlight(entries,new Set(),{selected:true,contact:true});
 assert.equal(shell.visible,false);assert.equal(hidden.visible,false);
 restoreAnatomyVisibility(entries);
 assert.equal(shell.visible,true);assert.equal(hidden.visible,false);
});
