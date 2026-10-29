export const EDITOR_STAGES={editor:'1',chat:'2',thinking:'3',processing:'4',done:'5',result:'6',finished:'7'};
export const initialEditorState=()=>({view:'editor',job:'idle',playing:false,time:3,completed:false});
export function editorTransition(s,e){
 switch(e.type){
 case 'OPEN_AI':return {...s,view:s.job==='done'?'result':s.job==='running'?'thinking':'chat'};
 case 'SUBMIT':return s.job==='running'?s:{...s,view:'thinking',job:'running',playing:false};
 case 'COMPLETE':return s.job==='running'?{...s,job:'done',view:s.view==='thinking'?'result':'done'}:s;
 case 'CLOSE_CHAT':return {...s,view:s.job==='done'?'finished':s.job==='running'?'processing':'editor'};
 case 'NEXT':return s.job==='running'?s:{...s,view:'finished',completed:true,playing:false};
 case 'PLAY':return {...s,playing:!s.playing};
 case 'TICK':return s.playing?{...s,time:s.time>=59?0:s.time+1}:s;
 case 'BACK':return ['chat','thinking','result'].includes(s.view)?editorTransition(s,{type:'CLOSE_CHAT'}):{...s,exit:true,playing:false,job:'idle'};
 default:return s;
 }
}
