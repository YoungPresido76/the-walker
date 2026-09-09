import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type * as THREE from "three";
import { caughtSting, chime, footstep, peekTone, rustle, scareSting, setAmbientScene, stalkerWhisper, winFanfare } from "./audio";
import { collideCircle, wallsNear } from "./collision";
import {
  ACCEL,
  EYE_HEIGHT,
  FRICTION,
  FLASHLIGHT_FLICKER_THRESHOLD,
  FLASHLIGHT_MAIN_DRAIN,
  FLASHLIGHT_RESERVE_DRAIN,
  GAMEPAD_LOOK,
  HINT_COOLDOWN,
  HINT_DURATION,
  MOUSE_SENS,
  PITCH_LIMIT,
  PLAYER_RADIUS,
  SCARE_DISTANCE,
  SCARE_DURATION,
  STALKER_CATCH_DISTANCE,
  STALKER_LOOK_FOV_COS,
  STALKER_LOSE_DISTANCE,
  STALKER_LOSE_TIME,
  STALKER_PEEK_PROBE_STEPS,
  STALKER_RESPAWN_MAX,
  STALKER_RESPAWN_MIN,
  STALKER_ROUTE_RECOMPUTE,
  STALKER_SPEED,
  STALKER_TRIGGER_DELAY,
  SPRINT_SPEED,
  STEP,
  WALK_SPEED,
  WORLD,
} from "./constants";
import { bfsPath, cellCenter, facingDir, hintWorldTarget, probeCorridor, worldToCell, type Maze } from "./maze";
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

// Walks the stalker toward the player through actual maze corridors instead
// of a straight line, so it can never clip through a hedge to cut a corner
// the player can't. Re-paths periodically rather than every tick since a
// bfs over the whole maze every physics step is wasted work once the target
// cell hasn't changed.
function advanceStalker(runtime: Runtime, maze: Maze, targetX: number, targetZ: number, speed: number) {
  runtime.stalkerRouteT -= STEP;
  if (runtime.stalkerRouteT <= 0 || runtime.stalkerRoute.length === 0) {
    const fromCell = worldToCell(runtime.stalkerX, runtime.stalkerZ);
    const toCell = worldToCell(targetX, targetZ);
    const path = bfsPath(maze, fromCell, toCell);
    runtime.stalkerRoute = path.slice(1).map((c) => cellCenter(c.x, c.y));
    runtime.stalkerRouteT = STALKER_ROUTE_RECOMPUTE;
  }
  let remaining = speed * STEP;
  while (remaining > 0 && runtime.stalkerRoute.length > 0) {
    const next = runtime.stalkerRoute[0]!;
    const dx = next.x - runtime.stalkerX;
    const dz = next.z - runtime.stalkerZ;
    const d = Math.hypot(dx, dz);
    if (d <= remaining || d < 1e-4) {
      runtime.stalkerX = next.x;
      runtime.stalkerZ = next.z;
      runtime.stalkerRoute.shift();
      remaining -= d;
    } else {
      runtime.stalkerX += (dx / d) * remaining;
      runtime.stalkerZ += (dz / d) * remaining;
      remaining = 0;
    }
  }
}

// True once the camera is aimed squarely at the stalker's current position,
// independent of whether the mouse happens to be moving on this exact tick.
function isLookingAtStalker(runtime: Runtime): boolean {
  const dx = runtime.stalkerX - runtime.x;
  const dz = runtime.stalkerZ - runtime.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.05) return true;
  const fx = -Math.sin(runtime.yaw);
  const fz = -Math.cos(runtime.yaw);
  const dot = (dx / dist) * fx + (dz / dist) * fz;
  return dot > STALKER_LOOK_FOV_COS;
}

