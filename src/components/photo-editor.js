import {PHOTO_EDITOR} from '../design/photo-editor-layout.js';
export function createPhotoEditor(app,{onReturn,onFeedback}){
 const d=PHOTO_EDITOR;
 const mount=document.createElement('section');mount.className='photo-editor';mount.hidden=true;mount.setAttribute('aria-label','照片编辑');app.append(mount);
 const box=n=>'left:'+n.x/d.width*100+'%;top:'+n.y/d.height*100+'%;width:'+n.width/d.width*100+'%;height:'+n.height/d.height*100+'%;';
 function hit(n,label,action){return '<button aria-label="'+label+'" data-photo-action="'+action+'" style="'+box({...n,x:n.x+n.width/2-15,y:n.y+n.height/2-15,width:30,height:30})+'"></button>';}
 const find=id=>d.atoms.find(n=>n.id===id);
 function close(){mount.hidden=true;onReturn();}
 mount.addEventListener('click',e=>{const action=e.target.closest('[data-photo-action]')?.dataset.photoAction;if(!action)return;if(action==='back'||action==='camera')close();else if(action==='next'){const a=document.createElement('a');a.href=mount.querySelector('.photo-result').src;a.download='diandian-photo.png';a.click();onFeedback('照片已准备下载');}else onFeedback('此编辑工具暂未接入，照片已保留');});
 return {open(url){
  mount.innerHTML=d.atoms.filter(n=>!['86:214','86:215','86:293'].includes(n.id)).sort((a,b)=>Number(a.id.split(':')[1])-Number(b.id.split(':')[1])).map(n=>'<span style="'+box(n)+'"><img alt="" src="./assets/photo-editor/'+n.id.replace(':','-')+'.svg" style="width:'+n.exportWidth/n.width*100+'%;height:'+n.exportHeight/n.height*100+'%;left:'+((n.width-n.exportWidth)/2/n.width*100)+'%;top:'+((n.height-n.exportHeight)/2/n.height*100)+'%" /></span>').join('')+
  '<img class="photo-result" alt="刚拍摄的照片" /><img class="photo-thumbnail" alt="本次拍摄缩略图" style="'+box(find('86:293'))+'" />'+hit(find('86:259'),'返回拍摄','back')+hit(find('86:284'),'接着拍','camera')+hit(find('86:247'),'下一步，保存照片','next')+
  ['86:248','86:221','86:226','86:228','86:218','86:234'].map((id,i)=>hit(find(id),['AI修图','滤镜','文字','贴纸','裁切','更多'][i],'tool')).join('');
  mount.querySelector('.photo-result').src=url;mount.querySelector('.photo-thumbnail').src=url;mount.hidden=false;
 },close};
}
