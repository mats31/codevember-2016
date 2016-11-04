import * as THREE from 'three';
import FBO from './class/FBO';
import Letter from './objects/Letter';
const glslify = require( 'glslify' );
const OrbitControls = require( 'three-orbit-controls' )( THREE );
const OBJLoader = require( './class/OBJLoader' )( THREE );

export default class Webgl {
  constructor( width, height ) {
    this.params = {};

    this.scene = new THREE.Scene();

    window.camera = this.camera = new THREE.PerspectiveCamera( 50, width / height, 1, 10000 );
    this.camera.position.x = 0;
    this.camera.position.y = 0;
    this.camera.position.z = 500;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize( width, height );
    this.renderer.setClearColor( 0x262626 );

    // this.controls = new OrbitControls( this.camera );
    // this.controls.minDistance = 500;
    // this.controls.maxDistance = 2000;

    this.composer = null;

    this.fbo = false;

    this.mouse = new THREE.Vector2();

    this.word = 'Codevember';

    this.clock = new THREE.Clock();

    this.provideData();
  }

  provideData() {
    const image = new Image();

    image.onload = () => {

      // const width = window.innerWidth;
      // const height = window.innerHeight;
      const width = 256;
      const height = 256;

      this.data = this.getRandomData( width, height, 256 );
      this.createFBO( this.data, width, height );
    };

    image.src = 'img/c.jpg';
  }

  getRandomData( width, height, size ) {

    let len = width * height * 4;
    const data = new Float32Array( len );
    while ( len-- )data[len] = ( Math.random() * 2 - 1 ) * size;
    return data;
  }

  createFBO( data, width, height ) {
    const positions = new THREE.DataTexture( data, width, height, THREE.RGBAFormat, THREE.FloatType );
    positions.needsUpdate = true;

    // simulation shader used to update the particles' positions
    this.simulationShader = new THREE.ShaderMaterial({
      uniforms: {
        positions: { type: 't', value: positions },
        time: { type: 'f', value: 0 },
        resolution: { type: 'v2', value: new THREE.Vector2( width, height ) },
      },
      vertexShader: glslify( './shaders/simulation_vs.glsl' ),
      fragmentShader: glslify( './shaders/simulation_fs.glsl' ),
    });

    // render shader to display the particles on screen
    // the 'positions' uniform will be set after the FBO.update() call
    this.renderShader = new THREE.ShaderMaterial({
      uniforms: {
        mouse: { type: 'v2', value: this.mouse },
        positions: { type: 't', value: null },
        pointSize: { type: 'f', value: 3 },
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
    this.mouse.x = ( e.clientX - window.innerWidth / 2 ) / ( window.innerWidth / 2 );
    this.mouse.y = ( e.clientY - window.innerHeight / 2 ) / ( window.innerHeight / 2 );

    console.log(this.mouse);
  }

  render() {
    if (this.simulationShader) {
      this.simulationShader.uniforms.time.value = this.clock.getElapsedTime();
    }
    // if (this.renderShader) this.renderShader.uniforms.time.value = this.clock.getElapsedTime();

    if ( this.fbo ) {
      this.fbo.update();
      this.renderer.render( this.scene, this.camera );
    }
  }
}
