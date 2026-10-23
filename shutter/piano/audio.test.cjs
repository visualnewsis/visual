const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const nodes=[],listeners={};
function element(){return {value:'65',textContent:'',classList:{add(){},remove(){},toggle(){}},style:{setProperty(){}},dataset:{},setAttribute(){},append(){},addEventListener(){}};}
const ids=new Map();const get=id=>{if(!ids.has(id))ids.set(id,element());return ids.get(id);};
const gain=()=>({value:0,cancelScheduledValues(){},setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
class AudioContext{constructor(){this.currentTime=10;this.state='running';this.destination={};}createGain(){return {gain:gain(),connect(v){return v},disconnect(){}};}createDynamicsCompressor(){return {threshold:gain(),knee:gain(),ratio:gain(),connect(v){return v}};}createOscillator(){const o={frequency:gain(),connect(v){return v},start(t){this.started=t},stop(t){this.stopped=t},disconnect(){}};nodes.push(o);return o;}}
const window={AudioContext,addEventListener(){},dispatchEvent(){}};
const document={hidden:false,getElementById:get,createElement:element,addEventListener(type,fn){listeners[type]=fn;}};
vm.runInNewContext(fs.readFileSync(__dirname+'/piano.js','utf8'),{window,document,matchMedia:()=>({matches:false,addEventListener(){}}),performance:{now:()=>100},Event:class{},setTimeout});
const engine=window.PianoExperience;
listeners.keydown({code:'KeyA',target:{closest:()=>null},preventDefault(){}});
const live=nodes.slice();assert.equal(live.length,7);
engine.strikeObservation(69);const observation=nodes.slice(7);assert.equal(observation.length,7);assert.equal(observation[0].started,10);assert(Math.abs(observation[0].frequency.value-440)<1);
engine.stopObservation();assert(observation.every(n=>n.stopped<10.03));assert(live.every(n=>n.stopped>18));
engine.strikeObservation(72);const next=nodes.slice(14);assert.equal(next.length,7);engine.releaseObservation();assert(next.every(n=>Math.abs(n.stopped-10.22)<.001));
engine.strikeObservation(999);assert.equal(nodes.length,21);
console.log('PASS observation attack timing, note pitch, stop/release and isolation from live keyboard voices');
