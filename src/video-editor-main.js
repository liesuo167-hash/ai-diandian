import {createVideoEditor} from './components/video-editor.js';

// Leaving this standalone demo returns to its own starting state, never to camera.
const editor=createVideoEditor({onExit:()=>editor.open()});
editor.open();
