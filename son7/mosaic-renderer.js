/* Shared by the Site and offline canvas QA. No invented player drawing or generated portrait. */
(function (global) {
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  function geometry(width, height, data, zoom = 1, anchor = null) {
    const fit = Math.min(width / data.width, height / data.height);
    const scale = fit * zoom;
    const center = anchor || {x: data.width / 2, y: data.height / 2};
    let x = width / 2 - center.x * scale;
    let y = height / 2 - center.y * scale;
    const w = data.width * scale, h = data.height * scale;
    x = w <= width ? (width - w) / 2 : clamp(x, width - w, 0);
    y = h <= height ? (height - h) / 2 : clamp(y, height - h, 0);
    return {x,y,w,h,scale,center};
  }
  function paint(context, width, height, image, data, zoom = 1, anchor = null, selected = null, atlasImage = null, matchedCell = null, portraitImage = null) {
    const g = geometry(width, height, data, zoom, anchor);
    context.clearRect(0,0,width,height);
    context.fillStyle = '#0c1620'; context.fillRect(0,0,width,height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image,g.x,g.y,g.w,g.h);
    // The same source photograph supplies only low-zoom contour detail.
    // Fade it out before individual goal photographs become readable.
    if (portraitImage && zoom < 2) {
      context.globalAlpha = .2 * clamp(2 - zoom,0,1);
      context.drawImage(portraitImage,g.x,g.y,g.w,g.h);
      context.globalAlpha = 1;
    }
    const cssTileSize=data.tile*g.scale/Math.min(global.devicePixelRatio||1,1.6);
    const revealTone=matchedCell?clamp((cssTileSize-48)/96,0,1):1;
    if (atlasImage && data.atlas && zoom>2 && revealTone>0) {
      // In the record reveal, the surrounding photos and arriving photo take on
      // portrait colors together. Interactive zoom retains the full photo atlas.
      context.globalAlpha=clamp((zoom-2)/6,0,1)*revealTone;
      const firstCol=clamp(Math.floor(-g.x/g.scale/data.tile),0,data.cols-1);
      const lastCol=clamp(Math.ceil((width-g.x)/g.scale/data.tile),0,data.cols-1);
      const firstRow=clamp(Math.floor(-g.y/g.scale/data.tile),0,data.rows-1);
      const lastRow=clamp(Math.ceil((height-g.y)/g.scale/data.tile),0,data.rows-1);
      for(let row=firstRow;row<=lastRow;row++)for(let col=firstCol;col<=lastCol;col++){
        if(matchedCell && row===matchedCell.row && col===matchedCell.col)continue;
        const slot=data.cells[row*data.cols+col]-1,t=data.atlas.tile;
        const sx=(slot%data.atlas.cols)*t,sy=Math.floor(slot/data.atlas.cols)*t;
        context.drawImage(atlasImage,sx,sy,t,t,g.x+col*data.tile*g.scale,g.y+row*data.tile*g.scale,data.tile*g.scale,data.tile*g.scale);
      }
      context.globalAlpha=1;
    }
    if (selected) {
      const x=g.x+selected.col*data.tile*g.scale, y=g.y+selected.row*data.tile*g.scale;
      context.strokeStyle='#ffe9b2'; context.lineWidth=2;
      context.strokeRect(x+1,y+1,data.tile*g.scale-2,data.tile*g.scale-2);
    }
    return g;
  }
  function hit(x,y,g,data) {
    if (x<g.x||y<g.y||x>=g.x+g.w||y>=g.y+g.h) return null;
    const col=clamp(Math.floor((x-g.x)/g.scale/data.tile),0,data.cols-1);
    const row=clamp(Math.floor((y-g.y)/g.scale/data.tile),0,data.rows-1);
    return {col,row,n:data.cells[row*data.cols+col]};
  }
  function focus(data, zoom) {
    const weight=clamp(Math.log(zoom)/Math.log(data.cols),0,1);
    const origin={x:(data.origin.col+.5)*data.tile,y:(data.origin.row+.5)*data.tile};
    return {x:data.width/2+(origin.x-data.width/2)*weight,y:data.height/2+(origin.y-data.height/2)*weight};
  }
  global.SonMosaicRenderer={geometry,paint,hit,focus,clamp};
})(globalThis);
