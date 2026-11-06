const sharp=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const path=require('node:path');
const base='C:/Users/user/.codex/generated_images/01a17b61-65da-7423-99d8-db067c6904e7';
const destination=path.resolve(__dirname,'../dmz/images/web');
(async()=>{
 const canopy=path.join(base,'exec-bf4baab0-9fbe-4167-bb8b-95967688b312.png'),ground=path.join(base,'exec-102b6a48-28d6-49cd-bbd2-9fffb8b6dba8.png');
 const meta=await sharp(canopy).metadata(),cw=Math.floor(meta.width/2),ch=Math.floor(meta.height/2),images=[];
 for(let y=0;y<2;y++)for(let x=0;x<2;x++)images.push({input:await sharp(canopy).extract({left:x*cw,top:y*ch,width:cw,height:ch}).resize(448,448).png().toBuffer(),left:x*512+32,top:y*512+32});
 await sharp({create:{width:1024,height:1024,channels:4,background:'#00000000'}}).composite(images).webp({quality:90,alphaQuality:100}).toFile(path.join(destination,'forest-canopy-atlas-v2.webp'));
 await sharp(ground).resize(1024,1024).webp({quality:87}).toFile(path.join(destination,'ground-hillside-v2.webp'));
 console.log(JSON.stringify({canopy:await sharp(path.join(destination,'forest-canopy-atlas-v2.webp')).metadata(),ground:await sharp(path.join(destination,'ground-hillside-v2.webp')).metadata()}));
})();
