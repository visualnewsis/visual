/* Shared pure rules for the page and the verification script. */
(function(root){
  'use strict';
  const POLICY_VERSION='domestic-local-v2';
  function validSnapshot(next,{nodes={},previousTime=-Infinity,now=Date.now()}={}){
    if(!next||next.schemaVersion!==1||next.policyVersion!==POLICY_VERSION||next.mode!=='scheduled-snapshot'||next.retentionDays!==30||!Array.isArray(next.articles)||next.articles.length>10000)return false;
    const collected=Date.parse(next.collectedAt),excluded=next.excludedInternational;
    if(!Number.isFinite(collected)||collected<previousTime||collected>now+60000||!excluded||typeof excluded!=='object'||Array.isArray(excluded))return false;
    const idPattern=/^NISX\d+_\d+$/;
    if(!Object.entries(excluded).every(([id,date])=>idPattern.test(id)&&Number.isFinite(Date.parse(date))&&Date.parse(date)<=collected&&Date.parse(date)>=collected-30*86400000))return false;
    const seen=new Set(),known=places=>Array.isArray(places)&&new Set(places).size===places.length&&places.every(p=>typeof p==='string'&&Object.prototype.hasOwnProperty.call(nodes,p));
    return next.articles.every(a=>{
      if(!a||typeof a.id!=='string'||!idPattern.test(a.id)||seen.has(a.id)||Object.prototype.hasOwnProperty.call(excluded,a.id)||a.url!=='https://www.newsis.com/view/'+a.id)return false;
      seen.add(a.id);
      const published=Date.parse(a.publishedAt);
      return typeof a.title==='string'&&!!a.title.trim()&&Number.isFinite(published)&&published<=Math.min(now,collected)+60000&&published>=collected-30*86400000
        &&a.policyVersion===POLICY_VERSION&&a.domesticPolicy==='accepted'
        &&(a.sourceSection===undefined||typeof a.sourceSection==='string'&&a.sourceSection!=='국제')&&(a.sourceSection2===undefined||typeof a.sourceSection2==='string'&&!a.sourceSection2.startsWith('해외'))&&typeof a.newsCategory==='string'&&!!a.newsCategory&&a.newsCategory!=='국제'
        &&Array.isArray(a.feeds)&&a.feeds.every(f=>typeof f==='string'&&f!=='international')
        &&known(a.places)&&known(a.relatedPlaces)&&Array.isArray(a.localPlaces)&&a.localPlaces.length===a.places.length&&a.localPlaces.every((p,i)=>p===a.places[i])
        &&typeof a.localEligible==='boolean'&&a.localEligible===!!a.places.length&&a.places.every(p=>a.relatedPlaces.includes(p))
        &&Array.isArray(a.evidence)&&a.evidence.every(e=>typeof e==='string');
    });
  }
  // Unreviewed legacy snapshots fail closed, including on a failed refresh.
  function selectMode(articles,mode=''){
    return articles.filter(a=>a.policyVersion===POLICY_VERSION&&a.domesticPolicy==='accepted'&&a.newsCategory!=='국제'&&!(a.feeds||[]).includes('international')&&(mode==='all'||a.localEligible===true&&a.places.length>0))
      .map(a=>mode==='all'?{...a,places:a.relatedPlaces||a.places}:a);
  }
  const belongs=(place,region)=>!region||place===region||place.startsWith(region+'/');
  const matches=(article,region)=>article.places.some(place=>belongs(place,region));
  const inBox=(center,b)=>center[0]>=b[0]&&center[0]<=b[2]&&center[1]>=b[1]&&center[1]<=b[3];
  function filter(articles,{region='',period='24',onlyNew=false,cutoff=0,now=Date.now(),category='',bounds=null,nodes={},includeUnlocated=false}={}){
    const since=period==='all'?-Infinity:now-Number(period)*3600000;
    const seen=new Set();
    return articles.filter(a=>{
      if(seen.has(a.id))return false;
      const time=Date.parse(a.publishedAt);
      const keep=Number.isFinite(time)&&time<=now&&time>=since&&(matches(a,region)||(includeUnlocated&&!region&&!a.places.length))&&(!onlyNew||time>cutoff)&&(!category||a.newsCategory===category)&&(!bounds||a.places.some(p=>belongs(p,region)&&nodes[p]&&inBox(nodes[p].center,bounds)));
      if(keep)seen.add(a.id);return keep;
    }).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
  }
  function group(articles,nodes,zoom,region=''){
    const groups=new Map(),seen=new Map();
    const depth=zoom<8?1:zoom<11?2:zoom<13?3:99;
    for(const a of articles) for(const place of a.places){
      if(!belongs(place,region)||!nodes[place]) continue;
      const parts=place.split('/');
      const minDepth=region?region.split('/').length:1;
      const target=parts.slice(0,Math.min(parts.length,Math.max(depth,minDepth))).join('/');
      if(!nodes[target]) continue;
      if(!groups.has(target)){groups.set(target,{node:nodes[target],articles:[]});seen.set(target,new Set());}
      const g=groups.get(target);
      if(!seen.get(target).has(a.id)){seen.get(target).add(a.id);g.articles.push(a);}
    }
    return [...groups.values()];
  }
  function inRing(point,ring){
    const [lat,lon]=point;let inside=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const [xi,yi]=ring[i],[xj,yj]=ring[j];
      if((yi>lat)!==(yj>lat)&&lon<(xj-xi)*(lat-yi)/(yj-yi)+xi)inside=!inside;
    }
    return inside;
  }
  function containsPoint(geometry,point){
    const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;
    return polygons.some(rings=>inRing(point,rings[0])&&!rings.slice(1).some(hole=>inRing(point,hole)));
  }
  function findRegion(regions,point){
    if(!point.every(Number.isFinite))return null;
    return regions.find(n=>n.level==='dong'&&n.kind!=='locality'&&n.geometry&&inBox(point,n.bbox)&&containsPoint(n.geometry,point))||null;
  }
  function requestPosition(geolocation){
    return new Promise((resolve,reject)=>{
      if(!geolocation?.getCurrentPosition){reject({code:0});return;}
      geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
    });
  }
  function cameraContext(regions,point,zoom){
    if(zoom<8)return {national:true,node:null};
    const local=findRegion(regions,point);
    const id=local&&(zoom<11?local.path[0]:zoom<13?local.parent:local.id);
    return {national:false,node:regions.find(n=>n.id===id)||null};
  }
  const api={POLICY_VERSION,validSnapshot,selectMode,belongs,matches,filter,group,inBox,containsPoint,findRegion,requestPosition,cameraContext};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  else root.NewsmapRules=api;
})(typeof window!=='undefined'?window:globalThis);
