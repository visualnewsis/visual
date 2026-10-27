// 지형에 고정된 표면·강둑·암반. 초기화 이후에는 렌더만 한다.
import * as THREE from './three.js?v=20261001-12';
import { W, riverZ, roadX, wallZ, fenceZ, forestMask, rng, noise } from './terrain.js?v=20261027-forest3';

export function createSurfaceDetail(terrain,{low,groundImage,cutPlanes=[]}){
  const meshes=[],textures=[],ground={};
  if(groundImage){
    const size=low?512:1024,c=document.createElement('canvas');c.width=c.height=size;
    const ctx=c.getContext('2d');ctx.drawImage(groundImage,0,0,size,size);
    const image=ctx.getImageData(0,0,size,size),p=image.data,bumpCanvas=document.createElement('canvas');bumpCanvas.width=bumpCanvas.height=size;
    const bumpContext=bumpCanvas.getContext('2d'),bumpImage=bumpContext.createImageData(size,size);let mean=0,meanSquared=0;
    for(let i=0;i<p.length;i+=4){
      const l=.299*p[i]+.587*p[i+1]+.114*p[i+2];mean+=l;meanSquared+=l*l;
      bumpImage.data.set([l,l,l,255],i);
    }
    mean/=size*size;
    const deviation=Math.sqrt(Math.max(0,meanSquared/(size*size)-mean*mean)),contrast=Math.min(.58,14/Math.max(1,deviation));
    for(let i=0;i<p.length;i+=4){
      const luminance=Math.max(1,.299*p[i]+.587*p[i+1]+.114*p[i+2]);
      const light=Math.min(249,Math.max(170,228+(luminance-mean)*contrast));
      for(let k=0;k<3;k++)p[i+k]=Math.min(255,light*(1+(p[i+k]/luminance-1)*.28));
    }
    ctx.putImageData(image,0,0);
    bumpContext.putImageData(bumpImage,0,0);
    const map=new THREE.CanvasTexture(c),bump=new THREE.CanvasTexture(bumpCanvas);
    map.colorSpace=THREE.SRGBColorSpace;bump.colorSpace=THREE.NoColorSpace;
    for(const t of [map,bump]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=low?2:4;}
    Object.assign(ground,{map,bumpMap:bump,bumpScale:low?.09:.13,shininess:2,specular:'#22291d'});
    textures.push(map,bump);
  }
  const P=[],C=[],UV=[],I=[],stoneColor=new THREE.Color();
  // 물 가장자리의 두 가는 띠. 각 정점이 실제 지형을 따르므로 부유하는 평면이 없다.
  for(const side of [-1,1]){
    const start=P.length/3,step=low?4:2.5;let row=0;
    for(let x=W.xMin+1;x<=W.xMax-1;x+=step,row++){
      const center=riverZ(x),width=1.2+1.0*(.5+.5*noise(x*.08,side));
      for(let edge=0;edge<2;edge++){
        const z=center+side*(7.6+edge*width),y=terrain.heightAt(x,z)+.16;
        P.push(x,y,z);UV.push(x/12,edge);
        stoneColor.set(edge?'#b9b59d':'#818b7b').multiplyScalar(.88+.15*(.5+.5*noise(x*.17,z*.17)));
        C.push(stoneColor.r,stoneColor.g,stoneColor.b);
      }
      if(row){const a=start+(row-1)*2;I.push(a,a+2,a+1,a+1,a+2,a+3);}
    }
  }
  const bankGeometry=new THREE.BufferGeometry();bankGeometry.setAttribute('position',new THREE.Float32BufferAttribute(P,3));bankGeometry.setAttribute('color',new THREE.Float32BufferAttribute(C,3));bankGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));bankGeometry.setIndex(I);bankGeometry.computeVertexNormals();
  const bankMaterial=new THREE.MeshPhongMaterial({vertexColors:true,map:ground.map,bumpMap:ground.bumpMap,bumpScale:.035,shininess:2,side:THREE.DoubleSide,clippingPlanes:cutPlanes,clipIntersection:true,polygonOffset:true,polygonOffsetFactor:-1});
  meshes.push(new THREE.Mesh(bankGeometry,bankMaterial));
  // 낮게 묻힌 암반은 개활 능선의 가파른 면에만 모인다. 시설·수색로에 새 사물을 배치하지 않는다.
  const random=rng(271066),rocks=[],limit=low?64:112;
  for(let tries=0;rocks.length<limit&&tries<6000;tries++){
    const x=W.xMin+35+random()*(W.xMax-W.xMin-70),z=W.zMin+35+random()*(W.zMax-W.zMin-70),y=terrain.heightAt(x,z);
    if(Math.abs(x-roadX(z))<12||Math.abs(z-wallZ(x))<16||Math.abs(z-fenceZ(x,W.SLL,1))<18||Math.abs(z-fenceZ(x,W.NLL,-1))<18||Math.abs(z)<12||Math.hypot(x+4,z-94)<35||Math.hypot(x-40,z-114)<48)continue;
    const gx=(terrain.heightAt(x+2,z)-terrain.heightAt(x-2,z))/4,gz=(terrain.heightAt(x,z+2)-terrain.heightAt(x,z-2))/4;
    if(y<17||Math.hypot(gx,gz)<.29||forestMask(x,z)>.45||Math.abs(z-riverZ(x))<25)continue;
    rocks.push({x,z,y,size:2.4+random()*3.5,a:random()*Math.PI*2,h:.22+random()*.14,tint:.82+random()*.25});
  }
  const rockGeometry=new THREE.IcosahedronGeometry(1,1);
  const vertices=rockGeometry.attributes.position;
  for(let i=0;i<vertices.count;i++){
    const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i),r=1+.10*Math.sin(x*7+z*5)*Math.cos(y*6-z*3);
    vertices.setXYZ(i,x*r,y*r,z*r);
  }
  rockGeometry.computeVertexNormals();
  const rockMaterial=new THREE.MeshPhongMaterial({color:'#a8a691',shininess:2,specular:'#292c23',clippingPlanes:cutPlanes,clipIntersection:true});
  const rockMesh=new THREE.InstancedMesh(rockGeometry,rockMaterial,rocks.length),object=new THREE.Object3D(),tint=new THREE.Color();
  rocks.forEach((r,i)=>{object.position.set(r.x,r.y-r.size*r.h*.50,r.z);object.rotation.set(.06*Math.sin(r.a),r.a,.08*Math.cos(r.a));object.scale.set(r.size,r.size*r.h,r.size*.72);object.updateMatrix();rockMesh.setMatrixAt(i,object.matrix);rockMesh.setColorAt(i,tint.set('#ffffff').multiplyScalar(r.tint));});
  meshes.push(rockMesh);
  return {ground,meshes,stats:{drawCalls:2,triangles:I.length/3+rocks.length*rockGeometry.attributes.position.count/3,rocks:rocks.length},dispose(){textures.forEach(t=>t.dispose());meshes.forEach(m=>{m.geometry.dispose();m.material.dispose();});}};
}
