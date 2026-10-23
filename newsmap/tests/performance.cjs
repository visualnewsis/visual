const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const R=require('../core.js');
const geo={window:{}};
vm.runInNewContext(fs.readFileSync(require.resolve('../data/geography.js'),'utf8'),geo);
const geography=geo.window.NEWSMAP_GEOGRAPHY;
const nodes=Object.fromEntries(geography.nodes.map(n=>[n.id,n]));
const sample=Array.from({length:10000},(_,i)=>({id:String(i),places:['서울특별시/서초구','서울특별시/영등포구']}));
const start=performance.now();
const grouped=R.group(sample,nodes,6);
const elapsed=performance.now()-start;
assert.equal(grouped.length,1);assert.equal(grouped[0].articles.length,10000);
let built=0,labels=0,redraw;
const layer=()=>({addTo(){return this;},removeLayer(){},setStyle(){}});
const map={createPane(){},getPane:()=>({style:{}}),getZoom:()=>12,
  getBounds:()=>({getNorth:()=>37.6,getSouth:()=>37.45,getWest:()=>126.9,getEast:()=>127.1,contains:()=>true}),
  getContainer:()=>({classList:{add(){},remove(){}}}),attributionControl:{addAttribution(){},removeAttribution(){}},
  on:(_,fn)=>redraw=fn,off(){},removeLayer(){}};
const ctx={window:{},document:{createElement:()=>({})},L:{layerGroup:layer,geoJSON:()=>{built++;return layer();},marker:()=>{labels++;return layer();},divIcon:x=>x}};
vm.runInNewContext(fs.readFileSync(require.resolve('../basemap.js'),'utf8'),ctx);
const base=ctx.window.NewsmapBasemap(map,geography);
assert.equal(built,0,'External-tile mode must not construct native polygon layers eagerly.');
base.enable();assert(built>16);const first=built,firstLabels=labels;
redraw();redraw();
assert.equal(built,first,'Overlapping view must reuse every existing polygon.');
assert.equal(labels,firstLabels,'Overlapping view must reuse every existing label.');
console.log(`PASS: 10,000 multi-place articles grouped once each (${elapsed.toFixed(1)}ms); native map lazy-load and repeated-view geometry/label reuse (${first} polygons, ${firstLabels} labels).`);
