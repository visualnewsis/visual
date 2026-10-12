/* One node per year. Compression is a narrative transition, not an elapsed-time scale. */
(function(global){
  function layout(width,amount,mobile,compact=false){
    width=Math.max(280,width);
    const fold=Math.max(0,Math.min(1,amount)), eased=fold*fold*(3-2*fold);
    const panelWidth=mobile?Math.min(92,width*.28):Math.min(210,width*.24);
    const gap=mobile?28:56, travel=(width-panelWidth*2-gap)/2;
    const left={x:travel*eased,y:mobile?0:20};
    const right={x:width-panelWidth-travel*eased,y:mobile?0:20};
    const offset=mobile?(compact?48:56):140;
    const start={x:left.x+panelWidth+10,y:left.y+offset};
    const end={x:right.x-10,y:right.y+offset};
    const amplitude=fold*(mobile?12:34), nodes=[];
    for(let i=0;i<=48;i++){
      const t=i/48;
      nodes.push({year:1978+i,x:start.x+(end.x-start.x)*t,
        y:start.y+(end.y-start.y)*t+(i%2?1:-1)*amplitude*Math.sin(Math.PI*t)});
    }
    return {fold,eased,panelWidth,left,right,height:mobile?(compact?102:114):300,nodes,
      ribbonOpacity:1-Math.max(0,Math.min(1,(fold-.82)/.18)),
      labelOpacity:1-Math.max(0,Math.min(1,(fold-.15)/.25)),
      equalOpacity:Math.max(0,Math.min(1,(fold-.86)/.14))};
  }
  global.SonTimeFold={layout};
})(globalThis);
