import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type * as THREE from "three";
import { chime, footstep, peekTone, rustle, winFanfare } from "./audio";
import { collideCircle, wallsNear } from "./collision";
import {
  ACCEL,
  EYE_HEIGHT,
  FRICTION,
  GAMEPAD_LOOK,
  HINT_COOLDOWN,
  HINT_DURATION,
  MOUSE_SENS,
  PITCH_LIMIT,
  PLAYER_RADIUS,
  SPRINT_SPEED,
  STEP,
  WALK_SPEED,
  WORLD,
} from "./constants";
import { hintWorldTarget, worldToCell, type Maze } from "./maze";
import { drawMinimap, markVisited } from "./minimap";
import type { Runtime } from "./runtime";
import { formatTime, useHud } from "./store";

function approach(cur: number, target: number, maxDelta: number) {
  const d = target - cur;
  if (Math.abs(d) <= maxDelta) return target;
  return cur + Math.sign(d) * maxDelta;
}

function inAabb(
  x: number,
  z: number,
  b: { minX: number; maxX: number; minZ: number; maxZ: number },
) {
  return x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;
}

export function Player({ runtime, maze }: { runtime: Runtime; maze: Maze }) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 72;
    cam.near = 0.07;
    cam.far = 90;
    cam.updateProjectionMatrix();
    cam.rotation.order = "YXZ";
  }, [camera]);

  useEffect(() => {
    const probe = {
      getYaw: () => runtime.yaw,
      getSpeed: () => Math.hypot(runtime.vx, runtime.vz),
      getPosition: () => ({ x: runtime.x, z: runtime.z }),
      setKeys: (codes: string[]) => {
        runtime.input.setInjected(codes);
        if (codes.length && (runtime.phase === "title" || runtime.phase === "paused")) {
          runtime.phase = "playing";
          useHud.getState().setPhase("playing");
        }
      },
    };
    window.__controlsTest = probe;
    return () => {
      if (window.__controlsTest === probe) delete window.__controlsTest;
    };
  }, [runtime]);

  useFrame((_, delta) => {
    const dtCap = Math.min(delta, 0.1);
    const hud = useHud.getState();
    const playing = runtime.phase === "playing";
    const lookLive = playing && (runtime.locked || hud.touch || runtime.input.injected.size > 0);
    const actions = runtime.input.sample();

    if (lookLive) {
      runtime.yaw -= actions.lookX * MOUSE_SENS + actions.lookPadX * GAMEPAD_LOOK * dtCap;
      runtime.pitch -= actions.lookY * MOUSE_SENS + actions.lookPadY * GAMEPAD_LOOK * dtCap;
      if (runtime.pitch > PITCH_LIMIT) runtime.pitch = PITCH_LIMIT;
      if (runtime.pitch < -PITCH_LIMIT) runtime.pitch = -PITCH_LIMIT;
    }

    if (playing && actions.hintPressed && runtime.hintCd <= 0) {
      const cell = worldToCell(runtime.x, runtime.z);
      runtime.hintTarget = hintWorldTarget(maze, cell.x, cell.y);
      runtime.hintT = HINT_DURATION;
      runtime.hintCd = HINT_COOLDOWN;
      peekTone();
    }

    runtime.acc += dtCap;
    let steps = 0;
    while (runtime.acc >= STEP && steps < 8) {
      runtime.acc -= STEP;
      steps++;

      if (!playing) {
        runtime.vx = 0;
        runtime.vz = 0;
        continue;
      }

      runtime.elapsed += STEP;
      if (runtime.hintT > 0) runtime.hintT = Math.max(0, runtime.hintT - STEP);
      if (runtime.hintCd > 0) runtime.hintCd = Math.max(0, runtime.hintCd - STEP);

      const fx = -Math.sin(runtime.yaw);
      const fz = -Math.cos(runtime.yaw);
      const rx = Math.cos(runtime.yaw);
      const rz = -Math.sin(runtime.yaw);

      let wishX = fx * actions.moveY + rx * actions.moveX;
      let wishZ = fz * actions.moveY + rz * actions.moveX;
      const wishMag = Math.hypot(wishX, wishZ);
      if (wishMag > 1) {
        wishX /= wishMag;
        wishZ /= wishMag;
      }

      const maxSpeed = actions.sprint ? SPRINT_SPEED : WALK_SPEED;
      if (wishMag > 0.04) {
        runtime.vx = approach(runtime.vx, wishX * maxSpeed, ACCEL * STEP);
        runtime.vz = approach(runtime.vz, wishZ * maxSpeed, ACCEL * STEP);
      } else {
        runtime.vx = approach(runtime.vx, 0, FRICTION * STEP);
        runtime.vz = approach(runtime.vz, 0, FRICTION * STEP);
      }

      const speed = Math.hypot(runtime.vx, runtime.vz);
      const nx = runtime.x + runtime.vx * STEP;
      const nz = runtime.z + runtime.vz * STEP;
      const nearby = wallsNear(maze.wallAabbs, nx, nz, PLAYER_RADIUS + speed * STEP + 0.55);
      let px = nx;
      let pz = nz;
      let hit = false;
      let hnx = 0;
      let hnz = 0;
      for (let i = 0; i < 3; i++) {
        const r = collideCircle(px, pz, nearby);
        px = r.x;
        pz = r.z;
        if (r.hit) {
          hit = true;
          hnx = r.nx;
          hnz = r.nz;
        }
      }
      if (hit) {
        const vn = runtime.vx * hnx + runtime.vz * hnz;
        if (vn < 0) {
          runtime.vx -= hnx * vn;
          runtime.vz -= hnz * vn;
        }
        if (speed > 1.35 && vn < -0.8) rustle();
      }
      runtime.x = px;
      runtime.z = pz;

      const cell = worldToCell(runtime.x, runtime.z);
      markVisited(runtime, cell.x, cell.y);

      for (const c of maze.collectibles) {
        if (runtime.collected.has(c.id)) continue;
        if (Math.hypot(runtime.x - c.x, runtime.z - c.z) < 0.72) {
          runtime.collected.add(c.id);
          chime();
          useHud.setState({ collected: runtime.collected.size });
        }
      }

      if (inAabb(runtime.x, runtime.z, maze.exitTrigger)) {
        runtime.phase = "won";
        runtime.wonTime = runtime.elapsed;
        runtime.vx = 0;
        runtime.vz = 0;
        useHud.setState({
          phase: "won",
          wonTime: runtime.elapsed,
          collected: runtime.collected.size,
        });
        if (document.pointerLockElement) document.exitPointerLock();
        winFanfare();
      }
    }

    const moveAmt = Math.min(1, Math.hypot(runtime.vx, runtime.vz) / WALK_SPEED);
    if (playing && moveAmt > 0.12) {
      runtime.bob += Math.hypot(runtime.vx, runtime.vz) * dtCap * 9.4;
      const s = Math.sin(runtime.bob);
      if (s > 0 && runtime.lastFootSign <= 0) footstep(0.55 + moveAmt * 0.45);
      runtime.lastFootSign = s;
    }
    const bobY = Math.sin(runtime.bob) * 0.022 * moveAmt;
    const sway = Math.cos(runtime.bob * 0.5) * 0.006 * moveAmt;

    camera.position.set(runtime.x, EYE_HEIGHT + bobY, runtime.z);
    camera.rotation.set(runtime.pitch, runtime.yaw, sway);

    if (runtime.timeEl && playing) runtime.timeEl.textContent = formatTime(runtime.elapsed);
    if (runtime.collectEl) {
      runtime.collectEl.textContent = `${runtime.collected.size}/${maze.collectibles.length}`;
    }
    if (runtime.hintEl) {
      if (runtime.hintCd > 0 && runtime.hintT <= 0) {
        runtime.hintEl.textContent = `${Math.ceil(runtime.hintCd)}s`;
      } else {
        runtime.hintEl.textContent = "Peek";
      }
    }
    drawMinimap(runtime);
    gl.setClearColor(WORLD.sky, 1);
  });

  return null;
}
