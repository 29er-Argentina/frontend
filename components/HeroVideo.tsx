"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/paths";

/**
 * Video de fondo del hero: sin controles, mudo, en loop y autoplay en iOS y Android.
 * - Fuerza `muted` por JS: React no siempre lo escribe en el HTML estático y sin él iOS no reproduce solo.
 * - Si el navegador bloquea el autoplay (modo bajo consumo, ahorro de datos), queda el póster
 *   y se reintenta con el primer toque o scroll.
 * - Se pausa fuera de pantalla y se retoma al volver a la pestaña.
 */
export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");

    let visible = true;
    const play = () => {
      if (!visible || document.hidden) return;
      const p = v.play();
      if (p) p.catch(() => {});
    };

    const gestures = ["touchstart", "pointerdown", "scroll", "keydown"] as const;
    const onGesture = () => {
      play();
      if (!v.paused) gestures.forEach((g) => window.removeEventListener(g, onGesture));
    };
    gestures.forEach((g) => window.addEventListener(g, onGesture, { passive: true }));

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) play();
      else v.pause();
    });
    io.observe(v);

    const onVisibility = () => (document.hidden ? v.pause() : play());
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", play);

    play();

    return () => {
      io.disconnect();
      gestures.forEach((g) => window.removeEventListener(g, onGesture));
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", play);
    };
  }, []);

  return (
    <video
      ref={ref}
      className="hero-video pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
      poster={asset("/videos/barcos-hero.jpg")}
      autoPlay
      muted
      loop
      playsInline
      controls={false}
      disablePictureInPicture
      disableRemotePlayback
      controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
      preload="auto"
      tabIndex={-1}
      aria-hidden="true"
    >
      {/* En celulares, versión 720p (3 MB) en lugar de la 1080p (9 MB) */}
      <source src={asset("/videos/barcos-hero-720.mp4")} type="video/mp4" media="(max-width: 1024px)" />
      <source src={asset("/videos/barcos-hero.mp4")} type="video/mp4" />
    </video>
  );
}
