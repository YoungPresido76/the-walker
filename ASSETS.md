# Asset manifest

| Asset | Role | Source and license note |
|---|---|---|
| `public/assets/horror-maze-visual-target.png` | Visual target for the dark cave/flashlight art direction | Generated for this project with Manus built-in image generation; original project asset, no third-party license dependency |
| `public/assets/underground-wall.png` | Tiled cave/stone texture for underground floor, ceiling, and maze walls | Generated for this project with Manus built-in image generation; original project asset |
| `public/assets/rune-mark.png` | Rune-mark prop displayed near the scare landmark | Generated for this project with Manus built-in image generation; original project asset |

The implementation intentionally uses a small generated asset set plus procedural Three.js geometry. No unverified online asset was imported. This keeps the game coherent, avoids attribution omissions, and keeps runtime loading predictable.
