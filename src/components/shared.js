export const assetIcon=(file,cls='')=>'<span class="asset-icon '+cls+'" aria-hidden="true"><img src="./assets/icons/'+file+'.svg" alt="" /></span>';
export function icon(name,size=22) {
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
export function button(action,label,inner,cls='',extra='') {
 return '<button type="button" data-action="'+action+'" aria-label="'+label+'" class="'+cls+'" '+extra+'>'+inner+'</button>';
}
export const aiIcon=()=>assetIcon('19-98','ai-asset');
