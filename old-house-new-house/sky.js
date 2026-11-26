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
  return new THREE.Mesh(new THREE.PlaneGeometry(5.5,5.5*5/6),paint);
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
  const ivory=enamel(0xe2ded4),silver=enamel(0xa9b5bd);
  const foil=enamel(0xc89b4d),glass=enamel(0x244251),cell=enamel(0x183b67);
  const satellite=new THREE.Group();
  const shuttleMap=new THREE.TextureLoader().load(new URL('./sky-orbiter.webp',import.meta.url).href);
  shuttleMap.colorSpace=THREE.SRGBColorSpace;
  const craft=new THREE.Sprite(new THREE.SpriteMaterial({
    map:shuttleMap,transparent:true,depthWrite:false,toneMapped:false
  }));
  craft.renderOrder=2;
  function part(parent,geometry,paint,x=0,y=0,z=0) {
    const mesh=new THREE.Mesh(geometry,paint);
    mesh.position.set(x,y,z);
    parent.add(mesh);
    return mesh;
  }
  function box(parent,paint,x,y,z,w,h,d) {
    return part(parent,new THREE.BoxGeometry(w,h,d),paint,x,y,z);
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

export function createSky(scene,tuftMap,flocks) {
  const map=weatherMap();
  const banks=[makeCloudBank(scene,map,tuftMap,312,54,.14),makeCloudBank(scene,map,tuftMap,714,69,.73)];
  const raptor=eagle(),serpent=dragon();
  const {craft,satellite}=spaceModels();
  // Keep the entire crossing in the clear air nearest the reader. Scaling
  // depth and size together preserves the angular size of each silhouette.
  const foreground=new THREE.Group();
  foreground.scale.setScalar(.36);
  foreground.add(raptor,serpent.root,craft,satellite,...flocks.map(flock=>flock.formation));
  scene.add(foreground);
  const clearFog=new THREE.Color(0xc8dcdf),mist=new THREE.Color(0xdbe4e5);
  const blue=new THREE.Color(0x749eb7),twilight=new THREE.Color(0x233951),skyTint=new THREE.Color();
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
    root.position.set(mix(from,to,t)*halfH*camera.aspect,y*halfH,-depth);
    root.quaternion.identity();
  }

  return function update(camera,renderer,level,time,riding,topFloor,wingTime=time) {
    foreground.position.copy(camera.position);
    foreground.quaternion.copy(camera.quaternion);
    // Project each encounter from a fixed scenic altitude. A rising camera
    // sees the flight drop, and reversing the lift reverses only that parallax.
    const focalSlope=Math.tan(THREE.MathUtils.degToRad(camera.fov*.5));
    const skyHeight=(altitude,distance)=>(altitude-camera.position.y)/(distance*focalSlope);
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

    // Invert the tower's smoothstep ascent so each crossing keeps a steady
    // screen speed and retraces the same route on the reader's descent.
    const heightRatio=THREE.MathUtils.clamp(level/topFloor,0,1);
    const journey=.5-Math.sin(Math.asin(1-2*heightRatio)/3);
    for (const {formation,birds,index} of flocks) {
      const pass=(journey-(index ? .15 : .008))/.30;
      fly(formation,camera,pass,34,-1.36,1.68,skyHeight(index?272:113,index?540:350)+.035*Math.sin(pass*Math.PI),riding);
      if (!formation.visible) continue;
      formation.scale.setScalar(Math.min(1.04,camera.aspect*.88));
      formation.rotateY(-.32);
      birds.forEach(([left,right],i)=>{
        const beat=wingTime*.0031+i*.67;
        const flap=.13+.31*Math.sin(beat)*(.5+.5*Math.cos(beat*.32));
        left.rotation.z=-flap;
        right.rotation.z=flap;
      });
    }
    const flight=(journey-.24)/.39;
    fly(raptor,camera,flight,28,1.19,-1.19,skyHeight(456,930)+.035*Math.sin(flight*Math.PI),riding);
    if (raptor.visible) {
      raptor.rotateZ(.08+.12*Math.sin(flight*Math.PI*2));
      raptor.scale.setScalar(Math.min(1.18,camera.aspect));
    }
    const pass=(journey-.48)/.385;
    fly(serpent.root,camera,pass,36,-1.34,1.34,skyHeight(758,920)+.045*Math.sin(pass*Math.PI),riding);
    if (serpent.root.visible) {
      serpent.root.rotateZ(.07*Math.cos(pass*Math.PI));
      serpent.root.scale.setScalar(Math.min(1.5,camera.aspect*.85));
      serpent.wave.value=wingTime*.00145;
    }
    const orbit=(journey-.67)/.33;
    fly(craft,camera,orbit,33,-1.32,1.32,skyHeight(959,760)+.035*orbit,riding);
    if (craft.visible) {
      const span=Math.min(9.4,camera.aspect*6.9);
      craft.scale.set(span,span*.50,1);
      craft.material.rotation=.085+.025*Math.sin(orbit*Math.PI);
    }
    const arrival=(journey-.81)/.19;
    fly(satellite,camera,arrival,37,1.48,.45,skyHeight(1026,450)-.08*arrival,riding);
    if (satellite.visible) {
      satellite.rotateZ(-.32-.14*arrival);
      satellite.rotateY(.46-.23*arrival);
      satellite.rotateX(.16);
      satellite.scale.setScalar(Math.min(1.7,camera.aspect*1.29));
    }
  };
}
