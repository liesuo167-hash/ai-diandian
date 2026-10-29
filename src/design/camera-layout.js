import { ASSIST_DESIGNS } from './assist-layouts.js';
import { SCANNING_DESIGN } from './scanning-layout.js';
// Read from the live Figma frame 19:92 on 2026-10-26.
// Coordinates are in the OUTER frame's space. Group coordinates in Figwright
// are relative to their nearest frame; only FRAME/INSTANCE offsets accumulate.
export const CAMERA_DESIGN = {
  "width": 264.3290710449219,
  "height": 576.4695434570312,
  "frameId": "19:92",
  "frames": {
    "outer": {
      "id": "19:93",
      "x": -4.597779273986816,
      "y": -4.374255180358887,
      "width": 270.0657653808594,
      "height": 584.470703125,
      "cornerRadius": 13.660417556762695
    },
    "inner": {
      "id": "19:94",
      "x": -4.317774385213852,
      "y": -2.360424518585205,
      "width": 269.0160217285156,
      "height": 582.1989135742188,
      "cornerRadius": 13.796182632446289
    },
    "background": {
      "id": "19:95",
      "x": -5.033589750528336,
      "y": -2.360265827184776,
      "width": 270.0198669433594,
      "height": 583.20263671875,
      "cornerRadius": 0
    }
  },
  "slots": {
    "close": {
      "id": "19:133",
      "x": 13.78797378539457,
      "y": 39.98000411987596,
      "width": 11.061514854431152,
      "height": 11.064579963684082
    },
    "flip": {
      "id": "19:136",
      "x": 231.68876934051514,
      "y": 208.88801193237305,
      "width": 23.51581573486328,
      "height": 23.18273162841797
    },
    "flash": {
      "id": "19:139",
      "x": 234.76889038085938,
      "y": 248.07789611816406,
      "width": 17.54791259765625,
      "height": 21.361223220825195
    },
    "filters": {
      "id": "19:121",
      "x": 234.76919555664062,
      "y": 287.7659912109375,
      "width": 17.4375,
      "height": 17.376953125,
      "cornerRadius": 0
    },
    "beauty": {
      "id": "19:126",
      "x": 235.55670166015625,
      "y": 326.233154296875,
      "width": 15.669937133789062,
      "height": 15.669937133789062
    },
    "bubble": {
      "id": "19:107",
      "x": 24.495547300577073,
      "y": 416.2227766990545,
      "width": 194.3371124267578,
      "height": 42.629581451416016,
      "cornerRadius": 2.0247552394866943,
      "strokeWeight": 0.3456000089645386
    },
    "message": {
      "id": "19:111",
      "x": 32.24392977356911,
      "y": 423.87980794906616,
      "width": 135,
      "height": 13,
      "fontSize": 9.111400604248047
    },
    "enable": {
      "id": "19:109",
      "x": 174.11395359635344,
      "y": 421.6633999824553,
      "width": 37.439998626708984,
      "height": 17.389123916625977,
      "cornerRadius": 9.698625564575195
    },
    "enableText": {
      "id": "19:110",
      "x": 183.61789265275002,
      "y": 425.46183919906616,
      "width": 19,
      "height": 10,
      "fontSize": 9.2160005569458
    },
    "ai": {
      "id": "19:98",
      "x": 40.08564129471779,
      "y": 467.1402163505554,
      "width": 25.377321243286133,
      "height": 25.37885093688965
    },
    "aiLabel": {
      "id": "19:112",
      "x": 41.477376371622086,
      "y": 496.2723879814148,
      "width": 21,
      "height": 10,
      "fontSize": 6.830208778381348
    },
    "shutter": {
      "id": "19:114",
      "x": 101.42311096191406,
      "y": 455.86712646484375,
      "width": 58.829898834228516,
      "height": 58.829898834228516
    },
    "shutterCore": {
      "id": "19:115",
      "x": 106.54552555084229,
      "y": 460.988995552063,
      "width": 48.5844612121582,
      "height": 48.5844612121582,
      "cornerRadius": 0
    },
    "shutterRing": {
      "id": "19:116",
      "x": 101.42311325073388,
      "y": 455.86712036130484,
      "width": 58.829898834228516,
      "height": 58.829898834228516,
      "cornerRadius": 0,
      "strokeWeight": 2.732083559036255
    },
    "vlog": {
      "id": "19:143",
      "x": 193.90951538085938,
      "y": 463.75927734375,
      "width": 32.038612365722656,
      "height": 32.038612365722656
    },
    "vlogLabel": {
      "id": "19:142",
      "x": 193.90943908691406,
      "y": 496.2718505859375,
      "width": 32,
      "height": 10,
      "fontSize": 6.830208778381348
    },
    "photoMode": {
      "id": "19:118",
      "x": 86.77653427124096,
      "y": 535.2425292968692,
      "width": 22,
      "height": 15,
      "fontSize": 10.92833423614502
    },
    "liveMode": {
      "id": "19:119",
      "x": 147.22456741333008,
      "y": 535.2425292968692,
      "width": 22,
      "height": 15,
      "fontSize": 10.92833423614502
    },
    "modeIndicator": {
      "id": "19:120",
      "x": 88.63985061645508,
      "y": 553.0229988098145,
      "width": 18.129732131958008,
      "height": 2.0784108638763428,
      "cornerRadius": 1.039205551147461
    }
  },
  "statusHeight": 31.237276077270508,
  "homeReserve": 21.368133783340454
};

export const cameraDesignForStage = stage => stage === 'scanning' ? SCANNING_DESIGN : (ASSIST_DESIGNS[stage] || CAMERA_DESIGN);

export function designStyle(rect) {
 return Object.entries({x:rect.x,y:rect.y,w:rect.width,h:rect.height,...(rect.fontSize?{'font-size':rect.fontSize}:{})})
  .map(([name,value])=>'--'+name+':'+value).join(';');
}
export function relativeRect(rect,parent) {
 return {...rect,x:rect.x-parent.x,y:rect.y-parent.y};
}
export function installCameraLayout(app) {
 const design=CAMERA_DESIGN;
 const setRect=(element,rect)=>{if(element)element.setAttribute('style',designStyle(rect));};
 let currentDesign;
 const setStage=stage=>{
  const next=cameraDesignForStage(stage);if(currentDesign===next)return;currentDesign=next;
  setRect(document.querySelector('#scene-frame-outer'),next.frames.outer);
  setRect(document.querySelector('#scene-frame-inner'),relativeRect(next.frames.inner,next.frames.outer));
  const imageRect=relativeRect(next.frames.background,next.frames.inner);
  setRect(document.querySelector('#scene'),imageRect);setRect(document.querySelector('#camera-video'),imageRect);
 };
 setStage('idle');
 const update=()=>{
  const width=document.documentElement.clientWidth;
  const height=window.visualViewport?.height||window.innerHeight;
  const scale=Math.min(width/design.width,height/design.height);
  app.style.width=design.width*scale+'px';
  app.style.height=design.height*scale+'px';
  app.style.setProperty('--du',scale+'px');
  app.style.setProperty('--canvas-w',design.width*scale+'px');
  app.style.setProperty('--canvas-h',design.height*scale+'px');
  app.style.setProperty('--design-scale',String(scale));
  app.style.setProperty('--top-reserve',design.statusHeight*scale+'px');
  app.style.setProperty('--bottom-reserve',design.homeReserve*scale+'px');
 };
 update();
 window.addEventListener('resize',update);
 window.visualViewport?.addEventListener('resize',update);
 return {setStage,dispose:()=>{window.removeEventListener('resize',update);window.visualViewport?.removeEventListener('resize',update);}};
}
