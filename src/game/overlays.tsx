import { Battery, Compass, Eye, Flashlight, FlashlightOff, Flower2, LogOut, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TOUCH_LOOK_SENS } from "./constants";
import type { GameInput } from "./input";
import type { Runtime } from "./runtime";
import { formatTime, useHud } from "./store";
import type { Difficulty, GameMode } from "./maze";

export function requestLock(el: HTMLElement | null) {
  if (!el) return;
  const node = el as HTMLElement & {
    requestPointerLock: (opts?: { unadjustedMovement?: boolean }) => Promise<void> | void;
  };
  try {
    const p = node.requestPointerLock({ unadjustedMovement: true });
    if (p && typeof p.catch === "function") {
      void p.catch(() => {
        node.requestPointerLock();
      });
    }
  } catch {
    node.requestPointerLock();
  }
}

function OverlayCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overlay-backdrop absolute inset-0 z-30 flex items-end justify-center bg-bg/72 px-4 pb-10 pt-24 sm:items-center sm:p-6">
      <div className="overlay-in w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-panel sm:p-8">
        {children}
      </div>
    </div>
  );
}

export function TitleOverlay({
  onEnter,
  difficulty,
  mode,
  onDifficulty,
  onMode,
}: {
  onEnter: () => void;
  difficulty: Difficulty;
  mode: GameMode;
  onDifficulty: (difficulty: Difficulty) => void;
  onMode: (mode: GameMode) => void;
}) {
  return (
    <OverlayCard>
      <p className="text-xs font-medium tracking-[0.18em] text-faint uppercase">{mode === "spirit" ? "Spirit grove" : mode === "underground" ? "Hollow below" : "Garden maze"}</p>
      <h1 className="font-display mt-3 text-4xl font-semibold leading-tight tracking-tight text-fg sm:text-5xl">
        The Walker
      </h1>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
        {mode === "spirit"
          ? "Awaken the hidden grove shrines, gather their light, and find the gate when the garden reveals it."
          : mode === "underground"
            ? "Something down here tracks you by sound — sprint and it hears you, stand still and it loses you. Gather enough Echo Shards to leave, or risk going deeper for the rest."
          : "Tall hedges, narrow gravel, a gate somewhere ahead. Walk it. Don't trust the last turn."}
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {(["meadow", "grove", "wildwood"] as Difficulty[]).map((level) => (
          <button key={level} type="button" onClick={() => onDifficulty(level)} className={`rounded-md border px-2 py-2 text-xs capitalize ${difficulty === level ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface-2 text-muted"}`}>
            {level}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(["garden", "spirit", "underground"] as GameMode[]).map((choice) => (
          <button key={choice} type="button" onClick={() => onMode(choice)} className={`rounded-md border px-2 py-2 text-xs capitalize ${mode === choice ? "border-accent bg-accent/15 text-fg" : "border-border bg-surface-2 text-muted"}`}>
            {choice === "spirit" ? "Spirit Grove" : choice === "underground" ? "Hollow Below" : "Garden Maze"}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onEnter}
        className="mt-7 flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-fg transition-transform duration-150 hover:brightness-105 active:scale-[0.98]"
      >
        Enter the maze
      </button>
      <p className="mt-5 text-xs leading-relaxed text-faint">
        {mode === "underground"
          ? "WASD to walk · mouse to look · H to peek · L cycles the light · E leaves once you have enough shards — sprinting is loud, standing still is safest"
          : "WASD to walk · mouse to look · H to peek · L light"}
        <span className="mt-1 block sm:hidden">On a phone: left stick moves, right side looks.</span>
      </p>
    </OverlayCard>
  );
}


export function PauseOverlay({ onResume }: { onResume: () => void }) {
  return (
    <OverlayCard>
      <p className="text-xs font-medium tracking-[0.18em] text-faint uppercase">Paused</p>
      <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-fg">Still in the hedges</h2>
      <p className="mt-3 text-sm text-muted">Click to look around again. The maze has not moved.</p>
      <button
        type="button"
        onClick={onResume}
        className="mt-7 flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-fg transition-transform duration-150 hover:brightness-105 active:scale-[0.98]"
      >
        Continue
      </button>
    </OverlayCard>
  );
}

export function WinOverlay({
  time,
  collected,
  total,
  mode,
  onReplay,
}: {
  time: number;
  collected: number;
  total: number;
  mode: GameMode;
  onReplay: () => void;
}) {
  const fullClear = collected >= total;
  return (
    <OverlayCard>
      <p className="text-xs font-medium tracking-[0.18em] text-faint uppercase">{mode === "underground" ? "The Hollow" : "The gate"}</p>
      <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-fg">
        {mode === "underground" ? (fullClear ? "You gathered it all and slipped away" : "You made it out with what you had") : "You found the way out"}
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-md bg-surface-2 px-4 py-3">
          <p className="text-xs text-faint">Time</p>
          <p className="mt-1 font-mono text-xl tabular-nums text-fg">{formatTime(time)}</p>
        </div>
        <div className="rounded-md bg-surface-2 px-4 py-3">
          <p className="text-xs text-faint">{mode === "underground" ? "Shards" : "Orbs"}</p>
          <p className="mt-1 font-mono text-xl tabular-nums text-fg">
            {collected}/{total}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReplay}
        className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-fg transition-transform duration-150 hover:brightness-105 active:scale-[0.98]"
      >
        <RotateCcw className="size-4" strokeWidth={2} />
        Walk a new maze
      </button>
    </OverlayCard>
  );
}

export function GameOverOverlay({ reason, onReplay }: { reason: "battery" | "light" | "caught" | "looked" | null; onReplay: () => void }) {
  const copy = reason === "battery"
    ? ["The light died", "The hollow kept moving in the dark."]
    : reason === "light"
      ? ["It saw you", "You gave it one last glimpse of yourself."]
      : reason === "looked"
        ? ["Don&apos;t look back", "The corridor was never empty."]
        : ["It caught you", "Run faster next time. Do not let the footsteps catch up."];
  return <OverlayCard>
    <p className="text-xs font-medium tracking-[0.18em] text-red-200/70 uppercase">The Hollow</p>
    <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-red-100">{copy[0]}</h2>
    <p className="mt-3 text-sm leading-relaxed text-muted">{copy[1]}</p>
    <button type="button" onClick={onReplay} className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-fg">
      <RotateCcw className="size-4" strokeWidth={2} /> Walk again
    </button>
  </OverlayCard>;
}

export function ExploreOverlay({ onContinue }: { onContinue: () => void }) {
  return <OverlayCard>
    <p className="text-xs font-medium tracking-[0.18em] text-faint uppercase">Spirit Grove unlocked</p>
    <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-fg">Beyond the hedges</h2>
    <p className="mt-3 text-sm leading-relaxed text-muted">The maze was only the threshold. Wander through the dusk meadow, find the river, homes, groves, and mountains, and let each fixed landmark reveal itself on your map.</p>
    <button type="button" onClick={onContinue} className="mt-7 flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-fg">Explore the grove</button>
  </OverlayCard>;
}

function Joystick({ input }: { input: GameInput }) {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const pid = useRef<number | null>(null);

  const setFrom = (clientX: number, clientY: number) => {
    const el = base.current;
    const k = knob.current;
    if (!el || !k) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const max = r.width * 0.34;
    const mag = Math.hypot(dx, dy);
    if (mag > max) {
      dx = (dx / mag) * max;
      dy = (dy / mag) * max;
    }
    k.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    input.stickX = dx / max;
    input.stickY = -dy / max;
  };

  const end = () => {
    pid.current = null;
    input.stickX = 0;
    input.stickY = 0;
    if (knob.current) knob.current.style.transform = "translate(-50%, -50%)";
  };

  return (
    <div
      ref={base}
      className="pointer-events-auto relative size-[108px] rounded-full border border-border bg-surface/70"
      onPointerDown={(e) => {
        pid.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        setFrom(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (pid.current !== e.pointerId) return;
        setFrom(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div
        ref={knob}
        className="absolute top-1/2 left-1/2 size-11 rounded-full bg-primary/90" style={{ transform: "translate(-50%, -50%)" }}
      />
    </div>
  );
}

function LookPad({ input }: { input: GameInput }) {
  const last = useRef<{ id: number; x: number; y: number } | null>(null);
  return (
    <div
      className="pointer-events-auto absolute inset-y-0 right-0 z-10 w-[58%]"
      onPointerDown={(e) => {
        last.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const l = last.current;
        if (!l || l.id !== e.pointerId) return;
        input.lookX += (e.clientX - l.x) * (TOUCH_LOOK_SENS / 0.00215);
        input.lookY += (e.clientY - l.y) * (TOUCH_LOOK_SENS / 0.00215);
        l.x = e.clientX;
        l.y = e.clientY;
      }}
      onPointerUp={() => {
        last.current = null;
      }}
      onPointerCancel={() => {
        last.current = null;
      }}
    />
  );
}

export function Hud({
  runtime,
  onHint,
  onFlashlight,
  onLeave,
}: {
  runtime: Runtime;
  onHint: () => void;
  onFlashlight: () => void;
  onLeave: () => void;
}) {
  const phase = useHud((s) => s.phase);
  const collected = useHud((s) => s.collected);
  const total = useHud((s) => s.total);
  const shardsRequired = useHud((s) => s.shardsRequired);
  const peeks = useHud((s) => s.peeks);
  const scareTriggered = useHud((s) => s.scareTriggered);
  const flashlightMode = useHud((s) => s.flashlightMode);
  const battery = useHud((s) => s.battery);
  const touch = useHud((s) => s.touch);
  const [mapExpanded, setMapExpanded] = useState(false);
  const mapRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const collectRef = useRef<HTMLSpanElement>(null);
  const bonusRef = useRef<HTMLSpanElement>(null);
  const presenceRef = useRef<HTMLDivElement>(null);
  const voiceRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    runtime.mapEl = mapRef.current;
    runtime.timeEl = timeRef.current;
    runtime.hintEl = hintRef.current;
    runtime.collectEl = collectRef.current;
    runtime.bonusEl = bonusRef.current;
    runtime.presenceEl = presenceRef.current;
    runtime.voiceEl = voiceRef.current;
    return () => {
      runtime.mapEl = null;
      runtime.timeEl = null;
      runtime.hintEl = null;
      runtime.collectEl = null;
      runtime.bonusEl = null;
      runtime.presenceEl = null;
      runtime.voiceEl = null;
    };
  }, [runtime]);

  useEffect(() => {
    runtime.mapExpanded = mapExpanded;
  }, [mapExpanded, runtime]);

  const playing = phase === "playing";
  const canLeave = playing && runtime.mode === "underground" && collected >= shardsRequired;
  const flashlightLabel = flashlightMode === 2 ? "full beam" : flashlightMode === 1 ? "low beam" : "light off";

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-20 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            aria-label="Toggle full explored map"
            onClick={() => setMapExpanded((open) => !open)}
            className={`pointer-events-auto minimap-disk overflow-hidden bg-bg/90 ${mapExpanded ? "fixed top-1/2 left-1/2 z-40 aspect-square w-[min(86vw,720px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border shadow-2xl" : "size-[120px] rounded-full sm:size-[148px]"}`}
          >
            <canvas ref={mapRef} className="size-full" />
            <span className="sr-only">Tap to {mapExpanded ? "close" : "open"} full map</span>
          </button>
          <div className="flex flex-col items-end gap-2">
            <div className="rounded-md border border-border bg-surface/80 px-3 py-1.5 text-right">
              <p className="text-[10px] tracking-wide text-faint uppercase">{runtime.mode === "spirit" ? "Spirit Grove" : runtime.mode === "underground" ? "Hollow Below" : "Garden Maze"}</p>
              <p className="text-[10px] capitalize text-muted">{runtime.difficulty}</p>
            </div>
            <div className="rounded-md border border-border bg-surface/80 px-3 py-2">
              <p className="text-[10px] tracking-wide text-faint uppercase">Time</p>
              <span ref={timeRef} className="font-mono text-sm tabular-nums text-fg">
                0:00.00
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface/80 px-3 py-2">
              <Flower2 className="size-3.5 text-accent" strokeWidth={1.75} />
              <span ref={collectRef} className="font-mono text-sm tabular-nums text-fg">
                {collected}/{runtime.mode === "underground" ? shardsRequired : total}
              </span>
              <span ref={bonusRef} className="font-mono text-[10px] tabular-nums text-[#e585ac]" />
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface/80 px-3 py-2">
              <Eye className="size-3.5 text-accent" strokeWidth={1.75} />
              <span className="font-mono text-sm tabular-nums text-fg">{peeks}</span>
              <span className="text-[10px] tracking-wide text-faint uppercase">peeks</span>
            </div>
            {runtime.mode === "underground" ? (
              <div className={`min-w-[126px] rounded-md border bg-slate-950/75 px-3 py-2 ${battery < 22 ? "border-red-300/50" : "border-amber-200/20"}`}>
                <div className="flex items-center justify-between gap-2">
                  {flashlightMode > 0 ? (
                    <Flashlight className={`size-3.5 ${flashlightMode === 2 ? "text-amber-200" : "text-amber-200/55"}`} strokeWidth={1.75} />
                  ) : (
                    <FlashlightOff className="size-3.5 text-faint" strokeWidth={1.75} />
                  )}
                  <span className="text-[10px] tracking-wide text-muted uppercase">{flashlightLabel}</span>
                  <Battery className="size-3.5 text-faint" strokeWidth={1.75} />
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10"><div className={`h-full ${battery < 22 ? "bg-red-400" : "bg-amber-200"}`} style={{ width: `${battery}%` }} /></div>
                <p className="mt-1 text-right font-mono text-[10px] text-faint">{Math.ceil(battery)}%</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[9px] tracking-[0.16em] text-faint uppercase">presence</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                  <div ref={presenceRef} className="h-full" style={{ width: "0%", background: "hsl(130, 70%, 52%)" }} />
                </div>
              </div>
            ) : null}
            {canLeave ? (
              <button type="button" onClick={onLeave} className="pointer-events-auto flex items-center gap-1.5 rounded-md border border-emerald-300/40 bg-emerald-900/60 px-3 py-2 text-[11px] font-medium tracking-wide text-emerald-100 uppercase animate-pulse">
                <LogOut className="size-3.5" strokeWidth={1.75} />
                Leave (E)
              </button>
            ) : null}
          </div>
        </div>

        {playing ? (
          <div className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 sm:block">
            <p className="rounded-md bg-bg/50 px-3 py-1.5 text-[11px] text-faint">
              H peek · L {runtime.mode === "underground" ? "cycle light" : "light"} · Esc release look{runtime.mode === "underground" ? " · E leave (once you have enough shards)" : ""}
            </p>
          </div>
        ) : null}
      </div>

      {playing && touch ? <LookPad input={runtime.input} /> : null}

      {playing ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
          {touch ? <Joystick input={runtime.input} /> : <span />}
          <div className="pointer-events-auto mb-1 flex gap-2">
            {runtime.mode === "underground" ? (
              <button type="button" onClick={onFlashlight} className="flex h-12 min-w-12 items-center justify-center gap-2 rounded-md border border-amber-200/20 bg-surface/90 px-3 text-sm font-medium text-fg">
                {flashlightMode > 0 ? <Flashlight className="size-4" strokeWidth={1.75} /> : <FlashlightOff className="size-4" strokeWidth={1.75} />}
                <span className="hidden sm:inline capitalize">{flashlightMode === 2 ? "Full" : flashlightMode === 1 ? "Low" : "Off"}</span>
              </button>
            ) : null}
            {runtime.mode === "underground" && touch && canLeave ? (
              <button type="button" onClick={onLeave} className="flex h-12 min-w-12 items-center justify-center gap-2 rounded-md border border-emerald-300/40 bg-emerald-900/70 px-3 text-sm font-medium text-emerald-100">
                <LogOut className="size-4" strokeWidth={1.75} />
                <span className="hidden sm:inline">Leave</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={onHint}
              className="flex h-12 min-w-12 items-center justify-center gap-2 rounded-md border border-border bg-surface/90 px-4 text-sm font-medium text-fg"
            >
              <Compass className="size-4" strokeWidth={1.75} />
              <span ref={hintRef}>Peek</span>
            </button>
          </div>
        </div>
      ) : null}

      {playing && runtime.mode === "underground" ? (
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
          <p ref={voiceRef} className="font-display text-lg tracking-[0.28em] text-red-200/85 uppercase drop-shadow-[0_0_12px_rgba(180,42,34,0.75)] transition-opacity duration-300" style={{ opacity: 0 }} />
          {scareTriggered && runtime.stalkerState !== "dormant" ? (
            <p className={`mt-2 text-[10px] tracking-[0.22em] text-red-100/55 uppercase ${runtime.stalkerState === "pursuing" ? "animate-pulse" : ""}`}>
              {runtime.stalkerState === "peeking" ? "kill the light" : "it is behind you"}
            </p>
          ) : null}
        </div>
      ) : null}

      {playing && runtime.mode === "underground" && runtime.horrorT > 0 ? (
        <div className="pointer-events-none absolute top-[38%] left-1/2 z-10 -translate-x-1/2 text-center">
          <p className="font-display text-base tracking-[0.22em] text-red-100/75 uppercase drop-shadow-[0_0_14px_rgba(180,42,34,0.8)]">{runtime.horrorText}</p>
        </div>
      ) : null}

      {playing ? (
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg/70" />
      ) : null}
    </>
  );
}
