import * as THREE from '../dmz/js/lib/three.module.min.js';

const smooth=(x,low,high)=>THREE.MathUtils.smoothstep(x,low,high);
const mix=THREE.MathUtils.lerp;

// Tileable fractal noise. Its broad features determine the cloud silhouette,
// and the smaller octaves break up the edges. Both banks share one texture.
function weatherMap() {
  const size=256, grid=new Float32Array(size*size);
  let state=8213;
  for (let i=0;i<grid.length;i++) {
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    grid[i]=state/4294967296;
  }
  const get=(x,y)=>grid[(y&255)*size+(x&255)];
  const bytes=new Uint8Array(size*size*4);
  for (let y=0;y<size;y++) for (let x=0;x<size;x++) {
    let value=0,amplitude=.51;
    for (let period=4;period<=128;period*=2) {
      const sx=x*period/size,sy=y*period/size;
      const ix=Math.floor(sx),iy=Math.floor(sy);
      const a=smooth(sx-ix,0,1),b=smooth(sy-iy,0,1);
      const nextX=(ix+1)%period,nextY=(iy+1)%period;
      value+=amplitude*mix(mix(get(ix,iy),get(nextX,iy),a),mix(get(ix,nextY),get(nextX,nextY),a),b);
      amplitude*=.5;
    }
    const offset=(y*size+x)*4;
    bytes[offset]=bytes[offset+1]=bytes[offset+2]=Math.round(value*255);
    bytes[offset+3]=255;
  }
  const map=new THREE.DataTexture(bytes,size,size);
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.magFilter=THREE.LinearFilter;
  map.minFilter=THREE.LinearMipmapLinearFilter;
  map.generateMipmaps=true;
  map.needsUpdate=true;
  return map;
}

function makeCloudBank(scene,map,tuftMap,y,depth,seed) {
  const geo=new THREE.PlaneGeometry(2800,2800,92,92);
  geo.rotateX(-Math.PI/2);
  const sheets=[];
  for (let i=0;i<6;i++) {
    const slice=i/5;
    const mat=new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,
      uniforms:{
        weather:{value:map}, phase:{value:seed}, slice:{value:slice},
        drift:{value:0}, visibility:{value:0}
      },
      vertexShader:`
        uniform float phase, slice, drift;
        uniform sampler2D weather;
        varying vec3 point;
        void main() {
          point=(modelMatrix*vec4(position,1.)).xyz;
          vec2 p=point.xz*.0017+vec2(phase+drift,-phase);
          float hill=texture2D(weather,p).r;
          point.y+=(hill-.5)*(48.+slice*26.);
          gl_Position=projectionMatrix*viewMatrix*vec4(point,1.);
        }`,
      fragmentShader:`
        uniform sampler2D weather;
        uniform float phase, slice, drift, visibility;
        varying vec3 point;
        void main() {
          vec2 p=point.xz*.0017+vec2(phase+drift,-phase);
          float broad=texture2D(weather,p).r;
          float billow=texture2D(weather,p*3.7+vec2(.36,.58)+slice*.050).r;
          float wisps=texture2D(weather,p*10.3+slice*.10).r;
          float field=.46*broad+.38*billow+.16*wisps;
          float density=smoothstep(.24+.10*abs(slice*2.-1.),.63,field);
          float edge=1.-smoothstep(850.,1370.,length(point.xz));
          float alpha=density*edge*visibility*(.45+.25*slice);
          if(alpha<.008) discard;
          float light=smoothstep(.32,.71,field)*.46+.46*slice+
            .75*(billow-texture2D(weather,p*3.7+vec2(.36,.58)+slice*.05+vec2(-.02,.012)).r);
          vec3 color=mix(vec3(.43,.55,.64),vec3(.98,.97,.90),clamp(light,0.,1.));
          gl_FragColor=vec4(color,alpha);
          #include <colorspace_fragment>
        }`
    });
    const sheet=new THREE.Mesh(geo,mat);
    sheet.position.y=y+(slice-.5)*depth;
    scene.add(sheet);
    sheets.push(sheet);
  }
  // Offset banks of cumulus break up the continuous deck at the horizon
  // and put individual, translucent edges between the viewer and the site.
  const mirrored=tuftMap.clone();
  mirrored.repeat.x=-1;
  mirrored.offset.x=1;
  const tufts=[];
  for (let i=0;i<20;i++) {
    const angle=i*2.39996+seed*13;
    const far=i>=8;
    const radius=far?178+(i%5)*29:45+(i%3)*12;
    const span=far?143+(i%4)*36:30+(i%4)*11;
    const paint=new THREE.SpriteMaterial({map:i%3===0?mirrored:tuftMap,transparent:true,depthWrite:false,
      fog:true,toneMapped:false,color:i%4===0?0xe7eff3:0xffffff});
    paint.rotation=.03*Math.sin(angle);
    paint.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
        #include <map_fragment>
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.78,.85,.87),.28);
        diffuseColor.a*=smoothstep(.08,.61,vMapUv.y);`);
    };
    const puff=new THREE.Sprite(paint);
    const x=Math.cos(angle)*radius, z=Math.sin(angle)*radius;
    puff.position.set(x,y+depth*(.18+.18*Math.sin(angle*3)),z);
    puff.scale.set(span,span*(.30+.10*Math.sin(angle)),1);
    puff.center.y=.36;
    scene.add(puff);
    tufts.push({puff,x,angle});
  }
  return {y,depth,sheets,tufts};
}

function eagle() {
  const map=new THREE.TextureLoader().load(new URL('./sky-eagle.webp',import.meta.url).href);
  map.colorSpace=THREE.SRGBColorSpace;
  const paint=new THREE.MeshBasicMaterial({map,alphaTest:.15,side:THREE.DoubleSide,toneMapped:false});
  const root=new THREE.Mesh(new THREE.PlaneGeometry(5.5,5.5*5/6),paint);
  return root;
}

function dragon() {
  const map=new THREE.TextureLoader().load(new URL('./sky-dragon.webp',import.meta.url).href);
  map.colorSpace=THREE.SRGBColorSpace;
  const mat=new THREE.MeshBasicMaterial({map,alphaTest:.16,side:THREE.DoubleSide,toneMapped:false});
  // A wave travels from the neck to the tail; whiskers stay attached to the head.
  const wave={value:0};
  mat.onBeforeCompile=shader=>{
    shader.uniforms.wave=wave;
    shader.vertexShader='uniform float wave;\n'+shader.vertexShader.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      float tail=1.-uv.x;
      transformed.y+=(sin(wave-tail*7.)*.40+sin(wave*.6-tail*9.)*.12)*tail;
      transformed.z+=sin(wave-tail*6.5)*tail*.37;`);
  };
  const root=new THREE.Mesh(new THREE.PlaneGeometry(12,4,56,4),mat);
  return {root,wave};
}

