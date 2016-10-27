import * as THREE from 'three';

export default class Letter extends THREE.Object3D {
  constructor( options ) {
    super();

    this.text = options.text || 'No Text';

    this.font = options.font;

    this.size = options.size || 70;
    this.height = options.height;
    this.curveSegments = options.curveSegments || 0.5;

    this.bevelThickness = options.bevelThickness || 0.5;
    this.bevelSize = options.bevelSize || 0.5;
    this.bevelEnabled = options.bevelEnabled || false;

    this.createGeometry();
    // this.createMaterial();

    // this.mesh = new THREE.Mesh( this.geometry, this.material );
  }

  createGeometry() {

    this.geometry = new THREE.TextGeometry( this.text, {
      font: this.font,
      size: this.size,
      height: this.height,
      curveSegments: this.curveSegments,
      bevelThickness: this.bevelThickness,
      bevelSize: this.bevelSize,
      bevelEnabled: this.bevelEnabled,
      material: 0,
      extrudeMaterial: 1,
    });

    this.geometry.computeBoundingBox();
    this.geometry.computeVertexNormals();
  }

  createMaterial() {
    this.material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
    });
  }

  update() {}
}
