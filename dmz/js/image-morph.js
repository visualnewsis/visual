// 동일한 랜드마크를 향해 두 그림을 변형한다. 기존 WebGL 렌더러의 작은 화면 메시 한 개만 사용.
import * as THREE from './three.js?v=20261001-12';

// 원본 이미지 좌상단 기준 정규 좌표. 앞 여섯 점: 세 능선, 도로 굽이, 호수, 해안.
// 뒤 아홉 점: 강의 굽이와 좌우 경계. 없는 지점은 보간에 넣지 않는다.
export const landmarks = [
  [[.295,.575],[.425,.571],[.508,.592],[.239,.702],[.509,.754],[.785,.707]],
  [[.294,.506],[.427,.505],[.508,.521],[.240,.641],[.508,.696],[.785,.642]],
  [[.295,.543],[.426,.549],[.508,.562],[.240,.688],[.509,.735],[.785,.682]],
  [[.273,.124],[.474,.148],[.545,.164],[.242,.257],[.532,.300],[.786,.250], [.321,.317],[.408,.620],[.363,.745],[.392,.920],[.392,.99],[.217,.35],[.25,.97],[.76,.475],[.947,.84]],
  [[.332,.168],[.472,.190],[.548,.198],[.282,.271],[.556,.309],[.799,.266], [.303,.330],[.389,.584],[.324,.741],[.389,.916],[.397,.99],[.203,.35],[.263,.969],[.750,.493],[.97,.83]],
  [[.278,.133],[.474,.172],[.549,.188],[.282,.266],[.552,.295],[.793,.240], [.319,.316],[.389,.556],[.322,.740],[.389,.865],[.395,.98],[.202,.349],[.254,.965],[.752,.49],[.953,.81]],
  [null,null,null,null,null,null, [.284,.253],[.357,.430],[.301,.629],[.347,.814],[.361,.97],[.202,.35],[.242,.963],[.751,.49],[.949,.81]],
  [null,null,null,null,null,null, [.296,.260],[.345,.421],[.321,.629],[.354,.814],[.361,.97],[.203,.35],[.249,.963],[.757,.49],[.95,.81]],
];

