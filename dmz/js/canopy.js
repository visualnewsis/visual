// 원경의 한 잎 묶음 대신 여러 나무의 수관·내부 음영을 담은 군집.
// 지형과 같은 분포/제외 구역을 쓰며, 개별 나무를 볼 거리에서는 점진적으로 사라진다.
import * as THREE from './three.js?v=20261001-12';
import { W, forestMask, rng } from './terrain.js?v=20261027-world2';

export function createCanopy(terrain, { low, canopyImage, cutPlanes }) {
  if (!canopyImage) return null;
  const random=rng(270105),items=[],target=low?2200:3200;
  const normal=new THREE.Vector3(),sun=new THREE.Vector3(-150,260,360).normalize();
  for(let tries=0;items.length<target&&tries<target*30;tries++){
    const x=W.xMin+6+random()*(W.xMax-W.xMin-12),z=W.zMin+6+random()*(W.zMax-W.zMin-12);
    const mask=forestMask(x,z);
    if(mask<.28||random()>mask*.8)continue;
    const size=(10.5+random()*6.5)*(.65+.35*mask),y=terrain.heightAt(x,z);
    const nx=terrain.heightAt(x-3,z)-terrain.heightAt(x+3,z),nz=terrain.heightAt(x,z-3)-terrain.heightAt(x,z+3);
    normal.set(nx,6,nz).normalize();
    const hillshade=.70+.46*Math.max(0,normal.dot(sun));
    items.push({x,z,y,size,cell:Math.floor(random()*4),tint:(.88+random()*.11)*hillshade});
  }
  const geometry=new THREE.PlaneGeometry(1,1);
  const atlas=new Float32Array(items.length*2),tints=new Float32Array(items.length);
  const object=new THREE.Object3D();
  const map=new THREE.Texture(canopyImage);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=2;map.needsUpdate=true;
  const material=new THREE.MeshBasicMaterial({map,color:'#f4f4e8',alphaTest:.33,side:THREE.DoubleSide,depthWrite:true,transparent:false,toneMapped:false,clippingPlanes:cutPlanes,clipIntersection:true});
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 canopyCell; attribute float canopyTint; varying float crownFade; varying float crownTint;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvMapUv = vMapUv * .5 + canopyCell;')
      .replace('#include <project_vertex>', [
        'vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(0.,0.,0.,1.);',
        'float width = length(instanceMatrix[0].xyz);',
        'mvPosition.xy += position.xy * width;',
        'crownFade = smoothstep(38.,110.,length(mvPosition.xyz));',
        'crownTint = canopyTint;',
        'gl_Position = projectionMatrix * mvPosition;'
      ].join('\n'));
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float crownFade; varying float crownTint;')
      .replace('#include <alphatest_fragment>','diffuseColor.a *= crownFade;\n#include <alphatest_fragment>\ndiffuseColor.rgb *= crownTint;');
  };
  material.customProgramCacheKey=()=> 'dmz-canopy-clusters-v2';
  const mesh=new THREE.InstancedMesh(geometry,material,items.length);
  for(let i=0;i<items.length;i++){
    const t=items[i];object.position.set(t.x,t.y+t.size*.28,t.z);object.scale.setScalar(t.size);object.updateMatrix();mesh.setMatrixAt(i,object.matrix);
    atlas[i*2]=(t.cell%2)*.5;atlas[i*2+1]=Math.floor(t.cell/2)*.5;tints[i]=t.tint;
  }
  geometry.setAttribute('canopyCell',new THREE.InstancedBufferAttribute(atlas,2));
  geometry.setAttribute('canopyTint',new THREE.InstancedBufferAttribute(tints,1));
  mesh.frustumCulled=false;
  // 숲 군집의 부드러운 접지 음영. 각 꼭짓점을 지표에 붙여 경사면도 뜨지 않는다.
  const shadowP=[],shadowUV=[],shadowI=[];
  for(const t of items){
    const base=shadowP.length/3,cx=t.x+t.size*.12,cz=t.z-t.size*.24;
    for(let v=0;v<3;v++)for(let u=0;u<3;u++){
      const x=cx+(u-1)*t.size*.48,z=cz+(v-1)*t.size*.46;
      shadowP.push(x,terrain.heightAt(x,z)+.10,z);
      shadowUV.push((t.cell%2)*.5+u*.25,Math.floor(t.cell/2)*.5+v*.25);
    }
    for(let v=0;v<2;v++)for(let u=0;u<2;u++){const a=base+v*3+u;shadowI.push(a,a+3,a+1,a+1,a+3,a+4);}
  }
  const shadowGeometry=new THREE.BufferGeometry();shadowGeometry.setAttribute('position',new THREE.Float32BufferAttribute(shadowP,3));shadowGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(shadowUV,2));shadowGeometry.setIndex(shadowI);
  const shadow=new THREE.Mesh(shadowGeometry,new THREE.MeshBasicMaterial({map,color:'#101c14',transparent:true,opacity:.17,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,clippingPlanes:cutPlanes,clipIntersection:true}));
  return {mesh,shadow,count:items.length};
}
