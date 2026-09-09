# The Walker

A first-person low-poly garden hedge maze built with React, React Three Fiber, and Three.js.

## Play

- **WASD** — walk
- **Mouse** — look around after entering the maze
- **H** — short directional peek hint
- **Shift** — sprint
- **R** — restart with a fresh maze

Every run procedurally generates a new solvable maze. Explore the narrow hedge corridors, collect glowing flowers, and find the exit gate.

The game includes procedural gravel footsteps, hedge rustles, collectible chimes, hint and victory cues, plus a quiet looping ambient garden score. Audio starts after pressing **Enter the maze**, following browser autoplay rules.

## Development

```bash
npm install
npm run dev
npm run build
npm run preview
```

The production build is configured for the project GitHub Pages path `/the-walker/` and is deployed automatically by `.github/workflows/deploy-pages.yml`.