// Places the stalker a couple of cells down whichever straight corridor the
// player is currently facing, so it can pop into view mid-hallway instead of
// only ever appearing at the one scripted spot.
function spawnPeekAhead(runtime: Runtime, maze: Maze): boolean {
  const cell = worldToCell(runtime.x, runtime.z);
  const dir = facingDir(runtime.yaw);
  const corridor = probeCorridor(maze, cell.x, cell.y, dir, STALKER_PEEK_PROBE_STEPS);
  if (corridor.length < 2) return false;
  const spotIdx = Math.min(corridor.length - 1, Math.max(1, Math.floor(corridor.length * 0.7)));
  const spot = corridor[spotIdx]!;
  const w = cellCenter(spot.x, spot.y);
  runtime.stalkerState = "peeking";
  runtime.stalkerT = STALKER_TRIGGER_DELAY;
  runtime.stalkerX = w.x;
  runtime.stalkerZ = w.z;
  runtime.stalkerRoute = [];
  runtime.stalkerRouteT = 0;
  stalkerWhisper();
  return true;
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
    const playing = runtime.phase === "playing" || runtime.phase === "explore";
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
      runtime.peekCount += 1;
      useHud.setState({ peeks: runtime.peekCount });
      peekTone();
    }

    if (playing && actions.flashlightPressed) {
      runtime.flashlightOn = runtime.battery > 0 && !runtime.flashlightOn;
      useHud.setState({ flashlightOn: runtime.flashlightOn });
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
      if (runtime.mode === "underground" && runtime.flashlightOn) {
        const drain = runtime.battery > 5 ? FLASHLIGHT_MAIN_DRAIN : FLASHLIGHT_RESERVE_DRAIN;
        runtime.battery = Math.max(0, runtime.battery - drain * STEP);
        if (runtime.battery <= 0) {
          runtime.flashlightOn = false;
          useHud.setState({ flashlightOn: false, battery: 0 });
          stalkerWhisper();
        } else if (Math.floor(runtime.battery) !== Math.floor(runtime.battery + drain * STEP)) {
          useHud.setState({ battery: runtime.battery });
        }
      }
      const minute = Math.floor(runtime.elapsed / 60);
      if (minute > 0 && Math.abs(runtime.elapsed - minute * 60) < STEP * 0.6) {
        runtime.exitPulseT = 3.2;
      }
      if (runtime.exitPulseT > 0) runtime.exitPulseT = Math.max(0, runtime.exitPulseT - STEP);
      if (runtime.hintT > 0) runtime.hintT = Math.max(0, runtime.hintT - STEP);
      if (runtime.hintCd > 0) runtime.hintCd = Math.max(0, runtime.hintCd - STEP);
      if (runtime.scareT > 0) runtime.scareT = Math.max(0, runtime.scareT - STEP);

      if (runtime.mode === "underground") {
        if (runtime.stalkerState === "dormant") {
          // After the first scripted encounter, it doesn't just vanish for
          // good — it goes quiet for a while and can catch up with you
          // again further down the maze.
          if (runtime.scareTriggered) {
            runtime.stalkerCd = Math.max(0, runtime.stalkerCd - STEP);
            if (runtime.stalkerCd <= 0 && spawnPeekAhead(runtime, maze)) {
              runtime.stalkerCd = STALKER_RESPAWN_MIN + Math.random() * (STALKER_RESPAWN_MAX - STALKER_RESPAWN_MIN);
            }
          }
        } else {
          runtime.stalkerT = Math.max(0, runtime.stalkerT - STEP);
          if (runtime.stalkerState === "peeking") {
            const lookedBack = isLookingAtStalker(runtime);
            if (lookedBack) runtime.stalkerT = 0;
            if (runtime.stalkerT <= 0) {
              if (runtime.flashlightOn) {
                runtime.gameOverReason = lookedBack ? "looked" : "light";
                runtime.phase = "gameover";
                useHud.setState({ phase: "gameover", gameOverReason: runtime.gameOverReason });
                caughtSting();
                if (document.pointerLockElement) document.exitPointerLock();
              } else {
                runtime.stalkerState = "pursuing";
                runtime.stalkerRoute = [];
                runtime.stalkerRouteT = 0;
                runtime.stalkerLoseT = 0;
                stalkerWhisper();
              }
            }
          } else if (runtime.stalkerState === "pursuing") {
            advanceStalker(runtime, maze, runtime.x, runtime.z, STALKER_SPEED);
            const dist = Math.hypot(runtime.x - runtime.stalkerX, runtime.z - runtime.stalkerZ);
            if (dist < STALKER_CATCH_DISTANCE) {
              runtime.gameOverReason = "caught";
              runtime.phase = "gameover";
              useHud.setState({ phase: "gameover", gameOverReason: "caught" });
              caughtSting();
              if (document.pointerLockElement) document.exitPointerLock();
            } else if (dist > STALKER_LOSE_DISTANCE) {
              runtime.stalkerLoseT += STEP;
              if (runtime.stalkerLoseT > STALKER_LOSE_TIME) {
                runtime.stalkerState = "dormant";
                runtime.stalkerLoseT = 0;
                runtime.stalkerRoute = [];
                runtime.stalkerCd = STALKER_RESPAWN_MIN + Math.random() * (STALKER_RESPAWN_MAX - STALKER_RESPAWN_MIN);
              }
            } else {
              runtime.stalkerLoseT = 0;
            }
          }
        }
      }

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

      if (runtime.mode === "underground" && !runtime.scareTriggered) {
        const distToScare = Math.hypot(runtime.x - maze.scareWorld.x, runtime.z - maze.scareWorld.z);
        if (distToScare < SCARE_DISTANCE) {
          runtime.scareTriggered = true;
          runtime.scareT = SCARE_DURATION;
          runtime.stalkerState = "peeking";
          runtime.stalkerT = STALKER_TRIGGER_DELAY;
          runtime.stalkerX = runtime.x + Math.sin(runtime.yaw) * 4.8;
          runtime.stalkerZ = runtime.z + Math.cos(runtime.yaw) * 4.8;
          useHud.setState({ scareTriggered: true });
          scareSting();
        }
      }

      const cell = worldToCell(runtime.x, runtime.z);
      markVisited(runtime, cell.x, cell.y);
      if (runtime.mode === "underground" && runtime.horrorT > 0) runtime.horrorT = Math.max(0, runtime.horrorT - STEP);
      if (runtime.mode === "underground") {
        const trigger = maze.horrorTriggers.find((candidate) => candidate.x === cell.x && candidate.y === cell.y);
        const triggerKey = trigger ? `${trigger.kind}:${trigger.x}:${trigger.y}` : "";
        if (trigger && !runtime.horrorSeen.has(triggerKey)) {
          runtime.horrorSeen.add(triggerKey);
          runtime.horrorT = 2.4;
          runtime.horrorText = trigger.kind === "grid" ? "The floor breathed" : trigger.kind === "turn" ? "Something moved around the corner" : "The light was not yours";
          scareSting();
        }
      }
      for (let i = 0; i < maze.landmarks.length; i++) {
        const landmark = maze.landmarks[i]!;
        if (Math.hypot(runtime.x - landmark.x, runtime.z - landmark.z) < 13) runtime.landmarkSeen.add(i);
      }

      for (const c of maze.collectibles) {
        if (runtime.collected.has(c.id)) continue;
        if (Math.hypot(runtime.x - c.x, runtime.z - c.z) < 0.72) {
          runtime.collected.add(c.id);
          if (runtime.mode === "underground") {
            runtime.battery = Math.min(100, runtime.battery + 5);
            useHud.setState({ battery: runtime.battery });
          }
          chime();
          useHud.setState({ collected: runtime.collected.size });
        }
      }

      const spiritReady = runtime.mode !== "spirit" || runtime.collected.size >= maze.collectibles.length;
      if (runtime.phase === "playing" && spiritReady && inAabb(runtime.x, runtime.z, maze.exitTrigger)) {
        if (runtime.mode === "spirit") {
          runtime.phase = "explore";
          runtime.x = maze.archWorld.x;
          runtime.z = maze.archWorld.z - 5.5;
          useHud.setState({ phase: "explore" });
          runtime.vx = 0;
          runtime.vz = 0;
          return;
        }
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

    const scareShake = runtime.scareT > 0 ? Math.sin(runtime.scareT * 34) * 0.035 * Math.min(1, runtime.scareT * 2) : 0;
    camera.position.set(runtime.x, EYE_HEIGHT + bobY + scareShake, runtime.z);
    camera.rotation.set(runtime.pitch + scareShake * 0.7, runtime.yaw + scareShake, sway + scareShake * 0.45);

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
    const nearRiver = maze.landmarks.some((landmark) => landmark.kind === "river" && Math.hypot(runtime.x - landmark.x, runtime.z - landmark.z) < 18);
    setAmbientScene(runtime.mode === "spirit" && runtime.phase === "explore", nearRiver);
    drawMinimap(runtime);
    gl.setClearColor(WORLD.sky, 1);
  });

  return null;
}
