import {
  CELL_SIZE,
  MAZE_H,
  MAZE_W,
  SHARD_CONFIG,
  WALL_HEIGHT,
  WALL_THICK,
} from "./constants";
import { createRng, mixColor, type Rng } from "./rng";

export type Dir = "n" | "e" | "s" | "w";
export type Difficulty = "meadow" | "grove" | "wildwood";
export type GameMode = "garden" | "spirit" | "underground";
export type LandmarkKind = "river" | "house" | "shed" | "mountain" | "grove";
export type Landmark = { kind: LandmarkKind; x: number; z: number; scale: number; cellX: number; cellY: number };

export const DIRS: Dir[] = ["n", "e", "s", "w"];
export const OPP: Record<Dir, Dir> = { n: "s", e: "w", s: "n", w: "e" };
export const DELTA: Record<Dir, readonly [number, number]> = {
  n: [0, -1],
  e: [1, 0],
  s: [0, 1],
  w: [-1, 0],
};

export type Cell = {
  x: number;
  y: number;
  n: boolean;
  e: boolean;
  s: boolean;
  w: boolean;
};

export type Aabb = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type Instance = {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  color: number;
};

export type Collectible = {
  id: number;
  cellX: number;
  cellY: number;
  x: number;
  z: number;
  // Bonus shards (underground only) aren't required to leave — they're
  // placed deeper in the maze as an optional risk/reward.
  bonus?: boolean;
};

export type HorrorTrigger = { x: number; y: number; kind: "grid" | "turn" | "relic" };

export type Maze = {
  width: number;
  height: number;
  seed: number;
  cells: Cell[][];
  start: { x: number; y: number };
  exit: { x: number; y: number };
  startWorld: { x: number; z: number };
  exitWorld: { x: number; z: number };
  archWorld: { x: number; z: number };
  scareWorld: { x: number; z: number };
  exitTrigger: Aabb;
  collectibles: Collectible[];
  horrorTriggers: HorrorTrigger[];
  wallAabbs: Aabb[];
  walls: Instance[];
  caps: Instance[];
  clumps: Instance[];
  paths: Instance[];
  trees: { x: number; z: number; scale: number; rot: number; hue: number }[];
  difficulty: Difficulty;
  mode: GameMode;
  landmarks: Landmark[];
  // Shards required to leave (underground only, equal to collectibles.length
  // elsewhere — see SHARD_CONFIG).
  shardsRequired: number;
};

export function cellCenter(x: number, y: number): { x: number; z: number } {
  return { x: x * CELL_SIZE, z: y * CELL_SIZE };
}

export function worldToCell(x: number, z: number): { x: number; y: number } {
  return { x: Math.round(x / CELL_SIZE), y: Math.round(z / CELL_SIZE) };
}

function neighborsOpen(cell: Cell, maze: Maze): { x: number; y: number; dir: Dir }[] {
  const out: { x: number; y: number; dir: Dir }[] = [];
  for (const dir of DIRS) {
    if (cell[dir]) continue;
    const [dx, dy] = DELTA[dir];
    const nx = cell.x + dx;
    const ny = cell.y + dy;
    if (nx < 0 || ny < 0 || nx >= maze.width || ny >= maze.height) continue;
    out.push({ x: nx, y: ny, dir });
  }
  return out;
}

// Distance (in steps) from `from` to every reachable cell — used to rank
// how deep/dangerous a spot in the maze is, e.g. for placing bonus shards
// farther from the start than the ones required to leave.
export function bfsDistances(maze: Maze, from: { x: number; y: number }): Int32Array {
  const dist = new Int32Array(maze.width * maze.height).fill(-1);
  const key = (x: number, y: number) => y * maze.width + x;
  dist[key(from.x, from.y)] = 0;
  const q = [from];
  for (let i = 0; i < q.length; i++) {
    const cur = q[i]!;
    const cell = maze.cells[cur.y]?.[cur.x];
    if (!cell) continue;
    const d = dist[key(cur.x, cur.y)]!;
    for (const n of neighborsOpen(cell, maze)) {
      const k = key(n.x, n.y);
      if (dist[k] !== -1) continue;
      dist[k] = d + 1;
      q.push({ x: n.x, y: n.y });
    }
  }
  return dist;
}

