// Product lighting is scoped to the reel. Other episodes keep their own finish.
export function configureReelPresentation(stage,T){
 stage.renderer.toneMappingExposure=1.05;
 stage.scene.environmentIntensity=.8;
 const lights=stage.scene.children.filter(o=>o.isDirectionalLight);
 if(lights[0]){lights[0].color.setHex(0xfff4df);lights[0].intensity=2.2;lights[0].position.set(5.8,6.2,4.8);lights[0].shadow.radius=5;}
 if(lights[1]){lights[1].color.setHex(0xfaf7ef);lights[1].intensity=1.2;lights[1].position.set(-4.8,4.8,-5.4);}
 const fill=new T.DirectionalLight(0xcfe3ff,.7);fill.position.set(-3.8,3.6,6.8);stage.scene.add(fill);
 for(const o of stage.scene.children){if(o.isHemisphereLight)o.intensity=.65;if(o.isMesh&&o.material?.isShadowMaterial)o.material.opacity=.15;}
 stage.camera.fov=28;stage.camera.updateProjectionMatrix();
}
