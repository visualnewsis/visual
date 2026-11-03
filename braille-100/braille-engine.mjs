import * as binding from './vendor/braillify/index_bg.js';

let ready;
export function loadBrailleEngine() {
  if (!ready) ready = (async () => {
    const response = await fetch(new URL('./vendor/braillify/index_bg.wasm', import.meta.url));
    if (!response.ok) throw new Error('점역 자료를 불러오지 못했습니다.');
    const {instance} = await WebAssembly.instantiate(await response.arrayBuffer(), {'./index_bg.js': binding});
    binding.__wbg_set_wasm(instance.exports);
    return binding.translateToUnicode;
  })().catch(error => { ready = undefined; throw error; });
  return ready;
}
