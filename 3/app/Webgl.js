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

    this.word = 'Codevember';

    this.clock = new THREE.Clock();

    this.dest = true;
    this.step = 0;
    this.change = false;

    this.mouse = new THREE.Vector2();

    this.images = ['img/1.png', 'img/2.png'];

    this.datas = [];

    this.loadImages();

    setInterval( () => {
      this.change = true;
      this.step++;
      if ( this.step === this.images.length ) this.step = 0;
    }, 3500 );
  }

  loadImages() {

    for ( let i = 0; i < this.images.length; i++ ) {

      const image = new Image();

      image.onload = this.loadImage.bind( this, image, i );

      image.src = this.images[i];
    }
  }

  loadImage( image, index ) {

    const width = image.width;
    const height = image.height;

    this.datas.push({
      id: index,
      data: this.getImage( image, width, height, this.elevation ),
      width,
      height,
    });

    if ( this.images.length - 1 === this.datas.length - 1 ) this.createFBO( this.datas );
  }

  provideData() {
    const image = new Image();

    image.onload = () => {

      // const width = window.innerWidth;
      // const height = window.innerHeight;
      const width = image.width;
      const height = image.src;

      this.data = this.getImage( image, width, height, this.elevation );
      this.createFBO( this.data, width, height );
    };

    image.src = 'img/1.png';
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

  createFBO( datas ) {

    // simulation shader used to update the particles' positions
    this.simulationShader = new THREE.ShaderMaterial({
      uniforms: {
        time: { type: 'f', value: 0 },
        offset: { type: 'f', value: 0 },
        mixValue: { type: 'f', value: 0 },
      },
      vertexShader: glslify( './shaders/simulation_vs.glsl' ),
      fragmentShader: glslify( './shaders/simulation_fs.glsl' ),
    });

    for ( let i = 0; i < datas.length; i++ ) {
      const positions = new THREE.DataTexture( datas[i].data, datas[i].width, datas[i].height, THREE.RGBAFormat, THREE.FloatType );
      positions.needsUpdate = true;

      this.simulationShader.uniforms['map' + datas[i].id] = { type: 't', value: positions };
      this.simulationShader.uniforms.resolution = { type: 'v2', value: new THREE.Vector2( datas[i].width, datas[i].height ) };
    }

    // render shader to display the particles on screen
    // the 'positions' uniform will be set after the FBO.update() call
    this.renderShader = new THREE.ShaderMaterial({
      uniforms: {
        positions: { type: 't', value: null },
        pointSize: { type: 'f', value: 0.1 },
        resolution: { type: 'v2', value: new THREE.Vector2( 256, 256 ) },
        time: { type: 'f', value: 0 },
      },
      transparent: true,
      vertexShader: glslify( './shaders/render_vs' ),
      fragmentShader: glslify( './shaders/render_fs' ),
    });

    // init the FBO
    this.fbo = new FBO( 256, 256, this.renderer, this.simulationShader, this.renderShader );
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
    if ( this.simulationShader ) {
      const offset = this.simulationShader.uniforms.offset;
      const mixValue = this.simulationShader.uniforms.mixValue;

      this.simulationShader.uniforms.time.value = this.clock.getElapsedTime();

      if ( this.change ) {
        const dest = this.dest ? 1 : 0;

        mixValue.value += ( dest - mixValue.value ) * 0.6;

        if ( offset.value <= 0.49 ) {
          offset.value += ( 0.5 - offset.value ) * 0.4;
        } else {
          this.dest = !this.dest;
          this.change = false;
        }
      } else {
        offset.value += ( 0 - offset.value ) * 0.4;
      }
    }

    if ( this.renderShader ) this.renderShader.uniforms.time.value = this.clock.getElapsedTime();

    if ( this.fbo ) {
      this.fbo.update();
      this.renderer.render( this.scene, this.camera );
    }

    this.camera.position.x += ( this.mouse.x - this.camera.position.x / 2.0 ) * 0.06;
    this.camera.position.y += ( -this.mouse.y - this.camera.position.y / 2.0 ) * 0.06;
    this.camera.lookAt( this.scene.position );
  }
}
