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
    this.camera.position.z = 493.1760737397743;

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

    this.createCanvas();
    // this.provideData();
  }

  createCanvas() {

    this.canvas = document.createElement('canvas');
    this.canvas.height = window.innerHeight;
    this.canvas.width = window.innerWidth;
    this.canvas.style.background = 'black';
    this.context = this.canvas.getContext('2d');

    document.body.appendChild(this.canvas);

    for (let i = 0; i < 100; i++) {
      this.points.push(
        {
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          radius: 5,
          start: 0,
          end: 2 * Math.PI,
        }
      );
    }

    // this.points.push(
    //   {
    //     x: this.canvas.width / 2 + 10,
    //     y: this.canvas.height / 2 + 10,
    //     radius: 5,
    //     start: 0,
    //     end: 2 * Math.PI,
    //   },
    //   {
    //     x: this.canvas.width / 2 - 10,
    //     y: this.canvas.height / 2 - 10,
    //     radius: 5,
    //     start: 0,
    //     end: 2 * Math.PI,
    //   }
    // );

    this.lastPoints = this.points.slice(0);
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

      data[i4] = ( ( i % width ) / width - 0.5 ) * width;
      // data[i3] = Math.random() * window.innerWidth - window.innerWidth / 2;
      data[i4 + 1] = ( iData[i4] / 0xFF * 0.299 + iData[i4 + 1] / 0xFF * 0.587 + iData[i4 + 2] / 0xFF * 0.114 ) * elevation * 1;
      data[i4 + 2] = ( ( i / width ) / height - 0.5 ) * height;
      data[i4 + 3] = ( Math.random() + 0.1 ) * iData[i4 + 3];
      // data[i3 + 2] = Math.random() * window.innerHeight - window.innerHeight / 2;
    }

    return data;
  }

  createFBO( data, width, height ) {

    const positions = new THREE.DataTexture( data, width, height, THREE.RGBAFormat, THREE.FloatType );
    console.log(positions);
    positions.needsUpdate = true;

    // simulation shader used to update the particles' positions
    this.simulationShader = new THREE.ShaderMaterial({
      uniforms: {
        map: { type: 't', value: positions },
        resolution: { type: 't', value: new THREE.Vector2(width, height) },
        time: { type: 'f', value: 0 },
      },
      vertexShader: glslify( './shaders/simulation_vs.glsl' ),
      fragmentShader: glslify( './shaders/simulation_fs.glsl' ),
    });

    // render shader to display the particles on screen
    // the 'positions' uniform will be set after the FBO.update() call
    this.renderShader = new THREE.ShaderMaterial({
      uniforms: {
        positions: { type: 't', value: null },
        pointSize: { type: 'f', value: 1 },
        resolution: { type: 'v2', value: new THREE.Vector2( width, height ) },
        time: { type: 'f', value: 0 },
      },
      transparent: true,
      vertexShader: glslify( './shaders/render_vs' ),
      fragmentShader: glslify( './shaders/render_fs' ),
    });

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
  }

  updateMouse( e ) {
    this.mouse.x = ( e.clientX - window.innerWidth / 2 ) / 5;
    this.mouse.y = ( e.clientY - window.innerHeight / 2 ) / 5;
  }

  render() {
    this.draw();

    if ( this.fbo ) {
      this.simulationShader.uniforms.map.value.image.data = this.getImage(this.canvas.width, this.canvas.height, this.elevation);
      this.fbo.update();
      this.renderer.render( this.scene, this.camera );
    }
  }

  draw() {
    const points = this.points;
    const newPoints = [];

    for (let i = 0; i < this.lastPoints.length; i++) {

      let draw = true;
      const oldPoint = this.lastPoints[i];
      const x = oldPoint.x + ( Math.random() * 10 - 5 );
      const y = oldPoint.y + ( Math.random() * 10 - 5 );
      const radius = Math.max( 0, oldPoint.radius - 0.005);

      for (let j = 0; j < points.length; j++) {
        const settedPoint = { x: points[j].x, y: points[j].y };
        const pointToSet = { x, y };

        if ( Maths.distance( settedPoint, pointToSet) < radius ) draw = false;
      }

      if (draw) {
        const point = {
          x,
          y,
          radius,
          start: 0,
          end: 2 * Math.PI,
        };
        const b = Math.floor(Maths.map(x, 0, window.innerWidth, 0, 255));
        const g = Math.floor(Maths.map(y, 0, window.innerHeight, 0, 255));

        this.context.fillStyle = 'rgba(0,' + g + ',' + b + ', ' + Math.random() + ')';
        this.context.beginPath();
        this.context.arc(point.x, point.y, point.radius, point.start, point.end, false);
        this.context.fill();

        newPoints.push(point);
        this.points.push(point);
        this.lastPoints.splice(i,1)
        this.lastPoints.push(point);
      }
    }
  }
}
