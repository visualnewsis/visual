// GOODEASY 08 — hero keyboard: ANSI 60% layout on a 19.05 mm pitch, model units = 10 mm.
// Sculpted rows, row stagger and a 6.25u space bar. Visualization model, not a product CAD.
import {KEY_PITCH,keycapProfile,buildKeycapShell,dishY} from './mx-keycap.js?v=20261030-craft-release1';
// [key id, width in u]. Ids are the characters lab.js reports in state.key where one exists.
export const KEYBOARD_ROWS=[
 [['`',1],['1',1],['2',1],['3',1],['4',1],['5',1],['6',1],['7',1],['8',1],['9',1],['0',1],['-',1],['=',1],['Backspace',2]],
 [['Tab',1.5],['Q',1],['W',1],['E',1],['R',1],['T',1],['Y',1],['U',1],['I',1],['O',1],['P',1],['[',1],[']',1],['\\',1.5]],
 [['CapsLock',1.75],['A',1],['S',1],['D',1],['F',1],['G',1],['H',1],['J',1],['K',1],['L',1],[';',1],["'",1],['Enter',2.25]],
 [['ShiftLeft',2.25],['Z',1],['X',1],['C',1],['V',1],['B',1],['N',1],['M',1],[',',1],['.',1],['/',1],['ShiftRight',2.75]],
 [['ControlLeft',1.25],['MetaLeft',1.25],['AltLeft',1.25],[' ',6.25],['HangulMode',1.25],['Hanja',1.25],['Fn',1.25],['ControlRight',1.25]]
];
// Cherry-like sculpt, approximated: back rows lean toward the typist, front rows away (tilt in radians).
// Heights are at the key centre; with the tilt every rim stays within 9-12 mm.
export const ROW_PROFILES=[{height:1.05,tilt:.16},{height:.96,tilt:.08},{height:.92,tilt:0},{height:.98,tilt:-.10},{height:.98,tilt:-.10}];
export const HERO={skirt:.52,housingTop:.60,housingBottomHalf:.70,housingTopHalf:.52,plateThickness:.15,caseTop:.30,caseBottom:-1.75,caseClearance:.25,bezel:.85,deckTilt:.07,travelScale:.1};
// Korean 2-set (두벌식) legends: [base, shifted].
export const HANGUL={Q:['ㅂ','ㅃ'],W:['ㅈ','ㅉ'],E:['ㄷ','ㄸ'],R:['ㄱ','ㄲ'],T:['ㅅ','ㅆ'],Y:['ㅛ'],U:['ㅕ'],I:['ㅑ'],O:['ㅐ','ㅒ'],P:['ㅔ','ㅖ'],A:['ㅁ'],S:['ㄴ'],D:['ㅇ'],F:['ㄹ'],G:['ㅎ'],H:['ㅗ'],J:['ㅓ'],K:['ㅏ'],L:['ㅣ'],Z:['ㅋ'],X:['ㅌ'],C:['ㅊ'],V:['ㅍ'],B:['ㅠ'],N:['ㅜ'],M:['ㅡ']};
const SHIFTED={'`':'~','1':'!','2':'@','3':'#','4':'$','5':'%','6':'^','7':'&','8':'*','9':'(','0':')','-':'_','=':'+','[':'{',']':'}','\\':'|',';':':',"'":'"',',':'<','.':'>','/':'?'};
const NAMES={Backspace:'Backspace',Tab:'Tab',CapsLock:'Caps Lock',Enter:'Enter',ShiftLeft:'Shift',ShiftRight:'Shift',ControlLeft:'Ctrl',ControlRight:'Ctrl',MetaLeft:'Win',AltLeft:'Alt',HangulMode:'한/영',Hanja:'한자',Fn:'Fn'};
const MODIFIERS=new Set(['`','Backspace','Tab','\\','CapsLock','Enter','ShiftLeft','ShiftRight','ControlLeft','MetaLeft','AltLeft','HangulMode','Hanja','Fn','ControlRight']);
// Every key ends at 15u, so rows share both outer edges.
export function keyLayout(){
 const width=15*KEY_PITCH,out=[];
 KEYBOARD_ROWS.forEach((row,r)=>{let u=0;for(const [id,w] of row){out.push({id,row:r,units:w,startU:u,x:(u+w/2)*KEY_PITCH-width/2,z:(r-2)*KEY_PITCH});u+=w;}});
 return out;
}
const JAMO_KEY=Object.fromEntries(Object.entries(HANGUL).flatMap(([k,v])=>v.map(j=>[j,k])));
const MEDIAL='ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ',FINAL=['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
// Compound jamo resolve to their last typed component.
const LAST={'ㅘ':'ㅏ','ㅙ':'ㅐ','ㅚ':'ㅣ','ㅝ':'ㅓ','ㅞ':'ㅔ','ㅟ':'ㅣ','ㅢ':'ㅣ','ㄳ':'ㅅ','ㄵ':'ㅈ','ㄶ':'ㅎ','ㄺ':'ㄱ','ㄻ':'ㅁ','ㄼ':'ㅂ','ㄽ':'ㅅ','ㄾ':'ㅌ','ㄿ':'ㅍ','ㅀ':'ㅎ','ㅄ':'ㅅ'};
const BASE_OF=Object.fromEntries(Object.entries(SHIFTED).map(([k,v])=>[v,k]));
// lab.js reports physical Backspace/Delete/Enter as upper-case names; the 60% layout has no Delete key.
const NAMED={BACKSPACE:'Backspace',ENTER:'Enter',TAB:'Tab',SPACE:' ',DELETE:null};
const LAYOUT_IDS=Object.fromEntries(KEYBOARD_ROWS.flat().map(([id])=>[id.toUpperCase(),id]));
// Map whatever lab.js last reported (letter, symbol, jamo, syllable, space, newline, key name) to a key id.
export function keyForChar(ch){
 if(typeof ch!=='string'||!ch)return null;
 if(Array.from(ch).length>1&&/^[A-Za-z0-9]+$/.test(ch)){const up=ch.toUpperCase();return up in NAMED?NAMED[up]:LAYOUT_IDS[up]??null;}
 const c=Array.from(ch).at(-1);
 if(c===' ')return ' ';if(c==='\n'||c==='\r')return 'Enter';
 const up=c.toUpperCase();if(/^[A-Z0-9]$/.test(up))return up;if(SHIFTED[c])return c;if(BASE_OF[c])return BASE_OF[c];
 const code=c.codePointAt(0);let jamo=c;
 if(code>=0xAC00&&code<=0xD7A3){const s=code-0xAC00,f=s%28;jamo=f?FINAL[f]:MEDIAL[Math.floor(s%588/28)];}
 jamo=LAST[jamo]||jamo;return JAMO_KEY[jamo]||null;
}
export function legendFor(id){
 if(HANGUL[id])return {main:id,base:HANGUL[id][0],shift:HANGUL[id][1]||null};
 if(SHIFTED[id])return {main:id,shift:SHIFTED[id]};
 if(NAMES[id])return {label:NAMES[id]};return null;
}
export function rowProfile(row,units){
 const r=ROW_PROFILES[row],space=units>=4;
 return keycapProfile({units,bottom:HERO.skirt,height:r.height,tilt:r.tilt,dish:space?.045:.06,dishAxis:space?'x':'z'});
}
// One atlas for every legend; cells are 128 px and map onto a 1.1-unit decal conformed to the dish.
const CELL=128,GRID=8,DECAL=1.10,FONT='"Pretendard Variable","Pretendard","Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",Arial,sans-serif';
function drawLegend(ctx,cell,legend,dark){
 const x0=(cell%GRID)*CELL,y0=Math.floor(cell/GRID)*CELL,ink=dark?'#e4dfd2':'#2f3532';ctx.fillStyle=ink;ctx.textBaseline='middle';
 const text=(t,x,y,size,align='center',weight=600)=>{ctx.font=`${weight} ${size}px ${FONT}`;ctx.textAlign=align;ctx.fillText(t,x0+x,y0+y);};
 // Matches the study keycap: Latin left, shifted jamo upper right, base jamo lower right.
 if(legend.base){text(legend.main,32,64,46);if(legend.shift)text(legend.shift,91,42,32);text(legend.base,91,86,32);}
 else if(legend.shift){text(legend.shift,34,40,30);text(legend.main,34,88,30);}
 else if(legend.label)text(legend.label,10,64,legend.label.length>6?17:20,'left',500);
}
export function buildKeyboardHero(T,M={}){
 const material=(k,c,o={})=>M[k]||new T.MeshPhysicalMaterial({color:c,roughness:.4,clearcoat:.2,...o});
 const ivory=material('ivory',0xe5e0ca),graphite=M.keycapDark||new T.MeshPhysicalMaterial({color:0x4a4e4d,roughness:.46,clearcoat:.18}),black=material('black',0x131a1b,{metalness:.35,roughness:.29}),steel=material('steel',0xbac2c0,{metalness:.92,roughness:.32});
 const group=new T.Group(),deck=new T.Group();deck.name='keyboard deck';deck.rotation.x=HERO.deckTilt;group.add(deck);
 const body=new T.Group();body.name='body';body.userData.part='body';deck.add(body);
 const keys=new Map(),layout=keyLayout(),halfW=15*KEY_PITCH/2,halfD=5*KEY_PITCH/2;
 // Case: rounded tray with a chamfered top edge; plate inside it carries the fixed switch housings.
 const rr=(a,b,r)=>{const s=new T.Shape();s.moveTo(-a+r,-b);s.lineTo(a-r,-b);s.absarc(a-r,-b+r,r,-Math.PI/2,0);s.lineTo(a,b-r);s.absarc(a-r,b-r,r,0,Math.PI/2);s.lineTo(-a+r,b);s.absarc(-a+r,b-r,r,Math.PI/2,Math.PI);s.lineTo(-a,-b+r);s.absarc(-a+r,-b+r,r,Math.PI,Math.PI*1.5);return s;};
 const inA=halfW+HERO.caseClearance,inB=halfD+HERO.caseClearance,outA=inA+HERO.bezel,outB=inB+HERO.bezel,cs=rr(outA,outB,.9),hole=rr(inA,inB,.35);cs.holes.push(hole);
 const bevel=.12,caseGeo=new T.ExtrudeGeometry(cs,{depth:HERO.caseTop-HERO.caseBottom-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelOffset:-bevel,bevelSegments:3,curveSegments:16});
 caseGeo.rotateX(-Math.PI/2);caseGeo.translate(0,HERO.caseBottom+bevel,0);const caseMesh=new T.Mesh(caseGeo,steel);caseMesh.name='keyboard case';body.add(caseMesh);
 const plate=new T.Mesh(new T.BoxGeometry(2*inA-.02,HERO.plateThickness,2*inB-.02),black);plate.position.y=-HERO.plateThickness/2;plate.name='switch plate';body.add(plate);
 const housing=new T.CylinderGeometry(HERO.housingTopHalf*Math.SQRT2,HERO.housingBottomHalf*Math.SQRT2,HERO.housingTop,4,1);housing.rotateY(Math.PI/4);housing.translate(0,HERO.housingTop/2,0);
 const housings=new T.InstancedMesh(housing,black,layout.length),dummy=new T.Object3D();housings.name='Fixed switch housing';
 layout.forEach((k,i)=>{dummy.position.set(k.x,0,k.z);dummy.updateMatrix();housings.setMatrixAt(i,dummy.matrix);});housings.instanceMatrix.needsUpdate=true;body.add(housings);
 // Legend atlas (browser only); the model still builds without a DOM, just without printed legends.
 let atlas=null,ctx=null;
 if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=c.height=CELL*GRID;ctx=c.getContext('2d');atlas=new T.CanvasTexture(c);atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=4;}
 const ink=atlas&&new T.MeshStandardMaterial({map:atlas,transparent:true,depthWrite:false,roughness:.55,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 const shells=new Map();let cell=0;
 for(const k of layout){
  const profile=rowProfile(k.row,k.units),sig=k.row+':'+k.units;
  if(!shells.has(sig))shells.set(sig,buildKeycapShell(T,profile,{interior:true,merged:true,cornerSegments:5,sideSegments:k.units>=2?10:5,wallRings:3,filletRings:4,topRings:6}).exterior);
  const g=new T.Group();g.name='key '+k.id;g.userData={part:'key',key:k.id,row:k.row,units:k.units,profile,rest:new T.Vector3(k.x,0,k.z)};g.position.copy(g.userData.rest);deck.add(g);
  const dark=MODIFIERS.has(k.id),cap=new T.Mesh(shells.get(sig),dark?graphite:ivory);cap.name='keycap';cap.castShadow=true;cap.receiveShadow=true;g.add(cap);
  const legend=legendFor(k.id);g.userData.legend=legend;
  if(legend&&ctx&&cell<GRID*GRID){
   drawLegend(ctx,cell,legend,dark);const cx=k.units>1.01?-profile.tx+DECAL/2+.04:0,plane=new T.PlaneGeometry(DECAL,DECAL,6,6);plane.rotateX(-Math.PI/2);plane.translate(cx,0,0);
   const a=plane.attributes.position,uv=plane.attributes.uv,col=cell%GRID,row=Math.floor(cell/GRID);
   for(let i=0;i<a.count;i++){a.setY(i,dishY(profile,a.getX(i),a.getZ(i))+.004);uv.setXY(i,(col+uv.getX(i))/GRID,1-(row+1-uv.getY(i))/GRID);}
   plane.computeVertexNormals();const decal=new T.Mesh(plane,ink);decal.name='legend';decal.userData.cell=cell;g.add(decal);cell++;
  }
  // Only keys with an on-screen button forward clicks; the others are decorative but still move when typed.
  const action=/^[A-Z]$/.test(k.id)||k.id===' '?'key:'+k.id:null;g.traverse(o=>{if(o.isMesh){o.userData.part='key';if(action)o.userData.action=action;}});
  keys.set(k.id,g);
 }
 if(atlas)atlas.needsUpdate=true;
 const spring=new T.Group();spring.name='spring';spring.visible=false;group.add(spring);
 const pts=Array.from({length:150},(_,i)=>{const a=i/149*Math.PI*14;return new T.Vector3(Math.cos(a)*.22,i/149,Math.sin(a)*.22);});
 const coil=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),300,.025,8,false),steel);coil.position.set(halfW-1,1.2,halfD-.4);spring.add(coil);
 body.traverse(o=>{if(o.isMesh){o.userData.part='body';o.receiveShadow=true;}});
 let pressed=null;
 function update(s={},detail=false){
  const id=keyForChar(s.key),mm=Math.max(0,Math.min(4,Number(s.travel)||0));
  for(const [k,g] of keys){g.position.y=g.userData.rest.y-(k===id?mm*HERO.travelScale:0);}
  pressed=mm>0?id:null;group.userData.pressedKey=pressed;group.userData.travelMm=mm;spring.visible=!!detail;
 }
 update();
 return {group,eye:[2.2,8,7.6],keys,layout,parts:{body,key:keys.get('A'),cap:keys.get('A'),spring},update};
}