function spaceModels() {
  const enamel=color=>new THREE.MeshStandardMaterial({color,roughness:.55,metalness:.24,side:THREE.DoubleSide});
  const ivory=enamel(0xe2ded4),tile=enamel(0x2e3741),silver=enamel(0xa9b5bd);
  const foil=enamel(0xc89b4d),glass=enamel(0x244251),cell=enamel(0x183b67);
  const craft=new THREE.Group(),satellite=new THREE.Group();
  function part(parent,geometry,paint,x=0,y=0,z=0) {
    const mesh=new THREE.Mesh(geometry,paint);
    mesh.position.set(x,y,z);
    parent.add(mesh);
    return mesh;
  }
  function box(parent,paint,x,y,z,w,h,d) {
    return part(parent,new THREE.BoxGeometry(w,h,d),paint,x,y,z);
  }
  function fin(parent,points,thickness,paint) {
    const outline=new THREE.Shape(points.map(([x,y])=>new THREE.Vector2(x,y)));
    return part(parent,new THREE.ExtrudeGeometry(outline,{depth:thickness,bevelEnabled:false}),paint);
  }
  // Fuselage stations from the aft engine bay to the nose, with dark tiles
  // below the chine and glazed panels built into the raised flight deck.
  const stations=[[-2.25,.45,.48],[-1.84,.58,.59],[.58,.59,.57],[1.02,.57,.67],
    [1.36,.49,.58],[1.75,.37,.36],[2.19,.23,.23],[2.48,.025,.04]];
  const hull=new THREE.BufferGeometry(),verts=[],colors=[];
  function stationPoint(i,j) {
    const [x,ry,rz]=stations[i],angle=j*Math.PI/8;
    return [x,Math.max(-.37,Math.cos(angle)*ry),Math.sin(angle)*rz];
  }
  for(let i=0;i<stations.length-1;i++) for(let j=0;j<16;j++) {
    const side=Math.min(j+.5,16-j-.5);
    const paint=side>5.2?tile:i===4&&side>=1&&side<4?glass:ivory;
    for(const [a,b] of [[i,j],[i+1,j],[i+1,j+1],[i,j],[i+1,j+1],[i,j+1]]) {
      verts.push(...stationPoint(a,b)); colors.push(paint.color.r,paint.color.g,paint.color.b);
    }
  }
  hull.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  hull.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  hull.computeVertexNormals();
  part(craft,hull,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.6}));
  for(const side of [-1,1]) {
    const wing=fin(craft,[[.87,0],[-.48,1.06],[-1.78,2.48],[-2.03,2.43],[-1.78,.10]],.075,ivory);
    wing.position.set(0,-.16,.37*side);
    wing.rotation.x=side*Math.PI/2;
    const edge=fin(craft,[[.87,0],[-.48,1.06],[-1.78,2.48],[-1.86,2.47],[-.54,1],[.62,0]],.081,tile);
    edge.position.copy(wing.position); edge.rotation.copy(wing.rotation);
  }
  // Thin hoop seams and the center split mark the two payload bay doors.
  for(const x of [-1.67,-1.12,-.57,-.02,.49]) {
    const hoop=new THREE.TorusGeometry(.596,.012,5,22,Math.PI*.91);
    const seam=part(craft,hoop,silver,x,0,0);
    seam.rotation.set(.12,Math.PI/2,0);
  }
  box(craft,silver,-.60,.591,0,2.22,.018,.026);
  const podGeo=new THREE.SphereGeometry(1,14,10);
  for(const side of [-1,1]) {
    const pod=part(craft,podGeo,ivory,-1.56,.28,side*.48);
    pod.scale.set(.75,.26,.22);
    box(craft,tile,-.74,-.15,side*.56,1.85,.07,.055);
    const flap=fin(craft,[[-1.72,1.08],[-1.85,2.30],[-1.91,2.31],[-1.78,1.06]],.02,silver);
    flap.position.set(0,-.06,.30*side); flap.rotation.x=side*Math.PI/2;
  }
  const tail=fin(craft,[[-1,.31],[-1.89,1.6],[-2.2,1.62],[-1.97,.25]],.095,ivory);
  tail.position.z=-.045;
  for(const [y,z] of [[.25,0],[-.13,.28],[-.13,-.28]]) {
    const bell=part(craft,new THREE.CylinderGeometry(.14,.24,.40,14,1,true),tile,-2.38,y,z);
    bell.rotation.z=-Math.PI/2;
  }

  box(satellite,foil,0,0,0,1.15,1.17,.96);
  box(satellite,silver,0,.59,0,1.22,.055,.99);
  box(satellite,silver,0,-.60,0,1.22,.055,.99);
  box(satellite,silver,0,0,0,2.6,.065,.065);
  for(const side of [-1,1]) for(let segment=0;segment<3;segment++) {
    const x=side*(1.38+segment*.94);
    box(satellite,silver,x,0,0,.91,1.39,.075);
    box(satellite,cell,x,0,.05,.86,1.33,.03);
    for(let row=-2;row<=2;row++) box(satellite,silver,x,row*.22,.072,.86,.014,.015);
    box(satellite,silver,x,0,.075,.014,1.33,.014);
  }
  // Projecting camera barrel, thermal louvers and gold blanket straps.
  const lens=part(satellite,new THREE.CylinderGeometry(.18,.23,.30,16),silver,-.22,-.20,.61);
  lens.rotation.x=Math.PI/2;
  const optic=part(satellite,new THREE.CylinderGeometry(.13,.13,.022,16),glass,-.22,-.20,.77);
  optic.rotation.x=Math.PI/2;
  for(const y of [.12,.20,.28,.36]) box(satellite,silver,.13,y,.495,.44,.028,.055);
  for(const x of [-.44,.43]) box(satellite,silver,x,0,.493,.031,1.14,.02);
  const dish=part(satellite,new THREE.LatheGeometry([[0,0],[.12,.02],[.31,.10],[.48,.27]].map(([x,y])=>new THREE.Vector2(x,y)),24),ivory,.20,.64,.12);
  dish.rotation.x=.66;dish.rotation.z=-.28;
  part(dish,new THREE.CylinderGeometry(.021,.021,.50,6),silver,0,.25,0);
  part(dish,new THREE.SphereGeometry(.055,8,6),foil,0,.50,0);
  return {craft,satellite};
}

