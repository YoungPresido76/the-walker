import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { WALL_HEIGHT, WORLD } from "./constants";
import type { Instance, Maze } from "./maze";
import type { Runtime } from "./runtime";

function useGrassTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = WORLD.grass;
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = i % 3 === 0 ? WORLD.grassDark : "#3d633a";
      g.fillRect((Math.random() * 256) | 0, (Math.random() * 256) | 0, 2, 2);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(48, 48);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, []);
}

function ColoredInstances({
  items,
  shape = "box",
  castShadow = false,
  receiveShadow = false,
  roughness = 0.9,
  flatShading = false,
}: {
  items: Instance[];
  shape?: "box" | "ico";
  castShadow?: boolean;
  receiveShadow?: boolean;
  roughness?: number;
  flatShading?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh || items.length === 0) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < items.length; i++) {
      const it = items[i]!;
      dummy.position.set(it.x, it.y, it.z);
      dummy.scale.set(it.sx, it.sy, it.sz);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.setHex(it.color));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);

  if (items.length === 0) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, items.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled={false}
    >
      {shape === "ico" ? <icosahedronGeometry args={[1, 0]} /> : <boxGeometry args={[1, 1, 1]} />}
      <meshStandardMaterial roughness={roughness} metalness={0.03} flatShading={flatShading} />
    </instancedMesh>
  );
}

function Trees({ maze }: { maze: Maze }) {
  return (
    <group>
      {maze.trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} rotation={[0, t.rot, 0]}>
          <mesh position={[0, 0.7 * t.scale, 0]} castShadow>
            <cylinderGeometry args={[0.16 * t.scale, 0.22 * t.scale, 1.4 * t.scale, 5]} />
            <meshStandardMaterial color="#3d2c1c" roughness={0.95} />
          </mesh>
          <mesh position={[0, 2.15 * t.scale, 0]} castShadow>
            <icosahedronGeometry args={[1.15 * t.scale, 0]} />
            <meshStandardMaterial color={t.hue} roughness={0.86} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function NatureLandmarks({ maze }: { maze: Maze }) {
  return <group>{maze.landmarks.map((landmark, i) => {
    const s = landmark.scale;
    if (landmark.kind === "river") return <mesh key={i} position={[landmark.x, 0.035, landmark.z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3.2 * s, 30 * s]} /><meshStandardMaterial color="#527d88" roughness={0.25} /></mesh>;
    if (landmark.kind === "mountain") return <mesh key={i} position={[landmark.x, 3.5 * s, landmark.z]}><coneGeometry args={[8 * s, 7 * s, 6]} /><meshStandardMaterial color="#53656a" roughness={1} flatShading /></mesh>;
    if (landmark.kind === "grove") return <group key={i} position={[landmark.x, 0, landmark.z]}>{[0, 1, 2, 3].map((n) => <mesh key={n} position={[(n - 1.5) * 1.4 * s, 1.5 * s, (n % 2) * 1.2 * s]}><icosahedronGeometry args={[1.2 * s, 0]} /><meshStandardMaterial color="#365d3d" flatShading /></mesh>)}</group>;
    const shed = landmark.kind === "shed";
    return <group key={i} position={[landmark.x, 0, landmark.z]} scale={s}><mesh position={[0, 1, 0]} castShadow><boxGeometry args={[shed ? 2.2 : 3.4, 2, shed ? 2 : 2.8]} /><meshStandardMaterial color={shed ? "#76583b" : "#9b704e"} roughness={0.9} /></mesh><mesh position={[0, 2.35, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[2.4, 1.1, 4]} /><meshStandardMaterial color="#3f3029" roughness={0.95} /></mesh></group>;
  })}</group>;
}

function Weather() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => { const a = new Float32Array(180 * 3); for (let i = 0; i < 180; i++) { a[i * 3] = (Math.random() - 0.5) * 90; a[i * 3 + 1] = Math.random() * 14 + 1; a[i * 3 + 2] = (Math.random() - 0.5) * 90; } return a; }, []);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.008; });
  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} array={positions} itemSize={3} /></bufferGeometry><pointsMaterial color="#d8e5c8" size={0.055} transparent opacity={0.5} depthWrite={false} /></points>;
}

function Gate({ maze, runtime }: { maze: Maze; runtime: Runtime }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    group.current.visible = runtime.exitPulseT > 0;
    group.current.scale.setScalar(1 + Math.sin(runtime.elapsed * 10) * 0.025);
  });
  const { x, z } = maze.archWorld;
  const post = 0.22;
  const h = 3.15;
  const span = 1.55;
  return (
    <group ref={group} position={[x, 0, z]} visible={false}>
      <mesh position={[-span, h / 2, 0]} castShadow>
        <boxGeometry args={[post, h, post]} />
        <meshStandardMaterial color={WORLD.wood} roughness={0.92} />
      </mesh>
      <mesh position={[span, h / 2, 0]} castShadow>
        <boxGeometry args={[post, h, post]} />
        <meshStandardMaterial color={WORLD.wood} roughness={0.92} />
      </mesh>
      <mesh position={[0, h + 0.12, 0]} castShadow>
        <boxGeometry args={[span * 2 + 0.5, 0.28, 0.32]} />
        <meshStandardMaterial color="#2c1e14" roughness={0.9} />
      </mesh>
      <mesh position={[0, h - 0.12, 0.02]}>
        <boxGeometry args={[span * 2 - 0.1, 0.08, 0.08]} />
        <meshStandardMaterial color={WORLD.exitGlow} emissive={WORLD.exitGlow} emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0, 2.55, 0.18]}>
        <sphereGeometry args={[0.13, 8, 8]} />
        <meshStandardMaterial color={WORLD.exitGlow} emissive={WORLD.exitGlow} emissiveIntensity={2.2} />
      </mesh>
      <pointLight position={[0, 2.5, 0.3]} color={WORLD.sun} intensity={4.2} distance={11} decay={2} />
      <mesh position={[0, 0.01, -0.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.35, 12]} />
        <meshBasicMaterial color={WORLD.exitGlow} transparent opacity={0.14} />
      </mesh>
    </group>
  );
}