export function createAnchoredMorph(renderer, images, map, low) {
  const nx = low ? 30 : 46, ny = low ? 42 : 34;
  const geo = new THREE.PlaneGeometry(2, 2, nx, ny);
  const count = geo.attributes.position.count;
  const ua = new THREE.BufferAttribute(new Float32Array(count * 2), 2).setUsage(THREE.DynamicDrawUsage);
  const ub = new THREE.BufferAttribute(new Float32Array(count * 2), 2).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('uvA', ua); geo.setAttribute('uvB', ub);
  const uniforms = { a: {value:null}, b:{value:null}, mixValue:{value:0}, opacity:{value:1} };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent:true, depthTest:false, depthWrite:false, toneMapped:false,
    vertexShader:`attribute vec2 uvA; attribute vec2 uvB; varying vec2 vA; varying vec2 vB; varying vec2 screenUV;
      void main(){vA=uvA;vB=uvB;screenUV=position.xy*.5+.5;gl_Position=vec4(position.xy,0.0,1.0);}`,
    fragmentShader:`uniform sampler2D a; uniform sampler2D b; uniform float mixValue; uniform float opacity;
      varying vec2 vA; varying vec2 vB; varying vec2 screenUV;
      void main(){
        float field=(screenUV.y-.5)*.62+.035*sin(screenUV.x*9.0+screenUV.y*6.0);
        float blend=smoothstep(.40,.60,mixValue+field*4.0*mixValue*(1.0-mixValue));
        gl_FragColor=vec4(mix(texture2D(a,vA).rgb,texture2D(b,vB).rgb,blend),opacity);
      #include <colorspace_fragment>
      }`,
  });
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const mesh = new THREE.Mesh(geo,mat); mesh.frustumCulled=false; scene.add(mesh);
  const textures = new Array(images.length).fill(null);
  const mapTexture = new THREE.CanvasTexture(map);mapTexture.colorSpace=THREE.SRGBColorSpace;
  mapTexture.generateMipmaps=false;mapTexture.minFilter=THREE.LinearFilter;
  textures.push(mapTexture);
  const textureAt = i => {
    if(textures[i])return textures[i];
    const img=images[i],c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
    // picture/source 선택 후의 실제 비트맵을 고정. 일부 브라우저의 숨긴 img 직접 업로드 오류 회피.
    c.getContext('2d',{alpha:false}).drawImage(img,0,0);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.generateMipmaps=false;
    t.minFilter=THREE.LinearFilter;return textures[i]=t;
  };
  let mapPoints=[], mapTargetPoints=[], enabled=false, last='';

  function frame(i,p,w,h,dolly,reduceMotion) {
    if(i===images.length) {
      const scale=(reduceMotion?1:1.12)/dolly;
      return {width:w*scale,height:h*scale,x:w*(1-scale)/2,y:h*(1-scale)/2};
    }
    const img=images[i], depth=Math.min(p/.78,1), fraction=i/(images.length-1);
    const scale=reduceMotion?1:1+depth*(.16-fraction*.075);
    const fit=Math.max(w/img.naturalWidth,h/img.naturalHeight);
    const width=img.naturalWidth*fit, height=img.naturalHeight*fit;
    // 기존 CSS object-position 및 translate/scale과 같은 좌표. 시작·종료는 동일한 사진.
    const ox=w<820?.42:.5, y=reduceMotion?0:-depth*(1.8-fraction*1.05)*h/100;
    return {width:width*scale,height:height*scale,x:w/2+((w-width)*ox-w/2)*scale,y:h/2+((h-height)/2-h/2)*scale+y};
  }
  function points(i,f,w,h) {
    const pts=i===images.length?mapPoints:(i===6 && images[i].naturalHeight>images[i].naturalWidth
      ? [null,null,null,null,null,null,[.28,.355],[.375,.49],[.326,.596],[.50,.86],[.552,.99],[.19,.57],[.34,.97],[.865,.49],[.99,.78]]
      : landmarks[i]);
    return pts.map(p=>p?[ (f.x+p[0]*f.width)/w, (f.y+p[1]*f.height)/h ]:null);
  }
  return {
    get enabled(){return enabled;},
    mapChanged(pts){mapPoints=pts;mapTexture.needsUpdate=true;last='';},
    mapTargetChanged(pts){mapTargetPoints=pts;},
    prepare(index,mix,p,opacity,w,h,dolly,reduceMotion) {
      if(!map.width||!w||!h){enabled=false;return;}
      enabled=opacity>.0001;
      if(!enabled)return;
      const next=Math.min(images.length,index+1);
      const key=[index,mix,p,w,h,dolly,reduceMotion].join(':');
      uniforms.opacity.value=opacity;
      if(key===last)return;last=key;
      uniforms.a.value=textureAt(index);uniforms.b.value=textureAt(next);uniforms.mixValue.value=mix;
      const fa=frame(index,p,w,h,dolly,reduceMotion),fb=frame(next,p,w,h,dolly,reduceMotion);
      const pa=points(index,fa,w,h),pb=points(next,fb,w,h),anchors=[];
      if(!reduceMotion && ((mix>0 && mix<1)||index===images.length)) for(let j=0;j<Math.min(pa.length,pb.length);j++) {
        if(!pa[j]||!pb[j])continue;
        const a=pa[j],b=pb[j];
        const ta=index===images.length?(mapTargetPoints[j]||a):a;
        const tb=next===images.length?(mapTargetPoints[j]||b):b;
        // 극단적으로 바깥에 있는 점은 세로 크롭의 내부를 끌어당기지 않는다.
        const x=ta[0]+(tb[0]-ta[0])*mix,y=ta[1]+(tb[1]-ta[1])*mix;
        if(x<-.4||x>1.4||y<-.4||y>1.4)continue;
        anchors.push({x,y,ax:x-a[0],ay:y-a[1],bx:x-b[0],by:y-b[1]});
      }
      for(let j=0;j<count;j++) {
        const x=geo.attributes.uv.getX(j),y=1-geo.attributes.uv.getY(j);
        let ax=0,ay=0,bx=0,by=0,weight=0;
        for(const p of anchors) {
          const rx=(x-p.x)*w/h,ry=y-p.y,d=rx*rx+ry*ry;
          const q=1/((d+.00004)*(d+.00004));
          ax+=p.ax*q;ay+=p.ay*q;bx+=p.bx*q;by+=p.by*q;weight+=q;
        }
        if(weight){ax/=weight;ay/=weight;bx/=weight;by/=weight;}
        // 화면 가장자리는 부드럽게 고정해 이미지 밖의 샘플링을 제한한다.
        const edge=Math.min(1,x*12,(1-x)*12,y*12,(1-y)*12);
        ua.setXY(j,((x-ax*edge)*w-fa.x)/fa.width,1-((y-ay*edge)*h-fa.y)/fa.height);
        ub.setXY(j,((x-bx*edge)*w-fb.x)/fb.width,1-((y-by*edge)*h-fb.y)/fb.height);
      }
      ua.needsUpdate=ub.needsUpdate=true;
    },
    render(){
      if(!enabled)return;
      const clear=renderer.autoClear;renderer.autoClear=false;
      renderer.render(scene,camera);renderer.autoClear=clear;
    },
  };
}
