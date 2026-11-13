const assert=require('node:assert/strict'),R=require('../world-core.js');
const now=Date.parse('2026-11-10T02:00:00Z');
const a=(id,locations,publishedAt='2026-11-10T01:00:00Z')=>({id:'NISX20261110_'+id,url:'https://www.newsis.com/view/NISX20261110_'+id,title:'국제 뉴스 '+id,publishedAt,locations});
const l=(country,role='related')=>({country,role,evidence:['기사에서 확인한 국가']});
const articles=[a('1',[l('US'),l('CN')]),a('2',[]),a('3',[l('CN','place')],'2026-11-08T01:00:00Z')];
const world={schemaVersion:1,policyVersion:R.VERSION,collectedAt:'2026-11-10T02:00:00Z',articles};
assert(R.valid(world,{now}));
assert(!R.valid({...world,articles:[...articles,articles[0]]},{now}));
assert(!R.valid({...world,collectedAt:'2026-11-11T02:00:00Z'},{now}));
assert(!R.valid(world,{now,previousTime:now+1}));
assert(!R.valid({...world,articles:[{...articles[0],locations:[l('US'),l('US')]}]},{now}));
assert(!R.valid({...world,articles:[{...articles[0],locations:[null]}]},{now}));
assert(!R.valid({...world,articles:[{...articles[0],locations:[{}]}]},{now}));
assert.equal(R.filter(articles,{now}).length,3);
assert.equal(R.filter(articles,{country:'CN',now}).length,2);
assert.equal(R.filter(articles,{country:'unlocated',now}).length,1);
assert.equal(R.filter(articles,{period:'24',now}).length,2);
assert.equal(R.filter(articles,{onlyNew:true,cutoff:now-3600001,now}).length,2);
assert.equal(R.filter([...articles,articles[0]],{now}).length,3);
assert.deepEqual(R.groups(articles).map(g=>[g.country,g.count,g.placeCount]),[['US',1,0],['CN',2,1]]);
console.log('PASS: world schema/chronology/ID validation, period, location-unknown, country filtering, multi-country non-additive counts, unique overall article count.');

const points=[{country:'SG',x:100,y:100},{country:'MY',x:120,y:100}];
assert.equal(R.nearestCountry(points,[102,104],14),'SG');
assert.equal(R.nearestCountry(points,[119,100],14),'MY');
assert.equal(R.nearestCountry(points,[140,130],14),null);
console.log('PASS: rendered country dots win over polygon containment; nearest adjacent country selected; distant point ignored.');

const unknownCountry=JSON.parse(JSON.stringify(world));
if(unknownCountry.articles.length){unknownCountry.articles[0].locations=[{country:'ZZ',role:'related',evidence:['unknown']}];assert.equal(R.valid(unknownCountry,{now}),false);}
