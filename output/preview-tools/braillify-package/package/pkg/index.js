/* @ts-self-types="./index.d.ts" */
import * as wasm from "./index_bg.wasm";
import { __wbg_set_wasm } from "./index_bg.js";

__wbg_set_wasm(wasm);

export {
    encode, translateToBrailleFont, translateToUnicode
} from "./index_bg.js";
