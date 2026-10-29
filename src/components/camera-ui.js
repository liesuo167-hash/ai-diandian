import { renderMainCamera } from './main-camera.js';
import { renderAssistCamera } from './assist-camera.js';
import { ASSIST_DESIGNS } from '../design/assist-layouts.js';
// Root camera states stay protected; later states have their own grounded renderer.
export function renderCameraUi(s,media,photos) {
 return ASSIST_DESIGNS[s.stage]?renderAssistCamera(s,media):renderMainCamera(s);
}
