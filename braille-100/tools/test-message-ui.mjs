import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Exercise the real event handlers with image encoding and clipboard failures.
const ids = ['message-form','message-input','message-status','message-result','message-submit','message-original','message-braille','message-card','message-card-preview','message-share','message-save','message-share-status','message-copy-braille','message-image-toggle','message-image-label','message-copy-link','message-nojs'];
const nodes = Object.fromEntries(ids.map(id => [id, {hidden:true,disabled:true,textContent:'',value:'',attrs:{},listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},focus(){}}]));
let copied;
let denyClipboard = false;
const context = vm.createContext({
  document:{getElementById:id=>nodes[id]||null,fonts:{ready:Promise.resolve()},createElement:tag=>{assert.equal(tag,'canvas');return {getContext:()=>null};}},
  navigator:{clipboard:{writeText:async text=>{if(denyClipboard)throw Error('denied');copied=text;}}},
  URL:{revokeObjectURL(){}},
});
const expected='⠣⠒⠉⠻⠚⠠⠝⠬';
const engine = new vm.SyntheticModule(['loadBrailleEngine'],function(){this.setExport('loadBrailleEngine',async()=>()=>expected);},{context});
await engine.link(()=>{});
await engine.evaluate();
const source=fs.readFileSync(new URL('../braille-experience.js',import.meta.url),'utf8');
new vm.Script(source,{importModuleDynamically:async()=>engine}).runInContext(context);
nodes['message-input'].value='안녕하세요';
await nodes['message-form'].listeners.submit({preventDefault(){}});
assert.equal(nodes['message-result'].hidden,false,'Image failure must keep the text result');
assert.equal(nodes['message-braille'].textContent,expected);
assert.equal(nodes['message-copy-braille'].disabled,false);
assert.equal(nodes['message-image-toggle'].disabled,true);
await nodes['message-copy-braille'].listeners.click();
assert.equal(copied,expected,'Text copy must work even when image generation fails');
denyClipboard=true;
await nodes['message-copy-braille'].listeners.click();
assert.match(nodes['message-share-status'].textContent,/선택해 복사/);
assert.equal(nodes['message-result'].hidden,false);
nodes['message-input'].listeners.input();
assert.equal(nodes['message-result'].hidden,true,'Editing invalidates the previous result');
assert.equal(nodes['message-copy-braille'].disabled,true);
assert.equal(nodes['message-image-toggle'].attrs['aria-expanded'],'false');
console.log('PASS: image failure preserves selectable text and copy; clipboard rejection offers direct selection; editing clears stale controls.');
