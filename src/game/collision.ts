import { PLAYER_RADIUS } from "./constants";
import type { Aabb } from "./maze";

export function collideCircle(
  x: number,
  z: number,
  walls: Aabb[],
  radius = PLAYER_RADIUS,
): { x: number; z: number; hit: boolean; nx: number; nz: number } {
  let hit = false;
  let nx = 0;
  let nz = 0;
  for (const w of walls) {
    const cx = Math.max(w.minX, Math.min(x, w.maxX));
    const cz = Math.max(w.minZ, Math.min(z, w.maxZ));
    let dx = x - cx;
    let dz = z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= radius * radius) continue;
    hit = true;
    if (d2 < 1e-10) {
      const left = x - w.minX;
      const right = w.maxX - x;
      const up = z - w.minZ;
      const down = w.maxZ - z;
      const m = Math.min(left, right, up, down);
      if (m === left) {
        x = w.minX - radius;
        nx -= 1;
      } else if (m === right) {
        x = w.maxX + radius;
        nx += 1;
      } else if (m === up) {
        z = w.minZ - radius;
        nz -= 1;
      } else {
        z = w.maxZ + radius;
        nz += 1;
      }
      continue;
    }
    const d = Math.sqrt(d2);
    const pen = radius - d;
    dx /= d;
    dz /= d;
    x += dx * pen;
    z += dz * pen;
    nx += dx;
    nz += dz;
  }
  const n2 = nx * nx + nz * nz;
  if (n2 > 1e-8) {
    const inv = 1 / Math.sqrt(n2);
    nx *= inv;
    nz *= inv;
  }
  return { x, z, hit, nx, nz };
}

export function wallsNear(walls: Aabb[], x: number, z: number, pad: number): Aabb[] {
  const out: Aabb[] = [];
  for (const w of walls) {
    if (x + pad < w.minX || x - pad > w.maxX || z + pad < w.minZ || z - pad > w.maxZ) continue;
    out.push(w);
  }
  return out;
}
