varying vec4 customPos;

void main()
{
    // gl_FragColor = vec4( vec3(0.), .25 );
    // gl_FragColor = vec4( vec3(1.), .25 );
    gl_FragColor = vec4( customPos.x / 256., customPos.y / 256., customPos.z / 256., .25 );
    // gl_FragColor = vec4( customPos.y, customPos.y, customPos.x, .25 );
    // gl_FragColor = vec4( customPos.y, customPos.y, customPos.x, .25 );
}
