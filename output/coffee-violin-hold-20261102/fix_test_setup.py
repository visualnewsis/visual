from pathlib import Path
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop');out=Path(__file__).parent
p=r/'goodeasy/espresso-final-material.test.mjs';s=p.read_text(encoding='utf-8');s=s.replace("import {buildCoffeeComparison,buildBrewRatio} from './assets/coffee-detail.js';",'''const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:100}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>context,style:{}})};
const {buildCoffeeComparison,buildBrewRatio}=await import('./assets/coffee-detail.js');''');p.write_text(s,encoding='utf-8')
(r/'output/coffee-violin-hold-20261102').mkdir(exist_ok=True,parents=True)
(r/'output/coffee-violin-hold-20261102/qa.html').write_text((out/'qa.html').read_text(encoding='utf-8'),encoding='utf-8')
