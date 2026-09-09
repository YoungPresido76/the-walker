import { i as __toESM } from "../_runtime.mjs";
import { c as Object3D, d as require_jsx_runtime, f as require_react, l as RepeatWrapping, n as useFrame, o as CanvasTexture, r as useThree, s as Color, t as Canvas, u as SRGBColorSpace } from "../_libs/@react-three/fiber+[...].mjs";
import { i as Compass, n as RotateCcw, r as Flower2 } from "../_libs/lucide-react.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/MazeGame-qWxtuGpZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ctx = null;
var master = null;
var sfx = null;
var noise = null;
var lastFoot = 0;
function ac() {
	if (typeof window === "undefined") return null;
	if (!ctx) {
		ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
		master = ctx.createGain();
		sfx = ctx.createGain();
		master.gain.value = .7;
		sfx.gain.value = .85;
		sfx.connect(master);
		master.connect(ctx.destination);
		const n = ctx.createBuffer(1, ctx.sampleRate * .35, ctx.sampleRate);
		const d = n.getChannelData(0);
		for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
		noise = n;
	}
	return ctx;
}
function unlockAudio() {
	const c = ac();
	if (!c) return;
	if (c.state === "suspended") c.resume();
}
function resumeAudio() {
	if (ctx && ctx.state === "suspended") ctx.resume();
}
function envGain(c, t, a, d, peak = 1) {
	const g = c.createGain();
	g.gain.setValueAtTime(1e-4, t);
	g.gain.exponentialRampToValueAtTime(peak, t + a);
	g.gain.exponentialRampToValueAtTime(1e-4, t + a + d);
	g.connect(sfx);
	return g;
}
function footstep(strength = 1) {
	const c = ac();
	if (!c || !noise || !sfx) return;
	const t = c.currentTime;
	if (t - lastFoot < .22) return;
	lastFoot = t;
	const src = c.createBufferSource();
	src.buffer = noise;
	src.playbackRate.value = .7 + Math.random() * .35;
	const bp = c.createBiquadFilter();
	bp.type = "bandpass";
	bp.frequency.value = 180 + Math.random() * 90;
	bp.Q.value = .7;
	const g = envGain(c, t, .008, .11, .22 * strength);
	src.connect(bp);
	bp.connect(g);
	src.start(t);
	src.stop(t + .14);
	src.onended = () => {
		src.disconnect();
		bp.disconnect();
		g.disconnect();
	};
}
function rustle() {
	const c = ac();
	if (!c || !noise || !sfx) return;
	const t = c.currentTime;
	const src = c.createBufferSource();
	src.buffer = noise;
	src.playbackRate.value = 1.4;
	const f = c.createBiquadFilter();
	f.type = "highpass";
	f.frequency.value = 900;
	const g = envGain(c, t, .004, .08, .12);
	src.connect(f);
	f.connect(g);
	src.start(t);
	src.stop(t + .1);
}
function chime() {
	const c = ac();
	if (!c || !sfx) return;
	const t = c.currentTime;
	for (const [freq, delay, dur] of [[
		784,
		0,
		.28
	], [
		1175,
		.05,
		.32
	]]) {
		const o = c.createOscillator();
		o.type = "sine";
		o.frequency.value = freq;
		const g = envGain(c, t + delay, .01, dur, .16);
		o.connect(g);
		o.start(t + delay);
		o.stop(t + delay + dur + .02);
		o.onended = () => {
			o.disconnect();
			g.disconnect();
		};
	}
}
function peekTone() {
	const c = ac();
	if (!c || !sfx) return;
	const t = c.currentTime;
	const o = c.createOscillator();
	o.type = "triangle";
	o.frequency.setValueAtTime(392, t);
	o.frequency.exponentialRampToValueAtTime(523, t + .18);
	const g = envGain(c, t, .02, .22, .1);
	o.connect(g);
	o.start(t);
	o.stop(t + .28);
}
function winFanfare() {
	const c = ac();
	if (!c || !sfx) return;
	const t = c.currentTime;
	[
		523,
		659,
		784,
		1046
	].forEach((freq, i) => {
		const o = c.createOscillator();
		o.type = "triangle";
		o.frequency.value = freq;
		const g = envGain(c, t + i * .12, .02, .45, .14);
		o.connect(g);
		o.start(t + i * .12);
		o.stop(t + i * .12 + .5);
	});
}
var GAME_CODES = /* @__PURE__ */ new Set([
	"KeyW",
	"KeyA",
	"KeyS",
	"KeyD",
	"KeyH",
	"KeyF",
	"ArrowUp",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"ShiftLeft",
	"ShiftRight",
	"Space"
]);
function radialDeadzone(x, y, dz = .16) {
	const m = Math.hypot(x, y);
	if (m < dz) return {
		x: 0,
		y: 0
	};
	const scale = (m - dz) / (1 - dz) / m;
	return {
		x: x * scale,
		y: y * scale
	};
}
var GameInput = class {
	keys = /* @__PURE__ */ new Set();
	injected = /* @__PURE__ */ new Set();
	lookX = 0;
	lookY = 0;
	stickX = 0;
	stickY = 0;
	hintPad = false;
	queuedHint = false;
	prevHint = false;
	attach() {
		const onDown = (e) => {
			this.keys.add(e.code);
			if (GAME_CODES.has(e.code)) e.preventDefault();
		};
		const onUp = (e) => {
			this.keys.delete(e.code);
		};
		const onMove = (e) => {
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
	setInjected(codes) {
		this.injected = new Set(codes);
	}
	pulseHint() {
		this.queuedHint = true;
	}
	sample() {
		const down = (c) => this.keys.has(c) || this.injected.has(c);
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
		if (pads) for (const pad of pads) {
			if (!pad) continue;
			const left = radialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
			mx += left.x;
			my -= left.y;
			const right = radialDeadzone(pad.axes[2] ?? 0, pad.axes[3] ?? 0, .18);
			lookPadX += right.x;
			lookPadY += right.y;
			if (pad.buttons[0]?.pressed || pad.buttons[2]?.pressed) this.hintPad = true;
			else this.hintPad = false;
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
			hintPressed
		};
	}
};
var WALL_THICK = .56;
var WALL_HEIGHT = 4.55;
var PLAYER_RADIUS = .34;
var EYE_HEIGHT = 1.62;
var WALK_SPEED = 3.25;
var SPRINT_SPEED = 4.35;
var FRICTION = 9.5;
var STEP = 1 / 60;
var HINT_DURATION = 2.2;
var MOUSE_SENS = .00215;
var TOUCH_LOOK_SENS = .0034;
var GAMEPAD_LOOK = 2.15;
var PITCH_LIMIT = Math.PI / 2 - .04;
var WORLD = {
	sky: "#8aa4b0",
	fog: "#7e98a4",
	fogNear: 7,
	fogFar: 26,
	grass: "#355834",
	grassDark: "#2a4629",
	gravel: "#c4b392",
	gravelDark: "#a8946e",
	hedge: "#2d5a38",
	hedgeDark: "#1c3c26",
	hedgeLight: "#4a7c4e",
	hedgeCap: "#244a30",
	wood: "#3d2c1c",
	orb: "#f3ead8",
	exitGlow: "#efe4cc",
	sun: "#f2e4c4"
};
function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function createRng(seed) {
	const next = mulberry32(seed >>> 0);
	return {
		next,
		range: (a, b) => a + next() * (b - a),
		int: (a, bExclusive) => a + Math.floor(next() * (bExclusive - a)),
		pick: (arr) => arr[Math.floor(next() * arr.length)],
		chance: (p) => next() < p,
		shuffle: (arr) => {
			for (let i = arr.length - 1; i > 0; i--) {
				const j = Math.floor(next() * (i + 1));
				const tmp = arr[i];
				arr[i] = arr[j];
				arr[j] = tmp;
			}
			return arr;
		}
	};
}
function mixColor(a, b, t) {
	const ar = a >> 16 & 255, ag = a >> 8 & 255, ab = a & 255;
	const br = b >> 16 & 255, bg = b >> 8 & 255, bb = b & 255;
	const r = Math.round(ar + (br - ar) * t);
	const g = Math.round(ag + (bg - ag) * t);
	const bl = Math.round(ab + (bb - ab) * t);
	return r << 16 | g << 8 | bl;
}
var DIRS = [
	"n",
	"e",
	"s",
	"w"
];
var OPP = {
	n: "s",
	e: "w",
	s: "n",
	w: "e"
};
var DELTA = {
	n: [0, -1],
	e: [1, 0],
	s: [0, 1],
	w: [-1, 0]
};
function cellCenter(x, y) {
	return {
		x: x * 4,
		z: y * 4
	};
}
function worldToCell(x, z) {
	return {
		x: Math.round(x / 4),
		y: Math.round(z / 4)
	};
}
function neighborsOpen(cell, maze) {
	const out = [];
	for (const dir of DIRS) {
		if (cell[dir]) continue;
		const [dx, dy] = DELTA[dir];
		const nx = cell.x + dx;
		const ny = cell.y + dy;
		if (nx < 0 || ny < 0 || nx >= maze.width || ny >= maze.height) continue;
		out.push({
			x: nx,
			y: ny,
			dir
		});
	}
	return out;
}
function bfsPath(maze, from, to) {
	const key = (x, y) => y * maze.width + x;
	const prev = /* @__PURE__ */ new Map();
	const q = [from];
	const seen = new Uint8Array(maze.width * maze.height);
	seen[key(from.x, from.y)] = 1;
	let found = false;
	for (let i = 0; i < q.length; i++) {
		const cur = q[i];
		if (cur.x === to.x && cur.y === to.y) {
			found = true;
			break;
		}
		const cell = maze.cells[cur.y]?.[cur.x];
		if (!cell) continue;
		for (const n of neighborsOpen(cell, maze)) {
			const k = key(n.x, n.y);
			if (seen[k]) continue;
			seen[k] = 1;
			prev.set(k, key(cur.x, cur.y));
			q.push({
				x: n.x,
				y: n.y
			});
		}
	}
	if (!found) return [from];
	const path = [];
	let k = key(to.x, to.y);
	const startK = key(from.x, from.y);
	while (k !== startK) {
		path.push({
			x: k % maze.width,
			y: Math.floor(k / maze.width)
		});
		const p = prev.get(k);
		if (p === void 0) break;
		k = p;
	}
	path.push(from);
	path.reverse();
	return path;
}
function hintWorldTarget(maze, cellX, cellY) {
	const path = bfsPath(maze, {
		x: Math.max(0, Math.min(maze.width - 1, cellX)),
		y: Math.max(0, Math.min(maze.height - 1, cellY))
	}, maze.exit);
	if (path.length <= 1) return maze.archWorld;
	const n = path[1];
	return cellCenter(n.x, n.y);
}
function wallCount(cell) {
	return Number(cell.n) + Number(cell.e) + Number(cell.s) + Number(cell.w);
}
function addAabb(list, x, z, sx, sz) {
	list.push({
		minX: x - sx / 2,
		maxX: x + sx / 2,
		minZ: z - sz / 2,
		maxZ: z + sz / 2
	});
}
function hedgeColor(rng) {
	const t = rng.next();
	if (t < .18) return mixColor(1850406, 2972216, rng.next());
	if (t < .72) return mixColor(2972216, 4025924, rng.next());
	return mixColor(4025924, 4881486, rng.next());
}
function generateMaze(seed, width = 11, height = 11) {
	const rng = createRng(seed);
	const cells = [];
	for (let y = 0; y < height; y++) {
		const row = [];
		for (let x = 0; x < width; x++) row.push({
			x,
			y,
			n: true,
			e: true,
			s: true,
			w: true
		});
		cells.push(row);
	}
	const start = {
		x: Math.floor(width / 2),
		y: height - 1
	};
	const exit = {
		x: Math.floor(width / 2),
		y: 0
	};
	const visited = new Uint8Array(width * height);
	const stack = [start];
	visited[start.y * width + start.x] = 1;
	while (stack.length) {
		const cur = stack[stack.length - 1];
		const options = [];
		for (const dir of DIRS) {
			const [dx, dy] = DELTA[dir];
			const nx = cur.x + dx;
			const ny = cur.y + dy;
			if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
			if (visited[ny * width + nx]) continue;
			options.push({
				dir,
				x: nx,
				y: ny
			});
		}
		if (!options.length) {
			stack.pop();
			continue;
		}
		const pick = options[Math.floor(rng.next() * options.length)];
		const here = cells[cur.y][cur.x];
		const there = cells[pick.y][pick.x];
		here[pick.dir] = false;
		there[OPP[pick.dir]] = false;
		visited[pick.y * width + pick.x] = 1;
		stack.push({
			x: pick.x,
			y: pick.y
		});
	}
	const extras = Math.floor(width * height * .11);
	let added = 0;
	let guard = 0;
	while (added < extras && guard++ < 5e3) {
		const x = rng.int(0, width);
		const y = rng.int(0, height);
		const dir = rng.pick(DIRS);
		const [dx, dy] = DELTA[dir];
		const nx = x + dx;
		const ny = y + dy;
		if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
		const here = cells[y][x];
		if (!here[dir]) continue;
		here[dir] = false;
		cells[ny][nx][OPP[dir]] = false;
		added++;
	}
	cells[exit.y][exit.x].n = false;
	const startWorld = cellCenter(start.x, start.y);
	const exitWorld = cellCenter(exit.x, exit.y);
	const archWorld = {
		x: exitWorld.x,
		z: exitWorld.z - 2
	};
	const exitTrigger = {
		minX: exitWorld.x - 1.2,
		maxX: exitWorld.x + 1.2,
		minZ: archWorld.z - 1.35,
		maxZ: archWorld.z + .4
	};
	const hWalls = Array.from({ length: height + 1 }, () => Array(width).fill(false));
	const vWalls = Array.from({ length: height }, () => Array(width + 1).fill(false));
	for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
		const c = cells[y][x];
		if (c.n) hWalls[y][x] = true;
		if (c.s) hWalls[y + 1][x] = true;
		if (c.w) vWalls[y][x] = true;
		if (c.e) vWalls[y][x + 1] = true;
	}
	const wallAabbs = [];
	const walls = [];
	const caps = [];
	const clumps = [];
	const overlap = WALL_THICK;
	const pushWall = (x, z, sx, sz) => {
		addAabb(wallAabbs, x, z, sx, sz);
		const color = hedgeColor(rng);
		walls.push({
			x,
			y: WALL_HEIGHT / 2,
			z,
			sx,
			sy: WALL_HEIGHT,
			sz,
			color
		});
		caps.push({
			x,
			y: WALL_HEIGHT - .14,
			z,
			sx: sx + .1,
			sy: .3,
			sz: sz + .1,
			color: mixColor(color, 1717026, .35)
		});
		const long = Math.max(sx, sz);
		const alongX = sx >= sz;
		const nClump = Math.max(1, Math.round(long / 1.7));
		for (let i = 0; i < nClump; i++) {
			const t = (i + .5) / nClump + rng.range(-.08, .08);
			const ox = alongX ? (t - .5) * sx : rng.range(-.08, .08);
			const oz = alongX ? rng.range(-.08, .08) : (t - .5) * sz;
			clumps.push({
				x: x + ox,
				y: WALL_HEIGHT + rng.range(.05, .28),
				z: z + oz,
				sx: rng.range(.45, .85),
				sy: rng.range(.28, .55),
				sz: rng.range(.45, .85),
				color: mixColor(color, 5933650, rng.range(.1, .55))
			});
		}
	};
	for (let y = 0; y < height + 1; y++) for (let x = 0; x < width; x++) {
		if (!hWalls[y][x]) continue;
		pushWall(x * 4, y * 4 - 2, 4 + overlap, WALL_THICK);
	}
	for (let y = 0; y < height; y++) for (let x = 0; x < width + 1; x++) {
		if (!vWalls[y][x]) continue;
		pushWall(x * 4 - 2, y * 4, WALL_THICK, 4 + overlap);
	}
	const paths = [];
	for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
		const c = cellCenter(x, y);
		const gravel = mixColor(12891026, 11048046, rng.next());
		paths.push({
			x: c.x,
			y: .02,
			z: c.z,
			sx: 3.92,
			sy: .045,
			sz: 3.92,
			color: gravel
		});
	}
	paths.push({
		x: exitWorld.x,
		y: .02,
		z: archWorld.z - .7,
		sx: 2.4,
		sy: .045,
		sz: 2.2,
		color: mixColor(12891026, 12100986, .4)
	});
	const maze = {
		width,
		height,
		seed,
		cells,
		start,
		exit,
		startWorld,
		exitWorld,
		archWorld,
		exitTrigger,
		collectibles: [],
		wallAabbs,
		walls,
		caps,
		clumps,
		paths,
		trees: []
	};
	const deadEnds = [];
	const others = [];
	for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
		if (x === start.x && y === start.y || x === exit.x && y === exit.y) continue;
		const c = cells[y][x];
		if (wallCount(c) >= 3) deadEnds.push({
			x,
			y
		});
		else others.push({
			x,
			y
		});
	}
	rng.shuffle(deadEnds);
	rng.shuffle(others);
	const want = 8;
	maze.collectibles = [...deadEnds, ...others].slice(0, want).map((p, id) => {
		const c = cellCenter(p.x, p.y);
		return {
			id,
			cellX: p.x,
			cellY: p.y,
			x: c.x + rng.range(-.45, .45),
			z: c.z + rng.range(-.45, .45)
		};
	});
	const cx = (width - 1) * 4 / 2;
	const cz = (height - 1) * 4 / 2;
	const radius = Math.max(width, height) * 4 * .62;
	for (let i = 0; i < 18; i++) {
		const a = i / 18 * Math.PI * 2 + rng.range(-.12, .12);
		const d = radius + rng.range(4, 11);
		maze.trees.push({
			x: cx + Math.cos(a) * d,
			z: cz + Math.sin(a) * d,
			scale: rng.range(1.1, 1.85),
			rot: rng.range(0, Math.PI * 2),
			hue: mixColor(2774578, 4880964, rng.next())
		});
	}
	if (bfsPath(maze, start, exit).length < 2) return generateMaze(seed + 17 >>> 0, width, height);
	return maze;
}
var useHud = create((set) => ({
	phase: "title",
	collected: 0,
	total: 8,
	wonTime: 0,
	seed: 0,
	locked: false,
	touch: false,
	reset: ({ seed, total, touch }) => set({
		phase: "title",
		collected: 0,
		total,
		wonTime: 0,
		seed,
		locked: false,
		touch
	}),
	setPhase: (phase) => set({ phase })
}));
function formatTime(seconds) {
	const s = Math.max(0, seconds);
	const m = Math.floor(s / 60);
	const rest = s - m * 60;
	const whole = Math.floor(rest);
	const frac = Math.floor((rest - whole) * 100);
	return `${m}:${String(whole).padStart(2, "0")}.${String(frac).padStart(2, "0")}`;
}
function requestLock(el) {
	if (!el) return;
	const node = el;
	try {
		const p = node.requestPointerLock({ unadjustedMovement: true });
		if (p && typeof p.catch === "function") p.catch(() => {
			node.requestPointerLock();
		});
	} catch {
		node.requestPointerLock();
	}
}
function OverlayCard({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overlay-backdrop absolute inset-0 z-30 flex items-end justify-center bg-bg/72 px-4 pb-10 pt-24 sm:items-center sm:p-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overlay-in w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-panel sm:p-8",
			children
		})
	});
}
function TitleOverlay({ onEnter }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OverlayCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs font-medium tracking-[0.18em] text-faint uppercase",
			children: "Garden maze"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display mt-3 text-4xl font-semibold leading-tight tracking-tight text-fg sm:text-5xl",
			children: "Hedgerow"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 max-w-sm text-sm leading-relaxed text-muted",
			children: "Tall hedges, narrow gravel, a gate somewhere ahead. Walk it. Don't trust the last turn."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: onEnter,
			className: "mt-7 flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-fg transition-transform duration-150 hover:brightness-105 active:scale-[0.98]",
			children: "Enter the maze"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-5 text-xs leading-relaxed text-faint",
			children: ["WASD to walk · mouse to look · H to peek", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-1 block sm:hidden",
				children: "On a phone: left stick moves, right side looks."
			})]
		})
	] });
}
function PauseOverlay({ onResume }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OverlayCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs font-medium tracking-[0.18em] text-faint uppercase",
			children: "Paused"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display mt-3 text-3xl font-semibold tracking-tight text-fg",
			children: "Still in the hedges"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-muted",
			children: "Click to look around again. The maze has not moved."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: onResume,
			className: "mt-7 flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-fg transition-transform duration-150 hover:brightness-105 active:scale-[0.98]",
			children: "Continue"
		})
	] });
}
function WinOverlay({ time, collected, total, onReplay }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OverlayCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs font-medium tracking-[0.18em] text-faint uppercase",
			children: "The gate"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display mt-3 text-3xl font-semibold tracking-tight text-fg",
			children: "You found the way out"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid grid-cols-2 gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-md bg-surface-2 px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-faint",
					children: "Time"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 font-mono text-xl tabular-nums text-fg",
					children: formatTime(time)
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-md bg-surface-2 px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-faint",
					children: "Orbs"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 font-mono text-xl tabular-nums text-fg",
					children: [
						collected,
						"/",
						total
					]
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: onReplay,
			className: "mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-fg transition-transform duration-150 hover:brightness-105 active:scale-[0.98]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
				className: "size-4",
				strokeWidth: 2
			}), "Walk a new maze"]
		})
	] });
}
function Joystick({ input }) {
	const base = (0, import_react.useRef)(null);
	const knob = (0, import_react.useRef)(null);
	const pid = (0, import_react.useRef)(null);
	const setFrom = (clientX, clientY) => {
		const el = base.current;
		const k = knob.current;
		if (!el || !k) return;
		const r = el.getBoundingClientRect();
		const cx = r.left + r.width / 2;
		const cy = r.top + r.height / 2;
		let dx = clientX - cx;
		let dy = clientY - cy;
		const max = r.width * .34;
		const mag = Math.hypot(dx, dy);
		if (mag > max) {
			dx = dx / mag * max;
			dy = dy / mag * max;
		}
		k.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
		input.stickX = dx / max;
		input.stickY = -dy / max;
	};
	const end = () => {
		pid.current = null;
		input.stickX = 0;
		input.stickY = 0;
		if (knob.current) knob.current.style.transform = "translate(-50%, -50%)";
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: base,
		className: "pointer-events-auto relative size-[108px] rounded-full border border-border bg-surface/70",
		onPointerDown: (e) => {
			pid.current = e.pointerId;
			e.currentTarget.setPointerCapture(e.pointerId);
			setFrom(e.clientX, e.clientY);
		},
		onPointerMove: (e) => {
			if (pid.current !== e.pointerId) return;
			setFrom(e.clientX, e.clientY);
		},
		onPointerUp: end,
		onPointerCancel: end,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: knob,
			className: "absolute top-1/2 left-1/2 size-11 rounded-full bg-primary/90",
			style: { transform: "translate(-50%, -50%)" }
		})
	});
}
function LookPad({ input }) {
	const last = (0, import_react.useRef)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-auto absolute inset-y-0 right-0 z-10 w-[58%]",
		onPointerDown: (e) => {
			last.current = {
				id: e.pointerId,
				x: e.clientX,
				y: e.clientY
			};
			e.currentTarget.setPointerCapture(e.pointerId);
		},
		onPointerMove: (e) => {
			const l = last.current;
			if (!l || l.id !== e.pointerId) return;
			input.lookX += (e.clientX - l.x) * (TOUCH_LOOK_SENS / .00215);
			input.lookY += (e.clientY - l.y) * (TOUCH_LOOK_SENS / .00215);
			l.x = e.clientX;
			l.y = e.clientY;
		},
		onPointerUp: () => {
			last.current = null;
		},
		onPointerCancel: () => {
			last.current = null;
		}
	});
}
function Hud({ runtime, onHint }) {
	const phase = useHud((s) => s.phase);
	const collected = useHud((s) => s.collected);
	const total = useHud((s) => s.total);
	const touch = useHud((s) => s.touch);
	const mapRef = (0, import_react.useRef)(null);
	const timeRef = (0, import_react.useRef)(null);
	const hintRef = (0, import_react.useRef)(null);
	const collectRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		runtime.mapEl = mapRef.current;
		runtime.timeEl = timeRef.current;
		runtime.hintEl = hintRef.current;
		runtime.collectEl = collectRef.current;
		return () => {
			runtime.mapEl = null;
			runtime.timeEl = null;
			runtime.hintEl = null;
			runtime.collectEl = null;
		};
	}, [runtime]);
	const playing = phase === "playing";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-none absolute inset-0 z-20 p-4 sm:p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "minimap-disk size-[120px] overflow-hidden rounded-full bg-bg/80 sm:size-[148px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
						ref: mapRef,
						className: "size-full"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-end gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-md border border-border bg-surface/80 px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] tracking-wide text-faint uppercase",
							children: "Time"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							ref: timeRef,
							className: "font-mono text-sm tabular-nums text-fg",
							children: "0:00.00"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5 rounded-md border border-border bg-surface/80 px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flower2, {
							className: "size-3.5 text-accent",
							strokeWidth: 1.75
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							ref: collectRef,
							className: "font-mono text-sm tabular-nums text-fg",
							children: [
								collected,
								"/",
								total
							]
						})]
					})]
				})]
			}), playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute bottom-5 left-1/2 hidden -translate-x-1/2 sm:block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-md bg-bg/50 px-3 py-1.5 text-[11px] text-faint",
					children: "H peek · Esc release look"
				})
			}) : null]
		}),
		playing && touch ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LookPad, { input: runtime.input }) : null,
		playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5",
			children: [touch ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Joystick, { input: runtime.input }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: onHint,
				className: "pointer-events-auto mb-1 flex h-12 min-w-12 items-center justify-center gap-2 rounded-md border border-border bg-surface/90 px-4 text-sm font-medium text-fg",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compass, {
					className: "size-4",
					strokeWidth: 1.75
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					ref: hintRef,
					children: "Peek"
				})]
			})]
		}) : null,
		playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute top-1/2 left-1/2 z-10 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg/70" }) : null
	] });
}
function collideCircle(x, z, walls, radius = PLAYER_RADIUS) {
	let hit = false;
	let nx = 0;
	let nz = 0;
	for (const w of walls) {
		const cx = Math.max(w.minX, Math.min(x, w.maxX));
		const cz = Math.max(w.minZ, Math.min(z, w.maxZ));
		let dx = x - cx;
		let dz = z - cz;
		const d2 = dx * dx + dz * dz;
		if (d2 >= radius * radius) continue;
		hit = true;
		if (d2 < 1e-10) {
			const left = x - w.minX;
			const right = w.maxX - x;
			const up = z - w.minZ;
			const down = w.maxZ - z;
			const m = Math.min(left, right, up, down);
			if (m === left) {
				x = w.minX - radius;
				nx -= 1;
			} else if (m === right) {
				x = w.maxX + radius;
				nx += 1;
			} else if (m === up) {
				z = w.minZ - radius;
				nz -= 1;
			} else {
				z = w.maxZ + radius;
				nz += 1;
			}
			continue;
		}
		const d = Math.sqrt(d2);
		const pen = radius - d;
		dx /= d;
		dz /= d;
		x += dx * pen;
		z += dz * pen;
		nx += dx;
		nz += dz;
	}
	const n2 = nx * nx + nz * nz;
	if (n2 > 1e-8) {
		const inv = 1 / Math.sqrt(n2);
		nx *= inv;
		nz *= inv;
	}
	return {
		x,
		z,
		hit,
		nx,
		nz
	};
}
function wallsNear(walls, x, z, pad) {
	const out = [];
	for (const w of walls) {
		if (x + pad < w.minX || x - pad > w.maxX || z + pad < w.minZ || z - pad > w.maxZ) continue;
		out.push(w);
	}
	return out;
}
var BG = "#121c16";
var PATH = "#c2b392";
var HEDGE = "#2a4a32";
var SELF = "#efe6d4";
var HINT = "#d7e0d4";
var ORB = "#f3ead8";
var GATE = "#e8dcc4";
function drawMinimap(rt) {
	const canvas = rt.mapEl;
	if (!canvas) return;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;
	const maze = rt.maze;
	const css = canvas.clientWidth || 148;
	const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
	const px = Math.round(css * dpr);
	if (canvas.width !== px || canvas.height !== px) {
		canvas.width = px;
		canvas.height = px;
	}
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	const w = css;
	const r = w / 2;
	ctx.clearRect(0, 0, w, w);
	ctx.save();
	ctx.beginPath();
	ctx.arc(r, r, r - 1, 0, Math.PI * 2);
	ctx.clip();
	ctx.fillStyle = BG;
	ctx.fillRect(0, 0, w, w);
	ctx.translate(r, r);
	ctx.rotate(-rt.yaw);
	const scale = 5.6;
	const worldToMap = (x, z) => ({
		x: (x - rt.x) * scale,
		y: (z - rt.z) * scale
	});
	const visR = r + 8;
	for (let y = 0; y < maze.height; y++) for (let x = 0; x < maze.width; x++) {
		if (!rt.visited[y * maze.width + x]) continue;
		const c = maze.cells[y][x];
		const p = worldToMap(x * 4, y * 4);
		if (Math.hypot(p.x, p.y) > visR + 4 * scale) continue;
		const half = 4 * scale / 2;
		ctx.fillStyle = PATH;
		ctx.globalAlpha = .88;
		ctx.fillRect(p.x - half + 1, p.y - half + 1, half * 2 - 2, half * 2 - 2);
		ctx.globalAlpha = 1;
		ctx.fillStyle = HEDGE;
		const t = 3.2;
		if (c.n) ctx.fillRect(p.x - half, p.y - half - t / 2, half * 2, t);
		if (c.s) ctx.fillRect(p.x - half, p.y + half - t / 2, half * 2, t);
		if (c.w) ctx.fillRect(p.x - half - t / 2, p.y - half, t, half * 2);
		if (c.e) ctx.fillRect(p.x + half - t / 2, p.y - half, t, half * 2);
		if (x === maze.exit.x && y === maze.exit.y) {
			const g = worldToMap(maze.archWorld.x, maze.archWorld.z);
			ctx.fillStyle = GATE;
			ctx.beginPath();
			ctx.arc(g.x, g.y, 4, 0, Math.PI * 2);
			ctx.fill();
		}
	}
	for (const orb of maze.collectibles) {
		if (rt.collected.has(orb.id)) continue;
		if (!rt.visited[orb.cellY * maze.width + orb.cellX]) continue;
		const p = worldToMap(orb.x, orb.z);
		ctx.fillStyle = ORB;
		ctx.beginPath();
		ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
		ctx.fill();
	}
	if (rt.hintT > 0 && rt.hintTarget) {
		const p = worldToMap(rt.hintTarget.x, rt.hintTarget.z);
		const ang = Math.atan2(p.y, p.x);
		const d = Math.min(32, Math.hypot(p.x, p.y));
		const ax = Math.cos(ang) * d;
		const ay = Math.sin(ang) * d;
		ctx.strokeStyle = HINT;
		ctx.fillStyle = HINT;
		ctx.globalAlpha = Math.min(1, rt.hintT * 1.4);
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(ax, ay);
		ctx.stroke();
		ctx.beginPath();
		ctx.translate(ax, ay);
		ctx.rotate(ang);
		ctx.moveTo(6, 0);
		ctx.lineTo(-4, 4.5);
		ctx.lineTo(-4, -4.5);
		ctx.closePath();
		ctx.fill();
		ctx.rotate(-ang);
		ctx.translate(-ax, -ay);
		ctx.globalAlpha = 1;
	}
	ctx.rotate(rt.yaw);
	ctx.fillStyle = SELF;
	ctx.beginPath();
	ctx.moveTo(0, -7);
	ctx.lineTo(5, 6);
	ctx.lineTo(0, 3.2);
	ctx.lineTo(-5, 6);
	ctx.closePath();
	ctx.fill();
	ctx.restore();
	ctx.strokeStyle = "rgba(239,230,212,0.22)";
	ctx.lineWidth = 1.5;
	ctx.beginPath();
	ctx.arc(r, r, r - 1.25, 0, Math.PI * 2);
	ctx.stroke();
}
function markVisited(rt, cellX, cellY) {
	const maze = rt.maze;
	if (cellX < 0 || cellY < 0 || cellX >= maze.width || cellY >= maze.height) return;
	rt.visited[cellY * maze.width + cellX] = 1;
}
function approach(cur, target, maxDelta) {
	const d = target - cur;
	if (Math.abs(d) <= maxDelta) return target;
	return cur + Math.sign(d) * maxDelta;
}
function inAabb(x, z, b) {
	return x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;
}
function Player({ runtime, maze }) {
	const camera = useThree((s) => s.camera);
	const gl = useThree((s) => s.gl);
	(0, import_react.useEffect)(() => {
		const cam = camera;
		cam.fov = 72;
		cam.near = .07;
		cam.far = 90;
		cam.updateProjectionMatrix();
		cam.rotation.order = "YXZ";
	}, [camera]);
	(0, import_react.useEffect)(() => {
		const probe = {
			getYaw: () => runtime.yaw,
			getSpeed: () => Math.hypot(runtime.vx, runtime.vz),
			getPosition: () => ({
				x: runtime.x,
				z: runtime.z
			}),
			setKeys: (codes) => {
				runtime.input.setInjected(codes);
				if (codes.length && (runtime.phase === "title" || runtime.phase === "paused")) {
					runtime.phase = "playing";
					useHud.getState().setPhase("playing");
				}
			}
		};
		window.__controlsTest = probe;
		return () => {
			if (window.__controlsTest === probe) delete window.__controlsTest;
		};
	}, [runtime]);
	useFrame((_, delta) => {
		const dtCap = Math.min(delta, .1);
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
			runtime.hintCd = 8;
			peekTone();
		}
		runtime.acc += dtCap;
		let steps = 0;
		while (runtime.acc >= .016666666666666666 && steps < 8) {
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
			if (wishMag > .04) {
				runtime.vx = approach(runtime.vx, wishX * maxSpeed, 14 * STEP);
				runtime.vz = approach(runtime.vz, wishZ * maxSpeed, 14 * STEP);
			} else {
				runtime.vx = approach(runtime.vx, 0, FRICTION * STEP);
				runtime.vz = approach(runtime.vz, 0, FRICTION * STEP);
			}
			const speed = Math.hypot(runtime.vx, runtime.vz);
			const nx = runtime.x + runtime.vx * STEP;
			const nz = runtime.z + runtime.vz * STEP;
			const nearby = wallsNear(maze.wallAabbs, nx, nz, PLAYER_RADIUS + speed * STEP + .55);
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
				if (speed > 1.35 && vn < -.8) rustle();
			}
			runtime.x = px;
			runtime.z = pz;
			const cell = worldToCell(runtime.x, runtime.z);
			markVisited(runtime, cell.x, cell.y);
			for (const c of maze.collectibles) {
				if (runtime.collected.has(c.id)) continue;
				if (Math.hypot(runtime.x - c.x, runtime.z - c.z) < .72) {
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
					collected: runtime.collected.size
				});
				if (document.pointerLockElement) document.exitPointerLock();
				winFanfare();
			}
		}
		const moveAmt = Math.min(1, Math.hypot(runtime.vx, runtime.vz) / WALK_SPEED);
		if (playing && moveAmt > .12) {
			runtime.bob += Math.hypot(runtime.vx, runtime.vz) * dtCap * 9.4;
			const s = Math.sin(runtime.bob);
			if (s > 0 && runtime.lastFootSign <= 0) footstep(.55 + moveAmt * .45);
			runtime.lastFootSign = s;
		}
		const bobY = Math.sin(runtime.bob) * .046 * moveAmt;
		const sway = Math.cos(runtime.bob * .5) * .016 * moveAmt;
		camera.position.set(runtime.x, EYE_HEIGHT + bobY, runtime.z);
		camera.rotation.set(runtime.pitch, runtime.yaw, sway);
		if (runtime.timeEl && playing) runtime.timeEl.textContent = formatTime(runtime.elapsed);
		if (runtime.collectEl) runtime.collectEl.textContent = `${runtime.collected.size}/${maze.collectibles.length}`;
		if (runtime.hintEl) {
			if (runtime.hintCd > 0 && runtime.hintT <= 0) runtime.hintEl.textContent = `${Math.ceil(runtime.hintCd)}s`;
			else runtime.hintEl.textContent = "Peek";
		}
		drawMinimap(runtime);
		gl.setClearColor(WORLD.sky, 1);
	});
	return null;
}
function createRuntime(maze, input) {
	const visited = new Uint8Array(maze.width * maze.height);
	visited[maze.start.y * maze.width + maze.start.x] = 1;
	let yaw = 0;
	const path = bfsPath(maze, maze.start, maze.exit);
	if (path[1]) {
		const n = cellCenter(path[1].x, path[1].y);
		yaw = Math.atan2(-(n.x - maze.startWorld.x), -(n.z - maze.startWorld.z));
	}
	return {
		maze,
		input,
		x: maze.startWorld.x,
		z: maze.startWorld.z + .15,
		yaw,
		pitch: .04,
		vx: 0,
		vz: 0,
		bob: 0,
		acc: 0,
		elapsed: 0,
		collected: /* @__PURE__ */ new Set(),
		visited,
		hintT: 0,
		hintCd: 0,
		hintTarget: null,
		phase: "title",
		locked: false,
		wonTime: 0,
		lastFootSign: 1,
		timeEl: null,
		hintEl: null,
		collectEl: null,
		mapEl: null
	};
}
function useGrassTexture() {
	return (0, import_react.useMemo)(() => {
		const c = document.createElement("canvas");
		c.width = 256;
		c.height = 256;
		const g = c.getContext("2d");
		g.fillStyle = WORLD.grass;
		g.fillRect(0, 0, 256, 256);
		for (let i = 0; i < 1400; i++) {
			g.fillStyle = i % 3 === 0 ? WORLD.grassDark : "#3d633a";
			g.fillRect(Math.random() * 256 | 0, Math.random() * 256 | 0, 2, 2);
		}
		const tex = new CanvasTexture(c);
		tex.wrapS = RepeatWrapping;
		tex.wrapT = RepeatWrapping;
		tex.repeat.set(48, 48);
		tex.colorSpace = SRGBColorSpace;
		tex.anisotropy = 4;
		return tex;
	}, []);
}
function ColoredInstances({ items, shape = "box", castShadow = false, receiveShadow = false, roughness = .9, flatShading = false }) {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useLayoutEffect)(() => {
		const mesh = ref.current;
		if (!mesh || items.length === 0) return;
		const dummy = new Object3D();
		const color = new Color();
		for (let i = 0; i < items.length; i++) {
			const it = items[i];
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("instancedMesh", {
		ref,
		args: [
			void 0,
			void 0,
			items.length
		],
		castShadow,
		receiveShadow,
		frustumCulled: false,
		children: [shape === "ico" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("icosahedronGeometry", { args: [1, 0] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
			1,
			1,
			1
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
			roughness,
			metalness: .03,
			flatShading
		})]
	});
}
function Trees({ maze }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("group", { children: maze.trees.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", {
		position: [
			t.x,
			0,
			t.z
		],
		rotation: [
			0,
			t.rot,
			0
		],
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			position: [
				0,
				.7 * t.scale,
				0
			],
			castShadow: true,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("cylinderGeometry", { args: [
				.16 * t.scale,
				.22 * t.scale,
				1.4 * t.scale,
				5
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: "#3d2c1c",
				roughness: .95
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			position: [
				0,
				2.15 * t.scale,
				0
			],
			castShadow: true,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("icosahedronGeometry", { args: [1.15 * t.scale, 0] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: t.hue,
				roughness: .86,
				flatShading: true
			})]
		})]
	}, i)) });
}
function Gate({ maze }) {
	const { x, z } = maze.archWorld;
	const post = .22;
	const h = 3.15;
	const span = 1.55;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", {
		position: [
			x,
			0,
			z
		],
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
				position: [
					-1.55,
					h / 2,
					0
				],
				castShadow: true,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
					post,
					h,
					post
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
					color: WORLD.wood,
					roughness: .92
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
				position: [
					span,
					h / 2,
					0
				],
				castShadow: true,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
					post,
					h,
					post
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
					color: WORLD.wood,
					roughness: .92
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
				position: [
					0,
					3.27,
					0
				],
				castShadow: true,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
					3.6,
					.28,
					.32
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
					color: "#2c1e14",
					roughness: .9
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
				position: [
					0,
					3.03,
					.02
				],
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
					span * 2 - .1,
					.08,
					.08
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
					color: WORLD.exitGlow,
					emissive: WORLD.exitGlow,
					emissiveIntensity: .7
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
				position: [
					0,
					2.55,
					.18
				],
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
					.13,
					8,
					8
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
					color: WORLD.exitGlow,
					emissive: WORLD.exitGlow,
					emissiveIntensity: 2.2
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pointLight", {
				position: [
					0,
					2.5,
					.3
				],
				color: WORLD.sun,
				intensity: 4.2,
				distance: 11,
				decay: 2
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
				position: [
					0,
					.01,
					-.9
				],
				rotation: [
					-Math.PI / 2,
					0,
					0
				],
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circleGeometry", { args: [1.35, 12] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshBasicMaterial", {
					color: WORLD.exitGlow,
					transparent: true,
					opacity: .14
				})]
			})
		]
	});
}
function Orbs({ maze, runtime }) {
	const group = (0, import_react.useRef)(null);
	useFrame(() => {
		const g = group.current;
		if (!g) return;
		const t = runtime.elapsed;
		for (let i = 0; i < g.children.length; i++) {
			const m = g.children[i];
			const c = maze.collectibles[i];
			if (!c) continue;
			const taken = runtime.collected.has(c.id);
			m.visible = !taken;
			if (taken) continue;
			m.position.y = .82 + Math.sin(t * 2.15 + i * 1.3) * .12;
			m.rotation.y = t * .9 + i;
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("group", {
		ref: group,
		children: maze.collectibles.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", {
			position: [
				c.x,
				.82,
				c.z
			],
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("icosahedronGeometry", { args: [.16, 0] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: WORLD.orb,
				emissive: WORLD.orb,
				emissiveIntensity: 1.8,
				roughness: .35,
				flatShading: true
			})] }), i < 4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pointLight", {
				color: WORLD.orb,
				intensity: .85,
				distance: 3.4,
				decay: 2
			}) : null]
		}, c.id))
	});
}
function HintArrow({ runtime }) {
	const ref = (0, import_react.useRef)(null);
	const mat = (0, import_react.useRef)(null);
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
		const dist = Math.min(2.35, Math.max(1.1, len * .42));
		g.position.set(runtime.x + dx / len * dist, 1.28, runtime.z + dz / len * dist);
		g.lookAt(g.position.x + dx, g.position.y, g.position.z + dz);
		m.opacity = Math.min(.92, runtime.hintT * .7);
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("group", {
		ref,
		visible: false,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			rotation: [
				Math.PI / 2,
				0,
				0
			],
			position: [
				0,
				0,
				.28
			],
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("coneGeometry", { args: [
				.16,
				.42,
				5
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshBasicMaterial", {
				ref: mat,
				color: WORLD.orb,
				transparent: true,
				opacity: .85,
				depthWrite: false
			})]
		})
	});
}
function World({ maze, runtime }) {
	const grass = useGrassTexture();
	const cheap = typeof window !== "undefined" && window.innerWidth < 520;
	const cx = (maze.width - 1) * 4 / 2;
	const cz = (maze.height - 1) * 4 / 2;
	(0, import_react.useLayoutEffect)(() => {
		return () => {
			grass.dispose();
		};
	}, [grass]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("color", {
			attach: "background",
			args: [WORLD.sky]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("fog", {
			attach: "fog",
			args: [
				WORLD.fog,
				WORLD.fogNear,
				WORLD.fogFar
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("hemisphereLight", { args: [
			"#e8efe6",
			"#2c4a32",
			.72
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ambientLight", {
			intensity: .28,
			color: "#f0e6d2"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("directionalLight", {
			position: [
				18,
				26,
				10
			],
			intensity: 1.45,
			color: WORLD.sun,
			castShadow: !cheap,
			"shadow-mapSize": [1024, 1024],
			"shadow-camera-near": 2,
			"shadow-camera-far": 80,
			"shadow-camera-left": -34,
			"shadow-camera-right": 34,
			"shadow-camera-top": 34,
			"shadow-camera-bottom": -34,
			"shadow-bias": -5e-4
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			rotation: [
				-Math.PI / 2,
				0,
				0
			],
			position: [
				cx,
				0,
				cz
			],
			receiveShadow: true,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("planeGeometry", { args: [160, 160] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				map: grass,
				roughness: .95,
				metalness: 0
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColoredInstances, {
			items: maze.paths,
			receiveShadow: true,
			roughness: .96
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColoredInstances, {
			items: maze.walls,
			castShadow: !cheap,
			receiveShadow: true,
			roughness: .88
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColoredInstances, {
			items: maze.caps,
			castShadow: !cheap,
			roughness: .82
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColoredInstances, {
			items: maze.clumps,
			shape: "ico",
			roughness: .84,
			flatShading: true
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trees, { maze }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gate, { maze }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Orbs, {
			maze,
			runtime
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HintArrow, { runtime }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			position: [
				cx,
				WALL_HEIGHT + 6,
				cz
			],
			rotation: [
				Math.PI,
				0,
				0
			],
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
				70,
				16,
				8,
				0,
				Math.PI * 2,
				0,
				Math.PI / 2
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshBasicMaterial", {
				color: WORLD.sky,
				side: 1,
				fog: false
			})]
		})
	] });
}
function detectTouch() {
	if (typeof window === "undefined") return false;
	return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
}
function newSeed() {
	return Math.random() * 4294967295 >>> 0;
}
function MazeGame() {
	const [seed, setSeed] = (0, import_react.useState)(newSeed);
	const [autostart, setAutostart] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HedgerowRun, {
		seed,
		autostart,
		onReplay: () => {
			setAutostart(true);
			setSeed(newSeed());
		}
	}, seed);
}
function HedgerowRun({ seed, autostart, onReplay }) {
	const maze = (0, import_react.useMemo)(() => generateMaze(seed), [seed]);
	const input = (0, import_react.useMemo)(() => new GameInput(), []);
	const runtime = (0, import_react.useMemo)(() => createRuntime(maze, input), [maze, input]);
	const canvasEl = (0, import_react.useRef)(null);
	const phase = useHud((s) => s.phase);
	const collected = useHud((s) => s.collected);
	const total = useHud((s) => s.total);
	const wonTime = useHud((s) => s.wonTime);
	const touch = useHud((s) => s.touch);
	const locked = useHud((s) => s.locked);
	const startPlay = (0, import_react.useCallback)(() => {
		unlockAudio();
		runtime.phase = "playing";
		useHud.getState().setPhase("playing");
		if (!detectTouch()) requestLock(canvasEl.current);
	}, [runtime]);
	(0, import_react.useEffect)(() => {
		const detach = input.attach();
		useHud.getState().reset({
			seed: maze.seed,
			total: maze.collectibles.length,
			touch: detectTouch()
		});
		runtime.phase = "title";
		if (autostart) {
			runtime.phase = "playing";
			useHud.getState().setPhase("playing");
		}
		return detach;
	}, [
		input,
		maze,
		runtime,
		autostart
	]);
	(0, import_react.useEffect)(() => {
		if (autostart && !detectTouch()) {
			const t = window.setTimeout(() => requestLock(canvasEl.current), 80);
			return () => window.clearTimeout(t);
		}
	}, [autostart]);
	(0, import_react.useEffect)(() => {
		const onChange = () => {
			const isLocked = document.pointerLockElement != null;
			const wasLocked = runtime.locked;
			runtime.locked = isLocked;
			useHud.setState({ locked: isLocked });
			if (wasLocked && !isLocked && runtime.phase === "playing" && !useHud.getState().touch) {
				runtime.phase = "paused";
				useHud.getState().setPhase("paused");
			}
		};
		const onVis = () => resumeAudio();
		document.addEventListener("pointerlockchange", onChange);
		document.addEventListener("visibilitychange", onVis);
		return () => {
			document.removeEventListener("pointerlockchange", onChange);
			document.removeEventListener("visibilitychange", onVis);
		};
	}, [runtime]);
	const onHint = (0, import_react.useCallback)(() => {
		runtime.input.pulseHint();
	}, [runtime]);
	const cheap = typeof window !== "undefined" && window.innerWidth < 520;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "game-root relative h-dvh w-full overflow-hidden bg-bg",
		onClick: () => {
			if (runtime.phase === "playing" && !document.pointerLockElement && !detectTouch()) requestLock(canvasEl.current);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Canvas, {
				className: "absolute inset-0",
				shadows: !cheap,
				dpr: [1, 1.5],
				gl: {
					antialias: true,
					alpha: false,
					powerPreference: "high-performance"
				},
				camera: {
					fov: 72,
					near: .07,
					far: 90,
					position: [
						0,
						1.62,
						0
					]
				},
				onCreated: ({ gl }) => {
					canvasEl.current = gl.domElement;
					gl.domElement.style.touchAction = "none";
					gl.toneMapping = 4;
					gl.toneMappingExposure = 1.05;
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(World, {
					maze,
					runtime
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Player, {
					runtime,
					maze
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "vignette" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hud, {
				runtime,
				onHint
			}),
			phase === "title" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TitleOverlay, { onEnter: startPlay }) : null,
			phase === "paused" && !locked && !touch ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PauseOverlay, { onResume: startPlay }) : null,
			phase === "won" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WinOverlay, {
				time: wonTime,
				collected,
				total,
				onReplay
			}) : null
		]
	});
}
//#endregion
export { MazeGame };
