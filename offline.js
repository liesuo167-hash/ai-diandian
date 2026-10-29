(function(){
// 原始 Figma IMAGE fills，文件未经修改。
const SCENE = './assets/figma/a25063dc1590114d04b2432fc040241452d833d8.png';
const REFERENCES = [
'./assets/figma/93c511b55e90d764021246ecf737bc75d7af6573.png',
'./assets/figma/1760924c1e698057b17e386768a5a594ad98cdba.png',
'./assets/figma/033ad0bd8635a80fd1d8065e8ae72c3448569e6a.png',
'./assets/figma/f104adb8c7ba9dfeeb24fd941594c2b9f5ed19ae.png',
'./assets/figma/ee8e62bea196096ee692d8474b3a177569b1a82e.png',
];
const CATEGORIES = [
{ id:'smart', label:'智能推荐' }, { id:'popular', label:'热门' },
{ id:'thirds', label:'三分线' }, { id:'diagonal', label:'对角线' },
{ id:'triangle', label:'三角形' }, { id:'leading', label:'引导线' },
{ id:'frame', label:'框架' }, { id:'center', label:'居中' },
];
const COMPOSITIONS = [
{ id:'thirds', label:'三分线', hint:'让人物靠近左侧三分线，给目光留一点空间。', image:REFERENCES[4] },
{ id:'diagonal', label:'对角线', hint:'让花茎沿对角线延伸，画面更有动感。', image:REFERENCES[1] },
{ id:'triangle', label:'三角形', hint:'用人物与两侧花朵形成稳定的三角形。', image:REFERENCES[2] },
{ id:'leading', label:'引导线', hint:'沿着花田的小径，把视线引向人物。', image:REFERENCES[3] },
{ id:'frame', label:'框架', hint:'把前景的叶片留在边缘，形成自然画框。', image:REFERENCES[0] },
{ id:'center', label:'居中', hint:'让人物位于画面中心，突出这一刻的主角。', image:REFERENCES[0] },
];
// Figma 无姿势展开稿；Demo 最小补充，复用同组素材。
const POSES = [
{ id:'look-back', label:'自然回眸', hint:'肩膀轻轻侧转，回头看向镜头。', image:REFERENCES[0] },
{ id:'look-up', label:'抬头看光', hint:'稍稍抬头，让阳光落在脸颊。', image:REFERENCES[1] },
{ id:'sideways', label:'侧身站立', hint:'侧身站立，双手自然放松。', image:REFERENCES[2] },
{ id:'walking', label:'慢慢走来', hint:'向前走一小步，留下自然的瞬间。', image:REFERENCES[3] },
{ id:'with-flowers', label:'与花互动', hint:'轻轻靠近花朵，目光看向花瓣。', image:REFERENCES[4] },
];
function getOptions(tab, category) {
if(tab==='pose') return category==='popular'?[...POSES].reverse():POSES;
if(category==='smart') return COMPOSITIONS;
if(category==='popular') return [...COMPOSITIONS].reverse();
return COMPOSITIONS.filter(item=>item.id===category);
}
function findOption(tab,id) { return (tab==='pose'?POSES:COMPOSITIONS).find(item=>item.id===id); }
const TIMING = { scan:3200, generate:1700, align:1100, cameraTimeout:10000 };


/** @typedef {'idle'|'scanning'|'recommendations'|'aligning'|'generating'|'ready'} Stage */
/** @typedef {'composition'|'pose'} AssistTab */
/** @typedef {{tab: AssistTab, id: string}} AppliedOption */
/** @typedef {{ stage: Stage, mode:'photo'|'live', tab:AssistTab, category:string, selected:string|null, applied:AppliedOption|null, guideVisible:boolean, progress:number, alignment:number, live:boolean, sheet:string|null, filter:'none'|'warm'|'mono', flash:boolean, beauty:number, timer:0|3, countdown:number|null }} AppState */
/** @returns {AppState} */
function initialState() {
 return {stage:'idle', mode:'photo', tab:'composition', category:'smart', selected:null,
 panelCollapsed:false, applied:null, guideVisible:true, progress:0, alignment:0, live:false, sheet:null,
 filter:'none', flash:false, beauty:0, timer:0, countdown:null};
}
const isBusy = s=>['scanning','aligning','generating'].includes(s.stage);
const hasPanel = s=>['recommendations','aligning'].includes(s.stage);
/** Pure transitions. Timers and media effects are owned by main.js. */
function transition(s,e) {
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

/**
 * 自动化流程的资源门控。
 *
 * 背景：Demo 的阶段推进（扫描 → 推荐、对齐 → 生成）原先是纯定时器驱动，
 * 时间一到就直接 dispatch 跳转，完全不管下一屏的图片有没有解码完成，
 * 在手机上就会出现「界面还没显示全就跳到下一步」。
 *
 * 约定：任何由计时器驱动的自动跳转，都必须先 await 目标阶段的资源就绪，
 * 资源就绪之后才开始计时。这样倒计时结束真正跳转的那一刻，下一屏的图片
 * 已经在缓存里，可以整屏一次性渲染出来。
 *
 * 所有等待都带超时兜底：单个资源加载失败或超时一律放行，
 * 绝不让一个 404 把整个演示流程卡死。
 */

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i;
const DEFAULT_TIMEOUT = 6000;

/** url -> Promise，同一个资源只解码一次，重复跳转不再有等待成本 */
const decoded = new Map();

function resolve(url) {
 try { return new URL(url, location.href).href; } catch { return url; }
}

function isRetryable(url) {
 return typeof url === 'string' && IMAGE_EXT.test(url);
}

/**
 * 解码单个资源。onload 之后再调 decode()，确保图片不仅下载完、而且已经解码，
 * 真正绘制时不会卡一帧。
 */
function decodeOne(url, timeout) {
 const key = resolve(url);
 if (decoded.has(key)) return decoded.get(key);

 const task = new Promise(done => {
  const img = new Image();
  let settled = false;
  const finish = () => { if (!settled) { settled = true; done(); } };
  const timer = setTimeout(finish, timeout);

  img.onload = () => {
   clearTimeout(timer);
   // decode() 在个别老浏览器上不存在，退化为 load 事件即可
   const ready = typeof img.decode === 'function' ? img.decode() : Promise.resolve();
   ready.then(finish, finish);
  };
  img.onerror = () => { clearTimeout(timer); finish(); };
  img.src = key;
 });

 decoded.set(key, task);
 return task;
}

/** 批量预加载并解码资源，全部就绪后 resolve。 */
function preload(urls, { timeout = DEFAULT_TIMEOUT } = {}) {
 const list = [...(urls || [])].filter(isRetryable);
 if (!list.length) return Promise.resolve();
 return Promise.all(list.map(url => decodeOne(url, timeout)));
}

/** 双 rAF：确认浏览器已完成一次真实绘制，而不只是更新了 DOM。 */
function nextPaint() {
 return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

/** 等当前 DOM 里的 <img> 全部解码完成（含内联 SVG 素材）。 */
function waitForImages(root = document, { timeout = DEFAULT_TIMEOUT } = {}) {
 const imgs = [...(root.querySelectorAll?.('img') || [])].filter(i => i.getAttribute('src'));
 if (!imgs.length) return nextPaint();

 return Promise.all(imgs.map(img => {
  if (img.complete) {
   const ready = typeof img.decode === 'function' ? img.decode() : Promise.resolve();
   return ready.catch(() => {});
  }
  return new Promise(done => {
   const timer = setTimeout(done, timeout);
   const finish = () => { clearTimeout(timer); done(); };
   img.addEventListener('load', () => {
    const ready = typeof img.decode === 'function' ? img.decode() : Promise.resolve();
    ready.then(finish, finish);
   }, { once: true });
   img.addEventListener('error', finish, { once: true });
  });
 })).then(nextPaint);
}

/** 等待字体就绪，避免文字先用回退字体渲染、再跳位。 */
function fontsReady() {
 return document.fonts?.ready?.catch(() => {}) ?? Promise.resolve();
}

/** 综合门控：字体 + 当前 DOM 图片 + 一次真实绘制。 */
async function waitForVisualReady(root = document, opts = {}) {
 await Promise.all([fontsReady(), waitForImages(root, opts)]);
}

const assetIcon=(file,cls='')=>'<span class="asset-icon '+cls+'" aria-hidden="true"><img src="./assets/icons/'+file+'.svg" alt="" /></span>';
function icon(name,size=22) {
 const paths={
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 back:'<path d="m14 5-7 7 7 7"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
 camera:'<path d="M4 7h4l2-3h4l2 3h4v13H4z"/><circle cx="12" cy="13" r="4"/>',
 grid:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
 timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v5l3 2M9 2h6M18 5l2-2"/>',
 flip:'<path d="M4 9a8 8 0 0 1 13-3l3 3M20 15a8 8 0 0 1-13 3l-3-3M20 4v5h-5M4 20v-5h5"/>',
 gallery:'<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
 help:'<path d="M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3v.1"/><circle cx="12" cy="12" r="9"/>'
 };
 return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.info)+'</svg>';
}
function button(action,label,inner,cls='',extra='') {
 return '<button type="button" data-action="'+action+'" aria-label="'+label+'" class="'+cls+'" '+extra+'>'+inner+'</button>';
}
const aiIcon=()=>assetIcon('19-98','ai-asset');

// Dynamic vector overlays; the static artwork is reused as separate Figma assets.
function renderGuide(id,tab='composition') {
 if(tab==='pose') return '<svg class="composition-guide pose-guide" viewBox="0 0 100 160" preserveAspectRatio="xMidYMid meet"><g><ellipse cx="50" cy="35" rx="9" ry="12"/><path d="M46 47 38 75 42 105 33 145M54 47 63 75 58 105 67 145M43 53 26 78 34 91M57 53 73 73 64 85M38 75h25M42 105h16"/></g></svg>';
 const shapes={
 thirds:'<path d="M33.33 0v100M66.67 0v100M0 33.33h100M0 66.67h100"/><circle cx="33.33" cy="33.33" r="1.8" class="guide-dot"/>',
 diagonal:'<path d="m0 100 100-100M0 0l100 100"/>',
 triangle:'<path d="M50 20 15 80h70z"/><circle cx="50" cy="20" r="1.8" class="guide-dot"/>',
 leading:'<path d="m0 100 50-65 50 65M0 80l50-45 50 45"/>',
 frame:'<rect x="13" y="18" width="74" height="64" rx="2"/><path d="M9 26v-12h12M79 14h12v12M9 74v12h12M79 86h12V74"/>',
 center:'<path d="M50 0v100M0 50h100"/><circle cx="50" cy="50" r="8"/>'
 };
 return '<svg class="composition-guide" viewBox="0 0 100 100" preserveAspectRatio="none"><g>'+(shapes[id]||shapes.thirds)+'</g></svg>';
}



function renderAssistant(s) {
 const messages={
 idle:'检测到构图缺失，是否开启AI辅助',
 scanning:'场景扫描中... <strong>'+s.progress+'%</strong>',
 recommendations:'为你总结了合适的构图...',
 aligning:'请按照连接方式移动手机',
 generating:'连接成功，正在生成构图...',
 ready:'已为你生成最佳构图，快来试试看吧'
 };
 const busy=['scanning','generating'].includes(s.stage);
 return '<div class="assistant-area '+s.stage+'" aria-live="polite"><div class="assistant-bubble"><span>'+messages[s.stage]+'</span>'+
 (s.stage==='idle'?button('start-ai','开启 AI 辅助','开启','enable-button'):'')+
 (busy?button('cancel-ai','取消 AI 分析',icon('close',15),'bubble-close'):'')+
 (s.stage==='ready'?button('disable-ai','关闭 AI 辅助',icon('close',15),'bubble-close'):'')+
 '</div>'+(busy?'<div class="analysis-progress" role="progressbar" aria-label="'+(s.stage==='scanning'?'扫描进度':'生成进度')+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+s.progress+'"><i style="width:'+s.progress+'%"></i></div>':'')+
 (s.stage==='aligning'?'<div class="alignment-instruction">'+(findOption(s.tab,s.selected)?.hint||'')+'</div>':'')+'</div>';
}



function renderPanel(s) {
 const options=getOptions(s.tab,s.category), selected=findOption(s.tab,s.selected), aligning=s.stage==='aligning';
 const tabs=['composition','pose'].map((t,i)=>button('tab',i?'姿势':'构图',i?'姿势':'构图',s.tab===t?'active':'','role="tab" aria-selected="'+(s.tab===t)+'" data-value="'+t+'" '+(aligning?'disabled':''))).join('');
 const categories=CATEGORIES.filter(c=>s.tab==='composition'||['smart','popular'].includes(c.id)).map(c=>button('category',c.label,(c.id==='smart'?assetIcon('19-395','tiny-ai'):'')+c.label,s.category===c.id?'selected':'','role="tab" aria-selected="'+(s.category===c.id)+'" data-value="'+c.id+'"')).join('');
 const cards=options.map((o,i)=>button('select','选择'+o.label,'<img src="'+o.image+'" alt="'+o.label+'参考" /><span class="reference-title">'+o.label+'</span>'+(s.selected===o.id?'<span class="selected-check">'+icon('check',12)+'</span>':'')+(i===0&&s.category==='smart'?'<span class="recommend-tag">推荐</span>':''),'reference-card '+(s.selected===o.id?'selected':''),'data-value="'+o.id+'" aria-pressed="'+(s.selected===o.id)+'"')).join('');
 return '<section class="recommendation-panel" aria-label="AI 推荐面板" data-testid="recommendation-panel"><div class="panel-handle"></div><div class="panel-heading">'+
 button('back','收起推荐面板',icon('back',20),'panel-back')+'<div class="panel-tabs" role="tablist" aria-label="辅助类型">'+tabs+'</div>'+
 button('disable-ai','关闭 AI 辅助',icon('close',18),'panel-close')+'</div>'+
 (!aligning?'<div class="category-list" role="tablist" aria-label="推荐分类">'+categories+'</div><div class="reference-list" role="group" aria-label="'+(s.tab==='pose'?'姿势':'构图')+'方案">'+cards+'</div><div class="panel-footer"><p>'+(selected?.hint||'选择一个喜欢的方案，再应用到取景画面。')+'</p>'+button('apply','应用辅助','应用辅助 '+icon('check',16),'primary-button apply-button',s.selected?'':'disabled')+'</div>':
 '<div class="align-summary"><span class="align-option">'+(selected?.label||'')+'</span><p>拖动取景框中的光点至圆环，或点击模拟对齐。</p></div><div class="panel-footer"><span class="alignment-value">对齐进度 <b>'+s.alignment+'%</b></span>'+button('simulate-align','模拟对齐','模拟对齐','primary-button')+'</div>')+'</section>';
}

// Generated from docs/full-audit/inventory.json. Run node scripts/generate-design-layout.mjs.
const ASSIST_DESIGNS = {
  "recommendations": {
    "frameId": "19:352",
    "width": 264.3290710449219,
    "height": 576.4695434570312,
    "frames": {
      "outer": {
        "id": "19:353",
        "x": -2.9200432300567627,
        "y": -2.4256224632263184,
        "width": 268.7131652832031,
        "height": 581.54345703125,
        "cornerRadius": 13.660417556762695
      },
      "inner": {
        "id": "19:354",
        "x": -3.6155319809913635,
        "y": -2.3610106483101845,
        "width": 269.0160217285156,
        "height": 582.1989135742188,
        "cornerRadius": 13.796182632446289
      },
      "background": {
        "id": "19:355",
        "x": -4.33209615945816,
        "y": -2.8614378944039345,
        "width": 270.0198669433594,
        "height": 583.20263671875
      }
    },
    "slots": {
      "close": {
        "id": "19:409",
        "x": 13.787666702264687,
        "y": 39.98000411987596,
        "width": 11.061544418334961,
        "height": 11.064579963684082,
        "asset": "./assets/design/19-409.svg"
      },
      "flip": {
        "id": "19:424",
        "x": 231.69666195463287,
        "y": 208.89060994805186,
        "width": 23.515464782714844,
        "height": 23.18274688720703,
        "asset": "./assets/design/19-424.svg"
      },
      "flash": {
        "id": "19:427",
        "x": 234.77630615234375,
        "y": 248.07789611816406,
        "width": 17.54791259765625,
        "height": 21.361223220825195,
        "asset": "./assets/design/19-427.svg"
      },
      "filters": {
        "id": "19:412",
        "x": 234.77630615234375,
        "y": 287.7659912109375,
        "width": 17.4375,
        "height": 17.376953125,
        "color": "rgba(255,255,255,0.8999999761581421)",
        "asset": "./assets/design/19-412.svg"
      },
      "beauty": {
        "id": "19:417",
        "x": 235.56378173828125,
        "y": 326.233154296875,
        "width": 15.669937133789062,
        "height": 15.669937133789062,
        "asset": "./assets/design/19-417.svg"
      },
      "bubble": {
        "id": "19:363",
        "x": 18.929936921596436,
        "y": 361.1655499562621,
        "width": 115.0430908203125,
        "height": 42.629581451416016,
        "cornerRadius": 2.0247552394866943,
        "strokeWeight": 0.3456000089645386,
        "color": "rgba(0,0,0,0.20000000298023224)",
        "asset": "./assets/design/19-363.svg"
      },
      "message": {
        "id": "19:364",
        "x": 26.67832177877426,
        "y": 368.8225831016898,
        "width": 99,
        "height": 13,
        "fontSize": 9.111400604248047,
        "fontWeight": 500,
        "text": "为你总结了合适的构图...",
        "color": "rgba(255,255,255,0.8999999761581421)"
      },
      "ai": {
        "id": "19:365",
        "x": 37.20539087057114,
        "y": 411.9573487266898,
        "width": 25.377321243286133,
        "height": 25.380407333374023,
        "asset": "./assets/design/19-365.svg"
      },
      "aiLabel": {
        "id": "19:374",
        "x": 38.59723657369614,
        "y": 441.3382081016898,
        "width": 21,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "AI点点",
        "color": "rgba(255,255,255,0.8999999761581421)"
      },
      "shutter": {
        "id": "19:356",
        "x": 101.26286309957504,
        "y": 399.9701661095023,
        "width": 58.829898834228516,
        "height": 58.829898834228516
      },
      "shutterCore": {
        "id": "19:357",
        "x": 106.38532489538193,
        "y": 405.09204091876745,
        "width": 48.5844612121582,
        "height": 48.5844612121582,
        "color": "rgba(255,255,255,0.8999999761581421)"
      },
      "shutterRing": {
        "id": "19:358",
        "x": 101.26284555196617,
        "y": 399.9701661095023,
        "width": 58.829898834228516,
        "height": 58.829898834228516,
        "strokeWeight": 2.732083559036255
      },
      "vlog": {
        "id": "19:431",
        "x": 193.91664123535156,
        "y": 411.408935546875,
        "width": 32.038612365722656,
        "height": 32.038612365722656,
        "asset": "./assets/design/19-431.svg"
      },
      "vlogLabel": {
        "id": "19:430",
        "x": 193.9165802001953,
        "y": 443.9208679199219,
        "width": 32,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "mini Vlog",
        "color": "rgba(255,255,255,0.8999999761581421)"
      },
      "panel": {
        "id": "19:375",
        "x": -6.604747772216797,
        "y": 474.2568054199219,
        "width": 280.11553955078125,
        "height": 109.13945007324219,
        "cornerRadius": "mixed",
        "color": "rgba(0,0,0,1)"
      },
      "compositionTab": {
        "id": "19:385",
        "x": 78.35863494873047,
        "y": 478.2572021484375,
        "width": 19,
        "height": 13,
        "fontSize": 9.562292098999023,
        "fontWeight": 600,
        "text": "构图",
        "color": "rgba(255,255,255,0.8999999761581421)"
      },
      "poseTab": {
        "id": "19:386",
        "x": 180.38584899902344,
        "y": 478.2572021484375,
        "width": 19,
        "height": 13,
        "fontSize": 9.562292098999023,
        "fontWeight": 600,
        "text": "姿势",
        "color": "rgba(255,255,255,0.6000000238418579)"
      },
      "tabIndicator": {
        "id": "19:383",
        "x": 78.856201171875,
        "y": 491.9190979003906,
        "width": 18.129732131958008,
        "height": 2.0784108638763428,
        "cornerRadius": 1.039205551147461
      },
      "smartPill": {
        "id": "19:382",
        "x": 10.356428146362305,
        "y": 502.0081787109375,
        "width": 47.04989242553711,
        "height": 14.32409381866455,
        "cornerRadius": 7.162046432495117,
        "color": "rgba(40,40,40,1)"
      },
      "smartIcon": {
        "id": "19:395",
        "x": 14.895270347595215,
        "y": 504.5196838378906,
        "width": 9.221495628356934,
        "height": 9.225423812866211,
        "asset": "./assets/design/19-395.svg"
      },
      "none": {
        "id": "19:378",
        "x": 10.356428146362305,
        "y": 526.0513305664062,
        "width": 37.575069427490234,
        "height": 37.575069427490234,
        "cornerRadius": 7.805952548980713,
        "color": "rgba(26,26,26,1)"
      },
      "noneIcon": {
        "id": "19:404",
        "x": 22.423200607299805,
        "y": 538.2529296875,
        "width": 13.441254615783691,
        "height": 13.16206169128418,
        "asset": "./assets/design/19-404.svg"
      }
    },
    "categories": [
      {
        "id": "19:387",
        "x": 25.698890686035156,
        "y": 504.171630859375,
        "width": 27,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "智能推荐"
      },
      {
        "id": "19:388",
        "x": 67.69561004638672,
        "y": 504.171630859375,
        "width": 14,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "热门",
        "color": "rgba(122,121,121,1)"
      },
      {
        "id": "19:389",
        "x": 91.64558410644531,
        "y": 504.171630859375,
        "width": 21,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "三分线",
        "color": "rgba(122,121,121,1)"
      },
      {
        "id": "19:390",
        "x": 122.4249038696289,
        "y": 504.171630859375,
        "width": 21,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "对角线",
        "color": "rgba(122,121,121,1)"
      },
      {
        "id": "19:391",
        "x": 153.2050323486328,
        "y": 504.171630859375,
        "width": 21,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "三角形",
        "color": "rgba(122,121,121,1)"
      },
      {
        "id": "19:392",
        "x": 183.9844207763672,
        "y": 504.171630859375,
        "width": 21,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "引导线",
        "color": "rgba(122,121,121,1)"
      },
      {
        "id": "19:393",
        "x": 214.76406860351562,
        "y": 504.171630859375,
        "width": 14,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "框架",
        "color": "rgba(122,121,121,1)"
      },
      {
        "id": "19:394",
        "x": 238.7128448486328,
        "y": 504.171630859375,
        "width": 14,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "居中",
        "color": "rgba(122,121,121,1)"
      }
    ],
    "cards": [
      {
        "id": "19:381",
        "x": 54.10687255859375,
        "y": 526.0513305664062,
        "width": 37.575069427490234,
        "height": 37.575069427490234,
        "cornerRadius": 7.805952548980713,
        "strokeWeight": 1.0245312452316284
      },
      {
        "id": "19:377",
        "x": 97.85718536376953,
        "y": 526.0513305664062,
        "width": 37.575069427490234,
        "height": 37.575069427490234,
        "cornerRadius": 7.805952548980713
      },
      {
        "id": "19:379",
        "x": 141.60755920410156,
        "y": 526.0513305664062,
        "width": 37.575069427490234,
        "height": 37.575069427490234,
        "cornerRadius": 7.805952548980713
      },
      {
        "id": "19:380",
        "x": 185.35787963867188,
        "y": 526.0513305664062,
        "width": 37.575069427490234,
        "height": 37.575069427490234,
        "cornerRadius": 7.805952548980713
      },
      {
        "id": "19:376",
        "x": 229.10824584960938,
        "y": 526.0513305664062,
        "width": 37.575199127197266,
        "height": 37.575069427490234,
        "cornerRadius": 7.805952548980713,
        "asset": "./assets/design/19-376.svg"
      }
    ]
  },
  "aligning": {
    "frameId": "19:437",
    "width": 264.3290710449219,
    "height": 576.4695434570312,
    "frames": {
      "outer": {
        "id": "19:438",
        "x": -2.663738250732422,
        "y": -2.4256224632263184,
        "width": 268.7131652832031,
        "height": 581.54345703125,
        "cornerRadius": 13.660417556762695
      },
      "inner": {
        "id": "19:439",
        "x": -3.3597458004951477,
        "y": -2.3610106483101845,
        "width": 269.0160217285156,
        "height": 582.1989135742188,
        "cornerRadius": 13.796182632446289
      },
      "background": {
        "id": "19:440",
        "x": -4.07566910982132,
        "y": -2.3608519569097552,
        "width": 270.0198669433594,
        "height": 583.20263671875
      }
    },
    "slots": {
      "close": {
        "id": "19:466",
        "x": 12.055335998535156,
        "y": 39.98313293454703,
        "width": 5.761921405792236,
        "height": 9.608562469482422,
        "asset": "./assets/design/19-466.svg"
      },
      "flip": {
        "id": "19:516",
        "x": 231.46464596342412,
        "y": 208.89060994805186,
        "width": 23.515342712402344,
        "height": 23.18274688720703,
        "asset": "./assets/design/19-516.svg"
      },
      "flash": {
        "id": "19:519",
        "x": 234.54437255859375,
        "y": 248.07789611816406,
        "width": 17.54791259765625,
        "height": 21.361223220825195,
        "asset": "./assets/design/19-519.svg"
      },
      "filters": {
        "id": "19:504",
        "x": 234.5442352294922,
        "y": 287.7659912109375,
        "width": 17.4375,
        "height": 17.376953125,
        "color": "rgba(255,255,255,0.8999999761581421)",
        "asset": "./assets/design/19-504.svg"
      },
      "beauty": {
        "id": "19:509",
        "x": 235.33230590820312,
        "y": 326.233154296875,
        "width": 15.669937133789062,
        "height": 15.669937133789062,
        "asset": "./assets/design/19-509.svg"
      },
      "bubble": {
        "id": "19:451",
        "x": 25.71333006620398,
        "y": 361.1655499562621,
        "width": 115.1266860961914,
        "height": 42.629581451416016,
        "cornerRadius": 2.0247552394866943,
        "strokeWeight": 0.3456000089645386,
        "color": "rgba(0,0,0,0.20000000298023224)",
        "asset": "./assets/design/19-451.svg"
      },
      "message": {
        "id": "19:452",
        "x": 33.461714923381805,
        "y": 368.8225831016898,
        "width": 99,
        "height": 13,
        "fontSize": 9.111400604248047,
        "fontWeight": 500,
        "text": "请按照连接方式移动手机",
        "color": "rgba(255,255,255,0.8999999761581421)"
      },
      "ai": {
        "id": "19:453",
        "x": 43.98878401517868,
        "y": 411.9573487266898,
        "width": 25.377321243286133,
        "height": 25.380407333374023,
        "asset": "./assets/design/19-453.svg"
      },
      "aiLabel": {
        "id": "19:462",
        "x": 45.38062971830368,
        "y": 441.3382081016898,
        "width": 21,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "AI点点",
        "color": "rgba(255,255,255,0.8999999761581421)"
      },
      "shutter": {
        "id": "19:444",
        "x": 101.73327177762985,
        "y": 399.9701661095023,
        "width": 58.829898834228516,
        "height": 58.829898834228516
      },
      "shutterCore": {
        "id": "19:445",
        "x": 106.85595339536667,
        "y": 405.09204091876745,
        "width": 48.5844612121582,
        "height": 48.5844612121582,
        "color": "rgba(255,255,255,0.8999999761581421)"
      },
      "shutterRing": {
        "id": "19:446",
        "x": 101.73327254056858,
        "y": 399.9701661095023,
        "width": 58.829898834228516,
        "height": 58.829898834228516,
        "strokeWeight": 2.732083559036255
      },
      "vlog": {
        "id": "19:523",
        "x": 193.6852569580078,
        "y": 411.408935546875,
        "width": 32.038612365722656,
        "height": 32.038612365722656,
        "asset": "./assets/design/19-523.svg"
      },
      "vlogLabel": {
        "id": "19:522",
        "x": 193.6852569580078,
        "y": 443.9208679199219,
        "width": 32,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "mini Vlog",
        "color": "rgba(255,255,255,0.8999999761581421)"
      },
      "panel": {
        "id": "19:472",
        "x": -8.356830406191875,
        "y": 474.25762329099234,
        "width": 280.11553955078125,
        "height": 109.13945007324219,
        "cornerRadius": "mixed",
        "color": "rgba(0,0,0,1)"
      },
      "compositionTab": {
        "id": "19:482",
        "x": 76.60642337799072,
        "y": 478.25813579559326,
        "width": 19,
        "height": 13,
        "fontSize": 9.562292098999023,
        "fontWeight": 600,
        "text": "构图",
        "color": "rgba(255,255,255,0.8999999761581421)"
      },
      "poseTab": {
        "id": "19:483",
        "x": 178.63369846343994,
        "y": 478.25813579559326,
        "width": 19,
        "height": 13,
        "fontSize": 9.562292098999023,
        "fontWeight": 600,
        "text": "姿势",
        "color": "rgba(255,255,255,0.6000000238418579)"
      },
      "tabIndicator": {
        "id": "19:480",
        "x": 77.10418796539307,
        "y": 491.91790199279785,
        "width": 18.129732131958008,
        "height": 2.0784108638763428,
        "cornerRadius": 1.039205551147461
      },
      "smartPill": {
        "id": "19:479",
        "x": 8.604348182678223,
        "y": 502.0091133117676,
        "width": 47.04989242553711,
        "height": 14.32409381866455,
        "cornerRadius": 7.162046432495117,
        "color": "rgba(40,40,40,1)"
      },
      "smartIcon": {
        "id": "19:492",
        "x": 13.143128395080566,
        "y": 504.5231513977051,
        "width": 9.221495628356934,
        "height": 9.225423812866211,
        "asset": "./assets/design/19-492.svg"
      },
      "none": {
        "id": "19:475",
        "x": 8.604348182678223,
        "y": 526.047981262207,
        "width": 37.575069427490234,
        "height": 37.575069427490234,
        "cornerRadius": 7.805952548980713,
        "color": "rgba(26,26,26,1)"
      },
      "noneIcon": {
        "id": "19:501",
        "x": 20.67143154144287,
        "y": 538.2538642883301,
        "width": 13.441254615783691,
        "height": 13.16206169128418,
        "asset": "./assets/design/19-501.svg"
      },
      "movingDot": {
        "id": "19:441",
        "x": 128.5324050784111,
        "y": 250.9270447716117,
        "width": 12.6422700881958,
        "height": 12.6422700881958,
        "color": "rgba(238,238,238,0.800000011920929)",
        "asset": "./assets/design/19-441.svg"
      },
      "targetDot": {
        "id": "19:442",
        "x": 128.5324050784111,
        "y": 195.75301828235388,
        "width": 12.223957061767578,
        "height": 12.223957061767578,
        "asset": "./assets/design/19-442.svg"
      },
      "targetRing": {
        "id": "19:443",
        "x": 126.81325834989548,
        "y": 194.0364197716117,
        "width": 15.662405967712402,
        "height": 15.662405967712402,
        "strokeWeight": 0.7805952429771423,
        "asset": "./assets/design/19-443.svg",
        "paintOffset": {
          "x": -0.390258349895477,
          "y": -0.390309771611702
        }
      },
      "connector": {
        "id": "19:463",
        "x": 134.64433670043945,
        "y": 212.44191598892212,
        "width": 0,
        "height": 36.84481430053711,
        "strokeWeight": 1.707552194595337,
        "asset": "./assets/design/19-463.svg",
        "paintOffset": {
          "x": -0.8537760972976685,
          "y": 0
        }
      },
      "arrow": {
        "id": "19:528",
        "x": 130.19305419921875,
        "y": 212.2732391357422,
        "width": 8.252544403076172,
        "height": 3.6996092796325684,
        "strokeWeight": 1.5399999618530273,
        "asset": "./assets/design/19-528.svg",
        "paintOffset": {
          "x": -0.485596,
          "y": -1.0355507203674312
        }
      }
    },
    "categories": [
      {
        "id": "19:484",
        "x": 23.946743965148926,
        "y": 504.1682929992676,
        "width": 27,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "智能推荐"
      },
      {
        "id": "19:485",
        "x": 65.94365787506104,
        "y": 504.1682929992676,
        "width": 14,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "热门",
        "color": "rgba(122,121,121,1)"
      },
      {
        "id": "19:486",
        "x": 89.89316654205322,
        "y": 504.1682929992676,
        "width": 21,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "三分线",
        "color": "rgba(122,121,121,1)"
      },
      {
        "id": "19:487",
        "x": 120.67315769195557,
        "y": 504.1682929992676,
        "width": 21,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "对角线",
        "color": "rgba(122,121,121,1)"
      },
      {
        "id": "19:488",
        "x": 151.45301914215088,
        "y": 504.1682929992676,
        "width": 21,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "三角形",
        "color": "rgba(122,121,121,1)"
      },
      {
        "id": "19:489",
        "x": 182.23220920562744,
        "y": 504.1682929992676,
        "width": 21,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "引导线",
        "color": "rgba(122,121,121,1)"
      },
      {
        "id": "19:490",
        "x": 213.0119333267212,
        "y": 504.1682929992676,
        "width": 14,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "框架",
        "color": "rgba(122,121,121,1)"
      },
      {
        "id": "19:491",
        "x": 236.96083164215088,
        "y": 504.1682929992676,
        "width": 14,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "居中",
        "color": "rgba(122,121,121,1)"
      }
    ],
    "cards": [
      {
        "id": "19:478",
        "x": 52.35472583770752,
        "y": 526.047981262207,
        "width": 37.575069427490234,
        "height": 37.575069427490234,
        "cornerRadius": 7.805952548980713,
        "strokeWeight": 1.0245312452316284
      },
      {
        "id": "19:474",
        "x": 96.10510349273682,
        "y": 526.047981262207,
        "width": 37.575069427490234,
        "height": 37.575069427490234,
        "cornerRadius": 7.805952548980713
      },
      {
        "id": "19:476",
        "x": 139.85548496246338,
        "y": 526.047981262207,
        "width": 37.575069427490234,
        "height": 37.575069427490234,
        "cornerRadius": 7.805952548980713
      },
      {
        "id": "19:477",
        "x": 183.60572910308838,
        "y": 526.047981262207,
        "width": 37.575069427490234,
        "height": 37.575069427490234,
        "cornerRadius": 7.805952548980713
      },
      {
        "id": "19:473",
        "x": 227.35583591461182,
        "y": 526.047981262207,
        "width": 37.575199127197266,
        "height": 37.575069427490234,
        "cornerRadius": 7.805952548980713,
        "asset": "./assets/design/19-473.svg"
      }
    ]
  },
  "generating": {
    "frameId": "19:530",
    "width": 264.3290710449219,
    "height": 576.4695434570312,
    "frames": {
      "outer": {
        "id": "19:531",
        "x": -2.8950798511505127,
        "y": -2.4256224632263184,
        "width": 268.7131652832031,
        "height": 581.54345703125,
        "cornerRadius": 13.660417556762695
      },
      "inner": {
        "id": "19:532",
        "x": -3.5910996198654175,
        "y": -2.3610106483101845,
        "width": 269.0160217285156,
        "height": 582.1989135742188,
        "cornerRadius": 13.796182632446289
      },
      "background": {
        "id": "19:533",
        "x": -4.307175517082214,
        "y": -2.3608519569097552,
        "width": 270.0198669433594,
        "height": 583.20263671875,
        "asset": "./assets/design/19-533.svg",
        "paintOffset": {
          "x": 1.4120956659317017,
          "y": 0
        }
      }
    },
    "slots": {
      "close": {
        "id": "19:588",
        "x": 12.117237472528359,
        "y": 39.98313293454703,
        "width": 5.76194429397583,
        "height": 9.608562469482422,
        "asset": "./assets/design/19-588.svg"
      },
      "flip": {
        "id": "19:574",
        "x": 231.68809398771555,
        "y": 208.89297825202812,
        "width": 23.515464782714844,
        "height": 23.178443908691406,
        "asset": "./assets/design/19-574.svg"
      },
      "flash": {
        "id": "19:577",
        "x": 234.76882934570312,
        "y": 248.07789611816406,
        "width": 17.54791259765625,
        "height": 21.361223220825195,
        "asset": "./assets/design/19-577.svg"
      },
      "filters": {
        "id": "19:562",
        "x": 234.76882934570312,
        "y": 287.7659912109375,
        "width": 17.4375,
        "height": 17.376953125,
        "color": "rgba(255,255,255,0.8999999761581421)",
        "asset": "./assets/design/19-562.svg"
      },
      "beauty": {
        "id": "19:567",
        "x": 235.55650329589844,
        "y": 326.233154296875,
        "width": 15.669937133789062,
        "height": 15.669937133789062,
        "asset": "./assets/design/19-567.svg"
      },
      "bubble": {
        "id": "19:556",
        "x": 21.116173481941132,
        "y": 416.22219056932954,
        "width": 126.25565338134766,
        "height": 42.629581451416016,
        "cornerRadius": 2.0247552394866943,
        "strokeWeight": 0.3456000089645386,
        "color": "rgba(0,0,0,0.20000000298023224)",
        "asset": "./assets/design/19-556.svg"
      },
      "message": {
        "id": "19:557",
        "x": 28.864558339118958,
        "y": 423.8792237266898,
        "width": 108,
        "height": 13,
        "fontSize": 9.111400604248047,
        "fontWeight": 500,
        "text": "连接成功，正在生成构图...",
        "color": "rgba(255,255,255,0.8999999761581421)"
      },
      "ai": {
        "id": "19:543",
        "x": 40.47024071216583,
        "y": 467.1389893516898,
        "width": 25.377321243286133,
        "height": 25.380407333374023,
        "asset": "./assets/design/19-543.svg"
      },
      "aiLabel": {
        "id": "19:552",
        "x": 41.86205589771271,
        "y": 496.5198487266898,
        "width": 21,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "AI点点",
        "color": "rgba(255,255,255,0.8999999761581421)"
      },
      "shutter": {
        "id": "19:559",
        "x": 101.4229736328125,
        "y": 455.86712646484375,
        "width": 58.829898834228516,
        "height": 58.829898834228516
      },
      "shutterCore": {
        "id": "19:560",
        "x": 106.54538631439209,
        "y": 460.988995552063,
        "width": 48.5844612121582,
        "height": 48.5844612121582,
        "color": "rgba(255,255,255,0.8999999761581421)"
      },
      "shutterRing": {
        "id": "19:561",
        "x": 101.42297439575214,
        "y": 455.86712036130484,
        "width": 58.829898834228516,
        "height": 58.829898834228516,
        "strokeWeight": 2.732083559036255
      },
      "vlog": {
        "id": "19:581",
        "x": 193.9091796875,
        "y": 463.75927734375,
        "width": 32.038612365722656,
        "height": 32.038612365722656,
        "asset": "./assets/design/19-581.svg"
      },
      "vlogLabel": {
        "id": "19:580",
        "x": 193.90945434570312,
        "y": 496.2718505859375,
        "width": 32,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "mini Vlog",
        "color": "rgba(255,255,255,0.8999999761581421)"
      },
      "window": {
        "id": "19:535",
        "x": 50.97588264942169,
        "y": 106.33852853626013,
        "width": 154.8612823486328,
        "height": 218.31918334960938,
        "asset": "./assets/design/19-535.svg"
      },
      "outline": {
        "id": "19:534",
        "x": 50.97588264942169,
        "y": 106.33934488147497,
        "width": 154.8612823486328,
        "height": 218.31918334960938,
        "cornerRadius": 4.098124980926514,
        "strokeWeight": 2.049062490463257,
        "asset": "./assets/design/19-534.svg",
        "paintOffset": {
          "x": -2.049062490463257,
          "y": -2.049062490463257
        }
      },
      "success": {
        "id": "19:538",
        "x": 120.4559508562088,
        "y": 192.05125131458044,
        "width": 20.9215145111084,
        "height": 20.921512603759766,
        "asset": "./assets/design/19-538.svg",
        "paintOffset": {
          "x": -10.9283427444458,
          "y": -10.928343698120116
        }
      }
    }
  },
  "ready": {
    "frameId": "19:150",
    "width": 264.3290710449219,
    "height": 576.4695434570312,
    "frames": {
      "outer": {
        "id": "19:151",
        "x": -2.1868278980255127,
        "y": -1.448083519935608,
        "width": 267.8114318847656,
        "height": 579.5919189453125,
        "cornerRadius": 13.660417556762695
      },
      "inner": {
        "id": "19:152",
        "x": -2.648667961359024,
        "y": -2.361987352371216,
        "width": 269.0160217285156,
        "height": 582.1989135742188,
        "cornerRadius": 13.796182632446289
      },
      "background": {
        "id": "19:153",
        "x": -3.3641457259655,
        "y": -2.3618286609707866,
        "width": 270.0198669433594,
        "height": 583.20263671875
      }
    },
    "slots": {
      "close": {
        "id": "19:175",
        "x": 13.788673400878906,
        "y": 39.98000411987596,
        "width": 11.061544418334961,
        "height": 11.064579963684082,
        "asset": "./assets/design/19-175.svg"
      },
      "flip": {
        "id": "19:180",
        "x": 231.56628458946943,
        "y": 208.8856299915351,
        "width": 23.515953063964844,
        "height": 23.18273162841797,
        "asset": "./assets/design/19-180.svg"
      },
      "flash": {
        "id": "19:183",
        "x": 234.64617919921875,
        "y": 248.07789611816406,
        "width": 17.54791259765625,
        "height": 21.361223220825195,
        "asset": "./assets/design/19-183.svg"
      },
      "filters": {
        "id": "19:186",
        "x": 234.64523315429688,
        "y": 287.7659912109375,
        "width": 17.4384765625,
        "height": 17.376953125,
        "color": "rgba(255,255,255,0.8999999761581421)",
        "asset": "./assets/design/19-186.svg"
      },
      "beauty": {
        "id": "19:191",
        "x": 235.43399047851562,
        "y": 326.233154296875,
        "width": 15.669937133789062,
        "height": 15.669937133789062,
        "asset": "./assets/design/19-191.svg"
      },
      "bubble": {
        "id": "19:171",
        "x": 19.634044593572526,
        "y": 416.2212138652685,
        "width": 161.65281677246094,
        "height": 42.629581451416016,
        "cornerRadius": 2.0247552394866943,
        "strokeWeight": 0.3456000089645386,
        "color": "rgba(0,0,0,0.20000000298023224)",
        "asset": "./assets/design/19-171.svg"
      },
      "message": {
        "id": "19:172",
        "x": 27.38242945075035,
        "y": 423.8782470226288,
        "width": 144,
        "height": 13,
        "fontSize": 9.111400604248047,
        "fontWeight": 500,
        "text": "已为你生成最佳构图，快来试试看吧",
        "color": "rgba(255,255,255,0.8999999761581421)"
      },
      "ai": {
        "id": "19:158",
        "x": 38.988111823797226,
        "y": 467.1380126476288,
        "width": 25.377321243286133,
        "height": 25.380407333374023,
        "asset": "./assets/design/19-158.svg"
      },
      "aiLabel": {
        "id": "19:167",
        "x": 40.3799270093441,
        "y": 496.5188720226288,
        "width": 21,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "AI点点",
        "color": "rgba(255,255,255,0.8999999761581421)"
      },
      "shutter": {
        "id": "19:197",
        "x": 101.30045318603516,
        "y": 455.86712646484375,
        "width": 58.829898834228516,
        "height": 58.829898834228516
      },
      "shutterCore": {
        "id": "19:198",
        "x": 106.423171043396,
        "y": 460.988995552063,
        "width": 48.5844612121582,
        "height": 48.5844612121582,
        "color": "rgba(255,255,255,0.8999999761581421)"
      },
      "shutterRing": {
        "id": "19:199",
        "x": 101.30049057006909,
        "y": 455.86712036130484,
        "width": 58.829898834228516,
        "height": 58.829898834228516,
        "strokeWeight": 2.732083559036255
      },
      "vlog": {
        "id": "19:200",
        "x": 193.78668212890625,
        "y": 463.75927734375,
        "width": 32.038612365722656,
        "height": 32.038612365722656,
        "asset": "./assets/design/19-200.svg"
      },
      "vlogLabel": {
        "id": "19:205",
        "x": 193.78692626953125,
        "y": 496.2718505859375,
        "width": 32,
        "height": 10,
        "fontSize": 6.830208778381348,
        "fontWeight": 600,
        "text": "mini Vlog",
        "color": "rgba(255,255,255,0.8999999761581421)"
      },
      "photo": {
        "id": "19:154",
        "x": -74.84158483147621,
        "y": -2.3618286609707866,
        "width": 412.973876953125,
        "height": 582.1991577148438,
        "asset": "./assets/design/19-154.svg",
        "paintOffset": {
          "x": 72.6547569334507,
          "y": 0.9137451410351787
        }
      }
    }
  }
};




/** 递归收集布局数据里的所有 asset 字段（slots / frames / cards / categories 都会覆盖到）。 */
function collect(value, out) {
 if (!value || typeof value !== 'object') return;
 if (Array.isArray(value)) { value.forEach(item => collect(item, out)); return; }
 for (const [key, item] of Object.entries(value)) {
  if (key === 'asset' && typeof item === 'string') out.add(item);
  else collect(item, out);
 }
}

/** 推荐缩略图来自数据层（REFERENCES），不在布局数据里，需要单独叠加。 */
const THUMB_STAGES = ['recommendations', 'aligning', 'generating', 'ready'];

/**
 * 列出某个阶段渲染时需要的静态资源。
 * 传 state 是为了拿到当前的 tab / category，从而确定该加载哪几张推荐缩略图。
 */
function collectStageAssets(stage, state) {
 const urls = new Set();
 const design = ASSIST_DESIGNS[stage];
 if (design) collect(design, urls);

 if (THUMB_STAGES.includes(stage) && state) {
  try {
   getOptions(state.tab, state.category).forEach(option => { if (option?.image) urls.add(option.image); });
  } catch { /* 数据异常时忽略，交给超时兜底 */ }
 }
 return urls;
}

/** 预热除当前阶段外的其余阶段，让后续自动跳转零等待。空闲时执行，不影响首屏。 */
function warmStages(currentStage, state) {
 const stages = Object.keys(ASSIST_DESIGNS).filter(name => name !== currentStage);
 const run = () => stages.forEach(stage => { preload(collectStageAssets(stage, state)).catch(() => {}); });
 if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 2000 });
 else setTimeout(run, 800);
}

// Live Figma 19:207, 2026-10-26. Coordinates are relative to its outer frame.
const SCANNING_DESIGN = {
  "width": 264.3290710449219,
  "height": 576.4695434570312,
  "frameId": "19:207",
  "frames": {
    "outer": {
      "id": "19:208",
      "x": -3.176598310470581,
      "y": -2.4256224632263184,
      "width": 268.7131652832031,
      "height": 581.54345703125,
      "cornerRadius": 13.660417556762695
    },
    "inner": {
      "id": "19:209",
      "x": -3.872282385826111,
      "y": -2.3610106483101845,
      "width": 269.0160217285156,
      "height": 582.1989135742188,
      "cornerRadius": 13.796182632446289
    },
    "background": {
      "id": "19:210",
      "x": -4.58855664730072,
      "y": -2.3608519569097552,
      "width": 270.0198669433594,
      "height": 583.20263671875
    }
  },
  "slots": {
    "close": {
      "id": "19:238",
      "x": 13.788077926634287,
      "y": 39.98000411987596,
      "width": 11.061544418334961,
      "height": 11.064579963684082
    },
    "flip": {
      "id": "19:223",
      "x": 232.28981173038483,
      "y": 209.3945282921195,
      "width": 23.515769958496094,
      "height": 23.180580139160156
    },
    "flash": {
      "id": "19:226",
      "x": 235.36885225772858,
      "y": 248.57664193958044,
      "width": 17.54791259765625,
      "height": 21.361223220825195
    },
    "filters": {
      "id": "19:212",
      "x": 235.36918795108795,
      "y": 288.26804818958044,
      "width": 17.4375,
      "height": 17.375
    },
    "beauty": {
      "id": "19:217",
      "x": 236.15690767765045,
      "y": 326.7393311485648,
      "width": 15.669937133789062,
      "height": 15.669937133789062
    },
    "bubble": {
      "id": "19:344",
      "x": 22.1688819885253,
      "y": 416.2218730926397,
      "width": 116.90435791015625,
      "height": 42.629581451416016,
      "cornerRadius": 2.0247552394866943,
      "strokeWeight": 0.3456000089645386
    },
    "message": {
      "id": "19:349",
      "x": 29.917266845703125,
      "y": 423.87890625,
      "width": 54,
      "height": 13,
      "fontSize": 9.111400604248047
    },
    "progress": {
      "id": "19:350",
      "x": 94.49456024169922,
      "y": 423.87890625,
      "width": 19,
      "height": 13,
      "fontSize": 9.111400604248047
    },
    "cancel": {
      "id": "19:345",
      "x": 120.34064483642578,
      "y": 426.03692626953125,
      "width": 8.849228858947754,
      "height": 8.850714683532715
    },
    "ai": {
      "id": "19:331",
      "x": 41.52294921875,
      "y": 467.138671875,
      "width": 25.377321243286133,
      "height": 25.380407333374023
    },
    "aiLabel": {
      "id": "19:340",
      "x": 42.914764404296875,
      "y": 496.51953125,
      "width": 21,
      "height": 10,
      "fontSize": 6.830208778381348
    },
    "shutter": {
      "id": "19:230",
      "x": 101.42359924316406,
      "y": 455.86712646484375,
      "width": 58.829898834228516,
      "height": 58.829898834228516
    },
    "shutterCore": {
      "id": "19:231",
      "x": 106.54633855819702,
      "y": 460.988995552063,
      "width": 48.5844612121582,
      "height": 48.5844612121582
    },
    "shutterRing": {
      "id": "19:232",
      "x": 101.42359085082717,
      "y": 455.86712036130484,
      "width": 58.829898834228516,
      "height": 58.829898834228516,
      "strokeWeight": 2.732083559036255
    },
    "vlog": {
      "id": "19:242",
      "x": 193.91004943847656,
      "y": 463.75927734375,
      "width": 32.038612365722656,
      "height": 32.038612365722656
    },
    "vlogLabel": {
      "id": "19:241",
      "x": 193.91004943847656,
      "y": 496.2718505859375,
      "width": 32,
      "height": 10,
      "fontSize": 6.830208778381348
    },
    "photoMode": {
      "id": "19:234",
      "x": 86.77704391479347,
      "y": 535.2425292968692,
      "width": 22,
      "height": 15,
      "fontSize": 10.92833423614502
    },
    "liveMode": {
      "id": "19:235",
      "x": 147.2247085571289,
      "y": 535.2425292968692,
      "width": 22,
      "height": 15,
      "fontSize": 10.92833423614502
    },
    "modeIndicator": {
      "id": "19:236",
      "x": 88.6400077342987,
      "y": 553.0229988098145,
      "width": 18.129732131958008,
      "height": 2.0784108638763428,
      "cornerRadius": 1.039205551147461
    },
    "gradient": {
      "id": "19:211",
      "x": 14.690782189369202,
      "y": 72.20496835559607,
      "width": 231.88925170898438,
      "height": 259.6252746582031
    },
    "points": {
      "id": "19:248",
      "x": 32.195064544677734,
      "y": 94.43511962890625,
      "width": 200.27525329589844,
      "height": 258.94390869140625
    }
  }
};



// Read from the live Figma frame 19:92 on 2026-10-26.
// Coordinates are in the OUTER frame's space. Group coordinates in Figwright
// are relative to their nearest frame; only FRAME/INSTANCE offsets accumulate.
const CAMERA_DESIGN = {
  "width": 264.3290710449219,
  "height": 576.4695434570312,
  "frameId": "19:92",
  "frames": {
    "outer": {
      "id": "19:93",
      "x": -4.597779273986816,
      "y": -4.374255180358887,
      "width": 270.0657653808594,
      "height": 584.470703125,
      "cornerRadius": 13.660417556762695
    },
    "inner": {
      "id": "19:94",
      "x": -4.317774385213852,
      "y": -2.360424518585205,
      "width": 269.0160217285156,
      "height": 582.1989135742188,
      "cornerRadius": 13.796182632446289
    },
    "background": {
      "id": "19:95",
      "x": -5.033589750528336,
      "y": -2.360265827184776,
      "width": 270.0198669433594,
      "height": 583.20263671875,
      "cornerRadius": 0
    }
  },
  "slots": {
    "close": {
      "id": "19:133",
      "x": 13.78797378539457,
      "y": 39.98000411987596,
      "width": 11.061514854431152,
      "height": 11.064579963684082
    },
    "flip": {
      "id": "19:136",
      "x": 231.68876934051514,
      "y": 208.88801193237305,
      "width": 23.51581573486328,
      "height": 23.18273162841797
    },
    "flash": {
      "id": "19:139",
      "x": 234.76889038085938,
      "y": 248.07789611816406,
      "width": 17.54791259765625,
      "height": 21.361223220825195
    },
    "filters": {
      "id": "19:121",
      "x": 234.76919555664062,
      "y": 287.7659912109375,
      "width": 17.4375,
      "height": 17.376953125,
      "cornerRadius": 0
    },
    "beauty": {
      "id": "19:126",
      "x": 235.55670166015625,
      "y": 326.233154296875,
      "width": 15.669937133789062,
      "height": 15.669937133789062
    },
    "bubble": {
      "id": "19:107",
      "x": 24.495547300577073,
      "y": 416.2227766990545,
      "width": 194.3371124267578,
      "height": 42.629581451416016,
      "cornerRadius": 2.0247552394866943,
      "strokeWeight": 0.3456000089645386
    },
    "message": {
      "id": "19:111",
      "x": 32.24392977356911,
      "y": 423.87980794906616,
      "width": 135,
      "height": 13,
      "fontSize": 9.111400604248047
    },
    "enable": {
      "id": "19:109",
      "x": 174.11395359635344,
      "y": 421.6633999824553,
      "width": 37.439998626708984,
      "height": 17.389123916625977,
      "cornerRadius": 9.698625564575195
    },
    "enableText": {
      "id": "19:110",
      "x": 183.61789265275002,
      "y": 425.46183919906616,
      "width": 19,
      "height": 10,
      "fontSize": 9.2160005569458
    },
    "ai": {
      "id": "19:98",
      "x": 40.08564129471779,
      "y": 467.1402163505554,
      "width": 25.377321243286133,
      "height": 25.37885093688965
    },
    "aiLabel": {
      "id": "19:112",
      "x": 41.477376371622086,
      "y": 496.2723879814148,
      "width": 21,
      "height": 10,
      "fontSize": 6.830208778381348
    },
    "shutter": {
      "id": "19:114",
      "x": 101.42311096191406,
      "y": 455.86712646484375,
      "width": 58.829898834228516,
      "height": 58.829898834228516
    },
    "shutterCore": {
      "id": "19:115",
      "x": 106.54552555084229,
      "y": 460.988995552063,
      "width": 48.5844612121582,
      "height": 48.5844612121582,
      "cornerRadius": 0
    },
    "shutterRing": {
      "id": "19:116",
      "x": 101.42311325073388,
      "y": 455.86712036130484,
      "width": 58.829898834228516,
      "height": 58.829898834228516,
      "cornerRadius": 0,
      "strokeWeight": 2.732083559036255
    },
    "vlog": {
      "id": "19:143",
      "x": 193.90951538085938,
      "y": 463.75927734375,
      "width": 32.038612365722656,
      "height": 32.038612365722656
    },
    "vlogLabel": {
      "id": "19:142",
      "x": 193.90943908691406,
      "y": 496.2718505859375,
      "width": 32,
      "height": 10,
      "fontSize": 6.830208778381348
    },
    "photoMode": {
      "id": "19:118",
      "x": 86.77653427124096,
      "y": 535.2425292968692,
      "width": 22,
      "height": 15,
      "fontSize": 10.92833423614502
    },
    "liveMode": {
      "id": "19:119",
      "x": 147.22456741333008,
      "y": 535.2425292968692,
      "width": 22,
      "height": 15,
      "fontSize": 10.92833423614502
    },
    "modeIndicator": {
      "id": "19:120",
      "x": 88.63985061645508,
      "y": 553.0229988098145,
      "width": 18.129732131958008,
      "height": 2.0784108638763428,
      "cornerRadius": 1.039205551147461
    }
  },
  "statusHeight": 31.237276077270508,
  "homeReserve": 21.368133783340454
};

const cameraDesignForStage = stage => stage === 'scanning' ? SCANNING_DESIGN : (ASSIST_DESIGNS[stage] || CAMERA_DESIGN);

function designStyle(rect) {
 return Object.entries({x:rect.x,y:rect.y,w:rect.width,h:rect.height,...(rect.fontSize?{'font-size':rect.fontSize}:{})})
  .map(([name,value])=>'--'+name+':'+value).join(';');
}
function relativeRect(rect,parent) {
 return {...rect,x:rect.x-parent.x,y:rect.y-parent.y};
}
function installCameraLayout(app) {
 const design=CAMERA_DESIGN;
 const setRect=(element,rect)=>{if(element)element.setAttribute('style',designStyle(rect));};
 let currentDesign;
 const setStage=stage=>{
  const next=cameraDesignForStage(stage);if(currentDesign===next)return;currentDesign=next;
  setRect(document.querySelector('#scene-frame-outer'),next.frames.outer);
  setRect(document.querySelector('#scene-frame-inner'),relativeRect(next.frames.inner,next.frames.outer));
  const imageRect=relativeRect(next.frames.background,next.frames.inner);
  setRect(document.querySelector('#scene'),imageRect);setRect(document.querySelector('#camera-video'),imageRect);
 };
 setStage('idle');
 const update=()=>{
  const width=document.documentElement.clientWidth;
  const height=window.visualViewport?.height||window.innerHeight;
  const scale=Math.min(width/design.width,height/design.height);
  app.style.width=design.width*scale+'px';
  app.style.height=design.height*scale+'px';
  app.style.setProperty('--du',scale+'px');
  app.style.setProperty('--canvas-w',design.width*scale+'px');
  app.style.setProperty('--canvas-h',design.height*scale+'px');
  app.style.setProperty('--design-scale',String(scale));
  app.style.setProperty('--top-reserve',design.statusHeight*scale+'px');
  app.style.setProperty('--bottom-reserve',design.homeReserve*scale+'px');
 };
 update();
 window.addEventListener('resize',update);
 window.visualViewport?.addEventListener('resize',update);
 return {setStage,dispose:()=>{window.removeEventListener('resize',update);window.visualViewport?.removeEventListener('resize',update);}};
}




const image=(file)=>'<img src="./assets/icons/'+file+'.svg" alt="" />';
const box=(rect,content,cls='',name='',extra='')=>'<span class="design-box '+cls+'" style="'+designStyle(rect)+'" '+(name?'data-design="'+name+'"':'')+' '+extra+'>'+content+'</span>';
const text=(rect,value,cls='',name='')=>box(rect,value,'design-label '+cls,name);
function hit(rect,action,label,content,cls='',extra='') {
 const cx=rect.x+rect.width/2,cy=rect.y+rect.height/2;
 return button(action,label,content,'design-hit '+cls,'style="--cx:'+cx+';--cy:'+cy+';--w:'+rect.width+';--h:'+rect.height+'" '+extra);
}
const art=(rect,file,name)=>box({x:-rect.width/2,y:-rect.height/2,width:rect.width,height:rect.height},image(file),'design-art',name);
function renderDesignHeader(s,design=CAMERA_DESIGN) {
 const slots=design.slots;
 return '<header class="design-header">'+hit(slots.close,'exit','离开拍摄',art(slots.close,'19-133','close'),'design-close',s.live?'disabled':'')+'</header>';
}
function renderDesignTools(s,design=CAMERA_DESIGN) {
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
function renderDesignModes(s,disabled='',design=CAMERA_DESIGN) {
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
function renderScanOverlay() {
 const slots=cameraDesignForStage('scanning').slots;
 return box(slots.gradient,image('19-211'),'design-scan-gradient','scanGradient')+
 box(slots.points,image('19-248-animated'),'design-scan-points','scanPoints');
}
function renderMainCamera(s,{hidePrompt=false}={}) {
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
function renderAssistCamera(s,media){
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




// Root camera states stay protected; later states have their own grounded renderer.
function renderCameraUi(s,media,photos) {
 return ASSIST_DESIGNS[s.stage]?renderAssistCamera(s,media):renderMainCamera(s);
}


function renderSheet(name,s,media,photos) {
 if(!name) return '';
 let heading='',body='';
 if(name==='source'){
 heading='选择取景画面';
 body='<p>可以使用真实相机，也可以用设计稿的预置画面完整体验。</p><div class="source-options">'+button('use-camera','启用真实相机',icon('camera',26)+'<span>真实相机<small>仅在浏览器内使用，不上传画面</small></span>','source-option',media.pending?'disabled':'')+
 button('use-demo','使用预置画面',icon('gallery',26)+'<span>预置画面<small>使用 Figma 原始人像素材</small></span>','source-option',media.pending?'disabled':'')+'</div><p class="sheet-note" id="camera-status" role="status">'+media.message+'</p>';
 } else if(name==='about'){
 heading='你好，我是 AI 点点';
 body='<p>帮你找到构图，也帮你留住好瞬间。</p><ol class="help-steps"><li>开启 AI，等待场景扫描完成。</li><li>选择构图或姿势，点击「应用辅助」。</li><li>拖动光点或使用「模拟对齐」。</li><li>生成后回到拍摄，按下快门。</li></ol><div class="notice"><b>这是一个交互 Demo</b><p>AI 扫描、姿势建议、对齐和直播均为本地模拟。照片只保存在本次页面内存中，刷新即清空。未接入 AI 或直播服务。</p></div>';
 } else if(name==='exit'){
 heading='这一刻，先暂停一下';
 body='<p>照片和当前辅助会保留在本次页面中。</p><div class="sheet-actions">'+button('resume','继续拍摄','继续拍摄','primary-button')+button('reset','重新开始演示','重新开始','secondary-button')+'</div>';
 } else if(name==='filters'){
 heading='一点氛围，刚刚好';
 body='<div class="filter-options">'+[{id:'none',label:'原图'},{id:'warm',label:'暖阳'},{id:'mono',label:'黑白'}].map(f=>button('filter',f.label,'<span class="filter-preview '+f.id+'"></span>'+f.label,s.filter===f.id?'selected':'','data-value="'+f.id+'" aria-pressed="'+(s.filter===f.id)+'"')).join('')+'</div><p class="sheet-note">本地画面滤镜，拍摄时会一并保留。</p>';
 } else if(name==='beauty'){
 heading='自然一点，就很好';
 body='<label class="range-label" for="beauty-range">柔光强度 <output id="beauty-value">'+s.beauty+'%</output></label><input id="beauty-range" type="range" min="0" max="100" value="'+s.beauty+'" /><p class="sheet-note">Demo 用亮度和饱和度模拟柔光，不进行人脸识别或五官调整。</p>';
 } else if(name==='vlog'){
 heading='mini Vlog';
 body='<p>收集几个喜欢的瞬间，再讲一个小故事。</p><div class="notice">当前 Demo 支持单张拍摄；视频剪辑暂未接入。</div>'+button('resume','回到拍摄','先拍下这一刻','primary-button full-width');
 } else if(name==='gallery'){
 heading='刚刚拍下的瞬间';
 body=photos.length?'<div class="photo-grid">'+photos.map((p,i)=>'<article class="photo-card"><img src="'+p.url+'" alt="第'+(photos.length-i)+'张拍摄照片" /><span>'+p.label+'</span><a href="'+p.url+'" download="diandian-'+p.id+'.jpg" aria-label="下载第'+(photos.length-i)+'张照片">'+icon('download',17)+' 保存</a></article>').join('')+'</div><p class="sheet-note">照片仅保留在本次会话中。需要保留时，请点击保存。</p>':'<div class="empty-gallery">'+icon('gallery',36)+'<p>还没有照片</p><small>按下快门，留下第一张。</small></div>';
 }
 return '<div class="sheet-backdrop" data-action="close-sheet"></div><section class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1"><div class="panel-handle"></div><div class="sheet-heading"><h2 id="sheet-title">'+heading+'</h2>'+button('close-sheet','关闭弹层',icon('close',20),'round-button')+'</div><div class="sheet-content">'+body+'</div></section>';
}


/** Browser API boundary. Injectable media APIs allow denial/timeout tests without a device. */
function createCameraController({video,onChange,environment=globalThis}) {
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

/** Capture only the actual viewfinder; composition guides are not burned into the photo. */
async function capturePhoto({source,viewport,filter='none',mirrored=false,zoom=1,renderRect=null}) {
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


})();