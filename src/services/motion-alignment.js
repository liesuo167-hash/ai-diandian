// Orientation gives relative tilt, not absolute translation or computer vision.
export function tiltPoint(origin,baseline,current,angle=0){
 const delta=v=>((v+180)%360+360)%360-180;
 const x=delta(current.gamma-baseline.gamma)*4,y=delta(current.beta-baseline.beta)*4,r=angle*Math.PI/180;
 return {x:origin.x+x*Math.cos(r)+y*Math.sin(r),y:origin.y+y*Math.cos(r)-x*Math.sin(r)};
}
export function createMotionAlignment({onMove,onUnavailable,environment=globalThis}){
 let active=false,baseline=null,frame=0,latest=null,received=false,timer;
 function reset(){baseline=null;latest=null;}
 function listen(e){
  if(!Number.isFinite(e.beta)||!Number.isFinite(e.gamma))return;
  received=true;clearTimeout(timer);latest={beta:e.beta,gamma:e.gamma};
  if(!baseline)baseline={...latest};
  if(!frame)frame=environment.requestAnimationFrame(()=>{frame=0;if(active&&latest)onMove(baseline,latest,environment.screen?.orientation?.angle??environment.orientation??0);});
 }
 async function start(){
  const Event=environment.DeviceOrientationEvent;
  if(!environment.isSecureContext||!Event){onUnavailable('移动对齐需要支持运动传感器的手机，并通过 HTTPS 打开。');return false;}
  try{
   if(typeof Event.requestPermission==='function'&&await Event.requestPermission()!=='granted'){onUnavailable('未授权运动传感器，请允许后重新点击 AI 点点。');return false;}
   if(active)return true;
   active=true;received=false;reset();environment.addEventListener('deviceorientation',listen);
   timer=setTimeout(()=>{if(!received)onUnavailable('没有收到手机运动数据，请检查运动与方向权限。');},4500);
   return true;
  }catch{onUnavailable('运动传感器授权失败，请在手机浏览器中允许运动与方向访问。');return false;}
 }
 function stop(){active=false;clearTimeout(timer);environment.removeEventListener('deviceorientation',listen);if(frame)environment.cancelAnimationFrame(frame);frame=0;reset();}
 return {start,stop,reset};
}
