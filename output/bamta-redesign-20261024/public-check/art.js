import * as T from './vendor/three.module.min.js';

export const art={};
const sources={leaves:'foliage.webp',materials:'materials.webp',screen:'newsroom-screen.webp'};

// Load and share a small set of generated textures instead of duplicating large assets.
export async function prepareArt(){
  const loader=new T.TextureLoader();let complete=0;
  await Promise.all(Object.entries(sources).map(async([name,file])=>{
    const texture=await loader.loadAsync(new URL(`./assets/art-v2/${file}`,import.meta.url).href);
    texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
    art[name]=texture;complete++;
    const button=document.querySelector('#start');if(button)button.textContent=`시각 자산 불러오는 중 · ${complete}/${Object.keys(sources).length}`;
  }));
  // The atlas is sampled into four independent, repeatable albedo surfaces.
  for(const [i,name]of ['stone','steel','wood','plastic'].entries()){
    const image=art.materials.image,w=image.width/2,h=image.height/2;
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
    canvas.getContext('2d').drawImage(image,(i%2)*w,Math.floor(i/2)*h,w,h,0,0,512,512);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=4;
    art[name]=texture;
  }
  art.leafTextures=[];
  for(let i=0;i<4;i++){
    const source=art.leaves.image,w=source.width/2,h=source.height/2,canvas=document.createElement('canvas');canvas.width=384;canvas.height=384;
    canvas.getContext('2d').drawImage(source,(i%2)*w,Math.floor(i/2)*h,w,h,0,0,384,384);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;art.leafTextures.push(texture);
  }
  return art;
}
