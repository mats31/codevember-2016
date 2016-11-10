uniform sampler2D positions;//RenderTarget containing the transformed positions
uniform float pointSize;//size
uniform vec2 resolution;
uniform float time;

varying vec4 customPos;
varying vec3 customPos2;

void main() {

    //the mesh is a nomrliazed square so the uvs = the xy positions of the vertices
    vec4 pos = texture2D( positions, position.xy );
    // pos.x += 200. / resolution.x * 0.5;
    // float vel = pos.y;
    // pos.y = 0.;
    // customPos = pos;
    customPos2 = position;
    // pos.x += cos(time * vel * 0.1) * 200.;
    // pos.y += sin(time * vel * 0.1) * 200.;
    //pos now contains a 3D position in space, we can use it as a regular vertex

    //regular projection of our position
    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos.xyz, 1.0 );

    //sets the point size
    gl_PointSize = pointSize;
}
