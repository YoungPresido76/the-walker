# Architecture

`src/main.tsx` mounts the React application. `src/game/TheWalker.tsx` owns run selection, maze generation, runtime creation, pointer-lock lifecycle, and overlay composition.

`src/game/Player.tsx` is the frame-driven gameplay controller: movement, collision, collectibles, exit logic, peek activation/counting, flashlight toggling, and the underground scare trigger. `src/game/World.tsx` is the Three.js scene renderer, including the expanded outdoor floor, dark horizon, procedural hedge instances, generated underground textures, cave ceiling, camera-attached flashlight, rune mark, and scare silhouette.

`src/game/maze.ts` generates deterministic solvable mazes and exposes the new `underground` mode plus a seeded `scareWorld` location. `src/game/runtime.ts` contains mutable framework-independent run state. `src/game/store.ts` contains reactive HUD state. `src/game/input.ts` normalizes keyboard, gamepad, touch joystick, queued peek, and queued flashlight actions.

`src/game/overlays.tsx` renders title/mode selection, HUD, minimap, touch controls, and scare feedback. `src/game/audio.ts` contains procedural ambient, movement, peek, victory, and scare sounds. The project remains a static Vite + React Three Fiber site and keeps its GitHub Pages base path `/the-walker/`.
