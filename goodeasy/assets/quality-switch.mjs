import {T,materials as M,box,cyl,rod,tube,part,tag} from './quality-kit.mjs?v=20261024-r7';
export function buildSwitch(){const group=new T.Group(),base=part(group,'body');box(base,2.5,.22,2.5,M.black,0,.12,0,.12);box(base,2.1,.09,2.1,new T.MeshStandardMaterial({color:0x254b3e}),0,.27,0,.04);
 const housing=part(group,'housing');for(const x of [-1,1])box(housing,.13,1.25,1.9,M.glass.clone(),x,.9,0,.03);box(housing,2.1,1.25,.12,M.glass.clone(),0,.9,-.95,.03);
 const cap=part(group,'cap');box(cap,2.5,.47,2.3,M.ivory,0,2.55,0,.15);box(cap,.52,1.35,.52,M.red,0,1.68,0,.04);box(cap,.95,.15,.25,M.red,0,1.18,0,.025);
 const spring=part(group,'spring');const coil=tube(spring,Array.from({length:241},(_,i)=>{const a=i/240*Math.PI*16;return [Math.cos(a)*.38,.38+i/240*1.15,Math.sin(a)*.38];}),.038,M.steel);
 const contact=part(group,'contact');rod(contact,[.65,.3,-.4],[.65,1.3,-.4],.03,M.brass);const leaf=rod(contact,[.9,.3,-.4],[.78,1.3,-.4],.025,M.brass);cyl(contact,.1,.05,M.brass,.7,.31,-.4);
 const signal=part(group,'signal');const led=cyl(signal,.09,.04,M.red,-.75,.34,.65);tag(cap,'cap');tag(spring,'spring');tag(contact,'contact');
 return {group,eye:[4,4,7],parts:{body:base,cap,spring,contact,signal},update(s){const travel=Math.min(4,s.travel||0);cap.position.y=-travel*.16;coil.scale.y=1-travel*.09;leaf.rotation.z=travel>=2?.12:0;led.material=travel>=2?M.brass:M.red;}};
}
