import { CELL_SIZE } from "./constants";
import type { Maze } from "./maze";
import type { Runtime } from "./runtime";

const BG = "#121c16";
const HEDGE = "#d7e0d4";
const SELF = "#efe6d4";
const HINT = "#d7e0d4";
const ORB = "#f3ead8";
const GATE = "#e8dcc4";

export function drawMinimap(rt: Runtime) {
  const canvas = rt.mapEl;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const maze = rt.maze;
  const css = canvas.clientWidth || 148;
  const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
  const px = Math.round(css * dpr);
  if (canvas.width !== px || canvas.height !== px) {
    canvas.width = px;
    canvas.height = px;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = css;
  const r = w / 2;

  ctx.clearRect(0, 0, w, w);
  ctx.save();
  ctx.beginPath();
  ctx.arc(r, r, r - 1, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, w);

  ctx.translate(r, r);
  const expanded = rt.mapExpanded;
  if (!expanded) ctx.rotate(rt.yaw);

  const scale = expanded
    ? Math.min((w - 18) / (maze.width * CELL_SIZE), (w - 18) / (maze.height * CELL_SIZE))
    : 5.6;
  const mapCenterX = ((maze.width - 1) * CELL_SIZE) / 2;
  const mapCenterZ = ((maze.height - 1) * CELL_SIZE) / 2;
  const worldToMap = (x: number, z: number) => ({
    x: (x - (expanded ? mapCenterX : rt.x)) * scale,
    y: (z - (expanded ? mapCenterZ : rt.z)) * scale,
  });

  const visR = expanded ? Infinity : r + 8;
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (!rt.visited[y * maze.width + x]) continue;
      const c = maze.cells[y]![x]!;
      const cx = x * CELL_SIZE;
      const cz = y * CELL_SIZE;
      const p = worldToMap(cx, cz);
      if (Math.hypot(p.x, p.y) > visR + CELL_SIZE * scale) continue;
      const half = (CELL_SIZE * scale) / 2;
      ctx.strokeStyle = HEDGE;
      ctx.lineWidth = expanded ? 2.2 : 2.8;
      ctx.lineCap = "square";
      ctx.beginPath();
      if (c.n) {
        ctx.moveTo(p.x - half, p.y - half);
        ctx.lineTo(p.x + half, p.y - half);
      }
      if (c.s) {
        ctx.moveTo(p.x - half, p.y + half);
        ctx.lineTo(p.x + half, p.y + half);
      }
      if (c.w) {
        ctx.moveTo(p.x - half, p.y - half);
        ctx.lineTo(p.x - half, p.y + half);
      }
      if (c.e) {
        ctx.moveTo(p.x + half, p.y - half);
        ctx.lineTo(p.x + half, p.y + half);
      }
      ctx.stroke();

      if (x === maze.exit.x && y === maze.exit.y) {
        const g = worldToMap(maze.archWorld.x, maze.archWorld.z);
        ctx.fillStyle = GATE;
        ctx.beginPath();
        ctx.arc(g.x, g.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  for (const orb of maze.collectibles) {
    if (rt.collected.has(orb.id)) continue;
    const nearby = Math.hypot(orb.x - rt.x, orb.z - rt.z) < CELL_SIZE * 2.2;
    if (!rt.visited[orb.cellY * maze.width + orb.cellX] && !nearby) continue;
    const p = worldToMap(orb.x, orb.z);
    ctx.fillStyle = ORB;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (!expanded && rt.hintT > 0 && rt.hintTarget) {
    const p = worldToMap(rt.hintTarget.x, rt.hintTarget.z);
    const ang = Math.atan2(p.y, p.x);
    const d = Math.min(32, Math.hypot(p.x, p.y));
    const ax = Math.cos(ang) * d;
    const ay = Math.sin(ang) * d;
    ctx.strokeStyle = HINT;
    ctx.fillStyle = HINT;
    ctx.globalAlpha = Math.min(1, rt.hintT * 1.4);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(ax, ay);
    ctx.stroke();
    ctx.beginPath();
    ctx.translate(ax, ay);
    ctx.rotate(ang);
    ctx.moveTo(6, 0);
    ctx.lineTo(-4, 4.5);
    ctx.lineTo(-4, -4.5);
    ctx.closePath();
    ctx.fill();
    ctx.rotate(-ang);
    ctx.translate(-ax, -ay);
    ctx.globalAlpha = 1;
  }

  if (!expanded) ctx.rotate(-rt.yaw);
  ctx.fillStyle = SELF;
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(5, 6);
  ctx.lineTo(0, 3.2);
  ctx.lineTo(-5, 6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
  ctx.strokeStyle = "rgba(239,230,212,0.22)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(r, r, r - 1.25, 0, Math.PI * 2);
  ctx.stroke();
}

export function markVisited(rt: Runtime, cellX: number, cellY: number) {
  const maze = rt.maze;
  if (cellX < 0 || cellY < 0 || cellX >= maze.width || cellY >= maze.height) return;
  rt.visited[cellY * maze.width + cellX] = 1;
}
