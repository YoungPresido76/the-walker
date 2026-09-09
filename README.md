# The Walker

A first-person low-poly garden hedge maze built with React, React Three Fiber, and Three.js.

## Play

- **WASD** — walk
- **Mouse** — look around after entering the maze
- **H** — short directional peek hint; the HUD counts every successful peek
- **L** — toggle the underground touch light
- **Shift** — sprint
- **R** — restart with a fresh maze

Every run procedurally generates a new solvable maze. Explore the narrow hedge corridors, collect glowing flowers, and find the exit gate. The title screen also includes **Hollow Below**, a darker underground variant with damp cave textures, limited visibility, a rune-marked one-shot scare, and touch-friendly Light/Peek controls. The outdoor horizon uses a large dark world and fog instead of a bright boxed-in boundary.

The game includes procedural gravel footsteps, hedge rustles, collectible chimes, hint and victory cues, a restrained scare sting, plus a quiet looping ambient garden score. Audio starts after pressing **Enter the maze**, following browser autoplay rules. The new art direction is built from a small generated cave texture/rune asset set plus procedural Three.js geometry; see `ASSETS.md` for the manifest.

## Development

```bash
npm install
npm run dev
npm run build
npm run preview
```

The production build is configured for the project GitHub Pages path `/the-walker/` and is deployed automatically by `.github/workflows/deploy-pages.yml`.
