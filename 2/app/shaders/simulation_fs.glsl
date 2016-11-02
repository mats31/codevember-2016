uniform sampler2D positions;//DATA Texture containing original positions
uniform vec2 resolution;
uniform float time;
varying vec2 vUv;

void main() {

    //basic simulation: displays the particles in place.
    vec4 pos = texture2D( positions, vUv );
    /*
        we can move the particle here
    */
    pos.x += sin( time * pos.w * ( 100. * sin(time * 0.001) ) ) * cos( time * pos.w ) * resolution.x;
    pos.y -= sin( time * pos.w * ( 10. * cos(time * 0.001) ) ) * sin( time * pos.w ) * resolution.y;
    pos.z *= min( 1., abs( distance( 0., pos.x ) / 128. - 1. ) );

    gl_FragColor = vec4( pos.xyz,1.0 );
}
