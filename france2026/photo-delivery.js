/* Keep the inline preview painted beneath a separate, decoded detail layer.
   Never replace the only visible image while the browser decodes its successor. */
window.photoDelivery=(()=>{
 const cache=new Map(),previews=new Map(),observed=new WeakSet();
 function layout(img){
  if(!img)return;
  const surface=img.parentElement,asset=photoAssets[img.dataset.photoFile];
  if(!surface?.classList.contains('photo-surface')||!asset)return;
  const style=getComputedStyle(surface),pt=parseFloat(style.paddingTop)||0,pb=parseFloat(style.paddingBottom)||0;
  const w=surface.clientWidth,h=Math.max(0,surface.clientHeight-pt-pb);
  if(!w||!h)return;
  const configuredCrop=parseFloat(style.getPropertyValue('--photo-crop-bottom'));
  const crop=Number.isFinite(configuredCrop)?Math.max(0,Math.min(.5,configuredCrop)):asset.cropBottom;
  const configuredRight=parseFloat(style.getPropertyValue('--photo-crop-right'));
  const cropRight=Number.isFinite(configuredRight)?Math.max(0,Math.min(.5,configuredRight)):0;
  const visibleWidth=asset.width*(1-cropRight),visibleHeight=asset.height*(1-crop);
  const fitWidth=parseFloat(style.getPropertyValue('--photo-fit-width'))===1;
  const scale=fitWidth?w/visibleWidth:(style.objectFit==='contain'?Math.min:Math.max)(w/visibleWidth,h/visibleHeight);
  const px=parseFloat(style.getPropertyValue('--photo-position-x')),py=parseFloat(style.getPropertyValue('--photo-position-y'));
  const x=Number.isFinite(px)?Math.max(0,Math.min(1,px)):.5,y=Number.isFinite(py)?Math.max(0,Math.min(1,py)):.5;
  const box={width:asset.width*scale+'px',height:asset.height*scale+'px',left:(w-visibleWidth*scale)*x+'px',top:pt+(h-visibleHeight*scale)*y+'px',clipPath:`inset(0 ${cropRight?cropRight*100+'%':'0'} ${crop*100}% 0)`};
  Object.assign(img.style,box);if(img._photoDetail)Object.assign(img._photoDetail.style,box);
 }
 const observer=new ResizeObserver(entries=>entries.forEach(e=>layout(e.target.querySelector('img'))));
 function watch(img){if(!observed.has(img)){observer.observe(img.parentElement);observed.add(img)}layout(img)}
 function variant(file){const a=photoAssets[file];if(!a)return 'assets/'+file;const density=Math.min(typeof devicePixelRatio==='number'?devicePixelRatio:1,2),target=Math.min(1280,Math.max(640,innerWidth*density,innerWidth<=800?800:0));return (a.variants.find(v=>v.width>=target)||a.variants.at(-1)).src}
 function preload(file,priority='low'){
  if(!file)return Promise.resolve(null);
  // Retain decoded previews too, including photos not initially in the DOM.
  const preview=photoAssets[file]?.preview;
  if(preview&&!previews.has(file)){const im=new Image();im.decoding='sync';im.src=preview;im.decode().catch(()=>{});previews.set(file,im)}
  const url=variant(file),cached=cache.get(url);
  if(cached){if(priority==='high')cached.image.fetchPriority='high';return cached.promise}
  const im=new Image();im.decoding='async';im.fetchPriority=priority;
  const promise=new Promise(resolve=>{im.onload=async()=>{try{await im.decode()}catch{}resolve(url)};im.onerror=()=>{cache.delete(url);resolve(null)};im.src=url});
  cache.set(url,{promise,image:im});return promise;
 }
 function show(img,file,alt){
  if(!img||!file)return;
  const changed=img.dataset.photoFile!==file;
  if(!changed&&img.dataset.photoState==='ready'){if(alt!==undefined)img.alt=alt;watch(img);return Promise.resolve()}
  img.dataset.photoFile=file;if(alt!==undefined)img.alt=alt;
  if(changed||!img.getAttribute('src')){if(img._photoDetail)img._photoDetail.hidden=true;img.decoding='sync';img.src=photoAssets[file]?.preview||'assets/'+file;img.dataset.photoState='preview'}
  watch(img);
  const token={};img._photoRequest=token;
  return preload(file,'high').then(async url=>{if(!url||img._photoRequest!==token||img.dataset.photoFile!==file)return;
   let detail=img._photoDetail;
   if(!detail){detail=new Image();detail.className='photo-detail';detail.alt='';detail.setAttribute('aria-hidden','true');detail.decoding='async';detail.hidden=true;img.parentElement.append(detail);img._photoDetail=detail}
   detail.src=url;layout(img);
   try{await detail.decode()}catch{return}
   if(img._photoRequest!==token||img.dataset.photoFile!==file)return;
   detail.hidden=false;img.dataset.photoState='ready';
  });
 }
 function clear(img){img._photoRequest=null;if(img._photoDetail)img._photoDetail.hidden=true;delete img.dataset.photoFile;delete img.dataset.photoState;img.removeAttribute('src');img.alt=''}
 function markup(file,alt,id){return `<div class="photo-surface"><img id="${id}" data-photo-file="${file}" data-photo-state="preview" src="${photoAssets[file]?.preview||'assets/'+file}" alt="${alt}" decoding="sync"></div>`}
 function warmScene(index){
  const img=sceneNodes[index]?.querySelector('.photo-surface>img');if(img)show(img,img.dataset.photoFile);
  // Prepare every record of the next two photo chapters before arrival.
  let chapters=0;
  for(let n=index;n<sceneNodes.length&&chapters<3;n++){
   const next=sceneNodes[n].querySelector('.photo-surface>img');if(!next)continue;
   if(n!==index)show(next,next.dataset.photoFile);chapters++;
   const chapter=report[n],keys=chapter.gallery||chapter.readingFrames?.map(f=>f.photo||chapter.photo)||(chapter.interaction?lyonFrames.map(f=>f.photo):[chapter.photo]);
   keys.forEach(key=>{if(photos[key])preload(photos[key].file)});
  }
 }
 return {show,clear,preload,markup,layout,warmScene};
})();
