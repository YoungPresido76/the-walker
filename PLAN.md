# The Walker: Endless Horror Maze Upgrade

## Implemented scope

The game now has a visible peek counter, a dark expanded horizon instead of a bright finite-looking boundary, an optional underground mode, a battery-limited first-person flashlight, a deterministic rune-marked scare trigger, a corridor stalker with peek/pursuit behavior, and generated original cave/rune assets. Existing garden and spirit modes remain available.

## Verification criteria

- Valid peek activation increments the HUD counter once and respects the existing cooldown.
- The ground and sky no longer expose a white/bright rectangular world boundary during ordinary exploration.
- Underground mode is selectable from the title card and presents a darker fog, cave-textured floor/walls, ceiling, and flashlight cone.
- The flashlight can be toggled with `L` or the touch Light button.
- Approaching the seeded scare location triggers a one-shot silhouette, red eyes, camera shake, audio sting, and `Don't look back` feedback.
- The underground flashlight visibly drains while on; it shuts off at 0% and can be toggled with `L` or the touch Light button.
- The stalker appears behind the player after the scare warning. Leaving the flashlight on during its peek causes a light-based game over; switching it off starts a chase, and sprinting can outrun it.
- Getting caught during pursuit produces a game-over overlay and a replay path without reloading the page.
- The existing maze exit, collectibles, minimap, pointer lock, mobile joystick, and replay behavior remain functional.

## Risk slices completed

1. Runtime/HUD state: peek count, flashlight battery, stalker state, and game-over state are framework-independent fields.
2. Renderer: dark horizon, expanded floor, cave ceiling, generated textures, flashlight, and scare prop.
3. Interaction: keyboard and touch flashlight toggle; existing peek controls retained.
4. Audio: restrained procedural scare sting, whisper, and caught cues that remain optional under browser autoplay rules.

## Follow-up ideas

The next low-risk additions are story notes, more underground landmarks, a battery pickup/resource loop, and a second scare variant after playtesting the first scare's timing.
