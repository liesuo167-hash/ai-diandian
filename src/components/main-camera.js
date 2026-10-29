import { CAMERA_DESIGN, cameraDesignForStage, designStyle, relativeRect } from '../design/camera-layout.js';
import { button } from './shared.js';
import { renderAssistant } from './assistant.js';


const image=(file)=>'<img src="./assets/icons/'+file+'.svg" alt="" />';
const box=(rect,content,cls='',name='',extra='')=>'<span class="design-box '+cls+'" style="'+designStyle(rect)+'" '+(name?'data-design="'+name+'"':'')+' '+extra+'>'+content+'</span>';
const text=(rect,value,cls='',name='')=>box(rect,value,'design-label '+cls,name);
function hit(rect,action,label,content,cls='',extra='') {
 const cx=rect.x+rect.width/2,cy=rect.y+rect.height/2;
 return button(action,label,content,'design-hit '+cls,'style="--cx:'+cx+';--cy:'+cy+';--w:'+rect.width+';--h:'+rect.height+'" '+extra);
}
const art=(rect,file,name)=>box({x:-rect.width/2,y:-rect.height/2,width:rect.width,height:rect.height},image(file),'design-art',name);
export function renderDesignHeader(s,design=CAMERA_DESIGN) {
 const slots=design.slots;
 return '<header class="design-header">'+hit(slots.close,'exit','离开拍摄',art(slots.close,'19-133','close'),'design-close',s.live?'disabled':'')+'</header>';
}
export function renderDesignTools(s,design=CAMERA_DESIGN) {
 const slots=design.slots;
 const locked=['scanning','aligning','generating'].includes(s.stage)||s.live||s.countdown!==null;
 const disabled=locked?'disabled':'';
 const items=[
  ['flip','切换前后镜头','19-136'],
  ['flash','闪光灯','19-139'],
  ['filters','滤镜','19-121'],
  ['beauty','美颜','19-126']
 ];
 return '<nav class="design-tools" aria-label="拍摄工具">'+items.map(([name,label,file])=>hit(slots[name],name,label,art(name==='flash'&&s.flash?{...slots[name],width:12.682284355163574,height:21.27399253845215}:slots[name],name==='flash'&&s.flash?'19-141':file,name),'design-tool',disabled+(name==='flash'?' aria-pressed="'+!!s.flash+'"':''))).join('')+'</nav>';
}
function renderEntry(s,name,action,label,file,caption,extra,design=CAMERA_DESIGN) {
 const slots=design.slots;
 const rect=slots[name],labelRect=slots[name+'Label'];
 const union={x:Math.min(rect.x,labelRect.x),y:rect.y,width:Math.max(rect.x+rect.width,labelRect.x+labelRect.width)-Math.min(rect.x,labelRect.x),height:labelRect.y+labelRect.height-rect.y};
 return button(action,label,box(relativeRect(rect,union),image(file),'design-entry-art',name)+text(relativeRect(labelRect,union),caption,'design-entry-label',name+'Label'),'design-box design-entry','style="'+designStyle(union)+'" '+extra);
}
export function renderDesignModes(s,disabled='',design=CAMERA_DESIGN) {
 const slots=design.slots;
 return '<div class="design-modes" role="tablist" aria-label="拍摄模式">'+['photo','live'].map((mode,i)=>{
  const r=slots[i?'liveMode':'photoMode'];
  return hit(r,'mode',i?'直播':'拍摄','<span>'+ (i?'直播':'拍摄')+'</span>','design-mode '+(s.mode===mode?'active':''),'role="tab" aria-selected="'+(s.mode===mode)+'" data-value="'+mode+'" '+disabled);
 }).join('')+box({...slots.modeIndicator,x:slots.modeIndicator.x+(s.mode==='live'?slots.liveMode.x-slots.photoMode.x:0)},'','design-mode-indicator','modeIndicator')+'</div>';
}
function renderIdlePrompt(disabled='') {
 const slots=CAMERA_DESIGN.slots;
 const b=slots.bubble,e=slots.enable;
 return '<div class="design-prompt" aria-live="polite">'+box(b,image('19-107'),'design-bubble-art','bubble')+
 text(slots.message,'检测到构图缺失，是否开启AI辅助','design-message','message')+
 hit(e,'start-ai','开启 AI 辅助',art(e,'19-109','enable'),'design-enable',disabled)+
 text(slots.enableText,'开启','design-enable-label','enableText')+'</div>';
}
function renderScanning(s,design) {
 const slots=design.slots;
 return '<div class="design-scanning-prompt">'+
 box(slots.bubble,image('19-344'),'design-bubble-art','scanBubble')+
 text(slots.message,'场景扫描中...','scan-label','scanMessage')+
 box(slots.progress,s.progress+'%','design-label scan-label','scanProgress','role="progressbar" aria-label="扫描进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+s.progress+'"')+
 hit(slots.cancel,'cancel-ai','取消 AI 分析',art(slots.cancel,'19-345','scanCancel'),'design-scan-cancel')+'</div>';
}
export function renderScanOverlay() {
 const slots=cameraDesignForStage('scanning').slots;
 return box(slots.gradient,image('19-211'),'design-scan-gradient','scanGradient')+
 box(slots.points,image('19-248-animated'),'design-scan-points','scanPoints');
}
export function renderMainCamera(s,{hidePrompt=false}={}) {
 const design=cameraDesignForStage(s.stage),slots=design.slots;
 const busy=['scanning','aligning','generating'].includes(s.stage);
 const disabled=busy||s.live||s.countdown!==null?'disabled':'';
 const ai=renderEntry(s,'ai','ai-entry','AI 点点','19-98','AI点点',disabled+' aria-pressed="'+(s.stage!=='idle')+'"',design);
 const vlog=renderEntry(s,'vlog','vlog','mini Vlog','19-143','mini Vlog',disabled,design);
 const shutterLabel=s.countdown!==null?'取消倒计时':s.mode==='live'?(s.live?'结束模拟直播':'开始模拟直播'):'拍摄照片';
 const inner=relativeRect(slots.shutterCore,slots.shutter);
 const shutter=button('shutter',shutterLabel,box(inner,'','design-shutter-core'),'design-box design-shutter '+(s.mode==='live'?'live-shutter ':'')+(s.live?'is-live':''),'style="'+designStyle(slots.shutter)+'" '+(busy?'disabled':''));
 const prompt=s.stage==='scanning'?renderScanning(s,design):s.stage==='idle'?renderIdlePrompt(disabled):'<div class="design-assistant-dynamic" style="'+designStyle(slots.bubble)+'">'+renderAssistant(s)+'</div>';
 const status=s.live?'<div class="live-indicator"><i></i> 模拟直播中 <time id="live-time">00:00</time></div>':s.mode==='live'?'<div class="live-preview-label">直播预览 · 仅本地模拟，不会推流</div>':'';
 return '<section class="main-camera-design" data-design-stage="'+s.stage+'" aria-label="拍摄主界面">'+renderDesignHeader(s,design)+renderDesignTools(s,design)+
 (hidePrompt?'':prompt)+ai+shutter+vlog+renderDesignModes(s,disabled,design)+status+
 (s.countdown!==null?'<div class="countdown" role="status">'+s.countdown+'</div>':'')+'</section>';
}
