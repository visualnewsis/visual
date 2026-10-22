/* Same-origin map for hosts that cannot load external map tiles. */
window.NewsmapBasemap=(map,geography)=>{
  'use strict';
  map.createPane('newsmapBase');
  map.getPane('newsmapBase').style.zIndex='180';
  map.getPane('newsmapBase').style.pointerEvents='none';
  map.createPane('newsmapLabels');
  map.getPane('newsmapLabels').style.zIndex='350';
  map.getPane('newsmapLabels').style.pointerEvents='none';
  const nodes=geography.nodes;
  const leaves=nodes.filter(n=>n.geometry&&n.kind!=='locality');
  const land=L.layerGroup(),detail=L.layerGroup(),labels=L.layerGroup();
  const colours=['#f0eee0','#e9ecdf','#ede9dc','#e6ebde'];
  const credit='행정구역 지도 · 통계청 SGIS / <a href="https://github.com/vuski/admdongkor">vuski</a>';
  nodes.filter(n=>n.level==='province').forEach((province,i)=>{
    const coordinates=leaves.filter(n=>n.path[0]===province.id).flatMap(n=>n.geometry.coordinates);
    L.geoJSON({type:'MultiPolygon',coordinates},{pane:'newsmapBase',interactive:false,style:{stroke:false,fillColor:colours[i%colours.length],fillOpacity:1}}).addTo(land);
  });
  let active=false;
  function redraw(){
    if(!active)return;
    detail.clearLayers();labels.clearLayers();
    const z=map.getZoom(),b=map.getBounds();
    const intersects=n=>n.bbox[0]<=b.getNorth()&&n.bbox[2]>=b.getSouth()&&n.bbox[1]<=b.getEast()&&n.bbox[3]>=b.getWest();
    if(z>=8)leaves.filter(intersects).forEach(n=>L.geoJSON(n.geometry,{pane:'newsmapBase',interactive:false,style:{color:'#889582',weight:z>=12?.8:.4,opacity:z>=12?.6:.3,fill:false}}).addTo(detail));
    if(z<8)return;
    const level=z<12?'district':'dong';
    nodes.filter(n=>n.level===level&&n.kind!=='locality'&&intersects(n)&&b.contains(n.center)).slice(0,160).forEach(n=>{
      const label=document.createElement('span');label.textContent=n.name;
      L.marker(n.center,{pane:'newsmapLabels',interactive:false,keyboard:false,icon:L.divIcon({className:'native-map-label',html:label,iconSize:[130,20],iconAnchor:[65,10]})}).addTo(labels);
    });
  }
  return {
    enable(){if(active)return;active=true;land.addTo(map);detail.addTo(map);labels.addTo(map);map.getContainer().classList.add('native-basemap');map.attributionControl.addAttribution(credit);map.on('moveend',redraw);redraw();},
    disable(){if(!active)return;active=false;map.off('moveend',redraw);map.removeLayer(land);map.removeLayer(detail);map.removeLayer(labels);map.getContainer().classList.remove('native-basemap');map.attributionControl.removeAttribution(credit);}
  };
};
