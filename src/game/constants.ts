export const CELL_SIZE = 4;
export const WALL_THICK = 0.56;
export const WALL_HEIGHT = 3.05;
export const PLAYER_RADIUS = 0.34;
export const EYE_HEIGHT = 1.62;
export const WALK_SPEED = 3.25;
export const SPRINT_SPEED = 4.35;
export const ACCEL = 14;
export const FRICTION = 9.5;
export const MAZE_W = 17;
export const MAZE_H = 13;
export const STEP = 1 / 60;
export const HINT_DURATION = 2.2;
export const HINT_COOLDOWN = 8;
export const SCARE_DISTANCE = 3.8;
export const SCARE_DURATION = 2.4;
// 95% drains over ~4 minutes of FULL beam at a normal walking pace; LOW cuts
// that rate down a lot, FULL at a sprint burns through it fast. See
// FLASHLIGHT_MODES below for the per-mode multiplier.
export const FLASHLIGHT_MAIN_DRAIN = 95 / 240;
export const FLASHLIGHT_RESERVE_DRAIN = 5 / 70;
export const FLASHLIGHT_FLICKER_THRESHOLD = 3;

// Three beam states cycled with the light button/key. OFF is nearly blind
// but cheapest and quietest; LOW is a short, dim, battery-sipping beam; FULL
// throws light far enough to reveal secrets but drains fast and raises
// Presence (the Hollow notices a bright light).
export const FLASHLIGHT_MODES = [
  { key: "off", label: "light off", drainMult: 0, distance: 0, angle: 0, penumbra: 0, intensity: 0, fillIntensity: 0, beamOpacity: 0, presenceRate: 0 },
  { key: "low", label: "low beam", drainMult: 0.42, distance: 11, angle: Math.PI / 10, penumbra: 0.72, intensity: 11, fillIntensity: 3.2, beamOpacity: 0.16, presenceRate: 0.4 },
  { key: "full", label: "full beam", drainMult: 1.3, distance: 22, angle: Math.PI / 7, penumbra: 0.62, intensity: 22, fillIntensity: 8, beamOpacity: 0.32, presenceRate: 1.6 },
] as const;

export const STALKER_SPEED = 3.85;
export const STALKER_TRIGGER_DELAY = 1.8;
export const STALKER_CATCH_DISTANCE = 0.72;
// The stalker re-paths through actual maze corridors this often instead of
// beelining through hedges.
export const STALKER_ROUTE_RECOMPUTE = 0.4;
// How directly the camera has to point at the stalker to count as "looking
// back" at it (cosine of the half-angle of the detection cone).
export const STALKER_LOOK_FOV_COS = Math.cos((34 * Math.PI) / 180);
// Sustained distance/time needed to shake a pursuit and go quiet again.
export const STALKER_LOSE_DISTANCE = 16;
export const STALKER_LOSE_TIME = 3.5;
// Cooldown range before it can peek at the player again after being lost.
export const STALKER_RESPAWN_MIN = 15;
export const STALKER_RESPAWN_MAX = 26;
export const STALKER_PEEK_PROBE_STEPS = 6;

// The Listener tracks by sound: standing still or creeping barely registers,
// sprinting is unmistakable. During an active chase, going fully still for
// long enough (and not being right on top of you already) lets it lose the
// scent even inside the normal "still chasing" distance.
export const HIDE_SPEED_THRESHOLD = 0.25;
export const HIDE_TIME_TO_LOSE = 2.6;
export const HIDE_MIN_SAFE_DISTANCE = STALKER_CATCH_DISTANCE * 3.2;

// Presence: how much the Hollow has noticed you. Rises with noise and risk,
// decays when you're calm. Drives how quickly it comes looking again.
export const PRESENCE_MAX = 100;
export const PRESENCE_SPRINT_RATE = 7;
export const PRESENCE_WALK_RATE = 1.1;
export const PRESENCE_DECAY_RATE = 4.4;
export const PRESENCE_STILL_DECAY_BONUS = 2.2;
export const PRESENCE_BONUS_SHARD = 14;
export const PRESENCE_REQUIRED_SHARD = 5;

// Echo Shards: only `required` are needed to leave, the rest (placed deeper
// in the maze, farther from the start) are optional risk/reward bonuses.
export const SHARD_CONFIG: Record<"meadow" | "grove" | "wildwood", { total: number; required: number }> = {
  meadow: { total: 6, required: 4 },
  grove: { total: 8, required: 5 },
  wildwood: { total: 10, required: 6 },
};

export const MOUSE_SENS = 0.00215;
export const TOUCH_LOOK_SENS = 0.0034;
export const GAMEPAD_LOOK = 2.15;
export const PITCH_LIMIT = Math.PI / 2 - 0.04;

export const WORLD = {
  sky: "#09131a",
  fog: "#0f1b22",
  fogNear: 8,
  fogFar: 52,
  grass: "#355834",
  grassDark: "#2a4629",
  gravel: "#c4b392",
  gravelDark: "#a8946e",
  hedge: "#2d5a38",
  hedgeDark: "#1c3c26",
  hedgeLight: "#4a7c4e",
  hedgeCap: "#244a30",
  wood: "#3d2c1c",
  orb: "#f3ead8",
  bonusOrb: "#c23a6f",
  exitGlow: "#efe4cc",
  sun: "#f2e4c4",
} as const;
