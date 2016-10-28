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

    this.provideData();
  }

  provideData() {
    const image = new Image();

    image.onload = () => {

      // const width = window.innerWidth;
      // const height = window.innerHeight;
      const width = 256;
      const height = 256;

      const data = this.getImage( image, width, height, 30 );
      this.createFBO( data, width, height );
    };

    image.src = 'img/c.jpg';
  }

  getImage( img, width, height, elevation ) {
    const canvas = document.createElement( 'canvas' );

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext( '2d' );
    ctx.drawImage( img, 0, 0 );

    const imgData = ctx.getImageData( 0, 0, width, height );
    const iData = imgData.data;

    const l = ( width * height );
    const data = new Float32Array( l * 3 );
    for ( let i = 0; i < l; i++ ) {
      const i3 = i * 3;
      const i4 = i * 4;
      data[i3] = ( ( i % width ) / width - 0.5 ) * width;
      // data[i3] = Math.random() * window.innerWidth - window.innerWidth / 2;
      data[i3 + 1] = ( iData[i4] / 0xFF * 0.299 + iData[i4 + 1] / 0xFF * 0.587 + iData[i4 + 2] / 0xFF * 0.114 ) * elevation * -1;
      data[i3 + 2] = ( ( i / width ) / height - 0.5 ) * height;
      // data[i3 + 2] = Math.random() * window.innerHeight - window.innerHeight / 2;
    }

    return data;
  }

  createFBO( data, width, height ) {
    const positions = new THREE.DataTexture( data, width, height, THREE.RGBFormat, THREE.FloatType );
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
    this.fbo = new FBO( width, height, this.renderer, simulationShader, renderShader );
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

  render() {
    if ( this.fbo ) {
      this.fbo.update();
      this.renderer.render( this.scene, this.camera );
    }
  }
}
