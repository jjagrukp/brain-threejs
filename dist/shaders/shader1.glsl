#define GLSLIFY 1
varying vec2 vUv;
varying float vViewZDepth;

void main() {
  #include <begin_vertex>
  #include <project_vertex>
  vViewZDepth = - mvPosition.z;
  vUv = uv;
}

#define GLSLIFY 1
varying float vViewZDepth;
varying vec2 vUv;

void main() {
  float color = 1.0 - smoothstep( u_near, u_far, vViewZDepth );
  gl_FragColor = vec4( vec3( color ), 1.0 );
}

 #define GLSLIFY 1
mat4 rotationMatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}


#define GLSLIFY 1
mat4 rotMat = rotationMatrix(vec3(a_angle.x, a_angle.y, a_angle.z), mod(a_angle.w * u_time * 0.15, 3.1416 * 2.));
vec4 mvPosition = vec4( transformed, 1.0 );

v_color = a_color;

#ifdef USE_INSTANCING
  mat4 instanceMat = instanceMatrix;

  float zFactor = map(instanceMat[3][2], 0., 9., 0.5, 0.2);

  instanceMat[3][0] = instanceMat[3][0] * u_resolution.x * zFactor - u_mouse.x * a_param.x + sin(u_time * a_param.w * 0.5) * a_param.y * 0.15;
  instanceMat[3][1] = instanceMat[3][1] * u_resolution.y * zFactor - u_mouse.y * a_param.x + cos(u_time * a_param.w * 0.5) * a_param.z * 0.15;
  instanceMat[3][2] = instanceMat[3][2];

  instanceMat[0][0] = instanceMat[0][0] * u_scale;
  instanceMat[1][1] = instanceMat[1][1] * u_scale;
  instanceMat[2][2] = instanceMat[2][2] * u_scale;

  instanceMat *= rotMat;
  mvPosition = instanceMat * mvPosition;
#endif

mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;


#define GLSLIFY 1
float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
};
