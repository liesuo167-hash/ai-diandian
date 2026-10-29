import { ASSIST_DESIGNS } from '../design/assist-layouts.js';
import { designStyle, relativeRect } from '../design/camera-layout.js';
import { CATEGORIES, getOptions } from '../data/recommendations.js';
import { button } from './shared.js';
import { renderMainCamera } from './main-camera.js';
import { alignmentGeometry, directionStyle } from './alignment-direction.js';

const assistImage=(rect,extra='')=>'<img src="'+rect.asset+'" alt="" '+extra+' />';
const assistStyle=r=>designStyle(r)+(r.fontWeight?';--text-weight:'+r.fontWeight:'')+(r.color?';--text-color:'+r.color:'')+(r.cornerRadius?';--radius:'+r.cornerRadius:'')+(r.paintOffset?';--paint-x:'+r.paintOffset.x+';--paint-y:'+r.paintOffset.y:'');
function assistLayer(rect,content,cls='',name='',extra=''){
 return '<span class="design-box assist-layer '+cls+'" style="'+assistStyle(rect)+'" data-figma-node="'+rect.id+'" '+(name?'data-design="'+name+'"':'')+' '+extra+'>'+content+'</span>';
}
function referenceSource(s,option,index,d){
 return index===4&&s.tab==='composition'&&s.category==='smart'?d.cards[index].asset:option.image;
}
const assistArtwork=(r,name)=>assistLayer(r,assistImage(r),'assist-art',name);
const assistLabel=(r,value=r.text,name='')=>assistLayer(r,value,'assist-text',name);
function assistControl(r,action,name,content,extra='',cls=''){
 const local={...r,x:-r.width/2,y:-r.height/2};
 return button(action,name,content||assistArtwork(local,r.id),'design-hit assist-control '+cls,
  'style="--cx:'+(r.x+r.width/2)+';--cy:'+(r.y+r.height/2)+';--w:'+r.width+';--h:'+r.height+'" '+extra);
}
function assistOriginalControl(r,action,name,extra='',cls=''){
 return assistControl(r,action,name,assistArtwork({...r,x:-r.width/2,y:-r.height/2},r.id),extra,cls);
}
function assistEntry(s,d,key,action,name,disabled){
 const r=d.slots[key],t=d.slots[key+'Label'];
 const outer={...r,width:Math.max(r.width,t.x+t.width-r.x),height:t.y+t.height-r.y};
 return button(action,name,assistArtwork(relativeRect(r,outer),r.id)+assistLabel(relativeRect(t,outer),t.text,t.id),
  'design-box assist-entry','style="'+assistStyle(outer)+'" '+disabled);
}
function assistShutter(s,d){
 const busy=s.stage==='generating',align=s.stage==='aligning',select=s.stage==='recommendations';
 const action=select?'apply':align?'simulate-align':'shutter';
 const name=select?'应用所选构图':align?'模拟对齐并生成构图':'拍摄照片';
 const r=d.slots.shutter,core=relativeRect(d.slots.shutterCore,r);
 return button(action,name,assistLayer(core,'','assist-shutter-core',d.slots.shutterCore.id),'design-box assist-shutter',
  'data-design="'+r.id+'" style="'+assistStyle(r)+'" '+(busy||(select&&!s.selected)?'disabled':''));
}
function assistPanel(s,d){
 const r=d.slots,disabled='';
 const options=getOptions(s.tab,s.category).slice(0,5);
 const tabs=['composition','pose'].map((tab,i)=>assistControl(r[i?'poseTab':'compositionTab'],'tab',i?'姿势':'构图',
  assistLabel({...r[i?'poseTab':'compositionTab'],x:-r[i?'poseTab':'compositionTab'].width/2,y:-r[i?'poseTab':'compositionTab'].height/2},i?'姿势':'构图',r[i?'poseTab':'compositionTab'].id),
  'data-value="'+tab+'" role="tab" aria-selected="'+(s.tab===tab)+'" '+disabled,'assist-tab')).join('');
 const indicator={...r.tabIndicator,x:r.tabIndicator.x+(s.tab==='pose'?r.poseTab.x-r.compositionTab.x:0)};
 const categoryControls=d.categories.filter((rect,i)=>s.tab==='composition'||i<2).map((rect,i)=>{
  const cat=CATEGORIES[i],hit=i===0?r.smartPill:rect,local={...rect,x:rect.x-hit.x-hit.width/2,y:rect.y-hit.y-hit.height/2};
  return assistControl(hit,'category',cat.label,assistLabel(local,cat.label,rect.id),'data-value="'+cat.id+'" role="tab" aria-selected="'+(s.category===cat.id)+'" '+disabled,'assist-category '+(s.category===cat.id?'selected':''));
 }).join('');
 const cards=options.map((o,i)=>{
  const slot=d.cards[i],selected=s.selected===o.id;
  // The last CROP slot is exported at its original crop. Other source photos use FILL.
  const src=referenceSource(s,o,i,d);
  return assistControl(slot,'select','选择'+o.label,
   assistLayer({...slot,x:-slot.width/2,y:-slot.height/2},'<img src="'+src+'" alt="'+o.label+'参考" />','assist-reference-art '+(selected?'selected ':'')+(src.endsWith('.svg')?'svg-crop':''),slot.id),
   'data-value="'+o.id+'" aria-pressed="'+selected+'" '+(s.tab==='composition'?'':disabled),'assist-reference');

 }).join('');
 return '<section class="assist-panel" style="--panel-reserve:calc(' +(d.height-d.cards[0].y-d.cards[0].height)+' * var(--du))" aria-label="AI 推荐面板" data-testid="recommendation-panel">'+
 assistLayer(r.panel,'','assist-panel-bg',r.panel.id)+
 '<div role="tablist" aria-label="辅助类型">'+tabs+'</div>'+
 assistLayer(indicator,'','assist-tab-indicator',r.tabIndicator.id)+
 assistLayer(r.smartPill,'','assist-smart-pill',r.smartPill.id)+assistArtwork(r.smartIcon,r.smartIcon.id)+
 '<div role="tablist" aria-label="推荐分类">'+categoryControls+'</div>'+
 assistControl(r.none,'disable-ai','取消构图辅助',
  assistLayer({...r.none,x:-r.none.width/2,y:-r.none.height/2},assistArtwork(relativeRect(r.noneIcon,r.none),r.noneIcon.id),'assist-none-art',r.none.id),disabled,'assist-none')+

 '<div role="group" aria-label="'+(s.tab==='pose'?'姿势':'构图')+'方案">'+cards+'</div></section>';
}
function assistAlignment(s,d){
 const r=d.slots,to={x:r.targetDot.x+r.targetDot.width/2,y:r.targetDot.y+r.targetDot.height/2};
 const from={x:r.movingDot.x+r.movingDot.width/2,y:r.movingDot.y+r.movingDot.height/2};
 const point={x:from.x+(to.x-from.x)*s.alignment/100,y:from.y+(to.y-from.y)*s.alignment/100};
 const geometry=alignmentGeometry(point,to,r.movingDot.width/2,r.targetRing.width/2);
 const direction='<span class="assist-direction" data-align-direction style="'+directionStyle(geometry,r.connector.height)+'">'+
 '<span class="assist-direction-line" data-figma-node="'+r.connector.id+'"></span>'+
 '<span class="assist-direction-arrow" data-figma-node="'+r.arrow.id+'">'+assistImage(r.arrow)+'</span></span>';
 return '<div class="assist-alignment">'+assistArtwork(r.targetDot,r.targetDot.id).replace('<span ','<span data-align-target ')+assistArtwork(r.targetRing,r.targetRing.id)+
 direction+assistOriginalControl({...r.movingDot,x:point.x-r.movingDot.width/2,y:point.y-r.movingDot.height/2},'align-drag','拖动光点对齐','data-align-dot','assist-align-dot')+'</div>';
}
function assistMediaLayers(s,d,media){
 if(s.stage==='ready'&&media.source==='demo')return assistArtwork(d.slots.photo,d.slots.photo.id).replace('<img ','<img data-capture-layer ');
 if(s.stage!=='generating')return '';
 return (media.source==='demo'?assistArtwork(d.frames.background,d.frames.background.id).replace('<img ','<img data-scene-layer ')+assistArtwork(d.slots.window,d.slots.window.id).replace('<img ','<img data-scene-layer '):
  assistLayer(d.slots.window,'','assist-live-dim',d.slots.window.id))+
 assistArtwork(d.slots.outline,d.slots.outline.id)+assistSuccess(d);
}
function assistSuccess(d){
 // Centre the success artwork on the highlight rectangle, including its SVG glow inset.
 const target=d.slots.outline,r=d.slots.success;
 return assistArtwork({...r,x:target.x+target.width/2-r.width/2,y:target.y+target.height/2-r.height/2},r.id);
}
export function renderAssistCamera(s,media){
 if(s.panelCollapsed&&['recommendations','aligning'].includes(s.stage))return renderCollapsedAssist(s);
 const d=ASSIST_DESIGNS[s.stage],r=d.slots,busy=['aligning','generating'].includes(s.stage),disabled=busy?'disabled':'';
 const closeAction=['recommendations','ready'].includes(s.stage)?'disable-ai':'back';
 const close=assistOriginalControl(r.close,closeAction,s.stage==='recommendations'||s.stage==='ready'?'关闭 AI 辅助':'返回拍摄');
 const tools=['flip','flash','filters','beauty'].map((name,i)=>{
  let rect=r[name];if(name==='flash'&&s.flash)rect={...rect,width:12.682284355163574,height:21.27399253845215,asset:'./assets/icons/19-141.svg'};
  return assistOriginalControl(rect,name,['切换前后镜头','闪光灯','滤镜','美颜'][i],disabled+(name==='flash'?' aria-pressed="'+s.flash+'"':''));
 }).join('');
 const progress=s.stage==='generating'?'<span class="assist-sr-only" role="progressbar" aria-label="生成进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+s.progress+'">'+s.progress+'%</span>':'';
 return '<section class="assist-camera" data-frame="'+d.frameId+'" aria-label="AI 拍摄辅助">'+assistMediaLayers(s,d,media)+
 (['recommendations','aligning'].includes(s.stage)?'<button class="assist-preview-collapse" data-action="collapse-panel" aria-label="收起构图模板"></button>':'')+
 '<header>'+close+'</header><nav aria-label="拍摄工具">'+tools+'</nav>'+
 assistArtwork(r.bubble,r.bubble.id)+assistLabel(r.message,r.message.text,r.message.id)+progress+
 assistEntry(s,d,'ai','ai-entry','AI 点点',disabled)+assistShutter(s,d)+assistEntry(s,d,'vlog','vlog','mini Vlog',disabled)+
 (s.stage==='recommendations'||s.stage==='aligning'?assistPanel(s,d):'')+
 (['recommendations','aligning'].includes(s.stage)&&s.selected?assistAlignment(s,ASSIST_DESIGNS.aligning):'')+'</section>';
}

