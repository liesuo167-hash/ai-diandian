/** Capture only the actual viewfinder; composition guides are not burned into the photo. */
export async function capturePhoto({source,viewport,filter='none',mirrored=false,zoom=1,renderRect=null}) {
 if(source instanceof HTMLImageElement&&!source.complete)await source.decode();
 const sw=source.videoWidth||source.naturalWidth,sh=source.videoHeight||source.naturalHeight;
 if(!sw||!sh)throw new Error('画面尚未就绪，请稍后重试。');
 const canvas=document.createElement('canvas');
 const ratio=viewport.width/viewport.height;
 canvas.width=Math.min(1080,sw);canvas.height=Math.round(canvas.width/ratio);
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('当前浏览器不支持照片生成。');
 const scale=Math.max(canvas.width/sw,canvas.height/sh)*zoom;
 const width=sw*scale,height=sh*scale;
 ctx.filter=filter;
 if(mirrored){ctx.translate(canvas.width,0);ctx.scale(-1,1);}
 if(renderRect)ctx.drawImage(source,renderRect.x*canvas.width,renderRect.y*canvas.height,renderRect.width*canvas.width,renderRect.height*canvas.height);
 else ctx.drawImage(source,(canvas.width-width)/2,(canvas.height-height)/2,width,height);
 // A data URL avoids object-URL lifetime issues for downloadable Safari gallery images.
 return canvas.toDataURL('image/jpeg',0.9);
}
