import { i as __toESM } from "../_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "../_libs/@react-three/fiber+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BrFQewEH.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const [Game, setGame] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let live = true;
		import("./MazeGame-qWxtuGpZ.mjs").then((m) => {
			if (live) setGame(() => m.MazeGame);
		});
		return () => {
			live = false;
		};
	}, []);
	if (!Game) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "flex h-dvh items-end bg-bg px-6 pb-16 sm:items-center sm:justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-[0.18em] text-faint uppercase",
					children: "Garden maze"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display mt-3 text-4xl font-semibold tracking-tight text-fg",
					children: "Hedgerow"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted",
					children: "Preparing the hedges…"
				})
			]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Game, {});
}
//#endregion
export { Home as component };