export function bfsPath(
  maze: Maze,
  from: { x: number; y: number },
  to: { x: number; y: number },
): { x: number; y: number }[] {
  const key = (x: number, y: number) => y * maze.width + x;
  const prev = new Map<number, number>();
  const q = [from];
  const seen = new Uint8Array(maze.width * maze.height);
  seen[key(from.x, from.y)] = 1;
  let found = false;
  for (let i = 0; i < q.length; i++) {
    const cur = q[i]!;
    if (cur.x === to.x && cur.y === to.y) {
      found = true;
      break;
    }
    const cell = maze.cells[cur.y]?.[cur.x];
    if (!cell) continue;
    for (const n of neighborsOpen(cell, maze)) {
      const k = key(n.x, n.y);
      if (seen[k]) continue;
      seen[k] = 1;
      prev.set(k, key(cur.x, cur.y));
      q.push({ x: n.x, y: n.y });
    }
  }
  if (!found) return [from];
  const path: { x: number; y: number }[] = [];
  let k = key(to.x, to.y);
  const startK = key(from.x, from.y);
  while (k !== startK) {
    path.push({ x: k % maze.width, y: Math.floor(k / maze.width) });
    const p = prev.get(k);
    if (p === undefined) break;
    k = p;
  }
  path.push(from);
  path.reverse();
  return path;
}

export function hintWorldTarget(
  maze: Maze,
  cellX: number,
  cellY: number,
): { x: number; z: number } {
  const cx = Math.max(0, Math.min(maze.width - 1, cellX));
  const cy = Math.max(0, Math.min(maze.height - 1, cellY));
  const path = bfsPath(maze, { x: cx, y: cy }, maze.exit);
  if (path.length <= 1) return maze.archWorld;
  const n = path[1]!;
  return cellCenter(n.x, n.y);
}

// Which cardinal direction a yaw angle is mostly facing, snapped to the grid
// axes the maze corridors run along.
export function facingDir(yaw: number): Dir {
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  return Math.abs(fx) > Math.abs(fz) ? (fx > 0 ? "e" : "w") : fz > 0 ? "s" : "n";
}

// Walks straight through open doorways from (fromX, fromY) in `dir`, returning
// the run of cells that form an unbroken corridor, so we only ever place the
// stalker somewhere the player can actually see down a straight hallway.
export function probeCorridor(maze: Maze, fromX: number, fromY: number, dir: Dir, maxSteps: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const [dx, dy] = DELTA[dir];
  let cx = fromX;
  let cy = fromY;
  for (let i = 0; i < maxSteps; i++) {
    const cell = maze.cells[cy]?.[cx];
    if (!cell || cell[dir]) break;
    cx += dx;
    cy += dy;
    if (cx < 0 || cy < 0 || cx >= maze.width || cy >= maze.height) break;
    out.push({ x: cx, y: cy });
  }
  return out;
}

export function wallCount(cell: Cell): number {
  return Number(cell.n) + Number(cell.e) + Number(cell.s) + Number(cell.w);
}

function addAabb(list: Aabb[], x: number, z: number, sx: number, sz: number) {
  list.push({
    minX: x - sx / 2,
    maxX: x + sx / 2,
    minZ: z - sz / 2,
    maxZ: z + sz / 2,
  });
}

function hedgeColor(rng: Rng): number {
  const t = rng.next();
  if (t < 0.18) return mixColor(0x1c3c26, 0x2d5a38, rng.next());
  if (t < 0.72) return mixColor(0x2d5a38, 0x3d6e44, rng.next());
  return mixColor(0x3d6e44, 0x4a7c4e, rng.next());
}

