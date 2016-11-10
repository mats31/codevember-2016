uniform sampler2D map;//DATA Texture containing original positions
uniform vec2 resolution;
uniform float time;
varying vec2 vUv;

void main() {

  //basic simulation: displays the particles in place.
  vec4 pos = texture2D( map, vUv );
  /*
      we can move the particle here
  */
  // pos.x *= sin(time * abs(pos.w) * 0.01);
  // pos.y *= sin(time * 0.001) + 5.;
//  float noise = cnoise( pos.xyz * cos(time * 0.1) );
  // pos.x += tan( time * pos.w ) * resolution.x;
  // pos.y -= sin( time * pos.w ) * resolution.y;
  // pos.z *= min( 1., abs( distance( 0., pos.x ) / 128. - 1. ) );

  gl_FragColor = vec4( pos.r, pos.g, pos.b, pos.a);
}
