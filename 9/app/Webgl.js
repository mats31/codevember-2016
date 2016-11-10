import * as THREE from 'three';
import FBO from './class/FBO';
import Letter from './objects/Letter';
import Maths from './utils/Maths';
const glslify = require( 'glslify' );
const OrbitControls = require( 'three-orbit-controls' )( THREE );
const OBJLoader = require( './class/OBJLoader' )( THREE );

export default class Webgl {
  constructor( width, height ) {
    this.params = {};

    this.scene = new THREE.Scene();

    window.camera = this.camera = new THREE.PerspectiveCamera( 50, width / height, 1, 10000 );
    this.camera.position.x = 0.8911886136847;
    this.camera.position.y = 0.4876275386406;
    this.camera.position.z = 2000;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize( width, height );
    this.renderer.setClearColor( 0x262626 );

    this.controls = new OrbitControls( this.camera );
    this.controls.minDistance = 500;
    this.controls.maxDistance = 2000;

    this.composer = null;

    this.elevation = 20;

    this.fbo = false;

    this.clock = new THREE.Clock();

    this.mouse = new THREE.Vector2();

    this.points = [];
    this.lastPoints = [];

    this.time = 0;

    this.step = 0;

    this.createCanvas();
    this.provideData();
  }

  createCanvas() {

    this.canvas = document.createElement('canvas');
    this.canvas.height = 512;
    this.canvas.width = 512;
    this.context = this.canvas.getContext('2d');
    // this.canvas.style.backgroundColor = 'yellow';

    // document.body.appendChild(this.canvas);

    this.lines = [
      {
        x: this.canvas.width,
        y: 150,
      },
      {
        x: this.canvas.width,
        y: this.canvas.height - 100,
      },
      {
        x: 350,
        y: 150,
      },
    ];

    this.context.save();

    this.context.beginPath();
    this.context.fillStyle = 'rgba(255,0,0,1)';
    this.context.fillRect( 0, 0, this.canvas.width, this.canvas.height );
    this.context.fill();
    this.context.closePath();

    this.context.restore();


    this.context.beginPath();
    this.context.fillStyle = 'rgba(255,255,0,1)';
    this.context.arc( this.canvas.width, this.canvas.height / 2, 250, Math.PI * 2, false );
    this.context.fill();
    this.context.closePath();

    this.context.restore();

    // this.context.globalCompositeOperation = 'xor';

    this.context.beginPath();
    this.context.moveTo(200, 150);
    for (let i = 0; i < this.lines.length; i++) {
      this.context.lineTo(this.lines[i].x, this.lines[i].y);
    }
    this.context.fillStyle = 'rgba(255,255,255,1)';
    this.context.lineWidth = 1;
    this.context.fill();
    this.context.closePath();

    // setInterval( () => {
    //   this.step++;
    // }, 2000);
  }

  provideData() {
    this.data = this.getImage( this.canvas.width, this.canvas.height, this.elevation );
    this.createFBO( this.data, this.canvas.width, this.canvas.height );
  }

  getImage( width, height, elevation ) {
    const ctx = this.context;

    const imgData = ctx.getImageData( 0, 0, width, height );
    const iData = imgData.data;

    const l = ( width * height );
    const data = new Float32Array( l * 4 );
    for ( let i = 0; i < l; i++ ) {
      const i3 = i * 3;
      const i4 = i * 4;

      // data[i4] = ( ( ( i % width ) / width - 0.5 ) * width ) /* * Math.sin( this.time * Math.random() * 0.1 ); */
      data[i4] = ( ( ( i % width ) / width - 0.5 ) * width ) /* * Math.sin( this.time * Math.random() * 0.1 ); */
      // data[i3] = Math.random() * window.innerWidth - window.innerWidth / 2;
      data[i4 + 1] = Math.max( 0.1, ( iData[i4] + iData[i4 + 1] + iData[i4 + 2] ) / 765 );
      // data[i4 + 1] = ( ( ( i % width ) / width - 0.5 ) * width );
      // data[i4 + 1] = ( ( ( i % height ) / height - 0.5 ) * height ) * Math.sin( this.time * Math.random() * 0.1 );
      data[i4 + 2] = ( ( ( i / width ) / height - 0.5 ) * height ) /* * Math.sin( this.time * Math.random() * 0.1 ); */
      data[i4 + 3] = iData[i4] / 255 + 1;
      // data[i3 + 3] = Math.max( 0.1, ( iData[i4] + iData[i4 + 1] + iData[i4 + 2] ) / 765 );
      // data[i3 + 2] = Math.random() * window.innerHeight - window.innerHeight / 2;
    }

    // for ( let i = 0; i < l; i+=4 ) {
    //   console.log(iData[i] / 255);
    // }

    for (var i = 0; i < data.length; i += 3) {
      // console.log(data[i]);
    }



    return data;
  }