function renderCollapsedAssist(s){
 const options=getOptions(s.tab,s.category).slice(0,5),index=options.findIndex(o=>o.id===s.selected);
 const selected=index>=0?options[index]:null;
 const source=selected?referenceSource(s,selected,index,ASSIST_DESIGNS[s.stage]):'./assets/design/62-153.svg';
 const label=selected?selected.label+'模板':'当前构图模板';
 const ratio=264.3290710449219/287.0690612792969;
 const slot=(x,y,w,h)=>'--x:'+x*ratio+';--y:'+y*ratio+';--w:'+w*ratio+';--h:'+h*ratio;
 const camera=renderMainCamera({...s,stage:'idle'},{hidePrompt:true})
  .replace('data-action="exit"','data-action="disable-ai"').replace('aria-label="离开拍摄"','aria-label="关闭 AI 辅助"')
  .replace('data-action="ai-entry"','data-action="expand-panel"').replace('aria-pressed="false"','aria-pressed="true"');
 return '<section data-frame="62:92" class="collapsed-assist">'+camera+
 '<button class="design-box collapsed-template" data-action="expand-panel" aria-label="展开构图模板" style="'+slot(29.411251449584825,422.50244331359863,49.652156829833984,65.3121566772461)+'"><img class="collapsed-selected-image" src="'+source+'" alt="'+label+'" /></button>'+
 '<button class="design-box collapsed-template-close" data-action="disable-ai" aria-label="退出 AI 点点" style="'+slot(73.8651123046875,415.330060005188,14.344579696655273,14.344579696655273)+'"><img src="./assets/design/62-154.svg" alt="" /></button></section>';
}
