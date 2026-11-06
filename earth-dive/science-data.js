/* Source-checked editorial data, 2026-11-02. No maximum records treated as typical depth. */
(() => {
  'use strict';
  const species = [
    {id:'silky',name:'실키 해파리',english:'Silky jelly',scientific:'Colobonema sericeum',taxon:'자포동물 · 해파리',depth:[200,700],at:300,size:'우산 지름 최대 4.5 cm',range:'태평양·대서양·인도양',habitat:'중층 수중',fact:'위협을 받으면 빠르게 헤엄치며 촉수를 떨어뜨리기도 합니다. 촉수의 푸른색과 우산의 생물발광은 구분해야 합니다.',source:'https://www.mbari.org/animal/silky-jelly/',shape:'jelly'},
    {id:'bloody',name:'블러디벨리 빗해파리',english:'Bloody-belly comb jelly',scientific:'Lampocteis cruentiventer',taxon:'유즐동물 · 빗해파리',depth:[250,1500],at:500,size:'최대 16 cm',range:'북태평양 · 캐나다~바하칼리포르니아·일본',habitat:'중층 수중',fact:'붉은 위가 먹이에서 나오는 빛을 가려 줍니다. 진짜 해파리류와는 다른 유즐동물입니다. 먹이의 상세 구성은 아직 알려지지 않았습니다.',source:'https://www.mbari.org/animal/bloody-belly-comb-jelly/',shape:'comb'},
    {id:'barreleye',name:'배럴아이',english:'Barreleye fish',scientific:'Macropinna microstoma',taxon:'어류',depth:[460,800],at:650,size:'최대 15 cm',range:'북태평양 · 베링해~일본·바하칼리포르니아',habitat:'중층 수중',fact:'투명한 머리 안에 관 모양의 눈이 있습니다. 눈을 위로 향해 먹이를 살피다가 앞으로 돌릴 수 있습니다.',source:'https://www.mbari.org/animal/barreleye-fish/',shape:'barreleye'},
    {id:'vampire',name:'흡혈오징어',english:'Vampire squid',scientific:'Vampyroteuthis infernalis',taxon:'두족류 · 흡혈오징어류',depth:[600,900],at:800,size:'전체 길이 최대 30 cm',range:'전 세계 열대·온대 수역',habitat:'중층 수중 · 산소 최소층',fact:'이름과 달리 피를 먹지 않습니다. 가느다란 필라멘트로 가라앉는 유기물 입자, 마린 스노를 모아 먹습니다.',source:'https://www.mbari.org/animal/vampire-squid/',shape:'vampire'},
    {id:'fangtooth',name:'팽투스',english:'Fangtooth',scientific:'Anoplogaster cornuta',taxon:'어류',depth:[500,2100],at:1400,size:'최대 18 cm',range:'전 세계 열대·온대 수역',habitat:'중층 수중',fact:'큰 이빨과 벌어지는 입을 가진 작은 포식성 어류입니다. 물고기와 갑각류를 먹습니다. 이 배치는 흔히 목격된다는 의미가 아닙니다.',source:'https://www.mbari.org/animal/fangtooth/',shape:'fangtooth'},
    {id:'beroe',name:'베로에 아비시콜라',english:'Abyssal comb jelly',scientific:'Beroe abyssicola',taxon:'유즐동물 · 빗해파리',depth:[0,2800],at:2500,size:'최대 7 cm',range:'북극해·북태평양 북부',habitat:'표층~깊은 중층 수중',fact:'다른 빗해파리를 먹는 포식자입니다. 자료의 수심 범위가 넓다고 모든 깊이에 고르게 산다는 뜻은 아닙니다.',source:'https://www.mbari.org/animal/abyssal-comb-jelly/',shape:'beroe'},
    {id:'sea-pig',name:'바다돼지류',english:'Sea pig',scientific:'Scotoplanes spp.',taxon:'극피동물 · 해삼류 (속 수준)',depth:[1000,6000],at:4000,size:'최대 17 cm',range:'전 세계',habitat:'해저 · 심해 평원',fact:'긴 관족으로 부드러운 해저 퇴적물 위를 걷고, 가라앉은 유기물을 먹습니다. 수중을 떠다니는 생물로 배치하지 않았습니다.',source:'https://www.mbari.org/animal/sea-pig/',shape:'sea-pig'}
  ];
  const model = {radiusKm:6371,diameterKm:12742,seafloorKm:4,crustKm:5,coreDepthKm:2890,innerDepthKm:5150};
  function position(distance) {
    const d=Math.max(0,Math.min(model.diameterKm,distance));
    const surfaceDepth=Math.min(d,model.diameterKm-d);
    const returning=d>model.radiusKm;
    let layer,material;
    if(surfaceDepth<model.seafloorKm){layer='바다';material='해수 · 액체'}
    else if(surfaceDepth<model.seafloorKm+model.crustKm){layer='해양 지각';material='암석 · 고체'}
    else if(surfaceDepth<model.coreDepthKm){layer='맨틀';material='대부분 고체인 암석 · 긴 시간에 걸쳐 변형'}
    else if(surfaceDepth<model.innerDepthKm){layer='외핵';material='주로 철을 포함한 금속 · 액체'}
    else {layer='내핵';material='주로 철을 포함한 금속 · 고체'}
    return {distanceKm:d,surfaceDepthKm:surfaceDepth,returning,layer,material,waterDepthM:layer==='바다'?surfaceDepth*1000:null};
  }
  const sources = {
    light:'https://oceanservice.noaa.gov/facts/light_travel.html',
    states:'https://www.nps.gov/subjects/geology/plate-tectonics-inner-earth-model.htm',
    radius:'https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html',
    core:'https://www.hko.gov.hk/en/education/earth-science/general/00342-how-deep-is-the-earth-and-what-is-at-its-centre.html',
    inner:'https://science.nasa.gov/earth/facts/',
    seismic:'https://pubs.usgs.gov/gip/dynamic/inside.html'
  };
  const data={species,model,position,sources,checked:'2026-11-02'};
  if(typeof module!=='undefined'&&module.exports)module.exports=data;
  else globalThis.EarthDiveScience=data;
})();