  createFBO( data, width, height ) {

    const positions = new THREE.DataTexture( data, width, height, THREE.RGBAFormat, THREE.FloatType );
    positions.needsUpdate = true;

    // simulation shader used to update the particles' positions
    this.simulationShader = new THREE.ShaderMaterial({
      uniforms: {
        map: { type: 't', value: positions },
        resolution: { type: 'v2', value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        time: { type: 'f', value: 0 },
      },
      transparent: true,
      vertexShader: glslify( './shaders/simulation_vs.glsl' ),
      fragmentShader: glslify( './shaders/simulation_fs.glsl' ),
    });

    // render shader to display the particles on screen
    // the 'positions' uniform will be set after the FBO.update() call
    this.renderShader = new THREE.ShaderMaterial({
      uniforms: {
        positions: { type: 't', value: null },
        pointSize: { type: 'f', value: 1 },
        resolution: { type: 'v2', value: new THREE.Vector2( window.innerWidth, window.innerHeight ) },
        time: { type: 'f', value: 0 },
      },
      transparent: true,
      vertexShader: glslify( './shaders/render_vs' ),
      fragmentShader: glslify( './shaders/render_fs' ),
    });

    setTimeout( () => {
      const geom = new THREE.MeshBasicMaterial({ map: this.renderShader.uniforms.positions.value})
      const plane = new THREE.PlaneGeometry(500, 500, 100);
      const mesh = new THREE.Mesh(plane, geom);
      mesh.position.z = 1500;

      this.scene.add( mesh );
    }, 2000);

    // init the FBO
    this.fbo = new FBO( width, height, this.renderer, this.simulationShader, this.renderShader );
    this.fbo.particles.rotation.x = Math.PI / 2;
    this.scene.add( this.fbo.particles );

    // if ( this.type === 'obj' ) this.fbo.particles.position.z += 30;
  }

  parseGeometry( geometry ) {

    // const vertices = geometry.attributes.position.array;
    const vertices = geometry.vertices;

    const total = vertices.length;
    const size = parseInt( Math.sqrt( total * 3 ), 10 );
    const data = new Float32Array( size * size * 3 );

    for ( let i = 0; i < total; i++ ) {
      data[i * 3] = vertices[i].x;
      data[i * 3 + 1] = vertices[i].y;
      data[i * 3 + 2] = vertices[i].z;
    }

    return data;
  }

  resize( width, height ) {
    if ( this.composer ) {
      this.composer.setSize( width, height );
    }

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize( width, height );

    this.canvas.width = width;
    this.canvas.height = height;
  }

  updateMouse( e ) {
    this.mouse.x = ( e.clientX - window.innerWidth / 2 ) / 5;
    this.mouse.y = ( e.clientY - window.innerHeight / 2 ) / 5;
  }

  render() {

    this.time = this.clock.getElapsedTime();

    if (this.simulationShader) {
      this.simulationShader.uniforms.time.value = this.time;
      this.renderShader.uniforms.time.value = this.time;
    }

    if ( this.fbo ) {
      // this.simulationShader.uniforms.map.value.image.data = this.getImage(this.canvas.width, this.canvas.height, this.elevation);
      // this.simulationShader.uniforms.map.value.needsUpdate = true;
      this.fbo.update();
      this.renderer.render( this.scene, this.camera );
    }

    // this.draw();
  }

  draw() {

    // this.context.beginPath();
    // this.context.moveTo(10, 10);
    // this.context.lineTo(50, 10);
    // this.context.lineTo(30, 40);
    // this.context.lineTo(10, 10);
    // this.context.strokeStyle = 'red';
    // this.context.lineWidth = 2;
    // this.context.stroke();
  }
}
