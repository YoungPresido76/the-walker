import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { resumeAudio, unlockAudio } from "./audio";
import { GameInput } from "./input";
import { generateMaze } from "./maze";
import type { Difficulty, GameMode } from "./maze";
import { ExploreOverlay, GameOverOverlay, Hud, PauseOverlay, requestLock, TitleOverlay, WinOverlay } from "./overlays";
import { Player } from "./Player";
import { createRuntime } from "./runtime";
import { useHud } from "./store";
import { World } from "./World";

function detectTouch() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
}

function newSeed() {
  return (Math.random() * 0xffffffff) >>> 0;
}

export function TheWalker() {
  const [seed, setSeed] = useState(newSeed);
  const [autostart, setAutostart] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("meadow");
  const [mode, setMode] = useState<GameMode>("garden");
  return (
    <HedgerowRun
      key={seed}
      seed={seed}
      autostart={autostart}
      difficulty={difficulty}
      mode={mode}
      onDifficulty={setDifficulty}
      onMode={setMode}
      onReplay={() => {
        setAutostart(true);
        setSeed(newSeed());
      }}
    />
  );
}

function HedgerowRun({
  seed,
  autostart,
  difficulty,
  mode,
  onDifficulty,
  onMode,
  onReplay,
}: {
  seed: number;
  autostart: boolean;
  difficulty: Difficulty;
  mode: GameMode;
  onDifficulty: (difficulty: Difficulty) => void;
  onMode: (mode: GameMode) => void;
  onReplay: () => void;
}) {
  const maze = useMemo(() => generateMaze(seed, difficulty, mode), [seed, difficulty, mode]);
  const input = useMemo(() => new GameInput(), []);
  const runtime = useMemo(() => createRuntime(maze, input), [maze, input]);
  const canvasEl = useRef<HTMLElement | null>(null);
  const phase = useHud((s) => s.phase);
  const collected = useHud((s) => s.collected);
  const total = useHud((s) => s.total);
  const wonTime = useHud((s) => s.wonTime);
  const touch = useHud((s) => s.touch);
  const locked = useHud((s) => s.locked);
  const gameOverReason = useHud((s) => s.gameOverReason);

  const startPlay = useCallback(() => {
    unlockAudio();
    const nextPhase = runtime.phase === "explore" ? "explore" : "playing";
    runtime.phase = nextPhase;
    useHud.getState().setPhase(nextPhase);
    if (!detectTouch()) requestLock(canvasEl.current);
  }, [runtime]);

  useEffect(() => {
    const detach = input.attach();
    useHud.getState().reset({
      seed: maze.seed,
      total: maze.collectibles.length,
      touch: detectTouch(),
    });
    runtime.phase = "title";
    if (autostart) {
      runtime.phase = "playing";
      useHud.getState().setPhase("playing");
    }
    return detach;
  }, [input, maze, runtime, autostart]);

  useEffect(() => {
    if (autostart && !detectTouch()) {
      const t = window.setTimeout(() => requestLock(canvasEl.current), 80);
      return () => window.clearTimeout(t);
    }
  }, [autostart]);

  useEffect(() => {
    const onChange = () => {
      const isLocked = document.pointerLockElement != null;
      const wasLocked = runtime.locked;
      runtime.locked = isLocked;
      useHud.setState({ locked: isLocked });
      if (wasLocked && !isLocked && runtime.phase === "playing" && !useHud.getState().touch) {
        runtime.phase = "paused";
        useHud.getState().setPhase("paused");
      }
    };
    const onVis = () => resumeAudio();
    document.addEventListener("pointerlockchange", onChange);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("pointerlockchange", onChange);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [runtime]);

  const onHint = useCallback(() => {
    runtime.input.pulseHint();
  }, [runtime]);

  const onFlashlight = useCallback(() => {
    runtime.input.pulseFlashlight();
  }, [runtime]);

  const cheap = typeof window !== "undefined" && window.innerWidth < 520;

  return (
    <div
      className="game-root relative h-dvh w-full overflow-hidden bg-bg"
      onClick={() => {
        if (runtime.phase === "playing" && !document.pointerLockElement && !detectTouch()) {
          requestLock(canvasEl.current);
        }
      }}
    >
      <Canvas
        className="absolute inset-0"
        shadows={!cheap}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        camera={{ fov: 72, near: 0.07, far: 90, position: [0, 1.62, 0] }}
        onCreated={({ gl }) => {
          canvasEl.current = gl.domElement;
          gl.domElement.style.touchAction = "none";
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <World maze={maze} runtime={runtime} />
        <Player runtime={runtime} maze={maze} />
      </Canvas>

      <div className="vignette" />

      <Hud runtime={runtime} onHint={onHint} onFlashlight={onFlashlight} />

      {phase === "title" ? <TitleOverlay onEnter={startPlay} difficulty={difficulty} mode={mode} onDifficulty={onDifficulty} onMode={onMode} /> : null}
      {phase === "paused" && !locked && !touch ? <PauseOverlay onResume={startPlay} /> : null}
      {phase === "explore" ? <ExploreOverlay onContinue={startPlay} /> : null}
      {phase === "won" ? (
        <WinOverlay time={wonTime} collected={collected} total={total} onReplay={onReplay} />
      ) : null}
      {phase === "gameover" ? <GameOverOverlay reason={gameOverReason} onReplay={onReplay} /> : null}
    </div>
  );
}
