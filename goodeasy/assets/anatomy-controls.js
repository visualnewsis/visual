// Camera distance multiplier: lower means closer. Shared by every mechanism viewer.
export function zoomDistance(current,multiplier){if(!Number.isFinite(current)||current<=0)current=1;if(!Number.isFinite(multiplier)||multiplier<=0)return current;return Math.max(.2,Math.min(6,current*multiplier));}
export function wheelZoom(current,delta){return zoomDistance(current,Math.exp(Math.max(-400,Math.min(400,Number(delta)||0))*.002));}
export function pinchZoom(current,previousDistance,nextDistance){return previousDistance>0&&nextDistance>0?zoomDistance(current,previousDistance/nextDistance):current;}
export const zoomPercent=distance=>Math.round(100/distance);
