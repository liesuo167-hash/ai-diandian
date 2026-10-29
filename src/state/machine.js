import { CATEGORIES, findOption, getOptions } from '../data/recommendations.js';
/** @typedef {'idle'|'scanning'|'recommendations'|'aligning'|'generating'|'ready'} Stage */
/** @typedef {'composition'|'pose'} AssistTab */
/** @typedef {{tab: AssistTab, id: string}} AppliedOption */
/** @typedef {{ stage: Stage, mode:'photo'|'live', tab:AssistTab, category:string, selected:string|null, applied:AppliedOption|null, guideVisible:boolean, progress:number, alignment:number, live:boolean, sheet:string|null, filter:'none'|'warm'|'mono', flash:boolean, beauty:number, timer:0|3, countdown:number|null }} AppState */
/** @returns {AppState} */
export function initialState() {
 return {stage:'idle', mode:'photo', tab:'composition', category:'smart', selected:null,
 panelCollapsed:false, applied:null, guideVisible:true, progress:0, alignment:0, live:false, sheet:null,
 filter:'none', flash:false, beauty:0, timer:0, countdown:null};
}
export const isBusy = s=>['scanning','aligning','generating'].includes(s.stage);
export const hasPanel = s=>['recommendations','aligning'].includes(s.stage);
/** Pure transitions. Timers and media effects are owned by main.js. */
export function transition(s,e) {
 switch(e.type) {
 case 'COLLAPSE_PANEL': return hasPanel(s)?{...s,panelCollapsed:true}:s;
 case 'EXPAND_PANEL': return hasPanel(s)?{...s,panelCollapsed:false}:s;
 case 'START_AI':
  if(isBusy(s)||s.live||s.countdown!==null) return s;
  return {...s,stage:'scanning',panelCollapsed:false,progress:0,alignment:0,sheet:null};
 case 'PROGRESS':
  if(!['scanning','generating'].includes(s.stage)) return s;
  return {...s,progress:Math.max(s.progress,Math.min(99,e.value))};
 case 'SCAN_COMPLETE':
  if(s.stage!=='scanning') return s;
  return {...s,stage:'recommendations',progress:100,tab:'composition',category:'smart',selected:'thirds'};
 case 'OPEN_RECOMMENDATIONS':
  if(isBusy(s)||s.live||s.countdown!==null) return s;
  return {...s,stage:'recommendations',sheet:null,tab:s.applied?.tab||'composition',category:s.applied?.id==='center'?'center':'smart',selected:s.applied?.id||'thirds'};
 case 'TAB':
  if(!['recommendations','aligning'].includes(s.stage)||!['composition','pose'].includes(e.value)) return s;
  return {...s,stage:'recommendations',alignment:0,tab:e.value,category:'smart',selected:e.value==='pose'?'look-back':'thirds'};
 case 'CATEGORY':
  if(!['recommendations','aligning'].includes(s.stage)||!CATEGORIES.some(c=>c.id===e.value)) return s;
  return {...s,stage:'recommendations',alignment:0,category:e.value,selected:getOptions(s.tab,e.value)[0]?.id||null};
 case 'SELECT':
  if((s.stage!=='recommendations'&&!(s.stage==='aligning'&&s.tab==='composition'))||!findOption(s.tab,e.value)) return s;
  // Composition thumbnails enter manual alignment, including the preselected template.
  if(s.tab==='composition') return {...s,selected:e.value,stage:'aligning',alignment:0,guideVisible:true};
  return {...s,selected:s.selected===e.value?null:e.value};
 case 'APPLY':
  if(s.stage!=='recommendations'||!findOption(s.tab,s.selected)) return s;
  return {...s,stage:'aligning',alignment:0,guideVisible:true};
 case 'ALIGN':
  return s.stage==='aligning'?{...s,alignment:Math.max(0,Math.min(100,e.value))}:s;
 case 'ALIGNED':
  return s.stage==='aligning'?{...s,stage:'generating',progress:0,alignment:100}:s;
 case 'GENERATED':
  if(s.stage!=='generating') return s;
  return {...s,stage:'ready',progress:100,applied:{tab:s.tab,id:s.selected},guideVisible:true};
 case 'BACK':
  if(s.sheet) return {...s,sheet:null};
  if(s.countdown!==null) return {...s,countdown:null};
  if(s.stage==='aligning') return {...s,stage:'recommendations',alignment:0};
  return {...s,stage:s.applied?'ready':'idle',progress:0,alignment:0};
 case 'DISABLE_AI':
  return {...s,stage:'idle',panelCollapsed:false,applied:null,selected:null,progress:0,alignment:0,guideVisible:false};
 case 'TOGGLE_GUIDE': return s.applied?{...s,guideVisible:!s.guideVisible}:s;
 case 'MODE':
  if(!['photo','live'].includes(e.value)||isBusy(s)||s.live||s.countdown!==null) return s;
  return {...s,mode:e.value,stage:s.applied?'ready':'idle',sheet:null};
 case 'LIVE':
  return s.mode==='live'&&!isBusy(s)&&!hasPanel(s)?{...s,live:!s.live}:s;
 case 'SHEET':
  return isBusy(s)||s.countdown!==null||s.live?s:{...s,sheet:e.value};
 case 'FILTER': return ['none','warm','mono'].includes(e.value)?{...s,filter:e.value}:s;
 case 'BEAUTY': return {...s,beauty:Math.max(0,Math.min(100,Number(e.value)||0))};
 case 'FLASH': return {...s,flash:!s.flash};
 case 'TIMER': return {...s,timer:s.timer===0?3:0};
 case 'COUNTDOWN': return {...s,countdown:e.value};
 case 'RESET': return initialState();
 default: return s;
 }
}
