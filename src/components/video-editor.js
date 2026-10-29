import {EDITOR_LAYOUTS} from '../design/editor-layouts.js';
import {EDITOR_ASSET_SIZES} from '../design/editor-asset-sizes.js';
import {EDITOR_AVATAR_ASSETS} from '../design/editor-avatar-assets.js';
import {EDITOR_STAGES,initialEditorState,editorTransition} from '../state/video-editor-machine.js';
const escape=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const rgba=(c,a=1)=>'rgba('+[c.r,c.g,c.b].map(v=>Math.round(v*255)).join(',')+','+(c.a??a)+')';
function paint(p){
 if(!p||p.visible===false)return 'transparent';
 if(p.type==='SOLID')return rgba(p.color,p.opacity??1);
 if(p.type==='GRADIENT_LINEAR')return 'linear-gradient('+(p.cssAngle??180)+'deg,'+p.gradientStops.map(s=>rgba(s.color)+' '+s.position*100+'%').join(',')+')';
 return 'transparent';
}
export function editorNodes(frame){const out=[];function walk(n){out.push(n);for(const c of n.children??[])walk(c);}for(const n of frame.children)walk(n);return out;}
const xy=n=>'left:calc('+n.x+' * var(--eu));top:calc('+n.y+' * var(--eu));width:calc('+n.width+' * var(--eu));height:calc('+n.height+' * var(--eu));';
function artwork(n,parent={x:0,y:0},opacity=1){
 const local={...n,x:n.x-parent.x,y:n.y-parent.y},alpha=opacity*(n.opacity??1);
 const fills=(n.fills||[]).filter(p=>p.visible!==false),stroke=(n.strokes||[]).find(p=>p.visible!==false);
 // Export the original avatar group as a single asset so masks, gradient strokes,
 // inner shadows and blurred decoration retain Figma's compositing and opacity.
 if(EDITOR_AVATAR_ASSETS[n.id]){
  const size=EDITOR_AVATAR_ASSETS[n.id];
  return '<span class="editor-layer" data-editor-avatar="'+n.id+'" style="opacity:'+opacity+';'+xy(local)+'"><img src="./assets/editor/avatars/'+n.id.replace(':','-')+'.svg" alt="" style="left:calc('+((n.width-size.width)/2)+' * var(--eu));top:calc('+((n.height-size.height)/2)+' * var(--eu));" /></span>';
 }
 if(n.children){
  const inside=n.type==='FRAME'?n:parent;
  const body=n.children.map(c=>artwork(c,inside,alpha)).join('');
  return n.type==='FRAME'?'<div class="editor-layer editor-clip" style="'+xy(local)+'border-radius:calc('+(n.cornerRadius||0)+' * var(--eu));'+(n.clipsContent?'overflow:hidden;':'')+'">'+body+'</div>':body;
 }
 const base='opacity:'+alpha+';'+xy(local);
 if(n.previewPlaying)return '<span class="editor-layer editor-pause" style="'+base+'"><i></i><i></i></span>';
 if(n.asset){
  const size=EDITOR_ASSET_SIZES[n.id],offset={x:(n.width-size.width)/2,y:(n.height-size.height)/2};
  return '<span class="editor-layer" data-editor-node="'+n.id+'" style="'+base+'"><img src="./assets/editor/'+n.id.replace(':','-')+'.svg" alt="" style="left:calc('+offset.x+' * var(--eu));top:calc('+offset.y+' * var(--eu));" /></span>';
 }
 if(n.type==='TEXT'){
  if(n.characters==='输入你的想法或按住说话')return '<input class="editor-layer editor-prompt" aria-label="输入你的想法" placeholder="'+escape(n.characters)+'" style="'+base+'font-size:calc('+n.fontSize+' * var(--eu));" />';
  let color=fills[0]?.type==='SOLID'?rgba(fills[0].color,fills[0].opacity??1):'transparent';
  const grad=fills[0]?.type==='GRADIENT_LINEAR'?'background:'+paint(fills[0])+';-webkit-background-clip:text;background-clip:text;':'';
  return '<span class="editor-layer editor-text '+(/思考中/.test(n.characters)?'editor-thinking':'')+'" '+(n.timePart?'data-editor-time-part="'+n.timePart+'" ':'')+'data-editor-node="'+n.id+'" style="'+base+'font-size:calc('+n.fontSize+' * var(--eu));font-weight:'+(/Heavy/.test(n.fontName?.style)?900:/SemiBold/.test(n.fontName?.style)?600:500)+';color:'+color+';text-align:'+(n.textAlignHorizontal||'left').toLowerCase()+';'+grad+'">'+escape(n.characters).replaceAll('\n','<br/>')+'</span>';
 }
 return '<span class="editor-layer" data-editor-node="'+n.id+'" style="'+base+'background:'+(fills.length?fills.slice().reverse().map(paint).join(','):'transparent')+';border-radius:'+(n.type==='ELLIPSE'?'50%':'calc('+(typeof n.cornerRadius==='number'?n.cornerRadius:0)+' * var(--eu))')+';'+(stroke?'border:calc('+(n.strokeWeight||0)+' * var(--eu)) solid '+(stroke.type==='SOLID'?paint(stroke):'#56eadf')+';':'')+(n.rotation?'transform:rotate('+(-n.rotation)+'deg);transform-origin:top left;':'')+'"></span>';
}
function hit(n,action,label,extra=''){
 return '<button class="editor-hit" data-editor-action="'+action+'" aria-label="'+escape(label)+'" style="--hx:'+(n.x+n.width/2)+';--hy:'+(n.y+n.height/2)+';--hw:'+Math.max(n.width,22)+';--hh:'+Math.max(n.height,22)+'" '+extra+'></button>';
}
export function renderVideoEditor(s){
 const frame=EDITOR_LAYOUTS.find(f=>f.name===EDITOR_STAGES[s.view]),nodes=editorNodes(frame),text=t=>nodes.find(n=>n.characters===t);
 const controls=[],back=nodes.find(n=>n.name==='Group 45'),play=nodes.find(n=>n.type==='VECTOR'&&n.width>10&&n.width<13&&n.y>frame.height*.59&&n.y<frame.height*.65);
 const clockNodes=nodes.filter(n=>n.type==='TEXT'&&n.y>frame.height*.60&&n.y<frame.height*.64&&/^\d\d$/.test(n.characters)&&n.x<38).sort((a,b)=>a.x-b.x);
 // Keep the source time layout, with a bounded local clock (no video source exists in Figma).
 function previewNode(n){const part=clockNodes.findIndex(c=>c.id===n.id);return {...n,...(part>=0?{timePart:part===0?'minutes':'seconds',characters:String(part===0?Math.floor(s.time/60):s.time%60).padStart(2,'0')}:{ }),...(n.id===play?.id?{previewPlaying:s.playing}:{}),...(n.children?{children:n.children.map(previewNode)}:{})};}
 if(back)controls.push(hit(back,'BACK','返回编辑起点'));
 if(play)controls.push(hit(play,'PLAY',s.playing?'暂停预览':'播放预览','aria-pressed="'+s.playing+'"'));
 for(const [name,action]of [['返回','BACK'],['下一步','NEXT'],['选择音乐','MUSIC'],['帮我优化视频封面标题','SUBMIT']]){
  // The sheet occludes the editor footer; its invisible buttons must not intercept taps.
  if(['chat','thinking','result'].includes(s.view)&&['BACK','NEXT'].includes(action))continue;
  if(text(name))controls.push(hit(text(name),action,name,['SUBMIT','NEXT'].includes(action)&&s.job==='running'?'disabled':''));
 }
 const ai=nodes.find(n=>/Group 214720879[56]$/.test(n.name)&&n.width>30&&n.width<45&&n.y>frame.height*.7);
 if(ai)controls.push(hit(ai,'OPEN_AI',s.job==='done'?'查看优化结果':'打开编辑 AI 点点'));
 if(['chat','thinking','result'].includes(s.view)){
  const handle=nodes.find(n=>n.name==='Rectangle 346242868'&&n.width<25);
  if(handle)controls.push(hit(handle,'CLOSE_CHAT','收起 AI 对话'));
  const mic=nodes.find(n=>n.name==='Ellipse 148'&&n.y>550);
  if(mic)controls.push(hit(mic,'SUBMIT','提交封面优化请求',s.job==='running'?'disabled':''));
 }
 if(s.view==='done'&&text('已完成'))controls.push(hit(text('已完成'),'OPEN_AI','查看优化结果'));
 return '<section class="video-editor" data-editor-view="'+s.view+'" data-editor-frame="'+frame.id+'" aria-label="视频编辑 Demo" style="--ew:'+frame.width+';--eh:'+frame.height+'">'+frame.children.map(n=>artwork(previewNode(n))).join('')+controls.join('')+'<span class="editor-sr-status" role="status">'+(s.job==='running'?'正在本地模拟优化封面':s.job==='done'?'封面优化已完成':'视频编辑')+'</span></section>';
}
export function createVideoEditor({onExit}){
 let state=initialEditorState(),timeouts=[],clock=null,active=false;
 const mount=document.createElement('div');mount.id='video-editor-root';mount.hidden=true;document.body.append(mount);
 const resize=()=>{const f=EDITOR_LAYOUTS.find(f=>f.name===EDITOR_STAGES[state.view]),scale=Math.min(document.documentElement.clientWidth/f.width,(window.visualViewport?.height||window.innerHeight)/f.height);mount.style.setProperty('--eu',scale+'px');mount.style.setProperty('--editor-scale',scale);mount.style.width=f.width*scale+'px';mount.style.height=f.height*scale+'px';};
 const render=()=>{mount.innerHTML=renderVideoEditor(state);resize();};
 function send(e){
  const before=state;state=editorTransition(state,e);if(state===before)return;
  if(state.exit){close();return;}
  render();
  if(e.type==='SUBMIT'&&before.job!=='running'){
   timeouts.forEach(clearTimeout);
   timeouts=[setTimeout(()=>send({type:'COMPLETE'}),3600)];
  }
  if(!state.playing)clearInterval(clock);
  if(e.type==='PLAY'&&state.playing){clearInterval(clock);clock=setInterval(()=>{state=editorTransition(state,{type:'TICK'});mount.dataset.previewTime=state.time;mount.querySelectorAll('[data-editor-time-part]').forEach(el=>{el.textContent=String(el.dataset.editorTimePart==='minutes'?Math.floor(state.time/60):state.time%60).padStart(2,'0');});},1000);}
 }
 function close(){active=false;timeouts.forEach(clearTimeout);clearInterval(clock);mount.hidden=true;onExit();state=initialEditorState();}
 mount.addEventListener('click',e=>{const b=e.target.closest('[data-editor-action]');if(!b||b.disabled)return;
  if(b.dataset.editorAction==='MUSIC'){b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true');return;}
  send({type:b.dataset.editorAction});
 });
 mount.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('.editor-prompt')){e.target.blur();send({type:'SUBMIT'});}if(e.key==='Escape'){e.preventDefault();e.stopPropagation();send({type:'BACK'});}});
 window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',()=>{if(active)resize();});
 window.addEventListener('pagehide',()=>{if(active)close();});
 return {open(){active=true;state=initialEditorState();mount.hidden=false;render();},close};
}
