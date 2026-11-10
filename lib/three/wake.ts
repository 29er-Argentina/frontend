import * as THREE from "three";

/** Estela y spray: partículas en espacio mundo. */
export function createWake(max = 1400) {
  const pos = new Float32Array(max * 3);
  const vel = new Float32Array(max * 3);
  const life = new Float32Array(max);
  const maxLife = new Float32Array(max);
  const size = new Float32Array(max);
  const kind = new Uint8Array(max); // 0 espuma, 1 spray
  const alpha = new Float32Array(max);
  const drawSize = new Float32Array(max);
  let cursor = 0;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("aSize", new THREE.BufferAttribute(drawSize, 1).setUsage(THREE.DynamicDrawUsage));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uPixel: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aAlpha;
      attribute float aSize;
      uniform float uPixel;
      varying float vAlpha;
      void main(){
        vAlpha = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPixel * (260.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main(){
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float a = exp(-d * d * 18.0) * vAlpha;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vec3(0.94, 0.97, 1.0), a);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  function emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, s: number, l: number, k: 0 | 1) {
    const i = cursor;
    cursor = (cursor + 1) % max;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
    life[i] = 0; maxLife[i] = l; size[i] = s; kind[i] = k;
  }

  return {
    points,
    setPixelRatio(pr: number) {
      mat.uniforms.uPixel.value = pr;
    },
    /** Emite estela y spray según la velocidad del barco. */
    spawn(boatPos: THREE.Vector3, heading: number, speed: number, dt: number, rand = Math.random) {
      const fx = -Math.sin(heading), fz = -Math.cos(heading);
      const rx = Math.cos(heading), rz = -Math.sin(heading);
      const rate = Math.min(1, speed / 9);
      const nFoam = Math.round((80 + 380 * rate) * dt * 2);
      for (let n = 0; n < nFoam; n++) {
        const side = rand() < 0.5 ? -1 : 1;
        const along = -1.9 - rand() * 0.4;
        const off = side * (0.25 + rand() * 0.35);
        const x = boatPos.x + fx * along + rx * off;
        const z = boatPos.z + fz * along + rz * off;
        const spread = 0.4 + rate * 0.9;
        emit(x, 0, z, rx * side * spread * rand() - fx * 0.3, 0, rz * side * spread * rand() - fz * 0.3, 0.22 + rand() * 0.35, 2.5 + rand() * 3, 0);
      }
      // bigotes de proa
      const nBow = Math.round(60 * rate * rate * dt * 4);
      for (let n = 0; n < nBow; n++) {
        const side = rand() < 0.5 ? -1 : 1;
        const x = boatPos.x + fx * (1.2 + rand() * 0.6) + rx * side * 0.45;
        const z = boatPos.z + fz * (1.2 + rand() * 0.6) + rz * side * 0.45;
        const out = 1.2 + rand() * 2.0 * rate;
        emit(x, boatPos.y + 0.05, z, rx * side * out, 0.8 + rand() * 1.6 * rate, rz * side * out, 0.08 + rand() * 0.12, 0.6 + rand() * 0.5, 1);
      }
    },
    update(dt: number, heightAt: (x: number, z: number) => number) {
      for (let i = 0; i < max; i++) {
        if (life[i] >= maxLife[i]) {
          alpha[i] = 0;
          continue;
        }
        life[i] += dt;
        const t = life[i] / maxLife[i];
        const ix = i * 3;
        pos[ix] += vel[ix] * dt;
        pos[ix + 2] += vel[ix + 2] * dt;
        if (kind[i] === 0) {
          vel[ix] *= 1 - dt * 1.2;
          vel[ix + 2] *= 1 - dt * 1.2;
          pos[ix + 1] = heightAt(pos[ix], pos[ix + 2]) + 0.03;
          alpha[i] = Math.pow(1 - t, 1.5) * Math.min(1, t * 8) * 0.42;
          drawSize[i] = size[i] * (1 + t * 3.5);
        } else {
          vel[ix + 1] -= 9.8 * dt;
          pos[ix + 1] += vel[ix + 1] * dt;
          const floor = heightAt(pos[ix], pos[ix + 2]);
          if (pos[ix + 1] < floor) life[i] = maxLife[i];
          alpha[i] = (1 - t) * 0.7;
          drawSize[i] = size[i];
        }
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aAlpha.needsUpdate = true;
      geo.attributes.aSize.needsUpdate = true;
    },
    reset() {
      life.fill(0);
      maxLife.fill(0);
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    },
  };
}
