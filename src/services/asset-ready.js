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
export function preload(urls, { timeout = DEFAULT_TIMEOUT } = {}) {
 const list = [...(urls || [])].filter(isRetryable);
 if (!list.length) return Promise.resolve();
 return Promise.all(list.map(url => decodeOne(url, timeout)));
}

/** 双 rAF：确认浏览器已完成一次真实绘制，而不只是更新了 DOM。 */
export function nextPaint() {
 return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

/** 等当前 DOM 里的 <img> 全部解码完成（含内联 SVG 素材）。 */
export function waitForImages(root = document, { timeout = DEFAULT_TIMEOUT } = {}) {
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
export function fontsReady() {
 return document.fonts?.ready?.catch(() => {}) ?? Promise.resolve();
}

/** 综合门控：字体 + 当前 DOM 图片 + 一次真实绘制。 */
export async function waitForVisualReady(root = document, opts = {}) {
 await Promise.all([fontsReady(), waitForImages(root, opts)]);
}
