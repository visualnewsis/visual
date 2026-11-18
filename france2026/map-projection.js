'use strict';
// One Web Mercator coordinate system for source geometry and city pins.
// Keep the story's established unit size; do not stretch longitude/latitude.
const mapProjection=(()=>{
 const units=58,world=360*units,merc=lat=>Math.asinh(Math.tan(lat*Math.PI/180))*180/Math.PI;
 const top=merc(52)*units-180*units,left=-174*units;
 const project=(lon,lat)=>[(lon+6)*units,(merc(52)-merc(lat))*units];
 const unproject=(x,y)=>[x/units-6,Math.atan(Math.sinh((merc(52)-y/units)*Math.PI/180))*180/Math.PI];
 const metersPerUnit=lat=>111319.49079327358*Math.cos(lat*Math.PI/180)/units;
 return{project,unproject,metersPerUnit,world};
})();
if(typeof module!=='undefined')module.exports=mapProjection;
