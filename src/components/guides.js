// Dynamic vector overlays; the static artwork is reused as separate Figma assets.
export function renderGuide(id,tab='composition') {
 if(tab==='pose') return '<svg class="composition-guide pose-guide" viewBox="0 0 100 160" preserveAspectRatio="xMidYMid meet"><g><ellipse cx="50" cy="35" rx="9" ry="12"/><path d="M46 47 38 75 42 105 33 145M54 47 63 75 58 105 67 145M43 53 26 78 34 91M57 53 73 73 64 85M38 75h25M42 105h16"/></g></svg>';
 const shapes={
 thirds:'<path d="M33.33 0v100M66.67 0v100M0 33.33h100M0 66.67h100"/><circle cx="33.33" cy="33.33" r="1.8" class="guide-dot"/>',
 diagonal:'<path d="m0 100 100-100M0 0l100 100"/>',
 triangle:'<path d="M50 20 15 80h70z"/><circle cx="50" cy="20" r="1.8" class="guide-dot"/>',
 leading:'<path d="m0 100 50-65 50 65M0 80l50-45 50 45"/>',
 frame:'<rect x="13" y="18" width="74" height="64" rx="2"/><path d="M9 26v-12h12M79 14h12v12M9 74v12h12M79 86h12V74"/>',
 center:'<path d="M50 0v100M0 50h100"/><circle cx="50" cy="50" r="8"/>'
 };
 return '<svg class="composition-guide" viewBox="0 0 100 100" preserveAspectRatio="none"><g>'+(shapes[id]||shapes.thirds)+'</g></svg>';
}
