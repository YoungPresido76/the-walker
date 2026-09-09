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
export const MOUSE_SENS = 0.00215;
export const TOUCH_LOOK_SENS = 0.0034;
export const GAMEPAD_LOOK = 2.15;
export const PITCH_LIMIT = Math.PI / 2 - 0.04;

export const WORLD = {
  sky: "#8aa4b0",
  fog: "#7e98a4",
  fogNear: 7,
  fogFar: 26,
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
  exitGlow: "#efe4cc",
  sun: "#f2e4c4",
} as const;