export function generateMaze(
  seed: number,
  difficulty: Difficulty = "meadow",
  mode: GameMode = "garden",
): Maze {
  const sizes: Record<Difficulty, readonly [number, number]> =
    mode === "underground"
      ? { meadow: [23, 19], grove: [29, 23], wildwood: [35, 27] }
      : {
          meadow: [MAZE_W, MAZE_H],
          grove: [21, 17],
          wildwood: [27, 21],
        };
  const [width, height] = sizes[difficulty];
  const rng = createRng(seed);
  const cells: Cell[][] = [];
  for (let y = 0; y < height; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x++) {
      row.push({ x, y, n: true, e: true, s: true, w: true });
    }
    cells.push(row);
  }

  const start = { x: Math.floor(width / 2), y: height - 1 };
  const exit = { x: Math.floor(width / 2), y: 0 };
  const visited = new Uint8Array(width * height);
  const stack: { x: number; y: number }[] = [start];
  visited[start.y * width + start.x] = 1;

  while (stack.length) {
    const cur = stack[stack.length - 1]!;
    const options: { dir: Dir; x: number; y: number }[] = [];
    for (const dir of DIRS) {
      const [dx, dy] = DELTA[dir];
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (visited[ny * width + nx]) continue;
      options.push({ dir, x: nx, y: ny });
    }
    if (!options.length) {
      stack.pop();
      continue;
    }
    const pick = options[Math.floor(rng.next() * options.length)]!;
    const here = cells[cur.y]![cur.x]!;
    const there = cells[pick.y]![pick.x]!;
    here[pick.dir] = false;
    there[OPP[pick.dir]] = false;
    visited[pick.y * width + pick.x] = 1;
    stack.push({ x: pick.x, y: pick.y });
  }

  // Underground gets noticeably more loops/junctions than the garden mazes so
  // it reads as an actual warren of choices to hide and creep through, not a
  // single corridor that's just been folded back on itself.
  const branchFactor =
    mode === "underground"
      ? difficulty === "meadow"
        ? 0.32
        : difficulty === "grove"
          ? 0.4
          : 0.48
      : difficulty === "meadow"
        ? 0.14
        : difficulty === "grove"
          ? 0.2
          : 0.27;
  const extras = Math.floor(width * height * branchFactor);
  let added = 0;
  let guard = 0;
  while (added < extras && guard++ < 5000) {
    const x = rng.int(0, width);
    const y = rng.int(0, height);
    const dir = rng.pick(DIRS);
    const [dx, dy] = DELTA[dir];
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    const here = cells[y]![x]!;
    if (!here[dir]) continue;
    here[dir] = false;
    cells[ny]![nx]![OPP[dir]] = false;
    added++;
  }

  // Open the north hedge of the exit cell so the gate is a real way out.
  cells[exit.y]![exit.x]!.n = false;

  const startWorld = cellCenter(start.x, start.y);
  const exitWorld = cellCenter(exit.x, exit.y);
  const archWorld = { x: exitWorld.x, z: exitWorld.z - CELL_SIZE / 2 };
  const scareCell = { x: Math.floor(width / 2), y: Math.max(1, Math.floor(height / 2)) };
  const scareWorld = cellCenter(scareCell.x, scareCell.y);
  const exitTrigger: Aabb = {
    minX: exitWorld.x - 1.2,
    maxX: exitWorld.x + 1.2,
    minZ: archWorld.z - 1.35,
    maxZ: archWorld.z + 0.4,
  };

  const hWalls = Array.from({ length: height + 1 }, () => Array<boolean>(width).fill(false));
  const vWalls = Array.from({ length: height }, () => Array<boolean>(width + 1).fill(false));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = cells[y]![x]!;
      if (c.n) hWalls[y]![x] = true;
      if (c.s) hWalls[y + 1]![x] = true;
      if (c.w) vWalls[y]![x] = true;
      if (c.e) vWalls[y]![x + 1] = true;
    }
  }

  const wallAabbs: Aabb[] = [];
  const walls: Instance[] = [];
  const caps: Instance[] = [];
  const clumps: Instance[] = [];
  const overlap = WALL_THICK;

  const pushWall = (x: number, z: number, sx: number, sz: number) => {
    addAabb(wallAabbs, x, z, sx, sz);
    const color = hedgeColor(rng);
    walls.push({
      x,
      y: WALL_HEIGHT / 2,
      z,
      sx,
      sy: WALL_HEIGHT,
      sz,
      color,
    });
    caps.push({
      x,
      y: WALL_HEIGHT - 0.14,
      z,
      sx: sx + 0.1,
      sy: 0.3,
      sz: sz + 0.1,
      color: mixColor(color, 0x1a3322, 0.35),
    });
    const long = Math.max(sx, sz);
    const alongX = sx >= sz;
    const nClump = Math.max(1, Math.round(long / 1.7));
    for (let i = 0; i < nClump; i++) {
      const t = (i + 0.5) / nClump + rng.range(-0.08, 0.08);
      const ox = alongX ? (t - 0.5) * sx : rng.range(-0.08, 0.08);
      const oz = alongX ? rng.range(-0.08, 0.08) : (t - 0.5) * sz;
      clumps.push({
        x: x + ox,
        y: WALL_HEIGHT + rng.range(0.05, 0.28),
        z: z + oz,
        sx: rng.range(0.45, 0.85),
        sy: rng.range(0.28, 0.55),
        sz: rng.range(0.45, 0.85),
        color: mixColor(color, 0x5a8a52, rng.range(0.1, 0.55)),
      });
    }
  };

  for (let y = 0; y < height + 1; y++) {
    for (let x = 0; x < width; x++) {
      if (!hWalls[y]![x]) continue;
      pushWall(x * CELL_SIZE, y * CELL_SIZE - CELL_SIZE / 2, CELL_SIZE + overlap, WALL_THICK);
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width + 1; x++) {
      if (!vWalls[y]![x]) continue;
      pushWall(x * CELL_SIZE - CELL_SIZE / 2, y * CELL_SIZE, WALL_THICK, CELL_SIZE + overlap);
    }
  }

  const paths: Instance[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = cellCenter(x, y);
      const gravel = mixColor(0xc4b392, 0xa8946e, rng.next());
      paths.push({
        x: c.x,
        y: 0.02,
        z: c.z,
        sx: CELL_SIZE - 0.08,
        sy: 0.045,
        sz: CELL_SIZE - 0.08,
        color: gravel,
      });
    }
  }
  paths.push({
    x: exitWorld.x,
    y: 0.02,
    z: archWorld.z - 0.7,
    sx: 2.4,
    sy: 0.045,
    sz: 2.2,
    color: mixColor(0xc4b392, 0xb8a57a, 0.4),
  });

  const maze: Maze = {
    width,
    height,
    seed,
    cells,
    start,
    exit,
    startWorld,
    exitWorld,
    archWorld,
    scareWorld,
    exitTrigger,
    collectibles: [],
    horrorTriggers: [],
    wallAabbs,
    walls,
    caps,
    clumps,
    paths,
    trees: [],
    difficulty,
    mode,
    landmarks: [],
    shardsRequired: 0,
  };

  const deadEnds: { x: number; y: number }[] = [];
  const others: { x: number; y: number }[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if ((x === start.x && y === start.y) || (x === exit.x && y === exit.y)) continue;
      const c = cells[y]![x]!;
      if (wallCount(c) >= 3) deadEnds.push({ x, y });
      else others.push({ x, y });
    }
  }
  rng.shuffle(deadEnds);
  rng.shuffle(others);
  const want =
    mode === "spirit"
      ? difficulty === "wildwood"
        ? 12
        : 9
      : mode === "underground"
        ? SHARD_CONFIG[difficulty].total
        : difficulty === "wildwood"
          ? 14
          : 8;
  const picks = [...deadEnds, ...others].slice(0, want);
  maze.collectibles = picks.map((p, id) => {
    const c = cellCenter(p.x, p.y);
    return {
      id,
      cellX: p.x,
      cellY: p.y,
      x: c.x + rng.range(-0.45, 0.45),
      z: c.z + rng.range(-0.45, 0.45),
    };
  });

  if (mode === "underground") {
    // Only `required` shards are needed to leave. Mark the ones farthest
    // (by corridor distance) from the start as optional bonus shards, so the
    // risk/reward tier is tied to how deep you actually have to go for them.
    maze.shardsRequired = Math.min(maze.collectibles.length, SHARD_CONFIG[difficulty].required);
    const bonusCount = maze.collectibles.length - maze.shardsRequired;
    if (bonusCount > 0) {
      const dist = bfsDistances(maze, start);
      const byDepth = [...maze.collectibles].sort((a, b) => (dist[b.cellY * width + b.cellX] ?? 0) - (dist[a.cellY * width + a.cellX] ?? 0));
      const bonusIds = new Set(byDepth.slice(0, bonusCount).map((c) => c.id));
      maze.collectibles = maze.collectibles.map((c) => (bonusIds.has(c.id) ? { ...c, bonus: true } : c));
    }
  } else {
    maze.shardsRequired = maze.collectibles.length;
  }

  if (mode === "underground") {
    const candidates: HorrorTrigger[] = [];
    const isTurn = (cell: Cell) => {
      const open = DIRS.filter((dir) => !cell[dir]);
      return open.length === 2 && OPP[open[0]!] !== open[1];
    };
    const pushCandidate = (x: number, y: number, kind: HorrorTrigger["kind"]) => {
      if ((x === start.x && y === start.y) || (x === exit.x && y === exit.y)) return;
      if (x === scareCell.x && y === scareCell.y) return;
      if (!candidates.some((trigger) => trigger.x === x && trigger.y === y)) candidates.push({ x, y, kind });
    };
    for (const p of deadEnds) pushCandidate(p.x, p.y, "grid");
    for (const p of others) if (isTurn(cells[p.y]![p.x]!)) pushCandidate(p.x, p.y, "turn");
    for (const collectible of maze.collectibles) pushCandidate(collectible.cellX, collectible.cellY, "relic");
    rng.shuffle(candidates);
    maze.horrorTriggers = candidates.slice(0, difficulty === "wildwood" ? 16 : difficulty === "grove" ? 12 : 9);
  }

  const cx = ((width - 1) * CELL_SIZE) / 2;
  const cz = ((height - 1) * CELL_SIZE) / 2;
  const radius = Math.max(width, height) * CELL_SIZE * 0.62;
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + rng.range(-0.12, 0.12);
    const d = radius + rng.range(4, 11);
    maze.trees.push({
      x: cx + Math.cos(a) * d,
      z: cz + Math.sin(a) * d,
      scale: rng.range(1.1, 1.85),
      rot: rng.range(0, Math.PI * 2),
      hue: mixColor(0x2a5632, 0x4a7a44, rng.next()),
    });
  }

  if (mode === "spirit") {
    const kinds: LandmarkKind[] = ["river", "house", "shed", "mountain", "grove", "house", "river"];
    maze.landmarks = kinds.map((kind, i) => {
      const a = (i / kinds.length) * Math.PI * 2 + rng.range(-0.2, 0.2);
      const d = Math.max(width, height) * CELL_SIZE * 0.7 + rng.range(5, 15);
      const x = cx + Math.cos(a) * d;
      const z = cz + Math.sin(a) * d;
      return { kind, x, z, scale: rng.range(0.85, 1.35), cellX: Math.max(0, Math.min(width - 1, Math.round(x / CELL_SIZE))), cellY: Math.max(0, Math.min(height - 1, Math.round(z / CELL_SIZE))) };
    });
  }

  const path = bfsPath(maze, start, exit);
  if (path.length < 2) {
    return generateMaze((seed + 17) >>> 0, difficulty, mode);
  }

  return maze;
}
