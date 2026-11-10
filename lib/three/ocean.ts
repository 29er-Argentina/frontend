import * as THREE from "three";
import { SKY_GLSL, skyUniforms, type SkyPalette } from "./sky";

/** Olas de Gerstner. Las mismas se usan en el shader y en la física del barco. */
type Wave = { L: number; A: number; dir: number; Q: number };

const WAVES: Wave[] = [
  { L: 48, A: 0.5, dir: 15, Q: 0.5 },
  { L: 27, A: 0.3, dir: -30, Q: 0.55 },
  { L: 15, A: 0.17, dir: 55, Q: 0.6 },
  { L: 8.5, A: 0.085, dir: -70, Q: 0.6 },
  { L: 4.6, A: 0.045, dir: 25, Q: 0.5 },
];

const G = 9.81;
const PRE = WAVES.map((w) => {
  const k = (2 * Math.PI) / w.L;
  const a = THREE.MathUtils.degToRad(w.dir);
  return { k, c: Math.sqrt(G / k), dx: Math.sin(a), dz: -Math.cos(a), A: w.A, Q: w.Q };
});

const MAX_GUSTS = 8;

/** Altura aproximada del agua en (x, z) para un tiempo t. */
export function waveHeight(x: number, z: number, t: number, amp = 1) {
  let y = 0;
  for (const w of PRE) {
    const f = w.k * (w.dx * x + w.dz * z - w.c * t);
    y += w.A * amp * Math.sin(f);
  }
  return y;
}

const wavesGLSL = PRE.map(
  (w, i) =>
    `const vec4 W${i} = vec4(${w.dx.toFixed(5)}, ${w.dz.toFixed(5)}, ${w.k.toFixed(5)}, ${w.c.toFixed(5)});
     const vec2 P${i} = vec2(${w.A.toFixed(5)}, ${w.Q.toFixed(5)});`
).join("\n");

const gerstnerCalls = PRE.map((_, i) => `gerstner(W${i}, P${i}, p, t, amp, disp, nrm);`).join("\n");

export type Gust = { x: number; z: number; r: number; s: number };

export type OceanOptions = {
  palette: SkyPalette;
  amplitude?: number;
  segments?: number;
  radius?: number;
  gusts?: boolean;
};