function Orbs({ maze, runtime }: { maze: Maze; runtime: Runtime }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const t = runtime.elapsed;
    for (let i = 0; i < g.children.length; i++) {
      const m = g.children[i] as THREE.Group;
      const c = maze.collectibles[i];
      if (!c) continue;
      const taken = runtime.collected.has(c.id);
      m.visible = !taken;
      if (taken) continue;
      m.position.y = 0.82 + Math.sin(t * 2.15 + i * 1.3) * 0.12;
      m.rotation.y = t * 0.9 + i;
    }
  });
  return (
    <group ref={group}>
      {maze.collectibles.map((c, i) => (
        <group key={c.id} position={[c.x, 0.82, c.z]}>
          <mesh>
            <icosahedronGeometry args={[0.16, 0]} />
            <meshStandardMaterial
              color={WORLD.orb}
              emissive={WORLD.orb}
              emissiveIntensity={1.8}
              roughness={0.35}
              flatShading
            />
          </mesh>
          {i < 4 ? (
            <pointLight color={WORLD.orb} intensity={0.85} distance={3.4} decay={2} />
          ) : null}
        </group>
      ))}
    </group>
  );
}

function HintArrow({ runtime }: { runtime: Runtime }) {
  const ref = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    const g = ref.current;
    const m = mat.current;
    if (!g || !m) return;
    if (runtime.hintT <= 0 || !runtime.hintTarget) {
      g.visible = false;
      return;
    }
    g.visible = true;
    const dx = runtime.hintTarget.x - runtime.x;
    const dz = runtime.hintTarget.z - runtime.z;
    const len = Math.hypot(dx, dz) || 1;
    const dist = Math.min(2.35, Math.max(1.1, len * 0.42));
    g.position.set(runtime.x + (dx / len) * dist, 1.28, runtime.z + (dz / len) * dist);
    g.lookAt(g.position.x + dx, g.position.y, g.position.z + dz);
    m.opacity = Math.min(0.92, runtime.hintT * 0.7);
  });
  return (
    <group ref={ref} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.28]}>
        <coneGeometry args={[0.16, 0.42, 5]} />
        <meshBasicMaterial ref={mat} color={WORLD.orb} transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function World({ maze, runtime }: { maze: Maze; runtime: Runtime }) {
  const grass = useGrassTexture();
  const cheap = typeof window !== "undefined" && window.innerWidth < 520;
  const cx = ((maze.width - 1) * 4) / 2;
  const cz = ((maze.height - 1) * 4) / 2;

  useLayoutEffect(() => {
    return () => {
      grass.dispose();
    };
  }, [grass]);

  return (
    <>
      <color attach="background" args={["#536b78"]} />
      <fog attach="fog" args={["#617984", 5.5, 31]} />
      <hemisphereLight args={["#a8c0cc", "#1d3024", 0.62]} />
      <ambientLight intensity={0.2} color="#b8cbe0" />
      <directionalLight
        position={[18, 26, 10]}
        intensity={0.82}
        color="#c5d5e5"
        castShadow={!cheap}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={2}
        shadow-camera-far={80}
        shadow-camera-left={-34}
        shadow-camera-right={34}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
        shadow-bias={-0.0005}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0, cz]} receiveShadow>
        <planeGeometry args={[160, 160]} />
      <meshStandardMaterial map={grass} roughness={0.98} metalness={0} flatShading />
      </mesh>

      <ColoredInstances items={maze.paths} receiveShadow roughness={0.96} />
      <ColoredInstances items={maze.walls} castShadow={!cheap} receiveShadow roughness={0.9} flatShading />
      <ColoredInstances items={maze.caps} castShadow={!cheap} roughness={0.84} flatShading />
      <ColoredInstances items={maze.clumps} shape="ico" roughness={0.84} flatShading />

      <Trees maze={maze} />
      <NatureLandmarks maze={maze} />
      <Weather />
      <Gate maze={maze} runtime={runtime} />
      <Orbs maze={maze} runtime={runtime} />
      <HintArrow runtime={runtime} />

      <mesh position={[cx, WALL_HEIGHT + 6, cz]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[70, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color={WORLD.sky} side={THREE.BackSide} fog={false} />
      </mesh>
    </>
  );
}
