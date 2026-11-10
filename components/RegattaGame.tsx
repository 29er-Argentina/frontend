"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Hud, Phase, RaceStats, RegattaEngine } from "@/lib/game/regatta";
import { COURSES, DEFAULT_COURSE, getCourse, type CourseId } from "@/lib/game/courses";

const BEST_KEY = "29er-arg-regata-best";
// v2: canchas con más boyas y penalizaciones, los récords anteriores no son comparables.
const bestKey = (id: CourseId) => `${BEST_KEY}-v2-${id}`;
// Mismos valores que RULES en el motor (se duplican para no cargar Three.js antes de tiempo).
const TOUCH_SECONDS = 5;
const TOUCH_POINTS = 150;

function fmt(t: number) {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}

function readBest(id: CourseId): number | null {
  try {
    const v = window.localStorage.getItem(bestKey(id));
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}
function writeBest(id: CourseId, v: number) {
  try {
    window.localStorage.setItem(bestKey(id), String(v));
  } catch {
    /* sin storage */
  }
}

type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FsDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void };
type LockableOrientation = ScreenOrientation & { lock?: (o: "landscape") => Promise<void>; unlock?: () => void };

function fsElement() {
  const d = document as FsDocument;
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

function lockLandscape() {
  try {
    const o = screen.orientation as LockableOrientation | undefined;
    o?.lock?.("landscape").catch(() => {});
  } catch {
    /* sin soporte (iOS): se muestra el aviso de girar */
  }
}
function unlockOrientation() {
  try {
    (screen.orientation as LockableOrientation | undefined)?.unlock?.();
  } catch {
    /* nada */
  }
}

export default function RegattaGame() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RegattaEngine | null>(null);
  const mapRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [hud, setHud] = useState<Hud | null>(null);
  const [splits, setSplits] = useState<number[]>([]);
  const [result, setResult] = useState<({ time: number; best: number | null; record: boolean } & RaceStats) | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [touchMsg, setTouchMsg] = useState<{ text: string; key: number } | null>(null);
  /** Sedes cuya intro ya se vio en esta visita (la revancha va directo a la cuenta). */
  const introSeen = useRef(new Set<CourseId>());
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [showRules, setShowRules] = useState(false);
  /** Detalles extra en la barra del HUD (puntos, distancia, VMG). */
  const [details, setDetails] = useState(false);
  /** Cámara aérea (true) o detrás del barco (false). */
  const [camAerial, setCamAerial] = useState(false);
  const [near, setNear] = useState(false);
  const [courseId, setCourseId] = useState<CourseId>(DEFAULT_COURSE);
  const courseRef = useRef(courseId);
  courseRef.current = courseId;
  const course = getCourse(courseId);
  const [full, setFull] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const nativeFull = useRef(false);
  const needRotate = full && isTouch && portrait;
  const needRotateRef = useRef(needRotate);
  needRotateRef.current = needRotate;

  // Tipo de puntero y orientación
  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)");
    const port = window.matchMedia("(orientation: portrait)");
    const sync = () => {
      setIsTouch(coarse.matches);
      setPortrait(port.matches);
    };
    sync();
    coarse.addEventListener("change", sync);
    port.addEventListener("change", sync);
    return () => {
      coarse.removeEventListener("change", sync);
      port.removeEventListener("change", sync);
    };
  }, []);

  // Cargar el motor recién cuando la sección se acerca al viewport
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near || !mountRef.current) return;
    let cancelled = false;
    setBest(readBest(courseRef.current));
    import("@/lib/game/regatta").then(({ RegattaEngine }) => {
      if (cancelled || !mountRef.current) return;
      try {
        engineRef.current = new RegattaEngine(
          mountRef.current,
          {
            onPhase: setPhase,
            onLeg: (_leg, split, message) => {
              setSplits((s) => [...s, split]);
              setToast(message);
            },
            onFinish: (time, stats) => {
              const id = courseRef.current;
              const prev = readBest(id);
              const record = prev === null || time < prev;
              if (record) writeBest(id, time);
              setBest(record ? time : prev);
              setResult({ time, best: prev, record, ...stats });
            },
            onTouch: (stats) => {
              setTouchMsg({ text: `¡Tocaste! +${TOUCH_SECONDS} s · −${TOUCH_POINTS} pts (quedan ${stats.points})`, key: Date.now() });
            },
            onCrash: () => setTouchMsg({ text: "¡Chocaste contra la costa!", key: Date.now() }),
          },
          courseRef.current,
        );
        engineRef.current.paused = needRotateRef.current;
        engineRef.current.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        setCamAerial(engineRef.current.cameraMode === 1);
        setReady(true);
      } catch {
        setFailed(true);
      }
    });
    return () => {
      cancelled = true;
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [near]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!touchMsg) return;
    const id = setTimeout(() => setTouchMsg(null), 1800);
    return () => clearTimeout(id);
  }, [touchMsg]);

  // HUD a ~12 fps
  useEffect(() => {
    const id = setInterval(() => {
      const e = engineRef.current;
      if (!e) return;
      const h = e.hud();
      setHud(h);
      drawMap(mapRef.current, h);
    }, 80);
    return () => clearInterval(id);
  }, []);

  // Teclado
  useEffect(() => {
    const keys = new Set<string>();
    const sync = () => {
      engineRef.current?.setInput(keys.has("left"), keys.has("right"));
    };
    const map = (k: string) => (k === "ArrowLeft" || k === "a" || k === "A" ? "left" : k === "ArrowRight" || k === "d" || k === "D" ? "right" : null);
    const down = (ev: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine || engine.phase === "idle") return;
      const k = map(ev.key);
      if (k) {
        ev.preventDefault();
        keys.add(k);
        sync();
      }
      if (ev.key === "c" || ev.key === "C") setCamAerial(engine.toggleCamera() === 1);
    };
    const up = (ev: KeyboardEvent) => {
      const k = map(ev.key);
      if (k) {
        keys.delete(k);
        sync();
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const start = useCallback(() => {
    setResult(null);
    setSplits([]);
    setTouchMsg(null);
    const id = courseRef.current;
    const withIntro = !introSeen.current.has(id);
    introSeen.current.add(id);
    engineRef.current?.start(withIntro);
    if (!wrapRef.current?.hasAttribute("data-full")) wrapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // ───── Pantalla completa ─────
  const exitFull = useCallback(() => {
    unlockOrientation();
    if (fsElement()) {
      const d = document as FsDocument;
      try {
        Promise.resolve(d.exitFullscreen ? d.exitFullscreen() : d.webkitExitFullscreen?.()).catch(() => {});
      } catch {
        /* nada */
      }
    }
    nativeFull.current = false;
    setFull(false);
  }, []);

  const enterFull = useCallback(async () => {
    const el = wrapRef.current as FsElement | null;
    if (!el) return;
    setFull(true);
    try {
      if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: "hide" });
      else await el.webkitRequestFullscreen?.();
    } catch {
      /* iOS en iPhone no permite fullscreen de elementos: queda el modo CSS */
    }
    nativeFull.current = fsElement() === el;
    lockLandscape();
  }, []);

  // Si el usuario sale del fullscreen nativo (gesto atrás, Esc), salimos del modo
  useEffect(() => {
    const onChange = () => {
      if (nativeFull.current && !fsElement()) {
        nativeFull.current = false;
        unlockOrientation();
        setFull(false);
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  // Modo CSS: Esc para salir y sin scroll de la página de fondo
  useEffect(() => {
    if (!full) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape" && !nativeFull.current) exitFull();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [full, exitFull]);

  // Al desmontar, liberar fullscreen/orientación
  useEffect(
    () => () => {
      if (nativeFull.current) exitFull();
    },
    [exitFull],
  );

  // Pausar mientras se pide girar el celular
  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    e.paused = needRotate;
    if (needRotate) {
      holdState.current = { left: false, right: false };
      e.setInput(false, false);
    }
  }, [needRotate]);

  const share = useCallback(async () => {
    if (!result) return;
    const text = `Hice la Regata 29er de ${getCourse(courseRef.current).name} en ${fmt(result.time)} (${result.points} pts) ⛵🇦🇷 ¿Me ganás? @29er_argentina`;
    try {
      if (navigator.share) await navigator.share({ text, url: window.location.href });
      else {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        setToast("Copiado al portapapeles");
      }
    } catch {
      /* cancelado */
    }
  }, [result]);

  const selectCourse = useCallback((id: CourseId) => {
    setCourseId(id);
    setResult(null);
    setSplits([]);
    setBest(readBest(id));
    const e = engineRef.current;
    // misma sede: solo volver al modo demo; otra: cambiar cancha (también resetea)
    if (e?.courseId === id) e.reset();
    else e?.setCourse(id);
  }, []);

  const hold = (dir: "left" | "right", on: boolean) => {
    const e = engineRef.current;
    if (!e) return;
    holdState.current[dir] = on;
    e.setInput(holdState.current.left, holdState.current.right);
  };
  const holdState = useRef({ left: false, right: false });

  const twa = hud?.twa ?? 45;
  const racing = phase === "racing" || phase === "countdown";

  return (
    <div
      ref={wrapRef}
      data-full={full ? "" : undefined}
      data-game-ui=""
      className={
        full
          ? "fixed inset-0 z-[100] h-[100dvh] w-screen overflow-hidden bg-abyss"
          : "relative overflow-hidden rounded-[28px] border border-white/10 bg-abyss shadow-[0_40px_120px_-40px_rgba(116,172,223,0.35)]"
      }
    >
      <div className={full ? "relative h-full w-full" : "relative aspect-[3/4] w-full sm:aspect-[16/10] lg:aspect-[16/8.5]"}>
        <div ref={mountRef} className="absolute inset-0" />
        {failed && (
          <div className="absolute inset-0 grid place-items-center p-8 text-center text-foam/70">
            Tu navegador no soporta WebGL. Probá desde una compu o un celular más nuevo.
          </div>
        )}

        {/* ───── HUD ───── */}
        {hud && racing && (
          <>
            {/* Barra fina: lo esencial en una línea, sin tarjetas. Tocarla muestra los detalles. */}
            <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-ink/70 via-ink/30 to-transparent pb-8 pl-3 pr-16 pt-2.5 font-mono text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.55)] sm:pl-5 sm:pr-20 sm:pt-4">
              <button
                type="button"
                onClick={() => setDetails((v) => !v)}
                aria-expanded={details}
                aria-label={details ? "Ocultar detalles de la regata" : "Ver detalles de la regata"}
                className="flex min-h-11 w-full items-center gap-3 text-left sm:gap-5"
              >
                <span className="text-lg font-semibold leading-none tabular-nums sm:text-xl">{fmt(hud.time)}</span>
                <span className="rounded bg-white/15 px-1.5 py-0.5 text-[11px] tabular-nums">
                  {Math.min(hud.leg + 1, hud.legs)}/{hud.legs}
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px]">
                  {hud.rounding && (
                    <span className="shrink-0 text-sol">
                      <RotateCcw />
                    </span>
                  )}
                  <span className="truncate sm:hidden">{legShort(hud)}</span>
                  <span className="hidden truncate sm:inline">{hud.legName}</span>
                </span>
                <span className={`flex shrink-0 items-center gap-2 ${hud.inIrons ? "text-buoy" : ""}`}>
                  <span className="font-display text-2xl leading-none tabular-nums">
                    {hud.knots.toFixed(1)}
                    <span className="ml-1 font-mono text-[11px] text-foam/80">kn</span>
                  </span>
                  <WindDial twa={twa} irons={hud.inIrons} />
                </span>
              </button>

              {/* Segunda línea: solo cuando hay algo que decir */}
              <div className="mt-1 flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                {hud.rounding && (details || hud.distance < 70) && (
                  <span className="flex items-center gap-1 font-semibold text-sol">
                    <RotateCcw />
                    Dejala a babor
                  </span>
                )}
                {details && (
                  <span className="tabular-nums text-foam/90">
                    <span className={hud.touches ? "font-semibold text-buoy" : ""}>{hud.points} pts</span>
                    {hud.rounding && ` · ${Math.round(hud.distance)} m · VMG ${hud.vmg.toFixed(1)} kn`}
                  </span>
                )}
                {hud.inIrons && <Badge className="bg-buoy text-white">Proa al viento</Badge>}
                {hud.gust && <Badge className="bg-tide/90 text-celeste-light">Ráfaga</Badge>}
                {hud.spinnaker && <Badge className="bg-sol text-ink">Asimétrico</Badge>}
              </div>
            </div>

            <canvas
              ref={mapRef}
              width={330}
              height={132}
              className="pointer-events-none absolute bottom-5 left-1/2 h-[64px] w-[160px] -translate-x-1/2 rounded-xl bg-ink/30 ring-1 ring-white/10 sm:bottom-4 sm:h-[88px] sm:w-[220px]"
            />
            {!isTouch && (
              <div className="pointer-events-none absolute bottom-4 right-5 hidden font-mono text-[11px] text-foam/80 sm:block">
                ← → / A D timonear · C cámara{full ? " · Esc salir" : ""}
              </div>
            )}
          </>
        )}

        {phase === "countdown" && hud && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div key={Math.ceil(hud.countdown)} aria-live="assertive" className="animate-pop font-display text-[22vw] leading-none text-white drop-shadow-[0_10px_40px_rgba(0,0,0,0.5)] sm:text-[12rem]">
              {Math.ceil(hud.countdown)}
            </div>
          </div>
        )}

        <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center px-4">
          {toast && (
            <div key={toast} className="max-w-sm animate-pop rounded-2xl bg-white px-5 py-2.5 text-center text-sm font-bold text-ink shadow-xl">
              {toast}
            </div>
          )}
        </div>
        {touchMsg && phase === "racing" && (
          <div
            key={touchMsg.key}
            role="status"
            className="pointer-events-none absolute left-1/2 top-[45%] -translate-x-1/2 animate-pop whitespace-nowrap rounded-full bg-buoy px-5 py-2.5 text-sm font-bold text-white shadow-xl"
          >
            {touchMsg.text}
          </div>
        )}

        {/* ───── Intro de la regata ───── */}
        {phase === "intro" && hud?.intro && (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent px-5 pb-6 pt-24 sm:px-10 sm:pb-10">
              <div key={hud.intro.step} className="max-w-xl animate-rise">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-sol">
                  {course.name}
                  <span className="text-foam/50">
                    {hud.intro.step}/{hud.intro.steps}
                  </span>
                </div>
                <div className="mt-2 font-display text-4xl uppercase leading-none sm:text-6xl [@media(max-height:500px)]:text-4xl">{hud.intro.title}</div>
                <p className="mt-2 text-sm text-foam/85 sm:text-base">{hud.intro.subtitle}</p>
              </div>
              <div className="mt-4 flex gap-1.5" aria-hidden>
                {Array.from({ length: hud.intro.steps }, (_, i) => (
                  <span key={i} className={`h-1 w-6 rounded-full ${i < hud.intro!.step ? "bg-sol" : "bg-white/20"}`} />
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => engineRef.current?.skipIntro()}
              className="absolute bottom-5 right-5 z-20 min-h-11 rounded-full bg-white/15 px-5 text-sm font-bold text-white ring-1 ring-white/30 backdrop-blur-md transition hover:bg-white/25 active:scale-95 sm:bottom-10 sm:right-10"
            >
              Saltar intro →
            </button>
          </>
        )}

        {/* Controles táctiles */}
        {phase === "racing" && (
          <div className={`absolute inset-x-0 bottom-0 flex justify-between p-3 ${isTouch ? "" : "sm:hidden"}`}>
            {(["left", "right"] as const).map((d) => (
              <button
                key={d}
                aria-label={d === "left" ? "Orzar a babor" : "Arribar a estribor"}
                className="grid h-20 w-20 touch-none select-none place-items-center rounded-full bg-white/15 text-3xl text-white ring-1 ring-white/30 backdrop-blur-md active:bg-white/30"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  hold(d, true);
                }}
                onPointerUp={() => hold(d, false)}
                onPointerCancel={() => hold(d, false)}
                onContextMenu={(e) => e.preventDefault()}
              >
                <Chevron dir={d} />
              </button>
            ))}
          </div>
        )}

        {/* ───── Intro ───── */}
        {phase === "idle" && !result && (
          <div className="absolute inset-0 flex items-end overflow-y-auto bg-gradient-to-t from-ink/95 via-ink/45 to-transparent p-5 pt-16 sm:items-center sm:bg-gradient-to-r sm:from-ink/85 sm:via-ink/40 sm:p-12 [@media(max-height:500px)]:py-5">
            <div className="w-full min-w-0 max-w-md">
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-sol">Mini juego · 3 regatas</div>
              <h3 className="mt-2 font-display text-4xl uppercase leading-[0.9] sm:mt-3 sm:text-7xl [@media(max-height:500px)]:text-5xl">
                Regata <span className="text-celeste">29er</span>
              </h3>

              {/* Selector de sede */}
              <div role="group" aria-label="Elegí la regata" className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 [@media(max-height:500px)]:mt-3">
                {COURSES.map((c) => {
                  const on = c.id === courseId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => selectCourse(c.id)}
                      className={`min-h-11 min-w-0 rounded-xl px-2.5 py-2 text-left ring-1 transition active:scale-[0.97] ${
                        on ? "bg-white/15 ring-sol" : "bg-ink/40 ring-white/10 hover:bg-white/10"
                      }`}
                    >
                      <span className="flex gap-0.5" aria-hidden>
                        {[1, 2, 3].map((n) => (
                          <span key={n} className={`h-1 w-3 rounded-full ${n <= c.level ? (on ? "bg-sol" : "bg-foam/70") : "bg-white/15"}`} />
                        ))}
                      </span>
                      <span className="mt-1.5 block text-[13px] font-bold leading-tight text-white">{c.name}</span>
                      <span className="block font-mono text-[11px] uppercase tracking-wider text-foam/75">{c.levelName}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-sm text-foam/85">{course.blurb}</p>
              <button
                type="button"
                aria-expanded={showRules}
                aria-controls="regata-reglas"
                onClick={() => setShowRules((v) => !v)}
                className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-celeste sm:hidden"
              >
                Cómo se juega
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden className={`transition ${showRules ? "rotate-180" : ""}`}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <ul
                id="regata-reglas"
                className={`mt-1 space-y-1 text-[13px] text-foam/80 sm:mt-3 sm:block ${showRules ? "block" : "hidden"} [@media(max-height:500px)]:hidden`}
              >
                <li><b className="text-white">Timoneá</b> con ← → (o A/D). En el celu, con los botones.</li>
                <li><b className="text-white">Ceñí a ~45°</b> del viento y buscá el agua oscura: son ráfagas.</li>
                <li>
                  <b className="text-white">Rodeá las boyas dejándolas a babor ↺</b> (a tu izquierda). Si tocás una: +{TOUCH_SECONDS} s y −{TOUCH_POINTS} pts.
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-4 sm:mt-6 [@media(max-height:500px)]:mt-4">
                <button
                  onClick={start}
                  disabled={!ready}
                  className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-sol px-7 font-bold text-ink transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-10px_rgba(246,180,14,0.8)] active:scale-[0.97] disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {ready ? "Largar regata" : "Cargando…"}
                  {ready && <span className="transition group-hover:translate-x-1">→</span>}
                </button>
                {best !== null && <span className="font-mono text-xs text-foam/80">Tu récord: {fmt(best)}</span>}
              </div>
            </div>
          </div>
        )}

        {/* ───── Resultado ───── */}
        {result && (
          <div className="absolute inset-0 grid place-items-center overflow-y-auto bg-ink/75 p-6 backdrop-blur-sm [@media(max-height:500px)]:py-4">
            <div className="w-full max-w-sm animate-rise text-center">
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-sol">
                {course.name} · {result.record ? "¡Nuevo récord!" : "Llegada"}
              </div>
              <div className="mt-2 font-display text-7xl tabular-nums sm:text-8xl [@media(max-height:500px)]:text-5xl">{fmt(result.time)}</div>
              <div className="mx-auto mt-4 flex max-w-sm flex-wrap justify-center gap-2 font-mono text-[11px] text-foam/80">
                {["Largada", ...course.route.map((r) => r.short)].map((l, i) => (
                  <div key={i} className="min-w-[4.25rem] rounded-lg bg-white/5 px-2 py-2">
                    <div className="text-foam/70">{l}</div>
                    <div className="text-white">{splits[i] !== undefined ? fmt(splits[i]) : "—"}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-center gap-4 font-mono text-xs">
                <span className="text-white">{result.points} pts</span>
                <span className={result.touches ? "text-buoy" : "text-foam/70"}>
                  {result.touches === 0 ? "Sin toques" : `${result.touches} toque${result.touches > 1 ? "s" : ""} · +${result.penalty} s`}
                </span>
              </div>
              {result.best !== null && !result.record && <div className="mt-3 text-sm text-foam/70">Tu récord sigue siendo {fmt(result.best)}</div>}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button onClick={start} className="min-h-12 rounded-full bg-sol px-6 font-bold text-ink transition hover:-translate-y-0.5 active:scale-[0.97]">
                  Revancha
                </button>
                <button onClick={share} className="min-h-12 rounded-full px-6 font-bold text-white ring-1 ring-white/30 transition hover:bg-white/10 active:scale-[0.97]">
                  Compartir
                </button>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-x-2 text-sm">
                {course.level < 3 && (
                  <button onClick={() => selectCourse(COURSES[course.level].id)} className="min-h-11 px-3 font-bold text-celeste transition hover:text-celeste-light">
                    Siguiente: {COURSES[course.level].name} →
                  </button>
                )}
                <button onClick={() => selectCourse(courseId)} className="min-h-11 px-3 text-foam/80 transition hover:text-white">
                  Elegir regata
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ───── Cambiar cámara ───── */}
        {racing && !needRotate && (
          <button
            type="button"
            onClick={() => {
              const e = engineRef.current;
              if (e) setCamAerial(e.toggleCamera() === 1);
            }}
            aria-pressed={camAerial}
            aria-label={camAerial ? "Cámara aérea. Cambiar a cámara detrás del barco" : "Cámara detrás del barco. Cambiar a cámara aérea"}
            title="Cambiar cámara (C)"
            className="absolute right-3 top-16 z-20 flex h-11 items-center gap-1.5 rounded-full bg-ink/55 px-3 text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-ink/75 active:scale-95 sm:right-5 sm:top-[4.5rem]"
          >
            <CameraIcon aerial={camAerial} />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">{camAerial ? "Aérea" : "Detrás"}</span>
          </button>
        )}

        {/* ───── Brújula ───── */}
        {hud && racing && !needRotate && <Compass heading={hud.heading} />}

        {/* ───── Pantalla completa ───── */}
        {!failed && !needRotate && (
          <button
            type="button"
            onClick={full ? exitFull : enterFull}
            aria-label={full ? "Salir de pantalla completa" : "Jugar en pantalla completa"}
            title={full ? "Salir de pantalla completa" : "Pantalla completa"}
            className="absolute right-3 top-3 z-20 flex h-11 items-center gap-2 rounded-full bg-ink/55 px-3 text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-ink/75 active:scale-95 sm:right-5 sm:top-5"
          >
            {isTouch && !full && phase === "idle" && !result && (
              <span className="pl-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-foam/90">Pantalla completa</span>
            )}
            <FullscreenIcon exit={full} />
          </button>
        )}

        {needRotate && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-ink/95 p-8 text-center backdrop-blur-md">
            <svg width="76" height="76" viewBox="0 0 64 64" aria-hidden className="animate-turn text-celeste">
              <rect x="20" y="6" width="24" height="52" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
              <line x1="29" y1="51" x2="35" y2="51" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div>
              <div className="font-display text-4xl uppercase leading-none">Girá el celular</div>
              <p className="mt-3 max-w-xs text-sm text-foam/75">La regata se juega apaisada. Poné el teléfono de costado para seguir.</p>
            </div>
            <button onClick={exitFull} className="rounded-full px-5 py-2.5 text-sm font-bold text-white ring-1 ring-white/30 transition hover:bg-white/10">
              Salir de pantalla completa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FullscreenIcon({ exit }: { exit: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {exit ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
    </svg>
  );
}

/** Nombre corto del tramo para pantallas angostas: "Boya 1", "Largada", "Llegada". */
function legShort(h: Hud) {
  if (h.leg === 0) return "Largada";
  if (h.leg >= h.legs - 1) return "Llegada";
  return h.legName.split(" · ")[0];
}

/** Cámara: detrás del barco (barco de perfil) o aérea (vista desde arriba). */
const CARDINALS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];

/**
 * Brújula con la proa siempre arriba: la rosa gira y la marca amarilla indica el rumbo.
 * Norte = -Z del mundo (de donde viene el viento medio y donde está la costa de Mónaco).
 */
function Compass({ heading }: { heading: number }) {
  const b = (((-heading * 180) / Math.PI) % 360 + 360) % 360;
  const label = CARDINALS[Math.round(b / 45) % 8];
  return (
    <div
      role="img"
      aria-label={`Rumbo ${Math.round(b)} grados, ${label}`}
      className="pointer-events-none absolute right-3 top-[7.25rem] z-20 flex flex-col items-center gap-1 sm:right-5 sm:top-[8.25rem]"
    >
      <svg viewBox="-24 -24 48 48" aria-hidden className="h-11 w-11 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
        <circle r="22.5" fill="rgba(4,11,21,0.55)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <g transform={`rotate(${-b})`}>
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1="0" y1="-21" x2="0" y2={i % 3 ? -19 : -17.5} stroke="rgba(255,255,255,0.55)" strokeWidth="1" transform={`rotate(${i * 30})`} />
          ))}
          {(["N", "E", "S", "O"] as const).map((c, i) => {
            const a = (i * Math.PI) / 2;
            return (
              <text
                key={c}
                x={12 * Math.sin(a)}
                y={-12 * Math.cos(a)}
                transform={`rotate(${b} ${12 * Math.sin(a)} ${-12 * Math.cos(a)})`}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={c === "N" ? 9 : 7.5}
                fontWeight={700}
                fontFamily="var(--font-mono)"
                fill={c === "N" ? "#ff6a1a" : "#eef5fb"}
              >
                {c}
              </text>
            );
          })}
        </g>
        {/* proa: marca fija arriba */}
        <path d="M0 -23.5 L-3.2 -17.5 L3.2 -17.5Z" fill="#f6b40e" />
        <circle r="1.6" fill="#eef5fb" />
      </svg>
      <span className="rounded bg-ink/55 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-white">
        {String(Math.round(b) % 360).padStart(3, "0")}° {label}
      </span>
    </div>
  );
}

function CameraIcon({ aerial }: { aerial: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 10l4.5-2.5v9L15 14" />
      <rect x="2.5" y="7" width="12.5" height="10" rx="2" />
      {aerial ? <path d="M8.75 4.5v-2M6.5 3.5 8.75 1.5 11 3.5" /> : <path d="M5.5 13.5h6.5l-1.5 1.5h-3.5z" />}
    </svg>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

/** Flecha antihoraria: rodear la boya a babor. */
function RotateCcw() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider ${className}`}>{children}</span>;
}

/** Rosa del viento relativa al barco: el barco apunta arriba, la flecha marca de dónde viene el viento. */
function WindDial({ twa, irons = false }: { twa: number; irons?: boolean }) {
  const nogo = 34;
  return (
    <svg viewBox="-32 -32 64 64" aria-hidden className="h-10 w-10 sm:h-11 sm:w-11">
      <circle r="29" fill="rgba(4,11,21,0.35)" stroke={irons ? "#ff6a1a" : "rgba(255,255,255,0.35)"} strokeWidth={irons ? 4 : 2} />
      {/* zona muerta */}
      <path
        d={`M0 0 L${29 * Math.sin((-nogo * Math.PI) / 180) * 1} ${-29 * Math.cos((nogo * Math.PI) / 180)} A29 29 0 0 1 ${29 * Math.sin((nogo * Math.PI) / 180)} ${-29 * Math.cos((nogo * Math.PI) / 180)} Z`}
        fill={irons ? "rgba(255,106,26,0.6)" : "rgba(255,106,26,0.28)"}
      />
      {/* barco */}
      <path d="M0 -12 C4 -6 4 6 3 11 L-3 11 C-4 6 -4 -6 0 -12Z" fill="#eef5fb" />
      {/* viento */}
      <g transform={`rotate(${twa})`}>
        <line x1="0" y1="-29" x2="0" y2="-16" stroke="#f6b40e" strokeWidth="3" strokeLinecap="round" />
        <path d="M0 -14 L-4 -20 L4 -20Z" fill="#f6b40e" />
      </g>
    </svg>
  );
}

function drawMap(c: HTMLCanvasElement | null, h: Hud) {
  if (!c) return;
  const g = c.getContext("2d");
  if (!g) return;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, c.width, c.height);
  // Mapa apaisado: se dibuja la cancha "vertical" (W×H lógicos) rotada 90° horario,
  // así barlovento queda a la derecha. Escala k para dibujar nítido en el canvas grande.
  const k = c.width / 220;
  g.setTransform(0, k, -k, 0, c.width, 0);
  const W = c.height / k, H = c.width / k;
  const m = h.map;
  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
  const sx = (x: number) => 6 + ((x - m.minX) / (m.maxX - m.minX)) * (W - 12);
  const sz = (z: number) => 8 + ((z - m.minZ) / (m.maxZ - m.minZ)) * (H - 16);
  const scale = (W - 12) / (m.maxX - m.minX);
  // ráfagas
  g.fillStyle = "rgba(10,40,80,0.35)";
  for (const gu of h.gusts) {
    g.beginPath();
    g.arc(sx(gu.x), sz(gu.z), gu.r * scale, 0, Math.PI * 2);
    g.fill();
  }
  // línea
  g.strokeStyle = "rgba(255,255,255,0.55)";
  g.lineWidth = 1;
  g.setLineDash([3, 3]);
  g.beginPath();
  g.moveTo(sx(-30), sz(0));
  g.lineTo(sx(30), sz(0));
  g.stroke();
  g.setLineDash([]);
  // boyas
  for (const mk of m.marks) {
    g.fillStyle = mk.active ? "#f6b40e" : "rgba(255,106,26,0.85)";
    g.beginPath();
    g.arc(sx(mk.x), sz(mk.z), mk.active ? 4 : 3, 0, Math.PI * 2);
    g.fill();
    if (mk.active) {
      // ↺ rodeo a babor (antihorario, igual que en el mapa)
      const cx = sx(mk.x), cy = sz(mk.z), r = 9;
      g.strokeStyle = "#f6b40e";
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(cx, cy, r, 0, 1, true); // ~300° en sentido antihorario, termina en ángulo 1
      g.stroke();
      const a = 1;
      const tx = cx + r * Math.cos(a), ty = cy + r * Math.sin(a);
      g.fillStyle = "#f6b40e";
      g.beginPath();
      g.moveTo(tx + 3.5 * Math.sin(a), ty - 3.5 * Math.cos(a));
      g.lineTo(tx - 3 * Math.cos(a), ty - 3 * Math.sin(a));
      g.lineTo(tx + 3 * Math.cos(a), ty + 3 * Math.sin(a));
      g.closePath();
      g.fill();
    }
  }
  // barco (siempre dentro del mapa)
  g.save();
  g.translate(clamp(sx(h.boat.x), 4, W - 4), clamp(sz(h.boat.z), 4, H - 4));
  g.rotate(-h.heading);
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.moveTo(0, -6);
  g.lineTo(3.5, 4);
  g.lineTo(-3.5, 4);
  g.closePath();
  g.fill();
  g.restore();
  // flechas: viento (amarilla) y corriente (celeste)
  const arrow = (x: number, y: number, angle: number, color: string) => {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.strokeStyle = color;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, -8);
    g.lineTo(0, 8);
    g.moveTo(-4, 3);
    g.lineTo(0, 8);
    g.lineTo(4, 3);
    g.stroke();
    g.restore();
  };
  arrow(W - 14, 16, -h.windFrom, "rgba(246,180,14,0.9)");
  if (Math.hypot(m.current.x, m.current.z) > 0.05) arrow(14, 16, Math.atan2(-m.current.x, m.current.z), "rgba(116,172,223,0.9)");
}
