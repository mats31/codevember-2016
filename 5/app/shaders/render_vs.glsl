uniform sampler2D positions;//RenderTarget containing the transformed positions
uniform float pointSize;//size
uniform vec2 mouse;
uniform vec2 resolution;
uniform float time;

varying vec4 customPos;

void main() {

    //the mesh is a nomrliazed square so the uvs = the xy positions of the vertices
    vec4 pos = texture2D( positions, position.xy );
    customPos = pos;
    float dist = distance(pos.xz, 256. * mouse);
    dist *= abs( step( 100., dist) - 1. ) * ( step( -100., dist) );

    // pos.xz += dist * 200.;
    pos.xz *= dist/100. ;
    //pos now contains a 3D position in space, we can use it as a regular vertex

    //regular projection of our position
    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos.xyz, 1.0 );

    //sets the point size
    gl_PointSize = pointSize;
}
