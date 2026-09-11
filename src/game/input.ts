const GAME_CODES = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyH",
  "KeyF",
  "KeyL",
  "KeyE",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ShiftLeft",
  "ShiftRight",
  "Space",
]);

export type Actions = {
  moveX: number;
  moveY: number;
  sprint: boolean;
  lookX: number;
  lookY: number;
  lookPadX: number;
  lookPadY: number;
  hintPressed: boolean;
  flashlightPressed: boolean;
  leavePressed: boolean;
};

function radialDeadzone(x: number, y: number, dz = 0.16): { x: number; y: number } {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = (m - dz) / (1 - dz) / m;
  return { x: x * scale, y: y * scale };
}

export class GameInput {
  keys = new Set<string>();
  injected = new Set<string>();
  lookX = 0;
  lookY = 0;
  stickX = 0;
  stickY = 0;
  hintPad = false;
  queuedHint = false;
  queuedFlashlight = false;
  queuedLeave = false;
  private prevHint = false;
  private prevFlashlight = false;
  private prevLeave = false;

  attach(): () => void {
    const onDown = (e: KeyboardEvent) => {
      this.keys.add(e.code);
      if (GAME_CODES.has(e.code)) e.preventDefault();
    };
    const onUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };
    const onMove = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;
      this.lookX += e.movementX;
      this.lookY += e.movementY;
    };
    const clear = () => this.keys.clear();
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.keys.clear();
    });
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("blur", clear);
    };
  }

  setInjected(codes: string[]) {
    this.injected = new Set(codes);
  }

  pulseHint() {
    this.queuedHint = true;
  }

  pulseFlashlight() {
    this.queuedFlashlight = true;
  }

  pulseLeave() {
    this.queuedLeave = true;
  }

  sample(): Actions {
    const down = (c: string) => this.keys.has(c) || this.injected.has(c);
    let mx = 0;
    let my = 0;
    if (down("KeyA") || down("ArrowLeft")) mx -= 1;
    if (down("KeyD") || down("ArrowRight")) mx += 1;
    if (down("KeyW") || down("ArrowUp")) my += 1;
    if (down("KeyS") || down("ArrowDown")) my -= 1;
    mx += this.stickX;
    my += this.stickY;

    let lookPadX = 0;
    let lookPadY = 0;
    const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : null;
    if (pads) {
      for (const pad of pads) {
        if (!pad) continue;
        const left = radialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
        mx += left.x;
        my -= left.y;
        const right = radialDeadzone(pad.axes[2] ?? 0, pad.axes[3] ?? 0, 0.18);
        lookPadX += right.x;
        lookPadY += right.y;
        if (pad.buttons[0]?.pressed || pad.buttons[2]?.pressed) this.hintPad = true;
        else this.hintPad = false;
      }
    }

    const mag = Math.hypot(mx, my);
    if (mag > 1) {
      mx /= mag;
      my /= mag;
    }

    const hintHeld = down("KeyH") || down("KeyF") || this.hintPad || this.queuedHint;
    this.queuedHint = false;
    const hintPressed = hintHeld && !this.prevHint;
    this.prevHint = hintHeld;
    const flashlightHeld = down("KeyL") || this.queuedFlashlight;
    this.queuedFlashlight = false;
    const flashlightPressed = flashlightHeld && !this.prevFlashlight;
    this.prevFlashlight = flashlightHeld;
    const leaveHeld = down("KeyE") || this.queuedLeave;
    this.queuedLeave = false;
    const leavePressed = leaveHeld && !this.prevLeave;
    this.prevLeave = leaveHeld;

    const lookX = this.lookX;
    const lookY = this.lookY;
    this.lookX = 0;
    this.lookY = 0;

    return {
      moveX: mx,
      moveY: my,
      sprint: down("ShiftLeft") || down("ShiftRight"),
      lookX,
      lookY,
      lookPadX,
      lookPadY,
      hintPressed,
      flashlightPressed,
      leavePressed,
    };
  }
}
