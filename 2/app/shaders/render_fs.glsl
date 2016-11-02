uniform float time;

varying vec4 customPos;

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main()
{
    // gl_FragColor = vec4( vec3(0.), .25 );
    // gl_FragColor = vec4( vec3(1.), .25 );
    gl_FragColor = mix( vec4( customPos.x, customPos.y, customPos.z, .25 ), vec4( customPos.z, customPos.x, customPos.y, .25 ), sin(time + rand(customPos.xy) ) * cos(time + rand(customPos.yz) ) * tan(time + rand(customPos.yx) ) );
    // gl_FragColor = vec4( customPos.y, customPos.y, customPos.x, .25 );
    // gl_FragColor = vec4( customPos.y, customPos.y, customPos.x, .25 );
}
