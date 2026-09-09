import {
  CELL_SIZE,
  MAZE_H,
  MAZE_W,
  WALL_HEIGHT,
  WALL_THICK,
} from "./constants";
import { createRng, mixColor, type Rng } from "./rng";

export type Dir = "n" | "e" | "s" | "w";

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
};

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
  exitTrigger: Aabb;
  collectibles: Collectible[];
  wallAabbs: Aabb[];
  walls: Instance[];
  caps: Instance[];
  clumps: Instance[];
  paths: Instance[];
  trees: { x: number; z: number; scale: number; rot: number; hue: number }[];
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

export function generateMaze(seed: number, width = MAZE_W, height = MAZE_H): Maze {
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

  const extras = Math.floor(width * height * 0.11);
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
    exitTrigger,
    collectibles: [],
    wallAabbs,
    walls,
    caps,
    clumps,
    paths,
    trees: [],
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
  const want = 8;
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

  const path = bfsPath(maze, start, exit);
  if (path.length < 2) {
    return generateMaze((seed + 17) >>> 0, width, height);
  }

  return maze;
}
