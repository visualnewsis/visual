const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
let now=100;const handlers={},ids=new Map(),keys=[],sounds=[];
function element(){return {textContent:'',href:'',style:{setProperty(){}},dataset:{},classList:{add(){},remove(){}},setAttribute(){},append(el){keys.push(el)},addEventListener(type,fn){this[type]=fn},getBoundingClientRect(){return {height:100,bottom:200}}};}
const get=id=>{if(!ids.has(id))ids.set(id,element());return ids.get(id)};
const param=()=>({value:0,cancelScheduledValues(){},setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
class AudioContext{constructor(){this.currentTime=1;this.state='running';this.destination={}}createGain(){return {gain:param(),connect(v){return v},disconnect(){}}}createDynamicsCompressor(){return {threshold:param(),connect(v){return v}}}createOscillator(){return {frequency:param(),connect(v){return v},start(){sounds.push(this)},stop(){},disconnect(){}}}}
const window={AudioContext,addEventListener(){}};
const document={getElementById:get,createElement:element,querySelectorAll:()=>[],querySelector:()=>null,addEventListener(t,fn){handlers[t]=fn}};
vm.runInNewContext(fs.readFileSync(__dirname+'/landing.js','utf8'),{window,document,performance:{now:()=>now},setTimeout});
const evt=code=>({code,target:{closest:()=>null},preventDefault(){}});
handlers.keydown(evt('KeyA'));
assert.match(get('sound-status').textContent,/직접 연주 중/,'already-running audio context must update the status');
now=200;get('landing-keys').setPointerCapture=()=>{};const c4=keys.find(k=>k.dataset.midi===60);c4.focus=()=>{};
get('landing-keys').pointerdown({target:{closest:()=>c4},button:0,pointerId:1,preventDefault(){}});
now=300;handlers.keyup(evt('KeyA'));
assert.match(get('piano-next').href,/duration=250/,'first input release must not finalize the shared note');
now=900;get('landing-keys').pointerup({pointerId:1});
assert.match(get('piano-next').href,/duration=800/,'duration must include the whole hold across input sources');
assert.equal(sounds.length,7,'overlapping same-note sources must not attack twice');
console.log('PASS landing overlapping input duration, single attack and running-audio status');
