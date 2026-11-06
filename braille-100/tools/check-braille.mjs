import {readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import * as binding from '../vendor/braillify/index_bg.js';
const storyRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const binary=await readFile(path.join(storyRoot,'vendor/braillify/index_bg.wasm'));
const {instance}=await WebAssembly.instantiate(binary,{'./index_bg.js':binding});
binding.__wbg_set_wasm(instance.exports);
const sampleRoot=path.resolve(process.argv[2]||path.join(storyRoot,'editorial/braille-tests'));
const failures=[];
let checked=0;
const normalize=text=>text.replace(/[\s\u2800]+/g,' ').trim();
for(const filename of await readdir(sampleRoot)) {
  if(!filename.endsWith('.json'))continue;
  const cases=JSON.parse(await readFile(path.join(sampleRoot,filename),'utf8'));
  for(const sample of cases) {
    if(!sample.unicode)continue;
    checked++;
    try {assert.equal(normalize(binding.translateToUnicode(sample.input)),normalize(sample.unicode));}
    catch {failures.push({file:filename,input:sample.input,expected:sample.unicode,actual:binding.translateToUnicode(sample.input)});}
  }
}
const examples=['그런 점이 좋았다','그 점이 좋았다','고마워요.','안녕하세요.','당신의 진심을 보다 많은 이에게 전해보세요'];
const result={engine:'Braillify 2.2.0',checked,failed:failures.length,failures,examples:examples.map(text=>({text,braille:binding.translateToUnicode(text)})),scope:'Upstream rule examples; not an independent professional review of arbitrary reader input.'};
await writeFile(path.join(storyRoot,'editorial/braille-verification.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exitCode=1;
