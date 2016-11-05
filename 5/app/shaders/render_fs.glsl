uniform float time;
varying vec4 customPos;

void main()
{
    // gl_FragColor = vec4( vec3(0.), .25 );
    // gl_FragColor = vec4( vec3(1.), .25 );
    gl_FragColor = vec4( 0., cos(time * 0.1), cos(time * 0.01), 1. );
    gl_FragColor = vec4( 0., 0., 0., 0.7 );
    // gl_FragColor = vec4( customPos.y, customPos.y, customPos.x, .25 );
    // gl_FragColor = vec4( customPos.y, customPos.y, customPos.x, .25 );
}
