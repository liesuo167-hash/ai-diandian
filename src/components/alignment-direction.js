/** Direction uses design coordinates; the unmodified Figma SVGs supply the artwork. */
export function alignmentGeometry(from,to,fromRadius,toRadius){
 const dx=to.x-from.x,dy=to.y-from.y,distance=Math.hypot(dx,dy);
 const ux=distance?dx/distance:0,uy=distance?dy/distance:-1;
 return {tipX:to.x-ux*toRadius,tipY:to.y-uy*toRadius,
  length:Math.max(0,distance-fromRadius-toRadius),angle:Math.atan2(ux,-uy)*180/Math.PI};
}
export function directionStyle(g,lineHeight){
 return '--tip-x:'+g.tipX+';--tip-y:'+g.tipY+';--direction-angle:'+g.angle+'deg;--line-length:'+g.length;
}
/** Update during pointer movement without replacing the captured dot DOM. */
export function updateAlignmentDirection(ui,app,point,design){
 const layer=ui.querySelector('[data-align-direction]');if(!layer)return;
 const rect=app.getBoundingClientRect(),scale=rect.width/design.width,r=design.slots;
 const from={x:point.x/scale,y:point.y/scale},to={x:r.targetDot.x+r.targetDot.width/2,y:r.targetDot.y+r.targetDot.height/2};
 layer.setAttribute('style',directionStyle(alignmentGeometry(from,to,r.movingDot.width/2,r.targetRing.width/2),r.connector.height));
}
