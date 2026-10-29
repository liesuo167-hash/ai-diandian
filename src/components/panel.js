import { CATEGORIES, findOption, getOptions } from '../data/recommendations.js';
import { assetIcon, button, icon } from './shared.js';
export function renderPanel(s) {
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
