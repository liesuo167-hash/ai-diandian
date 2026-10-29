import { findOption } from '../data/recommendations.js';
import { button, icon } from './shared.js';
export function renderAssistant(s) {
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
