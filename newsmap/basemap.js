/* Same-origin map for hosts that cannot load external map tiles. */
window.NewsmapBasemap=(map,geography)=>{
  'use strict';
  map.createPane('newsmapBase');
  map.getPane('newsmapBase').style.zIndex='180';
  map.getPane('newsmapBase').style.pointerEvents='none';
  map.createPane('newsmapDetail');
  map.getPane('newsmapDetail').style.zIndex='190';
  map.getPane('newsmapDetail').style.pointerEvents='none';
  map.createPane('newsmapLabels');
  map.getPane('newsmapLabels').style.zIndex='350';
  map.getPane('newsmapLabels').style.pointerEvents='none';
  const nodes=geography.nodes;
  const leaves=nodes.filter(n=>n.geometry&&n.kind!=='locality');
  const land=L.layerGroup(),detail=L.layerGroup(),labels=L.layerGroup();
  const colours=['#f0eee0','#e9ecdf','#ede9dc','#e6ebde'];
  const credit='행정구역 지도 · 통계청 SGIS / <a href="https://github.com/vuski/admdongkor">vuski</a>';
  function prepareLand(){nodes.filter(n=>n.level==='province').forEach((province,i)=>{
    const coordinates=leaves.filter(n=>n.path[0]===province.id).flatMap(n=>n.geometry.coordinates);
    L.geoJSON({type:'MultiPolygon',coordinates},{pane:'newsmapBase',interactive:false,style:{stroke:false,fillColor:colours[i%colours.length],fillOpacity:1}}).addTo(land);
  });}
  let active=false,prepared=false,detailStyle='';
  const detailLayers=new Map(),labelLayers=new Map();
  function redraw(){
    if(!active)return;
    const z=map.getZoom(),b=map.getBounds();
    const intersects=n=>n.bbox[0]<=b.getNorth()&&n.bbox[2]>=b.getSouth()&&n.bbox[1]<=b.getEast()&&n.bbox[3]>=b.getWest();
    const visible=z>=8?leaves.filter(intersects):[];
    const wanted=new Set(visible.map(n=>n.id));
    for(const [id,layer] of detailLayers)if(!wanted.has(id)){detail.removeLayer(layer);detailLayers.delete(id);}
    const style={color:'#889582',weight:z>=12?.8:.4,opacity:z>=12?.6:.3,fill:false};
    const styleKey=z>=12?'near':'far';
    for(const n of visible){
      const existing=detailLayers.get(n.id);
      if(existing){if(styleKey!==detailStyle)existing.setStyle(style);}
      else detailLayers.set(n.id,L.geoJSON(n.geometry,{pane:'newsmapDetail',interactive:false,style}).addTo(detail));
    }
    detailStyle=styleKey;
    const level=z<12?'district':'dong';
    const visibleLabels=z<8?[]:nodes.filter(n=>n.level===level&&n.kind!=='locality'&&intersects(n)&&b.contains(n.center)).slice(0,160);
    const wantedLabels=new Set(visibleLabels.map(n=>n.id));
    for(const [id,layer] of labelLayers)if(!wantedLabels.has(id)){labels.removeLayer(layer);labelLayers.delete(id);}
    visibleLabels.forEach(n=>{
      if(labelLayers.has(n.id))return;
      const label=document.createElement('span');label.textContent=n.name;
      labelLayers.set(n.id,L.marker(n.center,{pane:'newsmapLabels',interactive:false,keyboard:false,icon:L.divIcon({className:'native-map-label',html:label,iconSize:[130,20],iconAnchor:[65,10]})}).addTo(labels));
    });
  }
  return {
    enable(){if(active)return;if(!prepared){prepareLand();prepared=true;}active=true;land.addTo(map);detail.addTo(map);labels.addTo(map);map.getContainer().classList.add('native-basemap');map.attributionControl.addAttribution(credit);map.on('moveend',redraw);redraw();},
    disable(){if(!active)return;active=false;map.off('moveend',redraw);map.removeLayer(land);map.removeLayer(detail);map.removeLayer(labels);map.getContainer().classList.remove('native-basemap');map.attributionControl.removeAttribution(credit);}
  };
};
