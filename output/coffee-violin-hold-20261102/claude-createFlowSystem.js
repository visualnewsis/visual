// Schematic saturation front + single outlet stream. NOT a CFD / porous-media simulation.
// Replaces the 12 zigzag pore trails and upper wetting ribbons entirely.
// Uses existing helpers: part, clamp, lerp, finite. Optional: coffeeMaterialTexture('grounds').
const FLOW_OUTLET_TOP = -0.423;
const FLOW_OUTLET_Z = -0.045;
const BED_W = 1.84, BED_H = 0.72, BED_CY = 0.235, BED_Z = 0.19;
 
function createFlowSystem(parent, seed, grains) {
  const flow = part(parent, 'saturation front and outlet stream');
 
  // ---- Continuous bed face: one quad, all variation in the shader. -------------
  const groundMap = typeof coffeeMaterialTexture === 'function'
    ? coffeeMaterialTexture('grounds') : null;
  if (groundMap) { groundMap.wrapS = groundMap.wrapT = T.RepeatWrapping; groundMap.needsUpdate = true; }
 
  const uniforms = {
    uFront:   { value: 0 },                  // 0 = dry, 1 = front reached bed bottom
    uChannel: { value: 0 },                  // 1 = preferential channel lobe near x=.48
    uSeed:    { value: (finite(seed, 0) % 97) * 0.731 },
    uHasMap:  { value: groundMap ? 1 : 0 },
    uMap:     { value: groundMap },
    uDry:     { value: new T.Color(0x6e4a32) } // hex is sRGB; Color converts to working (linear)
  };
 
  const bedMaterial = new T.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uFront, uChannel, uSeed, uHasMap;
      uniform sampler2D uMap;
      uniform vec3 uDry;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }
      void main(){
        float d  = 1.0 - vUv.y;                     // depth from bed top (0) to bottom (1)
        float xw = (vUv.x - 0.5) * ${BED_W.toFixed(3)};
        // Soft, slightly irregular front: low-frequency +-0.04, faded in as wetting starts.
        float n = (noise(vec2(vUv.x * 6.0 + uSeed, uSeed * 0.37)) - 0.5) * 0.06
                + (noise(vec2(vUv.x * 17.0 + uSeed * 1.3, 4.1)) - 0.5) * 0.02;
        float lobe = uChannel * 0.18 * exp(-pow((xw - 0.48) / 0.16, 2.0));
        float f = uFront * 1.15 - 0.075 + n * smoothstep(0.0, 0.15, uFront) + lobe * uFront;
        float wet = 1.0 - smoothstep(f - 0.03, f + 0.03, d);
 
        vec3 dry = uHasMap > 0.5
          ? texture2D(uMap, vUv * vec2(3.84, 1.5)).rgb
          : uDry * (0.94 + 0.06 * hash(floor(vUv * vec2(460.0, 180.0))));
        vec3 wetCol = dry * vec3(0.86, 0.82, 0.79);   // ~15-18% darker, slightly warmer
        float band = exp(-pow((d - f) / 0.022, 2.0)) * (1.0 - step(0.999, uFront)) * 0.03;
        vec3 col = mix(dry, wetCol, wet) * (1.0 - band * wet);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
 
  const bed = new T.Mesh(new T.PlaneGeometry(BED_W, BED_H, 1, 1), bedMaterial);
  bed.name = 'continuous coffee bed face (schematic wetting)';
  bed.position.set(0, BED_CY, BED_Z);
  bed.castShadow = false;
  bed.receiveShadow = false;
  flow.add(bed);
 
  // ---- Single outlet stream: unit cylinder hanging from y=0 to y=-1. ------------
  const streamGeo = new T.CylinderGeometry(1, 1, 1, 14, 1, false);
  streamGeo.translate(0, -0.5, 0);
  const streamMat = new T.MeshStandardMaterial({ color: 0x5c3119, roughness: 0.28, metalness: 0 });
  const stream = new T.Mesh(streamGeo, streamMat);
  stream.name = 'single espresso outlet stream';
  stream.position.set(0, FLOW_OUTLET_TOP, FLOW_OUTLET_Z);
  stream.castShadow = false;
  stream.visible = false;
  flow.add(stream);
 
  const tip = new T.Mesh(new T.SphereGeometry(1, 14, 10), streamMat);
  tip.name = 'leading drop while stream grows';
  tip.castShadow = false;
  tip.visible = false;
  flow.add(tip);
 
  function update(grind, pressure, channel, time, ratio, surfaceY = -1.225) {
    const g  = clamp(finite(grind, 50), 0, 100);
    const p  = Math.max(0, finite(pressure, 9));
    const t  = Math.max(0, finite(time, 0));
    const r  = Math.max(0, finite(ratio, 0));
    const sY = finite(surfaceY, -1.225);
 
    const delay = 0.75 + (g / 100) * 0.25;          // first drop
    uniforms.uFront.value   = p > 0 ? clamp(t / delay, 0, 1) : 0; // uniform, linear advance
    uniforms.uChannel.value = channel ? 1 : 0;
 
    const length = FLOW_OUTLET_TOP - sY;            // outlet down to current cup surface
    const ext = clamp((t - delay) / 0.5, 0, 1);     // grows over 0.5 s
    const running = p > 0 && r > 0.005 && t > delay && t < 16 && length > 0.01;
 
    stream.visible = running;
    tip.visible = running && ext < 1;
    if (running) {
      const radius = lerp(0.008, 0.013, clamp(r / 1.7, 0, 1));
      const reach = Math.max(1e-4, length * ext);
      stream.scale.set(radius, reach, radius);
      tip.scale.setScalar(radius * 1.35);
      tip.position.set(0, FLOW_OUTLET_TOP - reach, FLOW_OUTLET_Z);
    }
 
    flow.userData.firstDropDelay = delay;
    flow.userData.cupFillStart = delay + 0.5;      // caller starts cup fill from here
    flow.userData.wettingFront = uniforms.uFront.value;
    flow.userData.referenceFlowRatio = r;
    flow.userData.visualModel = 'schematic';
  }
 
  return { group: flow, update };
}
 