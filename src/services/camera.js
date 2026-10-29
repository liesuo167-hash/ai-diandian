import { TIMING } from '../data/recommendations.js';
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
   const request=environment.navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1080},height:{ideal:1920}},audio:false});
   // Permission prompts can resolve after timeout/cancel. Late streams must be stopped.
   request.then(result=>{if(id!==requestId)result.getTracks().forEach(t=>t.stop());},()=>{});
   const result=await Promise.race([request,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('CameraTimeout')),TIMING.cameraTimeout);})]);
   if(id!==requestId){result.getTracks().forEach(t=>t.stop());return false;}
   stream=result;video.srcObject=stream;await video.play();
   if(id!==requestId){result.getTracks().forEach(t=>t.stop());return false;}
   stream.getVideoTracks().forEach(track=>track.addEventListener('ended',()=>{if(id===requestId)stop('相机已断开，已返回预置画面。');}));
   emit({source:'camera',pending:false,mirrored:facing==='user',message:'相机已启用。画面仅在本地使用，不会上传。'});return true;
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
