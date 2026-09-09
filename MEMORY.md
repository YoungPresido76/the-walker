# Development memory

- The repository is an existing React Three Fiber + Three.js game rather than a Babylon/WebDev scaffold, so the enhancement preserves the existing renderer and GitHub Pages deployment path.
- The old scene already used a large floor and sky dome, but the horizon was bright and finite-looking. The update expands the floor to 500 units, uses a dark fog/background, and makes the sky dome much larger for a less boxed-in world.
- Underground mode is a selectable third mode. It reuses the generated maze topology, darkens the scene, adds a ceiling and cave texture, and retains the existing exit/collectible loop.
- The scare location is seeded at the middle of the maze so it is deterministic for screenshots and playtest instructions. It is one-shot per run.
- Browser audio remains subject to autoplay restrictions; all new scare sound is routed through the existing unlocked AudioContext and the visual scare works without sound.
- The Hollow stalker begins in a deterministic peeking state behind the player, pauses long enough for the warning text, then either punishes an active flashlight or transitions to pursuit when the player kills the light. The chase speed remains below sprint speed so escape is possible; collision with the stalker switches to a replayable game-over phase.
- Flashlight timing uses a 95% main charge over 180 seconds and a slower 5% reserve over 60 seconds, for approximately 4 minutes total. At or below 3%, the renderer flickers independently; underground collectibles add 5% with a hard 100% cap.
- Underground reduces branch openings to preserve long walls, closed turns, and dead ends. A seeded shuffle selects one-shot horror cells across dead ends, turns, and collectibles; entering one shows a different warning and sting. Underground collectibles now restore 5% with a hard 100% cap.
