// GPT-directed violin finish. Original geometry remains an interactive mesh.
const textures=new Map();
export function violinFinish(T,kind='spruce'){
 if(!textures.has(kind)){
  const n=256,data=new Uint8Array(n*n*4);let seed=731;
  const noise=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296-.5);
  for(let z=0;z<n;z++)for(let x=0;x<n;x++){
   const fine=Math.sin(z*2.8+Math.sin(x*.035)*.17)*4+noise()*2;
   const flame=kind==='maple'?Math.sin(x*.17+Math.sin(z*.04)*1.8)*10:0;
   const v=Math.max(0,Math.min(255,246+fine+flame)),i=(z*n+x)*4;
   data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;
  }
  const map=new T.DataTexture(data,n,n,T.RGBAFormat);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.generateMipmaps=true;map.minFilter=T.LinearMipmapLinearFilter;map.anisotropy=4;map.needsUpdate=true;textures.set(kind,map);
 }
 return new T.MeshPhysicalMaterial({color:kind==='spruce'?0xffffff:0x703315,map:textures.get(kind),bumpMap:textures.get(kind),bumpScale:.00035,roughness:kind==='spruce'?.32:.34,metalness:0,clearcoat:.65,clearcoatRoughness:.18,side:T.DoubleSide,vertexColors:kind==='spruce'});
}
export function finishViolinTop(T,geometry,contour,edgeDistance){
 const p=geometry.attributes.position,colors=[],edge=new T.Color('#713514'),middle=new T.Color('#A65320'),light=new T.Color('#C47738');
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),z=p.getZ(i),d=edgeDistance(x,z,contour),a=T.MathUtils.smoothstep(d,0,.09);
  const c=edge.clone().lerp(middle,a),center=Math.max(0,1-((x-.22)/1.1)**2-(z/.45)**2)*.38;
  c.lerp(light,center*a);colors.push(c.r,c.g,c.b);
 }
 geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));return geometry;
}
export function configureViolinPresentation(stage){
 const directional=stage.scene.children.filter(o=>o.isDirectionalLight),hemi=stage.scene.children.find(o=>o.isHemisphereLight);
 if(directional[0]){directional[0].position.set(4,6,5);directional[0].color.setHex(0xffe0b4);directional[0].intensity=2.25;}
 if(directional[1]){directional[1].position.set(-5,3,-3);directional[1].color.setHex(0xd2dce4);directional[1].intensity=1.35;}
 if(hemi)hemi.intensity=.85;stage.scene.environmentIntensity=.8;
}
