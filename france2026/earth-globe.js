'use strict';
// Natural Earth relief is a geographic raster, not a satellite photograph or
// a live observation. The same inverse orthographic equations drive GPU/CPU.
function createReliefGlobe(canvas,url,onReady){
 const image=new Image();image.decoding='async';
 let ready=false,draw=null;
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:true,depth:false,stencil:false,preserveDrawingBuffer:true});
 if(gl){
  try{
   const vertex='attribute vec2 position;varying vec2 clip;void main(){clip=position;gl_Position=vec4(position,0.,1.);}';
   const fragment=`precision highp float;
varying vec2 clip;
uniform vec2 viewport,centre;
uniform float radius,longitude,latitude;
uniform sampler2D earth;
const float PI=3.141592653589793;
void main(){
 vec2 pixel=vec2((clip.x+1.)*.5*viewport.x,(1.-clip.y)*.5*viewport.y);
 vec2 p=(pixel-centre)/radius;p.y=-p.y;
 float rr=dot(p,p);
 if(rr>=1.)discard;
 float z=sqrt(max(0.,1.-rr));
 float lat=asin(clamp(p.y*cos(latitude)+z*sin(latitude),-1.,1.));
 float lon=longitude+atan(p.x,z*cos(latitude)-p.y*sin(latitude));
 vec2 uv=vec2(fract(lon/(2.*PI)+.5),.5-lat/PI);
 vec3 color=texture2D(earth,uv).rgb;
 float water=smoothstep(.025,.105,color.b-max(color.r,color.g));
 vec3 ocean=vec3(.025,.13,.235)+vec3(.02,.09,.12)*color.b;
 color=mix(color*vec3(.87,.96,1.),ocean,water);
 vec3 normal=vec3(p,z),light=normalize(vec3(-.38,.48,1.));
 float daylight=.36+.74*max(0.,dot(normal,light));
 color*=daylight*(.45+.55*sqrt(z));
 // The geographic silhouette needs only pixel coverage, not a blue rim.
 float coverage=smoothstep(0.,1.25,radius*(1.-sqrt(rr)));
 gl_FragColor=vec4(color,coverage);
}`;
   const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
   const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
   const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
   const uniforms=Object.fromEntries(['viewport','centre','radius','longitude','latitude','earth'].map(n=>[n,gl.getUniformLocation(program,n)]));
   const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   image.onload=()=>{
    let source=image;const limit=gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if(image.naturalWidth>limit){source=document.createElement('canvas');source.width=limit;source.height=Math.round(image.naturalHeight*limit/image.naturalWidth);source.getContext('2d').drawImage(image,0,0,source.width,source.height)}
    gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,source);
    ready=gl.getError()===gl.NO_ERROR;canvas.dataset.renderer='webgl';onReady();
   };
   draw=f=>{
    if(!ready)return false;const dpr=Math.min(devicePixelRatio||1,2),w=Math.round(f.w*dpr),h=Math.round(f.h*dpr);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);
    gl.uniform2f(uniforms.viewport,f.w,f.h);gl.uniform2f(uniforms.centre,f.cx,f.cy);gl.uniform1f(uniforms.radius,f.scale);gl.uniform1f(uniforms.longitude,f.lon*Math.PI/180);gl.uniform1f(uniforms.latitude,f.lat*Math.PI/180);gl.uniform1i(uniforms.earth,0);gl.drawArrays(gl.TRIANGLES,0,6);return true;
   };
   canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;canvas.hidden=true});
   canvas.addEventListener('webglcontextrestored',()=>{ready=false;onReady()});
  }catch(error){console.warn('Relief globe unavailable; geographic outline retained.',error.message)}
 }
 // A separate canvas is required because a WebGL context cannot become 2D.
 // The low-resolution texture fallback is only used where WebGL is absent.
 if(!draw){
  const fallback=document.createElement('canvas');fallback.id=canvas.id;fallback.className=canvas.className;fallback.setAttribute('aria-hidden','true');canvas.replaceWith(fallback);canvas=fallback;
  const ctx=canvas.getContext('2d'),source=document.createElement('canvas'),texture=source.getContext('2d',{willReadFrequently:true});
  let pixels,sw=0,sh=0,lastFrame='';
  image.onload=()=>{sw=image.naturalWidth;sh=image.naturalHeight;source.width=sw;source.height=sh;texture.drawImage(image,0,0,sw,sh);pixels=texture.getImageData(0,0,sw,sh).data;ready=true;canvas.dataset.renderer='canvas';onReady()};
  draw=f=>{
   if(!ready)return false;
   const ratio=f.moving?Math.min(1,360/Math.min(f.w,f.h)):Math.min(devicePixelRatio||1,1.5,1500/Math.max(f.w,f.h));
   const w=Math.round(f.w*ratio),h=Math.round(f.h*ratio),key=[w,h,f.lon,f.lat,f.scale,f.cx,f.cy].join('/');
   if(key===lastFrame)return true;lastFrame=key;canvas.width=w;canvas.height=h;
   const out=ctx.createImageData(w,h),r=f.scale*ratio,cx=f.cx*ratio,cy=f.cy*ratio,sin=Math.sin(f.lat*Math.PI/180),cos=Math.cos(f.lat*Math.PI/180),base=f.lon/360+.5,invPI=1/Math.PI,lightLength=Math.hypot(-.38,.48,1);
   for(let y=Math.max(0,Math.floor(cy-r));y<Math.min(h,cy+r);y++){
    const ny=(cy-y)/r,ny2=ny*ny;
    for(let x=Math.max(0,Math.floor(cx-r));x<Math.min(w,cx+r);x++){
     const nx=(x-cx)/r,rr=nx*nx+ny2;if(rr>=1)continue;
     const z=Math.sqrt(1-rr),u=base+Math.atan2(nx,z*cos-ny*sin)*invPI*.5,v=.5-Math.asin(Math.max(-1,Math.min(1,ny*cos+z*sin)))*invPI;
     const sx=Math.floor((u-Math.floor(u))*sw),sy=Math.max(0,Math.min(sh-1,Math.floor(v*sh))),i=(sy*sw+sx)*4,j=(y*w+x)*4;
     const red=pixels[i]/255,green=pixels[i+1]/255,blue=pixels[i+2]/255,t=Math.max(0,Math.min(1,(blue-Math.max(red,green)-.025)/.08)),water=t*t*(3-2*t),land=1-water;
     const light=(.36+.74*Math.max(0,(-.38*nx+.48*ny+z)/lightLength))*(.45+.55*Math.sqrt(z)),edge=Math.max(0,Math.min(1,f.scale*(1-Math.sqrt(rr))/1.25));
     out.data[j]=(red*.87*land+(.025+.02*blue)*water)*light*255;
     out.data[j+1]=(green*.96*land+(.13+.09*blue)*water)*light*255;
     out.data[j+2]=(blue*land+(.235+.12*blue)*water)*light*255;out.data[j+3]=edge*edge*(3-2*edge)*255;
    }
   }ctx.putImageData(out,0,0);return true;
  };
 }
 image.onerror=()=>{canvas.hidden=true;onReady()};image.src=url;
 return{draw:f=>draw?draw(f):false,get canvas(){return canvas},get ready(){return ready}};
}
