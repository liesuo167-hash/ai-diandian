// 原始 Figma IMAGE fills，文件未经修改。
export const SCENE = './assets/figma/a25063dc1590114d04b2432fc040241452d833d8.webp';
export const REFERENCES = [
'./assets/figma/93c511b55e90d764021246ecf737bc75d7af6573.webp',
'./assets/figma/1760924c1e698057b17e386768a5a594ad98cdba.webp',
'./assets/figma/033ad0bd8635a80fd1d8065e8ae72c3448569e6a.webp',
'./assets/figma/f104adb8c7ba9dfeeb24fd941594c2b9f5ed19ae.webp',
'./assets/figma/ee8e62bea196096ee692d8474b3a177569b1a82e.webp',
];
export const CATEGORIES = [
{ id:'smart', label:'智能推荐' }, { id:'popular', label:'热门' },
{ id:'thirds', label:'三分线' }, { id:'diagonal', label:'对角线' },
{ id:'triangle', label:'三角形' }, { id:'leading', label:'引导线' },
{ id:'frame', label:'框架' }, { id:'center', label:'居中' },
];
export const COMPOSITIONS = [
{ id:'thirds', label:'三分线', hint:'让人物靠近左侧三分线，给目光留一点空间。', image:REFERENCES[4] },
{ id:'diagonal', label:'对角线', hint:'让花茎沿对角线延伸，画面更有动感。', image:REFERENCES[1] },
{ id:'triangle', label:'三角形', hint:'用人物与两侧花朵形成稳定的三角形。', image:REFERENCES[2] },
{ id:'leading', label:'引导线', hint:'沿着花田的小径，把视线引向人物。', image:REFERENCES[3] },
{ id:'frame', label:'框架', hint:'把前景的叶片留在边缘，形成自然画框。', image:REFERENCES[0] },
{ id:'center', label:'居中', hint:'让人物位于画面中心，突出这一刻的主角。', image:REFERENCES[0] },
];
// Figma 无姿势展开稿；Demo 最小补充，复用同组素材。
export const POSES = [
{ id:'look-back', label:'自然回眸', hint:'肩膀轻轻侧转，回头看向镜头。', image:REFERENCES[0] },
{ id:'look-up', label:'抬头看光', hint:'稍稍抬头，让阳光落在脸颊。', image:REFERENCES[1] },
{ id:'sideways', label:'侧身站立', hint:'侧身站立，双手自然放松。', image:REFERENCES[2] },
{ id:'walking', label:'慢慢走来', hint:'向前走一小步，留下自然的瞬间。', image:REFERENCES[3] },
{ id:'with-flowers', label:'与花互动', hint:'轻轻靠近花朵，目光看向花瓣。', image:REFERENCES[4] },
];
export function getOptions(tab, category) {
if(tab==='pose') return category==='popular'?[...POSES].reverse():POSES;
if(category==='smart') return COMPOSITIONS;
if(category==='popular') return [...COMPOSITIONS].reverse();
return COMPOSITIONS.filter(item=>item.id===category);
}
export function findOption(tab,id) { return (tab==='pose'?POSES:COMPOSITIONS).find(item=>item.id===id); }
export const TIMING = { scan:3200, generate:1700, align:1100, cameraTimeout:10000 };
