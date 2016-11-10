uniform sampler2D positions;//RenderTarget containing the transformed positions
uniform float pointSize;//size
uniform vec2 resolution;
uniform float time;

attribute float velocity;

varying vec3 fragPos;

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {

    //the mesh is a nomrliazed square so the uvs = the xy positions of the vertices
    vec4 pos = texture2D( positions, position.xy );
    fragPos = position;
    // pos.x += 200. / resolution.x * 0.5;
    // float vel = pos.y;
    pos.y = 0.;

    pos.x += sin(time * velocity * 1. ) * distance(pos.x, 0.) * -1.;
    // pos.y += sin(time * velocity * 1. ) * 100.;
    // pos.y += sin(time * rand(pos.xy) * 1. ) * 500.;
    //pos now contains a 3D position in space, we can use it as a regular vertex

    //regular projection of our position
    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos.xyz, 1.0 );

    //sets the point size
    gl_PointSize = pointSize;
}
