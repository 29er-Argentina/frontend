"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { GOLDEN_HOUR, bakeEnvironment, createSky, sunDirection } from "@/lib/three/sky";
import { createOcean, waveHeight } from "@/lib/three/ocean";
import { create29er, float29er } from "@/lib/three/boat29er";
import { createWake } from "@/lib/three/wake";

export default function HeroScene({ onReady }: { onReady?: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const isSmall = window.matchMedia("(max-width: 768px)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      return; // sin WebGL: queda el fondo en CSS
    }
    const pr = Math.min(window.devicePixelRatio, isSmall ? 1.5 : 1.75);
    renderer.setPixelRatio(pr);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(isSmall ? 52 : 38, 1, 0.1, 4000);

    const palette = GOLDEN_HOUR;
    const sky = createSky(palette);
    scene.add(sky.mesh);
    scene.environment = bakeEnvironment(renderer, palette);
    scene.environmentIntensity = 0.9;

    const sunDir = sunDirection(palette);
    const sun = new THREE.DirectionalLight(new THREE.Color(palette.sun), 2.6);
    sun.position.copy(sunDir).multiplyScalar(50);
    scene.add(sun, sun.target);
    scene.add(new THREE.HemisphereLight("#9cc4ff", "#0b2233", 0.6));

    const ocean = createOcean({ palette, amplitude: 1, segments: isSmall ? 220 : 380 });
    scene.add(ocean.mesh);

    const boat = create29er();
    scene.add(boat.root);
    const wake = createWake(isSmall ? 800 : 1500);
    wake.setPixelRatio(pr);
    scene.add(wake.points);

    // Post-proceso: un bloom suave para los destellos del sol
    let composer: EffectComposer | null = null;
    if (!isSmall) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.22, 0.5, 0.93));
      composer.addPass(new OutputPass());
    }

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      composer?.setSize(w, h);
      camera.aspect = w / h;
      // en desktop corremos el encuadre para que el barco quede a la derecha del texto
      if (w > 900) camera.setViewOffset(w, h, -w * 0.17, h * 0.02, w, h);
      else camera.setViewOffset(w, h, 0, h * 0.14, w, h);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // interacción
    const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    let scroll = 0;
    const onScroll = () => {
      scroll = Math.min(1, window.scrollY / window.innerHeight);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 });
    io.observe(mount);

    const clock = new THREE.Timer();
    let t = 0;
    let speed = 6;
    let raf = 0;
    let readySent = false;
    const heightAt = (x: number, z: number) => waveHeight(x, z, t, 1);
    const look = new THREE.Vector3();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      clock.update();
      const dt = Math.min(clock.getDelta(), 1 / 20);
      if (!visible || document.hidden) return;
      t += dt;

      // Ciclo: un largo con asimétrico y luego una ceñida
      const phase = (t % 30) / 30;
      const downwind = phase < 0.6;
      const twa = downwind ? 2.35 : 0.8;
      const targetSpeed = downwind ? 9 : 5.2;
      speed += (targetSpeed - speed) * dt * 0.35;
      const sv = boat.trim(twa, dt);

      const heading = 0;
      const p = boat.root.position;
      p.z -= speed * dt;
      if (p.z < -3500) {
        p.z = 0;
        wake.reset();
      }
      float29er(boat, heightAt, heading, (downwind ? 0.05 : 0.12) * (Math.sin(t * 0.7) * 0.25 + 1), dt, sv);
      wake.spawn(p, heading, speed, dt);
      wake.update(dt, heightAt);

      // cámara cinematográfica
      pointer.sx += (pointer.x - pointer.sx) * dt * 2;
      pointer.sy += (pointer.y - pointer.sy) * dt * 2;
      const auto = reduceMotion ? 0 : Math.sin(t * 0.045) * 0.75;
      const az = Math.PI * 0.5 + 0.45 + auto + pointer.sx * 0.35;
      const el = 0.13 + scroll * 0.35 + pointer.sy * -0.05;
      const dist = (isSmall ? 21 : 16) + scroll * 10;
      camera.position.set(p.x + Math.sin(az) * dist * Math.cos(el), Math.max(1.1, p.y + 1.4 + Math.sin(el) * dist), p.z - Math.cos(az) * dist * Math.cos(el));
      look.set(p.x, p.y + 2.6 - scroll * 1.2, p.z);
      camera.lookAt(look);

      sun.position.copy(p).addScaledVector(sunDir, 50);
      sun.target.position.copy(p);
      sky.mesh.position.copy(camera.position);
      sky.uniforms.uTime.value = t;
      ocean.update(t, camera);

      if (composer) composer.render();
      else renderer.render(scene, camera);

      if (!readySent) {
        readySent = true;
        onReady?.();
      }
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      boat.dispose();
      wake.dispose();
      ocean.dispose();
      sky.mesh.geometry.dispose();
      (sky.mesh.material as THREE.Material).dispose();
      scene.environment?.dispose();
      composer?.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [onReady]);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}
