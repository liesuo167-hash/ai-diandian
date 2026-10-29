import { renderScanOverlay } from './components/main-camera.js';
import { installCameraLayout } from './design/camera-layout.js';
import { initialState, transition, isBusy, hasPanel } from './state/machine.js';
import { TIMING } from './data/recommendations.js';
import { renderCameraUi } from './components/camera-ui.js';
import { renderSheet } from './components/sheets.js';
import { renderGuide } from './components/guides.js';
import { createCameraController } from './services/camera.js';
import { capturePhoto } from './services/capture.js';
import { ASSIST_DESIGNS } from './design/assist-layouts.js';
import { updateAlignmentDirection } from './components/alignment-direction.js';
import { preload } from './services/asset-ready.js';
import { collectStageAssets, warmStages } from './services/stage-assets.js';

const app=document.querySelector('#app'),ui=document.querySelector('#ui'),sheetRoot=document.querySelector('#sheet-root');
const scene=document.querySelector('#scene'),video=document.querySelector('#camera-video'),guide=document.querySelector('#guide-layer');
let state=initialState(),media={source:'demo',pending:false,mirrored:false,message:'预置画面随时可用。真实相机需要 HTTPS 或本机 localhost。'};
let alignmentWasDragged=false;
let photos=[],stageInterval=null,alignInterval=null,countdownInterval=null,liveInterval=null,liveStarted=0;
let toastTimer,stageToken=0,sheetSignature='',focusBeforeSheet=null,capturing=false;
const camera=createCameraController({video,onChange:next=>{media=next;render();}});
const cameraLayout=installCameraLayout(app);
document.querySelector("#scan-layer").innerHTML=renderScanOverlay();
const filters={none:'',warm:'sepia(0.18) saturate(1.12) brightness(1.03)',mono:'grayscale(1) contrast(1.08)'};
const filterValue=()=>(filters[state.filter]+(state.beauty?' brightness('+(1+state.beauty/600)+') saturate('+(1+state.beauty/900)+')':''))||'none';
function toast(message){
 const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3300);
}
function dispatch(event){
 const prev=state;state=transition(state,event);if(prev===state)return;
 // Only scanning ticks update text/ARIA: replacing the whole camera every 80 ms
 // can detach the cancel button between pointerdown and click on mobile.
 if(event.type==='PROGRESS'&&state.stage==='scanning')renderScanProgress();else render();
 reconcileEffects(prev);
}
function renderScanProgress(){
 const bar=ui.querySelector('.design-scanning-prompt [role="progressbar"]');
 bar?.setAttribute('aria-valuenow',String(state.progress));
 const number=ui.querySelector('[data-design="scanProgress"]');
 if(number)number.textContent=state.progress+'%';
}
function reconcileEffects(prev){
 if(prev.stage!==state.stage){
  stageToken++;clearInterval(stageInterval);clearInterval(alignInterval);alignInterval=null;
  if(['scanning','generating'].includes(state.stage))runStageTimer(stageToken,state.stage);
 }
 if(prev.countdown!==null&&state.countdown===null){clearInterval(countdownInterval);countdownInterval=null;}
 if(prev.live!==state.live){
  clearInterval(liveInterval);
  if(state.live){liveStarted=Date.now();updateLiveClock();liveInterval=setInterval(updateLiveClock,1000);}
 }
}

/**
 * 自动推进：先把目标阶段要用到的资源全部解码完，再开始计时。
 * 定时器只认时间、不认资源；不预取的话，下一屏图片还没解码就跳过去了。
 */
async function runStageTimer(token,stage){
 const duration=stage==='scanning'?TIMING.scan:TIMING.generate;
 const event={type:stage==='scanning'?'SCAN_COMPLETE':'GENERATED'};
 // 要预取哪些资源取决于跳转后的状态，先推演出目标状态
 const target=transition(state,event);
 await preload(new Set([...collectStageAssets(stage,state),...collectStageAssets(target.stage,target)])).catch(()=>{});
 if(token!==stageToken)return;   // 等待期间用户已切走，这次推进作废
 const start=performance.now();
 stageInterval=setInterval(()=>{
  if(token!==stageToken)return;
  const value=Math.floor((performance.now()-start)/duration*100);
  if(value>=100){
   clearInterval(stageInterval);
   dispatch(event);
   if(stage==='generating')toast('辅助已应用，可以拍下这一刻了');
  }else dispatch({type:'PROGRESS',value});
 },80);
}

