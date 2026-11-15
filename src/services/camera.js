import { TIMING } from '../data/recommendations.js';
/** Device labels are hints, not calibrated focal lengths. Unknown/numbered
 * Android cameras are deliberately left to the browser instead of guessed. */
export function preferredRearCamera(devices){
 const candidates=devices.filter(d=>d.kind==='videoinput'&&d.deviceId).map(d=>{
  const label=d.label||'';
  if(/ultra|超广|超廣|tele|长焦|長焦|macro|微距|front|前置|前置|dual|triple|双摄|三摄/i.test(label))return {device:d,score:0};
  const rear=/back|rear|后置|後置|背面/i.test(label);
  const main=/main|primary|主摄|主攝/i.test(label);
  const wide=/wide|广角|廣角/i.test(label);
  const generic=/^(back|rear) camera$|^(后置|後置|背面)(相机|相機|摄像头|攝像頭)$|^camera back$/i.test(label.trim());
  return {device:d,score:main?4:rear&&wide?3:generic?2:0};
 }).filter(c=>c.score>0).sort((a,b)=>b.score-a.score);
 if(!candidates.length||candidates[1]?.score===candidates[0].score)return null;
 return candidates[0].device;
}
/** Browser API boundary. Injectable media APIs allow denial/timeout tests without a device. */
export function createCameraController({video,onChange,environment=globalThis}) {
 let stream=null,requestId=0,facing='environment';
 let status={source:'demo',pending:false,mirrored:false,message:'预置画面随时可用。真实相机需要 HTTPS 或本机 localhost。'};
 const emit=patch=>{status={...status,...patch};onChange({...status});};
 const stopTracks=()=>{if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;};
 function stop(message='已切换到预置画面。') {
  requestId++;stopTracks();emit({source:'demo',pending:false,mirrored:false,message});
 }
 async function start(nextFacing=facing) {
  const id=++requestId;facing=nextFacing;stopTracks();
  if(!environment.isSecureContext||!environment.navigator?.mediaDevices?.getUserMedia){
   emit({source:'demo',pending:false,mirrored:false,message:'当前浏览器或连接不支持相机。已保留预置画面，可继续完整演示；真实相机请使用 HTTPS 或本机 localhost。'});return false;
  }
  emit({source:'demo',pending:true,message:'正在请求相机授权…也可以关闭弹层继续使用预置画面。'});
  let timeout;
  try {
   const base={facingMode:{ideal:facing},width:{ideal:1080},height:{ideal:1920}};
   const acquire=async constraints=>{
   let expired=false;
   const request=environment.navigator.mediaDevices.getUserMedia({video:constraints,audio:false});
   // Permission prompts can resolve after timeout/cancel. Late streams must be stopped.
   request.then(result=>{if(expired||id!==requestId)result.getTracks().forEach(t=>t.stop());},()=>{});
   try{return await Promise.race([request,new Promise((_,reject)=>{timeout=setTimeout(()=>{expired=true;reject(new Error('CameraTimeout'));},TIMING.cameraTimeout);})]);}finally{clearTimeout(timeout);}
   };
   let result=await acquire(base);
   if(id!==requestId){result.getTracks().forEach(t=>t.stop());return false;}
   stream=result;
   if(facing==='environment'&&environment.navigator.mediaDevices.enumerateDevices){
    let preferred;
    let enumerationTimeout;
    try{preferred=preferredRearCamera(await Promise.race([environment.navigator.mediaDevices.enumerateDevices(),new Promise(resolve=>{enumerationTimeout=setTimeout(()=>resolve([]),1500);})]));}catch{}finally{clearTimeout(enumerationTimeout);}
    if(id!==requestId)return false;
    const active=stream.getVideoTracks()[0]?.getSettings?.().deviceId;
    if(preferred&&preferred.deviceId!==active){
     // iOS may require releasing the previous camera before selecting a lens.
     stopTracks();
     try{result=await acquire({deviceId:{exact:preferred.deviceId},width:base.width,height:base.height});}
     catch(error){if(id!==requestId)return false;result=await acquire(base);}
     if(id!==requestId){result.getTracks().forEach(t=>t.stop());return false;}
     stream=result;
    }
   }
   const track=stream.getVideoTracks()[0],range=track?.getCapabilities?.().zoom;
   // Request 1× only where the device advertises it; unsupported controls must
   // never prevent camera startup. Portrait output and optical zoom are separate.
   if(range&&range.min<=1&&range.max>=1&&track.applyConstraints){
    try{await track.applyConstraints({advanced:[{zoom:1}]});}catch{}
   }
   if(id!==requestId){result.getTracks().forEach(t=>t.stop());return false;}
   video.srcObject=stream;await video.play();
   if(id!==requestId){result.getTracks().forEach(t=>t.stop());return false;}
   stream.getVideoTracks().forEach(track=>track.addEventListener('ended',()=>{if(id===requestId)stop('相机已断开，已返回预置画面。');}));
   emit({source:'camera',pending:false,mirrored:facing==='user',message:'相机已启用。优先使用可识别的后置主摄；实际镜头及缩放能力由浏览器提供。画面仅在本地使用。'});return true;
  }catch(error){
   if(id!==requestId)return false;
   requestId++;stopTracks();
   const reasons={NotAllowedError:'相机授权被拒绝',NotFoundError:'没有找到可用相机',NotReadableError:'相机正被其他应用占用',SecurityError:'当前连接不允许使用相机'};
   const reason=error.message==='CameraTimeout'?'等待相机授权超时':(reasons[error.name]||'相机暂时无法使用');
   emit({source:'demo',pending:false,mirrored:false,message:reason+'。已返回预置画面，你仍可继续完整演示。'});return false;
  }finally{clearTimeout(timeout);}
 }
 return {start,stop,flip:()=>start(facing==='environment'?'user':'environment'),getStatus:()=>({...status})};
}
