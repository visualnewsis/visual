/* Pure world snapshot and filtering rules; no domestic policy changes. */
(function(root){
  'use strict';
  const VERSION='world-country-v2';
  function valid(data,{now=Date.now(),previousTime=-Infinity}={}){
    if(!data||data.schemaVersion!==1||data.policyVersion!==VERSION||!Array.isArray(data.articles)||data.articles.length>3000)return false;
    const collected=Date.parse(data.collectedAt);
    if(!Number.isFinite(collected)||collected>now+60000||collected<previousTime)return false;
    const ids=new Set();
    return data.articles.every(a=>{
      if(!a||!/^NISX\d+_\d+$/.test(a.id)||ids.has(a.id)||a.url!=='https://www.newsis.com/view/'+a.id||typeof a.title!=='string'||!a.title.trim()||a.title.length>500)return false;
      ids.add(a.id);const published=Date.parse(a.publishedAt);
      return Number.isFinite(published)&&published<=collected&&published>=collected-30*86400000&&Array.isArray(a.locations)&&a.locations.length<=200&&a.locations.every(l=>l&&typeof l==='object'&&typeof l.country==='string'&&/^[A-Z]{2,3}$/.test(l.country)&&['place','related'].includes(l.role)&&Array.isArray(l.evidence)&&l.evidence.every(e=>typeof e==='string'))&&new Set(a.locations.map(l=>l.country)).size===a.locations.length;
    });
  }
  function filter(articles,{country='',period='all',q='',onlyNew=false,cutoff=0,now=Date.now()}={}){
    const seen=new Set(),since=period==='all'?-Infinity:now-Number(period)*3600000;
    return articles.filter(a=>{
      if(seen.has(a.id))return false;
      const published=Date.parse(a.publishedAt);
      if(!Number.isFinite(published)||published>now||published<since||(onlyNew&&published<=cutoff)||q&&!a.title.toLocaleLowerCase().includes(q.toLocaleLowerCase())||country&&(country==='unlocated'?a.locations.length:a.locations.every(l=>l.country!==country)))return false;
      seen.add(a.id);return true;
    }).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
  }
  function groups(articles){
    const groups=new Map();
    for(const a of articles)for(const l of a.locations){if(!groups.has(l.country))groups.set(l.country,{country:l.country,ids:new Set(),placeIds:new Set()});const g=groups.get(l.country);g.ids.add(a.id);if(l.role==='place')g.placeIds.add(a.id);}
    return [...groups.values()].map(g=>({country:g.country,count:g.ids.size,placeCount:g.placeIds.size}));
  }
  const api={VERSION,valid,filter,groups};root.NewsmapWorldRules=api;
  if(typeof module==='object')module.exports=api;
})(typeof window==='object'?window:globalThis);