/** 程序化跳转的统一入口：等目标阶段资源就绪后再 dispatch，且只执行最后一次请求。 */
let readyToken=0;
async function dispatchWhenReady(event){
 const token=++readyToken;
 const target=transition(state,event);
 await preload(collectStageAssets(target.stage,target)).catch(()=>{});
 if(token!==readyToken)return;
 dispatch(event);
}
function updateLiveClock(){
 const time=document.querySelector('#live-time');if(!time)return;
 const seconds=liveStarted?Math.floor((Date.now()-liveStarted)/1000):0;
 time.textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
}
function render(){
 const active=document.activeElement;
 const activeAction=active?.dataset?.action,activeValue=active?.dataset?.value;
 const categoryScroll=ui.querySelector('.category-list')?.scrollLeft||0,referenceScroll=ui.querySelector('.reference-list')?.scrollLeft||0;
 app.dataset.stage=state.stage;app.dataset.mode=state.mode;
 cameraLayout.setStage(state.panelCollapsed?'idle':state.stage);
 ui.innerHTML=renderCameraUi(state,media,photos);
 const statusX=state.stage==='idle'?-.061273954808712:-3.964;
 ui.insertAdjacentHTML('beforeend','<div class="design-status" aria-hidden="true" style="--status-x:'+statusX+'"><img src="./assets/design/19-113.svg" alt="" /></div>');
 ui.querySelector('.category-list')?.scrollTo({left:categoryScroll});
 ui.querySelector('.reference-list')?.scrollTo({left:referenceScroll});
 if(activeAction&&!state.sheet){
  [...ui.querySelectorAll('[data-action]')].find(e=>e.dataset.action===activeAction&&e.dataset.value===activeValue)?.focus({preventScroll:true});
 }
 const panel=hasPanel(state);app.classList.toggle('panel-open',panel);
 scene.hidden=media.source==='camera';video.hidden=media.source!=='camera';
 scene.style.filter=filterValue();video.style.filter=filterValue();
 ui.querySelectorAll('[data-scene-layer],[data-capture-layer]').forEach(img=>{img.style.filter=filterValue();});
 video.style.transform=media.mirrored?'scaleX(-1)':'';
 scene.classList.toggle('generated-scene',state.stage==='ready');
 document.querySelector('#scan-layer').hidden=state.stage!=='scanning';
 let show=null;
 if(panel&&state.selected)show={id:state.selected,tab:state.tab};
 else if(state.applied&&state.guideVisible)show=state.applied;
 guide.innerHTML=['recommendations','aligning','generating','ready'].includes(state.stage)?'':(show?renderGuide(show.id,show.tab):'');
 guide.hidden=['recommendations','aligning','generating','ready'].includes(state.stage);
 guide.classList.toggle('preview-guide',panel);
 const signature=JSON.stringify([state.sheet,state.filter,media.message,media.pending,photos.length]);
 if(signature!==sheetSignature){
  const wasOpen=!!sheetRoot.querySelector('[role="dialog"]');sheetSignature=signature;
  if(state.sheet&&!wasOpen)focusBeforeSheet={action:activeAction,value:activeValue};
  sheetRoot.innerHTML=renderSheet(state.sheet,state,media,photos);
  if(state.sheet&&!wasOpen)sheetRoot.querySelector('[role="dialog"]')?.focus({preventScroll:true});
  if(!state.sheet&&wasOpen&&focusBeforeSheet){
   [...ui.querySelectorAll('[data-action]')].find(e=>e.dataset.action===focusBeforeSheet.action&&e.dataset.value===focusBeforeSheet.value)?.focus({preventScroll:true});
  }
 }
 ui.inert=!!state.sheet;
 updateLiveClock();bindAlignment();
 const design=ASSIST_DESIGNS.aligning,origin=design.slots.movingDot,target=design.slots.targetDot;
 if(['recommendations','aligning'].includes(state.stage)){
  const scale=app.getBoundingClientRect().width/design.width;
  moveAlignmentScene({x:(origin.x+origin.width/2+(target.x+target.width/2-origin.x-origin.width/2)*state.alignment/100)*scale,y:(origin.y+origin.height/2+(target.y+target.height/2-origin.y-origin.height/2)*state.alignment/100)*scale});
 }else document.querySelector('#scene-frame-inner').style.translate='';
}
function back(){
 if(state.sheet==='source'&&media.pending)camera.stop('已取消相机请求，继续使用预置画面。');
 dispatch({type:'BACK'});
}
async function simulateAlignment(){
 if(alignInterval||state.stage!=='aligning')return;
 const token=stageToken;
 // 对齐动画走完紧接着就是生成页，先把生成页要用的资源解码掉再开始动画
 const target=transition(state,{type:'ALIGNED'});
 await preload(new Set([...collectStageAssets(state.stage,state),...collectStageAssets(target.stage,target)])).catch(()=>{});
 if(token!==stageToken||alignInterval||state.stage!=='aligning')return;
 const start=performance.now();
 alignInterval=setInterval(()=>{
  if(state.stage!=='aligning'){clearInterval(alignInterval);alignInterval=null;return;}
  const value=Math.min(100,Math.round((performance.now()-start)/TIMING.align*100));
  dispatch({type:'ALIGN',value});
  if(value===100){clearInterval(alignInterval);alignInterval=null;dispatch({type:'ALIGNED'});}
 },70);
}
function moveAlignmentScene(point){
 const d=ASSIST_DESIGNS.aligning,r=d.slots.movingDot,scale=app.getBoundingClientRect().width/d.width;
 // Translate the entire media plane with the grey point; toolbar/target stay fixed.
 document.querySelector('#scene-frame-inner').style.translate=(point.x-(r.x+r.width/2)*scale)+'px '+(point.y-(r.y+r.height/2)*scale)+'px';
}
function bindAlignment(){
 const dot=ui.querySelector('[data-align-dot]');if(!dot||alignInterval)return;
 dot.addEventListener('pointerdown',event=>{
  if(!['recommendations','aligning'].includes(state.stage))return;
  event.preventDefault();const rect=app.getBoundingClientRect(),target=ui.querySelector('[data-align-target]').getBoundingClientRect();
  alignmentWasDragged=false;
  dot.setPointerCapture(event.pointerId);
  const move=e=>{
   if(Math.hypot(e.clientX-event.clientX,e.clientY-event.clientY)>4)alignmentWasDragged=true;
   const x=Math.max(0,Math.min(rect.width,e.clientX-rect.left)),y=Math.max(0,Math.min(rect.height,e.clientY-rect.top));
   dot.style.setProperty('--center-x',x+'px');dot.style.setProperty('--center-y',y+'px');
   updateAlignmentDirection(ui,app,{x,y},ASSIST_DESIGNS.aligning);
   moveAlignmentScene({x,y});
   const distance=Math.hypot(e.clientX-(target.left+target.width/2),e.clientY-(target.top+target.height/2));
   if(distance<Math.max(12,target.width/2)){dot.removeEventListener('pointermove',move);if(state.stage==='recommendations')dispatch({type:'APPLY'});dispatchWhenReady({type:'ALIGNED'});}
  };
  dot.addEventListener('pointermove',move);
  dot.addEventListener('pointerup',()=>{dot.removeEventListener('pointermove',move);},{once:true});
  dot.addEventListener('pointercancel',()=>dot.removeEventListener('pointermove',move),{once:true});
 });
}
async function shoot(){
 if(capturing||isBusy(state)||hasPanel(state)||state.sheet)return;
 if(state.mode==='live'){
  dispatch({type:'LIVE'});toast(state.live?'已开始本地模拟直播，不会向外推流':'模拟直播已结束');return;
 }
 if(state.countdown!==null){dispatch({type:'COUNTDOWN',value:null});toast('已取消倒计时');return;}
 if(state.timer){
  dispatch({type:'COUNTDOWN',value:3});
  countdownInterval=setInterval(()=>{
   if(state.countdown===null){clearInterval(countdownInterval);return;}
   if(state.countdown<=1){dispatch({type:'COUNTDOWN',value:null});takePhoto();}
   else dispatch({type:'COUNTDOWN',value:state.countdown-1});
  },1000);
 }else await takePhoto();
}
async function takePhoto(){
 if(capturing)return;capturing=true;
 try{
  const photoLayer=media.source==='demo'?ui.querySelector('[data-capture-layer]'):null;
  const source=photoLayer||(media.source==='camera'?video:scene);
  const rect=app.getBoundingClientRect();
  const drawn=photoLayer?.getBoundingClientRect();
  const renderRect=drawn?{x:(drawn.left-rect.left)/rect.width,y:(drawn.top-rect.top)/rect.height,width:drawn.width/rect.width,height:drawn.height/rect.height}:null;
  const url=await capturePhoto({source,viewport:rect,filter:filterValue(),mirrored:media.mirrored,renderRect});
  photos.unshift({id:Date.now(),url,label:media.source==='camera'?'相机拍摄':'预置画面 · Demo'});photos=photos.slice(0,12);
  const flash=document.querySelector('#flash');flash.hidden=!state.flash;setTimeout(()=>{flash.hidden=true;},160);
  navigator.vibrate?.(25);render();toast('拍摄完成');
 }catch(error){toast(error.message||'拍摄失败，请稍后重试。');}
 finally{capturing=false;}
}
app.addEventListener('click',async event=>{
 const target=event.target.closest('[data-action]');if(!target||target.disabled)return;
 const action=target.dataset.action,value=target.dataset.value;
 switch(action){
 case 'collapse-panel':dispatch({type:'COLLAPSE_PANEL'});break;
 case 'expand-panel':dispatch({type:'EXPAND_PANEL'});break;
 case 'start-ai':dispatch({type:'START_AI'});break;
 case 'ai-entry':dispatch({type:state.stage==='idle'?'START_AI':'OPEN_RECOMMENDATIONS'});break;
 case 'cancel-ai':back();toast('已取消本次分析');break;
 case 'disable-ai':dispatch({type:'DISABLE_AI'});toast('AI 辅助已关闭');break;
 case 'back':case 'close-sheet':case 'resume':back();break;
 case 'tab':dispatch({type:'TAB',value});break;
 case 'category':dispatch({type:'CATEGORY',value});ui.querySelector('[data-action="category"][data-value="'+value+'"]')?.scrollIntoView({block:'nearest',inline:'nearest'});break;
 case 'select':
  // A new or repeated template restarts manual alignment and cancels an old simulation.
  if(state.stage==='aligning'&&state.tab==='composition'){clearInterval(alignInterval);alignInterval=null;}
  dispatch({type:'SELECT',value});break;
 case 'apply':dispatch({type:'APPLY'});break;
 case 'align-drag':if(!alignmentWasDragged)dispatch({type:'COLLAPSE_PANEL'});alignmentWasDragged=false;break;
 case 'simulate-align':simulateAlignment();break;
 case 'edit-assist':dispatch({type:'OPEN_RECOMMENDATIONS'});break;
 case 'guide':dispatch({type:'TOGGLE_GUIDE'});break;
 case 'mode':dispatch({type:'MODE',value});break;
 case 'shutter':await shoot();break;
 case 'flash':dispatch({type:'FLASH'});toast(state.flash?'已开启模拟补光，未调用设备闪光灯':'已关闭模拟补光');break;
 case 'timer':dispatch({type:'TIMER'});toast(state.timer?'已开启 3 秒倒计时':'已关闭倒计时');break;
 case 'filter':dispatch({type:'FILTER',value});break;
 case 'camera-source':dispatch({type:'SHEET',value:'source'});break;
 case 'use-camera':{
  if(media.pending)return;
  const ok=await camera.start();if(ok){dispatch({type:'SHEET',value:null});toast('真实相机已启用');}
  break;
 }
 case 'use-demo':camera.stop();dispatch({type:'SHEET',value:null});toast('已使用预置画面');break;
 case 'flip':{
  if(media.source!=='camera'){dispatch({type:'SHEET',value:'source'});break;}
  const ok=await camera.flip();toast(ok?'已切换镜头':media.message);break;
 }
 case 'reset':camera.stop();photos=[];dispatch({type:'RESET'});toast('已重新开始演示');break;
 case 'exit':if(isBusy(state)||hasPanel(state)||state.countdown!==null)back();else dispatch({type:'SHEET',value:'exit'});break;
 case 'filters':case 'beauty':case 'about':case 'gallery':case 'vlog':dispatch({type:'SHEET',value:action});break;
 }
});
app.addEventListener('input',event=>{
 if(event.target.id==='beauty-range'){
  dispatch({type:'BEAUTY',value:event.target.value});
  const output=sheetRoot.querySelector('#beauty-value');if(output)output.textContent=state.beauty+'%';
 }
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();back();}
 if(event.key==='Tab'&&state.sheet){
  const items=[...sheetRoot.querySelectorAll('button,a,input')].filter(e=>!e.disabled);
  if(!items.length)return;
  const first=items[0],last=items.at(-1);
  if(event.shiftKey&&(document.activeElement===first||document.activeElement===sheetRoot.querySelector('[role="dialog"]'))){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
});
// Do not keep the user's camera active after they leave the page.
window.addEventListener('pagehide',()=>{stageToken++;camera.stop();clearInterval(stageInterval);clearInterval(alignInterval);clearInterval(countdownInterval);clearInterval(liveInterval);state={...state,stage:state.applied?'ready':'idle',progress:0,alignment:0,countdown:null,live:false,sheet:null};render();});
render();
// 首屏先出画面；其余阶段在空闲时预热，后续自动跳转就不必再等资源了。
warmStages(state.stage,state);
