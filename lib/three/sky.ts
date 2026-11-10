import * as THREE from "three";

export type SkyPalette = {
  zenith: string;
  horizon: string;
  mid: string;
  haze: string;
  sun: string;
  /** elevación del sol en grados */
  sunElevation: number;
  /** azimut del sol en grados (0 = -Z, 90 = +X) */
  sunAzimuth: number;
  water: string;
  waterScatter: string;
  cloudiness: number;
};

export const GOLDEN_HOUR: SkyPalette = {
  zenith: "#0a1c46",
  horizon: "#f08a52",
  mid: "#6a4f8f",
  haze: "#ffc08a",
  sun: "#ffd49a",
  sunElevation: 5.5,
  sunAzimuth: -78,
  water: "#03101c",
  waterScatter: "#0c4f63",
  cloudiness: 0.5,
};

export const RACE_DAY: SkyPalette = {
  zenith: "#1d5fa8",
  horizon: "#bfe0f5",
  mid: "#76b4e8",
  haze: "#e9f6ff",
  sun: "#fff6e0",
  sunElevation: 38,
  sunAzimuth: -35,
  water: "#06304d",
  waterScatter: "#1a8aa0",
  cloudiness: 0.35,
};

export function sunDirection(p: SkyPalette) {
  const el = THREE.MathUtils.degToRad(p.sunElevation);
  const az = THREE.MathUtils.degToRad(p.sunAzimuth);
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
}

/** GLSL compartido por cielo y agua para que el reflejo coincida con el cielo. */
export const SKY_GLSL = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uMid;
uniform vec3 uHaze;
uniform vec3 uSunColor;
uniform vec3 uSunDir;
uniform float uCloudiness;
uniform float uTime;

float skyHash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
float skyNoise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(skyHash(i), skyHash(i+vec2(1,0)), u.x), mix(skyHash(i+vec2(0,1)), skyHash(i+vec2(1,1)), u.x), u.y);
}
float skyFbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for(int i=0;i<5;i++){ v += a*skyNoise(p); p *= 2.03; a *= 0.5; }
  return v;
}

vec3 skyColor(vec3 dir, bool withSunDisk){
  dir = normalize(dir);
  float h = max(dir.y, 0.0);
  vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.2, h));
  col = mix(col, uZenith, smoothstep(0.1, 0.65, h));
  // bruma cálida pegada al horizonte
  col = mix(col, uHaze, exp(-h * 26.0) * 0.45);
  float sd = max(dot(dir, uSunDir), 0.0);
  col += uSunColor * pow(sd, 8.0) * 0.22;
  col += uSunColor * pow(sd, 90.0) * 0.45;
  if (withSunDisk) col += uSunColor * smoothstep(0.9993, 0.9997, sd) * 6.0;

  // nubes estratificadas cerca del horizonte
  if (dir.y > 0.0 && uCloudiness > 0.0) {
    vec2 uv = dir.xz / (dir.y + 0.08) * 1.4 + vec2(uTime * 0.004, 0.0);
    float n = skyFbm(uv * 0.9);
    float band = smoothstep(0.0, 0.08, dir.y) * (1.0 - smoothstep(0.12, 0.55, dir.y));
    float c = smoothstep(1.0 - uCloudiness, 1.05 - uCloudiness * 0.55, n) * band;
    vec3 cloudLit = mix(uHaze, uSunColor, pow(sd, 3.0)) * 1.05;
    vec3 cloudShade = mix(uZenith, uHorizon, 0.45);
    vec3 cloud = mix(cloudShade, cloudLit, smoothstep(0.35, 0.9, n));
    col = mix(col, cloud, c * 0.85);
  }
  // por debajo del horizonte: tono del mar lejano
  if (dir.y < 0.0) col = mix(uHaze, uZenith, 0.35);
  return col;
}
`;

export function skyUniforms(p: SkyPalette) {
  return {
    uZenith: { value: new THREE.Color(p.zenith) },
    uHorizon: { value: new THREE.Color(p.horizon) },
    uMid: { value: new THREE.Color(p.mid) },
    uHaze: { value: new THREE.Color(p.haze) },
    uSunColor: { value: new THREE.Color(p.sun) },
    uSunDir: { value: sunDirection(p) },
    uCloudiness: { value: p.cloudiness },
    uTime: { value: 0 },
  };
}

/** Cambia en vivo los colores de un set de uniforms creado con skyUniforms (cielo u océano). */
export function applyPalette(u: ReturnType<typeof skyUniforms>, p: SkyPalette) {
  u.uZenith.value.set(p.zenith);
  u.uHorizon.value.set(p.horizon);
  u.uMid.value.set(p.mid);
  u.uHaze.value.set(p.haze);
  u.uSunColor.value.set(p.sun);
  u.uSunDir.value.copy(sunDirection(p));
  u.uCloudiness.value = p.cloudiness;
}

export function createSky(p: SkyPalette) {
  const uniforms = skyUniforms(p);
  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main(){
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */ `
      ${SKY_GLSL}
      varying vec3 vDir;
      void main(){
        gl_FragColor = vec4(skyColor(vDir, true), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return { mesh, uniforms };
}

/** Genera un environment map a partir del cielo para iluminar materiales PBR. */
export function bakeEnvironment(renderer: THREE.WebGLRenderer, p: SkyPalette) {
  const scene = new THREE.Scene();
  const { mesh } = createSky({ ...p, cloudiness: 0 });
  mesh.scale.setScalar(0.05);
  scene.add(mesh);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(scene, 0.02);
  pmrem.dispose();
  mesh.geometry.dispose();
  (mesh.material as THREE.Material).dispose();
  return rt.texture;
}
