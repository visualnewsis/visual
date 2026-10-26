// Refit only for resize or an intentional orbit, not every mechanical movement.
export function stabilizeStage(stage){
 const fit=stage.fit.bind(stage);let width=-1,height=-1,eye=null;
 stage.fit=()=>{const r=stage.renderer.domElement.getBoundingClientRect();if(r.width!==width||r.height!==height||!eye||!stage.eye.equals(eye)){
  const ok=fit();if(ok){width=r.width;height=r.height;eye=stage.eye.clone();}return ok;
 }return width>1&&height>1;};return stage;
}