export function createSky(scene,tuftMap) {
  const map=weatherMap();
  const banks=[makeCloudBank(scene,map,tuftMap,312,54,.14),makeCloudBank(scene,map,tuftMap,714,69,.73)];
  const raptor=eagle(),serpent=dragon();
  const {craft,satellite}=spaceModels();
  scene.add(raptor,serpent.root,craft,satellite);
  const clearFog=new THREE.Color(0xc8dcdf),mist=new THREE.Color(0xdbe4e5);
  const blue=new THREE.Color(0x749eb7),twilight=new THREE.Color(0x233951),skyTint=new THREE.Color();
  const screenPoint=new THREE.Vector3();
  const starPositions=[];
  for (let i=0;i<66;i++) {
    const x=(i*.61803398875%1-.5)*620;
    const y=(i*.41421356237%1-.25)*200;
    starPositions.push(x,y,-235);
  }
  const starGeo=new THREE.BufferGeometry();
  starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));
  const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({
    color:0xe7f3ff,size:1.2,sizeAttenuation:false,transparent:true,depthWrite:false,fog:false
  }));
  scene.add(stars);

  // Block a flight across the view in elevation space. It stays on its same
  // flight path when the reader stops, reverses or scrubs on a narrow screen.
  function fly(root,camera,t,depth,from,to,y,enabled) {
    root.visible=enabled && t>=0 && t<=1;
    if (!root.visible) return;
    const halfH=depth*Math.tan(THREE.MathUtils.degToRad(camera.fov*.5));
    screenPoint.set(mix(from,to,t)*halfH*camera.aspect,y*halfH,-depth);
    root.position.copy(camera.localToWorld(screenPoint));
    root.quaternion.copy(camera.quaternion);
  }

  return function update(camera,renderer,level,time,riding) {
    let immersion=0;
    for (const bank of banks) {
      const dy=camera.position.y-bank.y;
      const fade=riding?smooth(dy,-145,-76)*smooth(level,35,65):0;
      for (const sheet of bank.sheets) {
        sheet.visible=fade>.001;
        if (!sheet.visible) continue;
        sheet.material.uniforms.visibility.value=fade;
        sheet.material.uniforms.drift.value=time*.0000007;
        sheet.renderOrder=4-Math.abs(camera.position.y-sheet.position.y)*.0005;
      }
      for (const {puff,x,angle} of bank.tufts) {
        puff.visible=fade>.001;
        if (!puff.visible) continue;
        puff.position.x=x+5*Math.sin(time*.00012+angle);
        puff.renderOrder=4.002-Math.abs(camera.position.y-puff.position.y)*.0005;
        puff.material.opacity=fade*.77;
      }
      immersion=Math.max(immersion,fade*(1-smooth(Math.abs(dy),bank.depth*.24,bank.depth*.64)));
    }
    scene.fog.color.copy(clearFog).lerp(mist,immersion);
    scene.fog.density=mix(.0014,.064,immersion);
    const upper=riding?smooth(level,40,238):0;
    const summit=riding?smooth(level,295,320):0;
    renderer.setClearColor(skyTint.copy(blue).lerp(twilight,summit).lerp(mist,immersion),mix(upper*(.84+.16*summit),1,immersion));

    stars.visible=summit>.1;
    if (stars.visible) {
      stars.position.copy(camera.position);
      stars.quaternion.copy(camera.quaternion);
      stars.material.opacity=summit*.55;
    }

    const flight=(level-147)/45;
    fly(raptor,camera,flight,28,1.36,-1.36,.50+.16*Math.sin(flight*Math.PI*2),riding);
    if (raptor.visible) {
      raptor.rotateZ(.12+.22*Math.sin(flight*Math.PI*2));
      raptor.rotateY(.32*Math.sin(flight*Math.PI*2));
      raptor.scale.setScalar(Math.min(1.18,camera.aspect));
    }
    const pass=(level-269)/32;
    fly(serpent.root,camera,pass,36,-1.65,1.65,.56+.13*Math.sin(pass*Math.PI),riding);
    if (serpent.root.visible) {
      serpent.root.rotateZ(.07*Math.cos(pass*Math.PI));
      serpent.root.scale.setScalar(Math.min(1.5,camera.aspect*.85));
      serpent.wave.value=time*.003;
    }
    const orbit=(level-298)/18;
    fly(craft,camera,orbit,33,-1.38,1.38,.59+.18*orbit,riding);
    if (craft.visible) {
      craft.rotateZ(.20);
      craft.rotateX(.76+.24*Math.sin(Math.PI*orbit));
      craft.rotateY(-.24);
      craft.scale.setScalar(Math.min(1.47,camera.aspect*1.08));
    }
    const arrival=(level-311)/9;
    fly(satellite,camera,arrival,37,1.48,.45,.60-.23*arrival,riding);
    if (satellite.visible) {
      satellite.rotateZ(-.32-.14*arrival);
      satellite.rotateY(.46-.23*arrival);
      satellite.rotateX(.16);
      satellite.scale.setScalar(Math.min(1.7,camera.aspect*1.29));
    }
  };
}
