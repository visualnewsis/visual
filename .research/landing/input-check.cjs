const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const listeners={},events={},nodes=[],ids=new Map();let time=100;
function el(){const attrs={},classes=new Set();return {attrs,children:[],events:{},textContent:'',dataset:{},style:{setProperty(){}},classList:{add(x){classes.add(x)},remove(x){classes.delete(x)},contains(x){return classes.has(x)}},setAttribute(k,v){attrs[k]=v},append(x){this.children.push(x)},addEventListener(k,f){this.events[k]=f},getBoundingClientRect(){return {height:120,bottom:600}},closest(){return null},setPointerCapture(){},focus(){},contains(x){return this.children.includes(x)}};}
const get=id=>{if(!ids.has(id))ids.set(id,el());return ids.get(id)},gain=()=>({value:0,cancelScheduledValues(){},setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
class AudioContext{constructor(){this.currentTime=1;this.state='running';this.destination={}}createGain(){return{gain:gain(),connect(n){return n},disconnect(){}}}createDynamicsCompressor(){return{threshold:gain(),connect(n){return n}}}createOscillator(){const n={frequency:gain(),connect(x){return x},start(t){this.startTime=t},stop(t){this.stopTime=t},disconnect(){}};nodes.push(n);return n}}
const document={getElementById:get,createElement:el,addEventListener(t,f){listeners[t]=f},querySelector(){return null},elementFromPoint(){return null}};
vm.runInNewContext(fs.readFileSync(process.argv[2],'utf8'),{document,window:{AudioContext,addEventListener(t,f){events[t]=f}},performance:{now:()=>time},setTimeout});
const keys=get('landing-keys').children;assert.equal(keys.length,17);assert.equal(keys.filter(k=>k.className.endsWith('white')).length,10);assert.equal(nodes.length,0,'no autoplay');
const event=code=>({code,target:{closest(){return null}},preventDefault(){}});
listeners.keydown(event('KeyA'));assert.equal(nodes.length,7);assert.equal(get('landing-note').textContent,'C4');
listeners.keydown(event('KeyS'));assert.equal(nodes.length,14,'two notes held');time=450;listeners.keyup(event('KeyA'));assert(nodes.slice(0,7).every(n=>n.stopTime===1.2));assert(nodes.slice(7).every(n=>n.stopTime>5),'other note still held');
events.blur();assert(nodes.every(n=>n.stopTime===1.2),'blur releases every voice');assert(keys.every(k=>k.attrs['aria-pressed']==='false'));
assert(get('piano-next').href.includes('landing-note=62'));assert(get('piano-next').href.includes('duration=350'));
console.log('PASS landing: exact 17-note inputs, 10 white keys, no autoplay, polyphony, independent release, blur cleanup, pitch/duration handoff.');
