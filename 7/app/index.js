import Webgl from './Webgl';
import raf from 'raf';
import dat from 'dat-gui';
import 'gsap';

let webgl;
let gui;

// webgl settings
webgl = new Webgl( window.innerWidth, window.innerHeight );
document.body.appendChild( webgl.renderer.domElement );

// GUI settings
gui = new dat.GUI();

function resizeHandler() {
  webgl.resize( window.innerWidth, window.innerHeight );
}

function animate() {
  raf( animate );

  webgl.render();
}

function onCanvasMouseMove( e ) {
  webgl.updateMouse( e );
}

// handle resize
window.addEventListener( 'resize', resizeHandler );

document.addEventListener( 'mousemove', onCanvasMouseMove );

// let's play !
animate();
