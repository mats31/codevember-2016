uniform sampler2D map0;//DATA Texture containing original positions
uniform sampler2D map1;//DATA Texture containing original positions
uniform vec2 resolution;
uniform float time;
uniform float offset;
uniform float mixValue;
varying vec2 vUv;

void main() {

  //origin
   vec3 origin  = texture2D( map0, vUv ).xyz;
   float alpha0 = texture2D( map0, vUv ).a;

   //destination
   vec3 destination = texture2D( map1, vUv ).xyz;
   float alpha1 = texture2D( map1, vUv ).a;

   //lerp
   vec3 pos = mix( origin + vec3(offset) * ( alpha0 * tan(origin.x)), destination + vec3(offset) * ( alpha1 * -1. * sin(origin.x)), mixValue );
   float alpha = alpha0;
  // float alpha = mix( alpha0, alpha1, mixValue );

   gl_FragColor = vec4( pos, alpha );
}
