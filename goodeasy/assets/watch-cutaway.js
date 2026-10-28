const TAU=Math.PI*2;
export function createCaseSection(T,{shell,chapter,glass}){
 const half=Math.PI/8,level=.182,capGroup=new T.Group(),records=[],marks=[];shell.group.add(capGroup);capGroup.name='Case section faces';
 const material=new T.MeshStandardMaterial({color:0xc4c9c7,metalness:.86,roughness:.34,side:T.DoubleSide});
 const lip=new T.Mesh(new T.RingGeometry(2.425,2.650,32,1,-Math.PI/2-half,2*half).rotateX(-Math.PI/2),material);lip.position.y=level;lip.name="Horizontal case section face";capGroup.add(lip);
 const clip=points=>{const out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],ina=a[1]>=level,inb=b[1]>=level;if(ina)out.push(a);if(ina!==inb){const t=(level-a[1])/(b[1]-a[1]);out.push([a[0]+(b[0]-a[0])*t,level]);}}return out;};
 function cap(profile,parent){const p=clip(profile);if(p.length<3)return;for(const sign of [-1,1]){const s=new T.Shape(p.map(v=>new T.Vector2(...v))),g=new T.ShapeGeometry(s,64),v=g.attributes.position,angle=sign*half;for(let i=0;i<v.count;i++){const r=v.getX(i),y=v.getY(i);v.setXYZ(i,Math.sin(angle)*r,y,Math.cos(angle)*r);}if(sign<0){const q=g.index.array;for(let i=0;i<q.length;i+=3)[q[i+1],q[i+2]]=[q[i+2],q[i+1]];}g.computeVertexNormals();const o=new T.Mesh(g,material);o.name='Visible case cut face';o.castShadow=o.receiveShadow=true;parent.add(o);}}
 function cutMesh(o){if(!o?.isMesh)return;const g=o.geometry,source=g.index?.array||Array.from({length:g.attributes.position.count},(_,i)=>i),p=g.attributes.position,kept=[];for(let i=0;i<source.length;i+=3){let removed=true;for(let j=0;j<3;j++){const k=source[i+j],x=p.getX(k)+o.position.x,y=p.getY(k)+o.position.y,z=p.getZ(k)+o.position.z;if(y<level-1e-6||Math.abs(Math.atan2(x,z))>half+1e-6)removed=false;}if(!removed)kept.push(source[i],source[i+1],source[i+2]);}if(kept.length===source.length)return;const section=g.clone();section.setIndex(kept);section.computeVertexNormals();records.push({o,solid:g,section});if(o.userData.profile)cap(o.userData.profile,capGroup);}
 for(const o of Object.values(shell.parts.case))cutMesh(o);const edge=shell.group.getObjectByName('upper-bezel-edge-highlight');cutMesh(edge);
 const face=chapter.children.find(o=>o.isMesh);cutMesh(face);cap(face.userData.profile,chapter);
 for(const o of chapter.children)if(o!==face&&o.name!=='Visible case cut face'&&Math.abs(Math.atan2(o.position.x,o.position.z))<half+.01)marks.push(o);
 const chapterCaps=chapter.children.filter(o=>o.name==='Visible case cut face');
 return function set(open=true){for(const r of records)r.o.geometry=open?r.section:r.solid;capGroup.visible=open;for(const o of marks)o.visible=!open;for(const o of chapterCaps)o.visible=open;glass.visible=!open;shell.group.userData.sectioned=open;};
}
