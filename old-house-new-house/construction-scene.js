import * as THREE from '../dmz/js/lib/three.module.min.js';
import {createSky} from './sky.js?v=20261126-flight-clearance';
import {createExcavator} from './excavator.js?v=20261126-backhoe';

const {Vector3, Object3D, Group, Mesh, InstancedMesh, BoxGeometry, CylinderGeometry, MeshStandardMaterial} = THREE;
const unit = new BoxGeometry(1,1,1);
const cylinder = new CylinderGeometry(1,1,1,10);
const up = new Vector3(0,1,0);
const v = (x,y,z) => new Vector3(x,y,z);
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const floorHeight = 3;
const towerLimit = 320;

function group(parent, name) {
  const item = new Group();
  if (name) item.name = name;
  parent.add(item);
  return item;
}

function material(color, roughness = .86, metalness = 0, map = null) {
  return new MeshStandardMaterial({color, roughness, metalness, map});
}

function block(parent, paint, x,y,z,w,h,d, shadows = true) {
  const mesh = new Mesh(unit,paint);
  mesh.position.set(x,y,z);
  mesh.scale.set(w,h,d);
  mesh.castShadow = shadows;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function pipe(parent, paint, thickness, a,b) {
  const mesh = new Mesh(cylinder,paint);
  pipePoints(mesh, thickness, a,b);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function pipePoints(mesh, thickness, a, b) {
  const delta = b.clone().sub(a);
  mesh.position.copy(a).lerp(b,.5);
  mesh.quaternion.setFromUnitVectors(up,delta.clone().normalize());
  mesh.scale.set(thickness,delta.length(),thickness);
}

function seeded(value) {
  let state = value >>> 0;
  return () => {
    state = (Math.imul(1664525,state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// Repeated changes in grain are part of the materials, so they remain visible at camera distance.
function texture(color, color2, repeat, brick = false) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const rand = seeded(304);
  ctx.fillStyle = color;
  ctx.fillRect(0,0,256,256);
  if (brick) {
    for (let row = 0; row < 16; row++) {
      for (let col = -1; col < 8; col++) {
        ctx.fillStyle = row % 3 === 1 ? '#a9826d' : '#9c715f';
        ctx.globalAlpha = .79 + rand() * .21;
        ctx.fillRect(col*32 + (row % 2 ? 16 : 0),row*16,30,14);
      }
    }
    ctx.globalAlpha = 1;
  }
  for (let grain = 0; grain < 5300; grain++) {
    ctx.globalAlpha = rand()*.24;
    ctx.fillStyle = rand() > .52 ? color2 : '#ffffff';
    ctx.fillRect(rand()*256,rand()*256,1 + rand()*2,1 + rand()*2);
  }
  ctx.globalAlpha = 1;
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeat,repeat);
  map.anisotropy = 4;
  return map;
}

function makePalette() {
  return {
    earth:material(0xffffff,.99,0,texture('#7b6851','#514535',13)),
    strip:material(0xffffff,.94,0,texture('#6a7061','#3e4b3b',12)),
    paving:material(0xffffff,.95,0,texture('#868580','#43433e',9)),
    soil:material(0x8b6b51,.99,0,texture('#b29c80','#533c29',3)),
    road:material(0xffffff,.91,0,texture('#434949','#100f0e',19)),
    roadPaint:material(0xe2d4b7,.84),
    aged:material(0xffffff,.94,0,texture('#b9a897','#645748',4,true)),
    oldSurface:material(0xaa9681,.95,0,texture('#c1b5a2','#73604c',5)),
    mutedGlass:material(0x607675,.46,.18),
    newGlass:material(0x91aeae,.35,.32),
    trim:material(0xc9c8bc,.53,.16),
    concrete:material(0xffffff,.82,0,texture('#c6c1ae','#726b5c',4)),
    plaster:material(0xc6c0af,.87,0,texture('#ddd8c4','#8f8b7c',4)),
    dark:material(0x293b39,.65,.19),
    green:material(0x6d8061,.94),
    wood:material(0xac8c64,.93),
    rebar:material(0x67493b,.85,.41),
    strut:material(0x557371,.63,.38),
    metal:material(0x929b8f,.51,.56),
    amber:material(0xc78b3e,.57,.19),
    roof:material(0xd7cfc0,.87),
  };
}

// Break the actual facade, slab and rail pieces. Their last poses also form
// the stockpile, so clearing the site never swaps one set of props for another.
function makeDemolition(site, building, decks) {
  const rand = seeded(254);
  const parts = [];
  const batches = new Map();
  building.updateMatrixWorld(true);
  for (const {deck,level,wing} of decks) {
    for (const panel of deck.children) {
      const center = panel.getWorldPosition(new Vector3());
      const size = panel.scale.clone();
      const bank = batches.get(panel.material) || [];
      batches.set(panel.material,bank);
      const part = {
        center,size,level,wing,base:deck.getWorldPosition(new Vector3()).y,
        laneZ:-2.6 + clamp((center.z+2.6)*.27+(rand()-.5)*.55,-1.65,1.65),
        looseX:center.x+(rand()-.5)*.65,
        tilt:(rand()-.5)*.62, turn:(rand()-.5)*.85,
        bankOffset:rand(), stack:rand(),
        index:bank.length
      };
      parts.push(part);
      bank.push(part);
    }
  }
  for (const [paint,bank] of batches) {
    const mesh = new InstancedMesh(unit,paint,bank.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled=false;
    mesh.castShadow=mesh.receiveShadow=true;
    site.add(mesh);
    bank.forEach(part=>{part.batch=mesh;});
  }
  building.removeFromParent();
  const pose = new Object3D();
  let last = NaN;
  return (time,bladeX)=>{
    const tick=clamp(time,0,3900);
    if (tick===last) return;
    last=tick;
    for (const part of parts) {
      const {center,size,level,wing,base} = part;
      const progressAt = layer => {
        const start=(4-layer)*170 + wing*85 + (center.x-wing*6.3+6.3+3)*12;
        return clamp((tick-start)/245,0,1);
      };
      let support=base;
      for (let below=0;below<level;below++) support-=2.54*progressAt(below)**2;
      const fall=progressAt(level)**2;
      const settle=THREE.MathUtils.smoothstep(fall,0,1);
      // Keep the outer face readable until it tips, then fold it onto the
      // underlying slab as the lower storeys give way in turn.
      const frontWall=size.y>size.z && size.y>size.x*.55 && size.z<size.x;
      const sideWall=size.y>size.x && size.x<=size.z;
      const lean=1.40 + part.tilt*.32;
      const roll=frontWall ? Math.sign(center.z+2.6 || 1)*lean : part.tilt*.5;
      const pitch=sideWall ? Math.sign(center.x-wing*6.3+6.3 || 1)*lean : part.tilt*.37;
      pose.rotation.set(roll*settle,part.turn*settle,pitch*settle);
      pose.scale.copy(size);
      pose.updateMatrix();
      const m=pose.matrix.elements;
      const halfX=(Math.abs(m[0])+Math.abs(m[4])+Math.abs(m[8]))*.5;
      const restX=lerp(center.x,part.looseX,settle);
      const sweep=THREE.MathUtils.smoothstep(tick,1130,2130);
      // Contact starts at the cutting edge; material already in front of
      // the blade lengthens the bank as the dozer crosses the lot.
      const bankDepth=sweep*part.bankOffset*4.3;
      const pushed=sweep===0?0:Math.max(0,restX+halfX+bankDepth-bladeX);
      const packed=THREE.MathUtils.smoothstep(pushed,0,3);
      pose.position.x=restX-pushed;
      pose.position.z=lerp(center.z,part.laneZ,settle)+packed*part.tilt*.43;
      const halfY=(Math.abs(m[1])+Math.abs(m[5])+Math.abs(m[9]))*.5;
      const pile=Math.max(0,support)+halfY+part.stack*.17;
      const bankHeight=(1-part.bankOffset)*1.5+.10;
      const landing=lerp(pile,halfY+part.stack*bankHeight,packed);
      pose.position.y=lerp(support+center.y-base,landing,settle);
      pose.updateMatrix();
      part.batch.setMatrixAt(part.index,pose.matrix);
    }
    for (const bank of batches.values()) {
      const batch=bank[0].batch;
      batch.instanceMatrix.needsUpdate=true;
      batch.visible=tick<3900;
    }
  };
}

function makeDozer(site,p) {
  const truck=group(site,'잔재를 적치장으로 미는 궤도식 도저');
  for(const side of [-1,1]) {
    const z=.98*side;
    block(truck,p.dark,0,.38,z,2.9,.73,.55);
    for(let i=0;i<13;i++) {
      block(truck,p.metal,-1.32+i*.22,.08,z,.15,.12,.61);
      block(truck,p.metal,-1.32+i*.22,.73,z,.15,.08,.61);
    }
    for(let i=0;i<5;i++) {
      const wheel=new Mesh(cylinder,p.oldSurface);
      wheel.rotation.x=Math.PI/2;
      wheel.scale.set(.245,.08,.245);
      wheel.position.set(-1.08+i*.54,.37,z+.29*side);
      truck.add(wheel);
    }
    pipe(truck,p.amber,.12,v(.48,.6,z),v(-2.14,.50,1.52*side));
    pipe(truck,p.metal,.075,v(-.85,1.12,z),v(-2.09,.75,1.44*side));
  }
  block(truck,p.amber,-.26,.97,0,2.73,.65,1.60);
  block(truck,p.amber,-.80,1.48,0,1.34,.49,1.39);
  block(truck,p.dark,-1.49,1.44,0,.04,.32,1.08);
  block(truck,p.dark,.57,1.77,0,1.22,1.26,1.47);
  for(const z of [-.745,.745]) {
    block(truck,p.mutedGlass,.57,1.96,z,.99,.70,.02);
    block(truck,p.amber,.58,1.94,z,.06,.76,.035);
  }
  block(truck,p.trim,.57,2.45,0,1.39,.12,1.59);
  block(truck,p.amber,-2.08,.54,0,.23,.99,4.48).rotation.z=-.12;
  block(truck,p.metal,-2.20,.13,0,.26,.16,4.55);
  return truck;
}

function makeSite(scene, p, machine) {
  const site = group(scene,'기존 주거지와 공사 부지');
  const old = group(site,'기존 아파트');
  const footing = group(site,'굴착과 흙막이');
  const ties = group(footing,'굴착 지보재');
  const reinforcement = group(footing,'기초 철근망');
  const hat = group(footing,'기초 콘크리트');
  const fill = block(site,p.earth,0,-.42,0,23,.8,18);
  const cover = block(site,p.concrete,0,-.25,0,21.9,.5,17.6);
  cover.visible = false;
  for (const [x,z,w,d] of [[0,-34,135,50],[0,59,135,100],[-39,0,55,18],[39,0,55,18]]) {
    block(site,p.strip,x,-.5,z,w,1,d,false);
  }
  block(site,p.paving,0,-.031,11,135,.10,4.1,false);
  block(site,p.road,0,.02,16,135,.045,6,false);
  for (const z of [12.82,19.20]) {
    block(site,p.oldSurface,0,.109,z,135,.17,.38);
    block(site,p.paving,0,.079,z+Math.sign(z-16)*.64,135,.13,1.1,false);
    for (let x = -36; x <= 38; x += 2.7) {
      block(site,p.trim,x,.143,z+Math.sign(z-16)*.67,.016,.009,1,false);
    }
  }
  for (let x = -45; x <= 45; x += 4.4) {
    if (x < -10 || x > 1) block(site,p.roadPaint,x,.047,16,1.9,.009,.055,false);
  }
  for (let x = -9; x <= 0; x += .55) block(site,p.roadPaint,x,.048,16,.24,.011,4.4,false);
  for (const x of [-15.6,8.1,23.9]) {
    const manhole = new Mesh(cylinder,p.dark);
    manhole.scale.set(.32,.021,.32);
    manhole.position.set(x,.045,14.1);
    site.add(manhole);
  }

  // The hoarding sits beyond the work area so the construction remains visible.
  for (const [x,z,cols,rows] of [[-11,-9.8,11,0],[15,-8.5,0,9]]) {
    const length = cols || rows;
    for (let bay = 0; bay < length; bay++) {
      const px = x + (cols ? 2.34*bay : 0);
      const pz = z + (rows ? 2.24*bay : 0);
      block(site,p.strut,px,1.05,pz,cols?2.32:.065,2.07,rows?2.21:.065);
      block(site,p.metal,px-(cols?1.15:0),1.07,pz-(rows?1.1:0),.087,2.2,.087);
      block(site,p.metal,px,2.10,pz,cols?2.35:.085,.045,rows?2.24:.085);
    }
  }
  for (const [x,z,w,h,d] of [[-26,-15,12,10,11],[-15,-23,10,13,11],[15,-20,9,10,10],[26,-12,12,12,11]]) {
    block(site,p.plaster,x,h/2,z,w,h,d);
    block(site,p.trim,x,h+.1,z,w+.25,.21,d+.27);
    for (let y = 2; y < h-1; y += 2.65) {
      for (let offset=-w/2+1.25; offset<w/2-1; offset+=2.05) {
        block(site,p.mutedGlass,x+offset,y,z+d/2+.025,1.12,1.22,.07,false);
        block(site,p.trim,x+offset,y-.65,z+d/2+.13,1.35,.1,.30,false);
      }
    }
  }

  const segments = [];
  for (let wing = 0; wing < 3; wing++) {
    const module = group(old, '저층 아파트 ' + (wing + 1));
    module.position.set(-6.3 + wing*6.3,0,-2.6);
    for (let floor = 0; floor < 4; floor++) {
      const deck = group(module);
      deck.position.y = floor*2.78;
      segments.push({deck,level:floor,wing});
      pipe(deck,p.dark,.055,v(3.052,.02,4.48),v(3.052,2.80,4.48));
      block(deck,p.metal,3.06,1.5,4.48,.09,.07,.17);
      for(let col=0;col<4;col++) {
        const x=(col-1.5)*1.545;
        for(let row=0;row<5;row++) block(deck,p.oldSurface,x,.08,(row-2)*2.08,1.545,.17,2.08);
        for(const side of [-1,1]) block(deck,p.aged,x,1.43,side*4.91,1.545,2.66,.21);
      }
      for(let row=0;row<6;row++) {
        for(const side of [-1,1]) block(deck,p.aged,side*2.93,1.43,(row-2.5)*1.64,.20,2.66,1.64);
      }
      for (const z of [-5.04,5.04]) {
        for (const x of [-2.18,-.05,2.05]) {
          block(deck,p.dark,x,1.56,z,1.52,1.51,.12);
          block(deck,p.mutedGlass,x,1.56,z + Math.sign(z)*.068,1.38,1.36,.043);
          block(deck,p.trim,x,1.55,z + Math.sign(z)*.093,.063,1.44,.035);
          block(deck,p.oldSurface,x,.77,z + Math.sign(z)*.12,1.72,.14,.29);
        }
      }
      if (floor > 0) {
        for (const x of [-1.63,1.62]) {
          block(deck,p.plaster,x,.21,5.42,2.70,.22,1.18);
          for (let post = 0; post < 11; post++) {
            block(deck,p.metal,x-1.22 + post*.244,.72,5.97,.039,.88,.042);
          }
          block(deck,p.metal,x,1.16,5.97,2.63,.054,.056);
          block(deck,p.trim,x+.44,1.22,5.20,.78,.49,.32);
          for (let grille = 0; grille < 5; grille++) {
            block(deck,p.dark,x+.43,1.06+grille*.08,5.372,.55,.024,.01);
          }
        }
      }
    }
    const roof = group(module);
    roof.position.y = 11.04;
    segments.push({deck:roof,level:4,wing});
    for(let col=0;col<4;col++) for(let row=0;row<5;row++) {
      block(roof,p.oldSurface,(col-1.5)*1.55,.12,(row-2)*2.084,1.55,.24,2.084);
    }
    for(let col=0;col<4;col++) for(const side of [-1,1]) {
      block(roof,p.aged,(col-1.5)*1.53,.50,5.03*side,1.53,.66,.22);
    }
    for (const side of [-1,1]) {
      block(roof,p.plaster,.75+side*.82,.90,-2.41,.13,1.54,2.1);
      block(roof,p.plaster,.75,.90,-2.41+side*.98,1.53,1.54,.14);
    }
    block(roof,p.oldSurface,.75,1.70,-2.41,1.86,.14,2.18);
  }

  const soilBottom = block(footing,p.soil,0,-4.49,0,23, .38, 18);
  const wallData = [];
  for (const side of [-1,1]) {
    wallData.push(block(footing,p.soil,side*11.54,-2.20,0,.38,4.4,18));
    wallData.push(block(footing,p.soil,0,-2.20,side*9,23,4.4,.30));
    for (let i = -10; i <= 10; i+=1.5) {
      block(footing,p.wood,i,-2.23,side*8.78,1.44,4.28,.13);
      block(footing,p.strut,i,-2.23,side*8.65,.13,4.42,.16);
      block(footing,p.strut,i,-2.23,side*8.55,.34,4.42,.065);
    }
    for (let i = -7.5; i <= 8; i += 1.5) {
      block(footing,p.wood,side*11.30,-2.23,i,.13,4.28,1.44);
      block(footing,p.strut,side*11.20,-2.23,i,.18,4.40,.23);
    }
    for (const y of [-1.30,-2.5]) {
      block(ties,p.strut,0,y,side*8.49,22.3,.24,.32);
      block(ties,p.metal,0,y+.18,side*8.50,22.3,.13,.61);
    }
  }
  for (const x of [-8.5,-3.2,3.2,8.5]) {
    block(ties,p.strut,x,-1.32,0,.27,.39,17.00);
    block(ties,p.metal,x,-1.105,0,.47,.08,17.00);
    for (const z of [-8.49,8.49]) {
      block(ties,p.metal,x,-1.32,z,.69,.68,.14);
      for (const side of [-1,1]) block(ties,p.dark,x+.22*side,-1.22,z,.086,.10,.09);
    }
  }
  for (const y of [-4.21,-3.85]) {
    for (let x = -10.2; x <= 10.3; x += .44) {
      pipe(reinforcement,p.rebar,.043,v(x,y,-7.77),v(x,y,7.77));
      if (y < -4) {
        pipe(reinforcement,p.rebar,.043,v(x,y,-7.77),v(x,-3.43,-7.77));
        pipe(reinforcement,p.rebar,.043,v(x,y,7.77),v(x,-3.43,7.77));
      }
    }
    for (let z = -7.6; z <= 7.7; z += .45) pipe(reinforcement,p.rebar,.043,v(-10.37,y + .041,z),v(10.37,y+.041,z));
  }
  for (const x of [-9,-6,-3,0,3,6,9]) for (const z of [-6,-2,2,6]) {
    block(reinforcement,p.concrete,x,-4.31,z,.22,.17,.24);
  }
  const concrete = block(hat,p.concrete,0,-3.85,0,21,.81,15.9);
  for (const [x,z] of [[-7,-4],[-7,4],[0,-4],[0,4],[7,-4],[7,4]]) {
    for (const offset of [-.35,.35]) for (const side of [-1,1]) {
      pipe(hat,p.rebar,.035,v(x+offset,-3.68,z+side*.32),v(x+offset,-2.66,z+side*.32));
    }
  }

  const moveDebris=makeDemolition(site,old,segments);
  const dozer=makeDozer(site,p);
  block(site,p.earth,-41,.006,-2.6,59,.016,5.7,false);
  const basementWalls=group(footing,'지하 외벽과 지상층 바닥 받침');
  for(const side of [-1,1]) {
    block(basementWalls,p.concrete,side*10.75,-1.72,0,.31,3.44,16.8);
    block(basementWalls,p.concrete,0,-1.72,side*8.25,21.4,3.44,.30);
  }
  for(const x of [-6,0,6]) for(const z of [-4,4]) {
    block(basementWalls,p.concrete,x,-1.72,z,.75,3.44,.75);
  }
  // This strip is solid retained ground outside the front shoring at z=9.
  // The lowest tread vertex is .0541 above the machine origin.
  const apronTop=.22;
  block(site,p.soil,-30.5,apronTop-.51,10.98,88,.86,3.68);
  const roadPlate=material(0x657168,.96,.13);
  for(let i=0;i<44;i++) {
    const x=-73.5+2*i;
    block(site,roadPlate,x,apronTop-.04,10.98,1.99,.08,3.66);
    // Worn edges on the haul mats distinguish the equipment pad from the sidewalk.
    for(const z of [9.22,12.72]) block(site,p.oldSurface,x,apronTop+.003,z,1.68,.006,.045,false);
  }
  block(site,p.soil,-30.5,.04,9.12,88,.24,.10);
  site.add(machine.root);
  machine.root.position.set(-5.4,apronTop-.0541,10.98);
  machine.root.rotation.y=.14;
  const sideTree = group(site);
  for (const [x,z] of [[-24,7.1],[-19.7,7.9],[20.8,11.4],[23,7.8],[26.7,10],[-26,-6.2]]) {
    pipe(sideTree,p.wood,.135,v(x,0,z),v(x,2.18,z));
    for (const [dx,dy] of [[0,2.82],[.51,2.58],[-.50,2.60]]) {
      const crown = new Mesh(new THREE.IcosahedronGeometry(1.17,1),p.green);
      crown.position.set(x+dx,dy,z);
      crown.scale.set(1.06,.89,1);
      crown.castShadow = true;
      sideTree.add(crown);
    }
  }

  return {
    root:site,
    update(siteTime,floors,detailTime) {
      const pit = clamp((siteTime - 2130)/860,0,1);
      const sweep=THREE.MathUtils.smoothstep(siteTime,1130,2130);
      const haul=THREE.MathUtils.smoothstep(siteTime,2150,3890);
      dozer.position.set(lerp(13.1,-14.2,sweep)-55*haul,.004,-2.6);
      dozer.visible=siteTime<3900;
      moveDebris(siteTime,dozer.position.x-2.24);
      // The same earth surface travels down into the pit with the excavation.
      fill.visible=siteTime<5450 && floors===0;
      fill.position.y=-.42-4.27*pit;
      const joists=THREE.MathUtils.smoothstep(siteTime,4750,5160);
      const deck=THREE.MathUtils.smoothstep(siteTime,5050,5440);
      basementWalls.visible=joists>0;
      basementWalls.scale.y=joists;
      basementWalls.position.y=-3.44*(1-joists);
      cover.visible=deck>0;
      cover.scale.x=21.9*deck;
      cover.position.x=10.95*(deck-1);
      footing.visible = siteTime>=2130 && floors===0;
      ties.visible = pit>.45 && deck<1;
      reinforcement.visible = siteTime>=3240;
      hat.visible = siteTime>=4200;
      const pour = clamp((siteTime-4200)/930,.025,1);
      concrete.scale.x = 21*pour;
      concrete.position.x = -10.5+10.5*pour;
      soilBottom.position.y = fill.position.y-.24;
      wallData.forEach(wall=>{
        wall.scale.y = 4.4*pit + .015;
        wall.position.y = -wall.scale.y/2;
      });
      machine.root.position.x=lerp(-5.4,-70,THREE.MathUtils.smoothstep(siteTime,3250,5440));
      machine.root.rotation.y=lerp(.14,.02,THREE.MathUtils.smoothstep(siteTime,2980,3300));
      machine.root.visible=siteTime<5450;
      if (machine.root.visible) {
        const digging = detailTime === null ? pit * (.5 + .5*Math.sin((siteTime-2480)/225))*(1-THREE.MathUtils.smoothstep(siteTime,2980,3240)) : 0;
        machine.setPose(detailTime ?? Math.max(0,siteTime),digging,detailTime===null ? pit*(1-THREE.MathUtils.smoothstep(siteTime,3030,3400)) : 0);
      }
    },
  };
}

function instances(parent, paint, geometry, total, dimensions, shadow = false) {
  const batch = new InstancedMesh(geometry,paint,total);
  const ghost = new Object3D();
  batch.castShadow = shadow;
  batch.receiveShadow = true;
  parent.add(batch);
  return {batch, write(index,x,y,z, localSize = dimensions) {
    ghost.position.set(x,y,z);
    ghost.scale.set(...localSize);
    ghost.updateMatrix();
    batch.setMatrixAt(index,ghost.matrix);
  }};
}

function makeTower(scene,p) {
  const shaft = group(scene,'현장 타설 코어와 주거 외피');
  const slabs=instances(shaft,p.concrete,unit,towerLimit,[21.7,.28,15.6]);
  const cores=instances(shaft,p.concrete,unit,towerLimit,[7.3,3.0,5.8]);
  const columns=instances(shaft,p.concrete,unit,towerLimit*8,[.63,2.93,.68]);
  const facade=instances(shaft,p.plaster,unit,towerLimit*4,[21.66,2.61,.13]);
  const frontWindows=instances(shaft,p.newGlass,unit,towerLimit*16,[1.84,1.75,.10]);
  const sideWindows=instances(shaft,p.mutedGlass,unit,towerLimit*12,[.09,1.68,1.77]);
  const windowDividers=instances(shaft,p.trim,unit,towerLimit*24,[.055,1.79,.09]);
  const balconies=instances(shaft,p.concrete,unit,towerLimit*8,[3.07,.18,1.13]);
  const sideTrim=instances(shaft,p.dark,unit,towerLimit*2,[.095,.105,15.30]);
  for (let floor=0;floor<towerLimit;floor++) {
    const y = floor*floorHeight;
    cores.write(floor,0,y+1.51,0);
    slabs.write(floor,0,y+.10,0);
    for (const [index,[x,z]] of [[-9.64,-6.83],[-9.64,6.83],[9.64,-6.83],[9.64,6.83],
      [-3.8,-6.83],[-3.8,6.83],[3.8,-6.83],[3.8,6.83]].entries()) columns.write(floor*8+index,x,y+1.48,z);
    for (const [side,z] of [-7.73,7.73].entries()) {
      facade.write(floor*4+side,0,y+1.48,z);
      facade.write(floor*4+2+side,side===0?-10.77:10.77,y+1.48,0,[.13,2.61,15.31]);
      for (let i=0;i<8;i++) {
        const x=-8.93+i*2.55;
        frontWindows.write(floor*16+side*8+i,x,y+1.62,z+Math.sign(z)*.10);
        windowDividers.write(floor*24+side*12+i,x,y+1.62,z+Math.sign(z)*.16);
      }
      for (let i=0;i<6;i++) {
        sideWindows.write(floor*12+side*6+i,side===0?-10.87:10.87,y+1.58,-6.10+i*2.43);
      }
      sideTrim.write(floor*2+side,side===0?-10.90:10.90,y+.36,0);
      for (let i=0;i<4;i++) balconies.write(floor*8+side*4+i,-7.65+i*5.10,y+.34,z+Math.sign(z)*.57);
      for (let i=0;i<4;i++) windowDividers.write(floor*24+side*12+8+i,-7.65+i*5.10,y+.78,z+Math.sign(z)*1.08,[2.85,.062,.062]);
    }
  }
  const batches=[slabs,cores,columns,facade,frontWindows,sideWindows,windowDividers,balconies,sideTrim];
  batches.forEach(({batch})=>batch.computeBoundingSphere());
  const lobby = group(shaft,'1층 현관');
  block(lobby,p.dark,0,1.33,7.95,3.45,2.52,.20);
  block(lobby,p.newGlass,-.70,1.32,8.10,1.29,2.25,.08);
  block(lobby,p.newGlass,.70,1.32,8.10,1.29,2.25,.08);
  block(lobby,p.trim,0,2.68,8.54,4.65,.24,1.72);
  for (const side of [-1,1]) block(lobby,p.trim,side*2.08,1.34,8.99,.10,2.62,.11);

  const roof = group(shaft,'옥상');
  block(roof,p.roof,0,-.06,0,21.73,.26,15.61);
  block(roof,p.plaster,-1.32,.86,-1.14,5.38,1.8,4.2);
  block(roof,p.metal,-1.33,1.78,-1.14,5.78,.13,4.55);
  for (const z of [-7.34,7.34]) block(roof,p.concrete,0,.48,z,21.17,.97,.32);
  for (const x of [-10.29,10.29]) block(roof,p.concrete,x,.49,0,.32,.98,14.73);
  const active = group(shaft,'거푸집과 클라이밍 크레인');
  block(active,p.concrete,0,.10,0,21.7,.28,15.6);
  block(active,p.concrete,0,1.44,0,7.23,3.2,5.75);
  block(active,p.concrete,0,3.17,0,7.46,.22,5.95);
  for (const x of [-8.9,-4.65,0,4.65,8.9]) for (const z of [-6.73,6.73]) {
    for (const dx of [-.17,.17]) for (const dz of [-.16,.16]) {
      pipe(active,p.rebar,.033,v(x+dx,.10,z+dz),v(x+dx,1.46,z+dz));
    }
  }
  for (const z of [-7.70,7.70]) {
    block(active,p.strut,0,-.74,z,21.65,.85,.13);
    for (let x=-10;x<10;x+=.67) block(active,p.metal,x,-.74,z,.03,.81,.033);
  }
  // Edge rails are fixed to the work deck. Keep the load bay inside them.
  for (const side of [-1,1]) {
    for (let x=-10.4;x<=10.4;x+=2.6) {
      block(active,p.amber,x,.85,side*7.5,.085,1.25,.085);
    }
    for (const y of [.86,1.46]) {
      block(active,p.amber,0,y,side*7.5,20.85,.07,.07);
      block(active,p.amber,side*10.4,y,0,.07,.07,15.02);
    }
    for (const z of [-3.75,0,3.75]) block(active,p.amber,side*10.4,.85,z,.085,1.25,.085);
  }
  const growing=group(shaft,'타설 중인 층');
  block(growing,p.concrete,0,1.5,0,7.3,3,5.8);
  for (const x of [-9.64,-3.8,3.8,9.64]) for (const z of [-6.83,6.83]) {
    block(growing,p.concrete,x,1.5,z,.63,3,.68);
  }
  const crane = makeCrane(active,p);

  return {
    update(floors,working,time,elevation) {
      shaft.visible=elevation>0;
      if (!shaft.visible) return;
      const fraction=elevation-floors;
      growing.visible=working && fraction>.001;
      growing.position.y=floors*floorHeight;
      growing.scale.y=Math.max(.001,fraction);
      const visibleExterior=Math.max(0,floors-(working?5:0));
      slabs.batch.count=floors;
      cores.batch.count=floors;
      columns.batch.count=floors*8;
      for (const [index,multiple] of [4,16,12,24,8,2].entries()) batches[3+index].batch.count=visibleExterior*multiple;
      roof.visible=!working;
      active.visible=working;
      roof.position.y=floors*floorHeight;
      active.position.y=elevation*floorHeight;
      if (working) crane.update(time);
    }
  };
}

function makeCrane(parent,p) {
  const mast=group(parent,'코어 상부에 고정한 타워크레인');
  mast.position.set(0,3.44,0);
  const feet=[[-.64,-.64],[-.64,.64],[.64,-.64],[.64,.64]];
  const bayHeight=1.46;
  const bays=6;
  const mastHeight=bays*bayHeight;
  for (const [x,z] of feet) {
    block(mast,p.metal,x,-.08,z,.43,.16,.43);
    pipe(mast,p.amber,.078,v(x,0,z),v(x,mastHeight,z));
    for (const dx of [-.14,.14]) for (const dz of [-.14,.14]) {
      block(mast,p.dark,x+dx,.028,z+dz,.068,.056,.068);
    }
  }
  for (let bay=0;bay<bays;bay++) {
    const y=bay*bayHeight;
    for (const sign of [-1,1]) {
      const edge=sign*.64;
      pipe(mast,p.amber,.052,v(-.64,y,edge),v(.64,y,edge));
      pipe(mast,p.amber,.052,v(edge,y,-.64),v(edge,y,.64));
      pipe(mast,p.amber,.043,v(-.64,y,edge),v(.64,y+bayHeight,edge));
      pipe(mast,p.amber,.043,v(edge,y,-.64),v(edge,y+bayHeight,.64));
    }
  }
  block(mast,p.metal,0,mastHeight,0,1.6,.22,1.6);
  const jib=group(mast);
  jib.position.y=mastHeight+.15;
  const tip=-16, tail=7.3, chord=.86;
  pipe(jib,p.amber,.075,v(tip,chord,0),v(tail,chord,0));
  for (const z of [-.48,.48]) {
    pipe(jib,p.amber,.083,v(tip,0,z),v(tail,0,z));
    for (let bay=0;bay<15;bay++) {
      const left=lerp(tip,tail,bay/15);
      const right=lerp(tip,tail,(bay+1)/15);
      const peak=v((left+right)/2,chord,0);
      pipe(jib,p.amber,.046,v(left,0,z),peak);
      pipe(jib,p.amber,.046,peak,v(right,0,z));
    }
  }
  pipe(jib,p.amber,.075,v(0,0,0),v(0,3.15,0));
  for (const x of [tip,tail]) pipe(jib,p.metal,.044,v(x,chord,0),v(0,3.15,0));
  block(jib,p.dark,6.1,-.18,0,2.4,.36,1.17);
  for (let stone=0;stone<3;stone++) block(jib,p.concrete,5.38+stone*.73,-.83,0,.69,.94,1.08);
  block(jib,p.dark,1.5,-.38,.46,1.06,.68,1.13);
  block(jib,p.newGlass,1.50,-.33,1.03,.92,.57,.035);
  const carriage=group(jib,'인양 트롤리');
  block(carriage,p.metal,0,-.16,0,1.24,.26,1.03);
  for (const x of [-.40,.40]) for (const z of [-.48,.48]) {
    pipe(carriage,p.dark,.14,v(x,-.035,z-.085),v(x,-.035,z+.085));
  }
  const cable=pipe(carriage,p.dark,.025,v(0,0,0),v(0,-6,0));
  cable.name='수직 인양 와이어';
  const load=group(carriage,'훅과 4점 슬링');
  block(load,p.amber,0,-.10,0,.33,.34,.27);
  const hookCurve=new THREE.CatmullRomCurve3([v(0,-.22,0),v(.01,-.46,0),v(.16,-.55,0),v(.32,-.44,0),v(.30,-.31,0)]);
  const hook=new Mesh(new THREE.TubeGeometry(hookCurve,15,.043,7,false),p.metal);
  load.add(hook);
  for (const x of [-1.22,1.22]) for (const z of [-.72,.72]) pipe(load,p.dark,.023,v(.14,-.55,0),v(x,-2.02,z));
  block(load,p.wood,0,-2.11,0,2.69,.18,1.62);
  for (let n=0;n<10;n++) pipe(load,p.rebar,.032,v(-1.18,-2.00,-.67+n*.15),v(1.18,-2.00,-.67+n*.15));
  for (let n=0;n<7;n++) pipe(load,p.rebar,.032,v(-1.18+n*.39,-1.947,-.67),v(-1.18+n*.39,-1.947,.67));
  return {update(time) {
    // Hoist clear before slewing. At either end the trolley stops over
    // the open strip between the core and the outer row of starter bars.
    const phase=(time%8400)/2100;
    const ease=t=>THREE.MathUtils.smoothstep(t,0,1);
    const travel=ease((phase-1)*2)-ease((phase-3)*2);
    const lifted=ease(phase*2)-ease((phase-2)*2)+ease((phase-2.5)*2)-ease((phase-3.5)*2);
    jib.rotation.y=lerp(.12,.33,travel);
    carriage.position.x=lerp(-7.15,-8.9,travel);
    const hookHeight=lerp(2.48,6.8,lifted);
    load.position.y=hookHeight-mast.position.y-jib.position.y;
    pipePoints(cable,.025,v(0,-.29,0),load.position);
  }};
}

// A distant district on the ground plane gives the rising camera a fixed
// reference. The river and streets recede through atmospheric haze.
function makeDistrict(scene) {
  const district=group(scene,'원경의 도로와 강변 주거지');
  const exterior=document.createElement('canvas');
  exterior.width=48;
  exterior.height=96;
  const brush=exterior.getContext('2d');
  brush.fillStyle='#cdc9b9';
  brush.fillRect(0,0,48,96);
  for (let y=4;y<96;y+=8) for (let x=4;x<48;x+=10) {
    brush.fillStyle=(x+y)%3===0?'#9ba9aa':'#7d9297';
    brush.fillRect(x,y,6,4);
  }
  const windows=new THREE.CanvasTexture(exterior);
  windows.colorSpace=THREE.SRGBColorSpace;
  function distantMaterial(color,map=null) {
    const paint=new THREE.MeshBasicMaterial({color,map,transparent:true,depthWrite:true});
    // Fade the horizon into the visible sky instead of exposing the edge
    // of a rectangular ground plane against a transparent canvas.
    paint.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>',
        '#include <fog_fragment>\n gl_FragColor.a *= 1.0 - smoothstep(420.0,2050.0,vFogDepth);');
    };
    return paint;
  }
  const ground=distantMaterial(0xc6cdbe);
  const street=distantMaterial(0xacb9b7);
  const water=distantMaterial(0x98b6bd);
  block(district,ground,0,-6,-1950,7200,1,5000,false).renderOrder=-4;
  block(district,water,0,-3,-1230,7000,.1,260,false).renderOrder=-3;
  const rand=seeded(1301);
  const capacity=28*39*2;
  const buildings=instances(district,distantMaterial(0xffffff,windows),unit,capacity,[1,1,1]);
  const roofs=instances(district,distantMaterial(0xb4bdb6),unit,capacity,[1,1,1]);
  buildings.batch.renderOrder=roofs.batch.renderOrder=-2;
  let count=0;
  for (let row=0;row<28;row++) {
    const z=165-row*86;
    if (Math.abs(z+1230)<165) continue;
    block(district,street,0,-3.15,z-40,3400,.1,6,false).renderOrder=-3;
    for (let column=-19;column<=19;column++) {
      const x=column*83+(row%2)*16;
      if (Math.hypot(x,z)<110 || rand()<.22) continue;
      const h=7+rand()**2*44;
      for (const offset of [-17,17]) {
        buildings.write(count,x+offset,h*.5-3,z,[12,h,34]);
        roofs.write(count++,x+offset,h-2.8,z,[12.4,.55,34.4]);
      }
    }
  }
  buildings.batch.count=roofs.batch.count=count;
  return district;
}

function makeClouds(scene,map) {
  const data=[[27,-25,-29,25],[72,19,-17,28],[171,15,-25,33],[226,-19,8,34],[303,-18,-32,32]];
  return data.map(([floor,x,z,width],index)=>{
    const paint=new THREE.SpriteMaterial({map, transparent:true,opacity:z>0?.88:.83,depthWrite:false});
    const sprite=new THREE.Sprite(paint);
    sprite.scale.set(width,width*.40,1);
    scene.add(sprite);
    return {floor,x,z,sprite,phase:index*.73};
  });
}

function makeBirds(scene) {
  const paint=material(0x3d4d4a);
  const shape = new THREE.Shape();
  shape.moveTo(0,0);
  shape.lineTo(.30,.12);
  shape.lineTo(.83,.20);
  shape.lineTo(1.06,.16);
  shape.lineTo(.58,-.10);
  shape.lineTo(.14,-.15);
  const wing=new THREE.ShapeGeometry(shape);
  return [0,1].map(index=>{
    const formation=group(scene);
    const birds=[];
    for (let i=0;i<4;i++) {
      const bird=group(formation);
      bird.position.set(-i*1.74,-i*.44,-i*.52);
      const body=new Mesh(new THREE.SphereGeometry(.14,7,5),paint);
      body.scale.set(.8,.57,1.68);
      bird.add(body);
      const left=new Mesh(wing,paint);
      const right=new Mesh(wing,paint);
      left.scale.x=-1;
      left.material=right.material=paint;
      paint.side=THREE.DoubleSide;
      bird.add(left,right);
      birds.push([left,right]);
    }
    return {formation,birds,index};
  });
}

export function createConstructionScene({canvas,frame,background,onLost}) {
  let renderer;
  try {
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  } catch {
    return null;
  }
  const mobile=matchMedia('(pointer:coarse)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1,mobile?1.30:1.62));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.02;
  renderer.setClearColor(0x000000,0);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  // The scene is rendered on demand. On each render, cast from the same
  // pose as the colour pass, including a single step on the machine slider.

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(41,1,.14,3100);
  const palette=makePalette();
  const ambient=new THREE.HemisphereLight(0xe9f4fa,0x827d66,1.85);
  scene.add(ambient);
  const sun=new THREE.DirectionalLight(0xffedd1,2.95);
  sun.position.set(-36,66,30);
  sun.castShadow=true;
  sun.shadow.mapSize.set(mobile?1024:1536,mobile?1024:1536);
  Object.assign(sun.shadow.camera,{left:-25,right:25,top:25,bottom:-25,near:1,far:160});
  sun.shadow.bias=-.00012;
  sun.shadow.normalBias=.028;
  scene.add(sun,sun.target);
  const fill=new THREE.DirectionalLight(0xb9d8ef,1.02);
  fill.position.set(13,9,-18);
  scene.add(fill);

  scene.fog=new THREE.FogExp2(0xc8dcdf,.0014);
  makeDistrict(scene);
  const machine=createExcavator();
  const site=makeSite(scene,palette,machine);
  const tower=makeTower(scene,palette);
  const cloudMap=new THREE.TextureLoader().load(new URL('./sky-cumulus.webp',import.meta.url).href);
  cloudMap.colorSpace=THREE.SRGBColorSpace;
  const clouds=makeClouds(scene,cloudMap);
  const updateSky=createSky(scene,cloudMap,makeBirds(scene));
  let aspect=1;
  let viewSize='';
  let groundShadowView=null;
  let orbit=0;
  const target=new Vector3();
  const cameraGoal=new Vector3();

  function resize() {
    const rect=frame.getBoundingClientRect();
    const key=rect.width+':'+rect.height;
    if (!rect.width || !rect.height || key===viewSize) return;
    viewSize=key;
    aspect=rect.width/rect.height;
    camera.aspect=aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width,rect.height,false);
  }

  function render({floor,elevation,siteTime,time,working,descentFloor,detail,detailTime,wingTime=time}) {
    resize();
    const onGround=floor===0 || (descentFloor!==null && descentFloor<14);
    const activeDetail=onGround && detail;
    const atElevation=descentFloor===null ? elevation : descentFloor;
    const height=atElevation*floorHeight;
    const completeTower=floor>1 && !working && descentFloor===null;
    const tight=aspect<1.10 ? .86 : 1;
    const workDeck=working || descentFloor!==null;
    site.root.visible=completeTower || atElevation<45;
    if (site.root.visible) site.update(siteTime,floor,activeDetail ? detailTime : null);
    tower.update(floor,workDeck,time,elevation);
    const lightHeight=workDeck && atElevation>0 && (descentFloor===null || atElevation>towerLimit-16) ? height : 0;
    sun.position.y=66+lightHeight;
    sun.target.position.y=lightHeight;
    const atSite=lightHeight===0;
    if (groundShadowView!==atSite) {
      // Fixed light-space bounds include the entire westbound haul lane.
      // Keep the tighter shadow footprint for the upper construction deck.
      Object.assign(sun.shadow.camera,atSite
        ? {left:-55,right:32,bottom:-59,top:32}
        : {left:-25,right:25,bottom:-25,top:25});
      sun.shadow.camera.updateProjectionMatrix();
      groundShadowView=atSite;
    }
    for (const {floor:alt,x,z,sprite,phase} of clouds) {
      sprite.visible=atElevation>=8 && Math.abs(alt-atElevation)<28;
      sprite.position.set(x+Math.sin(time/3200+phase)*6,alt*floorHeight,z);
    }
    let photo=clamp(1-atElevation/27,0,1);
    if (activeDetail) photo*=.86;
    background.style.opacity=String(photo);
    if (elevation===0) {
      if (activeDetail && siteTime<2130) {
        const center = aspect < 1.10 ? -3 : -2.17;
        target.set(center,2.35,10.98);
        cameraGoal.set(center+Math.sin(orbit)*10,6.95,10.98+Math.cos(orbit)*12.4/tight);
      } else if (activeDetail) {
        target.set(0,-2.3,0);
        cameraGoal.set(11.5+Math.sin(orbit)*10,11.5,20.3+Math.cos(orbit)*4/tight);
      } else {
        const pit=clamp((siteTime-2100)/880,0,1);
        target.set(0,lerp(4.0,-.8,pit),2.3);
        cameraGoal.set(20,lerp(13.6,23,pit),lerp(33,37,pit)/tight);
      }
    } else if (descentFloor!==null) {
      const summit=THREE.MathUtils.smoothstep(descentFloor,towerLimit-16,towerLimit);
      const distance=Math.max(1,1.32/aspect);
      target.set(-2*summit,Math.max(2.9,height-4)+7*summit,.2*(1-summit));
      cameraGoal.set(lerp(20,19*distance,summit),height+lerp(7,14*distance,summit),lerp(34/tight,39*distance,summit));
    } else if (completeTower) {
      const spread=Math.max(46,height*1.62);
      target.set(0,height*.49,0);
      cameraGoal.set(spread*.48,height*.52+spread*.06,spread/tight);
    } else if (working) {
      const takeoff=THREE.MathUtils.smoothstep(elevation,0,5);
      const pullback=16*Math.sin(Math.PI*elevation/towerLimit)**2;
      const distance=Math.max(1,1.32/aspect);
      target.set(-2*takeoff,height+lerp(-.8,3,takeoff),2.3*(1-takeoff));
      cameraGoal.set(lerp(20,(19+pullback*.5)*distance,takeoff),height+lerp(23,14*distance,takeoff),lerp(37/tight,(39+pullback)*distance,takeoff));
    } else {
      target.set(0,Math.max(2,height-5),0);
      cameraGoal.set(20,height+11,35/tight);
    }
    camera.position.copy(cameraGoal);
    camera.lookAt(target);
    camera.updateMatrixWorld();
    updateSky(camera,renderer,atElevation,time,workDeck,towerLimit,wingTime);
    renderer.render(scene,camera);
  }

  function rotate(delta) { orbit=clamp(orbit + delta,-.48,.52); }

  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();
    if (onLost) onLost();
  });
  return {render,resize,rotate};
}
