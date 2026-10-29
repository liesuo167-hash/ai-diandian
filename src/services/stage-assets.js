import { ASSIST_DESIGNS } from '../design/assist-layouts.js';
import { getOptions } from '../data/recommendations.js';
import { preload } from './asset-ready.js';

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
export function collectStageAssets(stage, state) {
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
export function warmStages(currentStage, state) {
 const stages = Object.keys(ASSIST_DESIGNS).filter(name => name !== currentStage);
 const run = () => stages.forEach(stage => { preload(collectStageAssets(stage, state)).catch(() => {}); });
 if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 2000 });
 else setTimeout(run, 800);
}
