/* Shared pure rules for the page and the verification script. */
(function(root){
  'use strict';
  const belongs=(place,region)=>!region||place===region||place.startsWith(region+'/');
  const matches=(article,region)=>article.places.some(place=>belongs(place,region));
  const inBox=(center,b)=>center[0]>=b[0]&&center[0]<=b[2]&&center[1]>=b[1]&&center[1]<=b[3];
  function filter(articles,{region='',period='24',onlyNew=false,cutoff=0,now=Date.now(),category='',bounds=null,nodes={}}={}){
    const since=period==='all'?-Infinity:now-Number(period)*3600000;
    return articles.filter(a=>{
      const time=Date.parse(a.publishedAt);
      return Number.isFinite(time)&&time<=now&&time>=since&&matches(a,region)&&(!onlyNew||time>cutoff)&&(!category||a.category===category)&&(!bounds||a.places.some(p=>belongs(p,region)&&nodes[p]&&inBox(nodes[p].center,bounds)));
    }).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
  }
  function group(articles,nodes,zoom,region=''){
    const groups=new Map();
    const depth=zoom<8?1:zoom<11?2:zoom<13?3:99;
    for(const a of articles) for(const place of a.places){
      if(!belongs(place,region)||!nodes[place]) continue;
      const parts=place.split('/');
      const minDepth=region?region.split('/').length:1;
      const target=parts.slice(0,Math.min(parts.length,Math.max(depth,minDepth))).join('/');
      if(!nodes[target]) continue;
      if(!groups.has(target)) groups.set(target,{node:nodes[target],articles:[]});
      const g=groups.get(target);
      if(!g.articles.some(x=>x.id===a.id)) g.articles.push(a);
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
  const api={belongs,matches,filter,group,inBox,containsPoint,findRegion,requestPosition};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  else root.NewsmapRules=api;
})(typeof window!=='undefined'?window:globalThis);
