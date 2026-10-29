// Separate demo entries: neither flow imports or navigates into the other.
if(new URLSearchParams(location.search).get('flow')==='video-editor'){
 document.querySelector('#app').remove();
 document.title='AI 点点 · 视频封面优化';
 await import('./video-editor-main.js');
}else{
 await import('./main.js');
}