export function createOcean(opts: OceanOptions) {
  const segs = opts.segments ?? 400;
  const R = opts.radius ?? 1400;
  const K = 5;

  // Grilla no uniforme: densa cerca de la cámara y muy amplia hacia el horizonte.
  const geo = new THREE.PlaneGeometry(2, 2, segs, segs);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const remap = (u: number) => (R * Math.sinh(K * u)) / Math.sinh(K);
  for (let i = 0; i < pos.count; i++) {
    pos.setX(i, remap(pos.getX(i)));
    pos.setZ(i, remap(pos.getZ(i)));
  }
  pos.needsUpdate = true;
  geo.computeBoundingSphere();

  const uniforms = {
    ...skyUniforms(opts.palette),
    uAmp: { value: opts.amplitude ?? 1 },
    uWater: { value: new THREE.Color(opts.palette.water) },
    uScatter: { value: new THREE.Color(opts.palette.waterScatter) },
    uGusts: { value: Array.from({ length: MAX_GUSTS }, () => new THREE.Vector4(0, 0, 0, 0)) },
    uGustCount: { value: 0 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uAmp;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying float vHeight;
      ${wavesGLSL}

      void gerstner(vec4 w, vec2 pa, vec2 p, float t, float amp, inout vec3 disp, inout vec3 nrm){
        float A = pa.x * amp;
        float f = w.z * (dot(w.xy, p) - w.w * t);
        float c = cos(f); float s = sin(f);
        disp.x += pa.y * A * w.x * c;
        disp.z += pa.y * A * w.y * c;
        disp.y += A * s;
        nrm.x -= w.x * w.z * A * c;
        nrm.z -= w.y * w.z * A * c;
        nrm.y -= pa.y * w.z * A * s;
      }

      void main(){
        vec4 world = modelMatrix * vec4(position, 1.0);
        float dist = length(world.xz - cameraPosition.xz);
        float amp = uAmp * (1.0 - smoothstep(120.0, 650.0, dist));
        vec2 p = world.xz;
        float t = uTime;
        vec3 disp = vec3(0.0);
        vec3 nrm = vec3(0.0, 1.0, 0.0);
        ${gerstnerCalls}
        world.xyz += disp;
        vHeight = disp.y / max(uAmp, 0.001);
        vWorld = world.xyz;
        vNormal = normalize(nrm);
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: /* glsl */ `
      ${SKY_GLSL}
      uniform vec3 uWater;
      uniform vec3 uScatter;
      uniform float uAmp;
      uniform vec4 uGusts[${MAX_GUSTS}];
      uniform int uGustCount;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying float vHeight;

      float h2(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 15731.743); }
      float vnoise(vec2 p){
        vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(h2(i), h2(i+vec2(1,0)), u.x), mix(h2(i+vec2(0,1)), h2(i+vec2(1,1)), u.x), u.y);
      }
      float ripples(vec2 p, float t){
        float v = 0.0;
        v += vnoise(p * 0.9 + vec2(t * 0.35, t * 0.12)) * 0.5;
        v += vnoise(p * 2.1 - vec2(t * 0.2, -t * 0.45)) * 0.3;
        v += vnoise(p * 4.7 + vec2(-t * 0.6, t * 0.3)) * 0.2;
        return v;
      }

      void main(){
        vec3 V = normalize(cameraPosition - vWorld);
        float dist = length(cameraPosition - vWorld);

        // Ráfagas: zonas de agua más oscura y rizada
        float gust = 0.0;
        for (int i = 0; i < ${MAX_GUSTS}; i++) {
          if (i >= uGustCount) break;
          vec4 g = uGusts[i];
          float d = length(vWorld.xz - g.xy) / g.z;
          float edge = vnoise(vWorld.xz * 0.08 + float(i) * 7.0) * 0.35;
          gust = max(gust, (1.0 - smoothstep(0.55 + edge, 1.0 + edge, d)) * g.w);
        }

        // Micro-olas por diferencias finitas
        float detailFade = 1.0 - smoothstep(30.0, 220.0, dist);
        float e = 0.08;
        vec2 q = vWorld.xz;
        float r0 = ripples(q, uTime);
        float rx = ripples(q + vec2(e, 0.0), uTime);
        float rz = ripples(q + vec2(0.0, e), uTime);
        float rough = (0.55 + gust * 1.6) * detailFade;
        vec3 N = normalize(vNormal + vec3(-(rx - r0) / e, 0.0, -(rz - r0) / e) * 0.11 * rough);

        float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 R = reflect(-V, N);
        R.y = abs(R.y);
        vec3 refl = skyColor(R, false);

        // dispersión subsuperficial en las crestas
        float crest = clamp(vHeight * 0.9 + 0.35, 0.0, 1.0);
        float sss = pow(max(dot(V, -uSunDir), 0.0), 3.0) * 0.3 + 0.25;
        vec3 body = mix(uWater, uScatter, crest * sss);
        body = mix(body, uWater * 0.6, gust * 0.55);

        vec3 col = mix(body, refl, clamp(fres, 0.0, 1.0));

        // brillo especular del sol
        float spec = pow(max(dot(R, uSunDir), 0.0), 520.0);
        float glint = pow(max(dot(R, uSunDir), 0.0), 60.0) * 0.08;
        col += uSunColor * (spec * 9.0 + glint) * (0.6 + 0.4 * r0);

        // espuma en las crestas
        float foamN = vnoise(q * 3.1 + uTime * 0.4) * 0.6 + vnoise(q * 7.3 - uTime * 0.2) * 0.4;
        float foam = smoothstep(0.95, 1.25, vHeight + foamN * 0.55) * uAmp * detailFade;
        col = mix(col, vec3(0.92, 0.96, 1.0), foam * 0.28);

        // niebla hacia el horizonte
        float fog = 1.0 - exp(-dist * 0.0019);
        vec3 horizonCol = skyColor(normalize(vec3(-V.x, 0.015, -V.z)), false);
        col = mix(col, horizonCol, clamp(fog, 0.0, 1.0));

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;

  return {
    mesh,
    uniforms,
    update(t: number, camera: THREE.Camera) {
      uniforms.uTime.value = t;
      mesh.position.set(Math.round(camera.position.x), 0, Math.round(camera.position.z));
    },
    setGusts(gusts: Gust[]) {
      const n = Math.min(gusts.length, MAX_GUSTS);
      for (let i = 0; i < n; i++) uniforms.uGusts.value[i].set(gusts[i].x, gusts[i].z, gusts[i].r, gusts[i].s);
      uniforms.uGustCount.value = n;
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    },
  };
}
