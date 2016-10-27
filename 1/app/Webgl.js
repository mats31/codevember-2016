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

    this.camera = new THREE.PerspectiveCamera( 50, width / height, 1, 10000 );
    this.camera.position.z = 10;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize( width, height );
    this.renderer.setClearColor( 0x262626 );

    this.controls = new OrbitControls( this.camera );

    this.composer = null;

    this.fbo = false;

    this.word = 'Codevember';

    this.loadFont();

  }

  loadFont() {
    const loader = new THREE.FontLoader();

    loader.load( 'fonts/gotham.json', ( font ) => {

      this.letter = new Letter({
        font,
        text: this.word[0],
      });

      this.provideData( this.letter.geometry );
    });
  }

  provideData( geometry ) {
    const width = 256;
    const height = 256;

    // const TextGeometry = new THREE.BufferGeometry().fromGeometry( geometry );
    // const geometry = new THREE.BoxGeometry(10,10,10,10);
    // const geometry = new THREE.BoxBufferGeometry(10,10,10);

    const data = this.parseGeometry( geometry );
    this.createFBO( data, width, height );
  }

  createFBO( data, width, height ) {
    const size = Math.sqrt( data.length / 3 );
    // console.log(size)
    const positions = new THREE.DataTexture( data, size, size, THREE.RGBFormat, THREE.FloatType );
    positions.needsUpdate = true;

    // simulation shader used to update the particles' positions
    const simulationShader = new THREE.ShaderMaterial({
      uniforms: {
        positions: { type: 't', value: positions },
      },
      vertexShader: glslify( './shaders/simulation_vs.glsl' ),
      fragmentShader: glslify( './shaders/simulation_fs.glsl' ),
    });

    // render shader to display the particles on screen
    // the 'positions' uniform will be set after the FBO.update() call
    const renderShader = new THREE.ShaderMaterial({
      uniforms: {
        positions: { type: 't', value: null },
        pointSize: { type: 'f', value: 2 },
      },
      transparent: true,
      vertexShader: glslify( './shaders/render_vs' ),
      fragmentShader: glslify( './shaders/render_fs' ),
    });

    // init the FBO
    this.fbo = new FBO( size, size, this.renderer, simulationShader, renderShader );
    this.scene.add( this.fbo.particles );

    // if ( this.type === 'obj' ) this.fbo.particles.position.z += 30;
  }

  parseGeometry( geometry ) {

    // const vertices = geometry.attributes.position.array;
    const vertices = geometry.vertices;

    const total = vertices.length;
    const size = parseInt( Math.sqrt( total * 3 ));
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

  render() {
    if ( this.fbo ) {
      this.fbo.update();
      this.renderer.render( this.scene, this.camera );
    }
  }
}
