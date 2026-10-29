import { button, icon } from './shared.js';
export function renderSheet(name,s,media,photos) {
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
