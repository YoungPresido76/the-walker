import { EYE_HEIGHT, HINT_COOLDOWN, HINT_DURATION } from "./constants";
import type { GameInput } from "./input";
import { bfsPath, cellCenter, type GameMode, type Maze, type Difficulty } from "./maze";
import type { Phase } from "./store";

export type Runtime = {
  maze: Maze;
  input: GameInput;
  x: number;
  z: number;
  yaw: number;
  pitch: number;
  vx: number;
  vz: number;
  bob: number;
  acc: number;
  elapsed: number;
  collected: Set<number>;
  visited: Uint8Array;
  hintT: number;
  hintCd: number;
  peekCount: number;
  hintTarget: { x: number; z: number } | null;
  flashlightMode: 0 | 1 | 2;
  battery: number;
  presence: number;
  presenceEl: HTMLElement | null;
  bonusEl: HTMLElement | null;
  stillChaseT: number;
  scareT: number;
  scareTriggered: boolean;
  stalkerState: "dormant" | "peeking" | "pursuing";
  stalkerT: number;
  stalkerX: number;
  stalkerZ: number;
  stalkerRoute: { x: number; z: number }[];
  stalkerRouteT: number;
  stalkerLoseT: number;
  stalkerCd: number;
  gameOverReason: "battery" | "light" | "caught" | "looked" | null;
  voiceLine: string;
  voiceLineT: number;
  voiceTauntCd: number;
  voiceEl: HTMLElement | null;
  horrorSeen: Set<string>;
  horrorText: string;
  horrorT: number;
  phase: Phase;
  locked: boolean;
  wonTime: number;
  lastFootSign: number;
  timeEl: HTMLElement | null;
  hintEl: HTMLElement | null;
  collectEl: HTMLElement | null;
  mapEl: HTMLCanvasElement | null;
  mapExpanded: boolean;
  difficulty: Difficulty;
  mode: GameMode;
  exitPulseT: number;
  landmarkSeen: Set<number>;
};

export function createRuntime(maze: Maze, input: GameInput): Runtime {
  const visited = new Uint8Array(maze.width * maze.height);
  visited[maze.start.y * maze.width + maze.start.x] = 1;
  let yaw = 0;
  const path = bfsPath(maze, maze.start, maze.exit);
  if (path[1]) {
    const n = cellCenter(path[1].x, path[1].y);
    yaw = Math.atan2(-(n.x - maze.startWorld.x), -(n.z - maze.startWorld.z));
  }
  return {
    maze,
    input,
    x: maze.startWorld.x,
    z: maze.startWorld.z + 0.15,
    yaw,
    pitch: 0.04,
    vx: 0,
    vz: 0,
    bob: 0,
    acc: 0,
    elapsed: 0,
    collected: new Set(),
    visited,
    hintT: 0,
    hintCd: 0,
    peekCount: 0,
    hintTarget: null,
    flashlightMode: 1,
    battery: 100,
    presence: 0,
    presenceEl: null,
    bonusEl: null,
    stillChaseT: 0,
    scareT: 0,
    scareTriggered: false,
    stalkerState: "dormant",
    stalkerT: 0,
    stalkerX: maze.startWorld.x,
    stalkerZ: maze.startWorld.z - 6,
    stalkerRoute: [],
    stalkerRouteT: 0,
    stalkerLoseT: 0,
    stalkerCd: 0,
    gameOverReason: null,
    voiceLine: "",
    voiceLineT: 0,
    voiceTauntCd: 0,
    voiceEl: null,
    horrorSeen: new Set(),
    horrorText: "",
    horrorT: 0,
    phase: "title",
    locked: false,
    wonTime: 0,
    lastFootSign: 1,
    timeEl: null,
    hintEl: null,
    collectEl: null,
    mapEl: null,
    mapExpanded: false,
    difficulty: maze.difficulty,
    mode: maze.mode,
    exitPulseT: 0,
    landmarkSeen: new Set(),
  };
}

export const PLAYER_EYE = EYE_HEIGHT;
export { HINT_COOLDOWN, HINT_DURATION };

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getPosition: () => { x: number; z: number };
      setKeys: (codes: string[]) => void;
    };
  }
}
