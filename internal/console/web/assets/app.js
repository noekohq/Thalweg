//#region \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), s = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, c = (n, r, o) => (o = n == null ? {} : e(i(n)), s(r || !n || !n.__esModule || !a.call(n, "default") ? t(o, "default", {
	value: n,
	enumerable: !0
}) : o, n));
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/keys/keys.mjs
function l(e) {
	return Object.keys(e);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/deep-merge/deep-merge.mjs
function u(e) {
	return e && typeof e == "object" && !Array.isArray(e);
}
function d(e, t) {
	let n = { ...e }, r = t;
	return u(e) && u(t) && Object.keys(t).forEach((t) => {
		u(r[t]) && t in e ? n[t] = d(n[t], r[t]) : n[t] = r[t];
	}), n;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/camel-to-kebab-case/camel-to-kebab-case.mjs
function f(e) {
	return e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/units-converters/px.mjs
function p(e) {
	return typeof e != "string" || !e.includes("var(--mantine-scale)") ? e : e.match(/^calc\((.*?)\)$/)?.[1].split("*")[0].trim();
}
function m(e) {
	let t = p(e);
	return typeof t == "number" ? t : typeof t == "string" ? t.includes("calc") || t.includes("var") ? t : t.includes("px") ? Number(t.replace("px", "")) : t.includes("rem") ? Number(t.replace("rem", "")) * 16 : t.includes("em") ? Number(t.replace("em", "")) * 16 : Number(t) : NaN;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/units-converters/rem.mjs
function h(e) {
	return e === "0rem" ? "0rem" : `calc(${e} * var(--mantine-scale))`;
}
function g(e, { shouldScale: t = !1 } = {}) {
	function n(r) {
		if (r === 0 || r === "0") return `0${e}`;
		if (typeof r == "number") {
			let n = `${r / 16}${e}`;
			return t ? h(n) : n;
		}
		if (typeof r == "string") {
			if (r === "" || r.startsWith("calc(") || r.startsWith("clamp(") || r.includes("rgba(")) return r;
			if (r.includes(",")) return r.split(",").map((e) => n(e)).join(",");
			if (r.includes(" ")) return r.split(" ").map((e) => n(e)).join(" ");
			let i = r.replace("px", "");
			if (!Number.isNaN(Number(i))) {
				let n = `${Number(i) / 16}${e}`;
				return t ? h(n) : n;
			}
		}
		return r;
	}
	return n;
}
var _ = g("rem", { shouldScale: !0 }), v = g("em");
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/filter-props/filter-props.mjs
function y(e) {
	return Object.keys(e).reduce((t, n) => (e[n] !== void 0 && (t[n] = e[n]), t), {});
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/is-number-like/is-number-like.mjs
function b(e) {
	if (typeof e == "number") return !0;
	if (typeof e == "string") {
		if (e.startsWith("calc(") || e.startsWith("var(") || e.includes(" ") && e.trim() !== "") return !0;
		let t = /^[+-]?[0-9]+(\.[0-9]+)?(px|em|rem|ex|ch|lh|rlh|vw|vh|vmin|vmax|vb|vi|svw|svh|lvw|lvh|dvw|dvh|cm|mm|in|pt|pc|q|cqw|cqh|cqi|cqb|cqmin|cqmax|%)?$/;
		return e.trim().split(/\s+/).every((e) => t.test(e));
	}
	return !1;
}
//#endregion
//#region ../../node_modules/.bun/react@19.2.8/node_modules/react/cjs/react.production.js
var x = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.consumer"), s = Symbol.for("react.context"), c = Symbol.for("react.forward_ref"), l = Symbol.for("react.suspense"), u = Symbol.for("react.memo"), d = Symbol.for("react.lazy"), f = Symbol.for("react.activity"), p = Symbol.iterator;
	function m(e) {
		return typeof e != "object" || !e ? null : (e = p && e[p] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var h = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, g = Object.assign, _ = {};
	function v(e, t, n) {
		this.props = e, this.context = t, this.refs = _, this.updater = n || h;
	}
	v.prototype.isReactComponent = {}, v.prototype.setState = function(e, t) {
		if (typeof e != "object" && typeof e != "function" && e != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, e, t, "setState");
	}, v.prototype.forceUpdate = function(e) {
		this.updater.enqueueForceUpdate(this, e, "forceUpdate");
	};
	function y() {}
	y.prototype = v.prototype;
	function b(e, t, n) {
		this.props = e, this.context = t, this.refs = _, this.updater = n || h;
	}
	var x = b.prototype = new y();
	x.constructor = b, g(x, v.prototype), x.isPureReactComponent = !0;
	var S = Array.isArray;
	function C() {}
	var w = {
		H: null,
		A: null,
		T: null,
		S: null
	}, T = Object.prototype.hasOwnProperty;
	function E(e, n, r) {
		var i = r.ref;
		return {
			$$typeof: t,
			type: e,
			key: n,
			ref: i === void 0 ? null : i,
			props: r
		};
	}
	function ee(e, t) {
		return E(e.type, t, e.props);
	}
	function D(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function O(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var k = /\/+/g;
	function A(e, t) {
		return typeof e == "object" && e && e.key != null ? O("" + e.key) : t.toString(36);
	}
	function j(e) {
		switch (e.status) {
			case "fulfilled": return e.value;
			case "rejected": throw e.reason;
			default: switch (typeof e.status == "string" ? e.then(C, C) : (e.status = "pending", e.then(function(t) {
				e.status === "pending" && (e.status = "fulfilled", e.value = t);
			}, function(t) {
				e.status === "pending" && (e.status = "rejected", e.reason = t);
			})), e.status) {
				case "fulfilled": return e.value;
				case "rejected": throw e.reason;
			}
		}
		throw e;
	}
	function M(e, r, i, a, o) {
		var s = typeof e;
		(s === "undefined" || s === "boolean") && (e = null);
		var c = !1;
		if (e === null) c = !0;
		else switch (s) {
			case "bigint":
			case "string":
			case "number":
				c = !0;
				break;
			case "object": switch (e.$$typeof) {
				case t:
				case n:
					c = !0;
					break;
				case d: return c = e._init, M(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + A(e, 0) : a, S(o) ? (i = "", c != null && (i = c.replace(k, "$&/") + "/"), M(o, r, i, "", function(e) {
			return e;
		})) : o != null && (D(o) && (o = ee(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(k, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (S(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + A(a, u), c += M(a, r, i, s, o);
		else if (u = m(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + A(a, u++), c += M(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return M(j(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function N(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return M(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function P(e) {
		if (e._status === -1) {
			var t = e._result;
			t = t(), t.then(function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 1, e._result = t);
			}, function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 2, e._result = t);
			}), e._status === -1 && (e._status = 0, e._result = t);
		}
		if (e._status === 1) return e._result.default;
		throw e._result;
	}
	var te = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, ne = {
		map: N,
		forEach: function(e, t, n) {
			N(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return N(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return N(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!D(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	};
	e.Activity = f, e.Children = ne, e.Component = v, e.Fragment = r, e.Profiler = a, e.PureComponent = b, e.StrictMode = i, e.Suspense = l, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = w, e.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(e) {
			return w.H.useMemoCache(e);
		}
	}, e.cache = function(e) {
		return function() {
			return e.apply(null, arguments);
		};
	}, e.cacheSignal = function() {
		return null;
	}, e.cloneElement = function(e, t, n) {
		if (e == null) throw Error("The argument must be a React element, but you passed " + e + ".");
		var r = g({}, e.props), i = e.key;
		if (t != null) for (a in t.key !== void 0 && (i = "" + t.key), t) !T.call(t, a) || a === "key" || a === "__self" || a === "__source" || a === "ref" && t.ref === void 0 || (r[a] = t[a]);
		var a = arguments.length - 2;
		if (a === 1) r.children = n;
		else if (1 < a) {
			for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
			r.children = o;
		}
		return E(e.type, i, r);
	}, e.createContext = function(e) {
		return e = {
			$$typeof: s,
			_currentValue: e,
			_currentValue2: e,
			_threadCount: 0,
			Provider: null,
			Consumer: null
		}, e.Provider = e, e.Consumer = {
			$$typeof: o,
			_context: e
		}, e;
	}, e.createElement = function(e, t, n) {
		var r, i = {}, a = null;
		if (t != null) for (r in t.key !== void 0 && (a = "" + t.key), t) T.call(t, r) && r !== "key" && r !== "__self" && r !== "__source" && (i[r] = t[r]);
		var o = arguments.length - 2;
		if (o === 1) i.children = n;
		else if (1 < o) {
			for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
			i.children = s;
		}
		if (e && e.defaultProps) for (r in o = e.defaultProps, o) i[r] === void 0 && (i[r] = o[r]);
		return E(e, a, i);
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = D, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: P
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = function(e) {
		var t = w.T, n = {};
		w.T = n;
		try {
			var r = e(), i = w.S;
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(C, te);
		} catch (e) {
			te(e);
		} finally {
			t !== null && n.types !== null && (t.types = n.types), w.T = t;
		}
	}, e.unstable_useCacheRefresh = function() {
		return w.H.useCacheRefresh();
	}, e.use = function(e) {
		return w.H.use(e);
	}, e.useActionState = function(e, t, n) {
		return w.H.useActionState(e, t, n);
	}, e.useCallback = function(e, t) {
		return w.H.useCallback(e, t);
	}, e.useContext = function(e) {
		return w.H.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e, t) {
		return w.H.useDeferredValue(e, t);
	}, e.useEffect = function(e, t) {
		return w.H.useEffect(e, t);
	}, e.useEffectEvent = function(e) {
		return w.H.useEffectEvent(e);
	}, e.useId = function() {
		return w.H.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return w.H.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return w.H.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return w.H.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return w.H.useMemo(e, t);
	}, e.useOptimistic = function(e, t) {
		return w.H.useOptimistic(e, t);
	}, e.useReducer = function(e, t, n) {
		return w.H.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return w.H.useRef(e);
	}, e.useState = function(e) {
		return w.H.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return w.H.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return w.H.useTransition();
	}, e.version = "19.2.8";
})), S = /* @__PURE__ */ o(((e, t) => {
	t.exports = x();
})), C = /* @__PURE__ */ c(S(), 1);
function w(e) {
	return Array.isArray(e) || e === null ? !1 : typeof e == "object" && e.type !== C.Fragment;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/create-safe-context/create-safe-context.mjs
function T(e) {
	let t = (0, C.createContext)(null);
	return [t, () => {
		let n = (0, C.use)(t);
		if (n === null) throw Error(e);
		return n;
	}];
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/get-default-z-index/get-default-z-index.mjs
var E = {
	app: 100,
	modal: 200,
	popover: 300,
	overlay: 400,
	max: 9999
};
function ee(e) {
	return E[e];
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/noop/noop.mjs
var D = () => {};
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/close-on-escape/close-on-escape.mjs
function O(e, t = { active: !0 }) {
	return typeof e != "function" || !t.active ? t.onKeyDown || D : (n) => {
		n.key === "Escape" && (e(n), t.onTrigger?.());
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/get-size/get-size.mjs
function k(e, t = "size", n = !0) {
	if (e !== void 0) return b(e) ? n ? _(e) : e : `var(--${t}-${e})`;
}
function A(e) {
	return k(e, "mantine-spacing");
}
function j(e) {
	return e === void 0 ? "var(--mantine-radius-default)" : k(e, "mantine-radius");
}
function M(e) {
	return k(e, "mantine-font-size");
}
function N(e) {
	return k(e, "mantine-line-height", !1);
}
function P(e) {
	if (e) return k(e, "mantine-shadow", !1);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/create-event-handler/create-event-handler.mjs
function te(e, t) {
	return (n) => {
		e?.(n), t?.(n);
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/get-breakpoint-value/get-breakpoint-value.mjs
function ne(e, t) {
	return e in t ? m(t[e]) : m(e);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/get-sorted-breakpoints/get-sorted-breakpoints.mjs
function re(e, t) {
	let n = e.map((e) => ({
		value: e,
		px: ne(e, t)
	}));
	return n.sort((e, t) => e.px - t.px), n;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/get-base-value/get-base-value.mjs
function F(e) {
	return typeof e == "object" && e ? "base" in e ? e.base : void 0 : e;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+hooks@9.5.0+0f58469d5b3bd39f/node_modules/@mantine/hooks/esm/utils/clamp/clamp.mjs
function I(e, t, n) {
	return t === void 0 && n === void 0 ? e : t !== void 0 && n === void 0 ? Math.max(e, t) : Math.min(t === void 0 && n !== void 0 ? e : Math.max(e, t), n);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+hooks@9.5.0+0f58469d5b3bd39f/node_modules/@mantine/hooks/esm/utils/random-id/random-id.mjs
function L(e = "mantine-") {
	return `${e}${Math.random().toString(36).slice(2, 11)}`;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+hooks@9.5.0+0f58469d5b3bd39f/node_modules/@mantine/hooks/esm/utils/use-callback-ref/use-callback-ref.mjs
function ie(e) {
	let t = (0, C.useRef)(e);
	return (0, C.useEffect)(() => {
		t.current = e;
	}), (0, C.useMemo)(() => ((...e) => t.current?.(...e)), []);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+hooks@9.5.0+0f58469d5b3bd39f/node_modules/@mantine/hooks/esm/use-debounced-callback/use-debounced-callback.mjs
function ae(e, t) {
	let { delay: n, flushOnUnmount: r, leading: i, maxWait: a } = typeof t == "number" ? {
		delay: t,
		flushOnUnmount: !1,
		leading: !1,
		maxWait: void 0
	} : t, o = ie(e), s = (0, C.useRef)(0), c = (0, C.useRef)(0), l = (0, C.useRef)(null), u = (0, C.useMemo)(() => {
		let e = Object.assign((...t) => {
			window.clearTimeout(s.current), l.current = t;
			let r = e._isFirstCall;
			e._isFirstCall = !1;
			function u() {
				window.clearTimeout(s.current), window.clearTimeout(c.current), s.current = 0, c.current = 0, e._isFirstCall = !0, e._hasPendingCallback = !1;
			}
			function d() {
				a !== void 0 && c.current === 0 && (c.current = window.setTimeout(() => {
					if (s.current !== 0) {
						let e = l.current;
						u(), o(...e);
					}
				}, a));
			}
			if (i && r) {
				o(...t), e.flush = () => {
					s.current !== 0 && (u(), o(...t));
				}, e.cancel = () => {
					u();
				}, s.current = window.setTimeout(() => {
					u();
				}, n), d();
				return;
			}
			if (i && !r) {
				e._hasPendingCallback = !0, e.flush = () => {
					s.current !== 0 && (u(), o(...t));
				}, e.cancel = () => {
					u();
				}, s.current = window.setTimeout(() => {
					u();
				}, n), d();
				return;
			}
			e._hasPendingCallback = !0;
			let f = () => {
				s.current !== 0 && (u(), o(...t));
			};
			e.flush = f, e.cancel = () => {
				u();
			}, s.current = window.setTimeout(f, n), d();
		}, {
			flush: () => {},
			cancel: () => {},
			isPending: () => e._hasPendingCallback,
			_isFirstCall: !0,
			_hasPendingCallback: !1
		});
		return e;
	}, [
		o,
		n,
		i,
		a
	]);
	return (0, C.useEffect)(() => () => {
		r ? u.flush() : u.cancel();
	}, [u, r]), u;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+hooks@9.5.0+0f58469d5b3bd39f/node_modules/@mantine/hooks/esm/use-click-outside/use-click-outside.mjs
var oe = ["mousedown", "touchstart"];
function se(e, t, n, r = !0) {
	let i = (0, C.useRef)(null), a = t || oe, o = (0, C.useEffectEvent)((t) => {
		let { target: r } = t ?? {};
		if (!document.body.contains(r) && r?.tagName !== "HTML") return;
		let a = t.composedPath();
		Array.isArray(n) ? n.every((e) => !!e && !a.includes(e)) && e(t) : i.current && !a.includes(i.current) && e(t);
	}), s = a.join(",");
	return (0, C.useEffect)(() => {
		if (!r) return;
		let e = s.split(",");
		return e.forEach((e) => document.addEventListener(e, o)), () => {
			e.forEach((e) => document.removeEventListener(e, o));
		};
	}, [s, r]), i;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+hooks@9.5.0+0f58469d5b3bd39f/node_modules/@mantine/hooks/esm/use-media-query/use-media-query.mjs
function ce(e, t) {
	return typeof t == "boolean" ? t : typeof window < "u" && "matchMedia" in window && window.matchMedia(e).matches;
}
function le(e, t, { getInitialValueInEffect: n } = { getInitialValueInEffect: !0 }) {
	let [r, i] = (0, C.useState)(n ? t : ce(e));
	return (0, C.useEffect)(() => {
		try {
			if ("matchMedia" in window) {
				let t = window.matchMedia(e);
				i(t.matches);
				let n = (e) => i(e.matches);
				return t.addEventListener("change", n), () => {
					t.removeEventListener("change", n);
				};
			}
		} catch {
			return;
		}
	}, [e]), r || !1;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+hooks@9.5.0+0f58469d5b3bd39f/node_modules/@mantine/hooks/esm/use-isomorphic-effect/use-isomorphic-effect.mjs
var ue = typeof document < "u" ? C.useLayoutEffect : C.useEffect;
//#endregion
//#region ../../node_modules/.bun/@mantine+hooks@9.5.0+0f58469d5b3bd39f/node_modules/@mantine/hooks/esm/use-did-update/use-did-update.mjs
function de(e, t) {
	let n = (0, C.useRef)(!1);
	(0, C.useEffect)(() => () => {
		n.current = !1;
	}, []), (0, C.useEffect)(() => {
		if (n.current) return e();
		n.current = !0;
	}, t);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+hooks@9.5.0+0f58469d5b3bd39f/node_modules/@mantine/hooks/esm/use-focus-return/use-focus-return.mjs
function fe({ opened: e, shouldReturnFocus: t = !0 }) {
	let n = (0, C.useRef)(null), r = () => {
		n.current && "focus" in n.current && typeof n.current.focus == "function" && n.current?.focus({ preventScroll: !0 });
	};
	return de(() => {
		let i = -1, a = (e) => {
			e.key === "Tab" && window.clearTimeout(i);
		};
		if (document.addEventListener("keydown", a), e) n.current = document.activeElement;
		else if (t) {
			let e = document.activeElement;
			i = window.setTimeout(() => {
				let t = document.activeElement;
				(t === null || t === document.body || t === e) && r();
			}, 10);
		}
		return () => {
			window.clearTimeout(i), document.removeEventListener("keydown", a);
		};
	}, [e, t]), r;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+hooks@9.5.0+0f58469d5b3bd39f/node_modules/@mantine/hooks/esm/use-focus-trap/tabbable.mjs
var pe = /input|select|textarea|button|object/, me = "a, input, select, textarea, button, object, [tabindex]";
function he(e) {
	return e.style.display === "none";
}
function R(e) {
	if (e.getAttribute("aria-hidden") || e.getAttribute("hidden") || e.getAttribute("type") === "hidden") return !1;
	let t = e;
	for (; t && t !== document.body && t.nodeType !== 11;) {
		if (he(t)) return !1;
		t = t.parentNode;
	}
	return !0;
}
function ge(e) {
	let t = e.getAttribute("tabindex");
	return t === null && (t = void 0), parseInt(t, 10);
}
function _e(e) {
	let t = e.nodeName.toLowerCase(), n = !Number.isNaN(ge(e));
	return (pe.test(t) && !e.disabled || e instanceof HTMLAnchorElement && e.href || n) && R(e);
}
function ve(e) {
	let t = ge(e);
	return (Number.isNaN(t) || t >= 0) && _e(e);
}
function ye(e) {
	return Array.from(e.querySelectorAll(me)).filter(ve);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+hooks@9.5.0+0f58469d5b3bd39f/node_modules/@mantine/hooks/esm/use-focus-trap/scope-tab.mjs
function be(e, t) {
	let n = ye(e);
	if (!n.length) {
		t.preventDefault();
		return;
	}
	let r = n[t.shiftKey ? 0 : n.length - 1], i = e.getRootNode(), a = r === i.activeElement || e === i.activeElement, o = i.activeElement;
	if (o.tagName === "INPUT" && o.getAttribute("type") === "radio" && (a = n.filter((e) => e.getAttribute("type") === "radio" && e.getAttribute("name") === o.getAttribute("name")).includes(r)), !a) return;
	t.preventDefault();
	let s = n[t.shiftKey ? n.length - 1 : 0];
	s && s.focus();
}
//#endregion
//#region ../../node_modules/.bun/@mantine+hooks@9.5.0+0f58469d5b3bd39f/node_modules/@mantine/hooks/esm/use-focus-trap/use-focus-trap.mjs
function xe(e = !0) {
	let t = (0, C.useRef)(null), n = (e) => {
		let t = e.querySelector("[data-autofocus]");
		if (!t) {
			let n = Array.from(e.querySelectorAll(me));
			t = n.find(ve) || n.find(_e) || null, !t && _e(e) && (t = e);
		}
		t ? t.focus({ preventScroll: !0 }) : console.warn("[@mantine/hooks/use-focus-trap] Failed to find focusable element within provided node", e);
	}, r = (0, C.useCallback)((r) => {
		if (e) {
			if (r === null) {
				t.current = null;
				return;
			}
			t.current !== r && (setTimeout(() => {
				r.getRootNode() ? n(r) : console.warn("[@mantine/hooks/use-focus-trap] Ref node is not part of the dom", r);
			}), t.current = r);
		}
	}, [e]);
	return (0, C.useEffect)(() => {
		if (!e) return;
		t.current && setTimeout(() => {
			t.current && n(t.current);
		});
		let r = (e) => {
			e.key === "Tab" && t.current && be(t.current, e);
		};
		return document.addEventListener("keydown", r), () => document.removeEventListener("keydown", r);
	}, [e]), r;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+hooks@9.5.0+0f58469d5b3bd39f/node_modules/@mantine/hooks/esm/use-id/use-id.mjs
function Se(e) {
	let [t, n] = (0, C.useState)(`mantine-${(0, C.useId)().replace(/:/g, "")}`), r = (0, C.useRef)(!1);
	return ue(() => {
		r.current || (r.current = !0, n(L()));
	}, []), typeof e == "string" ? e : t;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+hooks@9.5.0+0f58469d5b3bd39f/node_modules/@mantine/hooks/esm/use-merged-ref/use-merged-ref.mjs
function Ce(e, t) {
	if (typeof e == "function") return e(t);
	typeof e == "object" && e && "current" in e && (e.current = t);
}
function we(...e) {
	let t = /* @__PURE__ */ new Map();
	return (n) => {
		if (e.forEach((e) => {
			let r = Ce(e, n);
			r && t.set(e, r);
		}), t.size > 0) return () => {
			e.forEach((e) => {
				let n = t.get(e);
				n && typeof n == "function" ? n() : Ce(e, null);
			}), t.clear();
		};
	};
}
function Te(...e) {
	return (0, C.useCallback)(we(...e), e);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+hooks@9.5.0+0f58469d5b3bd39f/node_modules/@mantine/hooks/esm/use-uncontrolled/use-uncontrolled.mjs
function Ee({ value: e, defaultValue: t, finalValue: n, onChange: r = () => {} }) {
	let [i, a] = (0, C.useState)(t === void 0 ? n : t);
	return e === void 0 ? [
		i,
		(e, ...t) => {
			a(e), r?.(e, ...t);
		},
		!1
	] : [
		e,
		r,
		!0
	];
}
//#endregion
//#region ../../node_modules/.bun/@mantine+hooks@9.5.0+0f58469d5b3bd39f/node_modules/@mantine/hooks/esm/use-reduced-motion/use-reduced-motion.mjs
function De(e, t) {
	return le("(prefers-reduced-motion: reduce)", e, t);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+hooks@9.5.0+0f58469d5b3bd39f/node_modules/@mantine/hooks/esm/use-previous/use-previous.mjs
function Oe(e) {
	let t = (0, C.useRef)(void 0);
	return (0, C.useEffect)(() => {
		t.current = e;
	}, [e]), t.current;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+hooks@9.5.0+0f58469d5b3bd39f/node_modules/@mantine/hooks/esm/use-long-press/use-long-press.mjs
var z = ["mouse", "touch"], ke = 10;
function Ae(e, t = {}) {
	let { threshold: n = 400, events: r = z, cancelOnMove: i = !1, onStart: a, onFinish: o, onCancel: s } = t, c = (0, C.useRef)(!1), l = (0, C.useRef)(!1), u = (0, C.useRef)(-1), d = (0, C.useRef)(null);
	return (0, C.useEffect)(() => () => window.clearTimeout(u.current), []), (0, C.useMemo)(() => {
		if (typeof e != "function") return {};
		let t = i !== !1, f = i === !0 ? ke : i === !1 ? 0 : i, p = (t) => {
			!Ne(t) && !Me(t) || (a && a(t), d.current = je(t), l.current = !0, u.current = window.setTimeout(() => {
				e(t), c.current = !0;
			}, n));
		}, m = (e) => {
			!Ne(e) && !Me(e) || (c.current ? o && o(e) : l.current && s && s(e), c.current = !1, l.current = !1, d.current = null, u.current !== -1 && (window.clearTimeout(u.current), u.current = -1));
		}, h = (e) => {
			if (!t || !l.current || c.current) return;
			let n = je(e);
			if (!n || !d.current) return;
			let r = n.x - d.current.x, i = n.y - d.current.y;
			Math.sqrt(r * r + i * i) > f && m(e);
		}, g = {};
		return r.includes("mouse") && (g.onMouseDown = p, g.onMouseUp = m, g.onMouseLeave = m, t && (g.onMouseMove = h)), r.includes("touch") && (g.onTouchStart = p, g.onTouchEnd = m, g.onTouchCancel = m, t && (g.onTouchMove = h)), g;
	}, [
		e,
		n,
		s,
		o,
		a,
		i,
		r.join(",")
	]);
}
function je(e) {
	if (Me(e)) {
		let t = e.touches[0] ?? e.changedTouches[0];
		return t ? {
			x: t.clientX,
			y: t.clientY
		} : null;
	}
	return {
		x: e.clientX,
		y: e.clientY
	};
}
function Me(e) {
	return window.TouchEvent ? e.nativeEvent instanceof TouchEvent : "touches" in e.nativeEvent;
}
function Ne(e) {
	return e.nativeEvent instanceof MouseEvent;
}
//#endregion
//#region ../../node_modules/.bun/react-dom@19.2.8+0f58469d5b3bd39f/node_modules/react-dom/cjs/react-dom.production.js
var Pe = /* @__PURE__ */ o(((e) => {
	var t = S();
	function n(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function r() {}
	var i = {
		d: {
			f: r,
			r: function() {
				throw Error(n(522));
			},
			D: r,
			C: r,
			L: r,
			m: r,
			X: r,
			S: r,
			M: r
		},
		p: 0,
		findDOMNode: null
	}, a = Symbol.for("react.portal");
	function o(e, t, n) {
		var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
		return {
			$$typeof: a,
			key: r == null ? null : "" + r,
			children: e,
			containerInfo: t,
			implementation: n
		};
	}
	var s = t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
	function c(e, t) {
		if (e === "font") return "";
		if (typeof t == "string") return t === "use-credentials" ? t : "";
	}
	e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = i, e.createPortal = function(e, t) {
		var r = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
		if (!t || t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11) throw Error(n(299));
		return o(e, t, null, r);
	}, e.flushSync = function(e) {
		var t = s.T, n = i.p;
		try {
			if (s.T = null, i.p = 2, e) return e();
		} finally {
			s.T = t, i.p = n, i.d.f();
		}
	}, e.preconnect = function(e, t) {
		typeof e == "string" && (t ? (t = t.crossOrigin, t = typeof t == "string" ? t === "use-credentials" ? t : "" : void 0) : t = null, i.d.C(e, t));
	}, e.prefetchDNS = function(e) {
		typeof e == "string" && i.d.D(e);
	}, e.preinit = function(e, t) {
		if (typeof e == "string" && t && typeof t.as == "string") {
			var n = t.as, r = c(n, t.crossOrigin), a = typeof t.integrity == "string" ? t.integrity : void 0, o = typeof t.fetchPriority == "string" ? t.fetchPriority : void 0;
			n === "style" ? i.d.S(e, typeof t.precedence == "string" ? t.precedence : void 0, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o
			}) : n === "script" && i.d.X(e, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0
			});
		}
	}, e.preinitModule = function(e, t) {
		if (typeof e == "string") if (typeof t == "object" && t) {
			if (t.as == null || t.as === "script") {
				var n = c(t.as, t.crossOrigin);
				i.d.M(e, {
					crossOrigin: n,
					integrity: typeof t.integrity == "string" ? t.integrity : void 0,
					nonce: typeof t.nonce == "string" ? t.nonce : void 0
				});
			}
		} else t ?? i.d.M(e);
	}, e.preload = function(e, t) {
		if (typeof e == "string" && typeof t == "object" && t && typeof t.as == "string") {
			var n = t.as, r = c(n, t.crossOrigin);
			i.d.L(e, n, {
				crossOrigin: r,
				integrity: typeof t.integrity == "string" ? t.integrity : void 0,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0,
				type: typeof t.type == "string" ? t.type : void 0,
				fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0,
				referrerPolicy: typeof t.referrerPolicy == "string" ? t.referrerPolicy : void 0,
				imageSrcSet: typeof t.imageSrcSet == "string" ? t.imageSrcSet : void 0,
				imageSizes: typeof t.imageSizes == "string" ? t.imageSizes : void 0,
				media: typeof t.media == "string" ? t.media : void 0
			});
		}
	}, e.preloadModule = function(e, t) {
		if (typeof e == "string") if (t) {
			var n = c(t.as, t.crossOrigin);
			i.d.m(e, {
				as: typeof t.as == "string" && t.as !== "script" ? t.as : void 0,
				crossOrigin: n,
				integrity: typeof t.integrity == "string" ? t.integrity : void 0
			});
		} else i.d.m(e);
	}, e.requestFormReset = function(e) {
		i.d.r(e);
	}, e.unstable_batchedUpdates = function(e, t) {
		return e(t);
	}, e.useFormState = function(e, t, n) {
		return s.H.useFormState(e, t, n);
	}, e.useFormStatus = function() {
		return s.H.useHostTransitionStatus();
	}, e.version = "19.2.8";
})), Fe = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = Pe();
}));
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/get-env/get-env.mjs
function Ie() {
	return typeof process < "u" && process.env, "development";
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/get-ref-prop/get-ref-prop.mjs
function Le(e) {
	return e?.props?.ref;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/find-element-in-shadow-dom/find-element-in-shadow-dom.mjs
function Re(e, t = document) {
	let n = t.querySelector(e);
	if (n) return n;
	let r = t.querySelectorAll("*");
	for (let t = 0; t < r.length; t += 1) {
		let n = r[t];
		if (n.shadowRoot) {
			let t = Re(e, n.shadowRoot);
			if (t) return t;
		}
	}
	return null;
}
function ze(e, t = document) {
	let n = [], r = t.querySelectorAll(e);
	n.push(...Array.from(r));
	let i = t.querySelectorAll("*");
	for (let t = 0; t < i.length; t += 1) {
		let r = i[t];
		if (r.shadowRoot) {
			let t = ze(e, r.shadowRoot);
			n.push(...t);
		}
	}
	return n;
}
function Be(e) {
	if (!e) return document;
	let t = e.getRootNode();
	return t instanceof ShadowRoot || t instanceof Document ? t : document;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/utils/get-single-element-child/get-single-element-child.mjs
function Ve(e) {
	let t = C.Children.toArray(e);
	return t.length !== 1 || !w(t[0]) ? null : t[0];
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/styles-api/create-vars-resolver/create-vars-resolver.mjs
function B(e) {
	return e;
}
//#endregion
//#region ../../node_modules/.bun/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
function He(e) {
	var t, n, r = "";
	if (typeof e == "string" || typeof e == "number") r += e;
	else if (typeof e == "object") if (Array.isArray(e)) {
		var i = e.length;
		for (t = 0; t < i; t++) e[t] && (n = He(e[t])) && (r && (r += " "), r += n);
	} else for (n in e) e[n] && (r && (r += " "), r += n);
	return r;
}
function Ue() {
	for (var e, t, n = 0, r = "", i = arguments.length; n < i; n++) (e = arguments[n]) && (t = He(e)) && (r && (r += " "), r += t);
	return r;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/styles-api/use-styles/get-class-name/resolve-class-names/resolve-class-names.mjs
var We = {};
function Ge(e) {
	let t = {};
	return e.forEach((e) => {
		Object.entries(e).forEach(([e, n]) => {
			t[e] ? t[e] = Ue(t[e], n) : t[e] = n;
		});
	}), t;
}
function Ke({ theme: e, classNames: t, props: n, stylesCtx: r }) {
	return Ge((Array.isArray(t) ? t : [t]).map((t) => typeof t == "function" ? t(e, n, r) : t || We));
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/styles-api/use-styles/get-style/resolve-styles/resolve-styles.mjs
function qe({ theme: e, styles: t, props: n, stylesCtx: r }) {
	let i = Array.isArray(t) ? t : [t], a = {};
	for (let t of i) typeof t == "function" ? Object.assign(a, t(e, n, r)) : t && Object.assign(a, t);
	return a;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/color-scheme-managers/is-mantine-color-scheme.mjs
function Je(e) {
	return e === "auto" || e === "dark" || e === "light";
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/color-scheme-managers/local-storage-manager.mjs
function Ye({ key: e = "mantine-color-scheme-value" } = {}) {
	let t;
	return {
		get: (t) => {
			if (typeof window > "u") return t;
			try {
				let n = window.localStorage.getItem(e);
				return Je(n) ? n : t;
			} catch {
				return t;
			}
		},
		set: (t) => {
			try {
				window.localStorage.setItem(e, t);
			} catch (e) {
				console.warn("[@mantine/core] Local storage color scheme manager was unable to save color scheme.", e);
			}
		},
		subscribe: (n) => {
			t = (t) => {
				t.storageArea === window.localStorage && t.key === e && Je(t.newValue) && n(t.newValue);
			}, window.addEventListener("storage", t);
		},
		unsubscribe: () => {
			window.removeEventListener("storage", t);
		},
		clear: () => {
			window.localStorage.removeItem(e);
		}
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/color-functions/get-primary-shade/get-primary-shade.mjs
function Xe(e, t) {
	return typeof e.primaryShade == "number" ? e.primaryShade : t === "dark" ? e.primaryShade.dark : e.primaryShade.light;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/color-functions/to-rgba/to-rgba.mjs
function Ze(e) {
	return /^#?([0-9A-F]{3}){1,2}([0-9A-F]{2})?$/i.test(e);
}
function Qe(e) {
	let t = e.replace("#", "");
	if (t.length === 3) {
		let e = t.split("");
		t = [
			e[0],
			e[0],
			e[1],
			e[1],
			e[2],
			e[2]
		].join("");
	}
	if (t.length === 8) {
		let e = parseInt(t.slice(6, 8), 16) / 255;
		return {
			r: parseInt(t.slice(0, 2), 16),
			g: parseInt(t.slice(2, 4), 16),
			b: parseInt(t.slice(4, 6), 16),
			a: e
		};
	}
	let n = parseInt(t, 16);
	return {
		r: n >> 16 & 255,
		g: n >> 8 & 255,
		b: n & 255,
		a: 1
	};
}
function $e(e) {
	let [t, n, r, i] = e.replace(/[^0-9,./]/g, "").split(/[/,]/).map(Number);
	return {
		r: t,
		g: n,
		b: r,
		a: i === void 0 ? 1 : i
	};
}
function et(e) {
	let t = e.match(/^hsla?\(\s*(\d+)\s*,\s*(\d+%)\s*,\s*(\d+%)\s*(,\s*(0?\.\d+|\d+(\.\d+)?))?\s*\)$/i);
	if (!t) return {
		r: 0,
		g: 0,
		b: 0,
		a: 1
	};
	let n = parseInt(t[1], 10), r = parseInt(t[2], 10) / 100, i = parseInt(t[3], 10) / 100, a = t[5] ? parseFloat(t[5]) : void 0, o = (1 - Math.abs(2 * i - 1)) * r, s = n / 60, c = o * (1 - Math.abs(s % 2 - 1)), l = i - o / 2, u, d, f;
	return s >= 0 && s < 1 ? (u = o, d = c, f = 0) : s >= 1 && s < 2 ? (u = c, d = o, f = 0) : s >= 2 && s < 3 ? (u = 0, d = o, f = c) : s >= 3 && s < 4 ? (u = 0, d = c, f = o) : s >= 4 && s < 5 ? (u = c, d = 0, f = o) : (u = o, d = 0, f = c), {
		r: Math.round((u + l) * 255),
		g: Math.round((d + l) * 255),
		b: Math.round((f + l) * 255),
		a: a || 1
	};
}
function tt(e) {
	return Ze(e) ? Qe(e) : e.startsWith("rgb") ? $e(e) : e.startsWith("hsl") ? et(e) : {
		r: 0,
		g: 0,
		b: 0,
		a: 1
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/color-functions/luminance/luminance.mjs
function nt(e) {
	return e <= .03928 ? e / 12.92 : ((e + .055) / 1.055) ** 2.4;
}
function rt(e) {
	let t = e.match(/oklch\((.*?)%\s/);
	return t ? parseFloat(t[1]) : null;
}
function it(e) {
	if (e.startsWith("oklch(")) return (rt(e) || 0) / 100;
	let { r: t, g: n, b: r } = tt(e), i = t / 255, a = n / 255, o = r / 255, s = nt(i), c = nt(a), l = nt(o);
	return .2126 * s + .7152 * c + .0722 * l;
}
function at(e, t = .179) {
	return !e.startsWith("var(") && it(e) > t;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/color-functions/parse-theme-color/parse-theme-color.mjs
function ot({ color: e, theme: t, colorScheme: n }) {
	if (typeof e != "string") throw Error(`[@mantine/core] Failed to parse color. Expected color to be a string, instead got ${typeof e}`);
	if (e === "bright") return {
		color: e,
		value: n === "dark" ? t.white : t.black,
		shade: void 0,
		isThemeColor: !1,
		isLight: at(n === "dark" ? t.white : t.black, t.luminanceThreshold),
		variable: "--mantine-color-bright"
	};
	if (e === "dimmed") return {
		color: e,
		value: n === "dark" ? t.colors.dark[2] : t.colors.gray[7],
		shade: void 0,
		isThemeColor: !1,
		isLight: at(n === "dark" ? t.colors.dark[2] : t.colors.gray[6], t.luminanceThreshold),
		variable: "--mantine-color-dimmed"
	};
	if (e === "white" || e === "black") return {
		color: e,
		value: e === "white" ? t.white : t.black,
		shade: void 0,
		isThemeColor: !1,
		isLight: at(e === "white" ? t.white : t.black, t.luminanceThreshold),
		variable: `--mantine-color-${e}`
	};
	let [r, i] = e.split("."), a = i ? Number(i) : void 0, o = r in t.colors;
	if (o) {
		let e = a === void 0 ? t.colors[r][Xe(t, n || "light")] : t.colors[r][a];
		return {
			color: r,
			value: e,
			shade: a,
			isThemeColor: o,
			isLight: at(e, t.luminanceThreshold),
			variable: i ? `--mantine-color-${r}-${a}` : `--mantine-color-${r}-filled`
		};
	}
	return {
		color: e,
		value: e,
		isThemeColor: o,
		isLight: at(e, t.luminanceThreshold),
		shade: a,
		variable: void 0
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/color-functions/get-theme-color/get-theme-color.mjs
function st(e, t) {
	let n = ot({
		color: e || t.primaryColor,
		theme: t
	});
	return n.variable ? `var(${n.variable})` : e;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/MantineCssVariables/virtual-color/virtual-color.mjs
function ct(e) {
	return !!e && typeof e == "object" && "mantine-virtual-color" in e;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/color-functions/darken/darken.mjs
function lt(e, t) {
	if (e.startsWith("var(")) return `color-mix(in srgb, ${e}, black ${t * 100}%)`;
	let { r: n, g: r, b: i, a } = tt(e), o = 1 - t, s = (e) => Math.round(e * o);
	return `rgba(${s(n)}, ${s(r)}, ${s(i)}, ${a})`;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/color-functions/get-gradient/get-gradient.mjs
function ut(e, t) {
	let n = {
		from: e?.from || t.defaultGradient.from,
		to: e?.to || t.defaultGradient.to,
		deg: e?.deg ?? t.defaultGradient.deg ?? 0
	}, r = st(n.from, t), i = st(n.to, t);
	return `linear-gradient(${n.deg}deg, ${r} 0%, ${i} 100%)`;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/color-functions/rgba/rgba.mjs
function dt(e, t) {
	if (typeof e != "string" || t > 1 || t < 0) return "rgba(0, 0, 0, 1)";
	if (e.startsWith("var(")) return `color-mix(in srgb, ${e}, transparent ${(1 - t) * 100}%)`;
	if (e.startsWith("oklch")) return e.includes("/") ? e.replace(/\/\s*[\d.]+\s*\)/, `/ ${t})`) : e.replace(")", ` / ${t})`);
	let { r: n, g: r, b: i } = tt(e);
	return `rgba(${n}, ${r}, ${i}, ${t})`;
}
var ft = dt, pt = ({ color: e, theme: t, variant: n, gradient: r, autoContrast: i }) => {
	let a = ot({
		color: e,
		theme: t
	}), o = typeof i == "boolean" ? i : t.autoContrast;
	if (n === "none") return {
		background: "transparent",
		hover: "transparent",
		color: "inherit",
		border: "none"
	};
	if (n === "filled") {
		let n = a.isThemeColor && a.shade === void 0 && ct(t.colors[a.color]), r = o ? n ? `var(--mantine-color-${a.color}-contrast)` : a.isLight ? "var(--mantine-color-black)" : "var(--mantine-color-white)" : "var(--mantine-color-white)";
		return a.isThemeColor ? a.shade === void 0 ? {
			background: `var(--mantine-color-${e}-filled)`,
			hover: `var(--mantine-color-${e}-filled-hover)`,
			color: r,
			border: `${_(1)} solid transparent`
		} : {
			background: `var(--mantine-color-${a.color}-${a.shade})`,
			hover: `var(--mantine-color-${a.color}-${a.shade === 9 ? 8 : a.shade + 1})`,
			color: r,
			border: `${_(1)} solid transparent`
		} : {
			background: e,
			hover: lt(e, .1),
			color: r,
			border: `${_(1)} solid transparent`
		};
	}
	if (n === "light") {
		if (a.isThemeColor) {
			if (a.shade === void 0) return {
				background: `var(--mantine-color-${e}-light)`,
				hover: `var(--mantine-color-${e}-light-hover)`,
				color: `var(--mantine-color-${e}-light-color)`,
				border: `${_(1)} solid transparent`
			};
			let n = t.colors[a.color][a.shade];
			return {
				background: n,
				hover: lt(n, .1),
				color: `var(--mantine-color-${a.color}-light-color)`,
				border: `${_(1)} solid transparent`
			};
		}
		return {
			background: dt(e, .1),
			hover: dt(e, .12),
			color: e,
			border: `${_(1)} solid transparent`
		};
	}
	if (n === "outline") return a.isThemeColor ? a.shade === void 0 ? {
		background: "transparent",
		hover: `var(--mantine-color-${e}-outline-hover)`,
		color: `var(--mantine-color-${e}-outline)`,
		border: `${_(1)} solid var(--mantine-color-${e}-outline)`
	} : {
		background: "transparent",
		hover: dt(t.colors[a.color][a.shade], .05),
		color: `var(--mantine-color-${a.color}-${a.shade})`,
		border: `${_(1)} solid var(--mantine-color-${a.color}-${a.shade})`
	} : {
		background: "transparent",
		hover: dt(e, .05),
		color: e,
		border: `${_(1)} solid ${e}`
	};
	if (n === "subtle") {
		if (a.isThemeColor) {
			if (a.shade === void 0) return {
				background: "transparent",
				hover: `var(--mantine-color-${e}-light-hover)`,
				color: `var(--mantine-color-${e}-light-color)`,
				border: `${_(1)} solid transparent`
			};
			let n = t.colors[a.color][a.shade];
			return {
				background: "transparent",
				hover: dt(n, .12),
				color: `var(--mantine-color-${a.color}-${Math.min(a.shade, 6)})`,
				border: `${_(1)} solid transparent`
			};
		}
		return {
			background: "transparent",
			hover: dt(e, .12),
			color: e,
			border: `${_(1)} solid transparent`
		};
	}
	return n === "transparent" ? a.isThemeColor ? a.shade === void 0 ? {
		background: "transparent",
		hover: "transparent",
		color: `var(--mantine-color-${e}-light-color)`,
		border: `${_(1)} solid transparent`
	} : {
		background: "transparent",
		hover: "transparent",
		color: `var(--mantine-color-${a.color}-${Math.min(a.shade, 6)})`,
		border: `${_(1)} solid transparent`
	} : {
		background: "transparent",
		hover: "transparent",
		color: e,
		border: `${_(1)} solid transparent`
	} : n === "white" ? a.isThemeColor ? a.shade === void 0 ? {
		background: "var(--mantine-color-white)",
		hover: lt(t.white, .01),
		color: `var(--mantine-color-${e}-filled)`,
		border: `${_(1)} solid transparent`
	} : {
		background: "var(--mantine-color-white)",
		hover: lt(t.white, .01),
		color: `var(--mantine-color-${a.color}-${a.shade})`,
		border: `${_(1)} solid transparent`
	} : {
		background: "var(--mantine-color-white)",
		hover: lt(t.white, .01),
		color: e,
		border: `${_(1)} solid transparent`
	} : n === "gradient" ? {
		background: ut(r, t),
		hover: ut(r, t),
		color: "var(--mantine-color-white)",
		border: "none"
	} : n === "default" ? {
		background: "var(--mantine-color-default)",
		hover: "var(--mantine-color-default-hover)",
		color: "var(--mantine-color-default-color)",
		border: `${_(1)} solid var(--mantine-color-default-border)`
	} : {};
};
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/color-functions/get-contrast-color/get-contrast-color.mjs
function mt({ color: e, theme: t, autoContrast: n, colorScheme: r }) {
	return (typeof n == "boolean" ? n : t.autoContrast) && ot({
		color: e || t.primaryColor,
		theme: t,
		colorScheme: r
	}).isLight ? "var(--mantine-color-black)" : "var(--mantine-color-white)";
}
function ht(e, t, n) {
	return mt({
		color: n === "dark" ? e.dark : e.light,
		theme: t,
		colorScheme: n,
		autoContrast: !0
	});
}
function gt(e, t) {
	let n = e.colors[e.primaryColor];
	return ct(n) ? e.autoContrast ? ht(n, e, t) : "var(--mantine-color-white)" : mt({
		color: n[Xe(e, t)],
		theme: e,
		autoContrast: null
	});
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/Mantine.context.mjs
var _t = (0, C.createContext)(null);
function vt() {
	let e = (0, C.use)(_t);
	if (!e) throw Error("[@mantine/core] MantineProvider was not found in tree");
	return e;
}
function yt() {
	return vt().cssVariablesResolver;
}
function bt() {
	return vt().classNamesPrefix;
}
function xt() {
	return vt().getStyleNonce;
}
function St() {
	return vt().withStaticClasses;
}
function Ct() {
	return vt().headless;
}
function wt() {
	return vt().stylesTransform?.sx;
}
function Tt() {
	return vt().stylesTransform?.styles;
}
function Et() {
	return vt().env || "default";
}
function Dt() {
	return vt().deduplicateInlineStyles;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/use-mantine-color-scheme/use-provider-color-scheme.mjs
function Ot(e, t) {
	let n = typeof window < "u" && "matchMedia" in window && window.matchMedia("(prefers-color-scheme: dark)")?.matches, r = e === "auto" ? n ? "dark" : "light" : e;
	t()?.setAttribute("data-mantine-color-scheme", r);
}
function kt({ manager: e, defaultColorScheme: t, getRootElement: n, forceColorScheme: r }) {
	let i = (0, C.useRef)(null), [a, o] = (0, C.useState)(() => e.get(t)), s = r || a, c = (0, C.useCallback)((t) => {
		r || (Ot(t, n), o(t), e.set(t));
	}, [
		e.set,
		s,
		r
	]), l = (0, C.useCallback)(() => {
		o(t), Ot(t, n), e.clear();
	}, [e.clear, t]);
	return (0, C.useEffect)(() => (e.subscribe(c), e.unsubscribe), [e.subscribe, e.unsubscribe]), ue(() => {
		Ot(e.get(t), n);
	}, []), (0, C.useEffect)(() => {
		if (r) return Ot(r, n), () => {};
		r === void 0 && Ot(a, n), typeof window < "u" && "matchMedia" in window && (i.current = window.matchMedia("(prefers-color-scheme: dark)"));
		let e = (e) => {
			a === "auto" && Ot(e.matches ? "dark" : "light", n);
		};
		return i.current?.addEventListener("change", e), () => i.current?.removeEventListener("change", e);
	}, [a, r]), {
		colorScheme: s,
		setColorScheme: c,
		clearColorScheme: l
	};
}
//#endregion
//#region ../../node_modules/.bun/react@19.2.8/node_modules/react/cjs/react-jsx-runtime.production.js
var At = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.fragment");
	function r(e, n, r) {
		var i = null;
		if (r !== void 0 && (i = "" + r), n.key !== void 0 && (i = "" + n.key), "key" in n) for (var a in r = {}, n) a !== "key" && (r[a] = n[a]);
		else r = n;
		return n = r.ref, {
			$$typeof: t,
			type: e,
			key: i,
			ref: n === void 0 ? null : n,
			props: r
		};
	}
	e.Fragment = n, e.jsx = r, e.jsxs = r;
})), jt = /* @__PURE__ */ o(((e, t) => {
	t.exports = At();
})), Mt = {
	dark: [
		"#C9C9C9",
		"#b8b8b8",
		"#828282",
		"#696969",
		"#424242",
		"#3b3b3b",
		"#2e2e2e",
		"#242424",
		"#1f1f1f",
		"#141414"
	],
	gray: [
		"#f8f9fa",
		"#f1f3f5",
		"#e9ecef",
		"#dee2e6",
		"#ced4da",
		"#adb5bd",
		"#868e96",
		"#495057",
		"#343a40",
		"#212529"
	],
	red: [
		"#fff5f5",
		"#ffe3e3",
		"#ffc9c9",
		"#ffa8a8",
		"#ff8787",
		"#ff6b6b",
		"#fa5252",
		"#f03e3e",
		"#e03131",
		"#c92a2a"
	],
	pink: [
		"#fff0f6",
		"#ffdeeb",
		"#fcc2d7",
		"#faa2c1",
		"#f783ac",
		"#f06595",
		"#e64980",
		"#d6336c",
		"#c2255c",
		"#a61e4d"
	],
	grape: [
		"#f8f0fc",
		"#f3d9fa",
		"#eebefa",
		"#e599f7",
		"#da77f2",
		"#cc5de8",
		"#be4bdb",
		"#ae3ec9",
		"#9c36b5",
		"#862e9c"
	],
	violet: [
		"#f3f0ff",
		"#e5dbff",
		"#d0bfff",
		"#b197fc",
		"#9775fa",
		"#845ef7",
		"#7950f2",
		"#7048e8",
		"#6741d9",
		"#5f3dc4"
	],
	indigo: [
		"#edf2ff",
		"#dbe4ff",
		"#bac8ff",
		"#91a7ff",
		"#748ffc",
		"#5c7cfa",
		"#4c6ef5",
		"#4263eb",
		"#3b5bdb",
		"#364fc7"
	],
	blue: [
		"#e7f5ff",
		"#d0ebff",
		"#a5d8ff",
		"#74c0fc",
		"#4dabf7",
		"#339af0",
		"#228be6",
		"#1c7ed6",
		"#1971c2",
		"#1864ab"
	],
	cyan: [
		"#e3fafc",
		"#c5f6fa",
		"#99e9f2",
		"#66d9e8",
		"#3bc9db",
		"#22b8cf",
		"#15aabf",
		"#1098ad",
		"#0c8599",
		"#0b7285"
	],
	teal: [
		"#e6fcf5",
		"#c3fae8",
		"#96f2d7",
		"#63e6be",
		"#38d9a9",
		"#20c997",
		"#12b886",
		"#0ca678",
		"#099268",
		"#087f5b"
	],
	green: [
		"#ebfbee",
		"#d3f9d8",
		"#b2f2bb",
		"#8ce99a",
		"#69db7c",
		"#51cf66",
		"#40c057",
		"#37b24d",
		"#2f9e44",
		"#2b8a3e"
	],
	lime: [
		"#f4fce3",
		"#e9fac8",
		"#d8f5a2",
		"#c0eb75",
		"#a9e34b",
		"#94d82d",
		"#82c91e",
		"#74b816",
		"#66a80f",
		"#5c940d"
	],
	yellow: [
		"#fff9db",
		"#fff3bf",
		"#ffec99",
		"#ffe066",
		"#ffd43b",
		"#fcc419",
		"#fab005",
		"#f59f00",
		"#f08c00",
		"#e67700"
	],
	orange: [
		"#fff4e6",
		"#ffe8cc",
		"#ffd8a8",
		"#ffc078",
		"#ffa94d",
		"#ff922b",
		"#fd7e14",
		"#f76707",
		"#e8590c",
		"#d9480f"
	]
}, Nt = "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji", Pt = {
	scale: 1,
	fontSmoothing: !0,
	focusRing: "auto",
	white: "#fff",
	black: "#000",
	colors: Mt,
	primaryShade: {
		light: 6,
		dark: 8
	},
	primaryColor: "blue",
	variantColorResolver: pt,
	autoContrast: !1,
	luminanceThreshold: .3,
	fontFamily: Nt,
	fontFamilyMonospace: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
	respectReducedMotion: !1,
	cursorType: "default",
	defaultGradient: {
		from: "blue",
		to: "cyan",
		deg: 45
	},
	defaultRadius: "md",
	activeClassName: "mantine-active",
	focusClassName: "",
	headings: {
		fontFamily: Nt,
		fontWeight: "700",
		textWrap: "wrap",
		sizes: {
			h1: {
				fontSize: _(34),
				lineHeight: "1.3"
			},
			h2: {
				fontSize: _(26),
				lineHeight: "1.35"
			},
			h3: {
				fontSize: _(22),
				lineHeight: "1.4"
			},
			h4: {
				fontSize: _(18),
				lineHeight: "1.45"
			},
			h5: {
				fontSize: _(16),
				lineHeight: "1.5"
			},
			h6: {
				fontSize: _(14),
				lineHeight: "1.5"
			}
		}
	},
	fontSizes: {
		xs: _(12),
		sm: _(14),
		md: _(16),
		lg: _(18),
		xl: _(20)
	},
	lineHeights: {
		xs: "1.4",
		sm: "1.45",
		md: "1.55",
		lg: "1.6",
		xl: "1.65"
	},
	fontWeights: {
		regular: "400",
		medium: "600",
		bold: "700"
	},
	radius: {
		xs: _(2),
		sm: _(4),
		md: _(8),
		lg: _(16),
		xl: _(32)
	},
	spacing: {
		xs: _(10),
		sm: _(12),
		md: _(16),
		lg: _(20),
		xl: _(32)
	},
	breakpoints: {
		xs: "36em",
		sm: "48em",
		md: "62em",
		lg: "75em",
		xl: "88em"
	},
	shadows: {
		xs: `0 ${_(1)} ${_(3)} rgba(0, 0, 0, 0.05), 0 ${_(1)} ${_(2)} rgba(0, 0, 0, 0.1)`,
		sm: `0 ${_(1)} ${_(3)} rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0 ${_(10)} ${_(15)} ${_(-5)}, rgba(0, 0, 0, 0.04) 0 ${_(7)} ${_(7)} ${_(-5)}`,
		md: `0 ${_(1)} ${_(3)} rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0 ${_(20)} ${_(25)} ${_(-5)}, rgba(0, 0, 0, 0.04) 0 ${_(10)} ${_(10)} ${_(-5)}`,
		lg: `0 ${_(1)} ${_(3)} rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0 ${_(28)} ${_(23)} ${_(-7)}, rgba(0, 0, 0, 0.04) 0 ${_(12)} ${_(12)} ${_(-7)}`,
		xl: `0 ${_(1)} ${_(3)} rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0 ${_(36)} ${_(28)} ${_(-7)}, rgba(0, 0, 0, 0.04) 0 ${_(17)} ${_(17)} ${_(-7)}`
	},
	other: {},
	components: {}
}, Ft = "[@mantine/core] MantineProvider: Invalid theme.primaryColor, it accepts only key of theme.colors, learn more – https://mantine.dev/theming/colors/#primary-color", It = "[@mantine/core] MantineProvider: Invalid theme.primaryShade, it accepts only 0-9 integers or an object { light: 0-9, dark: 0-9 }";
function Lt(e) {
	return e < 0 || e > 9 ? !1 : parseInt(e.toString(), 10) === e;
}
function Rt(e) {
	if (!(e.primaryColor in e.colors)) throw Error(Ft);
	if (typeof e.primaryShade == "object" && (!Lt(e.primaryShade.dark) || !Lt(e.primaryShade.light)) || typeof e.primaryShade == "number" && !Lt(e.primaryShade)) throw Error(It);
}
function zt(e, t) {
	if (!t) return Rt(e), e;
	let n = d(e, t);
	return t.fontFamily && !t.headings?.fontFamily && (n.headings = {
		...n.headings,
		fontFamily: t.fontFamily
	}), Rt(n), n;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/MantineThemeProvider/MantineThemeProvider.mjs
var V = jt(), Bt = (0, C.createContext)(null), Vt = () => (0, C.use)(Bt) || Pt;
function Ht() {
	let e = (0, C.use)(Bt);
	if (!e) throw Error("@mantine/core: MantineProvider was not found in component tree, make sure you have it in your app");
	return e;
}
function Ut({ theme: e, children: t, inherit: n = !0 }) {
	let r = Vt(), i = (0, C.useMemo)(() => zt(n ? r : Pt, e), [
		e,
		r,
		n
	]);
	return /* @__PURE__ */ (0, V.jsx)(Bt, {
		value: i,
		children: t
	});
}
Ut.displayName = "@mantine/core/MantineThemeProvider";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/convert-css-variables/css-variables-object-to-string.mjs
function Wt(e) {
	return Object.entries(e).map(([e, t]) => `${e}: ${t};`).join("");
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/convert-css-variables/convert-css-variables.mjs
function Gt(e, t) {
	let n = t ? [t] : [":root", ":host"], r = Wt(e.variables), i = r ? `${n.join(", ")}{${r}}` : "", a = Wt(e.dark), o = Wt(e.light), s = (e) => n.map((t) => t === ":host" ? `${t}([data-mantine-color-scheme="${e}"])` : `${t}[data-mantine-color-scheme="${e}"]`).join(", ");
	return `${i}\n\n${a ? `${s("dark")}{${a}}` : ""}\n\n${o ? `${s("light")}{${o}}` : ""}`;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/MantineCssVariables/get-css-color-variables.mjs
function Kt({ theme: e, color: t, colorScheme: n, name: r = t, withColorValues: i = !0 }) {
	if (!e.colors[t]) return {};
	if (n === "light") {
		let n = Xe(e, "light"), a = {
			[`--mantine-color-${r}-text`]: `var(--mantine-color-${r}-filled)`,
			[`--mantine-color-${r}-filled`]: `var(--mantine-color-${r}-${n})`,
			[`--mantine-color-${r}-filled-hover`]: `var(--mantine-color-${r}-${n === 9 ? 8 : n + 1})`,
			[`--mantine-color-${r}-light`]: `var(--mantine-color-${r}-1)`,
			[`--mantine-color-${r}-light-hover`]: `var(--mantine-color-${r}-2)`,
			[`--mantine-color-${r}-light-color`]: `var(--mantine-color-${r}-9)`,
			[`--mantine-color-${r}-outline`]: `var(--mantine-color-${r}-${n})`,
			[`--mantine-color-${r}-outline-hover`]: ft(e.colors[t][n], .05)
		};
		return i ? {
			[`--mantine-color-${r}-0`]: e.colors[t][0],
			[`--mantine-color-${r}-1`]: e.colors[t][1],
			[`--mantine-color-${r}-2`]: e.colors[t][2],
			[`--mantine-color-${r}-3`]: e.colors[t][3],
			[`--mantine-color-${r}-4`]: e.colors[t][4],
			[`--mantine-color-${r}-5`]: e.colors[t][5],
			[`--mantine-color-${r}-6`]: e.colors[t][6],
			[`--mantine-color-${r}-7`]: e.colors[t][7],
			[`--mantine-color-${r}-8`]: e.colors[t][8],
			[`--mantine-color-${r}-9`]: e.colors[t][9],
			...a
		} : a;
	}
	let a = Xe(e, "dark"), o = {
		[`--mantine-color-${r}-text`]: `var(--mantine-color-${r}-4)`,
		[`--mantine-color-${r}-filled`]: `var(--mantine-color-${r}-${a})`,
		[`--mantine-color-${r}-filled-hover`]: `var(--mantine-color-${r}-${a === 9 ? 8 : a + 1})`,
		[`--mantine-color-${r}-light`]: lt(e.colors[t][9], .5),
		[`--mantine-color-${r}-light-hover`]: lt(e.colors[t][9], .3),
		[`--mantine-color-${r}-light-color`]: `var(--mantine-color-${r}-0)`,
		[`--mantine-color-${r}-outline`]: `var(--mantine-color-${r}-${Math.max(a - 4, 0)})`,
		[`--mantine-color-${r}-outline-hover`]: ft(e.colors[t][Math.max(a - 4, 0)], .05)
	};
	return i ? {
		[`--mantine-color-${r}-0`]: e.colors[t][0],
		[`--mantine-color-${r}-1`]: e.colors[t][1],
		[`--mantine-color-${r}-2`]: e.colors[t][2],
		[`--mantine-color-${r}-3`]: e.colors[t][3],
		[`--mantine-color-${r}-4`]: e.colors[t][4],
		[`--mantine-color-${r}-5`]: e.colors[t][5],
		[`--mantine-color-${r}-6`]: e.colors[t][6],
		[`--mantine-color-${r}-7`]: e.colors[t][7],
		[`--mantine-color-${r}-8`]: e.colors[t][8],
		[`--mantine-color-${r}-9`]: e.colors[t][9],
		...o
	} : o;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/MantineCssVariables/default-css-variables-resolver.mjs
function qt(e, t, n) {
	l(t).forEach((r) => Object.assign(e, { [`--mantine-${n}-${r}`]: t[r] }));
}
var Jt = (e) => {
	let t = Xe(e, "light"), n = e.defaultRadius in e.radius ? e.radius[e.defaultRadius] : _(e.defaultRadius), r = {
		variables: {
			"--mantine-z-index-app": "100",
			"--mantine-z-index-modal": "200",
			"--mantine-z-index-popover": "300",
			"--mantine-z-index-overlay": "400",
			"--mantine-z-index-max": "9999",
			"--mantine-scale": e.scale.toString(),
			"--mantine-cursor-type": e.cursorType,
			"--mantine-webkit-font-smoothing": e.fontSmoothing ? "antialiased" : "unset",
			"--mantine-moz-font-smoothing": e.fontSmoothing ? "grayscale" : "unset",
			"--mantine-color-white": e.white,
			"--mantine-color-black": e.black,
			"--mantine-line-height": e.lineHeights.md,
			"--mantine-font-family": e.fontFamily,
			"--mantine-font-family-monospace": e.fontFamilyMonospace,
			"--mantine-font-family-headings": e.headings.fontFamily,
			"--mantine-heading-font-weight": e.headings.fontWeight,
			"--mantine-heading-text-wrap": e.headings.textWrap,
			"--mantine-radius-default": n,
			"--mantine-primary-color-filled": `var(--mantine-color-${e.primaryColor}-filled)`,
			"--mantine-primary-color-filled-hover": `var(--mantine-color-${e.primaryColor}-filled-hover)`,
			"--mantine-primary-color-light": `var(--mantine-color-${e.primaryColor}-light)`,
			"--mantine-primary-color-light-hover": `var(--mantine-color-${e.primaryColor}-light-hover)`,
			"--mantine-primary-color-light-color": `var(--mantine-color-${e.primaryColor}-light-color)`
		},
		light: {
			"--mantine-color-scheme": "light",
			"--mantine-primary-color-contrast": gt(e, "light"),
			"--mantine-color-bright": "var(--mantine-color-black)",
			"--mantine-color-text": e.black,
			"--mantine-color-body": e.white,
			"--mantine-color-error": "var(--mantine-color-red-6)",
			"--mantine-color-success": "var(--mantine-color-teal-8)",
			"--mantine-color-placeholder": "var(--mantine-color-gray-5)",
			"--mantine-color-anchor": `var(--mantine-color-${e.primaryColor}-${t})`,
			"--mantine-color-default": "var(--mantine-color-white)",
			"--mantine-color-default-hover": "var(--mantine-color-gray-0)",
			"--mantine-color-default-color": "var(--mantine-color-black)",
			"--mantine-color-default-border": "var(--mantine-color-gray-4)",
			"--mantine-color-dimmed": "var(--mantine-color-gray-6)",
			"--mantine-color-disabled": "var(--mantine-color-gray-2)",
			"--mantine-color-disabled-color": "var(--mantine-color-gray-5)",
			"--mantine-color-disabled-border": "var(--mantine-color-gray-3)"
		},
		dark: {
			"--mantine-color-scheme": "dark",
			"--mantine-primary-color-contrast": gt(e, "dark"),
			"--mantine-color-bright": "var(--mantine-color-white)",
			"--mantine-color-text": "var(--mantine-color-dark-0)",
			"--mantine-color-body": "var(--mantine-color-dark-7)",
			"--mantine-color-error": "var(--mantine-color-red-8)",
			"--mantine-color-success": "var(--mantine-color-teal-8)",
			"--mantine-color-placeholder": "var(--mantine-color-dark-3)",
			"--mantine-color-anchor": `var(--mantine-color-${e.primaryColor}-4)`,
			"--mantine-color-default": "var(--mantine-color-dark-6)",
			"--mantine-color-default-hover": "var(--mantine-color-dark-5)",
			"--mantine-color-default-color": "var(--mantine-color-white)",
			"--mantine-color-default-border": "var(--mantine-color-dark-4)",
			"--mantine-color-dimmed": "var(--mantine-color-dark-2)",
			"--mantine-color-disabled": "var(--mantine-color-dark-6)",
			"--mantine-color-disabled-color": "var(--mantine-color-dark-3)",
			"--mantine-color-disabled-border": "var(--mantine-color-dark-4)"
		}
	};
	qt(r.variables, e.breakpoints, "breakpoint"), qt(r.variables, e.spacing, "spacing"), qt(r.variables, e.fontSizes, "font-size"), qt(r.variables, e.lineHeights, "line-height"), qt(r.variables, e.shadows, "shadow"), qt(r.variables, e.radius, "radius"), qt(r.variables, e.fontWeights, "font-weight"), e.colors[e.primaryColor].forEach((t, n) => {
		r.variables[`--mantine-primary-color-${n}`] = `var(--mantine-color-${e.primaryColor}-${n})`;
	}), l(e.colors).forEach((t) => {
		let n = e.colors[t];
		if (ct(n)) {
			Object.assign(r.light, Kt({
				theme: e,
				name: n.name,
				color: n.light,
				colorScheme: "light",
				withColorValues: !0
			})), Object.assign(r.dark, Kt({
				theme: e,
				name: n.name,
				color: n.dark,
				colorScheme: "dark",
				withColorValues: !0
			})), r.light[`--mantine-color-${n.name}-contrast`] = ht(n, e, "light"), r.dark[`--mantine-color-${n.name}-contrast`] = ht(n, e, "dark");
			return;
		}
		n.forEach((e, n) => {
			r.variables[`--mantine-color-${t}-${n}`] = e;
		}), Object.assign(r.light, Kt({
			theme: e,
			color: t,
			colorScheme: "light",
			withColorValues: !1
		})), Object.assign(r.dark, Kt({
			theme: e,
			color: t,
			colorScheme: "dark",
			withColorValues: !1
		}));
	});
	let i = e.headings.sizes;
	return l(i).forEach((t) => {
		r.variables[`--mantine-${t}-font-size`] = i[t].fontSize, r.variables[`--mantine-${t}-line-height`] = i[t].lineHeight, r.variables[`--mantine-${t}-font-weight`] = i[t].fontWeight || e.headings.fontWeight;
	}), r;
};
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/MantineClasses/MantineClasses.mjs
function Yt() {
	let e = Ht(), t = xt(), n = l(e.breakpoints).reduce((t, n) => {
		let r = e.breakpoints[n].includes("px"), i = m(e.breakpoints[n]);
		return `${t}@media (max-width: ${r ? `${i - .1}px` : v(i - .1)}) {.mantine-visible-from-${n} {display: none !important;}}@media (min-width: ${r ? `${i}px` : v(i)}) {.mantine-hidden-from-${n} {display: none !important;}}`;
	}, "");
	return /* @__PURE__ */ (0, V.jsx)("style", {
		"data-mantine-styles": "classes",
		nonce: t?.(),
		dangerouslySetInnerHTML: { __html: n }
	});
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/MantineCssVariables/get-merged-variables.mjs
function Xt({ theme: e, generator: t }) {
	let n = Jt(e), r = t?.(e);
	return r ? d(n, r) : n;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/MantineCssVariables/remove-default-variables.mjs
var Zt = Jt(Pt);
function Qt(e) {
	let t = {
		variables: {},
		light: {},
		dark: {}
	};
	return l(e.variables).forEach((n) => {
		Zt.variables[n] !== e.variables[n] && (t.variables[n] = e.variables[n]);
	}), l(e.light).forEach((n) => {
		Zt.light[n] !== e.light[n] && (t.light[n] = e.light[n]);
	}), l(e.dark).forEach((n) => {
		Zt.dark[n] !== e.dark[n] && (t.dark[n] = e.dark[n]);
	}), t;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/MantineCssVariables/MantineCssVariables.mjs
function $t(e) {
	return Gt({
		variables: {},
		dark: { "--mantine-color-scheme": "dark" },
		light: { "--mantine-color-scheme": "light" }
	}, e);
}
function en({ cssVariablesSelector: e, deduplicateCssVariables: t }) {
	let n = Ht(), r = xt(), i = Xt({
		theme: n,
		generator: yt()
	}), a = (e === void 0 || e === ":root" || e === ":host") && t, o = Gt(a ? Qt(i) : i, e);
	return o ? /* @__PURE__ */ (0, V.jsx)("style", {
		"data-mantine-styles": !0,
		nonce: r?.(),
		dangerouslySetInnerHTML: { __html: `${o}${a ? "" : $t(e)}` }
	}) : null;
}
en.displayName = "@mantine/CssVariables";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/use-respect-reduce-motion/use-respect-reduce-motion.mjs
function tn({ respectReducedMotion: e, getRootElement: t }) {
	ue(() => {
		e && t()?.setAttribute("data-respect-reduced-motion", "true");
	}, [e]);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/MantineProvider.mjs
function nn({ theme: e, children: t, getStyleNonce: n, withStaticClasses: r = !0, withGlobalClasses: i = !0, deduplicateCssVariables: a = !0, withCssVariables: o = !0, cssVariablesSelector: s, classNamesPrefix: c = "mantine", colorSchemeManager: l = Ye(), defaultColorScheme: u = "light", getRootElement: d = () => document.documentElement, cssVariablesResolver: f, forceColorScheme: p, stylesTransform: m, env: h, deduplicateInlineStyles: g = !1 }) {
	let { colorScheme: _, setColorScheme: v, clearColorScheme: y } = kt({
		defaultColorScheme: u,
		forceColorScheme: p,
		manager: l,
		getRootElement: d
	});
	return tn({
		respectReducedMotion: e?.respectReducedMotion || !1,
		getRootElement: d
	}), /* @__PURE__ */ (0, V.jsx)(_t, {
		value: {
			colorScheme: _,
			setColorScheme: v,
			clearColorScheme: y,
			getRootElement: d,
			classNamesPrefix: c,
			getStyleNonce: n,
			cssVariablesResolver: f,
			cssVariablesSelector: s ?? ":root",
			withStaticClasses: r,
			stylesTransform: m,
			env: h,
			deduplicateInlineStyles: g
		},
		children: /* @__PURE__ */ (0, V.jsxs)(Ut, {
			theme: e,
			children: [
				o && /* @__PURE__ */ (0, V.jsx)(en, {
					cssVariablesSelector: s,
					deduplicateCssVariables: a
				}),
				i && /* @__PURE__ */ (0, V.jsx)(Yt, {}),
				t
			]
		})
	});
}
nn.displayName = "@mantine/core/MantineProvider";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/use-props/use-props.mjs
function H(e, t, n) {
	let r = Ht(), i = (Array.isArray(e) ? e : [e]).filter(Boolean), a = {};
	for (let e of i) {
		let t = r.components[e]?.defaultProps, n = typeof t == "function" ? t(r) : t;
		n && (a = {
			...a,
			...n
		});
	}
	return {
		...t,
		...a,
		...y(n)
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/MantineProvider/create-theme/create-theme.mjs
function rn(e) {
	return e;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/styles-api/use-resolved-styles-api/use-resolved-styles-api.mjs
function an({ classNames: e, styles: t, props: n, stylesCtx: r }) {
	let i = Ht();
	return {
		resolvedClassNames: e === void 0 ? void 0 : Ke({
			theme: i,
			classNames: e,
			props: n,
			stylesCtx: r || void 0
		}),
		resolvedStyles: t === void 0 ? void 0 : qe({
			theme: i,
			styles: t,
			props: n,
			stylesCtx: r || void 0
		})
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/styles-api/use-styles/get-class-name/get-global-class-names/get-global-class-names.mjs
var on = {
	always: "mantine-focus-always",
	auto: "mantine-focus-auto",
	never: "mantine-focus-never"
};
function sn({ theme: e, options: t, unstyled: n }) {
	return Ue(t?.focusable && !n && (e.focusClassName || on[e.focusRing]), t?.active && !n && e.activeClassName);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/styles-api/use-styles/get-class-name/get-options-class-names/get-options-class-names.mjs
function cn({ selector: e, stylesCtx: t, options: n, props: r, theme: i }) {
	return Ke({
		theme: i,
		classNames: n?.classNames,
		props: n?.props || r,
		stylesCtx: t
	})[e];
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/styles-api/use-styles/get-class-name/get-resolved-class-names/get-resolved-class-names.mjs
function ln({ selector: e, stylesCtx: t, theme: n, classNames: r, props: i }) {
	return Ke({
		theme: n,
		classNames: r,
		props: i,
		stylesCtx: t
	})[e];
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/styles-api/use-styles/get-class-name/get-root-class-name/get-root-class-name.mjs
function un({ rootSelector: e, selector: t, className: n }) {
	return e === t ? n : void 0;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/styles-api/use-styles/get-class-name/get-selector-class-name/get-selector-class-name.mjs
function dn({ selector: e, classes: t, unstyled: n }) {
	return n ? void 0 : t[e];
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/styles-api/use-styles/get-class-name/get-static-class-names/get-static-class-names.mjs
function fn({ themeName: e, classNamesPrefix: t, selector: n, withStaticClass: r }) {
	return r === !1 ? [] : e.map((e) => `${t}-${e}-${n}`);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/styles-api/use-styles/get-class-name/get-variant-class-name/get-variant-class-name.mjs
function pn({ options: e, classes: t, selector: n, unstyled: r }) {
	return e?.variant && !r ? t[`${n}--${e.variant}`] : void 0;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/styles-api/use-styles/get-class-name/get-class-name.mjs
function mn({ theme: e, options: t, themeName: n, selector: r, classNamesPrefix: i, resolvedClassNames: a, resolvedThemeClassNames: o, classes: s, unstyled: c, className: l, rootSelector: u, props: d, stylesCtx: f, withStaticClasses: p, headless: m, transformedStyles: h }) {
	return Ue(sn({
		theme: e,
		options: t,
		unstyled: c || m
	}), o.map((e) => e[r]), pn({
		options: t,
		classes: s,
		selector: r,
		unstyled: c || m
	}), a[r], ln({
		selector: r,
		stylesCtx: f,
		theme: e,
		classNames: h,
		props: d
	}), cn({
		selector: r,
		stylesCtx: f,
		options: t,
		props: d,
		theme: e
	}), un({
		rootSelector: u,
		selector: r,
		className: l
	}), dn({
		selector: r,
		classes: s,
		unstyled: c || m
	}), p && !m && fn({
		themeName: n,
		classNamesPrefix: i,
		selector: r,
		withStaticClass: t?.withStaticClass
	}), t?.className);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/styles-api/use-styles/get-style/resolve-style/resolve-style.mjs
function hn({ style: e, theme: t }) {
	return Array.isArray(e) ? e.reduce((e, n) => ({
		...e,
		...hn({
			style: n,
			theme: t
		})
	}), {}) : typeof e == "function" ? e(t) : e ?? {};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/styles-api/use-styles/get-style/get-style.mjs
function gn({ theme: e, selector: t, options: n, props: r, stylesCtx: i, rootSelector: a, withStylesTransform: o, resolvedStyles: s, resolvedThemeStyles: c, resolvedVars: l, resolvedRootStyle: u }) {
	return {
		...c[t],
		...s[t],
		...!o && qe({
			theme: e,
			styles: n?.styles,
			props: n?.props || r,
			stylesCtx: i
		})[t],
		...l[t],
		...a === t ? u : null,
		...hn({
			style: n?.style,
			theme: e
		})
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/styles-api/use-styles/get-style/resolve-vars/merge-vars.mjs
function _n(e) {
	return e.reduce((e, t) => (t && Object.keys(t).forEach((n) => {
		e[n] = {
			...e[n],
			...y(t[n])
		};
	}), e), {});
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/styles-api/use-styles/use-transformed-styles.mjs
function vn({ props: e, stylesCtx: t, themeName: n, theme: r }) {
	let i = Tt()?.();
	return {
		getTransformedStyles: (a) => i ? [...a.map((n) => i(n, {
			props: e,
			theme: r,
			ctx: t
		})), ...n.map((n) => i(r.components[n]?.styles, {
			props: e,
			theme: r,
			ctx: t
		}))].filter(Boolean) : [],
		withStylesTransform: !!i
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/styles-api/use-styles/use-styles.mjs
function U({ name: e, classes: t, props: n, stylesCtx: r, className: i, style: a, rootSelector: o = "root", unstyled: s, classNames: c, styles: l, vars: u, varsResolver: d, attributes: f }) {
	let p = Ht(), m = bt(), h = St(), g = Ct(), _ = (Array.isArray(e) ? e : [e]).filter((e) => e), { withStylesTransform: v, getTransformedStyles: y } = vn({
		props: n,
		stylesCtx: r,
		themeName: _,
		theme: p
	}), b = Ke({
		theme: p,
		classNames: c,
		props: n,
		stylesCtx: r
	}), x = _.map((e) => Ke({
		theme: p,
		classNames: p.components[e]?.classNames,
		props: n,
		stylesCtx: r
	})), S = v ? {} : qe({
		theme: p,
		styles: l,
		props: n,
		stylesCtx: r
	}), C = {};
	if (!v) for (let e of _) {
		let t = qe({
			theme: p,
			styles: p.components[e]?.styles,
			props: n,
			stylesCtx: r
		});
		for (let e of Object.keys(t)) C[e] = {
			...C[e],
			...t[e]
		};
	}
	let w = _n([
		g ? {} : d?.(p, n, r),
		..._.map((e) => p.components?.[e]?.vars?.(p, n, r)),
		u?.(p, n, r)
	]), T = hn({
		style: a,
		theme: p
	});
	return (e, a) => ({
		...f?.[e],
		className: mn({
			theme: p,
			options: a,
			themeName: _,
			selector: e,
			classNamesPrefix: m,
			resolvedClassNames: b,
			resolvedThemeClassNames: x,
			classes: t,
			unstyled: s,
			className: i,
			rootSelector: o,
			props: n,
			stylesCtx: r,
			withStaticClasses: h,
			headless: g,
			transformedStyles: y([a?.styles, l])
		}),
		style: gn({
			theme: p,
			selector: e,
			options: a,
			props: n,
			stylesCtx: r,
			rootSelector: o,
			withStylesTransform: v,
			resolvedStyles: S,
			resolvedThemeStyles: C,
			resolvedVars: w,
			resolvedRootStyle: T
		})
	});
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/InlineStyles/css-object-to-string/css-object-to-string.mjs
function yn(e) {
	return l(e).reduce((t, n) => e[n] === void 0 ? t : `${t}${f(n)}:${e[n]};`, "").trim();
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/InlineStyles/styles-to-string/styles-to-string.mjs
function bn({ selector: e, styles: t, media: n, container: r }) {
	let i = t ? yn(t) : "", a = Array.isArray(n) ? n.map((t) => `@media${t.query}{${e}{${yn(t.styles)}}}`) : [], o = Array.isArray(r) ? r.map((t) => `@container ${t.query}{${e}{${yn(t.styles)}}}`) : [];
	return `${i ? `${e}{${i}}` : ""}${a.join("")}${o.join("")}`.trim();
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/InlineStyles/InlineStyles.mjs
function xn(e) {
	let t = 5381;
	for (let n = 0; n < e.length; n++) t = (t << 5) + t + e.charCodeAt(n) & 4294967295;
	return (t >>> 0).toString(36);
}
function Sn({ deduplicate: e, ...t }) {
	let n = xt(), r = bn(t);
	return e ? /* @__PURE__ */ (0, V.jsx)("style", {
		href: `mantine-${xn(r)}`,
		precedence: "mantine",
		nonce: n?.(),
		children: r
	}) : /* @__PURE__ */ (0, V.jsx)("style", {
		"data-mantine-styles": "inline",
		nonce: n?.(),
		dangerouslySetInnerHTML: { __html: r }
	});
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/InlineStyles/hash-styles.mjs
function Cn(e) {
	let t = 5381;
	for (let n = 0; n < e.length; n++) t = (t << 5) + t + e.charCodeAt(n) & 4294967295;
	return (t >>> 0).toString(36);
}
function wn(e, t) {
	return `__mdi__-${Cn(`${e ? yn(e) : ""}|${Array.isArray(t) ? t.map((e) => `${e.query}:${yn(e.styles)}`).join("|") : ""}`)}`;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/Box/style-props/extract-style-props/extract-style-props.mjs
function Tn(e) {
	let { m: t, mx: n, my: r, mt: i, mb: a, ml: o, mr: s, me: c, ms: l, mis: u, mie: d, p: f, px: p, py: m, pt: h, pb: g, pl: _, pr: v, pe: b, ps: x, pis: S, pie: C, bd: w, bdrs: T, bg: E, c: ee, opacity: D, ff: O, fz: k, fw: A, lts: j, ta: M, lh: N, fs: P, tt: te, td: ne, w: re, miw: F, maw: I, h: L, mih: ie, mah: ae, bgsz: oe, bgp: se, bgr: ce, bga: le, pos: ue, top: de, left: fe, bottom: pe, right: me, inset: he, display: R, flex: ge, hiddenFrom: _e, visibleFrom: ve, lightHidden: ye, darkHidden: be, sx: xe, ...Se } = e;
	return {
		styleProps: y({
			m: t,
			mx: n,
			my: r,
			mt: i,
			mb: a,
			ml: o,
			mr: s,
			me: c,
			ms: l,
			mis: u,
			mie: d,
			p: f,
			px: p,
			py: m,
			pt: h,
			pb: g,
			pl: _,
			pr: v,
			pis: S,
			pie: C,
			pe: b,
			ps: x,
			bd: w,
			bg: E,
			c: ee,
			opacity: D,
			ff: O,
			fz: k,
			fw: A,
			lts: j,
			ta: M,
			lh: N,
			fs: P,
			tt: te,
			td: ne,
			w: re,
			miw: F,
			maw: I,
			h: L,
			mih: ie,
			mah: ae,
			bgsz: oe,
			bgp: se,
			bgr: ce,
			bga: le,
			pos: ue,
			top: de,
			left: fe,
			bottom: pe,
			right: me,
			inset: he,
			display: R,
			flex: ge,
			bdrs: T,
			hiddenFrom: _e,
			visibleFrom: ve,
			lightHidden: ye,
			darkHidden: be,
			sx: xe
		}),
		rest: Se
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/Box/style-props/style-props-data.mjs
var En = {
	m: {
		type: "spacing",
		property: "margin"
	},
	mt: {
		type: "spacing",
		property: "marginTop"
	},
	mb: {
		type: "spacing",
		property: "marginBottom"
	},
	ml: {
		type: "spacing",
		property: "marginLeft"
	},
	mr: {
		type: "spacing",
		property: "marginRight"
	},
	ms: {
		type: "spacing",
		property: "marginInlineStart"
	},
	me: {
		type: "spacing",
		property: "marginInlineEnd"
	},
	mis: {
		type: "spacing",
		property: "marginInlineStart"
	},
	mie: {
		type: "spacing",
		property: "marginInlineEnd"
	},
	mx: {
		type: "spacing",
		property: "marginInline"
	},
	my: {
		type: "spacing",
		property: "marginBlock"
	},
	p: {
		type: "spacing",
		property: "padding"
	},
	pt: {
		type: "spacing",
		property: "paddingTop"
	},
	pb: {
		type: "spacing",
		property: "paddingBottom"
	},
	pl: {
		type: "spacing",
		property: "paddingLeft"
	},
	pr: {
		type: "spacing",
		property: "paddingRight"
	},
	ps: {
		type: "spacing",
		property: "paddingInlineStart"
	},
	pe: {
		type: "spacing",
		property: "paddingInlineEnd"
	},
	pis: {
		type: "spacing",
		property: "paddingInlineStart"
	},
	pie: {
		type: "spacing",
		property: "paddingInlineEnd"
	},
	px: {
		type: "spacing",
		property: "paddingInline"
	},
	py: {
		type: "spacing",
		property: "paddingBlock"
	},
	bd: {
		type: "border",
		property: "border"
	},
	bdrs: {
		type: "radius",
		property: "borderRadius"
	},
	bg: {
		type: "color",
		property: "background"
	},
	c: {
		type: "textColor",
		property: "color"
	},
	opacity: {
		type: "identity",
		property: "opacity"
	},
	ff: {
		type: "fontFamily",
		property: "fontFamily"
	},
	fz: {
		type: "fontSize",
		property: "fontSize"
	},
	fw: {
		type: "identity",
		property: "fontWeight"
	},
	lts: {
		type: "size",
		property: "letterSpacing"
	},
	ta: {
		type: "identity",
		property: "textAlign"
	},
	lh: {
		type: "lineHeight",
		property: "lineHeight"
	},
	fs: {
		type: "identity",
		property: "fontStyle"
	},
	tt: {
		type: "identity",
		property: "textTransform"
	},
	td: {
		type: "identity",
		property: "textDecoration"
	},
	w: {
		type: "spacing",
		property: "width"
	},
	miw: {
		type: "spacing",
		property: "minWidth"
	},
	maw: {
		type: "spacing",
		property: "maxWidth"
	},
	h: {
		type: "spacing",
		property: "height"
	},
	mih: {
		type: "spacing",
		property: "minHeight"
	},
	mah: {
		type: "spacing",
		property: "maxHeight"
	},
	bgsz: {
		type: "size",
		property: "backgroundSize"
	},
	bgp: {
		type: "identity",
		property: "backgroundPosition"
	},
	bgr: {
		type: "identity",
		property: "backgroundRepeat"
	},
	bga: {
		type: "identity",
		property: "backgroundAttachment"
	},
	pos: {
		type: "identity",
		property: "position"
	},
	top: {
		type: "size",
		property: "top"
	},
	left: {
		type: "size",
		property: "left"
	},
	bottom: {
		type: "size",
		property: "bottom"
	},
	right: {
		type: "size",
		property: "right"
	},
	inset: {
		type: "size",
		property: "inset"
	},
	display: {
		type: "identity",
		property: "display"
	},
	flex: {
		type: "identity",
		property: "flex"
	}
};
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/Box/style-props/resolvers/color-resolver/color-resolver.mjs
function Dn(e, t) {
	let n = ot({
		color: e,
		theme: t
	});
	return n.color === "dimmed" ? "var(--mantine-color-dimmed)" : n.color === "bright" ? "var(--mantine-color-bright)" : n.variable ? `var(${n.variable})` : n.color;
}
function On(e, t) {
	let n = ot({
		color: e,
		theme: t
	});
	return n.isThemeColor && n.shade === void 0 ? `var(--mantine-color-${n.color}-text)` : Dn(e, t);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/Box/style-props/resolvers/border-resolver/border-resolver.mjs
function kn(e, t) {
	if (typeof e == "number") return _(e);
	if (typeof e == "string") {
		let [n, r, ...i] = e.split(" ").filter((e) => e.trim() !== ""), a = `${_(n)}`;
		return r && (a += ` ${r}`), i.length > 0 && (a += ` ${Dn(i.join(" "), t)}`), a.trim();
	}
	return e;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/Box/style-props/resolvers/font-family-resolver/font-family-resolver.mjs
var An = {
	text: "var(--mantine-font-family)",
	mono: "var(--mantine-font-family-monospace)",
	monospace: "var(--mantine-font-family-monospace)",
	heading: "var(--mantine-font-family-headings)",
	headings: "var(--mantine-font-family-headings)"
};
function jn(e) {
	return typeof e == "string" && e in An ? An[e] : e;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/Box/style-props/resolvers/font-size-resolver/font-size-resolver.mjs
var Mn = [
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6"
];
function Nn(e, t) {
	return typeof e == "string" && e in t.fontSizes ? `var(--mantine-font-size-${e})` : typeof e == "string" && Mn.includes(e) ? `var(--mantine-${e}-font-size)` : typeof e == "number" || typeof e == "string" ? _(e) : e;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/Box/style-props/resolvers/identity-resolver/identity-resolver.mjs
function Pn(e) {
	return e;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/Box/style-props/resolvers/line-height-resolver/line-height-resolver.mjs
var Fn = [
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6"
];
function In(e, t) {
	return typeof e == "string" && e in t.lineHeights ? `var(--mantine-line-height-${e})` : typeof e == "string" && Fn.includes(e) ? `var(--mantine-${e}-line-height)` : e;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/Box/style-props/resolvers/radius-resolver/radius-resolver.mjs
function Ln(e, t) {
	return typeof e == "string" && e in t.radius ? `var(--mantine-radius-${e})` : typeof e == "number" || typeof e == "string" ? _(e) : e;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/Box/style-props/resolvers/size-resolver/size-resolver.mjs
function Rn(e) {
	return typeof e == "number" ? _(e) : e;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/Box/style-props/resolvers/spacing-resolver/spacing-resolver.mjs
function zn(e, t) {
	if (typeof e == "number") return _(e);
	if (typeof e == "string") {
		let n = e.replace("-", "");
		if (!(n in t.spacing)) return _(e);
		let r = `--mantine-spacing-${n}`;
		return e.startsWith("-") ? `calc(var(${r}) * -1)` : `var(${r})`;
	}
	return e;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/Box/style-props/resolvers/index.mjs
var Bn = {
	color: Dn,
	textColor: On,
	fontSize: Nn,
	spacing: zn,
	radius: Ln,
	identity: Pn,
	size: Rn,
	lineHeight: In,
	fontFamily: jn,
	border: kn
};
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/Box/style-props/parse-style-props/sort-media-queries.mjs
function Vn(e) {
	return e.replace("(min-width: ", "").replace("em)", "");
}
function Hn({ media: e, ...t }) {
	let n = Object.keys(e).sort((e, t) => Number(Vn(e)) - Number(Vn(t))).map((t) => ({
		query: t,
		styles: e[t]
	}));
	return {
		...t,
		media: n
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/Box/style-props/parse-style-props/parse-style-props.mjs
function Un(e) {
	if (typeof e != "object" || !e) return !1;
	let t = Object.keys(e);
	return t.length !== 1 || t[0] !== "base";
}
function Wn(e) {
	return typeof e == "object" && e ? "base" in e ? e.base : void 0 : e;
}
function Gn(e) {
	return typeof e == "object" && e ? l(e).filter((e) => e !== "base") : [];
}
function Kn(e, t) {
	return typeof e == "object" && e && t in e ? e[t] : e;
}
function qn({ styleProps: e, data: t, theme: n }) {
	return Hn(l(e).reduce((r, i) => {
		if (i === "hiddenFrom" || i === "visibleFrom" || i === "sx") return r;
		let a = t[i], o = Array.isArray(a.property) ? a.property : [a.property], s = Wn(e[i]);
		if (!Un(e[i])) return o.forEach((e) => {
			r.inlineStyles[e] = Bn[a.type](s, n);
		}), r;
		r.hasResponsiveStyles = !0;
		let c = Gn(e[i]);
		return o.forEach((t) => {
			s != null && (r.styles[t] = Bn[a.type](s, n)), c.forEach((o) => {
				let s = `(min-width: ${n.breakpoints[o]})`;
				r.media[s] = {
					...r.media[s],
					[t]: Bn[a.type](Kn(e[i], o), n)
				};
			});
		}), r;
	}, {
		hasResponsiveStyles: !1,
		styles: {},
		inlineStyles: {},
		media: {}
	}));
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/Box/use-random-classname/use-random-classname.mjs
function Jn() {
	return `__m__-${(0, C.useId)().replace(/[:«»]/g, "")}`;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/factory/create-polymorphic-component.mjs
function Yn(e) {
	return e;
}
var Xn = Yn;
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/factory/factory.mjs
function Zn(e) {
	return e;
}
function W(e) {
	let t = e;
	return t.extend = Zn, t.withProps = (e) => {
		let n = (n) => /* @__PURE__ */ (0, V.jsx)(t, {
			...e,
			...n
		});
		return n.extend = t.extend, n.displayName = `WithProps(${t.displayName})`, n;
	}, t;
}
function Qn(e) {
	return W(e);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/factory/polymorphic-factory.mjs
function $n(e) {
	let t = e;
	return t.withProps = (e) => {
		let n = (n) => /* @__PURE__ */ (0, V.jsx)(t, {
			...e,
			...n
		});
		return n.extend = t.extend, n.displayName = `WithProps(${t.displayName})`, n;
	}, t.extend = Zn, t;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/Box/get-box-mod/get-box-mod.mjs
function er(e) {
	return `data-${(e.startsWith("data-") ? e.slice(5) : e).replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`;
}
function tr(e) {
	return Object.keys(e).reduce((t, n) => {
		let r = e[n];
		return r === void 0 || r === "" || r === !1 || r === null || (t[er(n)] = e[n]), t;
	}, {});
}
function nr(e) {
	return e ? typeof e == "string" ? { [er(e)]: !0 } : Array.isArray(e) ? [...e].reduce((e, t) => ({
		...e,
		...nr(t)
	}), {}) : tr(e) : null;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/Box/get-box-style/get-box-style.mjs
function rr(e, t) {
	return Array.isArray(e) ? [...e].reduce((e, n) => ({
		...e,
		...rr(n, t)
	}), {}) : typeof e == "function" ? e(t) : e ?? {};
}
function ir({ theme: e, style: t, vars: n, styleProps: r }) {
	let i = rr(t, e), a = rr(n, e);
	return {
		...i,
		...a,
		...r
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/core/Box/Box.mjs
function ar({ component: e, style: t, __vars: n, className: r, variant: i, mod: a, size: o, hiddenFrom: s, visibleFrom: c, lightHidden: l, darkHidden: u, renderRoot: d, __size: f, ref: p, ...m }) {
	let h = Ht(), g = e || "div", { styleProps: _, rest: v } = Tn(m), y = wt()?.()?.(_.sx), x = Jn(), S = qn({
		styleProps: _,
		theme: h,
		data: En
	}), C = Dt(), w = C && S.hasResponsiveStyles ? wn(S.styles, S.media) : x, T = {
		ref: p,
		style: ir({
			theme: h,
			style: t,
			vars: n,
			styleProps: S.inlineStyles
		}),
		className: Ue(r, y, {
			[w]: S.hasResponsiveStyles,
			"mantine-light-hidden": l,
			"mantine-dark-hidden": u,
			[`mantine-hidden-from-${s}`]: s,
			[`mantine-visible-from-${c}`]: c
		}),
		"data-variant": i,
		"data-size": b(o) ? void 0 : o || void 0,
		size: f,
		...nr(a),
		...v
	};
	return /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [S.hasResponsiveStyles && /* @__PURE__ */ (0, V.jsx)(Sn, {
		selector: `.${w}`,
		styles: S.styles,
		media: S.media,
		deduplicate: C
	}), typeof d == "function" ? d(T) : /* @__PURE__ */ (0, V.jsx)(g, { ...T })] });
}
ar.displayName = "@mantine/core/Box";
var G = Xn(ar), or = (0, C.createContext)({
	dir: "ltr",
	toggleDirection: () => {},
	setDirection: () => {}
});
function sr() {
	return (0, C.use)(or);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/ScrollArea.context.mjs
var [cr, lr] = T("ScrollArea.Root component was not found in tree");
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/use-resize-observer.mjs
function ur(e, t) {
	let n = (0, C.useEffectEvent)(t);
	ue(() => {
		let t = 0;
		if (e) {
			let r = new ResizeObserver(() => {
				cancelAnimationFrame(t), t = window.requestAnimationFrame(n);
			});
			return r.observe(e), () => {
				window.cancelAnimationFrame(t), r.unobserve(e);
			};
		}
	}, [e]);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/ScrollAreaCorner/ScrollAreaCorner.mjs
function dr(e) {
	let { style: t, ...n } = e, r = lr(), [i, a] = (0, C.useState)(0), [o, s] = (0, C.useState)(0), c = !!(i && o);
	return ur(r.scrollbarX, () => {
		let e = r.scrollbarX?.offsetHeight || 0;
		r.onCornerHeightChange(e), s(e);
	}), ur(r.scrollbarY, () => {
		let e = r.scrollbarY?.offsetWidth || 0;
		r.onCornerWidthChange(e), a(e);
	}), c ? /* @__PURE__ */ (0, V.jsx)("div", {
		...n,
		style: {
			...t,
			width: i,
			height: o
		}
	}) : null;
}
function fr(e) {
	let t = lr(), n = !!(t.scrollbarX && t.scrollbarY);
	return t.type !== "scroll" && n ? /* @__PURE__ */ (0, V.jsx)(dr, { ...e }) : null;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/ScrollAreaRoot/ScrollAreaRoot.mjs
var pr = {
	scrollHideDelay: 1e3,
	type: "hover"
};
function mr(e) {
	let { type: t, scrollHideDelay: n, scrollbars: r, getStyles: i, ref: a, ...o } = H("ScrollAreaRoot", pr, e), [s, c] = (0, C.useState)(null), [l, u] = (0, C.useState)(null), [d, f] = (0, C.useState)(null), [p, m] = (0, C.useState)(null), [h, g] = (0, C.useState)(null), [_, v] = (0, C.useState)(0), [y, b] = (0, C.useState)(0), [x, S] = (0, C.useState)(!1), [w, T] = (0, C.useState)(!1), E = Te(a, c);
	return /* @__PURE__ */ (0, V.jsx)(cr, {
		value: {
			type: t,
			scrollHideDelay: n,
			scrollArea: s,
			viewport: l,
			onViewportChange: u,
			content: d,
			onContentChange: f,
			scrollbarX: p,
			onScrollbarXChange: m,
			scrollbarXEnabled: x,
			onScrollbarXEnabledChange: S,
			scrollbarY: h,
			onScrollbarYChange: g,
			scrollbarYEnabled: w,
			onScrollbarYEnabledChange: T,
			onCornerWidthChange: v,
			onCornerHeightChange: b,
			getStyles: i
		},
		children: /* @__PURE__ */ (0, V.jsx)(G, {
			...o,
			ref: E,
			__vars: {
				"--sa-corner-width": r === "xy" ? `${_}px` : "0px",
				"--sa-corner-height": r === "xy" ? `${y}px` : "0px"
			}
		})
	});
}
mr.displayName = "@mantine/core/ScrollAreaRoot";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/utils/get-thumb-ratio.mjs
function hr(e, t) {
	let n = e / t;
	return Number.isNaN(n) ? 0 : n;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/utils/get-thumb-size.mjs
function gr(e) {
	let t = hr(e.viewport, e.content), n = e.scrollbar.paddingStart + e.scrollbar.paddingEnd, r = (e.scrollbar.size - n) * t;
	return Math.max(r, 18);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/utils/linear-scale.mjs
function _r(e, t) {
	return (n) => {
		if (e[0] === e[1] || t[0] === t[1]) return t[0];
		let r = (t[1] - t[0]) / (e[1] - e[0]);
		return t[0] + r * (n - e[0]);
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/utils/get-thumb-offset-from-scroll.mjs
function vr(e, [t, n]) {
	return Math.min(n, Math.max(t, e));
}
function yr(e, t, n = "ltr") {
	let r = gr(t), i = t.scrollbar.paddingStart + t.scrollbar.paddingEnd, a = t.scrollbar.size - i, o = t.content - t.viewport, s = a - r, c = vr(e, n === "ltr" ? [0, o] : [o * -1, 0]);
	return _r([0, o], [0, s])(c);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/utils/get-scroll-position-from-pointer.mjs
function br(e, t, n, r = "ltr") {
	let i = gr(n), a = i / 2, o = t || a, s = i - o, c = n.scrollbar.paddingStart + o, l = n.scrollbar.size - n.scrollbar.paddingEnd - s, u = n.content - n.viewport, d = r === "ltr" ? [0, u] : [u * -1, 0];
	return _r([c, l], d)(e);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/utils/is-scrolling-within-scrollbar-bounds.mjs
function xr(e, t) {
	return e > 0 && e < t;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/utils/to-int.mjs
function Sr(e) {
	return e ? parseInt(e, 10) : 0;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/utils/compose-event-handlers.mjs
function Cr(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
	return (r) => {
		e?.(r), (n === !1 || !r.defaultPrevented) && t?.(r);
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/ScrollAreaScrollbar/Scrollbar.context.mjs
var [wr, Tr] = T("ScrollAreaScrollbar was not found in tree");
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/ScrollAreaScrollbar/Scrollbar.mjs
function Er(e) {
	let { sizes: t, hasThumb: n, onThumbChange: r, onThumbPointerUp: i, onThumbPointerDown: a, onThumbPositionChange: o, onDragScroll: s, onWheelScroll: c, onResize: l, ref: u, ...d } = e, f = lr(), [p, m] = (0, C.useState)(null), h = Te(u, m), g = (0, C.useRef)(null), _ = (0, C.useRef)(""), { viewport: v } = f, y = t.content - t.viewport, b = (0, C.useEffectEvent)(c), x = ie(o), S = ae(l, 10), w = (e) => {
		if (g.current) {
			let t = e.clientX - g.current.left, n = e.clientY - g.current.top;
			s({
				x: t,
				y: n
			});
		}
	};
	return (0, C.useEffect)(() => {
		let e = (e) => {
			let t = e.target;
			p?.contains(t) && b(e, y);
		};
		return document.addEventListener("wheel", e, { passive: !1 }), () => document.removeEventListener("wheel", e, { passive: !1 });
	}, [
		v,
		p,
		y
	]), (0, C.useEffect)(x, [t, x]), ur(p, S), ur(f.content, S), /* @__PURE__ */ (0, V.jsx)(wr, {
		value: {
			scrollbar: p,
			hasThumb: n,
			onThumbChange: ie(r),
			onThumbPointerUp: ie(i),
			onThumbPositionChange: x,
			onThumbPointerDown: ie(a)
		},
		children: /* @__PURE__ */ (0, V.jsx)("div", {
			...d,
			ref: h,
			"data-mantine-scrollbar": !0,
			style: {
				position: "absolute",
				...d.style
			},
			onPointerDown: Cr(e.onPointerDown, (e) => {
				e.preventDefault(), e.button === 0 && (e.target.setPointerCapture(e.pointerId), g.current = p.getBoundingClientRect(), _.current = document.body.style.webkitUserSelect, document.body.style.webkitUserSelect = "none", w(e));
			}),
			onPointerMove: Cr(e.onPointerMove, w),
			onPointerUp: Cr(e.onPointerUp, (e) => {
				let t = e.target;
				t.hasPointerCapture(e.pointerId) && (e.preventDefault(), t.releasePointerCapture(e.pointerId));
			}),
			onLostPointerCapture: () => {
				document.body.style.webkitUserSelect = _.current, g.current = null;
			}
		})
	});
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/ScrollAreaScrollbar/ScrollbarX.mjs
var Dr = (e) => {
	let { sizes: t, onSizesChange: n, style: r, ref: i, ...a } = e, o = lr(), [s, c] = (0, C.useState)(), l = (0, C.useRef)(null), u = Te(i, l, o.onScrollbarXChange);
	return (0, C.useEffect)(() => {
		l.current && c(getComputedStyle(l.current));
	}, [l]), /* @__PURE__ */ (0, V.jsx)(Er, {
		"data-orientation": "horizontal",
		...a,
		ref: u,
		sizes: t,
		style: {
			...r,
			"--sa-thumb-width": `${gr(t)}px`
		},
		onThumbPointerDown: (t) => e.onThumbPointerDown(t.x),
		onDragScroll: (t) => e.onDragScroll(t.x),
		onWheelScroll: (t, n) => {
			if (o.viewport) {
				let r = o.viewport.scrollLeft + t.deltaX;
				e.onWheelScroll(r), xr(r, n) && t.preventDefault();
			}
		},
		onResize: () => {
			l.current && o.viewport && s && n({
				content: o.viewport.scrollWidth,
				viewport: o.viewport.offsetWidth,
				scrollbar: {
					size: l.current.clientWidth,
					paddingStart: Sr(s.paddingLeft),
					paddingEnd: Sr(s.paddingRight)
				}
			});
		}
	});
};
Dr.displayName = "@mantine/core/ScrollAreaScrollbarX";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/ScrollAreaScrollbar/ScrollbarY.mjs
function Or(e) {
	let { sizes: t, onSizesChange: n, style: r, ref: i, ...a } = e, o = lr(), [s, c] = (0, C.useState)(), l = (0, C.useRef)(null), u = Te(i, l, o.onScrollbarYChange);
	return (0, C.useEffect)(() => {
		l.current && c(window.getComputedStyle(l.current));
	}, []), /* @__PURE__ */ (0, V.jsx)(Er, {
		...a,
		"data-orientation": "vertical",
		ref: u,
		sizes: t,
		style: {
			"--sa-thumb-height": `${gr(t)}px`,
			...r
		},
		onThumbPointerDown: (t) => e.onThumbPointerDown(t.y),
		onDragScroll: (t) => e.onDragScroll(t.y),
		onWheelScroll: (t, n) => {
			if (o.viewport) {
				let r = o.viewport.scrollTop + t.deltaY;
				e.onWheelScroll(r), xr(r, n) && t.preventDefault();
			}
		},
		onResize: () => {
			l.current && o.viewport && s && n({
				content: o.viewport.scrollHeight,
				viewport: o.viewport.offsetHeight,
				scrollbar: {
					size: l.current.clientHeight,
					paddingStart: Sr(s.paddingTop),
					paddingEnd: Sr(s.paddingBottom)
				}
			});
		}
	});
}
Or.displayName = "@mantine/core/ScrollAreaScrollbarY";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/ScrollAreaScrollbar/ScrollAreaScrollbarVisible.mjs
function kr(e) {
	let { orientation: t = "vertical", ...n } = e, { dir: r } = sr(), i = lr(), a = (0, C.useRef)(null), o = (0, C.useRef)(0), [s, c] = (0, C.useState)({
		content: 0,
		viewport: 0,
		scrollbar: {
			size: 0,
			paddingStart: 0,
			paddingEnd: 0
		}
	}), l = hr(s.viewport, s.content), u = {
		...n,
		sizes: s,
		onSizesChange: c,
		hasThumb: l > 0 && l < 1,
		onThumbChange: (e) => {
			a.current = e;
		},
		onThumbPointerUp: () => {
			o.current = 0;
		},
		onThumbPointerDown: (e) => {
			o.current = e;
		}
	}, d = (e, t) => br(e, o.current, s, t);
	return t === "horizontal" ? /* @__PURE__ */ (0, V.jsx)(Dr, {
		...u,
		onThumbPositionChange: () => {
			if (i.viewport && a.current) {
				let e = i.viewport.scrollLeft, t = yr(e, s, r);
				a.current.style.transform = `translate3d(${t}px, 0, 0)`;
			}
		},
		onWheelScroll: (e) => {
			i.viewport && (i.viewport.scrollLeft = e);
		},
		onDragScroll: (e) => {
			i.viewport && (i.viewport.scrollLeft = d(e, r));
		}
	}) : t === "vertical" ? /* @__PURE__ */ (0, V.jsx)(Or, {
		...u,
		onThumbPositionChange: () => {
			if (i.viewport && a.current) {
				let e = i.viewport.scrollTop, t = yr(e, s);
				s.scrollbar.size === 0 ? a.current.style.setProperty("--thumb-opacity", "0") : a.current.style.setProperty("--thumb-opacity", "1"), a.current.style.transform = `translate3d(0, ${t}px, 0)`;
			}
		},
		onWheelScroll: (e) => {
			i.viewport && (i.viewport.scrollTop = e);
		},
		onDragScroll: (e) => {
			i.viewport && (i.viewport.scrollTop = d(e));
		}
	}) : null;
}
kr.displayName = "@mantine/core/ScrollAreaScrollbarVisible";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/ScrollAreaScrollbar/ScrollAreaScrollbarAuto.mjs
function Ar(e) {
	let t = lr(), { forceMount: n, ...r } = e, [i, a] = (0, C.useState)(!1), o = e.orientation === "horizontal", s = ae(() => {
		if (t.viewport) {
			let e = t.viewport.offsetWidth < t.viewport.scrollWidth, n = t.viewport.offsetHeight < t.viewport.scrollHeight;
			a(o ? e : n);
		}
	}, 10);
	return ur(t.viewport, s), ur(t.content, s), n || i ? /* @__PURE__ */ (0, V.jsx)(kr, {
		"data-state": i ? "visible" : "hidden",
		...r
	}) : null;
}
Ar.displayName = "@mantine/core/ScrollAreaScrollbarAuto";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/ScrollAreaScrollbar/ScrollAreaScrollbarHover.mjs
function jr(e) {
	let { forceMount: t, ...n } = e, r = lr(), [i, a] = (0, C.useState)(!1);
	return (0, C.useEffect)(() => {
		let { scrollArea: e } = r, t = 0;
		if (e) {
			let n = () => {
				window.clearTimeout(t), a(!0);
			}, i = () => {
				t = window.setTimeout(() => a(!1), r.scrollHideDelay);
			};
			return e.addEventListener("pointerenter", n), e.addEventListener("pointerleave", i), () => {
				window.clearTimeout(t), e.removeEventListener("pointerenter", n), e.removeEventListener("pointerleave", i);
			};
		}
	}, [r.scrollArea, r.scrollHideDelay]), t || i ? /* @__PURE__ */ (0, V.jsx)(Ar, {
		"data-state": i ? "visible" : "hidden",
		...n
	}) : null;
}
jr.displayName = "@mantine/core/ScrollAreaScrollbarHover";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/ScrollAreaScrollbar/ScrollAreaScrollbarScroll.mjs
function Mr(e) {
	let { forceMount: t, ...n } = e, r = lr(), i = e.orientation === "horizontal", [a, o] = (0, C.useState)("hidden"), s = ae(() => o("idle"), 100);
	return (0, C.useEffect)(() => {
		if (a === "idle") {
			let e = window.setTimeout(() => o("hidden"), r.scrollHideDelay);
			return () => window.clearTimeout(e);
		}
	}, [a, r.scrollHideDelay]), (0, C.useEffect)(() => {
		let { viewport: e } = r, t = i ? "scrollLeft" : "scrollTop";
		if (e) {
			let n = e[t], r = () => {
				let r = e[t];
				n !== r && (o("scrolling"), s()), n = r;
			};
			return e.addEventListener("scroll", r), () => e.removeEventListener("scroll", r);
		}
	}, [
		r.viewport,
		i,
		s
	]), t || a !== "hidden" ? /* @__PURE__ */ (0, V.jsx)(kr, {
		"data-state": a === "hidden" ? "hidden" : "visible",
		...n,
		onPointerEnter: Cr(e.onPointerEnter, () => o("interacting")),
		onPointerLeave: Cr(e.onPointerLeave, () => o("idle"))
	}) : null;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/ScrollAreaScrollbar/ScrollAreaScrollbar.mjs
function Nr(e) {
	let { forceMount: t, ...n } = e, r = lr(), { onScrollbarXEnabledChange: i, onScrollbarYEnabledChange: a } = r, o = e.orientation === "horizontal";
	return (0, C.useEffect)(() => (o ? i(!0) : a(!0), () => {
		o ? i(!1) : a(!1);
	}), [
		o,
		i,
		a
	]), r.type === "hover" ? /* @__PURE__ */ (0, V.jsx)(jr, {
		...n,
		forceMount: t
	}) : r.type === "scroll" ? /* @__PURE__ */ (0, V.jsx)(Mr, {
		...n,
		forceMount: t
	}) : r.type === "auto" ? /* @__PURE__ */ (0, V.jsx)(Ar, {
		...n,
		forceMount: t
	}) : r.type === "always" ? /* @__PURE__ */ (0, V.jsx)(kr, { ...n }) : null;
}
Nr.displayName = "@mantine/core/ScrollAreaScrollbar";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/utils/add-unlinked-scroll-listener.mjs
function Pr(e, t = () => {}) {
	let n = {
		left: e.scrollLeft,
		top: e.scrollTop
	}, r = 0;
	return (function i() {
		let a = {
			left: e.scrollLeft,
			top: e.scrollTop
		}, o = n.left !== a.left, s = n.top !== a.top;
		(o || s) && t(), n = a, r = window.requestAnimationFrame(i);
	})(), () => window.cancelAnimationFrame(r);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/ScrollAreaThumb/ScrollAreaThumb.mjs
function Fr(e) {
	let { style: t, ref: n, ...r } = e, i = lr(), a = Tr(), { onThumbPositionChange: o } = a, s = Te(n, a.onThumbChange), c = (0, C.useRef)(void 0), l = ae(() => {
		c.current &&= (c.current(), void 0);
	}, 100);
	return (0, C.useEffect)(() => {
		let { viewport: e } = i;
		if (e) {
			let t = () => {
				if (l(), !c.current) {
					let t = Pr(e, o);
					c.current = t, o();
				}
			};
			return o(), e.addEventListener("scroll", t), () => e.removeEventListener("scroll", t);
		}
	}, [
		i.viewport,
		l,
		o
	]), /* @__PURE__ */ (0, V.jsx)("div", {
		"data-state": a.hasThumb ? "visible" : "hidden",
		...r,
		ref: s,
		style: {
			width: "var(--sa-thumb-width)",
			height: "var(--sa-thumb-height)",
			...t
		},
		onPointerDownCapture: Cr(e.onPointerDownCapture, (e) => {
			let t = e.target.getBoundingClientRect(), n = e.clientX - t.left, r = e.clientY - t.top;
			a.onThumbPointerDown({
				x: n,
				y: r
			});
		}),
		onPointerUp: Cr(e.onPointerUp, a.onThumbPointerUp)
	});
}
Fr.displayName = "@mantine/core/ScrollAreaThumb";
function Ir(e) {
	let { forceMount: t, ...n } = e, r = Tr();
	return t || r.hasThumb ? /* @__PURE__ */ (0, V.jsx)(Fr, { ...n }) : null;
}
Ir.displayName = "@mantine/core/ScrollAreaThumb";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/ScrollAreaViewport/ScrollAreaViewport.mjs
function Lr({ children: e, style: t, ref: n, onWheel: r, ...i }) {
	let a = lr(), o = Te(n, a.onViewportChange), s = (e) => {
		if (r?.(e), a.scrollbarXEnabled && a.viewport && e.shiftKey) {
			let { scrollTop: t, scrollHeight: n, clientHeight: r, scrollWidth: i, clientWidth: o } = a.viewport, s = t < 1, c = t >= n - r - 1;
			i > o && (s || c) && e.stopPropagation();
		}
	};
	return /* @__PURE__ */ (0, V.jsx)(G, {
		...i,
		ref: o,
		onWheel: s,
		"data-scrollarea-viewport": !0,
		style: {
			overflowX: a.scrollbarXEnabled ? "scroll" : "hidden",
			overflowY: a.scrollbarYEnabled ? "scroll" : "hidden",
			...t
		},
		children: /* @__PURE__ */ (0, V.jsx)("div", {
			...a.getStyles("content"),
			ref: a.onContentChange,
			children: e
		})
	});
}
Lr.displayName = "@mantine/core/ScrollAreaViewport";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/ScrollArea.module.mjs
var Rr = {
	root: "m_d57069b5",
	content: "m_b1336c6",
	viewport: "m_c0783ff9",
	viewportInner: "m_f8f631dd",
	scrollbar: "m_c44ba933",
	thumb: "m_d8b5e363",
	corner: "m_21657268"
};
//#endregion
//#region ../../node_modules/.bun/@floating-ui+utils@0.2.12/node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
function zr() {
	return typeof window < "u";
}
function Br(e) {
	return Ur(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function Vr(e) {
	var t;
	return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function Hr(e) {
	return ((Ur(e) ? e.ownerDocument : e.document) || window.document)?.documentElement;
}
function Ur(e) {
	return zr() ? e instanceof Node || e instanceof Vr(e).Node : !1;
}
function Wr(e) {
	return zr() ? e instanceof Element || e instanceof Vr(e).Element : !1;
}
function Gr(e) {
	return zr() ? e instanceof HTMLElement || e instanceof Vr(e).HTMLElement : !1;
}
function Kr(e) {
	return !zr() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof Vr(e).ShadowRoot;
}
function qr(e) {
	let { overflow: t, overflowX: n, overflowY: r, display: i } = ii(e);
	return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && i !== "inline" && i !== "contents";
}
function Jr(e) {
	return /^(table|td|th)$/.test(Br(e));
}
function Yr(e) {
	try {
		if (e.matches(":popover-open")) return !0;
	} catch {}
	try {
		return e.matches(":modal");
	} catch {
		return !1;
	}
}
var Xr = /transform|translate|scale|rotate|perspective|filter/, Zr = /paint|layout|strict|content/, Qr = (e) => !!e && e !== "none", $r;
function ei(e) {
	let t = Wr(e) ? ii(e) : e;
	return Qr(t.transform) || Qr(t.translate) || Qr(t.scale) || Qr(t.rotate) || Qr(t.perspective) || !ni() && (Qr(t.backdropFilter) || Qr(t.filter)) || Xr.test(t.willChange || "") || Zr.test(t.contain || "");
}
function ti(e) {
	let t = oi(e);
	for (; Gr(t) && !ri(t);) {
		if (ei(t)) return t;
		if (Yr(t)) return null;
		t = oi(t);
	}
	return null;
}
function ni() {
	return $r ??= typeof CSS < "u" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none"), $r;
}
function ri(e) {
	return /^(html|body|#document)$/.test(Br(e));
}
function ii(e) {
	return Vr(e).getComputedStyle(e);
}
function ai(e) {
	return Wr(e) ? {
		scrollLeft: e.scrollLeft,
		scrollTop: e.scrollTop
	} : {
		scrollLeft: e.scrollX,
		scrollTop: e.scrollY
	};
}
function oi(e) {
	if (Br(e) === "html") return e;
	let t = e.assignedSlot || e.parentNode || Kr(e) && e.host || Hr(e);
	return Kr(t) ? t.host : t;
}
function si(e) {
	let t = oi(e);
	return ri(t) ? (e.ownerDocument || e).body : Gr(t) && qr(t) ? t : si(t);
}
function ci(e, t, n) {
	t === void 0 && (t = []), n === void 0 && (n = !0);
	let r = si(e), i = r === e.ownerDocument?.body, a = Vr(r);
	if (i) {
		let e = li(a);
		return t.concat(a, a.visualViewport || [], qr(r) ? r : [], e && n ? ci(e) : []);
	}
	return t.concat(r, ci(r, [], n));
}
function li(e) {
	return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
//#endregion
//#region ../../node_modules/.bun/@floating-ui+utils@0.2.12/node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
var ui = [
	"top",
	"right",
	"bottom",
	"left"
], di = Math.min, fi = Math.max, pi = Math.round, mi = Math.floor, hi = (e) => ({
	x: e,
	y: e
}), gi = {
	left: "right",
	right: "left",
	bottom: "top",
	top: "bottom"
};
function _i(e, t, n) {
	return fi(e, di(t, n));
}
function vi(e, t) {
	return typeof e == "function" ? e(t) : e;
}
function yi(e) {
	return e.split("-")[0];
}
function bi(e) {
	return e.split("-")[1];
}
function xi(e) {
	return e === "x" ? "y" : "x";
}
function Si(e) {
	return e === "y" ? "height" : "width";
}
function Ci(e) {
	let t = e[0];
	return t === "t" || t === "b" ? "y" : "x";
}
function wi(e) {
	return xi(Ci(e));
}
function Ti(e, t, n) {
	n === void 0 && (n = !1);
	let r = bi(e), i = wi(e), a = Si(i), o = i === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
	return t.reference[a] > t.floating[a] && (o = Ni(o)), [o, Ni(o)];
}
function Ei(e) {
	let t = Ni(e);
	return [
		K(e),
		t,
		K(t)
	];
}
function K(e) {
	return e.includes("start") ? e.replace("start", "end") : e.replace("end", "start");
}
var Di = ["left", "right"], Oi = ["right", "left"], ki = ["top", "bottom"], Ai = ["bottom", "top"];
function ji(e, t, n) {
	switch (e) {
		case "top":
		case "bottom": return n ? t ? Oi : Di : t ? Di : Oi;
		case "left":
		case "right": return t ? ki : Ai;
		default: return [];
	}
}
function Mi(e, t, n, r) {
	let i = bi(e), a = ji(yi(e), n === "start", r);
	return i && (a = a.map((e) => e + "-" + i), t && (a = a.concat(a.map(K)))), a;
}
function Ni(e) {
	let t = yi(e);
	return gi[t] + e.slice(t.length);
}
function Pi(e) {
	return {
		top: e.top ?? 0,
		right: e.right ?? 0,
		bottom: e.bottom ?? 0,
		left: e.left ?? 0
	};
}
function Fi(e) {
	return typeof e == "number" ? {
		top: e,
		right: e,
		bottom: e,
		left: e
	} : Pi(e);
}
function Ii(e) {
	let { x: t, y: n, width: r, height: i } = e;
	return {
		width: r,
		height: i,
		top: n,
		left: t,
		right: t + r,
		bottom: n + i,
		x: t,
		y: n
	};
}
//#endregion
//#region ../../node_modules/.bun/@floating-ui+react@0.27.20+005eabf3d8b6ef06/node_modules/@floating-ui/react/dist/floating-ui.react.utils.mjs
var Li = typeof document < "u" ? C.useLayoutEffect : function() {}, Ri = { ...C }.useInsertionEffect || ((e) => e());
function zi(e) {
	let t = C.useRef(() => {});
	return Ri(() => {
		t.current = e;
	}), C.useCallback(function() {
		var e = [...arguments];
		return t.current == null ? void 0 : t.current(...e);
	}, []);
}
//#endregion
//#region ../../node_modules/.bun/@floating-ui+core@1.8.0/node_modules/@floating-ui/core/dist/floating-ui.core.mjs
function Bi(e, t, n) {
	let { reference: r, floating: i } = e, a = Ci(t), o = wi(t), s = Si(o), c = yi(t), l = a === "y", u = r.x + r.width / 2 - i.width / 2, d = r.y + r.height / 2 - i.height / 2, f = r[s] / 2 - i[s] / 2, p;
	switch (c) {
		case "top":
			p = {
				x: u,
				y: r.y - i.height
			};
			break;
		case "bottom":
			p = {
				x: u,
				y: r.y + r.height
			};
			break;
		case "right":
			p = {
				x: r.x + r.width,
				y: d
			};
			break;
		case "left":
			p = {
				x: r.x - i.width,
				y: d
			};
			break;
		default: p = {
			x: r.x,
			y: r.y
		};
	}
	let m = bi(t);
	return m && (p[o] += f * (m === "end" ? 1 : -1) * (n && l ? -1 : 1)), p;
}
async function Vi(e, t) {
	t === void 0 && (t = {});
	let { x: n, y: r, platform: i, rects: a, elements: o, strategy: s } = e, { boundary: c = "clippingAncestors", rootBoundary: l = "viewport", elementContext: u = "floating", altBoundary: d = !1, padding: f = 0 } = vi(t, e), p = Fi(f), m = o[d ? u === "floating" ? "reference" : "floating" : u], h = Ii(await i.getClippingRect({
		element: await (i.isElement == null ? void 0 : i.isElement(m)) ?? !0 ? m : m.contextElement || await (i.getDocumentElement == null ? void 0 : i.getDocumentElement(o.floating)),
		boundary: c,
		rootBoundary: l,
		strategy: s
	})), g = u === "floating" ? {
		x: n,
		y: r,
		width: a.floating.width,
		height: a.floating.height
	} : a.reference, _ = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(o.floating)), v = await (i.isElement == null ? void 0 : i.isElement(_)) && await (i.getScale == null ? void 0 : i.getScale(_)) || {
		x: 1,
		y: 1
	}, y = Ii(i.convertOffsetParentRelativeRectToViewportRelativeRect ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
		elements: o,
		rect: g,
		offsetParent: _,
		strategy: s
	}) : g);
	return {
		top: (h.top - y.top + p.top) / v.y,
		bottom: (y.bottom - h.bottom + p.bottom) / v.y,
		left: (h.left - y.left + p.left) / v.x,
		right: (y.right - h.right + p.right) / v.x
	};
}
var Hi = 50, Ui = async (e, t, n) => {
	let { placement: r = "bottom", strategy: i = "absolute", middleware: a = [], platform: o } = n, s = o.detectOverflow ? o : {
		...o,
		detectOverflow: Vi
	}, c = await (o.isRTL == null ? void 0 : o.isRTL(t)), l = await o.getElementRects({
		reference: e,
		floating: t,
		strategy: i
	}), { x: u, y: d } = Bi(l, r, c), f = r, p = 0, m = {};
	for (let n = 0; n < a.length; n++) {
		let h = a[n];
		if (!h) continue;
		let { name: g, fn: _ } = h, { x: v, y, data: b, reset: x } = await _({
			x: u,
			y: d,
			initialPlacement: r,
			placement: f,
			strategy: i,
			middlewareData: m,
			rects: l,
			platform: s,
			elements: {
				reference: e,
				floating: t
			}
		});
		u = v ?? u, d = y ?? d, m[g] = {
			...m[g],
			...b
		}, x && p < Hi && (p++, typeof x == "object" && (x.placement && (f = x.placement), x.rects && (l = x.rects === !0 ? await o.getElementRects({
			reference: e,
			floating: t,
			strategy: i
		}) : x.rects), {x: u, y: d} = Bi(l, f, c)), n = -1);
	}
	return {
		x: u,
		y: d,
		placement: f,
		strategy: i,
		middlewareData: m
	};
}, Wi = (e) => ({
	name: "arrow",
	options: e,
	async fn(t) {
		let { x: n, y: r, placement: i, rects: a, platform: o, elements: s, middlewareData: c } = t, { element: l, padding: u = 0 } = vi(e, t) || {};
		if (l == null) return {};
		let d = Fi(u), f = {
			x: n,
			y: r
		}, p = wi(i), m = Si(p), h = await o.getDimensions(l), g = p === "y", _ = g ? "top" : "left", v = g ? "bottom" : "right", y = g ? "clientHeight" : "clientWidth", b = a.reference[m] + a.reference[p] - f[p] - a.floating[m], x = f[p] - a.reference[p], S = await (o.getOffsetParent == null ? void 0 : o.getOffsetParent(l)), C = S ? S[y] : 0;
		(!C || !await (o.isElement == null ? void 0 : o.isElement(S))) && (C = s.floating[y] || a.floating[m]);
		let w = b / 2 - x / 2, T = C / 2 - h[m] / 2 - 1, E = di(d[_], T), ee = di(d[v], T), D = C - h[m] - ee, O = C / 2 - h[m] / 2 + w, k = _i(E, O, D), A = !c.arrow && bi(i) != null && O !== k && a.reference[m] / 2 - (O < E ? E : ee) - h[m] / 2 < 0, j = A ? O < E ? O - E : O - D : 0;
		return {
			[p]: f[p] + j,
			data: {
				[p]: k,
				centerOffset: O - k - j,
				...A && { alignmentOffset: j }
			},
			reset: A
		};
	}
}), Gi = function(e) {
	return e === void 0 && (e = {}), {
		name: "flip",
		options: e,
		async fn(t) {
			var n;
			let { placement: r, middlewareData: i, rects: a, initialPlacement: o, platform: s, elements: c } = t, { mainAxis: l = !0, crossAxis: u = !0, fallbackPlacements: d, fallbackStrategy: f = "bestFit", fallbackAxisSideDirection: p = "none", flipAlignment: m = !0, ...h } = vi(e, t);
			if ((n = i.arrow) != null && n.alignmentOffset) return {};
			let g = yi(r), _ = Ci(o), v = yi(o) === o, y = await (s.isRTL == null ? void 0 : s.isRTL(c.floating)), b = d || (v || !m ? [Ni(o)] : Ei(o)), x = p !== "none";
			!d && x && b.push(...Mi(o, m, p, y));
			let S = [o, ...b], C = await s.detectOverflow(t, h), w = [], T = i.flip?.overflows || [];
			if (l && w.push(C[g]), u) {
				let e = Ti(r, a, y);
				w.push(C[e[0]], C[e[1]]);
			}
			if (T = [...T, {
				placement: r,
				overflows: w
			}], !w.every((e) => e <= 0)) {
				let e = (i.flip?.index || 0) + 1, t = S[e];
				if (t && (u !== "alignment" || _ === Ci(t) || T.every((e) => Ci(e.placement) !== _ || e.overflows[0] > 0))) return {
					data: {
						index: e,
						overflows: T
					},
					reset: { placement: t }
				};
				let n = T.filter((e) => e.overflows[0] <= 0).sort((e, t) => e.overflows[1] - t.overflows[1])[0]?.placement;
				if (!n) switch (f) {
					case "bestFit": {
						let e = T.filter((e) => {
							if (x) {
								let t = Ci(e.placement);
								return t === _ || t === "y";
							}
							return !0;
						}).map((e) => [e.placement, e.overflows.filter((e) => e > 0).reduce((e, t) => e + t, 0)]).sort((e, t) => e[1] - t[1])[0]?.[0];
						e && (n = e);
						break;
					}
					case "initialPlacement": n = o;
				}
				if (r !== n) return { reset: { placement: n } };
			}
			return {};
		}
	};
};
function Ki(e, t) {
	return {
		top: e.top - t.height,
		right: e.right - t.width,
		bottom: e.bottom - t.height,
		left: e.left - t.width
	};
}
function qi(e) {
	return ui.some((t) => e[t] >= 0);
}
var Ji = function(e) {
	return e === void 0 && (e = {}), {
		name: "hide",
		options: e,
		async fn(t) {
			let { rects: n, platform: r } = t, { strategy: i = "referenceHidden", ...a } = vi(e, t);
			switch (i) {
				case "referenceHidden": {
					let e = Ki(await r.detectOverflow(t, {
						...a,
						elementContext: "reference"
					}), n.reference);
					return { data: {
						referenceHiddenOffsets: e,
						referenceHidden: qi(e)
					} };
				}
				case "escaped": {
					let e = Ki(await r.detectOverflow(t, {
						...a,
						altBoundary: !0
					}), n.floating);
					return { data: {
						escapedOffsets: e,
						escaped: qi(e)
					} };
				}
				default: return {};
			}
		}
	};
};
function Yi(e) {
	let t = di(...e.map((e) => e.left)), n = di(...e.map((e) => e.top)), r = fi(...e.map((e) => e.right)), i = fi(...e.map((e) => e.bottom));
	return {
		x: t,
		y: n,
		width: r - t,
		height: i - n
	};
}
function Xi(e) {
	let t = e.slice().sort((e, t) => e.y - t.y), n = [], r = null;
	for (let e = 0; e < t.length; e++) {
		let i = t[e];
		!r || i.y - r.y > r.height / 2 ? n.push([i]) : n[n.length - 1].push(i), r = i;
	}
	return n.map((e) => Ii(Yi(e)));
}
var Zi = function(e) {
	return e === void 0 && (e = {}), {
		name: "inline",
		options: e,
		async fn(t) {
			let { placement: n, elements: r, rects: i, platform: a, strategy: o } = t, { padding: s = 2, x: c, y: l } = vi(e, t), u = Array.from(await (a.getClientRects == null ? void 0 : a.getClientRects(r.reference)) || []);
			if (!u.length) return {};
			let d = Xi(u), f = Ii(Yi(u)), p = Fi(s);
			function m() {
				if (d.length === 2 && (d[0].left > d[1].right || d[1].left > d[0].right) && c != null && l != null) return d.find((e) => c > e.left - p.left && c < e.right + p.right && l > e.top - p.top && l < e.bottom + p.bottom) || f;
				if (d.length >= 2) {
					if (Ci(n) === "y") {
						let e = d[0], t = d[d.length - 1], r = yi(n) === "top", i = e.top, a = t.bottom, o = r ? e.left : t.left;
						return Ii({
							x: o,
							y: i,
							width: (r ? e.right : t.right) - o,
							height: a - i
						});
					}
					let e = yi(n) === "left", t = fi(...d.map((e) => e.right)), r = di(...d.map((e) => e.left)), i = d.filter((n) => e ? n.left === r : n.right === t), a = i[0].top, o = i[i.length - 1].bottom;
					return Ii({
						x: r,
						y: a,
						width: t - r,
						height: o - a
					});
				}
				return f;
			}
			let h = await a.getElementRects({
				reference: { getBoundingClientRect: m },
				floating: r.floating,
				strategy: o
			});
			return i.reference.x !== h.reference.x || i.reference.y !== h.reference.y || i.reference.width !== h.reference.width || i.reference.height !== h.reference.height ? { reset: { rects: h } } : {};
		}
	};
}, Qi = /*#__PURE__*/ new Set(["left", "top"]);
async function $i(e, t) {
	let { placement: n, platform: r, elements: i } = e, a = await (r.isRTL == null ? void 0 : r.isRTL(i.floating)), o = yi(n), s = bi(n), c = Ci(n) === "y", l = Qi.has(o) ? -1 : 1, u = a && c ? -1 : 1, d = vi(t, e), { mainAxis: f, crossAxis: p, alignmentAxis: m } = typeof d == "number" ? {
		mainAxis: d,
		crossAxis: 0,
		alignmentAxis: null
	} : {
		mainAxis: d.mainAxis || 0,
		crossAxis: d.crossAxis || 0,
		alignmentAxis: d.alignmentAxis
	};
	return s && typeof m == "number" && (p = s === "end" ? m * -1 : m), c ? {
		x: p * u,
		y: f * l
	} : {
		x: f * l,
		y: p * u
	};
}
var ea = function(e) {
	return e === void 0 && (e = 0), {
		name: "offset",
		options: e,
		async fn(t) {
			var n;
			let { x: r, y: i, placement: a, middlewareData: o } = t, s = await $i(t, e);
			return a === o.offset?.placement && (n = o.arrow) != null && n.alignmentOffset ? {} : {
				x: r + s.x,
				y: i + s.y,
				data: {
					...s,
					placement: a
				}
			};
		}
	};
}, ta = function(e) {
	return e === void 0 && (e = {}), {
		name: "shift",
		options: e,
		async fn(t) {
			let { x: n, y: r, placement: i, platform: a } = t, { mainAxis: o = !0, crossAxis: s = !1, limiter: c = { fn: (e) => {
				let { x: t, y: n } = e;
				return {
					x: t,
					y: n
				};
			} }, ...l } = vi(e, t), u = {
				x: n,
				y: r
			}, d = await a.detectOverflow(t, l), f = Ci(i), p = xi(f), m = u[p], h = u[f], g = (e, t) => _i(t + d[e === "y" ? "top" : "left"], t, t - d[e === "y" ? "bottom" : "right"]);
			o && (m = g(p, m)), s && (h = g(f, h));
			let _ = c.fn({
				...t,
				[p]: m,
				[f]: h
			});
			return {
				..._,
				data: {
					x: _.x - n,
					y: _.y - r,
					enabled: {
						[p]: o,
						[f]: s
					}
				}
			};
		}
	};
}, na = function(e) {
	return e === void 0 && (e = {}), {
		options: e,
		fn(t) {
			let { x: n, y: r, placement: i, rects: a, middlewareData: o } = t, { offset: s = 0, mainAxis: c = !0, crossAxis: l = !0 } = vi(e, t), u = {
				x: n,
				y: r
			}, d = Ci(i), f = xi(d), p = u[f], m = u[d], h = vi(s, t), g = typeof h == "number" ? {
				mainAxis: h,
				crossAxis: 0
			} : {
				mainAxis: h.mainAxis ?? 0,
				crossAxis: h.crossAxis ?? 0
			};
			if (c) {
				let e = f === "y" ? "height" : "width", t = a.reference[f] - a.floating[e] + g.mainAxis, n = a.reference[f] + a.reference[e] - g.mainAxis;
				p < t ? p = t : p > n && (p = n);
			}
			if (l) {
				let e = f === "y" ? "width" : "height", t = Qi.has(yi(i)), n = a.reference[d] - a.floating[e] + (t && o.offset?.[d] || 0) + (t ? 0 : g.crossAxis), r = a.reference[d] + a.reference[e] + (t ? 0 : o.offset?.[d] || 0) - (t ? g.crossAxis : 0);
				m < n ? m = n : m > r && (m = r);
			}
			return {
				[f]: p,
				[d]: m
			};
		}
	};
}, ra = function(e) {
	return e === void 0 && (e = {}), {
		name: "size",
		options: e,
		async fn(t) {
			let { placement: n, rects: r, platform: i, elements: a } = t, { apply: o = () => {}, ...s } = vi(e, t), c = await i.detectOverflow(t, s), l = yi(n), u = bi(n), d = Ci(n) === "y", { width: f, height: p } = r.floating, m, h;
			l === "top" || l === "bottom" ? (m = l, h = u === (await (i.isRTL == null ? void 0 : i.isRTL(a.floating)) ? "start" : "end") ? "left" : "right") : (h = l, m = u === "end" ? "top" : "bottom");
			let g = p - c.top - c.bottom, _ = f - c.left - c.right, v = di(p - c[m], g), y = di(f - c[h], _), b = t.middlewareData.shift, x = !b, S = v, C = y;
			b != null && b.enabled.x && (C = _), b != null && b.enabled.y && (S = g), x && !u && (d ? C = f - 2 * fi(c.left, c.right) : S = p - 2 * fi(c.top, c.bottom)), await o({
				...t,
				availableWidth: C,
				availableHeight: S
			});
			let w = await i.getDimensions(a.floating);
			return f !== w.width || p !== w.height ? { reset: { rects: !0 } } : {};
		}
	};
};
//#endregion
//#region ../../node_modules/.bun/@floating-ui+dom@1.8.0/node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function ia(e) {
	let t = ii(e), n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0, i = Gr(e), a = i ? e.offsetWidth : n, o = i ? e.offsetHeight : r, s = pi(n) !== a || pi(r) !== o;
	return s && (n = a, r = o), {
		width: n,
		height: r,
		$: s
	};
}
function aa(e) {
	return Wr(e) ? e : e.contextElement;
}
function oa(e) {
	let t = aa(e);
	if (!Gr(t)) return hi(1);
	let n = t.getBoundingClientRect(), { width: r, height: i, $: a } = ia(t), o = (a ? pi(n.width) : n.width) / r, s = (a ? pi(n.height) : n.height) / i;
	return (!o || !Number.isFinite(o)) && (o = 1), (!s || !Number.isFinite(s)) && (s = 1), {
		x: o,
		y: s
	};
}
var sa = /*#__PURE__*/ hi(0);
function ca(e) {
	let t = Vr(e);
	return !ni() || !t.visualViewport ? sa : {
		x: t.visualViewport.offsetLeft,
		y: t.visualViewport.offsetTop
	};
}
function la(e, t, n) {
	return t === void 0 && (t = !1), !!n && t && n === Vr(e);
}
function ua(e, t, n, r) {
	t === void 0 && (t = !1), n === void 0 && (n = !1);
	let i = e.getBoundingClientRect(), a = aa(e), o = hi(1);
	t && (r ? Wr(r) && (o = oa(r)) : o = oa(e));
	let s = la(a, n, r) ? ca(a) : hi(0), c = (i.left + s.x) / o.x, l = (i.top + s.y) / o.y, u = i.width / o.x, d = i.height / o.y;
	if (a && r) {
		let e = Vr(a), t = Wr(r) ? Vr(r) : r, n = e, i = li(n);
		for (; i && t !== n;) {
			let e = oa(i), t = i.getBoundingClientRect(), r = ii(i), a = t.left + (i.clientLeft + parseFloat(r.paddingLeft)) * e.x, o = t.top + (i.clientTop + parseFloat(r.paddingTop)) * e.y;
			c *= e.x, l *= e.y, u *= e.x, d *= e.y, c += a, l += o, n = Vr(i), i = li(n);
		}
	}
	return Ii({
		width: u,
		height: d,
		x: c,
		y: l
	});
}
function da(e, t) {
	let n = ai(e).scrollLeft;
	return t ? t.left + n : ua(Hr(e)).left + n;
}
function fa(e, t) {
	let n = e.getBoundingClientRect();
	return {
		x: n.left + t.scrollLeft - da(e, n),
		y: n.top + t.scrollTop
	};
}
function pa(e) {
	let { elements: t, rect: n, offsetParent: r, strategy: i } = e, a = i === "fixed", o = Hr(r), s = t ? Yr(t.floating) : !1;
	if (r === o || s && a) return n;
	let c = {
		scrollLeft: 0,
		scrollTop: 0
	}, l = hi(1), u = hi(0), d = Gr(r);
	if ((d || !a) && ((Br(r) !== "body" || qr(o)) && (c = ai(r)), d)) {
		let e = ua(r);
		l = oa(r), u.x = e.x + r.clientLeft, u.y = e.y + r.clientTop;
	}
	let f = o && !d && !a ? fa(o, c) : hi(0);
	return {
		width: n.width * l.x,
		height: n.height * l.y,
		x: n.x * l.x - c.scrollLeft * l.x + u.x + f.x,
		y: n.y * l.y - c.scrollTop * l.y + u.y + f.y
	};
}
function ma(e) {
	return e.getClientRects ? Array.from(e.getClientRects()) : [];
}
function ha(e) {
	let t = ai(e), n = e.ownerDocument.body, r = fi(e.scrollWidth, e.clientWidth, n.scrollWidth, n.clientWidth), i = fi(e.scrollHeight, e.clientHeight, n.scrollHeight, n.clientHeight), a = -t.scrollLeft + da(e), o = -t.scrollTop;
	return ii(n).direction === "rtl" && (a += fi(e.clientWidth, n.clientWidth) - r), {
		width: r,
		height: i,
		x: a,
		y: o
	};
}
var ga = 25;
function _a(e, t, n) {
	n === void 0 && (n = "viewport");
	let r = n === "layoutViewport", i = Vr(e), a = Hr(e), o = i.visualViewport, s = a.clientWidth, c = a.clientHeight, l = 0, u = 0;
	if (o) {
		let e = !ni() || t === "fixed";
		r ? e || (l = -o.offsetLeft, u = -o.offsetTop) : (s = o.width, c = o.height, e && (l = o.offsetLeft, u = o.offsetTop));
	}
	if (da(a) <= 0) {
		let e = a.ownerDocument, t = e.body, n = getComputedStyle(t), r = e.compatMode === "CSS1Compat" && parseFloat(n.marginLeft) + parseFloat(n.marginRight) || 0, i = Math.abs(a.clientWidth - t.clientWidth - r), o = getComputedStyle(a).scrollbarGutter === "stable both-edges" ? i / 2 : i;
		o <= ga && (s -= o);
	}
	return {
		width: s,
		height: c,
		x: l,
		y: u
	};
}
function va(e, t) {
	let n = ua(e, !0, t === "fixed"), r = n.top + e.clientTop, i = n.left + e.clientLeft, a = oa(e);
	return {
		width: e.clientWidth * a.x,
		height: e.clientHeight * a.y,
		x: i * a.x,
		y: r * a.y
	};
}
function ya(e, t, n) {
	let r;
	if (t === "viewport" || t === "layoutViewport") r = _a(e, n, t);
	else if (t === "document") r = ha(Hr(e));
	else if (Wr(t)) r = va(t, n);
	else {
		let n = ca(e);
		r = {
			x: t.x - n.x,
			y: t.y - n.y,
			width: t.width,
			height: t.height
		};
	}
	return Ii(r);
}
function ba(e, t) {
	let n = t.get(e);
	if (n) return n;
	let r = ci(e, [], !1).filter((e) => Wr(e) && Br(e) !== "body"), i = null, a = ii(e).position === "fixed", o = a ? oi(e) : e;
	for (; Wr(o) && !ri(o);) {
		let e = ii(o), t = ei(o), n = i ? i.position : a ? "fixed" : "";
		!t && (n === "fixed" || n === "absolute" && e.position === "static") ? r = r.filter((e) => e !== o) : i = e, o = oi(o);
	}
	return t.set(e, r), r;
}
function xa(e) {
	let { element: t, boundary: n, rootBoundary: r, strategy: i } = e, a = [...n === "clippingAncestors" ? Yr(t) ? [] : ba(t, this._c) : [].concat(n), r], o = ya(t, a[0], i), s = o.top, c = o.right, l = o.bottom, u = o.left;
	for (let e = 1; e < a.length; e++) {
		let n = ya(t, a[e], i);
		s = fi(n.top, s), c = di(n.right, c), l = di(n.bottom, l), u = fi(n.left, u);
	}
	return {
		width: c - u,
		height: l - s,
		x: u,
		y: s
	};
}
function Sa(e) {
	let { width: t, height: n } = ia(e);
	return {
		width: t,
		height: n
	};
}
function Ca(e, t, n) {
	let r = Gr(t), i = Hr(t), a = n === "fixed", o = ua(e, !0, a, t), s = {
		scrollLeft: 0,
		scrollTop: 0
	}, c = hi(0);
	if ((r || !a) && ((Br(t) !== "body" || qr(i)) && (s = ai(t)), r)) {
		let e = ua(t, !0, a, t);
		c.x = e.x + t.clientLeft, c.y = e.y + t.clientTop;
	}
	!r && i && (c.x = da(i));
	let l = i && !r && !a ? fa(i, s) : hi(0);
	return {
		x: o.left + s.scrollLeft - c.x - l.x,
		y: o.top + s.scrollTop - c.y - l.y,
		width: o.width,
		height: o.height
	};
}
function wa(e) {
	return ii(e).position === "static";
}
function Ta(e, t) {
	if (!Gr(e) || ii(e).position === "fixed") return null;
	if (t) return t(e);
	let n = e.offsetParent;
	return Hr(e) === n && (n = n.ownerDocument.body), n;
}
function Ea(e, t) {
	let n = Vr(e);
	if (Yr(e)) return n;
	if (!Gr(e)) {
		let t = oi(e);
		for (; t && !ri(t);) {
			if (Wr(t) && !wa(t)) return t;
			t = oi(t);
		}
		return n;
	}
	let r = Ta(e, t);
	for (; r && Jr(r) && wa(r);) r = Ta(r, t);
	return r && ri(r) && wa(r) && !ei(r) ? n : r || ti(e) || n;
}
var Da = async function(e) {
	let t = this.getOffsetParent || Ea, n = this.getDimensions, r = await n(e.floating);
	return {
		reference: Ca(e.reference, await t(e.floating), e.strategy),
		floating: {
			x: 0,
			y: 0,
			width: r.width,
			height: r.height
		}
	};
};
function Oa(e) {
	return ii(e).direction === "rtl";
}
var ka = {
	convertOffsetParentRelativeRectToViewportRelativeRect: pa,
	getDocumentElement: Hr,
	getClippingRect: xa,
	getOffsetParent: Ea,
	getElementRects: Da,
	getClientRects: ma,
	getDimensions: Sa,
	getScale: oa,
	isElement: Wr,
	isRTL: Oa
};
function Aa(e, t) {
	return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function ja(e, t, n) {
	let r = null, i, a = Hr(e);
	function o() {
		var e;
		clearTimeout(i), (e = r) == null || e.disconnect(), r = null;
	}
	function s(n, c) {
		n === void 0 && (n = !1), c === void 0 && (c = 1), o();
		let l = e.getBoundingClientRect(), { left: u, top: d, width: f, height: p } = l;
		if (n || t(), !f || !p) return;
		let m = mi(d), h = mi(a.clientWidth - (u + f)), g = mi(a.clientHeight - (d + p)), _ = mi(u), v = {
			rootMargin: -m + "px " + -h + "px " + -g + "px " + -_ + "px",
			threshold: fi(0, di(1, c)) || 1
		}, y = !0;
		function b(t) {
			let n = t[0].intersectionRatio;
			if (!Aa(l, e.getBoundingClientRect())) return s();
			if (n !== c) {
				if (!y) return s();
				n ? s(!1, n) : i = setTimeout(() => {
					s(!1, 1e-7);
				}, 1e3);
			}
			y = !1;
		}
		try {
			r = new IntersectionObserver(b, {
				...v,
				root: a.ownerDocument
			});
		} catch {
			r = new IntersectionObserver(b, v);
		}
		r.observe(e);
	}
	let c = Vr(e), l = () => s(n);
	return c.addEventListener("resize", l), s(!0), () => {
		c.removeEventListener("resize", l), o();
	};
}
function Ma(e, t, n, r) {
	r === void 0 && (r = {});
	let { ancestorScroll: i = !0, ancestorResize: a = !0, elementResize: o = typeof ResizeObserver == "function", layoutShift: s = typeof IntersectionObserver == "function", animationFrame: c = !1 } = r, l = aa(e), u = i || a ? [...l ? ci(l) : [], ...t ? ci(t) : []] : [];
	u.forEach((e) => {
		i && e.addEventListener("scroll", n), a && e.addEventListener("resize", n);
	});
	let d = l && s ? ja(l, n, a) : null, f = -1, p = null;
	o && (p = new ResizeObserver((e) => {
		let [r] = e;
		r && r.target === l && p && t && (p.unobserve(t), cancelAnimationFrame(f), f = requestAnimationFrame(() => {
			var e;
			(e = p) == null || e.observe(t);
		})), n();
	}), l && !c && p.observe(l), t && p.observe(t));
	let m, h = c ? ua(e) : null;
	c && g();
	function g() {
		let t = ua(e);
		h && !Aa(h, t) && n(), h = t, m = requestAnimationFrame(g);
	}
	return n(), () => {
		var e;
		u.forEach((e) => {
			i && e.removeEventListener("scroll", n), a && e.removeEventListener("resize", n);
		}), d?.(), (e = p) == null || e.disconnect(), p = null, c && cancelAnimationFrame(m);
	};
}
var Na = ea, Pa = ta, Fa = Gi, Ia = ra, La = Ji, Ra = Wi, za = Zi, Ba = na, Va = (e, t, n) => {
	let r = /* @__PURE__ */ new Map(), i = n ?? {}, a = {
		...ka,
		...i.platform,
		_c: r
	};
	return Ui(e, t, {
		...i,
		platform: a
	});
}, Ha = /* @__PURE__ */ c(Fe(), 1), Ua = typeof document < "u" ? C.useLayoutEffect : function() {};
function Wa(e, t) {
	if (e === t) return !0;
	if (typeof e != typeof t) return !1;
	if (typeof e == "function" && e.toString() === t.toString()) return !0;
	let n, r, i;
	if (e && t && typeof e == "object") {
		if (Array.isArray(e)) {
			if (n = e.length, n !== t.length) return !1;
			for (r = n; r-- !== 0;) if (!Wa(e[r], t[r])) return !1;
			return !0;
		}
		if (i = Object.keys(e), n = i.length, n !== Object.keys(t).length) return !1;
		for (r = n; r-- !== 0;) if (!{}.hasOwnProperty.call(t, i[r])) return !1;
		for (r = n; r-- !== 0;) {
			let n = i[r];
			if (!(n === "_owner" && e.$$typeof) && !Wa(e[n], t[n])) return !1;
		}
		return !0;
	}
	return e !== e && t !== t;
}
function Ga(e) {
	return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function Ka(e, t) {
	let n = Ga(e);
	return Math.round(t * n) / n;
}
function qa(e) {
	let t = C.useRef(e);
	return Ua(() => {
		t.current = e;
	}), t;
}
function Ja(e) {
	e === void 0 && (e = {});
	let { placement: t = "bottom", strategy: n = "absolute", middleware: r = [], platform: i, elements: { reference: a, floating: o } = {}, transform: s = !0, whileElementsMounted: c, open: l } = e, [u, d] = C.useState({
		x: 0,
		y: 0,
		strategy: n,
		placement: t,
		middlewareData: {},
		isPositioned: !1
	}), [f, p] = C.useState(r);
	Wa(f, r) || p(r);
	let [m, h] = C.useState(null), [g, _] = C.useState(null), v = C.useCallback((e) => {
		e !== S.current && (S.current = e, h(e));
	}, []), y = C.useCallback((e) => {
		e !== w.current && (w.current = e, _(e));
	}, []), b = a || m, x = o || g, S = C.useRef(null), w = C.useRef(null), T = C.useRef(u), E = c != null, ee = qa(c), D = qa(i), O = qa(l), k = C.useCallback(() => {
		if (!S.current || !w.current) return;
		let e = {
			placement: t,
			strategy: n,
			middleware: f
		};
		D.current && (e.platform = D.current), Va(S.current, w.current, e).then((e) => {
			let t = {
				...e,
				isPositioned: O.current !== !1
			};
			A.current && !Wa(T.current, t) && (T.current = t, Ha.flushSync(() => {
				d(t);
			}));
		});
	}, [
		f,
		t,
		n,
		D,
		O
	]);
	Ua(() => {
		l === !1 && T.current.isPositioned && (T.current.isPositioned = !1, d((e) => ({
			...e,
			isPositioned: !1
		})));
	}, [l]);
	let A = C.useRef(!1);
	Ua(() => (A.current = !0, () => {
		A.current = !1;
	}), []), Ua(() => {
		if (b && (S.current = b), x && (w.current = x), b && x) {
			if (ee.current) return ee.current(b, x, k);
			k();
		}
	}, [
		b,
		x,
		k,
		ee,
		E
	]);
	let j = C.useMemo(() => ({
		reference: S,
		floating: w,
		setReference: v,
		setFloating: y
	}), [v, y]), M = C.useMemo(() => ({
		reference: b,
		floating: x
	}), [b, x]), N = C.useMemo(() => {
		let e = {
			position: n,
			left: 0,
			top: 0
		};
		if (!M.floating) return e;
		let t = Ka(M.floating, u.x), r = Ka(M.floating, u.y);
		return s ? {
			...e,
			transform: "translate(" + t + "px, " + r + "px)",
			...Ga(M.floating) >= 1.5 && { willChange: "transform" }
		} : {
			position: n,
			left: t,
			top: r
		};
	}, [
		n,
		s,
		M.floating,
		u.x,
		u.y
	]);
	return C.useMemo(() => ({
		...u,
		update: k,
		refs: j,
		elements: M,
		floatingStyles: N
	}), [
		u,
		k,
		j,
		M,
		N
	]);
}
var Ya = (e) => {
	function t(e) {
		return {}.hasOwnProperty.call(e, "current");
	}
	return {
		name: "arrow",
		options: e,
		fn(n) {
			let { element: r, padding: i } = typeof e == "function" ? e(n) : e;
			return r && t(r) ? r.current == null ? {} : Ra({
				element: r.current,
				padding: i
			}).fn(n) : r ? Ra({
				element: r,
				padding: i
			}).fn(n) : {};
		}
	};
}, Xa = (e, t) => {
	let n = Na(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, Za = (e, t) => {
	let n = Pa(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, Qa = (e, t) => ({
	fn: Ba(e).fn,
	options: [e, t]
}), $a = (e, t) => {
	let n = Fa(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, eo = (e, t) => {
	let n = Ia(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, to = (e, t) => {
	let n = La(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, no = (e, t) => {
	let n = za(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, ro = (e, t) => {
	let n = Ya(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
};
//#endregion
//#region ../../node_modules/.bun/@floating-ui+react@0.27.20+005eabf3d8b6ef06/node_modules/@floating-ui/react/dist/floating-ui.react.mjs
function io(e) {
	let t = C.useRef(void 0), n = C.useCallback((t) => {
		let n = e.map((e) => {
			if (e != null) {
				if (typeof e == "function") {
					let n = e, r = n(t);
					return typeof r == "function" ? r : () => {
						n(null);
					};
				}
				return e.current = t, () => {
					e.current = null;
				};
			}
		});
		return () => {
			n.forEach((e) => e?.());
		};
	}, e);
	return C.useMemo(() => e.every((e) => e == null) ? null : (e) => {
		t.current &&= (t.current(), void 0), e != null && (t.current = n(e));
	}, e);
}
var q = "ArrowLeft", ao = "ArrowRight", oo = "ArrowUp", so = "ArrowDown", co = [q, ao], lo = [oo, so];
[...co, ...lo];
var uo = { ...C }, fo = !1, po = 0, mo = () => "floating-ui-" + Math.random().toString(36).slice(2, 6) + po++;
function ho() {
	let [e, t] = C.useState(() => fo ? mo() : void 0);
	return Li(() => {
		e ?? t(mo());
	}, []), C.useEffect(() => {
		fo = !0;
	}, []), e;
}
var go = uo.useId || ho;
function _o() {
	let e = /* @__PURE__ */ new Map();
	return {
		emit(t, n) {
			var r;
			(r = e.get(t)) == null || r.forEach((e) => e(n));
		},
		on(t, n) {
			e.has(t) || e.set(t, /* @__PURE__ */ new Set()), e.get(t).add(n);
		},
		off(t, n) {
			var r;
			(r = e.get(t)) == null || r.delete(n);
		}
	};
}
var vo = /*#__PURE__*/ C.createContext(null), yo = /*#__PURE__*/ C.createContext(null), bo = () => C.useContext(vo)?.id || null, xo = () => C.useContext(yo);
function So(e) {
	let { open: t = !1, onOpenChange: n, elements: r } = e, i = go(), a = C.useRef({}), [o] = C.useState(() => _o()), s = bo() != null, [c, l] = C.useState(r.reference), u = zi((e, t, r) => {
		a.current.openEvent = e ? t : void 0, o.emit("openchange", {
			open: e,
			event: t,
			reason: r,
			nested: s
		}), n?.(e, t, r);
	}), d = C.useMemo(() => ({ setPositionReference: l }), []), f = C.useMemo(() => ({
		reference: c || r.reference || null,
		floating: r.floating || null,
		domReference: r.reference
	}), [
		c,
		r.reference,
		r.floating
	]);
	return C.useMemo(() => ({
		dataRef: a,
		open: t,
		onOpenChange: u,
		elements: f,
		events: o,
		floatingId: i,
		refs: d
	}), [
		t,
		u,
		f,
		o,
		i,
		d
	]);
}
function Co(e) {
	let { elements: t, ...n } = e === void 0 ? {} : e, { nodeId: r } = n, i = So({
		...n,
		elements: {
			reference: t?.reference ?? null,
			floating: t?.floating ?? null
		}
	}), a = n.rootContext || i, o = a.elements, [s, c] = C.useState(null), [l, u] = C.useState(null), d = o?.domReference || s, f = C.useRef(null), p = xo();
	Li(() => {
		d && (f.current = d);
	}, [d]);
	let m = Ja({
		...n,
		elements: {
			...o,
			...l && { reference: l }
		}
	}), h = C.useCallback((e) => {
		let t = Wr(e) ? {
			getBoundingClientRect: () => e.getBoundingClientRect(),
			getClientRects: () => e.getClientRects(),
			contextElement: e
		} : e;
		u(t), m.refs.setReference(t);
	}, [m.refs]), g = C.useCallback((e) => {
		(Wr(e) || e === null) && (f.current = e, c(e)), (Wr(m.refs.reference.current) || m.refs.reference.current === null || e !== null && !Wr(e)) && m.refs.setReference(e);
	}, [m.refs]), _ = C.useMemo(() => ({
		...m.refs,
		setReference: g,
		setPositionReference: h,
		domReference: f
	}), [
		m.refs,
		g,
		h
	]), v = C.useMemo(() => ({
		...m.elements,
		domReference: d
	}), [m.elements, d]), y = C.useMemo(() => ({
		...m,
		...a,
		refs: _,
		elements: v,
		nodeId: r
	}), [
		m,
		_,
		v,
		r,
		a
	]);
	return Li(() => {
		a.dataRef.current.floatingContext = y;
		let e = p?.nodesRef.current.find((e) => e.id === r);
		e && (e.context = y);
	}), C.useMemo(() => ({
		...m,
		context: y,
		refs: _,
		elements: v
	}), [
		m,
		_,
		v,
		y
	]);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ScrollArea/ScrollArea.mjs
var wo = {
	scrollHideDelay: 1e3,
	type: "hover",
	scrollbars: "xy"
}, To = B((e, { scrollbarSize: t, overscrollBehavior: n, scrollbars: r }) => {
	let i = n;
	return n && r && (r === "x" ? i = `${n} auto` : r === "y" && (i = `auto ${n}`)), { root: {
		"--scrollarea-scrollbar-size": _(t),
		"--scrollarea-over-scroll-behavior": i
	} };
}), Eo = W((e) => {
	let t = H("ScrollArea", wo, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, scrollbarSize: s, vars: c, type: l, scrollHideDelay: u, viewportProps: d, viewportRef: f, onScrollPositionChange: p, children: m, offsetScrollbars: h, scrollbars: g, onBottomReached: _, onTopReached: v, onLeftReached: y, onRightReached: b, overscrollBehavior: x, startScrollPosition: S, verticalScrollbarPosition: w, attributes: T, ...E } = t, [ee, D] = (0, C.useState)(!1), [O, k] = (0, C.useState)(!1), [A, j] = (0, C.useState)(!1), M = (0, C.useRef)(!0), N = (0, C.useRef)(!1), P = (0, C.useRef)(!0), te = (0, C.useRef)(!1), ne = U({
		name: "ScrollArea",
		props: t,
		classes: Rr,
		className: r,
		style: i,
		classNames: n,
		styles: a,
		unstyled: o,
		attributes: T,
		vars: c,
		varsResolver: To
	}), re = (0, C.useRef)(null), [F, I] = (0, C.useState)(null), L = io([
		f,
		re,
		(0, C.useCallback)((e) => {
			I((t) => t === e ? t : e);
		}, [])
	]);
	return ur(h === "present" ? F : null, () => {
		let e = re.current;
		e && (k(e.scrollHeight > e.clientHeight), j(e.scrollWidth > e.clientWidth));
	}), ue(() => {
		S && re.current && re.current.scrollTo({
			left: S.x ?? 0,
			top: S.y ?? 0
		});
	}, []), /* @__PURE__ */ (0, V.jsxs)(mr, {
		getStyles: ne,
		type: l === "never" ? "always" : l,
		scrollHideDelay: u,
		scrollbars: g,
		...ne("root"),
		...E,
		children: [
			/* @__PURE__ */ (0, V.jsx)(Lr, {
				...d,
				...ne("viewport", { style: d?.style }),
				ref: L,
				"data-offset-scrollbars": h === !0 ? "xy" : h || void 0,
				"data-scrollbars": g || void 0,
				"data-vertical-scrollbar-position": w || void 0,
				"data-horizontal-hidden": h === "present" && !A ? "true" : void 0,
				"data-vertical-hidden": h === "present" && !O ? "true" : void 0,
				onScroll: (e) => {
					d?.onScroll?.(e), p?.({
						x: e.currentTarget.scrollLeft,
						y: e.currentTarget.scrollTop
					});
					let { scrollTop: t, scrollHeight: n, clientHeight: r, scrollLeft: i, scrollWidth: a, clientWidth: o } = e.currentTarget, s = t - (n - r) >= -.8, c = t === 0;
					s && !N.current && _?.(), c && !M.current && v?.(), N.current = s, M.current = c;
					let l = i - (a - o) >= -.8, u = i === 0;
					l && !te.current && b?.(), u && !P.current && y?.(), te.current = l, P.current = u;
				},
				children: m
			}),
			(g === "xy" || g === "x") && /* @__PURE__ */ (0, V.jsx)(Nr, {
				...ne("scrollbar"),
				orientation: "horizontal",
				"data-vertical-scrollbar-position": w || void 0,
				"data-hidden": l === "never" || h === "present" && !A || void 0,
				forceMount: !0,
				onMouseEnter: () => D(!0),
				onMouseLeave: () => D(!1),
				children: /* @__PURE__ */ (0, V.jsx)(Ir, { ...ne("thumb") })
			}),
			(g === "xy" || g === "y") && /* @__PURE__ */ (0, V.jsx)(Nr, {
				...ne("scrollbar"),
				orientation: "vertical",
				"data-vertical-scrollbar-position": w || void 0,
				"data-hidden": l === "never" || h === "present" && !O || void 0,
				forceMount: !0,
				onMouseEnter: () => D(!0),
				onMouseLeave: () => D(!1),
				children: /* @__PURE__ */ (0, V.jsx)(Ir, { ...ne("thumb") })
			}),
			/* @__PURE__ */ (0, V.jsx)(fr, {
				...ne("corner"),
				"data-vertical-scrollbar-position": w || void 0,
				"data-hovered": ee || void 0,
				"data-hidden": l === "never" || void 0
			})
		]
	});
});
Eo.displayName = "@mantine/core/ScrollArea";
var Do = W((e) => {
	let { children: t, classNames: n, styles: r, scrollbarSize: i, scrollHideDelay: a, type: o, dir: s, offsetScrollbars: c, overscrollBehavior: l, viewportRef: u, onScrollPositionChange: d, unstyled: f, variant: p, viewportProps: m, scrollbars: h, style: g, vars: _, onBottomReached: v, onTopReached: y, startScrollPosition: b, verticalScrollbarPosition: x, onOverflowChange: S, ...w } = H("ScrollAreaAutosize", wo, e), T = (0, C.useRef)(null), [E, ee] = (0, C.useState)(null), D = io([
		u,
		T,
		(0, C.useCallback)((e) => {
			ee((t) => t === e ? t : e);
		}, [])
	]), O = (0, C.useRef)(!1), k = (0, C.useRef)(!1), A = (0, C.useEffectEvent)(() => {
		let e = T.current;
		if (!e || !S) return;
		let t = e.scrollHeight > e.clientHeight;
		t !== O.current && (k.current ? S(t) : (k.current = !0, t && S(!0)), O.current = t);
	});
	return ur(S ? E : null, A), /* @__PURE__ */ (0, V.jsx)(G, {
		...w,
		variant: p,
		style: [{
			display: "flex",
			overflow: "hidden"
		}, g],
		children: /* @__PURE__ */ (0, V.jsx)(G, {
			style: {
				display: "flex",
				flexDirection: "column",
				flex: 1,
				overflow: "hidden",
				...h === "y" && { minWidth: 0 },
				...h === "x" && { minHeight: 0 },
				...h === "xy" && {
					minWidth: 0,
					minHeight: 0
				},
				...h === !1 && {
					minWidth: 0,
					minHeight: 0
				}
			},
			children: /* @__PURE__ */ (0, V.jsx)(Eo, {
				classNames: n,
				styles: r,
				scrollHideDelay: a,
				scrollbarSize: i,
				type: o,
				dir: s,
				offsetScrollbars: c,
				overscrollBehavior: l,
				viewportRef: D,
				onScrollPositionChange: d,
				unstyled: f,
				variant: p,
				viewportProps: m,
				vars: _,
				scrollbars: h,
				onBottomReached: v,
				onTopReached: y,
				startScrollPosition: b,
				verticalScrollbarPosition: x,
				"data-autosize": "true",
				children: t
			})
		})
	});
});
Eo.classes = Rr, Eo.varsResolver = To, Do.displayName = "@mantine/core/ScrollAreaAutosize", Do.classes = Rr, Eo.Autosize = Do;
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/UnstyledButton/UnstyledButton.module.mjs
var Oo = { root: "m_87cf2631" }, ko = { __staticSelector: "UnstyledButton" }, Ao = $n((e) => {
	let t = H("UnstyledButton", ko, e), { className: n, component: r = "button", __staticSelector: i, unstyled: a, classNames: o, styles: s, style: c, attributes: l, ...u } = t;
	return /* @__PURE__ */ (0, V.jsx)(G, {
		...U({
			name: i,
			props: t,
			classes: Oo,
			className: n,
			style: c,
			classNames: o,
			styles: s,
			unstyled: a,
			attributes: l
		})("root", { focusable: !0 }),
		component: r,
		type: r === "button" ? "button" : void 0,
		...u
	});
});
Ao.classes = Oo, Ao.displayName = "@mantine/core/UnstyledButton";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/VisuallyHidden/VisuallyHidden.module.mjs
var jo = { root: "m_515a97f8" }, Mo = W((e) => {
	let t = H("VisuallyHidden", null, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, attributes: c, ...l } = t;
	return /* @__PURE__ */ (0, V.jsx)(G, {
		component: "span",
		...U({
			name: "VisuallyHidden",
			classes: jo,
			props: t,
			className: r,
			style: i,
			classNames: n,
			styles: a,
			unstyled: o,
			attributes: c
		})("root"),
		...l
	});
});
Mo.classes = jo, Mo.displayName = "@mantine/core/VisuallyHidden";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Paper/Paper.module.mjs
var No = { root: "m_1b7284a3" }, Po = B((e, { radius: t, shadow: n }) => ({ root: {
	"--paper-radius": t === void 0 ? void 0 : j(t),
	"--paper-shadow": P(n)
} })), Fo = $n((e) => {
	let t = H("Paper", null, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, withBorder: s, vars: c, radius: l, shadow: u, variant: d, mod: f, attributes: p, ...m } = t, h = U({
		name: "Paper",
		props: t,
		classes: No,
		className: r,
		style: i,
		classNames: n,
		styles: a,
		unstyled: o,
		attributes: p,
		vars: c,
		varsResolver: Po
	});
	return /* @__PURE__ */ (0, V.jsx)(G, {
		mod: [{ "data-with-border": s }, f],
		...h("root"),
		variant: d,
		...m
	});
});
Fo.classes = No, Fo.varsResolver = Po, Fo.displayName = "@mantine/core/Paper";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/utils/Floating/FloatingArrow/get-arrow-position-styles.mjs
function Io(e, t, n, r) {
	return e === "center" || r === "center" ? { top: t } : e === "end" ? { bottom: n } : e === "start" ? { top: n } : {};
}
function Lo(e, t, n, r, i) {
	return e === "center" || r === "center" ? { left: t } : e === "end" ? { [i === "ltr" ? "right" : "left"]: n } : e === "start" ? { [i === "ltr" ? "left" : "right"]: n } : {};
}
var Ro = {
	bottom: "borderTopLeftRadius",
	left: "borderTopRightRadius",
	right: "borderBottomLeftRadius",
	top: "borderBottomRightRadius"
};
function zo({ position: e, arrowSize: t, dir: n }) {
	let [r, i] = e.split("-");
	if (!i) return;
	let a = {
		width: t,
		height: t,
		position: "absolute"
	};
	if (r === "bottom") {
		let e = i === "start", r = e ? n === "ltr" ? "left" : "right" : n === "ltr" ? "right" : "left";
		return {
			...a,
			top: -t,
			[r]: 0,
			clipPath: e === (n === "rtl") ? "polygon(100% 0%, 0% 100%, 100% 100%)" : "polygon(0% 0%, 0% 100%, 100% 100%)"
		};
	}
	if (r === "top") {
		let e = i === "start", r = e ? n === "ltr" ? "left" : "right" : n === "ltr" ? "right" : "left";
		return {
			...a,
			bottom: -t,
			[r]: 0,
			clipPath: e === (n === "rtl") ? "polygon(0% 0%, 100% 0%, 100% 100%)" : "polygon(0% 0%, 100% 0%, 0% 100%)"
		};
	}
	if (r === "left") return {
		...a,
		right: -t,
		[i === "start" ? "top" : "bottom"]: 0,
		clipPath: i === "start" ? "polygon(0% 0%, 100% 0%, 0% 100%)" : "polygon(0% 0%, 0% 100%, 100% 100%)"
	};
	if (r === "right") return {
		...a,
		left: -t,
		[i === "start" ? "top" : "bottom"]: 0,
		clipPath: i === "start" ? "polygon(0% 0%, 100% 0%, 100% 100%)" : "polygon(100% 0%, 0% 100%, 100% 100%)"
	};
}
function Bo({ position: e, arrowSize: t, arrowOffset: n, arrowRadius: r, arrowPosition: i, arrowX: a, arrowY: o, dir: s }) {
	if (i === "merge") {
		let n = zo({
			position: e,
			arrowSize: t,
			dir: s
		});
		if (n) return n;
	}
	let [c, l = "center"] = e.split("-"), u = {
		width: t,
		height: t,
		transform: "rotate(45deg)",
		position: "absolute",
		[Ro[c]]: r
	}, d = -t / 2;
	return c === "left" ? {
		...u,
		...Io(l, o, n, i),
		right: d,
		borderLeftColor: "transparent",
		borderBottomColor: "transparent",
		clipPath: "polygon(100% 0, 0 0, 100% 100%)"
	} : c === "right" ? {
		...u,
		...Io(l, o, n, i),
		left: d,
		borderRightColor: "transparent",
		borderTopColor: "transparent",
		clipPath: "polygon(0 100%, 0 0, 100% 100%)"
	} : c === "top" ? {
		...u,
		...Lo(l, a, n, i, s),
		bottom: d,
		borderTopColor: "transparent",
		borderLeftColor: "transparent",
		clipPath: "polygon(0 100%, 100% 100%, 100% 0)"
	} : c === "bottom" ? {
		...u,
		...Lo(l, a, n, i, s),
		top: d,
		borderBottomColor: "transparent",
		borderRightColor: "transparent",
		clipPath: "polygon(0 100%, 0 0, 100% 0)"
	} : {};
}
function Vo({ position: e, dir: t }) {
	let [n, r] = e.split("-");
	if (!r) return;
	let i = r === "start" && t === "ltr" || r === "end" && t === "rtl";
	if (n === "bottom") return i ? { borderTopLeftRadius: 0 } : { borderTopRightRadius: 0 };
	if (n === "top") return i ? { borderBottomLeftRadius: 0 } : { borderBottomRightRadius: 0 };
	if (n === "left") return r === "start" ? { borderTopRightRadius: 0 } : { borderBottomRightRadius: 0 };
	if (n === "right") return r === "start" ? { borderTopLeftRadius: 0 } : { borderBottomLeftRadius: 0 };
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/utils/Floating/FloatingArrow/FloatingArrow.mjs
function Ho({ position: e, arrowSize: t, arrowOffset: n, arrowRadius: r, arrowPosition: i, visible: a, arrowX: o, arrowY: s, style: c, ...l }) {
	let { dir: u } = sr();
	return a ? /* @__PURE__ */ (0, V.jsx)("div", {
		role: "presentation",
		...l,
		style: {
			...c,
			...Bo({
				position: e,
				arrowSize: t,
				arrowOffset: n,
				arrowRadius: r,
				arrowPosition: i,
				dir: u,
				arrowX: o,
				arrowY: s
			})
		}
	}) : null;
}
Ho.displayName = "@mantine/core/FloatingArrow";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/utils/Floating/get-floating-position/get-floating-position.mjs
function Uo(e, t) {
	if (e === "rtl" && (t.includes("right") || t.includes("left"))) {
		let [e, n] = t.split("-"), r = e === "right" ? "left" : "right";
		return n === void 0 ? r : `${r}-${n}`;
	}
	return t;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Overlay/Overlay.module.mjs
var Wo = { root: "m_9814e45f" }, Go = { zIndex: ee("modal") }, Ko = B((e, { gradient: t, color: n, backgroundOpacity: r, blur: i, radius: a, zIndex: o }) => ({ root: {
	"--overlay-bg": t || (n !== void 0 || r !== void 0) && dt(n || "#000", r ?? .6) || void 0,
	"--overlay-filter": i ? `blur(${_(i)})` : void 0,
	"--overlay-radius": a === void 0 ? void 0 : j(a),
	"--overlay-z-index": o?.toString()
} })), qo = $n((e) => {
	let t = H("Overlay", Go, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, fixed: c, center: l, children: u, radius: d, zIndex: f, gradient: p, blur: m, color: h, backgroundOpacity: g, mod: _, attributes: v, ...y } = t;
	return /* @__PURE__ */ (0, V.jsx)(G, {
		...U({
			name: "Overlay",
			props: t,
			classes: Wo,
			className: r,
			style: i,
			classNames: n,
			styles: a,
			unstyled: o,
			attributes: v,
			vars: s,
			varsResolver: Ko
		})("root"),
		mod: [{
			center: l,
			fixed: c
		}, _],
		...y,
		children: u
	});
});
qo.classes = Wo, qo.varsResolver = Ko, qo.displayName = "@mantine/core/Overlay";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Portal/Portal.mjs
function Jo(e) {
	let t = document.createElement("div");
	return t.setAttribute("data-portal", "true"), typeof e.className == "string" && t.classList.add(...e.className.split(" ").filter(Boolean)), typeof e.style == "object" && Object.assign(t.style, e.style), typeof e.id == "string" && t.setAttribute("id", e.id), t;
}
function Yo({ target: e, reuseTargetNode: t, ...n }) {
	if (e) return typeof e == "string" ? document.querySelector(e) || Jo(n) : e;
	if (t) {
		let e = document.querySelector("[data-mantine-shared-portal-node]");
		if (e) return e;
		let t = Jo(n);
		return t.setAttribute("data-mantine-shared-portal-node", "true"), document.body.appendChild(t), t;
	}
	return Jo(n);
}
var Xo = { reuseTargetNode: !0 }, Zo = W((e) => {
	let { children: t, target: n, reuseTargetNode: r, ref: i, ...a } = H("Portal", Xo, e), [o, s] = (0, C.useState)(!1), c = (0, C.useRef)(null);
	return ue(() => (s(!0), c.current = Yo({
		target: n,
		reuseTargetNode: r,
		...a
	}), Ce(i, c.current), !n && !r && c.current && document.body.appendChild(c.current), () => {
		!n && !r && c.current && document.body.removeChild(c.current);
	}), [n]), !o || !c.current ? null : (0, Ha.createPortal)(/* @__PURE__ */ (0, V.jsx)(V.Fragment, { children: t }), c.current);
});
Zo.displayName = "@mantine/core/Portal";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Portal/OptionalPortal.mjs
var Qo = W(({ withinPortal: e = !0, children: t, ...n }) => Et() === "test" || !e ? /* @__PURE__ */ (0, V.jsx)(V.Fragment, { children: t }) : /* @__PURE__ */ (0, V.jsx)(Zo, {
	...n,
	children: t
}));
Qo.displayName = "@mantine/core/OptionalPortal";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Transition/transitions.mjs
var $o = (e) => ({
	in: {
		opacity: 1,
		transform: "scale(1)"
	},
	out: {
		opacity: 0,
		transform: `scale(.9) translateY(${e === "bottom" ? 10 : -10}px)`
	},
	transitionProperty: "transform, opacity"
}), es = {
	fade: {
		in: { opacity: 1 },
		out: { opacity: 0 },
		transitionProperty: "opacity"
	},
	"fade-up": {
		in: {
			opacity: 1,
			transform: "translateY(0)"
		},
		out: {
			opacity: 0,
			transform: "translateY(30px)"
		},
		transitionProperty: "opacity, transform"
	},
	"fade-down": {
		in: {
			opacity: 1,
			transform: "translateY(0)"
		},
		out: {
			opacity: 0,
			transform: "translateY(-30px)"
		},
		transitionProperty: "opacity, transform"
	},
	"fade-left": {
		in: {
			opacity: 1,
			transform: "translateX(0)"
		},
		out: {
			opacity: 0,
			transform: "translateX(30px)"
		},
		transitionProperty: "opacity, transform"
	},
	"fade-right": {
		in: {
			opacity: 1,
			transform: "translateX(0)"
		},
		out: {
			opacity: 0,
			transform: "translateX(-30px)"
		},
		transitionProperty: "opacity, transform"
	},
	scale: {
		in: {
			opacity: 1,
			transform: "scale(1)"
		},
		out: {
			opacity: 0,
			transform: "scale(0)"
		},
		common: { transformOrigin: "top" },
		transitionProperty: "transform, opacity"
	},
	"scale-y": {
		in: {
			opacity: 1,
			transform: "scaleY(1)"
		},
		out: {
			opacity: 0,
			transform: "scaleY(0)"
		},
		common: { transformOrigin: "top" },
		transitionProperty: "transform, opacity"
	},
	"scale-x": {
		in: {
			opacity: 1,
			transform: "scaleX(1)"
		},
		out: {
			opacity: 0,
			transform: "scaleX(0)"
		},
		common: { transformOrigin: "left" },
		transitionProperty: "transform, opacity"
	},
	"skew-up": {
		in: {
			opacity: 1,
			transform: "translateY(0) skew(0deg, 0deg)"
		},
		out: {
			opacity: 0,
			transform: "translateY(-20px) skew(-10deg, -5deg)"
		},
		common: { transformOrigin: "top" },
		transitionProperty: "transform, opacity"
	},
	"skew-down": {
		in: {
			opacity: 1,
			transform: "translateY(0) skew(0deg, 0deg)"
		},
		out: {
			opacity: 0,
			transform: "translateY(20px) skew(-10deg, -5deg)"
		},
		common: { transformOrigin: "bottom" },
		transitionProperty: "transform, opacity"
	},
	"rotate-left": {
		in: {
			opacity: 1,
			transform: "translateY(0) rotate(0deg)"
		},
		out: {
			opacity: 0,
			transform: "translateY(20px) rotate(-5deg)"
		},
		common: { transformOrigin: "bottom" },
		transitionProperty: "transform, opacity"
	},
	"rotate-right": {
		in: {
			opacity: 1,
			transform: "translateY(0) rotate(0deg)"
		},
		out: {
			opacity: 0,
			transform: "translateY(20px) rotate(5deg)"
		},
		common: { transformOrigin: "top" },
		transitionProperty: "transform, opacity"
	},
	"slide-down": {
		in: {
			opacity: 1,
			transform: "translateY(0)"
		},
		out: {
			opacity: 0,
			transform: "translateY(-100%)"
		},
		common: { transformOrigin: "top" },
		transitionProperty: "transform, opacity"
	},
	"slide-up": {
		in: {
			opacity: 1,
			transform: "translateY(0)"
		},
		out: {
			opacity: 0,
			transform: "translateY(100%)"
		},
		common: { transformOrigin: "bottom" },
		transitionProperty: "transform, opacity"
	},
	"slide-left": {
		in: {
			opacity: 1,
			transform: "translateX(0)"
		},
		out: {
			opacity: 0,
			transform: "translateX(100%)"
		},
		common: { transformOrigin: "left" },
		transitionProperty: "transform, opacity"
	},
	"slide-right": {
		in: {
			opacity: 1,
			transform: "translateX(0)"
		},
		out: {
			opacity: 0,
			transform: "translateX(-100%)"
		},
		common: { transformOrigin: "right" },
		transitionProperty: "transform, opacity"
	},
	pop: {
		...$o("bottom"),
		common: { transformOrigin: "center center" }
	},
	"pop-bottom-left": {
		...$o("bottom"),
		common: { transformOrigin: "bottom left" }
	},
	"pop-bottom-right": {
		...$o("bottom"),
		common: { transformOrigin: "bottom right" }
	},
	"pop-top-left": {
		...$o("top"),
		common: { transformOrigin: "top left" }
	},
	"pop-top-right": {
		...$o("top"),
		common: { transformOrigin: "top right" }
	}
}, ts = {
	entering: "in",
	entered: "in",
	exiting: "out",
	exited: "out",
	"pre-exiting": "out",
	"pre-entering": "out"
};
function ns({ transition: e, state: t, duration: n, timingFunction: r }) {
	let i = {
		WebkitBackfaceVisibility: "hidden",
		transitionDuration: `${n}ms`,
		transitionTimingFunction: r
	};
	return typeof e == "string" ? e in es ? {
		transitionProperty: es[e].transitionProperty,
		...i,
		...es[e].common,
		...es[e][ts[t]]
	} : {} : {
		transitionProperty: e.transitionProperty,
		...i,
		...e.common,
		...e[ts[t]]
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Transition/use-transition.mjs
function rs({ duration: e, exitDuration: t, timingFunction: n, mounted: r, onEnter: i, onExit: a, onEntered: o, onExited: s, enterDelay: c, exitDelay: l }) {
	let u = Ht(), d = De(), f = u.respectReducedMotion ? d : !1, [p, m] = (0, C.useState)(f ? 0 : e), [h, g] = (0, C.useState)(r ? "entered" : "exited"), _ = (0, C.useRef)(-1), v = (0, C.useRef)(-1), y = (0, C.useRef)(-1);
	function b() {
		window.clearTimeout(_.current), window.clearTimeout(v.current), cancelAnimationFrame(y.current);
	}
	let x = (n) => {
		b();
		let r = n ? i : a, c = n ? o : s, l = f ? 0 : n ? e : t;
		m(l), l === 0 ? (typeof r == "function" && r(), typeof c == "function" && c(), g(n ? "entered" : "exited")) : y.current = requestAnimationFrame(() => {
			Ha.flushSync(() => {
				g(n ? "pre-entering" : "pre-exiting");
			}), y.current = requestAnimationFrame(() => {
				typeof r == "function" && r(), g(n ? "entering" : "exiting"), _.current = window.setTimeout(() => {
					typeof c == "function" && c(), g(n ? "entered" : "exited");
				}, l);
			});
		});
	}, S = (e) => {
		if (b(), typeof (e ? c : l) != "number") {
			x(e);
			return;
		}
		v.current = window.setTimeout(() => {
			x(e);
		}, e ? c : l);
	};
	return de(() => {
		S(r);
	}, [r]), (0, C.useEffect)(() => () => {
		b();
	}, []), {
		transitionDuration: p,
		transitionStatus: h,
		transitionTimingFunction: n || "ease"
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Transition/Transition.mjs
function is({ keepMounted: e, keepMountedMode: t = "activity", transition: n = "fade", duration: r = 250, exitDuration: i = r, mounted: a, children: o, timingFunction: s = "ease", onExit: c, onEntered: l, onEnter: u, onExited: d, enterDelay: f, exitDelay: p }) {
	let m = Et(), { transitionDuration: h, transitionStatus: g, transitionTimingFunction: _ } = rs({
		mounted: a,
		exitDuration: i,
		duration: r,
		timingFunction: s,
		onExit: c,
		onEntered: l,
		onEnter: u,
		onExited: d,
		enterDelay: f,
		exitDelay: p
	});
	if (m === "test") return a ? /* @__PURE__ */ (0, V.jsx)(V.Fragment, { children: o({}) }) : e ? o({ display: "none" }) : null;
	if (h === 0) return e ? t === "display-none" ? a ? /* @__PURE__ */ (0, V.jsx)(V.Fragment, { children: o({}) }) : o({ display: "none" }) : /* @__PURE__ */ (0, V.jsx)(C.Activity, {
		mode: a ? "visible" : "hidden",
		children: o({})
	}) : a ? /* @__PURE__ */ (0, V.jsx)(V.Fragment, { children: o({}) }) : null;
	let v = g === "exited";
	if (e) {
		let e = o(v ? t === "display-none" ? { display: "none" } : {} : ns({
			transition: n,
			duration: h,
			state: g,
			timingFunction: _
		}));
		return t === "display-none" ? e : /* @__PURE__ */ (0, V.jsx)(C.Activity, {
			mode: v ? "hidden" : "visible",
			children: e
		});
	}
	return v ? null : /* @__PURE__ */ (0, V.jsx)(V.Fragment, { children: o(ns({
		transition: n,
		duration: h,
		state: g,
		timingFunction: _
	})) });
}
is.displayName = "@mantine/core/Transition";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Popover/Popover.context.mjs
var [as, os] = T("Popover component was not found in the tree");
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/utils/Floating/use-context-menu-handlers.mjs
function ss({ childProps: e, disabled: t, opened: n, longPressDelay: r = 500, setReference: i, open: a }) {
	let o = (0, C.useRef)(!1), s = (0, C.useRef)(!1), c = (0, C.useRef)(null), l = (0, C.useRef)(t);
	l.current = t;
	let u = (e, t, n) => {
		i({
			getBoundingClientRect: () => ({
				x: e,
				y: t,
				width: 0,
				height: 0,
				top: t,
				left: e,
				right: e,
				bottom: t,
				toJSON: () => void 0
			}),
			contextElement: n
		}), a();
	}, d = te(e.onMouseDown, (e) => {
		t || e.button === 2 && e.stopPropagation();
	}), f = te(e.onContextMenu, (e) => {
		t || e.defaultPrevented || (e.preventDefault(), !s.current && (u(e.clientX, e.clientY, e.currentTarget), o.current && (s.current = !0)));
	}), p = Ae((e) => {
		if (l.current || s.current) return;
		let t = e, n = t.touches[0] ?? t.changedTouches[0];
		n && (u(n.clientX, n.clientY, c.current), s.current = !0);
	}, {
		threshold: r,
		events: ["touch"],
		cancelOnMove: !0,
		onStart: (e) => {
			o.current = !0, s.current = !1, c.current = e.currentTarget;
		},
		onFinish: (e) => {
			o.current = !1, s.current = !1, l.current || e.preventDefault();
		},
		onCancel: () => {
			o.current = !1, s.current = !1;
		}
	});
	return {
		onContextMenu: f,
		onMouseDown: d,
		onTouchStart: te(e.onTouchStart, p.onTouchStart),
		onTouchEnd: te(e.onTouchEnd, p.onTouchEnd),
		onTouchCancel: te(e.onTouchCancel, p.onTouchCancel),
		onTouchMove: te(e.onTouchMove, p.onTouchMove),
		style: t ? e.style : {
			...e.style,
			WebkitTouchCallout: "none",
			WebkitUserSelect: "none",
			userSelect: "none"
		},
		"data-expanded": n ? !0 : void 0
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Popover/PopoverContextMenu/PopoverContextMenu.mjs
function cs(e) {
	let { children: t, disabled: n, longPressDelay: r } = H("PopoverContextMenu", null, e), i = Ve(t);
	if (!i) throw Error("Popover.ContextMenu component children should be an element or a component that accepts ref. Fragments, strings, numbers and other primitive values are not supported");
	let a = os();
	return (0, C.cloneElement)(i, ss({
		childProps: i.props,
		disabled: n || a.disabled,
		opened: a.opened,
		longPressDelay: r,
		setReference: a.reference,
		open: () => {
			a.opened || a.onToggle();
		}
	}));
}
cs.displayName = "@mantine/core/PopoverContextMenu";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/FocusTrap/FocusTrap.mjs
function ls({ children: e, active: t = !0, refProp: n = "ref", innerRef: r }) {
	let i = Te(xe(t), r), a = Ve(e);
	return a ? (0, C.cloneElement)(a, { [n]: i }) : e;
}
function us(e) {
	return /* @__PURE__ */ (0, V.jsx)(Mo, {
		tabIndex: -1,
		"data-autofocus": !0,
		...e
	});
}
ls.displayName = "@mantine/core/FocusTrap", us.displayName = "@mantine/core/FocusTrapInitialFocus", ls.InitialFocus = us;
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Popover/Popover.module.mjs
var ds = {
	dropdown: "m_38a85659",
	arrow: "m_a31dc6c1",
	overlay: "m_3d7bc908"
}, fs = W((e) => {
	let t = H("PopoverDropdown", null, e), { className: n, style: r, vars: i, children: a, onKeyDownCapture: o, variant: s, classNames: c, styles: l, ref: u, ...d } = t, f = os(), { dir: p } = sr(), m = f.arrowPosition === "merge" && f.withArrow ? Vo({
		position: f.placement,
		dir: p
	}) : void 0, h = fe({
		opened: f.opened,
		shouldReturnFocus: f.returnFocus
	}), g = f.withRoles ? {
		"aria-labelledby": f.getTargetId(),
		id: f.getDropdownId(),
		role: "dialog",
		tabIndex: -1
	} : {}, v = Te(u, f.floating);
	return f.disabled ? null : /* @__PURE__ */ (0, V.jsx)(Qo, {
		...f.portalProps,
		withinPortal: f.withinPortal,
		children: /* @__PURE__ */ (0, V.jsx)(is, {
			mounted: f.opened,
			...f.transitionProps,
			transition: f.transitionProps?.transition || "fade",
			duration: f.transitionProps?.duration ?? 150,
			keepMounted: f.keepMounted,
			keepMountedMode: f.keepMountedMode,
			exitDuration: typeof f.transitionProps?.exitDuration == "number" ? f.transitionProps.exitDuration : f.transitionProps?.duration,
			children: (e) => /* @__PURE__ */ (0, V.jsx)(ls, {
				active: f.trapFocus && f.opened,
				innerRef: v,
				children: /* @__PURE__ */ (0, V.jsxs)(G, {
					...g,
					...d,
					variant: s,
					onKeyDownCapture: O(() => {
						f.onClose?.(), f.onDismiss?.();
					}, {
						active: f.closeOnEscape,
						onTrigger: h,
						onKeyDown: o
					}),
					"data-position": f.placement,
					"data-fixed": f.floatingStrategy === "fixed" || void 0,
					...f.getStyles("dropdown", {
						className: n,
						props: t,
						classNames: c,
						styles: l,
						style: [
							{
								...e,
								...m,
								zIndex: f.zIndex,
								top: f.y ?? 0,
								left: f.x ?? 0,
								width: f.width === "target" ? void 0 : _(f.width),
								...f.referenceHidden ? { display: "none" } : null
							},
							f.resolvedStyles?.dropdown,
							l?.dropdown,
							r
						]
					}),
					children: [a, /* @__PURE__ */ (0, V.jsx)(Ho, {
						ref: f.arrowRef,
						arrowX: f.arrowX,
						arrowY: f.arrowY,
						visible: f.withArrow,
						position: f.placement,
						arrowSize: f.arrowSize,
						arrowRadius: f.arrowRadius,
						arrowOffset: f.arrowOffset,
						arrowPosition: f.arrowPosition,
						...f.getStyles("arrow", {
							props: t,
							classNames: c,
							styles: l
						})
					})]
				})
			})
		})
	});
});
fs.classes = ds, fs.displayName = "@mantine/core/PopoverDropdown";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Popover/PopoverTarget/PopoverTarget.mjs
var ps = {
	refProp: "ref",
	popupType: "dialog"
}, ms = W((e) => {
	let { children: t, refProp: n, popupType: r, ref: i, ...a } = H("PopoverTarget", ps, e), o = Ve(t);
	if (!o) throw Error("Popover.Target component children should be an element or a component that accepts ref. Fragments, strings, numbers and other primitive values are not supported");
	let s = a, c = os(), l = Te(c.reference, Le(o), i), u = c.withRoles ? {
		"aria-haspopup": r,
		"aria-expanded": c.opened,
		"aria-controls": c.opened ? c.getDropdownId() : void 0,
		id: c.getTargetId()
	} : {}, d = o.props;
	return (0, C.cloneElement)(o, {
		...s,
		...u,
		...c.targetProps,
		className: Ue(c.targetProps.className, s.className, d.className),
		[n]: l,
		...c.controlled ? null : { onClick: (e) => {
			c.onToggle(), d.onClick?.(e);
		} }
	});
});
ms.displayName = "@mantine/core/PopoverTarget";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Popover/use-popover.mjs
function hs(e) {
	if (e === void 0) return {
		shift: !0,
		flip: !0
	};
	let t = { ...e };
	return e.shift === void 0 && (t.shift = !0), e.flip === void 0 && (t.flip = !0), t;
}
function gs(e, t, n, r) {
	let i = hs(e.middlewares), a = [Xa(e.offset), to()];
	if (i.flip && !n) {
		let e = typeof i.flip == "boolean" ? {} : i.flip, t = r ? {
			fallbackStrategy: "initialPlacement",
			...e
		} : e;
		a.push($a(t));
	}
	if (i.shift) {
		let t = typeof i.shift == "boolean" ? {} : i.shift;
		a.push(Za((n) => {
			let r = n.placement.startsWith("top") || n.placement.startsWith("bottom");
			return {
				limiter: Qa(),
				padding: 5,
				...e.width === "target" && r ? { mainAxis: !1 } : null,
				...t
			};
		}));
	}
	return i.inline && a.push(typeof i.inline == "boolean" ? no() : no(i.inline)), a.push(ro({
		element: e.arrowRef,
		padding: e.arrowOffset
	})), (i.size || e.width === "target") && a.push(eo({
		...typeof i.size == "boolean" ? {} : i.size,
		apply({ rects: n, availableWidth: r, availableHeight: a, ...o }) {
			let s = t().refs.floating.current?.style ?? {};
			i.size && (typeof i.size == "object" && i.size.apply ? i.size.apply({
				rects: n,
				availableWidth: r,
				availableHeight: a,
				...o
			}) : Object.assign(s, {
				maxWidth: `${r}px`,
				maxHeight: `${a}px`
			})), e.width === "target" && Object.assign(s, { width: `${n.reference.width}px` });
		}
	})), a;
}
function _s(e) {
	let [t, n] = Ee({
		value: e.opened,
		defaultValue: e.defaultOpened,
		finalValue: !1,
		onChange: e.onChange
	}), r = (0, C.useRef)(t), [i, a] = (0, C.useState)(null), o = e.preventPositionChangeWhenVisible !== !1, s = (0, C.useRef)(t);
	t !== s.current && (s.current = t, t && i !== null && a(null));
	let c = (0, C.useCallback)(() => a(null), []), l = () => {
		t && !e.disabled && n(!1);
	}, u = () => {
		e.disabled || n(!t);
	}, d = Co({
		open: t,
		strategy: e.strategy,
		placement: o ? i ?? e.position : e.position,
		middleware: gs(e, () => d, o && i !== null, o),
		whileElementsMounted: e.keepMounted ? void 0 : Ma
	});
	(0, C.useEffect)(() => {
		if (!e.keepMounted) return;
		let n = d.refs.reference.current, r = d.refs.floating.current;
		if (t && n && r) return Ma(n, r, d.update);
	}, [
		e.keepMounted,
		t,
		d.update,
		d.elements.reference,
		d.elements.floating
	]);
	let f = (0, C.useRef)(!1);
	ue(() => {
		if (!t) {
			f.current = !1;
			return;
		}
		if (!o || i !== null) return;
		let e = d.refs.floating.current;
		if (!(!e || e.offsetHeight === 0 || e.offsetWidth === 0)) {
			if (!f.current) {
				f.current = !0, d.update();
				return;
			}
			d.isPositioned && a(d.placement);
		}
	}, [
		o,
		t,
		d.isPositioned,
		d.placement,
		i,
		d.update
	]);
	let p = (0, C.useRef)(d.placement);
	return ue(() => {
		p.current !== d.placement && (p.current = d.placement, e.onPositionChange?.(d.placement));
	}, [d.placement]), de(() => {
		t !== r.current && (t ? e.onOpen?.() : e.onClose?.()), r.current = t;
	}, [
		t,
		e.onClose,
		e.onOpen
	]), {
		floating: d,
		controlled: typeof e.opened == "boolean",
		opened: t,
		onClose: l,
		onToggle: u,
		resetLockedPlacement: c
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Popover/Popover.mjs
var vs = {
	position: "bottom",
	offset: 8,
	transitionProps: {
		transition: "fade",
		duration: 150
	},
	middlewares: {
		flip: !0,
		shift: !0,
		inline: !1
	},
	arrowSize: 7,
	arrowOffset: 5,
	arrowRadius: 0,
	arrowPosition: "side",
	closeOnClickOutside: !0,
	withinPortal: !0,
	closeOnEscape: !0,
	trapFocus: !1,
	withRoles: !0,
	returnFocus: !1,
	withOverlay: !1,
	hideDetached: !0,
	preventPositionChangeWhenVisible: !0,
	clickOutsideEvents: ["mousedown", "touchstart"],
	zIndex: ee("popover"),
	__staticSelector: "Popover",
	width: "max-content"
}, ys = B((e, { radius: t, shadow: n }) => ({ dropdown: {
	"--popover-radius": t === void 0 ? void 0 : j(t),
	"--popover-shadow": P(n)
} }));
function bs(e) {
	let t = H("Popover", vs, e), { children: n, position: r, offset: i, onPositionChange: a, opened: o, transitionProps: s, onExitTransitionEnd: c, onEnterTransitionEnd: l, width: u, middlewares: d, withArrow: f, arrowSize: p, arrowOffset: m, arrowRadius: h, arrowPosition: g, unstyled: _, classNames: v, styles: y, closeOnClickOutside: b, withinPortal: x, portalProps: S, closeOnEscape: w, clickOutsideEvents: T, trapFocus: E, onClose: ee, onDismiss: D, onOpen: O, onChange: k, zIndex: A, radius: j, shadow: M, id: N, defaultOpened: P, __staticSelector: te, withRoles: ne, disabled: re, returnFocus: F, variant: I, keepMounted: L, keepMountedMode: ie, vars: ae, floatingStrategy: oe, withOverlay: ce, overlayProps: le, hideDetached: ue, attributes: de, preventPositionChangeWhenVisible: fe, ...pe } = t, me = U({
		name: te,
		props: t,
		classes: ds,
		classNames: v,
		styles: y,
		unstyled: _,
		attributes: de,
		rootSelector: "dropdown",
		vars: ae,
		varsResolver: ys
	}), { resolvedStyles: he } = an({
		classNames: v,
		styles: y,
		props: t
	}), R = (0, C.useRef)(null), [ge, _e] = (0, C.useState)(null), [ve, ye] = (0, C.useState)(null), { dir: be } = sr(), xe = Et(), Ce = Se(N), we = _s({
		middlewares: d,
		width: u,
		position: Uo(be, r),
		offset: typeof i == "number" ? i + (f ? p / 2 : 0) : i,
		arrowRef: R,
		arrowOffset: m,
		onPositionChange: a,
		opened: o,
		defaultOpened: P,
		onChange: k,
		onOpen: O,
		onClose: ee,
		onDismiss: D,
		strategy: oe,
		disabled: re,
		preventPositionChangeWhenVisible: fe,
		keepMounted: L
	});
	se(() => {
		b && (we.onClose(), D?.());
	}, T, [ge, ve]);
	let Te = (0, C.useCallback)((e) => {
		_e(e), we.floating.refs.setReference(e);
	}, [we.floating.refs.setReference]), Ee = (0, C.useCallback)((e) => {
		ye(e), we.floating.refs.setFloating(e);
	}, [we.floating.refs.setFloating]), De = (0, C.useCallback)(() => {
		s?.onExited?.(), c?.(), we.resetLockedPlacement();
	}, [
		s?.onExited,
		c,
		we.resetLockedPlacement
	]), Oe = (0, C.useCallback)(() => {
		s?.onEntered?.(), l?.();
	}, [s?.onEntered, l]);
	return /* @__PURE__ */ (0, V.jsxs)(as, {
		value: {
			returnFocus: F,
			disabled: re,
			controlled: we.controlled,
			reference: Te,
			floating: Ee,
			x: we.floating.x,
			y: we.floating.y,
			arrowX: we.floating?.middlewareData?.arrow?.x,
			arrowY: we.floating?.middlewareData?.arrow?.y,
			opened: we.opened,
			arrowRef: R,
			transitionProps: {
				...s,
				onExited: De,
				onEntered: Oe
			},
			width: u,
			withArrow: f,
			arrowSize: p,
			arrowOffset: m,
			arrowRadius: h,
			arrowPosition: g,
			placement: we.floating.placement,
			trapFocus: E,
			withinPortal: x,
			portalProps: S,
			zIndex: A,
			radius: j,
			shadow: M,
			closeOnEscape: w,
			onDismiss: D,
			onClose: we.onClose,
			onToggle: we.onToggle,
			getTargetId: () => Ce,
			getDropdownId: () => `${Ce}-dropdown`,
			withRoles: ne,
			targetProps: pe,
			__staticSelector: te,
			classNames: v,
			styles: y,
			unstyled: _,
			variant: I,
			keepMounted: L,
			keepMountedMode: ie,
			getStyles: me,
			resolvedStyles: he,
			floatingStrategy: oe,
			referenceHidden: ue && xe !== "test" ? we.floating.middlewareData.hide?.referenceHidden : !1
		},
		children: [n, ce && /* @__PURE__ */ (0, V.jsx)(is, {
			transition: "fade",
			mounted: we.opened,
			duration: s?.duration || 250,
			exitDuration: s?.exitDuration || 250,
			children: (e) => /* @__PURE__ */ (0, V.jsx)(Qo, {
				withinPortal: x,
				children: /* @__PURE__ */ (0, V.jsx)(qo, {
					...le,
					...me("overlay", {
						className: le?.className,
						style: [e, le?.style]
					})
				})
			})
		})]
	});
}
bs.Target = ms, bs.Dropdown = fs, bs.ContextMenu = cs, bs.varsResolver = ys, bs.displayName = "@mantine/core/Popover", bs.extend = (e) => e, bs.withProps = (e) => {
	let t = (t) => /* @__PURE__ */ (0, V.jsx)(bs, {
		...e,
		...t
	});
	return t.extend = bs.extend, t.displayName = `WithProps(${bs.displayName})`, t;
};
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Loader/Loader.module.mjs
var xs = {
	root: "m_5ae2e3c",
	barsLoader: "m_7a2bd4cd",
	bar: "m_870bb79",
	"bars-loader-animation": "m_5d2b3b9d",
	dotsLoader: "m_4e3f22d7",
	dot: "m_870c4af",
	"loader-dots-animation": "m_aac34a1",
	ovalLoader: "m_b34414df",
	"oval-loader-animation": "m_f8e89c4b"
}, Ss = ({ className: e, ...t }) => /* @__PURE__ */ (0, V.jsxs)(G, {
	component: "span",
	className: Ue(xs.barsLoader, e),
	...t,
	children: [
		/* @__PURE__ */ (0, V.jsx)("span", { className: xs.bar }),
		/* @__PURE__ */ (0, V.jsx)("span", { className: xs.bar }),
		/* @__PURE__ */ (0, V.jsx)("span", { className: xs.bar })
	]
});
Ss.displayName = "@mantine/core/Bars";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Loader/loaders/Dots.mjs
var Cs = ({ className: e, ...t }) => /* @__PURE__ */ (0, V.jsxs)(G, {
	component: "span",
	className: Ue(xs.dotsLoader, e),
	...t,
	children: [
		/* @__PURE__ */ (0, V.jsx)("span", { className: xs.dot }),
		/* @__PURE__ */ (0, V.jsx)("span", { className: xs.dot }),
		/* @__PURE__ */ (0, V.jsx)("span", { className: xs.dot })
	]
});
Cs.displayName = "@mantine/core/Dots";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Loader/loaders/Oval.mjs
var ws = ({ className: e, ...t }) => /* @__PURE__ */ (0, V.jsx)(G, {
	component: "span",
	className: Ue(xs.ovalLoader, e),
	...t
});
ws.displayName = "@mantine/core/Oval";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Loader/Loader.mjs
var Ts = {
	bars: Ss,
	oval: ws,
	dots: Cs
}, Es = {
	loaders: Ts,
	type: "oval"
}, Ds = B((e, { size: t, color: n }) => ({ root: {
	"--loader-size": k(t, "loader-size"),
	"--loader-color": n ? st(n, e) : void 0
} })), Os = W((e) => {
	let t = H("Loader", Es, e), { size: n, color: r, type: i, vars: a, className: o, style: s, classNames: c, styles: l, unstyled: u, loaders: d, variant: f, children: p, attributes: m, ...h } = t, g = U({
		name: "Loader",
		props: t,
		classes: xs,
		className: o,
		style: s,
		classNames: c,
		styles: l,
		unstyled: u,
		attributes: m,
		vars: a,
		varsResolver: Ds
	});
	return p ? /* @__PURE__ */ (0, V.jsx)(G, {
		...g("root"),
		...h,
		children: p
	}) : /* @__PURE__ */ (0, V.jsx)(G, {
		...g("root"),
		component: d[i],
		variant: f,
		size: n,
		...h
	});
});
Os.defaultLoaders = Ts, Os.classes = xs, Os.varsResolver = Ds, Os.displayName = "@mantine/core/Loader";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/CloseButton/CloseIcon.mjs
function ks({ size: e = "var(--cb-icon-size, 70%)", style: t, ...n }) {
	return /* @__PURE__ */ (0, V.jsx)("svg", {
		viewBox: "0 0 15 15",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		style: {
			...t,
			width: e,
			height: e
		},
		...n,
		children: /* @__PURE__ */ (0, V.jsx)("path", {
			d: "M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z",
			fill: "currentColor",
			fillRule: "evenodd",
			clipRule: "evenodd"
		})
	});
}
ks.displayName = "@mantine/core/CloseIcon";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/CloseButton/CloseButton.module.mjs
var As = {
	root: "m_86a44da5",
	"root--subtle": "m_220c80f2"
}, js = { variant: "subtle" }, Ms = B((e, { size: t, radius: n, iconSize: r }) => ({ root: {
	"--cb-size": k(t, "cb-size"),
	"--cb-radius": n === void 0 ? void 0 : j(n),
	"--cb-icon-size": _(r)
} })), Ns = $n((e) => {
	let t = H("CloseButton", js, e), { iconSize: n, children: r, vars: i, radius: a, className: o, classNames: s, style: c, styles: l, unstyled: u, "data-disabled": d, disabled: f, variant: p, icon: m, mod: h, attributes: g, __staticSelector: _, ...v } = t, y = U({
		name: _ || "CloseButton",
		props: t,
		className: o,
		style: c,
		classes: As,
		classNames: s,
		styles: l,
		unstyled: u,
		attributes: g,
		vars: i,
		varsResolver: Ms
	});
	return /* @__PURE__ */ (0, V.jsxs)(Ao, {
		...v,
		unstyled: u,
		variant: p,
		disabled: f,
		mod: [{ disabled: f || d }, h],
		...y("root", {
			variant: p,
			active: !f && !d
		}),
		children: [m || /* @__PURE__ */ (0, V.jsx)(ks, {}), r]
	});
});
Ns.classes = As, Ns.varsResolver = Ms, Ns.displayName = "@mantine/core/CloseButton";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Group/filter-falsy-children/filter-falsy-children.mjs
function Ps(e) {
	return C.Children.toArray(e).filter(Boolean);
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Group/Group.module.mjs
var Fs = { root: "m_4081bf90" }, Is = {
	preventGrowOverflow: !0,
	gap: "md",
	align: "center",
	justify: "flex-start",
	wrap: "wrap"
}, Ls = B((e, { grow: t, preventGrowOverflow: n, gap: r, align: i, justify: a, wrap: o }, { childWidth: s }) => ({ root: {
	"--group-child-width": t && n ? s : void 0,
	"--group-gap": A(r),
	"--group-align": i,
	"--group-justify": a,
	"--group-wrap": o
} })), Rs = W((e) => {
	let t = H("Group", Is, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, children: s, gap: c, align: l, justify: u, wrap: d, grow: f, preventGrowOverflow: p, vars: m, variant: h, __size: g, mod: _, attributes: v, ...y } = t, b = Ps(s), x = b.length, S = A(c ?? "md");
	return /* @__PURE__ */ (0, V.jsx)(G, {
		...U({
			name: "Group",
			props: t,
			stylesCtx: { childWidth: `calc(${100 / x}% - (${S} - ${S} / ${x}))` },
			className: r,
			style: i,
			classes: Fs,
			classNames: n,
			styles: a,
			unstyled: o,
			attributes: v,
			vars: m,
			varsResolver: Ls
		})("root"),
		variant: h,
		mod: [{ grow: f }, _],
		size: g,
		...y,
		children: b
	});
});
Rs.classes = Fs, Rs.varsResolver = Ls, Rs.displayName = "@mantine/core/Group";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Input/Input.context.mjs
var zs = (0, C.createContext)({ size: "sm" }), Bs = W((e) => {
	let t = H("InputClearButton", null, e), { size: n, variant: r, vars: i, classNames: a, styles: o, ...s } = t, c = (0, C.use)(zs), { resolvedClassNames: l, resolvedStyles: u } = an({
		classNames: a,
		styles: o,
		props: t
	});
	return /* @__PURE__ */ (0, V.jsx)(Ns, {
		variant: r || "transparent",
		size: n || c?.size || "sm",
		classNames: l,
		styles: u,
		__staticSelector: "InputClearButton",
		style: {
			pointerEvents: "all",
			background: "var(--input-bg)",
			...s.style
		},
		...s
	});
});
Bs.displayName = "@mantine/core/InputClearButton";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Input/InputClearSection/InputClearSection.mjs
var Vs = {
	xs: 7,
	sm: 8,
	md: 10,
	lg: 12,
	xl: 15
};
function Hs({ __clearable: e, __clearSection: t, rightSection: n, __defaultRightSection: r, size: i = "sm", __clearSectionMode: a = "both" }) {
	let o = e && t;
	return a === "rightSection" ? n === null ? null : n || r : a === "clear" ? n === null ? null : o || r : o && (n || r) ? /* @__PURE__ */ (0, V.jsxs)("div", {
		"data-combined-clear-section": !0,
		style: {
			display: "flex",
			gap: 2,
			alignItems: "center",
			paddingInlineEnd: Vs[i]
		},
		children: [o, n || r]
	}) : n === null ? null : n || o || r;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Input/InputWrapper.context.mjs
var Us = (0, C.createContext)({
	offsetBottom: !1,
	offsetTop: !1,
	describedBy: void 0,
	getStyles: null,
	inputId: void 0,
	labelId: void 0
}), Ws = {
	wrapper: "m_6c018570",
	input: "m_8fb7ebe7",
	bottomSection: "m_93f4ed57",
	section: "m_82577fc2",
	placeholder: "m_88bacfd0",
	root: "m_46b77525",
	label: "m_8fdc1311",
	required: "m_78a94662",
	error: "m_8f816625",
	success: "m_9d9d40e0",
	description: "m_fe47ce59"
}, Gs = B((e, { size: t }) => ({ description: { "--input-description-size": t === void 0 ? void 0 : `calc(${M(t)} - ${_(2)})` } })), Ks = W((e) => {
	let t = H("InputDescription", null, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, __staticSelector: c, __inheritStyles: l = !0, attributes: u, ...d } = H("InputDescription", null, t), f = (0, C.use)(Us), p = U({
		name: ["InputWrapper", c],
		props: t,
		classes: Ws,
		className: r,
		style: i,
		classNames: n,
		styles: a,
		unstyled: o,
		attributes: u,
		rootSelector: "description",
		vars: s,
		varsResolver: Gs
	});
	return /* @__PURE__ */ (0, V.jsx)(G, {
		component: "p",
		...(l && f?.getStyles || p)("description", f?.getStyles ? {
			className: r,
			style: i
		} : void 0),
		...d
	});
});
Ks.classes = Ws, Ks.varsResolver = Gs, Ks.displayName = "@mantine/core/InputDescription";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Input/InputError/InputError.mjs
var qs = B((e, { size: t }) => ({ error: { "--input-error-size": t === void 0 ? void 0 : `calc(${M(t)} - ${_(2)})` } })), Js = W((e) => {
	let t = H("InputError", null, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, attributes: c, __staticSelector: l, __inheritStyles: u = !0, ...d } = t, f = U({
		name: ["InputWrapper", l],
		props: t,
		classes: Ws,
		className: r,
		style: i,
		classNames: n,
		styles: a,
		unstyled: o,
		attributes: c,
		rootSelector: "error",
		vars: s,
		varsResolver: qs
	}), p = (0, C.use)(Us);
	return /* @__PURE__ */ (0, V.jsx)(G, {
		component: "p",
		...(u && p?.getStyles || f)("error", p?.getStyles ? {
			className: r,
			style: i
		} : void 0),
		...d
	});
});
Js.classes = Ws, Js.varsResolver = qs, Js.displayName = "@mantine/core/InputError";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Input/InputLabel/InputLabel.mjs
var Ys = { labelElement: "label" }, Xs = B((e, { size: t }) => ({ label: {
	"--input-label-size": M(t),
	"--input-asterisk-color": void 0
} })), Zs = W((e) => {
	let t = H("InputLabel", Ys, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, labelElement: c, required: l, htmlFor: u, onMouseDown: d, children: f, __staticSelector: p, mod: m, attributes: h, ...g } = t, _ = U({
		name: ["InputWrapper", p],
		props: t,
		classes: Ws,
		className: r,
		style: i,
		classNames: n,
		styles: a,
		unstyled: o,
		attributes: h,
		rootSelector: "label",
		vars: s,
		varsResolver: Xs
	}), v = (0, C.use)(Us), y = v?.getStyles || _;
	return /* @__PURE__ */ (0, V.jsxs)(G, {
		...y("label", v?.getStyles ? {
			className: r,
			style: i
		} : void 0),
		component: c,
		htmlFor: c === "label" ? u : void 0,
		mod: [{ required: l }, m],
		onMouseDown: (e) => {
			d?.(e), !e.defaultPrevented && e.detail > 1 && e.preventDefault();
		},
		...g,
		children: [f, l && /* @__PURE__ */ (0, V.jsx)("span", {
			...y("required"),
			"aria-hidden": !0,
			children: " *"
		})]
	});
});
Zs.classes = Ws, Zs.varsResolver = Xs, Zs.displayName = "@mantine/core/InputLabel";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Input/InputPlaceholder/InputPlaceholder.mjs
var Qs = W((e) => {
	let t = H("InputPlaceholder", null, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, __staticSelector: c, error: l, mod: u, attributes: d, ...f } = t;
	return /* @__PURE__ */ (0, V.jsx)(G, {
		...U({
			name: ["InputPlaceholder", c],
			props: t,
			classes: Ws,
			className: r,
			style: i,
			classNames: n,
			styles: a,
			unstyled: o,
			attributes: d,
			rootSelector: "placeholder"
		})("placeholder"),
		mod: [{ error: !!l }, u],
		component: "span",
		...f
	});
});
Qs.classes = Ws, Qs.displayName = "@mantine/core/InputPlaceholder";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Input/InputSuccess/InputSuccess.mjs
var $s = B((e, { size: t }) => ({ success: { "--input-success-size": t === void 0 ? void 0 : `calc(${M(t)} - ${_(2)})` } })), ec = W((e) => {
	let t = H("InputSuccess", null, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, attributes: c, __staticSelector: l, __inheritStyles: u = !0, ...d } = t, f = U({
		name: ["InputWrapper", l],
		props: t,
		classes: Ws,
		className: r,
		style: i,
		classNames: n,
		styles: a,
		unstyled: o,
		attributes: c,
		rootSelector: "success",
		vars: s,
		varsResolver: $s
	}), p = (0, C.use)(Us);
	return /* @__PURE__ */ (0, V.jsx)(G, {
		component: "p",
		...(u && p?.getStyles || f)("success", p?.getStyles ? {
			className: r,
			style: i
		} : void 0),
		...d
	});
});
ec.classes = Ws, ec.varsResolver = $s, ec.displayName = "@mantine/core/InputSuccess";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Input/InputWrapper/get-input-offsets/get-input-offsets.mjs
function tc(e, { hasDescription: t, hasError: n }) {
	let r = e.findIndex((e) => e === "input"), i = e.slice(0, r), a = e.slice(r + 1), o = t && i.includes("description") || n && i.includes("error");
	return {
		offsetBottom: t && a.includes("description") || n && a.includes("error"),
		offsetTop: o
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Input/InputWrapper/InputWrapper.mjs
var nc = {
	labelElement: "label",
	inputContainer: (e) => e,
	inputWrapperOrder: [
		"label",
		"description",
		"input",
		"error"
	]
}, rc = B((e, { size: t }) => ({
	label: {
		"--input-label-size": M(t),
		"--input-asterisk-color": void 0
	},
	error: { "--input-error-size": t === void 0 ? void 0 : `calc(${M(t)} - ${_(2)})` },
	success: { "--input-success-size": t === void 0 ? void 0 : `calc(${M(t)} - ${_(2)})` },
	description: { "--input-description-size": t === void 0 ? void 0 : `calc(${M(t)} - ${_(2)})` }
})), ic = W((e) => {
	let t = H("InputWrapper", nc, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, size: c, variant: l, __staticSelector: u, inputContainer: d, inputWrapperOrder: f, label: p, error: m, success: h, description: g, labelProps: _, descriptionProps: v, errorProps: y, successProps: b, labelElement: x, children: S, withAsterisk: w, id: T, required: E, __stylesApiProps: ee, mod: D, attributes: O, ...k } = t, A = U({
		name: ["InputWrapper", u],
		props: ee || t,
		classes: Ws,
		className: r,
		style: i,
		classNames: n,
		styles: a,
		unstyled: o,
		attributes: O,
		vars: s,
		varsResolver: rc
	}), j = {
		size: c,
		variant: l,
		__staticSelector: u
	}, M = Se(T), N = typeof w == "boolean" ? w : E, P = y?.id || `${M}-error`, te = b?.id || `${M}-success`, ne = v?.id || `${M}-description`, re = M, F = !!m && typeof m != "boolean", I = !!h && typeof h != "boolean" && !m, L = !!g, ie = F && f.includes("error"), ae = I && f.includes("error"), oe = L && f.includes("description"), se = `${ie ? P : ""} ${ae ? te : ""} ${oe ? ne : ""}`, ce = se.trim().length > 0 ? se.trim() : void 0, le = _?.id || `${M}-label`, ue = p && /* @__PURE__ */ (0, V.jsx)(Zs, {
		labelElement: x,
		id: le,
		htmlFor: re,
		required: N,
		...j,
		..._,
		children: p
	}, "label"), de = L && /* @__PURE__ */ (0, V.jsx)(Ks, {
		...v,
		...j,
		size: v?.size || j.size,
		id: v?.id || ne,
		children: g
	}, "description"), fe = /* @__PURE__ */ (0, V.jsx)(C.Fragment, { children: d(S) }, "input"), pe = F && /* @__PURE__ */ (0, C.createElement)(Js, {
		...y,
		...j,
		size: y?.size || j.size,
		key: "error",
		id: y?.id || P
	}, m), me = I && /* @__PURE__ */ (0, C.createElement)(ec, {
		...b,
		...j,
		size: b?.size || j.size,
		key: "success",
		id: b?.id || te
	}, h), he = f.map((e) => {
		switch (e) {
			case "label": return ue;
			case "input": return fe;
			case "description": return de;
			case "error": return pe || me;
			default: return null;
		}
	});
	return /* @__PURE__ */ (0, V.jsx)(Us, {
		value: {
			getStyles: A,
			describedBy: ce,
			inputId: re,
			labelId: le,
			...tc(f, {
				hasDescription: L,
				hasError: F || I
			})
		},
		children: /* @__PURE__ */ (0, V.jsx)(G, {
			variant: l,
			size: c,
			mod: [{
				error: !!m,
				success: !!h && !m
			}, D],
			id: x === "label" ? void 0 : T,
			...A("root"),
			...k,
			children: he
		})
	});
});
ic.classes = Ws, ic.varsResolver = rc, ic.displayName = "@mantine/core/InputWrapper";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Input/Input.mjs
var ac = {
	variant: "default",
	leftSectionPointerEvents: "none",
	rightSectionPointerEvents: "none",
	withAria: !0,
	withErrorStyles: !0,
	withSuccessStyles: !0,
	size: "sm",
	loading: !1,
	loadingPosition: "right"
}, oc = B((e, t, n) => ({ wrapper: {
	"--input-margin-top": n.offsetTop ? "calc(var(--mantine-spacing-xs) / 2)" : void 0,
	"--input-margin-bottom": n.offsetBottom ? "calc(var(--mantine-spacing-xs) / 2)" : void 0,
	"--input-height": k(t.size, "input-height"),
	"--input-fz": M(t.size),
	"--input-radius": t.radius === void 0 ? void 0 : j(t.radius),
	"--input-left-section-width": t.leftSectionWidth === void 0 ? void 0 : _(t.leftSectionWidth),
	"--input-right-section-width": t.rightSectionWidth === void 0 ? void 0 : _(t.rightSectionWidth),
	"--input-padding-y": t.multiline ? k(t.size, "input-padding-y") : void 0,
	"--input-left-section-pointer-events": t.leftSectionPointerEvents,
	"--input-right-section-pointer-events": t.rightSectionPointerEvents
} })), sc = $n((e) => {
	let t = H("Input", ac, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, required: s, __staticSelector: c, __stylesApiProps: l, size: u, wrapperProps: d, error: f, success: p, disabled: m, leftSection: h, leftSectionProps: g, leftSectionWidth: _, rightSection: v, rightSectionProps: y, rightSectionWidth: b, rightSectionPointerEvents: x, leftSectionPointerEvents: S, variant: w, vars: T, pointer: E, multiline: ee, radius: D, id: O, withAria: k, withErrorStyles: A, withSuccessStyles: j, mod: M, inputSize: N, attributes: P, __clearSection: te, __clearable: ne, __clearSectionMode: re, __defaultRightSection: F, loading: I, loadingPosition: L, __bottomSection: ie, __bottomSectionProps: ae, rootRef: oe, dir: se, ...ce } = t, { styleProps: le, rest: ue } = Tn(ce), de = (0, C.use)(Us), fe = {
		offsetBottom: de?.offsetBottom,
		offsetTop: de?.offsetTop
	}, pe = U({
		name: ["Input", c],
		props: l || t,
		classes: Ws,
		className: r,
		style: i,
		classNames: n,
		styles: a,
		unstyled: o,
		attributes: P,
		stylesCtx: fe,
		rootSelector: "wrapper",
		vars: T,
		varsResolver: oc
	}), me = k ? {
		required: s,
		disabled: m,
		"aria-invalid": f ? !0 : void 0,
		"aria-describedby": de?.describedBy,
		id: de?.inputId || O
	} : {}, he = I ? /* @__PURE__ */ (0, V.jsx)(Os, { size: L === "left" ? "calc(var(--input-left-section-size) / 2)" : "calc(var(--input-right-section-size) / 2)" }) : null, R = I && L === "left" ? he : h, ge = Hs({
		__clearable: ne,
		__clearSection: te,
		rightSection: I && L === "right" ? he : v,
		__defaultRightSection: F,
		size: u,
		__clearSectionMode: re
	});
	return /* @__PURE__ */ (0, V.jsx)(zs, {
		value: { size: u || "sm" },
		children: /* @__PURE__ */ (0, V.jsxs)(G, {
			ref: oe,
			dir: se,
			...pe("wrapper"),
			...le,
			...d,
			mod: [{
				error: !!f && A,
				success: !!p && !f && j,
				pointer: E,
				disabled: m,
				multiline: ee,
				"data-with-right-section": !!ge,
				"data-with-left-section": !!R,
				"data-with-bottom-section": !!ie
			}, M],
			variant: w,
			size: u,
			children: [
				R && /* @__PURE__ */ (0, V.jsx)("div", {
					...g,
					"data-position": "left",
					...pe("section", {
						className: g?.className,
						style: g?.style
					}),
					children: R
				}),
				/* @__PURE__ */ (0, V.jsx)(G, {
					component: "input",
					...ue,
					...me,
					required: s,
					mod: {
						disabled: m,
						error: !!f && A,
						success: !!p && !f && j
					},
					variant: w,
					__size: N,
					...pe("input")
				}),
				ie && /* @__PURE__ */ (0, V.jsx)("div", {
					...ae,
					...pe("bottomSection", {
						className: ae?.className,
						style: ae?.style
					}),
					children: ie
				}),
				ge && /* @__PURE__ */ (0, V.jsx)("div", {
					...y,
					"data-position": "right",
					...pe("section", {
						className: y?.className,
						style: y?.style
					}),
					children: ge
				})
			]
		})
	});
});
sc.classes = Ws, sc.varsResolver = oc, sc.Wrapper = ic, sc.Label = Zs, sc.Error = Js, sc.Success = ec, sc.Description = Ks, sc.Placeholder = Qs, sc.ClearButton = Bs, sc.displayName = "@mantine/core/Input";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Input/use-input-props.mjs
function cc(e, t, n) {
	let r = H([
		"Input",
		"InputWrapper",
		e
	], t, n), { label: i, description: a, error: o, success: s, required: c, classNames: l, styles: u, className: d, unstyled: f, __staticSelector: p, __stylesApiProps: m, errorProps: h, successProps: g, labelProps: _, descriptionProps: v, wrapperProps: y, id: b, size: x, style: S, inputContainer: C, inputWrapperOrder: w, withAsterisk: T, variant: E, vars: ee, mod: D, attributes: O, ...k } = r, { styleProps: A, rest: j } = Tn(k), M = {
		label: i,
		description: a,
		error: o,
		success: s,
		required: c,
		classNames: l,
		className: d,
		__staticSelector: p,
		__stylesApiProps: m || r,
		errorProps: h,
		successProps: g,
		labelProps: _,
		descriptionProps: v,
		unstyled: f,
		styles: u,
		size: x,
		style: S,
		inputContainer: C,
		inputWrapperOrder: w,
		withAsterisk: T,
		variant: E,
		id: b,
		mod: D,
		attributes: O,
		...y
	};
	return {
		...j,
		classNames: l,
		styles: u,
		unstyled: f,
		wrapperProps: {
			...M,
			...A
		},
		inputProps: {
			required: c,
			classNames: l,
			styles: u,
			unstyled: f,
			size: x,
			__staticSelector: p,
			__stylesApiProps: m || r,
			error: o,
			success: s,
			variant: E,
			id: b,
			attributes: O
		}
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/InputBase/InputBase.mjs
var lc = {
	__staticSelector: "InputBase",
	withAria: !0,
	size: "sm"
}, uc = $n((e) => {
	let { inputProps: t, wrapperProps: n, ...r } = cc("InputBase", lc, e);
	return /* @__PURE__ */ (0, V.jsx)(sc.Wrapper, {
		...n,
		children: /* @__PURE__ */ (0, V.jsx)(sc, {
			...t,
			...r
		})
	});
});
uc.classes = {
	...sc.classes,
	...sc.Wrapper.classes
}, uc.displayName = "@mantine/core/InputBase";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Alert/Alert.module.mjs
var dc = {
	root: "m_66836ed3",
	wrapper: "m_a5d60502",
	body: "m_667c2793",
	title: "m_6a03f287",
	label: "m_698f4f23",
	icon: "m_667f2a6a",
	message: "m_7fa78076",
	closeButton: "m_87f54839"
}, fc = B((e, { radius: t, color: n, variant: r, autoContrast: i }) => {
	let a = e.variantColorResolver({
		color: n || e.primaryColor,
		theme: e,
		variant: r || "light",
		autoContrast: i
	});
	return { root: {
		"--alert-radius": t === void 0 ? void 0 : j(t),
		"--alert-bg": n || r ? a.background : void 0,
		"--alert-color": a.color,
		"--alert-bd": n || r ? a.border : void 0
	} };
}), pc = W((e) => {
	let t = H("Alert", null, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, radius: c, color: l, title: u, children: d, id: f, icon: p, withCloseButton: m, onClose: h, closeButtonLabel: g, variant: _, autoContrast: v, role: y, attributes: b, ...x } = t, S = U({
		name: "Alert",
		classes: dc,
		props: t,
		className: r,
		style: i,
		classNames: n,
		styles: a,
		unstyled: o,
		attributes: b,
		vars: s,
		varsResolver: fc
	}), C = Se(f), w = u && `${C}-title` || void 0, T = `${C}-body`;
	return /* @__PURE__ */ (0, V.jsx)(G, {
		id: C,
		...S("root", { variant: _ }),
		variant: _,
		...x,
		role: y || "alert",
		"aria-describedby": d ? T : void 0,
		"aria-labelledby": u ? w : void 0,
		children: /* @__PURE__ */ (0, V.jsxs)("div", {
			...S("wrapper"),
			children: [
				p && /* @__PURE__ */ (0, V.jsx)("div", {
					...S("icon"),
					children: p
				}),
				/* @__PURE__ */ (0, V.jsxs)("div", {
					...S("body"),
					children: [u && /* @__PURE__ */ (0, V.jsx)("div", {
						...S("title"),
						"data-with-close-button": m || void 0,
						children: /* @__PURE__ */ (0, V.jsx)("span", {
							id: w,
							...S("label"),
							children: u
						})
					}), d && /* @__PURE__ */ (0, V.jsx)("div", {
						id: T,
						...S("message"),
						"data-variant": _,
						children: d
					})]
				}),
				m && /* @__PURE__ */ (0, V.jsx)(Ns, {
					...S("closeButton"),
					onClick: h,
					variant: "transparent",
					size: 16,
					iconSize: 16,
					"aria-label": g,
					unstyled: o
				})
			]
		})
	});
});
pc.classes = dc, pc.varsResolver = fc, pc.displayName = "@mantine/core/Alert";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Text/Text.module.mjs
var mc = { root: "m_b6d8b162" };
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Text/Text.mjs
function hc(e) {
	if (e === "start") return "start";
	if (e === "end" || e) return "end";
}
var gc = { inherit: !1 }, _c = B((e, { variant: t, lineClamp: n, gradient: r, size: i, textWrap: a }) => ({ root: {
	"--text-fz": M(i),
	"--text-lh": N(i),
	"--text-gradient": t === "gradient" ? ut(r, e) : void 0,
	"--text-line-clamp": typeof n == "number" ? n.toString() : void 0,
	"--text-text-wrap": a
} })), J = $n((e) => {
	let t = H("Text", gc, e), { lineClamp: n, truncate: r, inline: i, inherit: a, gradient: o, span: s, textWrap: c, __staticSelector: l, vars: u, className: d, style: f, classNames: p, styles: m, unstyled: h, variant: g, mod: _, size: v, attributes: y, ...b } = t;
	return /* @__PURE__ */ (0, V.jsx)(G, {
		...U({
			name: ["Text", l],
			props: t,
			classes: mc,
			className: d,
			style: f,
			classNames: p,
			styles: m,
			unstyled: h,
			attributes: y,
			vars: u,
			varsResolver: _c
		})("root", { focusable: !0 }),
		component: s ? "span" : "p",
		variant: g,
		mod: [{
			"data-truncate": hc(r),
			"data-line-clamp": typeof n == "number",
			"data-inline": i,
			"data-inherit": a
		}, _],
		size: v,
		...b
	});
});
J.classes = mc, J.varsResolver = _c, J.displayName = "@mantine/core/Text";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/get-parsed-combobox-data/get-parsed-combobox-data.mjs
function vc(e) {
	return typeof e == "string" ? {
		value: e,
		label: e
	} : typeof e == "object" && "value" in e && !("label" in e) ? {
		value: e.value,
		label: `${e.value}`,
		disabled: e.disabled
	} : typeof e == "object" && "group" in e ? {
		group: e.group,
		items: e.items.map((e) => vc(e))
	} : typeof e == "number" || typeof e == "bigint" || typeof e == "boolean" ? {
		value: e,
		label: `${e}`
	} : e;
}
function yc(e) {
	return e ? e.map((e) => vc(e)) : [];
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/get-options-lockup/get-options-lockup.mjs
function bc(e) {
	return e.reduce((e, t) => "group" in t ? {
		...e,
		...bc(t.items)
	} : (e[`${t.value}`] = t, e), {});
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/Combobox.module.mjs
var xc = {
	dropdown: "m_88b62a41",
	search: "m_985517d8",
	options: "m_b2821a6e",
	option: "m_92253aa5",
	empty: "m_2530cd1d",
	header: "m_858f94bd",
	footer: "m_82b967cb",
	group: "m_254f3e4f",
	groupLabel: "m_2bb2e9e5",
	chevron: "m_2943220b",
	optionsDropdownOption: "m_390b5f4",
	optionsDropdownCheckIcon: "m_8ee53fc2",
	optionsDropdownCheckPlaceholder: "m_a530ee0a"
}, Sc = { error: null }, Cc = B((e, { size: t, color: n }) => ({ chevron: {
	"--combobox-chevron-size": k(t, "combobox-chevron-size"),
	"--combobox-chevron-color": n ? st(n, e) : void 0
} })), wc = W((e) => {
	let t = H("ComboboxChevron", Sc, e), { size: n, error: r, style: i, className: a, classNames: o, styles: s, unstyled: c, vars: l, attributes: u, mod: d, ...f } = t, p = U({
		name: "ComboboxChevron",
		classes: xc,
		props: t,
		style: i,
		className: a,
		classNames: o,
		styles: s,
		unstyled: c,
		vars: l,
		varsResolver: Cc,
		attributes: u,
		rootSelector: "chevron"
	});
	return /* @__PURE__ */ (0, V.jsx)(G, {
		component: "svg",
		...f,
		...p("chevron"),
		size: n,
		viewBox: "0 0 15 15",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		mod: [
			"combobox-chevron",
			{ error: r },
			d
		],
		children: /* @__PURE__ */ (0, V.jsx)("path", {
			d: "M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819C5.10753 6.24392 5.39245 6.24392 5.56819 6.06819L7.49999 4.13638L9.43179 6.06819C9.60753 6.24392 9.89245 6.24392 10.0682 6.06819C10.2439 5.89245 10.2439 5.60753 10.0682 5.43179L7.81819 3.18179C7.73379 3.0974 7.61933 3.04999 7.49999 3.04999C7.38064 3.04999 7.26618 3.0974 7.18179 3.18179L4.93179 5.43179ZM10.0682 9.56819C10.2439 9.39245 10.2439 9.10753 10.0682 8.93179C9.89245 8.75606 9.60753 8.75606 9.43179 8.93179L7.49999 10.8636L5.56819 8.93179C5.39245 8.75606 5.10753 8.75606 4.93179 8.93179C4.75605 9.10753 4.75605 9.39245 4.93179 9.56819L7.18179 11.8182C7.35753 11.9939 7.64245 11.9939 7.81819 11.8182L10.0682 9.56819Z",
			fill: "currentColor",
			fillRule: "evenodd",
			clipRule: "evenodd"
		})
	});
});
wc.classes = xc, wc.varsResolver = Cc, wc.displayName = "@mantine/core/ComboboxChevron";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/Combobox.context.mjs
var [Tc, Ec] = T("Combobox component was not found in tree");
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/ComboboxClearButton/ComboboxClearButton.mjs
function Dc({ onMouseDown: e, onClick: t, onClear: n, ...r }) {
	return /* @__PURE__ */ (0, V.jsx)(sc.ClearButton, {
		tabIndex: -1,
		"aria-hidden": !0,
		...r,
		onMouseDown: (t) => {
			t.preventDefault(), e?.(t);
		},
		onClick: (e) => {
			n(), t?.(e);
		}
	});
}
Dc.displayName = "@mantine/core/ComboboxClearButton";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/ComboboxDropdown/ComboboxDropdown.mjs
var Oc = W((e) => {
	let { classNames: t, styles: n, className: r, style: i, hidden: a, ...o } = H("ComboboxDropdown", null, e), s = Ec();
	return /* @__PURE__ */ (0, V.jsx)(bs.Dropdown, {
		...o,
		role: "presentation",
		"data-hidden": a || void 0,
		"data-floating-height": s.floatingHeight || void 0,
		...s.getStyles("dropdown", {
			className: r,
			style: i,
			classNames: t,
			styles: n
		})
	});
});
Oc.classes = xc, Oc.displayName = "@mantine/core/ComboboxDropdown";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/ComboboxDropdownTarget/ComboboxDropdownTarget.mjs
var kc = { refProp: "ref" }, Ac = W((e) => {
	let { children: t, refProp: n, ref: r } = H("ComboboxDropdownTarget", kc, e);
	if (Ec(), !w(t)) throw Error("Combobox.DropdownTarget component children should be an element or a component that accepts ref. Fragments, strings, numbers and other primitive values are not supported");
	return /* @__PURE__ */ (0, V.jsx)(bs.Target, {
		ref: r,
		refProp: n,
		children: t
	});
});
Ac.displayName = "@mantine/core/ComboboxDropdownTarget";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/ComboboxEmpty/ComboboxEmpty.mjs
var jc = W((e) => {
	let { classNames: t, className: n, style: r, styles: i, vars: a, ...o } = H("ComboboxEmpty", null, e);
	return /* @__PURE__ */ (0, V.jsx)(G, {
		...Ec().getStyles("empty", {
			className: n,
			classNames: t,
			styles: i,
			style: r
		}),
		...o
	});
});
jc.classes = xc, jc.displayName = "@mantine/core/ComboboxEmpty";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/use-combobox-target-props/use-combobox-target-props.mjs
function Mc({ onKeyDown: e, onClick: t, withKeyboardNavigation: n, withAriaAttributes: r, withExpandedAttribute: i, targetType: a, autoComplete: o }) {
	let s = Ec(), [c, l] = (0, C.useState)(null), u = (t) => {
		if (e?.(t), !s.readOnly && n) {
			if (t.nativeEvent.isComposing) return;
			if (t.nativeEvent.code === "ArrowDown" && (t.preventDefault(), s.store.dropdownOpened ? l(s.store.selectNextOption()) : (s.store.openDropdown("keyboard"), l(s.store.selectActiveOption()), s.store.updateSelectedOptionIndex("selected", { scrollIntoView: !0 }))), t.nativeEvent.code === "ArrowUp" && (t.preventDefault(), s.store.dropdownOpened ? l(s.store.selectPreviousOption()) : (s.store.openDropdown("keyboard"), l(s.store.selectActiveOption()), s.store.updateSelectedOptionIndex("selected", { scrollIntoView: !0 }))), t.nativeEvent.code === "Enter" || t.nativeEvent.code === "NumpadEnter") {
				if (t.nativeEvent.keyCode === 229) return;
				let e = s.store.getSelectedOptionIndex();
				s.store.dropdownOpened && e !== -1 ? (t.preventDefault(), s.store.clickSelectedOption()) : a === "button" && (t.preventDefault(), s.store.openDropdown("keyboard"));
			}
			t.key === "Escape" && s.store.closeDropdown("keyboard"), t.nativeEvent.code === "Space" && a === "button" && (t.preventDefault(), s.store.toggleDropdown("keyboard"));
		}
	}, d = r ? {
		...i ? { role: "combobox" } : {},
		"aria-haspopup": "listbox",
		"aria-expanded": i ? !!(s.store.listId && s.store.dropdownOpened) : void 0,
		"aria-controls": s.store.dropdownOpened && s.store.listId ? s.store.listId : void 0,
		"aria-activedescendant": s.store.dropdownOpened && c || void 0,
		autoComplete: o,
		"data-expanded": s.store.dropdownOpened || void 0,
		"data-mantine-stop-propagation": s.store.dropdownOpened || void 0
	} : {}, f = (e) => {
		a === "button" && e.currentTarget.focus(), t?.(e);
	};
	return {
		...d,
		onKeyDown: u,
		onClick: f
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/ComboboxEventsTarget/ComboboxEventsTarget.mjs
var Nc = {
	refProp: "ref",
	targetType: "input",
	withKeyboardNavigation: !0,
	withAriaAttributes: !0,
	withExpandedAttribute: !1,
	autoComplete: "off"
}, Pc = W((e) => {
	let { children: t, refProp: n, withKeyboardNavigation: r, withAriaAttributes: i, withExpandedAttribute: a, targetType: o, autoComplete: s, ref: c, ...l } = H("ComboboxEventsTarget", Nc, e), u = Ve(t);
	if (!u) throw Error("Combobox.EventsTarget component children should be an element or a component that accepts ref. Fragments, strings, numbers and other primitive values are not supported");
	let d = Ec();
	return (0, C.cloneElement)(u, {
		...Mc({
			targetType: o,
			withAriaAttributes: i,
			withKeyboardNavigation: r,
			withExpandedAttribute: a,
			onKeyDown: u.props.onKeyDown,
			onClick: u.props.onClick,
			autoComplete: s
		}),
		...l,
		[n]: Te(c, d.store.targetRef, Le(u))
	});
});
Pc.displayName = "@mantine/core/ComboboxEventsTarget";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/ComboboxFooter/ComboboxFooter.mjs
var Fc = W((e) => {
	let { classNames: t, className: n, style: r, styles: i, vars: a, ...o } = H("ComboboxFooter", null, e);
	return /* @__PURE__ */ (0, V.jsx)(G, {
		...Ec().getStyles("footer", {
			className: n,
			classNames: t,
			style: r,
			styles: i
		}),
		...o,
		onMouseDown: (e) => {
			e.preventDefault();
		}
	});
});
Fc.classes = xc, Fc.displayName = "@mantine/core/ComboboxFooter";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/ComboboxGroup/ComboboxGroup.mjs
var Ic = W((e) => {
	let { classNames: t, className: n, style: r, styles: i, vars: a, children: o, label: s, id: c, ...l } = H("ComboboxGroup", null, e), u = Ec(), d = Se(c), f = s != null && s !== !1 && s !== "";
	return /* @__PURE__ */ (0, V.jsxs)(G, {
		role: "group",
		"aria-labelledby": f ? d : void 0,
		...u.getStyles("group", {
			className: n,
			classNames: t,
			style: r,
			styles: i
		}),
		...l,
		children: [f && /* @__PURE__ */ (0, V.jsx)("div", {
			id: d,
			...u.getStyles("groupLabel", {
				classNames: t,
				styles: i
			}),
			children: s
		}), o]
	});
});
Ic.classes = xc, Ic.displayName = "@mantine/core/ComboboxGroup";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/ComboboxHeader/ComboboxHeader.mjs
var Lc = W((e) => {
	let { classNames: t, className: n, style: r, styles: i, vars: a, ...o } = H("ComboboxHeader", null, e);
	return /* @__PURE__ */ (0, V.jsx)(G, {
		...Ec().getStyles("header", {
			className: n,
			classNames: t,
			style: r,
			styles: i
		}),
		...o,
		onMouseDown: (e) => {
			e.preventDefault();
		}
	});
});
Lc.classes = xc, Lc.displayName = "@mantine/core/ComboboxHeader";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/ComboboxHiddenInput/ComboboxHiddenInput.mjs
function Rc({ value: e, valuesDivider: t = ",", ...n }) {
	return /* @__PURE__ */ (0, V.jsx)("input", {
		type: "hidden",
		value: Array.isArray(e) ? e.join(t) : e ? `${e}` : "",
		...n
	});
}
Rc.displayName = "@mantine/core/ComboboxHiddenInput";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/ComboboxOption/ComboboxOption.mjs
var zc = W((e) => {
	let t = H("ComboboxOption", null, e), { classNames: n, className: r, style: i, styles: a, vars: o, onClick: s, id: c, active: l, onMouseDown: u, onMouseOver: d, disabled: f, selected: p, mod: m, ...h } = t, g = Ec(), _ = (0, C.useId)(), v = c || _;
	return /* @__PURE__ */ (0, V.jsx)(G, {
		...g.getStyles("option", {
			className: r,
			classNames: n,
			styles: a,
			style: i
		}),
		...h,
		id: v,
		mod: [
			"combobox-option",
			{
				"combobox-active": l,
				"combobox-disabled": f,
				"combobox-selected": p
			},
			m
		],
		role: "option",
		onClick: (e) => {
			f ? e.preventDefault() : (g.onOptionSubmit?.(t.value, t), s?.(e));
		},
		onMouseDown: (e) => {
			e.preventDefault(), u?.(e);
		},
		onMouseOver: (e) => {
			g.resetSelectionOnOptionHover && g.store.resetSelectedOption(), d?.(e);
		}
	});
});
zc.classes = xc, zc.displayName = "@mantine/core/ComboboxOption";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/ComboboxOptions/ComboboxOptions.mjs
var Bc = W((e) => {
	let { classNames: t, className: n, style: r, styles: i, id: a, onMouseDown: o, labelledBy: s, ...c } = H("ComboboxOptions", null, e), l = Ec(), u = Se(a);
	return (0, C.useEffect)(() => {
		l.store.setListId(u);
	}, [u]), /* @__PURE__ */ (0, V.jsx)(G, {
		...l.getStyles("options", {
			className: n,
			style: r,
			classNames: t,
			styles: i
		}),
		...c,
		id: u,
		role: "listbox",
		"aria-labelledby": s,
		onMouseDown: (e) => {
			e.preventDefault(), o?.(e);
		}
	});
});
Bc.classes = xc, Bc.displayName = "@mantine/core/ComboboxOptions";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/ComboboxSearch/ComboboxSearch.mjs
var Vc = {
	withAriaAttributes: !0,
	withKeyboardNavigation: !0
}, Hc = W((e) => {
	let { classNames: t, styles: n, unstyled: r, vars: i, withAriaAttributes: a, onKeyDown: o, onClick: s, withKeyboardNavigation: c, size: l, ref: u, ...d } = H("ComboboxSearch", Vc, e), f = Ec(), p = f.getStyles("search"), m = Mc({
		targetType: "input",
		withAriaAttributes: a,
		withKeyboardNavigation: c,
		withExpandedAttribute: !1,
		onKeyDown: o,
		onClick: s,
		autoComplete: "off"
	});
	return /* @__PURE__ */ (0, V.jsx)(sc, {
		ref: Te(u, f.store.searchRef),
		classNames: [{ input: p.className }, t],
		styles: [{ input: p.style }, n],
		size: l || f.size,
		...m,
		...d,
		__staticSelector: "Combobox"
	});
});
Hc.classes = xc, Hc.displayName = "@mantine/core/ComboboxSearch";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/ComboboxTarget/ComboboxTarget.mjs
var Uc = {
	refProp: "ref",
	targetType: "input",
	withKeyboardNavigation: !0,
	withAriaAttributes: !0,
	withExpandedAttribute: !1,
	autoComplete: "off"
}, Wc = W((e) => {
	let { children: t, refProp: n, withKeyboardNavigation: r, withAriaAttributes: i, withExpandedAttribute: a, targetType: o, autoComplete: s, ref: c, ...l } = H("ComboboxTarget", Uc, e), u = Ve(t);
	if (!u) throw Error("Combobox.Target component children should be an element or a component that accepts ref. Fragments, strings, numbers and other primitive values are not supported");
	let d = Ec(), f = (0, C.cloneElement)(u, {
		...Mc({
			targetType: o,
			withAriaAttributes: i,
			withKeyboardNavigation: r,
			withExpandedAttribute: a,
			onKeyDown: u.props.onKeyDown,
			onClick: u.props.onClick,
			autoComplete: s
		}),
		...l
	});
	return /* @__PURE__ */ (0, V.jsx)(bs.Target, {
		refProp: n,
		ref: Te(c, d.store.targetRef),
		children: f
	});
});
Wc.displayName = "@mantine/core/ComboboxTarget";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/use-combobox/get-index/get-index.mjs
function Gc(e, t, n) {
	for (let n = e - 1; n >= 0; --n) if (!t[n].hasAttribute("data-combobox-disabled")) return n;
	if (n) {
		for (let e = t.length - 1; e > -1; --e) if (!t[e].hasAttribute("data-combobox-disabled")) return e;
	}
	return e;
}
function Kc(e, t, n) {
	for (let n = e + 1; n < t.length; n += 1) if (!t[n].hasAttribute("data-combobox-disabled")) return n;
	if (n) {
		for (let e = 0; e < t.length; e += 1) if (!t[e].hasAttribute("data-combobox-disabled")) return e;
	}
	return e;
}
function qc(e) {
	for (let t = 0; t < e.length; t += 1) if (!e[t].hasAttribute("data-combobox-disabled")) return t;
	return -1;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/use-combobox/use-combobox.mjs
function Jc({ defaultOpened: e, opened: t, onOpenedChange: n, onDropdownClose: r, onDropdownOpen: i, loop: a = !0, scrollBehavior: o = "instant" } = {}) {
	let [s, c] = Ee({
		value: t,
		defaultValue: e,
		finalValue: !1,
		onChange: n
	}), l = (0, C.useRef)(null), u = (0, C.useRef)(-1), d = (0, C.useRef)(null), f = (0, C.useRef)(null), p = (0, C.useRef)(-1), m = (0, C.useRef)(-1), h = (0, C.useRef)(-1), g = (0, C.useCallback)((e = "unknown") => {
		s || (c(!0), i?.(e));
	}, [
		c,
		i,
		s
	]), _ = (0, C.useCallback)((e = "unknown") => {
		s && (c(!1), r?.(e));
	}, [
		c,
		r,
		s
	]), v = (0, C.useCallback)((e = "unknown") => {
		s ? _(e) : g(e);
	}, [
		_,
		g,
		s
	]), y = (0, C.useCallback)(() => {
		let e = Be(f.current), t = Re(`#${l.current} [data-combobox-selected]`, e);
		t?.removeAttribute("data-combobox-selected"), t?.removeAttribute("aria-selected");
	}, []), b = (0, C.useCallback)((e) => {
		let t = Be(f.current), n = Re(`#${l.current}`, t), r = n ? ze("[data-combobox-option]", n) : null;
		if (!r) return null;
		let i = e >= r.length ? 0 : e < 0 ? r.length - 1 : e;
		return u.current = i, r?.[i] && !r[i].hasAttribute("data-combobox-disabled") ? (y(), r[i].setAttribute("data-combobox-selected", "true"), r[i].setAttribute("aria-selected", "true"), r[i].scrollIntoView({
			block: "nearest",
			behavior: o
		}), r[i].id) : null;
	}, [o, y]), x = (0, C.useCallback)(() => {
		let e = Be(f.current), t = Re(`#${l.current} [data-combobox-active]`, e);
		if (t) {
			let n = ze(`#${l.current} [data-combobox-option]`, e).findIndex((e) => e === t);
			return b(n);
		}
		return b(0);
	}, [b]), S = (0, C.useCallback)(() => {
		let e = Be(f.current), t = ze(`#${l.current} [data-combobox-option]`, e);
		return b(Kc(u.current, t, a));
	}, [b, a]), w = (0, C.useCallback)(() => {
		let e = Be(f.current), t = ze(`#${l.current} [data-combobox-option]`, e);
		return b(Gc(u.current, t, a));
	}, [b, a]), T = (0, C.useCallback)(() => {
		let e = Be(f.current), t = ze(`#${l.current} [data-combobox-option]`, e);
		return b(qc(t));
	}, [b]), E = (0, C.useCallback)((e = "selected", t) => {
		if (typeof e == "number") {
			u.current = e;
			let n = Be(f.current), r = ze(`#${l.current} [data-combobox-option]`, n);
			t?.scrollIntoView && r[e]?.scrollIntoView({
				block: "nearest",
				behavior: o
			});
			return;
		}
		h.current = window.setTimeout(() => {
			let n = Be(f.current), r = ze(`#${l.current} [data-combobox-option]`, n), i = r.findIndex((t) => t.hasAttribute(`data-combobox-${e}`));
			u.current = i, t?.scrollIntoView && r[i]?.scrollIntoView({
				block: "nearest",
				behavior: o
			});
		}, 0);
	}, []), ee = (0, C.useCallback)(() => {
		u.current = -1, y();
	}, [y]), D = (0, C.useCallback)(() => {
		let e = Be(f.current);
		(ze(`#${l.current} [data-combobox-option]`, e)?.[u.current])?.click();
	}, []), O = (0, C.useCallback)((e) => {
		l.current = e;
	}, []), k = (0, C.useCallback)(() => {
		p.current = window.setTimeout(() => d.current?.focus(), 0);
	}, []), A = (0, C.useCallback)(() => {
		m.current = window.setTimeout(() => f.current?.focus(), 0);
	}, []), j = (0, C.useCallback)(() => u.current, []);
	return (0, C.useEffect)(() => () => {
		window.clearTimeout(p.current), window.clearTimeout(m.current), window.clearTimeout(h.current);
	}, []), {
		dropdownOpened: s,
		openDropdown: g,
		closeDropdown: _,
		toggleDropdown: v,
		selectedOptionIndex: u.current,
		getSelectedOptionIndex: j,
		selectOption: b,
		selectFirstOption: T,
		selectActiveOption: x,
		selectNextOption: S,
		selectPreviousOption: w,
		resetSelectedOption: ee,
		updateSelectedOptionIndex: E,
		listId: l.current,
		setListId: O,
		clickSelectedOption: D,
		searchRef: d,
		focusSearchInput: k,
		targetRef: f,
		focusTarget: A
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/Combobox.mjs
var Yc = {
	keepMounted: !0,
	keepMountedMode: "display-none",
	withinPortal: !0,
	resetSelectionOnOptionHover: !1,
	width: "target",
	transitionProps: {
		transition: "fade",
		duration: 0
	},
	size: "sm"
}, Xc = B((e, { size: t, dropdownPadding: n }) => ({
	options: {
		"--combobox-option-fz": M(t),
		"--combobox-option-padding": k(t, "combobox-option-padding")
	},
	dropdown: {
		"--combobox-padding": n === void 0 ? void 0 : _(n),
		"--combobox-option-fz": M(t),
		"--combobox-option-padding": k(t, "combobox-option-padding")
	}
})), Zc = (e) => {
	let t = H("Combobox", Yc, e), { classNames: n, styles: r, unstyled: i, children: a, store: o, vars: s, onOptionSubmit: c, onClose: l, size: u, dropdownPadding: d, resetSelectionOnOptionHover: f, __staticSelector: p, readOnly: m, attributes: h, floatingHeight: g, middlewares: _, ...v } = t, y = g === "viewport" ? {
		..._,
		flip: !1,
		size: {
			...typeof _?.size == "object" ? _.size : {},
			padding: typeof _?.size == "object" && _.size.padding !== void 0 ? _.size.padding : 10,
			apply: ({ availableHeight: e, availableWidth: t, elements: n, ...r }) => {
				n.floating.style.setProperty("--combobox-floating-max-height", `${e}px`);
				let i = _?.size;
				typeof i == "object" && i.apply ? i.apply({
					availableHeight: e,
					availableWidth: t,
					elements: n,
					...r
				}) : i && Object.assign(n.floating.style, {
					maxWidth: `${t}px`,
					maxHeight: `${e}px`
				});
			}
		}
	} : _, b = Jc(), x = o || b, S = U({
		name: p || "Combobox",
		classes: xc,
		props: t,
		classNames: n,
		styles: r,
		unstyled: i,
		attributes: h,
		vars: s,
		varsResolver: Xc
	}), C = () => {
		l?.(), x.closeDropdown();
	};
	return /* @__PURE__ */ (0, V.jsx)(Tc, {
		value: {
			getStyles: S,
			store: x,
			onOptionSubmit: c,
			size: u,
			resetSelectionOnOptionHover: f,
			readOnly: m,
			floatingHeight: g
		},
		children: /* @__PURE__ */ (0, V.jsx)(bs, {
			opened: x.dropdownOpened,
			...v,
			middlewares: y,
			onChange: (e) => !e && C(),
			withRoles: !1,
			unstyled: i,
			children: a
		})
	});
};
Zc.extend = (e) => e, Zc.classes = xc, Zc.varsResolver = Xc, Zc.displayName = "@mantine/core/Combobox", Zc.Target = Wc, Zc.Dropdown = Oc, Zc.Options = Bc, Zc.Option = zc, Zc.Search = Hc, Zc.Empty = jc, Zc.Chevron = wc, Zc.Footer = Fc, Zc.Header = Lc, Zc.EventsTarget = Pc, Zc.DropdownTarget = Ac, Zc.Group = Ic, Zc.ClearButton = Dc, Zc.HiddenInput = Rc;
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Checkbox/CheckIcon.mjs
function Qc({ size: e, style: t, ...n }) {
	return /* @__PURE__ */ (0, V.jsx)("svg", {
		viewBox: "0 0 10 7",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		style: e === void 0 ? t : {
			width: _(e),
			height: _(e),
			...t
		},
		"aria-hidden": !0,
		...n,
		children: /* @__PURE__ */ (0, V.jsx)("path", {
			d: "M4 4.586L1.707 2.293A1 1 0 1 0 .293 3.707l3 3a.997.997 0 0 0 1.414 0l5-5A1 1 0 1 0 8.293.293L4 4.586z",
			fill: "currentColor",
			fillRule: "evenodd",
			clipRule: "evenodd"
		})
	});
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/OptionsDropdown/is-options-group.mjs
function $c(e) {
	return "group" in e;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/OptionsDropdown/default-options-filter.mjs
function el({ options: e, search: t, limit: n }) {
	let r = t.trim().toLowerCase(), i = [];
	for (let a = 0; a < e.length; a += 1) {
		let o = e[a];
		if (i.length === n) return i;
		$c(o) && i.push({
			group: o.group,
			items: el({
				options: o.items,
				search: t,
				limit: n - i.length
			})
		}), $c(o) || o.label.toLowerCase().includes(r) && i.push(o);
	}
	return i;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/OptionsDropdown/is-empty-combobox-data.mjs
function tl(e) {
	if (e.length === 0) return !0;
	for (let t of e) if (!("group" in t) || t.items.length > 0) return !1;
	return !0;
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/OptionsDropdown/validate-options.mjs
function nl(e, t = /* @__PURE__ */ new Set()) {
	if (Array.isArray(e)) for (let n of e) if ($c(n)) nl(n.items, t);
	else {
		if (n.value === void 0) throw Error("[@mantine/core] Each option must have value property");
		if (t.has(n.value)) throw Error(`[@mantine/core] Duplicate options are not supported. Option with value "${n.value}" was provided more than once`);
		t.add(n.value);
	}
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Combobox/OptionsDropdown/OptionsDropdown.mjs
function rl(e, t) {
	return Array.isArray(e) ? e.includes(t) : e === t;
}
function il({ data: e, withCheckIcon: t, withAlignedLabels: n, value: r, checkIconPosition: i, unstyled: a, renderOption: o }) {
	if (!$c(e)) {
		let s = rl(r, e.value), c = t && (s ? /* @__PURE__ */ (0, V.jsx)(Qc, { className: xc.optionsDropdownCheckIcon }) : n ? /* @__PURE__ */ (0, V.jsx)("div", { className: xc.optionsDropdownCheckPlaceholder }) : null), l = /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [
			i === "left" && c,
			/* @__PURE__ */ (0, V.jsx)("span", { children: e.label }),
			i === "right" && c
		] });
		return /* @__PURE__ */ (0, V.jsx)(Zc.Option, {
			value: e.value,
			disabled: e.disabled,
			className: Ue({ [xc.optionsDropdownOption]: !a }),
			"data-reverse": i === "right" || void 0,
			"data-checked": s || void 0,
			"aria-selected": s,
			active: s,
			children: typeof o == "function" ? o({
				option: e,
				checked: s
			}) : l
		});
	}
	let s = e.items.map((e) => /* @__PURE__ */ (0, V.jsx)(il, {
		data: e,
		value: r,
		unstyled: a,
		withCheckIcon: t,
		withAlignedLabels: n,
		checkIconPosition: i,
		renderOption: o
	}, `${e.value}`));
	return /* @__PURE__ */ (0, V.jsx)(Zc.Group, {
		label: e.group,
		children: s
	});
}
function al({ data: e, hidden: t, hiddenWhenEmpty: n, filter: r, search: i, limit: a, maxDropdownHeight: o, floatingHeight: s, withScrollArea: c = !0, filterOptions: l = !0, withCheckIcon: u = !1, withAlignedLabels: d = !1, value: f, checkIconPosition: p, nothingFoundMessage: m, unstyled: h, labelId: g, renderOption: _, scrollAreaProps: v, "aria-label": y }) {
	let b = Ec();
	nl(e);
	let x = typeof i == "string" ? (r || el)({
		options: e,
		search: l ? i : "",
		limit: a ?? Infinity
	}) : e, S = tl(x), C = x.map((e, t) => /* @__PURE__ */ (0, V.jsx)(il, {
		data: e,
		withCheckIcon: u,
		withAlignedLabels: d,
		value: f,
		checkIconPosition: p,
		unstyled: h,
		renderOption: _
	}, $c(e) ? `group-${typeof e.group == "string" ? e.group : t}` : `${e.value}`));
	return /* @__PURE__ */ (0, V.jsx)(Zc.Dropdown, {
		hidden: t || n && S,
		"data-composed": !0,
		children: /* @__PURE__ */ (0, V.jsxs)(Zc.Options, {
			labelledBy: g,
			"aria-label": y,
			children: [c ? /* @__PURE__ */ (0, V.jsx)(Eo.Autosize, {
				mah: (s ?? b.floatingHeight) === "viewport" ? "var(--combobox-floating-options-max-height)" : o ?? 220,
				type: "scroll",
				scrollbarSize: "var(--combobox-padding)",
				offsetScrollbars: "y",
				...v,
				children: C
			}) : C, S && m && /* @__PURE__ */ (0, V.jsx)(Zc.Empty, { children: m })]
		})
	});
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Badge/Badge.module.mjs
var ol = {
	root: "m_347db0ec",
	"root--dot": "m_fbd81e3d",
	label: "m_5add502a",
	section: "m_91fdda9b"
}, sl = B((e, { radius: t, color: n, gradient: r, variant: i, size: a, autoContrast: o, circle: s }) => {
	let c = e.variantColorResolver({
		color: n || e.primaryColor,
		theme: e,
		gradient: r,
		variant: i || "filled",
		autoContrast: o
	});
	return { root: {
		"--badge-height": k(a, "badge-height"),
		"--badge-padding-x": k(a, "badge-padding-x"),
		"--badge-fz": k(a, "badge-fz"),
		"--badge-radius": s || t === void 0 ? void 0 : j(t),
		"--badge-bg": n || i ? c.background : void 0,
		"--badge-color": n || i ? c.color : void 0,
		"--badge-bd": n || i ? c.border : void 0,
		"--badge-dot-color": i === "dot" ? st(n, e) : void 0
	} };
}), cl = $n((e) => {
	let t = H("Badge", null, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, radius: c, color: l, gradient: u, leftSection: d, rightSection: f, children: p, variant: m, fullWidth: h, autoContrast: g, circle: _, mod: v, attributes: y, ...b } = t, x = U({
		name: "Badge",
		props: t,
		classes: ol,
		className: r,
		style: i,
		classNames: n,
		styles: a,
		unstyled: o,
		attributes: y,
		vars: s,
		varsResolver: sl
	});
	return /* @__PURE__ */ (0, V.jsxs)(G, {
		variant: m,
		mod: [{
			block: h,
			circle: _,
			"with-right-section": !!f,
			"with-left-section": !!d
		}, v],
		...x("root", { variant: m }),
		...b,
		children: [
			d && /* @__PURE__ */ (0, V.jsx)("span", {
				...x("section"),
				"data-position": "left",
				children: d
			}),
			/* @__PURE__ */ (0, V.jsx)("span", {
				...x("label"),
				children: p
			}),
			f && /* @__PURE__ */ (0, V.jsx)("span", {
				...x("section"),
				"data-position": "right",
				children: f
			})
		]
	});
});
cl.classes = ol, cl.varsResolver = sl, cl.displayName = "@mantine/core/Badge";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Button/Button.module.mjs
var ll = {
	root: "m_77c9d27d",
	inner: "m_80f1301b",
	label: "m_811560b9",
	section: "m_a74036a",
	loader: "m_a25b86ee",
	group: "m_80d6d844",
	groupSection: "m_70be2a01"
}, ul = { orientation: "horizontal" }, dl = B((e, { borderWidth: t }) => ({ group: { "--button-border-width": _(t) } })), fl = W((e) => {
	let t = H("ButtonGroup", ul, e), { className: n, style: r, classNames: i, styles: a, unstyled: o, orientation: s, vars: c, borderWidth: l, mod: u, attributes: d, ...f } = H("ButtonGroup", ul, e);
	return /* @__PURE__ */ (0, V.jsx)(G, {
		...U({
			name: "ButtonGroup",
			props: t,
			classes: ll,
			className: n,
			style: r,
			classNames: i,
			styles: a,
			unstyled: o,
			attributes: d,
			vars: c,
			varsResolver: dl,
			rootSelector: "group"
		})("group"),
		mod: [{ "data-orientation": s }, u],
		role: "group",
		...f
	});
});
fl.classes = ll, fl.varsResolver = dl, fl.displayName = "@mantine/core/ButtonGroup";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Button/ButtonGroupSection/ButtonGroupSection.mjs
var pl = B((e, { radius: t, color: n, gradient: r, variant: i, autoContrast: a, size: o }) => {
	let s = e.variantColorResolver({
		color: n || e.primaryColor,
		theme: e,
		gradient: r,
		variant: i || "filled",
		autoContrast: a
	});
	return { groupSection: {
		"--section-height": k(o, "section-height"),
		"--section-padding-x": k(o, "section-padding-x"),
		"--section-fz": o?.includes("compact") ? M(o.replace("compact-", "")) : M(o),
		"--section-radius": t === void 0 ? void 0 : j(t),
		"--section-bg": n || i ? s.background : void 0,
		"--section-color": s.color,
		"--section-bd": n || i ? s.border : void 0
	} };
}), ml = W((e) => {
	let t = H("ButtonGroupSection", null, e), { className: n, style: r, classNames: i, styles: a, unstyled: o, vars: s, gradient: c, radius: l, autoContrast: u, attributes: d, ...f } = t;
	return /* @__PURE__ */ (0, V.jsx)(G, {
		...U({
			name: "ButtonGroupSection",
			props: t,
			classes: ll,
			className: n,
			style: r,
			classNames: i,
			styles: a,
			unstyled: o,
			attributes: d,
			vars: s,
			varsResolver: pl,
			rootSelector: "groupSection"
		})("groupSection"),
		...f
	});
});
ml.classes = ll, ml.varsResolver = pl, ml.displayName = "@mantine/core/ButtonGroupSection";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Button/Button.mjs
var hl = {
	in: {
		opacity: 1,
		transform: `translate(-50%, calc(-50% + ${_(1)}))`
	},
	out: {
		opacity: 0,
		transform: "translate(-50%, -200%)"
	},
	common: { transformOrigin: "center" },
	transitionProperty: "transform, opacity"
}, gl = B((e, { radius: t, color: n, gradient: r, variant: i, size: a, justify: o, autoContrast: s }) => {
	let c = e.variantColorResolver({
		color: n || e.primaryColor,
		theme: e,
		gradient: r,
		variant: i || "filled",
		autoContrast: s
	});
	return { root: {
		"--button-justify": o,
		"--button-height": k(a, "button-height"),
		"--button-padding-x": k(a, "button-padding-x"),
		"--button-fz": a?.includes("compact") ? M(a.replace("compact-", "")) : M(a),
		"--button-radius": t === void 0 ? void 0 : j(t),
		"--button-bg": n || i ? c.background : void 0,
		"--button-hover": n || i ? c.hover : void 0,
		"--button-color": c.color,
		"--button-bd": n || i ? c.border : void 0,
		"--button-hover-color": n || i ? c.hoverColor : void 0
	} };
}), _l = $n((e) => {
	let t = H("Button", null, e), { style: n, vars: r, className: i, color: a, disabled: o, children: s, leftSection: c, rightSection: l, fullWidth: u, variant: d, radius: f, loading: p, loaderProps: m, gradient: h, classNames: g, styles: _, unstyled: v, "data-disabled": y, autoContrast: b, mod: x, attributes: S, ...C } = t, w = U({
		name: "Button",
		props: t,
		classes: ll,
		className: i,
		style: n,
		classNames: g,
		styles: _,
		unstyled: v,
		attributes: S,
		vars: r,
		varsResolver: gl
	}), T = !!c, E = !!l;
	return /* @__PURE__ */ (0, V.jsxs)(Ao, {
		...w("root", { active: !o && !p && !y }),
		unstyled: v,
		variant: d,
		disabled: o || p,
		mod: [{
			disabled: o || y,
			loading: p,
			block: u,
			"with-left-section": T,
			"with-right-section": E
		}, x],
		...C,
		children: [typeof p == "boolean" && /* @__PURE__ */ (0, V.jsx)(is, {
			mounted: p,
			transition: hl,
			duration: 150,
			children: (e) => /* @__PURE__ */ (0, V.jsx)(G, {
				component: "span",
				...w("loader", { style: e }),
				"aria-hidden": !0,
				children: /* @__PURE__ */ (0, V.jsx)(Os, {
					color: "var(--button-color)",
					size: "calc(var(--button-height) / 1.8)",
					...m
				})
			})
		}), /* @__PURE__ */ (0, V.jsxs)("span", {
			...w("inner"),
			children: [
				c && /* @__PURE__ */ (0, V.jsx)(G, {
					component: "span",
					...w("section"),
					mod: { position: "left" },
					children: c
				}),
				/* @__PURE__ */ (0, V.jsx)(G, {
					component: "span",
					mod: { loading: p },
					...w("label"),
					children: s
				}),
				l && /* @__PURE__ */ (0, V.jsx)(G, {
					component: "span",
					...w("section"),
					mod: { position: "right" },
					children: l
				})
			]
		})]
	});
});
_l.classes = ll, _l.varsResolver = gl, _l.displayName = "@mantine/core/Button", _l.Group = fl, _l.GroupSection = ml;
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Card/Card.context.mjs
var [vl, yl] = T("Card component was not found in tree"), bl = {
	root: "m_e615b15f",
	section: "m_599a2148"
}, xl = $n((e) => {
	let { classNames: t, className: n, style: r, styles: i, vars: a, withBorder: o, inheritPadding: s, mod: c, ...l } = H("CardSection", null, e), u = yl();
	return /* @__PURE__ */ (0, V.jsx)(G, {
		mod: [{
			"with-border": o,
			"inherit-padding": s
		}, c],
		...u.getStyles("section", {
			className: n,
			style: r,
			styles: i,
			classNames: t
		}),
		...l
	});
});
xl.classes = bl, xl.displayName = "@mantine/core/CardSection";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Card/Card.mjs
var Sl = B((e, { padding: t }) => ({ root: { "--card-padding": A(t) } })), Cl = { orientation: "vertical" }, wl = $n((e) => {
	let t = H("Card", Cl, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, children: c, padding: l, attributes: u, orientation: d, ...f } = t, p = U({
		name: "Card",
		props: t,
		classes: bl,
		className: r,
		style: i,
		classNames: n,
		styles: a,
		unstyled: o,
		attributes: u,
		vars: s,
		varsResolver: Sl
	}), m = C.Children.toArray(c), h = m.map((e, t) => typeof e == "object" && e && "type" in e && (e.type === xl || e.type?.displayName === "@mantine/core/CardSection") ? (0, C.cloneElement)(e, {
		"data-orientation": d,
		"data-first-section": t === 0 || void 0,
		"data-last-section": t === m.length - 1 || void 0
	}) : e);
	return /* @__PURE__ */ (0, V.jsx)(vl, {
		value: { getStyles: p },
		children: /* @__PURE__ */ (0, V.jsx)(Fo, {
			unstyled: o,
			"data-orientation": d,
			...p("root"),
			...f,
			children: h
		})
	});
});
wl.classes = bl, wl.varsResolver = Sl, wl.displayName = "@mantine/core/Card", wl.Section = xl;
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Center/Center.module.mjs
var Tl = { root: "m_4451eb3a" }, El = $n((e) => {
	let t = H("Center", null, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, inline: c, mod: l, attributes: u, ...d } = t, f = U({
		name: "Center",
		props: t,
		classes: Tl,
		className: r,
		style: i,
		classNames: n,
		styles: a,
		unstyled: o,
		attributes: u,
		vars: s
	});
	return /* @__PURE__ */ (0, V.jsx)(G, {
		mod: [{ inline: c }, l],
		...f("root"),
		...d
	});
});
El.classes = Tl, El.displayName = "@mantine/core/Center";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Container/Container.module.mjs
var Dl = { root: "m_7485cace" }, Ol = { strategy: "block" }, kl = B((e, { size: t, fluid: n }) => ({ root: { "--container-size": n ? void 0 : k(t, "container-size") } })), Al = W((e) => {
	let t = H("Container", Ol, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, fluid: c, mod: l, attributes: u, strategy: d, ...f } = t, p = U({
		name: "Container",
		classes: Dl,
		props: t,
		className: r,
		style: i,
		classNames: n,
		styles: a,
		unstyled: o,
		attributes: u,
		vars: s,
		varsResolver: kl
	});
	return /* @__PURE__ */ (0, V.jsx)(G, {
		mod: [{
			fluid: c,
			strategy: d
		}, l],
		...p("root"),
		...f
	});
});
Al.classes = Dl, Al.varsResolver = kl, Al.displayName = "@mantine/core/Container";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Divider/Divider.module.mjs
var jl = {
	root: "m_3eebeb36",
	label: "m_9e365f20"
}, Ml = { orientation: "horizontal" }, Nl = B((e, { color: t, variant: n, size: r }) => ({ root: {
	"--divider-color": t ? st(t, e) : void 0,
	"--divider-border-style": n,
	"--divider-size": k(r, "divider-size")
} })), Pl = W((e) => {
	let t = H("Divider", Ml, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, color: c, orientation: l, label: u, labelPosition: d, mod: f, attributes: p, ...m } = t, h = U({
		name: "Divider",
		classes: jl,
		props: t,
		className: r,
		style: i,
		classNames: n,
		styles: a,
		unstyled: o,
		attributes: p,
		vars: s,
		varsResolver: Nl
	});
	return /* @__PURE__ */ (0, V.jsx)(G, {
		mod: [{
			orientation: l,
			withLabel: !!u
		}, f],
		role: "separator",
		...h("root"),
		...m,
		children: u && /* @__PURE__ */ (0, V.jsx)(G, {
			component: "span",
			mod: { position: d },
			...h("label"),
			children: u
		})
	});
});
Pl.classes = jl, Pl.varsResolver = Nl, Pl.displayName = "@mantine/core/Divider";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Grid/Grid.context.mjs
var [Y, Fl] = T("Grid component was not found in tree"), X = (e, t) => {
	if (e === "content") return "auto";
	if (e === "auto") return "0rem";
	if (e) return e === t ? "100%" : `calc(${100 * e / t}% - ${(t - e) / t} * var(--grid-column-gap))`;
}, Z = (e, t, n) => n || e === "auto" ? "100%" : e === "content" ? "unset" : X(e, t), Il = (e, t) => {
	if (e) return e === "auto" || t ? "1" : "auto";
}, Ll = (e, t) => {
	if (e === 0) return "0";
	if (e) return `calc(${100 * e / t}% + ${e / t} * var(--grid-column-gap))`;
};
function Rl({ span: e, order: t, offset: n, align: r, selector: i }) {
	let a = Ht(), o = Fl(), s = o.breakpoints || a.breakpoints, c = F(e), u = c === void 0 ? 12 : c, d = y({
		"--col-order": F(t)?.toString(),
		"--col-flex-grow": Il(u, o.grow),
		"--col-flex-basis": X(u, o.columns),
		"--col-width": u === "content" ? "auto" : void 0,
		"--col-max-width": Z(u, o.columns, o.grow),
		"--col-offset": Ll(F(n), o.columns),
		"--col-align-self": F(r)
	}), f = l(s).reduce((i, a) => (i[a] || (i[a] = {}), typeof t == "object" && t[a] !== void 0 && (i[a]["--col-order"] = t[a]?.toString()), typeof e == "object" && e[a] !== void 0 && (i[a]["--col-flex-grow"] = Il(e[a], o.grow), i[a]["--col-flex-basis"] = X(e[a], o.columns), i[a]["--col-width"] = e[a] === "content" ? "auto" : void 0, i[a]["--col-max-width"] = Z(e[a], o.columns, o.grow)), typeof n == "object" && n[a] !== void 0 && (i[a]["--col-offset"] = Ll(n[a], o.columns)), typeof r == "object" && r[a] !== void 0 && (i[a]["--col-align-self"] = r[a]), i), {}), p = re(l(f), s).filter((e) => l(f[e.value]).length > 0).map((e) => ({
		query: o.type === "container" ? `mantine-grid (min-width: ${s[e.value]})` : `(min-width: ${s[e.value]})`,
		styles: f[e.value]
	}));
	return /* @__PURE__ */ (0, V.jsx)(Sn, {
		styles: d,
		media: o.type === "container" ? void 0 : p,
		container: o.type === "container" ? p : void 0,
		selector: i
	});
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Grid/Grid.module.mjs
var zl = {
	container: "m_8478a6da",
	root: "m_410352e9",
	inner: "m_dee7bd2f",
	col: "m_96bdd299"
}, Bl = { span: 12 }, Vl = W((e) => {
	let { classNames: t, className: n, style: r, styles: i, vars: a, span: o, order: s, offset: c, align: l, ...u } = H("GridCol", Bl, e), d = Fl(), f = Jn();
	return /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [/* @__PURE__ */ (0, V.jsx)(Rl, {
		selector: `.${f}`,
		span: o,
		order: s,
		offset: c,
		align: l
	}), /* @__PURE__ */ (0, V.jsx)(G, {
		...d.getStyles("col", {
			className: Ue(n, f),
			style: r,
			classNames: t,
			styles: i
		}),
		...u
	})] });
});
Vl.classes = zl, Vl.displayName = "@mantine/core/GridCol";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Grid/GridVariables.mjs
function Hl({ gap: e, rowGap: t, columnGap: n, selector: r, breakpoints: i, type: a }) {
	let o = Ht(), s = i || o.breakpoints, c = y({
		"--grid-gap": A(F(e)),
		"--grid-row-gap": A(F(t)),
		"--grid-column-gap": A(F(n))
	}), u = l(s).reduce((r, i) => (r[i] || (r[i] = {}), typeof e == "object" && e[i] !== void 0 && (r[i]["--grid-gap"] = A(e[i])), typeof t == "object" && t[i] !== void 0 && (r[i]["--grid-row-gap"] = A(t[i])), typeof n == "object" && n[i] !== void 0 && (r[i]["--grid-column-gap"] = A(n[i])), r), {}), d = re(l(u), s).filter((e) => l(u[e.value]).length > 0).map((e) => ({
		query: a === "container" ? `mantine-grid (min-width: ${s[e.value]})` : `(min-width: ${s[e.value]})`,
		styles: u[e.value]
	}));
	return /* @__PURE__ */ (0, V.jsx)(Sn, {
		styles: c,
		media: a === "container" ? void 0 : d,
		container: a === "container" ? d : void 0,
		selector: r
	});
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Grid/Grid.mjs
var Ul = {
	gap: "md",
	columns: 12
}, Wl = B((e, { justify: t, align: n, overflow: r }) => ({ root: {
	"--grid-justify": t,
	"--grid-align": n,
	"--grid-overflow": r
} })), Gl = W((e) => {
	let t = H("Grid", Ul, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, grow: c, gap: l, rowGap: u, columnGap: d, columns: f, align: p, justify: m, children: h, breakpoints: g, type: _, attributes: v, ...y } = t, b = U({
		name: "Grid",
		classes: zl,
		props: t,
		className: r,
		style: i,
		classNames: n,
		styles: a,
		unstyled: o,
		attributes: v,
		vars: s,
		varsResolver: Wl
	}), x = Jn();
	return _ === "container" && g ? /* @__PURE__ */ (0, V.jsxs)(Y, {
		value: {
			getStyles: b,
			grow: c,
			columns: f,
			breakpoints: g,
			type: _
		},
		children: [/* @__PURE__ */ (0, V.jsx)(Hl, {
			selector: `.${x}`,
			...t
		}), /* @__PURE__ */ (0, V.jsx)("div", {
			...b("container"),
			children: /* @__PURE__ */ (0, V.jsx)(G, {
				...b("root", { className: x }),
				...y,
				children: /* @__PURE__ */ (0, V.jsx)("div", {
					...b("inner"),
					children: h
				})
			})
		})]
	}) : /* @__PURE__ */ (0, V.jsxs)(Y, {
		value: {
			getStyles: b,
			grow: c,
			columns: f,
			breakpoints: g,
			type: _
		},
		children: [/* @__PURE__ */ (0, V.jsx)(Hl, {
			selector: `.${x}`,
			...t
		}), /* @__PURE__ */ (0, V.jsx)(G, {
			...b("root", { className: x }),
			...y,
			children: /* @__PURE__ */ (0, V.jsx)("div", {
				...b("inner"),
				children: h
			})
		})]
	});
});
Gl.classes = zl, Gl.varsResolver = Wl, Gl.displayName = "@mantine/core/Grid", Gl.Col = Vl;
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Textarea/Autosize.mjs
var Kl = [
	"borderBottomWidth",
	"borderLeftWidth",
	"borderRightWidth",
	"borderTopWidth",
	"boxSizing",
	"fontFamily",
	"fontSize",
	"fontStyle",
	"fontWeight",
	"letterSpacing",
	"lineHeight",
	"paddingBottom",
	"paddingLeft",
	"paddingRight",
	"paddingTop",
	"tabSize",
	"textIndent",
	"textRendering",
	"textTransform",
	"width",
	"wordBreak",
	"wordSpacing",
	"scrollbarGutter"
], ql = {
	"min-height": "0",
	"max-height": "none",
	height: "0",
	visibility: "hidden",
	overflow: "hidden",
	position: "absolute",
	"z-index": "-1000",
	top: "0",
	right: "0",
	display: "block"
};
function Jl(e) {
	Object.keys(ql).forEach((t) => {
		e.style.setProperty(t, ql[t], "important");
	});
}
function Yl(e) {
	let t = window.getComputedStyle(e);
	if (t === null) return null;
	let n = {};
	for (let e of Kl) n[e] = t[e];
	return n.boxSizing === "" ? null : {
		sizingStyle: n,
		paddingSize: parseFloat(n.paddingBottom) + parseFloat(n.paddingTop),
		borderSize: parseFloat(n.borderBottomWidth) + parseFloat(n.borderTopWidth)
	};
}
var Xl = null;
function Zl(e, t, n = 1, r = Infinity) {
	Xl || (Xl = document.createElement("textarea"), Xl.setAttribute("tabindex", "-1"), Xl.setAttribute("aria-hidden", "true"), Xl.setAttribute("aria-label", "autosize measurement"), Jl(Xl)), Xl.parentNode === null && document.body.appendChild(Xl);
	let { paddingSize: i, borderSize: a, sizingStyle: o } = e, { boxSizing: s } = o;
	Object.keys(o).forEach((e) => {
		Xl.style[e] = o[e];
	}), Jl(Xl), Xl.value = t;
	let c = s === "border-box" ? Xl.scrollHeight + a : Xl.scrollHeight - i;
	Xl.value = t, c = s === "border-box" ? Xl.scrollHeight + a : Xl.scrollHeight - i, Xl.value = "x";
	let l = Xl.scrollHeight - i, u = l * n;
	s === "border-box" && (u = u + i + a), c = Math.max(u, c);
	let d = l * r;
	return s === "border-box" && (d = d + i + a), c = Math.min(d, c), [c, l];
}
function Ql({ maxRows: e, minRows: t, onChange: n, ref: r, ...i }) {
	let a = i.value !== void 0, o = (0, C.useRef)(null), s = Te(o, r), c = (0, C.useRef)(0), l = (0, C.useRef)(0), u = () => {
		let n = o.current;
		if (!n) return;
		let r = Yl(n);
		if (!r) return;
		let [i] = Zl(r, n.value || n.placeholder || "x", t, e);
		c.current !== i && (c.current = i, n.style.setProperty("height", `${i}px`, "important"));
	}, d = (e) => {
		a || u(), n?.(e);
	};
	return (0, C.useLayoutEffect)(u), (0, C.useEffect)(() => {
		let e = () => u();
		return window.addEventListener("resize", e), () => window.removeEventListener("resize", e);
	}, []), (0, C.useEffect)(() => {
		let e = o.current;
		if (!e || typeof ResizeObserver > "u") return;
		l.current = e.offsetWidth;
		let t = new ResizeObserver(() => {
			o.current && o.current.offsetWidth !== l.current && (l.current = o.current.offsetWidth, u());
		});
		return t.observe(e), () => t.disconnect();
	}, []), (0, C.useEffect)(() => {
		let e = () => u();
		return document.fonts.addEventListener("loadingdone", e), () => document.fonts.removeEventListener("loadingdone", e);
	}, []), (0, C.useEffect)(() => {
		let e = (e) => {
			if (o.current?.form === e.target && !a) {
				let e = o.current.value;
				requestAnimationFrame(() => {
					o.current && e !== o.current.value && u();
				});
			}
		};
		return document.body.addEventListener("reset", e), () => document.body.removeEventListener("reset", e);
	}, [a]), /* @__PURE__ */ (0, V.jsx)("textarea", {
		rows: t,
		...i,
		onChange: d,
		ref: s
	});
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Textarea/Textarea.mjs
var $l = W((e) => {
	let { autosize: t, maxRows: n, minRows: r, __staticSelector: i, resize: a, bottomSection: o, bottomSectionProps: s, ...c } = H([
		"Input",
		"InputWrapper",
		"Textarea"
	], null, e), l = t && Ie() !== "test", u = l ? {
		maxRows: n,
		minRows: r
	} : {};
	return /* @__PURE__ */ (0, V.jsx)(uc, {
		component: l ? Ql : "textarea",
		...c,
		__staticSelector: i || "Textarea",
		__bottomSection: o,
		__bottomSectionProps: s,
		multiline: !0,
		"data-no-overflow": t && n === void 0 || void 0,
		__vars: { "--input-resize": a },
		...u
	});
});
$l.classes = uc.classes, $l.displayName = "@mantine/core/Textarea";
//#endregion
//#region ../../node_modules/.bun/react-number-format@5.4.5+005eabf3d8b6ef06/node_modules/react-number-format/dist/react-number-format.es.js
function eu(e, t) {
	var n = {};
	for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
	if (e != null && typeof Object.getOwnPropertySymbols == "function") for (var i = 0, r = Object.getOwnPropertySymbols(e); i < r.length; i++) t.indexOf(r[i]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[i]) && (n[r[i]] = e[r[i]]);
	return n;
}
var tu;
(function(e) {
	e.event = "event", e.props = "prop";
})(tu ||= {});
function nu() {}
function ru(e) {
	var t, n = void 0;
	return function() {
		for (var r = [], i = arguments.length; i--;) r[i] = arguments[i];
		return t && r.length === t.length && r.every(function(e, n) {
			return e === t[n];
		}) ? n : (t = r, n = e.apply(void 0, r), n);
	};
}
function iu(e) {
	return !!(e || "").match(/\d/);
}
function au(e) {
	return e == null;
}
function ou(e) {
	return typeof e == "number" && isNaN(e);
}
function su(e) {
	return au(e) || ou(e) || typeof e == "number" && !isFinite(e);
}
function cu(e) {
	return e.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
}
function lu(e) {
	switch (e) {
		case "lakh": return /(\d+?)(?=(\d\d)+(\d)(?!\d))(\.\d+)?/g;
		case "wan": return /(\d)(?=(\d{4})+(?!\d))/g;
		default: return /(\d)(?=(\d{3})+(?!\d))/g;
	}
}
function uu(e, t, n) {
	var r = lu(n), i = e.search(/[1-9]/);
	return i = i === -1 ? e.length : i, e.substring(0, i) + e.substring(i, e.length).replace(r, "$1" + t);
}
function du(e) {
	var t = (0, C.useRef)(e);
	return t.current = e, (0, C.useRef)(function() {
		for (var e = [], n = arguments.length; n--;) e[n] = arguments[n];
		return t.current.apply(t, e);
	}).current;
}
function fu(e, t) {
	t === void 0 && (t = !0);
	var n = e[0] === "-", r = n && t;
	e = e.replace("-", "");
	var i = e.split(".");
	return {
		beforeDecimal: i[0],
		afterDecimal: i[1] || "",
		hasNegation: n,
		addNegation: r
	};
}
function pu(e) {
	if (!e) return e;
	var t = e[0] === "-";
	t && (e = e.substring(1, e.length));
	var n = e.split("."), r = n[0].replace(/^0+/, "") || "0", i = n[1] || "";
	return (t ? "-" : "") + r + (i ? "." + i : "");
}
function mu(e, t, n) {
	for (var r = "", i = n ? "0" : "", a = 0; a <= t - 1; a++) r += e[a] || i;
	return r;
}
function hu(e, t) {
	return Array(t + 1).join(e);
}
function gu(e) {
	var t = e + "", n = t[0] === "-" ? "-" : "";
	n && (t = t.substring(1));
	var r = t.split(/[eE]/g), i = r[0], a = r[1];
	if (a = Number(a), !a) return n + i;
	i = i.replace(".", "");
	var o = 1 + a, s = i.length;
	return o < 0 ? i = "0." + hu("0", Math.abs(o)) + i : o >= s ? i += hu("0", o - s) : i = (i.substring(0, o) || "0") + "." + i.substring(o), n + i;
}
function _u(e, t, n) {
	if (["", "-"].indexOf(e) !== -1) return e;
	var r = (e.indexOf(".") !== -1 || n) && t, i = fu(e), a = i.beforeDecimal, o = i.afterDecimal, s = i.hasNegation, c = parseFloat("0." + (o || "0")), l = (o.length <= t ? "0." + o : c.toFixed(t)).split("."), u = a;
	a && Number(l[0]) && (u = a.split("").reverse().reduce(function(e, t, n) {
		return e.length > n ? (Number(e[0]) + Number(t)).toString() + e.substring(1, e.length) : t + e;
	}, l[0]));
	var d = mu(l[1] || "", t, n), f = s ? "-" : "", p = r ? "." : "";
	return "" + f + u + p + d;
}
function vu(e, t) {
	if (e.value = e.value, e !== null) {
		if (e.createTextRange) {
			var n = e.createTextRange();
			return n.move("character", t), n.select(), !0;
		}
		return e.selectionStart || e.selectionStart === 0 ? (e.focus(), e.setSelectionRange(t, t), !0) : (e.focus(), !1);
	}
}
var yu = ru(function(e, t) {
	for (var n = 0, r = 0, i = e.length, a = t.length; e[n] === t[n] && n < i;) n++;
	for (; e[i - 1 - r] === t[a - 1 - r] && a - r > n && i - r > n;) r++;
	return {
		from: {
			start: n,
			end: i - r
		},
		to: {
			start: n,
			end: a - r
		}
	};
}), bu = function(e, t) {
	var n = Math.min(e.selectionStart, t);
	return {
		from: {
			start: n,
			end: e.selectionEnd
		},
		to: {
			start: n,
			end: t
		}
	};
};
function xu(e, t, n) {
	return Math.min(Math.max(e, t), n);
}
function Su(e) {
	return Math.max(e.selectionStart, e.selectionEnd);
}
function Cu() {
	return typeof navigator < "u" && !(navigator.platform && /iPhone|iPod/.test(navigator.platform));
}
function wu(e) {
	return {
		from: {
			start: 0,
			end: 0
		},
		to: {
			start: 0,
			end: e.length
		},
		lastValue: ""
	};
}
function Tu(e) {
	var t = e.currentValue, n = e.formattedValue, r = e.currentValueIndex, i = e.formattedValueIndex;
	return t[r] === n[i];
}
function Eu(e, t, n, r, i, a, o) {
	o === void 0 && (o = Tu);
	var s = i.findIndex(function(e) {
		return e;
	}), c = e.slice(0, s);
	!t && !n.startsWith(c) && (t = c, n = c + n, r += c.length);
	for (var l = n.length, u = e.length, d = {}, f = Array(l), p = 0; p < l; p++) {
		f[p] = -1;
		for (var m = 0, h = u; m < h; m++) if (o({
			currentValue: n,
			lastValue: t,
			formattedValue: e,
			currentValueIndex: p,
			formattedValueIndex: m
		}) && d[m] !== !0) {
			f[p] = m, d[m] = !0;
			break;
		}
	}
	for (var g = r; g < l && (f[g] === -1 || !a(n[g]));) g++;
	var _ = g === l || f[g] === -1 ? u : f[g];
	for (g = r - 1; g > 0 && f[g] === -1;) g--;
	var v = g === -1 || f[g] === -1 ? 0 : f[g] + 1;
	return v > _ ? _ : r - v < _ - r ? v : _;
}
function Du(e, t, n, r) {
	var i = e.length;
	if (t = xu(t, 0, i), r === "left") {
		for (; t >= 0 && !n[t];) t--;
		t === -1 && (t = n.indexOf(!0));
	} else {
		for (; t <= i && !n[t];) t++;
		t > i && (t = n.lastIndexOf(!0));
	}
	return t === -1 && (t = i), t;
}
function Ou(e) {
	for (var t = Array.from({ length: e.length + 1 }).map(function() {
		return !0;
	}), n = 0, r = t.length; n < r; n++) t[n] = !!(iu(e[n]) || iu(e[n - 1]));
	return t;
}
function ku(e, t, n, r, i, a) {
	a === void 0 && (a = nu);
	var o = du(function(e, t) {
		var n, a;
		return su(e) ? (a = "", n = "") : typeof e == "number" || t ? (a = typeof e == "number" ? gu(e) : e, n = r(a)) : (a = i(e, void 0), n = r(a)), {
			formattedValue: n,
			numAsString: a
		};
	}), s = (0, C.useState)(function() {
		return o(au(e) ? t : e, n);
	}), c = s[0], l = s[1], u = du(function(e, t) {
		e.formattedValue !== c.formattedValue && l({
			formattedValue: e.formattedValue,
			numAsString: e.value
		}), a(e, t);
	}), d = e, f = n;
	au(e) && (d = c.numAsString, f = !0);
	var p = o(d, f);
	return (0, C.useMemo)(function() {
		l(p);
	}, [p.formattedValue]), (0, C.useEffect)(function() {
		if (!au(t) && au(e) && c.formattedValue !== "") {
			var n = parseFloat(c.numAsString);
			u({
				formattedValue: c.formattedValue,
				value: c.numAsString,
				floatValue: isNaN(n) ? void 0 : n
			}, {
				event: void 0,
				source: tu.props
			});
		}
	}, []), [c, u];
}
function Au(e) {
	return e.replace(/[^0-9]/g, "");
}
function ju(e) {
	return e;
}
function Mu(e) {
	var t = e.type;
	t === void 0 && (t = "text");
	var n = e.displayType;
	n === void 0 && (n = "input");
	var r = e.customInput, i = e.renderText, a = e.getInputRef, o = e.format;
	o === void 0 && (o = ju);
	var s = e.removeFormatting;
	s === void 0 && (s = Au);
	var c = e.defaultValue, l = e.valueIsNumericString, u = e.onValueChange, d = e.isAllowed, f = e.onChange;
	f === void 0 && (f = nu);
	var p = e.onKeyDown;
	p === void 0 && (p = nu);
	var m = e.onMouseUp;
	m === void 0 && (m = nu);
	var h = e.onFocus;
	h === void 0 && (h = nu);
	var g = e.onBlur;
	g === void 0 && (g = nu);
	var _ = e.value, v = e.getCaretBoundary;
	v === void 0 && (v = Ou);
	var y = e.isValidInputCharacter;
	y === void 0 && (y = iu);
	var b = e.isCharacterSame, x = eu(e, [
		"type",
		"displayType",
		"customInput",
		"renderText",
		"getInputRef",
		"format",
		"removeFormatting",
		"defaultValue",
		"valueIsNumericString",
		"onValueChange",
		"isAllowed",
		"onChange",
		"onKeyDown",
		"onMouseUp",
		"onFocus",
		"onBlur",
		"value",
		"getCaretBoundary",
		"isValidInputCharacter",
		"isCharacterSame"
	]), S = ku(_, c, !!l, o, s, u), w = S[0], T = w.formattedValue, E = w.numAsString, ee = S[1], D = (0, C.useRef)(), O = (0, C.useRef)({
		formattedValue: T,
		numAsString: E
	}), k = function(e, t) {
		O.current = {
			formattedValue: e.formattedValue,
			numAsString: e.value
		}, ee(e, t);
	}, A = (0, C.useState)(!1), j = A[0], M = A[1], N = (0, C.useRef)(null), P = (0, C.useRef)({
		setCaretTimeout: null,
		focusTimeout: null
	});
	(0, C.useEffect)(function() {
		return M(!0), function() {
			clearTimeout(P.current.setCaretTimeout), clearTimeout(P.current.focusTimeout);
		};
	}, []);
	var te = o, ne = function(e, t) {
		var n = parseFloat(t);
		return {
			formattedValue: e,
			value: t,
			floatValue: isNaN(n) ? void 0 : n
		};
	}, re = function(e, t, n) {
		(e.selectionStart !== 0 || e.selectionEnd !== e.value.length) && (vu(e, t), P.current.setCaretTimeout = setTimeout(function() {
			e.value === n && e.selectionStart !== t && vu(e, t);
		}, 0));
	}, F = function(e, t, n) {
		return Du(e, t, v(e), n);
	}, I = function(e, t, n) {
		var r = v(t), i = Eu(t, T, e, n, r, y, b);
		return i = Du(t, i, r), i;
	}, L = function(e) {
		var t = e.formattedValue;
		t === void 0 && (t = "");
		var n = e.input, r = e.source, i = e.event, a = e.numAsString, o;
		if (n) {
			var s = e.inputValue || n.value, c = Su(n);
			n.value = t, o = I(s, t, c), o !== void 0 && re(n, o, t);
		}
		t !== T && k(ne(t, a), {
			event: i,
			source: r
		});
	};
	(0, C.useEffect)(function() {
		var e = O.current, t = e.formattedValue, n = e.numAsString;
		(T !== t || E !== n) && k(ne(T, E), {
			event: void 0,
			source: tu.props
		});
	}, [T, E]);
	var ie = N.current ? Su(N.current) : void 0;
	(typeof window < "u" ? C.useLayoutEffect : C.useEffect)(function() {
		var e = N.current;
		if (T !== O.current.formattedValue && e) {
			var t = I(O.current.formattedValue, T, ie);
			e.value = T, re(e, t, T);
		}
	}, [T]);
	var ae = function(e, t, n) {
		var r = t.target, i = D.current ? bu(D.current, r.selectionEnd) : yu(T, e), a = Object.assign(Object.assign({}, i), { lastValue: T }), o = s(e, a), c = te(o);
		if (o = s(c, void 0), d && !d(ne(c, o))) {
			var l = t.target, u = I(e, T, Su(l));
			return l.value = T, re(l, u, T), !1;
		}
		return L({
			formattedValue: c,
			numAsString: o,
			inputValue: e,
			event: t,
			source: n,
			input: t.target
		}), !0;
	}, oe = function(e, t) {
		t === void 0 && (t = 0), D.current = {
			selectionStart: e.selectionStart,
			selectionEnd: e.selectionEnd + t
		};
	}, se = function(e) {
		var t = e.target.value;
		ae(t, e, tu.event) && f(e), D.current = void 0;
	}, ce = function(e) {
		var t = e.target, n = e.key, r = t.selectionStart, i = t.selectionEnd, a = t.value;
		a === void 0 && (a = "");
		var o;
		n === "ArrowLeft" || n === "Backspace" ? o = Math.max(r - 1, 0) : n === "ArrowRight" ? o = Math.min(r + 1, a.length) : n === "Delete" && (o = r);
		var s = 0;
		n === "Delete" && r === i && (s = 1);
		var c = n === "ArrowLeft" || n === "ArrowRight";
		if (o === void 0 || r !== i && !c) {
			p(e), oe(t, s);
			return;
		}
		var l = o;
		c ? (l = F(a, o, n === "ArrowLeft" ? "left" : "right"), l !== o && e.preventDefault()) : n === "Delete" && !y(a[o]) ? l = F(a, o, "right") : n === "Backspace" && !y(a[o]) && (l = F(a, o, "left")), l !== o && re(t, l, a), p(e), oe(t, s);
	}, le = function(e) {
		var t = e.target, n = function() {
			var e = t.selectionStart, n = t.selectionEnd, r = t.value;
			if (r === void 0 && (r = ""), e === n) {
				var i = F(r, e);
				i !== e && re(t, i, r);
			}
		};
		n(), requestAnimationFrame(function() {
			n();
		}), m(e), oe(t);
	}, ue = function(e) {
		e.persist && e.persist();
		var t = e.target, n = e.currentTarget;
		N.current = t, P.current.focusTimeout = setTimeout(function() {
			var r = t.selectionStart, i = t.selectionEnd, a = t.value;
			a === void 0 && (a = "");
			var o = F(a, r);
			o !== r && (r !== 0 || i !== a.length) && re(t, o, a), h(Object.assign(Object.assign({}, e), { currentTarget: n }));
		}, 0);
	}, de = function(e) {
		N.current = null, clearTimeout(P.current.focusTimeout), clearTimeout(P.current.setCaretTimeout), g(e);
	}, fe = j && Cu() ? "numeric" : void 0, pe = Object.assign({ inputMode: fe }, x, {
		type: t,
		value: T,
		onChange: se,
		onKeyDown: ce,
		onMouseUp: le,
		onFocus: ue,
		onBlur: de
	});
	if (n === "text") return i ? C.createElement(C.Fragment, null, i(T, x) || null) : C.createElement("span", Object.assign({}, x, { ref: a }), T);
	if (r) {
		var me = r;
		return C.createElement(me, Object.assign({}, pe, { ref: a }));
	}
	return C.createElement("input", Object.assign({}, pe, { ref: a }));
}
function Nu(e, t) {
	var n = t.decimalScale, r = t.fixedDecimalScale, i = t.prefix;
	i === void 0 && (i = "");
	var a = t.suffix;
	a === void 0 && (a = "");
	var o = t.allowNegative, s = t.thousandsGroupStyle;
	if (s === void 0 && (s = "thousand"), e === "" || e === "-") return e;
	var c = Pu(t), l = c.thousandSeparator, u = c.decimalSeparator, d = n !== 0 && e.indexOf(".") !== -1 || n && r, f = fu(e, o), p = f.beforeDecimal, m = f.afterDecimal, h = f.addNegation;
	return n !== void 0 && (m = mu(m, n, !!r)), l && (p = uu(p, l, s)), i && (p = i + p), a && (m += a), h && (p = "-" + p), e = p + (d && u || "") + m, e;
}
function Pu(e) {
	var t = e.decimalSeparator;
	t === void 0 && (t = ".");
	var n = e.thousandSeparator, r = e.allowedDecimalSeparators;
	return n === !0 && (n = ","), r ||= [t, "."], {
		decimalSeparator: t,
		thousandSeparator: n,
		allowedDecimalSeparators: r
	};
}
function Fu(e, t) {
	e === void 0 && (e = "");
	var n = /* @__PURE__ */ RegExp("(-)"), r = /* @__PURE__ */ RegExp("(-)(.)*(-)"), i = n.test(e), a = r.test(e);
	return e = e.replace(/-/g, ""), i && !a && t && (e = "-" + e), e;
}
function Iu(e, t) {
	return RegExp("(^-)|[0-9]|" + cu(e), t ? "g" : void 0);
}
function Lu(e, t, n) {
	return e === "" || !t?.match(/\d/) && !n?.match(/\d/) && typeof e == "string" && !isNaN(Number(e));
}
function Ru(e, t, n) {
	var r;
	t === void 0 && (t = wu(e));
	var i = n.allowNegative, a = n.prefix;
	a === void 0 && (a = "");
	var o = n.suffix;
	o === void 0 && (o = "");
	var s = n.decimalScale, c = t.from, l = t.to, u = l.start, d = l.end, f = Pu(n), p = f.allowedDecimalSeparators, m = f.decimalSeparator, h = e[d] === m;
	if (iu(e) && (e === a || e === o) && t.lastValue === "") return e;
	if (d - u === 1 && p.indexOf(e[u]) !== -1) {
		var g = s === 0 ? "" : m;
		e = e.substring(0, u) + g + e.substring(u + 1, e.length);
	}
	var _ = function(e, t, n) {
		var r = !1, i = !1;
		a.startsWith("-") ? r = !1 : e.startsWith("--") ? (r = !1, i = !0) : o.startsWith("-") && e.length === o.length ? r = !1 : e[0] === "-" && (r = !0);
		var s = +!!r;
		return i && (s = 2), s && (e = e.substring(s), t -= s, n -= s), {
			value: e,
			start: t,
			end: n,
			hasNegation: r
		};
	}, v = _(e, u, d), y = v.hasNegation;
	r = v, e = r.value, u = r.start, d = r.end;
	var b = _(t.lastValue, c.start, c.end), x = b.start, S = b.end, C = b.value, w = e.substring(u, d);
	e.length && C.length && (x > C.length - o.length || S < a.length) && !(w && o.startsWith(w)) && (e = C);
	var T = 0;
	e.startsWith(a) ? T += a.length : u < a.length && (T = u), e = e.substring(T), d -= T;
	var E = e.length, ee = e.length - o.length;
	e.endsWith(o) ? E = ee : (d > ee || d > e.length - o.length) && (E = d), e = e.substring(0, E), e = Fu(y ? "-" + e : e, i), e = (e.match(Iu(m, !0)) || []).join("");
	var D = e.indexOf(m);
	e = e.replace(new RegExp(cu(m), "g"), function(e, t) {
		return t === D ? "." : "";
	});
	var O = fu(e, i), k = O.beforeDecimal, A = O.afterDecimal, j = O.addNegation;
	return l.end - l.start < c.end - c.start && k === "" && h && !parseFloat(A) && (e = j ? "-" : ""), e;
}
function zu(e, t) {
	var n = t.prefix;
	n === void 0 && (n = "");
	var r = t.suffix;
	r === void 0 && (r = "");
	var i = Array.from({ length: e.length + 1 }).map(function() {
		return !0;
	}), a = e[0] === "-";
	i.fill(!1, 0, Math.min(n.length + +!!a, e.length));
	var o = e.length;
	return i.fill(!1, o - r.length + 1, o + 1), i;
}
function Bu(e) {
	var t = Pu(e), n = t.thousandSeparator, r = t.decimalSeparator, i = e.prefix;
	i === void 0 && (i = "");
	var a = e.allowNegative;
	if (a === void 0 && (a = !0), n === r) throw Error("\n        Decimal separator can't be same as thousand separator.\n        thousandSeparator: " + n + " (thousandSeparator = {true} is same as thousandSeparator = \",\")\n        decimalSeparator: " + r + " (default value for decimalSeparator is .)\n     ");
	return i.startsWith("-") && a && (console.error("\n      Prefix can't start with '-' when allowNegative is true.\n      prefix: " + i + "\n      allowNegative: " + a + "\n    "), a = !1), Object.assign(Object.assign({}, e), { allowNegative: a });
}
function Vu(e) {
	e = Bu(e), e.decimalSeparator, e.allowedDecimalSeparators, e.thousandsGroupStyle;
	var t = e.suffix, n = e.allowNegative, r = e.allowLeadingZeros, i = e.onKeyDown;
	i === void 0 && (i = nu);
	var a = e.onBlur;
	a === void 0 && (a = nu);
	var o = e.thousandSeparator, s = e.decimalScale, c = e.fixedDecimalScale, l = e.prefix;
	l === void 0 && (l = "");
	var u = e.defaultValue, d = e.value, f = e.valueIsNumericString, p = e.onValueChange, m = eu(e, [
		"decimalSeparator",
		"allowedDecimalSeparators",
		"thousandsGroupStyle",
		"suffix",
		"allowNegative",
		"allowLeadingZeros",
		"onKeyDown",
		"onBlur",
		"thousandSeparator",
		"decimalScale",
		"fixedDecimalScale",
		"prefix",
		"defaultValue",
		"value",
		"valueIsNumericString",
		"onValueChange"
	]), h = Pu(e), g = h.decimalSeparator, _ = h.allowedDecimalSeparators, v = function(t) {
		return Nu(t, e);
	}, y = function(t, n) {
		return Ru(t, n, e);
	}, b = au(d) ? u : d, x = f ?? Lu(b, l, t);
	au(d) ? au(u) || (x ||= typeof u == "number") : x ||= typeof d == "number";
	var S = function(e) {
		return su(e) ? e : (typeof e == "number" && (e = gu(e)), x && typeof s == "number" ? _u(e, s, !!c) : e);
	}, C = ku(S(d), S(u), !!x, v, y, p), w = C[0], T = w.numAsString, E = w.formattedValue, ee = C[1];
	return Object.assign(Object.assign({}, m), {
		value: E,
		valueIsNumericString: !1,
		isValidInputCharacter: function(e) {
			return e === g || iu(e);
		},
		isCharacterSame: function(e) {
			var t = e.currentValue, n = e.lastValue, r = e.formattedValue, i = e.currentValueIndex, a = e.formattedValueIndex, o = t[i], u = r[a], f = yu(n, t).to, p = function(e) {
				return y(e).indexOf(".") + l.length;
			};
			return d === 0 && c && s && t[f.start] === g && p(t) < i && p(r) > a ? !1 : i >= f.start && i < f.end && _ && _.includes(o) && u === g ? !0 : o === u;
		},
		onValueChange: ee,
		format: v,
		removeFormatting: y,
		getCaretBoundary: function(t) {
			return zu(t, e);
		},
		onKeyDown: function(e) {
			var t = e.target, r = e.key, a = t.selectionStart, u = t.selectionEnd, d = t.value;
			if (d === void 0 && (d = ""), (r === "Backspace" || r === "Delete") && u < l.length && d !== "-") {
				e.preventDefault();
				return;
			}
			if (a !== u) {
				i(e);
				return;
			}
			r === "Backspace" && d[0] === "-" && a === l.length + 1 && n && vu(t, 1), s && c && (r === "Backspace" && d[a - 1] === g ? (vu(t, a - 1), e.preventDefault()) : r === "Delete" && d[a] === g && e.preventDefault()), _?.includes(r) && d[a] === g && vu(t, a + 1);
			var f = o === !0 ? "," : o;
			r === "Backspace" && d[a - 1] === f && vu(t, a - 1), r === "Delete" && d[a] === f && vu(t, a + 1), i(e);
		},
		onBlur: function(t) {
			var n = T;
			n.match(/\d/g) || (n = ""), r || (n = pu(n)), c && s && (n = _u(n, s, c)), n !== T && ee({
				formattedValue: Nu(n, e),
				value: n,
				floatValue: parseFloat(n)
			}, {
				event: t,
				source: tu.event
			}), a(t);
		}
	});
}
function Hu(e) {
	var t = Vu(e);
	return C.createElement(Mu, Object.assign({}, t));
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/NumberInput/NumberInputChevron.mjs
function Uu({ direction: e, style: t, ...n }) {
	return /* @__PURE__ */ (0, V.jsx)("svg", {
		style: {
			width: "var(--ni-chevron-size)",
			height: "var(--ni-chevron-size)",
			transform: e === "up" ? "rotate(180deg)" : void 0,
			...t
		},
		viewBox: "0 0 15 15",
		fill: "none",
		xmlns: "http://www.w3.org/2000/svg",
		...n,
		children: /* @__PURE__ */ (0, V.jsx)("path", {
			d: "M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z",
			fill: "currentColor",
			fillRule: "evenodd",
			clipRule: "evenodd"
		})
	});
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/NumberInput/NumberInput.module.mjs
var Wu = {
	root: "m_e2f5cd4e",
	controls: "m_95e17d22",
	control: "m_80b4b171"
}, Gu = /^(0\.0*|-0(\.0*)?)$/, Ku = /^-?0\d+(\.\d+)?\.?$/, qu = /\.\d*0$/, Ju = /^-?\d+\.$/;
function Yu(e) {
	return typeof e == "string" && e !== "" && !Number.isNaN(Number(e));
}
function Xu(e) {
	return typeof e == "bigint";
}
function Zu(e) {
	return typeof e == "number" ? e < 2 ** 53 - 1 : e === "" || Yu(e) && Number(e) < 2 ** 53 - 1;
}
function Qu(e, t) {
	return e === "" || e === "-" || !t && e.startsWith("-") ? !1 : /^-?\d+$/.test(e);
}
function $u(e, t) {
	return typeof e == "bigint" || e === "" || Qu(e, t);
}
function ed(e) {
	if (!/^-?\d+$/.test(e)) return null;
	try {
		return BigInt(e);
	} catch {
		return null;
	}
}
function td(e) {
	if (typeof e == "bigint") return e;
	if (typeof e == "number" && Number.isFinite(e) && Number.isInteger(e)) return BigInt(e);
}
function nd(e, t, n) {
	return t !== void 0 && e < t ? t : n !== void 0 && e > n ? n : e;
}
function rd(e) {
	return e.toString().replace(".", "").length;
}
function id(e, t) {
	return (typeof e == "number" ? e < 2 ** 53 - 1 : !Number.isNaN(Number(e))) && !Number.isNaN(e) && rd(t) < 14 && t !== "";
}
function ad(e, t, n) {
	return e === void 0 || (t === void 0 || e >= t) && (n === void 0 || e <= n);
}
var od = {
	size: "sm",
	step: 1,
	clampBehavior: "blur",
	allowDecimal: !0,
	allowNegative: !0,
	withKeyboardEvents: !0,
	allowLeadingZeros: !0,
	trimLeadingZeroesOnBlur: !0,
	startValue: 0,
	allowedDecimalSeparators: [".", ","]
}, sd = B((e, { size: t }) => ({ controls: { "--ni-chevron-size": k(t, "ni-chevron-size") } }));
function cd(e, t, n) {
	let r = e.toString(), i = Ju.test(r), a = r.replace(/^0+(?=\d)/, ""), o = parseFloat(a);
	if (Number.isNaN(o)) return a;
	if (o > 2 ** 53 - 1) return t === void 0 ? a : t;
	let s = I(o, n, t);
	return i ? `${s.toString().replace(/^0+(?=\d)/, "")}.` : s;
}
function ld(e, t) {
	if (e === "" || e === "-") return e;
	let n = ed(e);
	return n === null ? e : t.clampBehavior === "blur" ? nd(n, t.min, t.max) : n;
}
var ud = Qn((e) => {
	let t = H([
		"Input",
		"InputWrapper",
		"NumberInput"
	], od, e), { className: n, classNames: r, styles: i, unstyled: a, vars: o, onChange: s, onValueChange: c, value: l, defaultValue: u, max: d, min: f, step: p, hideControls: m, rightSection: h, isAllowed: g, clampBehavior: _, onBlur: v, allowDecimal: y, decimalScale: b, onKeyDown: x, onKeyDownCapture: S, handlersRef: w, startValue: T, disabled: E, rightSectionPointerEvents: ee, allowNegative: O, readOnly: k, size: A, rightSectionWidth: j, stepHoldInterval: M, stepHoldDelay: N, allowLeadingZeros: P, withKeyboardEvents: te, trimLeadingZeroesOnBlur: ne, allowedDecimalSeparators: re, selectAllOnFocus: F, onMinReached: L, onMaxReached: ie, onFocus: ae, attributes: oe, ref: se, ...ce } = t, le = O ?? !0, ue = P ?? !0, de = U({
		name: "NumberInput",
		classes: Wu,
		props: t,
		classNames: r,
		styles: i,
		unstyled: a,
		attributes: oe,
		vars: o,
		varsResolver: sd
	}), { resolvedClassNames: fe, resolvedStyles: pe } = an({
		classNames: r,
		styles: i,
		props: t
	}), me = (0, C.useRef)(Xu(l) || Xu(u) ? "bigint" : "number");
	Xu(l) ? me.current = "bigint" : typeof l == "number" && (me.current = "number");
	let he = me.current === "bigint", [R, ge] = Ee({
		value: l,
		defaultValue: u,
		finalValue: "",
		onChange: s
	}), _e = N !== void 0 && M !== void 0, ve = (0, C.useRef)(null), ye = (0, C.useRef)(null), be = (0, C.useRef)(0), xe = typeof f == "number" ? f : void 0, Se = typeof d == "number" ? d : void 0, we = typeof p == "number" ? p : od.step, De = typeof T == "number" ? T : od.startValue, Oe = td(f), z = td(d), ke = td(p) ?? BigInt(1), Ae = td(T) ?? BigInt(0), je = (e) => !Qu(e, le) || ue && Ku.test(e) ? e : ed(e) ?? e, Me = (e) => {
		let t = Number(e);
		return Number.isSafeInteger(t) ? t : void 0;
	}, Ne = (e, t) => {
		t.source === "event" && ge(he ? je(e.value) : id(e.floatValue, e.value) && !Gu.test(e.value) && !(ue && Ku.test(e.value)) && !qu.test(e.value) && !Ju.test(e.value) ? e.floatValue : e.value), c?.(e, t);
	}, Pe = (e) => {
		let t = String(e).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
		return t ? Math.max(0, (t[1] ? t[1].length : 0) - (t[2] ? +t[2] : 0)) : 0;
	}, Fe = (e) => {
		ve.current && e !== void 0 && ve.current.setSelectionRange(e, e);
	}, Ie = (0, C.useRef)(D);
	Ie.current = () => {
		if (he) {
			if (!$u(R, le)) return;
			let e, t = R;
			if (typeof t == "bigint") {
				let n = t + ke;
				z !== void 0 && n > z && ie?.(), e = z !== void 0 && n > z ? z : n;
			} else if (typeof t == "string" && t !== "") {
				let n = ed(t);
				if (n === null) return;
				let r = n + ke;
				z !== void 0 && r > z && ie?.(), e = z !== void 0 && r > z ? z : r;
			} else e = nd(Ae, Oe, z);
			let n = e.toString();
			ge(e), c?.({
				floatValue: Me(e),
				formattedValue: n,
				value: n
			}, { source: "increment" }), setTimeout(() => Fe(ve.current?.value.length), 0);
			return;
		}
		if (!Zu(R)) return;
		let e, t = Pe(R), n = Pe(we), r = Math.max(t, n), i = 10 ** r;
		if (!Yu(R) && (typeof R != "number" || Number.isNaN(R))) e = I(De, xe, Se);
		else if (Se !== void 0) {
			let t = (Math.round(Number(R) * i) + Math.round(we * i)) / i;
			t > Se && ie?.(), e = t <= Se ? t : Se;
		} else e = (Math.round(Number(R) * i) + Math.round(we * i)) / i;
		let a = e.toFixed(r);
		ge(parseFloat(a)), c?.({
			floatValue: parseFloat(a),
			formattedValue: a,
			value: a
		}, { source: "increment" }), setTimeout(() => Fe(ve.current?.value.length), 0);
	};
	let Le = (0, C.useRef)(D);
	Le.current = () => {
		if (he) {
			if (!$u(R, le)) return;
			let e, t = Oe === void 0 ? le ? void 0 : BigInt(0) : Oe, n = R;
			if (typeof n == "bigint") {
				let r = n - ke;
				t !== void 0 && r < t && L?.(), e = t !== void 0 && r < t ? t : r;
			} else if (typeof n == "string" && n !== "") {
				let r = ed(n);
				if (r === null) return;
				let i = r - ke;
				t !== void 0 && i < t && L?.(), e = t !== void 0 && i < t ? t : i;
			} else e = nd(Ae, t, z);
			let r = e.toString();
			ge(e), c?.({
				floatValue: Me(e),
				formattedValue: r,
				value: r
			}, { source: "decrement" }), setTimeout(() => Fe(ve.current?.value.length), 0);
			return;
		}
		if (!Zu(R)) return;
		let e, t = xe === void 0 ? le ? -(2 ** 53 - 1) : 0 : xe, n = Pe(R), r = Pe(we), i = Math.max(n, r), a = 10 ** i;
		if (!Yu(R) && typeof R != "number" || Number.isNaN(R)) e = I(De, t, Se);
		else {
			let n = (Math.round(Number(R) * a) - Math.round(we * a)) / a;
			t !== void 0 && n < t && L?.(), e = t !== void 0 && n < t ? t : n;
		}
		let o = e.toFixed(i);
		ge(parseFloat(o)), c?.({
			floatValue: parseFloat(o),
			formattedValue: o,
			value: o
		}, { source: "decrement" }), setTimeout(() => Fe(ve.current?.value.length), 0);
	};
	let Re = (e) => {
		let t = e.clipboardData.getData("text"), n = ce.decimalSeparator || ".", r = (re || [".", ","]).filter((e) => e !== n);
		if (r.some((e) => t.includes(e))) {
			e.preventDefault();
			let i = t;
			r.forEach((e) => {
				i = i.split(e).join(n);
			});
			let a = ve.current;
			if (a) {
				let e = a.selectionStart ?? 0, t = a.selectionEnd ?? 0, n = a.value, r = n.substring(0, e) + i + n.substring(t);
				(Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set)?.call(a, r), a.dispatchEvent(new Event("change", { bubbles: !0 }));
				let o = e + i.length;
				setTimeout(() => Fe(o), 0);
			}
		}
		ce.onPaste?.(e);
	}, ze = (e) => {
		x?.(e), !(k || !te) && (e.key === "ArrowUp" && (e.preventDefault(), Ie.current?.()), e.key === "ArrowDown" && (e.preventDefault(), Le.current?.()));
	}, Be = (e) => {
		if (S?.(e), e.key === "Backspace") {
			let t = ve.current;
			t && t.selectionStart === 0 && t.selectionStart === t.selectionEnd && (e.preventDefault(), window.setTimeout(() => Fe(0), 0));
		}
	}, Ve = (e) => {
		F && setTimeout(() => e.currentTarget.select(), 0), ae?.(e);
	}, B = (e) => {
		let t = R;
		he ? (_ === "blur" && typeof t == "bigint" && (t = nd(t, Oe, z)), ne && typeof t == "string" && (t = ld(t, {
			min: Oe,
			max: z,
			clampBehavior: _
		}))) : (_ === "blur" && typeof t == "number" && (t = I(t, xe, Se)), ne && typeof t == "string" && Pe(t) < 15 && (t = cd(t, Se, xe))), R !== t && ge(t), v?.(e);
	};
	Ce(w, {
		increment: Ie.current,
		decrement: Le.current
	});
	let He = (e) => {
		e ? Ie.current?.() : Le.current?.(), be.current += 1;
	}, We = (e) => {
		if (He(e), _e) {
			let t = typeof M == "number" ? M : M(be.current);
			ye.current = window.setTimeout(() => We(e), t);
		}
	}, Ge = (e, t) => {
		e.preventDefault(), ve.current?.focus(), He(t), _e && (ye.current = window.setTimeout(() => We(t), N));
	}, Ke = () => {
		ye.current && window.clearTimeout(ye.current), ye.current = null, be.current = 0;
	}, qe = /* @__PURE__ */ (0, V.jsxs)("div", {
		...de("controls"),
		children: [/* @__PURE__ */ (0, V.jsx)(Ao, {
			...de("control"),
			tabIndex: -1,
			"aria-hidden": !0,
			disabled: E || typeof R == "number" && Se !== void 0 && R >= Se || typeof R == "bigint" && z !== void 0 && R >= z,
			mod: { direction: "up" },
			onMouseDown: (e) => e.preventDefault(),
			onPointerDown: (e) => {
				Ge(e, !0);
			},
			onPointerUp: Ke,
			onPointerLeave: Ke,
			children: /* @__PURE__ */ (0, V.jsx)(Uu, { direction: "up" })
		}), /* @__PURE__ */ (0, V.jsx)(Ao, {
			...de("control"),
			tabIndex: -1,
			"aria-hidden": !0,
			disabled: E || typeof R == "number" && xe !== void 0 && R <= xe || typeof R == "bigint" && Oe !== void 0 && R <= Oe,
			mod: { direction: "down" },
			onMouseDown: (e) => e.preventDefault(),
			onPointerDown: (e) => {
				Ge(e, !1);
			},
			onPointerUp: Ke,
			onPointerLeave: Ke,
			children: /* @__PURE__ */ (0, V.jsx)(Uu, { direction: "down" })
		})]
	});
	return /* @__PURE__ */ (0, V.jsx)(uc, {
		component: Hu,
		allowNegative: O,
		className: Ue(Wu.root, n),
		size: A,
		...ce,
		inputMode: he ? "numeric" : "decimal",
		readOnly: k,
		disabled: E,
		value: typeof R == "bigint" ? R.toString() : R,
		getInputRef: Te(se, ve),
		onValueChange: Ne,
		rightSection: m || k || !(he ? $u(R, le) : Zu(R)) ? h : h || qe,
		classNames: fe,
		styles: pe,
		unstyled: a,
		__staticSelector: "NumberInput",
		decimalScale: he ? 0 : y ? b : 0,
		onPaste: Re,
		onFocus: Ve,
		onKeyDown: ze,
		onKeyDownCapture: Be,
		rightSectionPointerEvents: ee ?? (E ? "none" : void 0),
		rightSectionWidth: j ?? `var(--ni-right-section-width-${A || "sm"})`,
		allowLeadingZeros: P,
		allowedDecimalSeparators: re,
		onBlur: B,
		attributes: oe,
		isAllowed: (e) => {
			if (!(!g || g(e))) return !1;
			if (_ !== "strict") return !0;
			if (!he) return ad(e.floatValue, xe, Se);
			if (e.value === "" || e.value === "-") return !0;
			let t = ed(e.value);
			return t === null || (Oe === void 0 || t >= Oe) && (z === void 0 || t <= z);
		}
	});
});
ud.classes = {
	...uc.classes,
	...Wu
}, ud.varsResolver = sd, ud.displayName = "@mantine/core/NumberInput";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Select/Select.mjs
var dd = {
	size: "sm",
	withCheckIcon: !0,
	allowDeselect: !0,
	checkIconPosition: "left",
	openOnFocus: !0
}, fd = Qn((e) => {
	let t = H([
		"Input",
		"InputWrapper",
		"Select"
	], dd, e), { classNames: n, styles: r, unstyled: i, vars: a, dropdownOpened: o, defaultDropdownOpened: s, onDropdownClose: c, onDropdownOpen: l, onFocus: u, onBlur: d, onClick: f, onChange: p, data: m, value: h, defaultValue: g, selectFirstOptionOnChange: _, selectFirstOptionOnDropdownOpen: v, onOptionSubmit: y, comboboxProps: b, readOnly: x, disabled: S, filter: w, limit: T, withScrollArea: E, maxDropdownHeight: ee, floatingHeight: D, size: O, searchable: k, rightSection: A, checkIconPosition: j, withCheckIcon: M, withAlignedLabels: N, nothingFoundMessage: P, name: te, form: ne, searchValue: re, defaultSearchValue: F, onSearchChange: I, allowDeselect: L, error: ie, rightSectionPointerEvents: ae, id: oe, clearable: se, clearSectionMode: ce, clearButtonProps: le, hiddenInputProps: ue, renderOption: de, onClear: fe, autoComplete: pe, scrollAreaProps: me, __defaultRightSection: he, __clearSection: R, __clearable: ge, chevronColor: _e, autoSelectOnBlur: ve, openOnFocus: ye, attributes: be, ...xe } = t, Ce = (0, C.useMemo)(() => yc(m), [m]), we = (0, C.useRef)({}), Te = (0, C.useMemo)(() => bc(Ce), [Ce]), De = Se(oe), [z, ke, Ae] = Ee({
		value: h,
		defaultValue: g,
		finalValue: null,
		onChange: p
	}), je = z == null ? void 0 : `${z}` in Te ? Te[`${z}`] : we.current[`${z}`], Me = Oe(je), [Ne, Pe, Fe] = Ee({
		value: re,
		defaultValue: F,
		finalValue: je ? je.label : "",
		onChange: I
	}), Ie = Jc({
		opened: o,
		defaultOpened: s,
		onDropdownOpen: () => {
			l?.(), v ? Ie.selectFirstOption() : Ie.updateSelectedOptionIndex("active", { scrollIntoView: !0 });
		},
		onDropdownClose: () => {
			c?.(), setTimeout(Ie.resetSelectedOption, 0);
		}
	}), Le = (e) => {
		Pe(e), Ie.resetSelectedOption();
	}, { resolvedClassNames: Re, resolvedStyles: ze } = an({
		props: t,
		styles: r,
		classNames: n
	});
	(0, C.useEffect)(() => {
		_ && Ie.selectFirstOption();
	}, [_, Ne]), (0, C.useEffect)(() => {
		h === null && Le(""), h != null && je && (Me?.value !== je.value || Me?.label !== je.label) && Le(je.label);
	}, [h, je]), (0, C.useEffect)(() => {
		!Ae && !Fe && Le(z == null ? "" : `${z}` in Te ? Te[`${z}`]?.label : we.current[`${z}`]?.label || "");
	}, [Te, z]), (0, C.useEffect)(() => {
		z && `${z}` in Te && (we.current[`${z}`] = Te[`${z}`]);
	}, [Te, z]);
	let Be = /* @__PURE__ */ (0, V.jsx)(Zc.ClearButton, {
		...le,
		onClear: () => {
			ke(null, null), Le(""), fe?.();
		}
	}), Ve = se && z != null && !S && !x;
	return /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [/* @__PURE__ */ (0, V.jsxs)(Zc, {
		store: Ie,
		__staticSelector: "Select",
		classNames: Re,
		styles: ze,
		unstyled: i,
		readOnly: x,
		size: O,
		attributes: be,
		floatingHeight: D,
		keepMounted: ve,
		onOptionSubmit: (e) => {
			y?.(e);
			let t = L && `${Te[e].value}` == `${z}` ? null : Te[e], n = t ? t.value : null;
			n !== z && ke(n, t), !Ae && Le(n == null ? "" : t?.label || ""), Ie.closeDropdown();
		},
		...b,
		children: [/* @__PURE__ */ (0, V.jsx)(Zc.Target, {
			targetType: k ? "input" : "button",
			autoComplete: pe,
			withExpandedAttribute: !0,
			children: /* @__PURE__ */ (0, V.jsx)(uc, {
				id: De,
				__defaultRightSection: /* @__PURE__ */ (0, V.jsx)(Zc.Chevron, {
					size: O,
					error: ie,
					unstyled: i,
					color: _e
				}),
				__clearSection: Be,
				__clearable: Ve,
				__clearSectionMode: ce,
				rightSection: A,
				rightSectionPointerEvents: ae || "none",
				...xe,
				size: O,
				__staticSelector: "Select",
				disabled: S,
				readOnly: x || !k,
				value: Ne,
				onChange: (e) => {
					Le(e.currentTarget.value), Ie.openDropdown(), _ && Ie.selectFirstOption();
				},
				onFocus: (e) => {
					ye && k && Ie.openDropdown(), u?.(e);
				},
				onBlur: (e) => {
					ve && Ie.clickSelectedOption(), k && Ie.closeDropdown();
					let t = z != null && (`${z}` in Te ? Te[`${z}`] : we.current[`${z}`]);
					Le(t && t.label || ""), d?.(e);
				},
				onClick: (e) => {
					k ? Ie.openDropdown() : Ie.toggleDropdown(), f?.(e);
				},
				classNames: Re,
				styles: ze,
				unstyled: i,
				pointer: !k,
				error: ie,
				attributes: be
			})
		}), /* @__PURE__ */ (0, V.jsx)(al, {
			data: Ce,
			hidden: x || S,
			filter: w,
			search: Ne,
			limit: T,
			hiddenWhenEmpty: !P,
			withScrollArea: E,
			maxDropdownHeight: ee,
			filterOptions: !!k && je?.label !== Ne,
			value: z,
			checkIconPosition: j,
			withCheckIcon: M,
			withAlignedLabels: N,
			nothingFoundMessage: P,
			unstyled: i,
			labelId: xe.label ? `${De}-label` : void 0,
			"aria-label": xe.label ? void 0 : xe["aria-label"],
			renderOption: de,
			scrollAreaProps: me
		})]
	}), /* @__PURE__ */ (0, V.jsx)(Zc.HiddenInput, {
		value: z,
		name: te,
		form: ne,
		disabled: S,
		...ue
	})] });
});
fd.classes = {
	...uc.classes,
	...Zc.classes
}, fd.displayName = "@mantine/core/Select";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/SimpleGrid/SimpleGridVariables.mjs
function pd(e) {
	if (e !== void 0) return typeof e == "number" ? _(e) : e;
}
function md({ spacing: e, verticalSpacing: t, cols: n, minColWidth: r, autoRows: i, selector: a }) {
	let o = Ht(), s = t === void 0 ? e : t, c = r !== void 0, u = y({
		"--sg-spacing-x": A(F(e)),
		"--sg-spacing-y": A(F(s)),
		"--sg-auto-rows": i,
		...c ? { "--sg-min-col-width": pd(r) } : { "--sg-cols": F(n)?.toString() }
	}), d = l(o.breakpoints).reduce((t, r) => (t[r] || (t[r] = {}), typeof e == "object" && e[r] !== void 0 && (t[r]["--sg-spacing-x"] = A(e[r])), typeof s == "object" && s[r] !== void 0 && (t[r]["--sg-spacing-y"] = A(s[r])), !c && typeof n == "object" && n[r] !== void 0 && (t[r]["--sg-cols"] = n[r]), t), {});
	return /* @__PURE__ */ (0, V.jsx)(Sn, {
		styles: u,
		media: re(l(d), o.breakpoints).filter((e) => l(d[e.value]).length > 0).map((e) => ({
			query: `(min-width: ${o.breakpoints[e.value]})`,
			styles: d[e.value]
		})),
		selector: a
	});
}
function hd(e) {
	return typeof e == "object" && e ? l(e) : [];
}
function gd(e) {
	return e.sort((e, t) => m(e) - m(t));
}
function _d({ spacing: e, verticalSpacing: t, cols: n, minColWidth: r }) {
	return gd(Array.from(/* @__PURE__ */ new Set([
		...hd(e),
		...hd(t),
		...r === void 0 ? hd(n) : []
	])));
}
function vd({ spacing: e, verticalSpacing: t, cols: n, minColWidth: r, autoRows: i, selector: a }) {
	let o = t === void 0 ? e : t, s = r !== void 0, c = y({
		"--sg-spacing-x": A(F(e)),
		"--sg-spacing-y": A(F(o)),
		"--sg-auto-rows": i,
		...s ? { "--sg-min-col-width": pd(r) } : { "--sg-cols": F(n)?.toString() }
	}), l = _d({
		spacing: e,
		verticalSpacing: t,
		cols: n,
		minColWidth: r
	}), u = l.reduce((t, r) => (t[r] || (t[r] = {}), typeof e == "object" && e[r] !== void 0 && (t[r]["--sg-spacing-x"] = A(e[r])), typeof o == "object" && o[r] !== void 0 && (t[r]["--sg-spacing-y"] = A(o[r])), !s && typeof n == "object" && n[r] !== void 0 && (t[r]["--sg-cols"] = n[r]), t), {});
	return /* @__PURE__ */ (0, V.jsx)(Sn, {
		styles: c,
		container: l.map((e) => ({
			query: `simple-grid (min-width: ${e})`,
			styles: u[e]
		})),
		selector: a
	});
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/SimpleGrid/SimpleGrid.module.mjs
var Q = {
	container: "m_925c2d2c",
	root: "m_2415a157"
}, yd = {
	cols: 1,
	spacing: "md",
	type: "media"
}, bd = W((e) => {
	let t = H("SimpleGrid", yd, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, cols: c, verticalSpacing: l, spacing: u, type: d, minColWidth: f, autoFlow: p, autoRows: m, attributes: h, ...g } = t, _ = U({
		name: "SimpleGrid",
		classes: Q,
		props: t,
		className: r,
		style: i,
		classNames: n,
		styles: a,
		unstyled: o,
		attributes: h,
		vars: s
	}), v = Jn(), y = f === void 0 ? void 0 : p || "auto-fill";
	return d === "container" ? /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [/* @__PURE__ */ (0, V.jsx)(vd, {
		...t,
		selector: `.${v}`
	}), /* @__PURE__ */ (0, V.jsx)("div", {
		..._("container"),
		children: /* @__PURE__ */ (0, V.jsx)(G, {
			..._("root", { className: v }),
			...g,
			"data-auto-cols": y
		})
	})] }) : /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [/* @__PURE__ */ (0, V.jsx)(md, {
		...t,
		selector: `.${v}`
	}), /* @__PURE__ */ (0, V.jsx)(G, {
		..._("root", { className: v }),
		...g,
		"data-auto-cols": y
	})] });
});
bd.classes = Q, bd.displayName = "@mantine/core/SimpleGrid";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Stack/Stack.module.mjs
var xd = { root: "m_6d731127" }, Sd = {
	gap: "md",
	align: "stretch",
	justify: "flex-start"
}, Cd = B((e, { gap: t, align: n, justify: r }) => ({ root: {
	"--stack-gap": A(t),
	"--stack-align": n,
	"--stack-justify": r
} })), wd = W((e) => {
	let t = H("Stack", Sd, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, align: c, justify: l, gap: u, variant: d, attributes: f, ...p } = t;
	return /* @__PURE__ */ (0, V.jsx)(G, {
		...U({
			name: "Stack",
			props: t,
			classes: xd,
			className: r,
			style: i,
			classNames: n,
			styles: a,
			unstyled: o,
			attributes: f,
			vars: s,
			varsResolver: Cd
		})("root"),
		variant: d,
		...p
	});
});
wd.classes = xd, wd.varsResolver = Cd, wd.displayName = "@mantine/core/Stack";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Table/Table.context.mjs
var [Td, Ed] = T("Table component was not found in the tree"), Dd = {
	table: "m_b23fa0ef",
	th: "m_4e7aa4f3",
	tr: "m_4e7aa4fd",
	td: "m_4e7aa4ef",
	tbody: "m_b2404537",
	thead: "m_b242d975",
	caption: "m_9e5a3ac7",
	scrollContainer: "m_a100c15",
	scrollContainerInner: "m_62259741"
};
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Table/Table.components.mjs
function Od(e, t) {
	if (!t) return;
	let n = {};
	return t.columnBorder && e.withColumnBorders && (n["data-with-column-border"] = !0), t.rowBorder && e.withRowBorders && (n["data-with-row-border"] = !0), t.striped && e.striped && (n["data-striped"] = e.striped), t.highlightOnHover && e.highlightOnHover && (n["data-hover"] = !0), t.captionSide && e.captionSide && (n["data-side"] = e.captionSide), t.stickyHeader && e.stickyHeader && (n["data-sticky"] = !0), n;
}
function kd(e, t) {
	let n = `Table${e.charAt(0).toUpperCase()}${e.slice(1)}`, r = W((r) => {
		let i = H(n, {}, r), { classNames: a, className: o, style: s, styles: c, ...l } = i, u = Ed();
		return /* @__PURE__ */ (0, V.jsx)(G, {
			component: e,
			...Od(u, t),
			...u.getStyles(e, {
				className: o,
				classNames: a,
				style: s,
				styles: c,
				props: i
			}),
			...l
		});
	});
	return r.displayName = `@mantine/core/${n}`, r.classes = Dd, r;
}
var Ad = kd("th", { columnBorder: !0 }), jd = kd("td", { columnBorder: !0 }), Md = kd("tr", {
	rowBorder: !0,
	striped: !0,
	highlightOnHover: !0
}), Nd = kd("thead", { stickyHeader: !0 }), Pd = kd("tbody"), Fd = kd("tfoot"), Id = kd("caption", { captionSide: !0 }), Ld = { type: "scrollarea" }, Rd = B((e, { minWidth: t, maxHeight: n, type: r }) => ({ scrollContainer: {
	"--table-min-width": _(t),
	"--table-max-height": _(n),
	"--table-overflow": r === "native" ? "auto" : void 0
} })), zd = W((e) => {
	let t = H("TableScrollContainer", Ld, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, children: c, minWidth: l, maxHeight: u, type: d, scrollAreaProps: f, attributes: p, ...m } = t, h = U({
		name: "TableScrollContainer",
		classes: Dd,
		props: t,
		className: r,
		style: i,
		classNames: n,
		styles: a,
		unstyled: o,
		attributes: p,
		vars: s,
		varsResolver: Rd,
		rootSelector: "scrollContainer"
	});
	return /* @__PURE__ */ (0, V.jsx)(G, {
		component: d === "scrollarea" ? Eo : "div",
		...d === "scrollarea" ? u ? {
			offsetScrollbars: "xy",
			...f
		} : {
			offsetScrollbars: "x",
			...f
		} : {},
		...h("scrollContainer"),
		...m,
		children: /* @__PURE__ */ (0, V.jsx)("div", {
			...h("scrollContainerInner"),
			children: c
		})
	});
});
zd.classes = Dd, zd.varsResolver = Rd, zd.displayName = "@mantine/core/TableScrollContainer";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Table/TableDataRenderer.mjs
function Bd({ data: e }) {
	return /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [
		e.caption && /* @__PURE__ */ (0, V.jsx)(Id, { children: e.caption }),
		e.head && /* @__PURE__ */ (0, V.jsx)(Nd, { children: /* @__PURE__ */ (0, V.jsx)(Md, { children: e.head.map((e, t) => /* @__PURE__ */ (0, V.jsx)(Ad, { children: e }, t)) }) }),
		e.body && /* @__PURE__ */ (0, V.jsx)(Pd, { children: e.body.map((e, t) => /* @__PURE__ */ (0, V.jsx)(Md, { children: e.map((e, t) => /* @__PURE__ */ (0, V.jsx)(jd, { children: e }, t)) }, t)) }),
		e.foot && /* @__PURE__ */ (0, V.jsx)(Fd, { children: /* @__PURE__ */ (0, V.jsx)(Md, { children: e.foot.map((e, t) => /* @__PURE__ */ (0, V.jsx)(Ad, { children: e }, t)) }) })
	] });
}
Bd.displayName = "@mantine/core/TableDataRenderer";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Table/Table.mjs
var Vd = {
	withRowBorders: !0,
	verticalSpacing: 7
}, Hd = B((e, { layout: t, captionSide: n, horizontalSpacing: r, verticalSpacing: i, borderColor: a, stripedColor: o, highlightOnHoverColor: s, striped: c, highlightOnHover: l, stickyHeaderOffset: u, stickyHeader: d }) => ({ table: {
	"--table-layout": t,
	"--table-caption-side": n,
	"--table-horizontal-spacing": A(r),
	"--table-vertical-spacing": A(i),
	"--table-border-color": a ? st(a, e) : void 0,
	"--table-striped-color": c && o ? st(o, e) : void 0,
	"--table-highlight-on-hover-color": l && s ? st(s, e) : void 0,
	"--table-sticky-header-offset": d ? _(u) : void 0
} })), $ = W((e) => {
	let t = H("Table", Vd, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, horizontalSpacing: c, verticalSpacing: l, captionSide: u, stripedColor: d, highlightOnHoverColor: f, striped: p, highlightOnHover: m, withColumnBorders: h, withRowBorders: g, withTableBorder: _, borderColor: v, layout: y, data: b, children: x, stickyHeader: S, stickyHeaderOffset: C, mod: w, tabularNums: T, attributes: E, ...ee } = t, D = U({
		name: "Table",
		props: t,
		className: r,
		style: i,
		classes: Dd,
		classNames: n,
		styles: a,
		unstyled: o,
		attributes: E,
		rootSelector: "table",
		vars: s,
		varsResolver: Hd
	});
	return /* @__PURE__ */ (0, V.jsx)(Td, {
		value: {
			getStyles: D,
			stickyHeader: S,
			striped: p === !0 ? "odd" : p || void 0,
			highlightOnHover: m,
			withColumnBorders: h,
			withRowBorders: g,
			captionSide: u || "bottom"
		},
		children: /* @__PURE__ */ (0, V.jsx)(G, {
			component: "table",
			mod: [{
				"data-with-table-border": _,
				"data-tabular-nums": T
			}, w],
			...D("table"),
			...ee,
			children: x || !!b && /* @__PURE__ */ (0, V.jsx)(Bd, { data: b })
		})
	});
});
$.classes = Dd, $.varsResolver = Hd, $.displayName = "@mantine/core/Table", $.Td = jd, $.Th = Ad, $.Tr = Md, $.Thead = Nd, $.Tbody = Pd, $.Tfoot = Fd, $.Caption = Id, $.ScrollContainer = zd, $.DataRenderer = Bd;
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/TextInput/TextInput.mjs
var Ud = W((e) => /* @__PURE__ */ (0, V.jsx)(uc, {
	component: "input",
	...H([
		"Input",
		"InputWrapper",
		"TextInput"
	], null, e),
	__staticSelector: "TextInput"
}));
Ud.classes = uc.classes, Ud.displayName = "@mantine/core/TextInput";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/ThemeIcon/ThemeIcon.module.mjs
var Wd = { root: "m_7341320d" }, Gd = B((e, { size: t, radius: n, variant: r, gradient: i, color: a, autoContrast: o }) => {
	let s = e.variantColorResolver({
		color: a || e.primaryColor,
		theme: e,
		gradient: i,
		variant: r || "filled",
		autoContrast: o
	});
	return { root: {
		"--ti-size": k(t, "ti-size"),
		"--ti-radius": n === void 0 ? void 0 : j(n),
		"--ti-bg": a || r ? s.background : void 0,
		"--ti-color": a || r ? s.color : void 0,
		"--ti-bd": a || r ? s.border : void 0
	} };
}), Kd = W((e) => {
	let t = H("ThemeIcon", null, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, vars: s, autoContrast: c, attributes: l, ...u } = t;
	return /* @__PURE__ */ (0, V.jsx)(G, {
		...U({
			name: "ThemeIcon",
			classes: Wd,
			props: t,
			className: r,
			style: i,
			classNames: n,
			styles: a,
			unstyled: o,
			attributes: l,
			vars: s,
			varsResolver: Gd
		})("root"),
		...u
	});
});
Kd.classes = Wd, Kd.varsResolver = Gd, Kd.displayName = "@mantine/core/ThemeIcon";
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Title/get-title-size.mjs
var qd = [
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6"
], Jd = [
	"xs",
	"sm",
	"md",
	"lg",
	"xl"
];
function Yd(e, t) {
	let n = t === void 0 ? `h${e}` : t;
	return qd.includes(n) ? {
		fontSize: `var(--mantine-${n}-font-size)`,
		fontWeight: `var(--mantine-${n}-font-weight)`,
		lineHeight: `var(--mantine-${n}-line-height)`
	} : Jd.includes(n) ? {
		fontSize: `var(--mantine-font-size-${n})`,
		fontWeight: `var(--mantine-h${e}-font-weight)`,
		lineHeight: `var(--mantine-h${e}-line-height)`
	} : {
		fontSize: _(n),
		fontWeight: `var(--mantine-h${e}-font-weight)`,
		lineHeight: `var(--mantine-h${e}-line-height)`
	};
}
//#endregion
//#region ../../node_modules/.bun/@mantine+core@9.5.0+7f4e0b61bf63b7ee/node_modules/@mantine/core/esm/components/Title/Title.module.mjs
var Xd = { root: "m_8a5d1357" }, Zd = { order: 1 }, Qd = B((e, { order: t, size: n, lineClamp: r, textWrap: i }) => {
	let a = Yd(t || 1, n);
	return { root: {
		"--title-fw": a.fontWeight,
		"--title-lh": a.lineHeight,
		"--title-fz": a.fontSize,
		"--title-line-clamp": typeof r == "number" ? r.toString() : void 0,
		"--title-text-wrap": i
	} };
}), $d = W((e) => {
	let t = H("Title", Zd, e), { classNames: n, className: r, style: i, styles: a, unstyled: o, order: s, vars: c, size: l, variant: u, lineClamp: d, textWrap: f, mod: p, attributes: m, ...h } = t, g = U({
		name: "Title",
		props: t,
		classes: Xd,
		className: r,
		style: i,
		classNames: n,
		styles: a,
		unstyled: o,
		attributes: m,
		vars: c,
		varsResolver: Qd
	});
	return [
		1,
		2,
		3,
		4,
		5,
		6
	].includes(s) ? /* @__PURE__ */ (0, V.jsx)(G, {
		...g("root"),
		component: `h${s}`,
		variant: u,
		mod: [{
			order: s,
			"data-line-clamp": typeof d == "number"
		}, p],
		size: l,
		...h
	}) : null;
});
$d.classes = Xd, $d.varsResolver = Qd, $d.displayName = "@mantine/core/Title";
//#endregion
//#region ../../node_modules/.bun/scheduler@0.27.0/node_modules/scheduler/cjs/scheduler.production.js
var ef = /* @__PURE__ */ o(((e) => {
	function t(e, t) {
		var n = e.length;
		e.push(t);
		a: for (; 0 < n;) {
			var r = n - 1 >>> 1, a = e[r];
			if (0 < i(a, t)) e[r] = t, e[n] = a, n = r;
			else break a;
		}
	}
	function n(e) {
		return e.length === 0 ? null : e[0];
	}
	function r(e) {
		if (e.length === 0) return null;
		var t = e[0], n = e.pop();
		if (n !== t) {
			e[0] = n;
			a: for (var r = 0, a = e.length, o = a >>> 1; r < o;) {
				var s = 2 * (r + 1) - 1, c = e[s], l = s + 1, u = e[l];
				if (0 > i(c, n)) l < a && 0 > i(u, c) ? (e[r] = u, e[l] = n, r = l) : (e[r] = c, e[s] = n, r = s);
				else if (l < a && 0 > i(u, n)) e[r] = u, e[l] = n, r = l;
				else break a;
			}
		}
		return t;
	}
	function i(e, t) {
		var n = e.sortIndex - t.sortIndex;
		return n === 0 ? e.id - t.id : n;
	}
	if (e.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
		var a = performance;
		e.unstable_now = function() {
			return a.now();
		};
	} else {
		var o = Date, s = o.now();
		e.unstable_now = function() {
			return o.now() - s;
		};
	}
	var c = [], l = [], u = 1, d = null, f = 3, p = !1, m = !1, h = !1, g = !1, _ = typeof setTimeout == "function" ? setTimeout : null, v = typeof clearTimeout == "function" ? clearTimeout : null, y = typeof setImmediate < "u" ? setImmediate : null;
	function b(e) {
		for (var i = n(l); i !== null;) {
			if (i.callback === null) r(l);
			else if (i.startTime <= e) r(l), i.sortIndex = i.expirationTime, t(c, i);
			else break;
			i = n(l);
		}
	}
	function x(e) {
		if (h = !1, b(e), !m) if (n(c) !== null) m = !0, S || (S = !0, D());
		else {
			var t = n(l);
			t !== null && A(x, t.startTime - e);
		}
	}
	var S = !1, C = -1, w = 5, T = -1;
	function E() {
		return g ? !0 : !(e.unstable_now() - T < w);
	}
	function ee() {
		if (g = !1, S) {
			var t = e.unstable_now();
			T = t;
			var i = !0;
			try {
				a: {
					m = !1, h && (h = !1, v(C), C = -1), p = !0;
					var a = f;
					try {
						b: {
							for (b(t), d = n(c); d !== null && !(d.expirationTime > t && E());) {
								var o = d.callback;
								if (typeof o == "function") {
									d.callback = null, f = d.priorityLevel;
									var s = o(d.expirationTime <= t);
									if (t = e.unstable_now(), typeof s == "function") {
										d.callback = s, b(t), i = !0;
										break b;
									}
									d === n(c) && r(c), b(t);
								} else r(c);
								d = n(c);
							}
							if (d !== null) i = !0;
							else {
								var u = n(l);
								u !== null && A(x, u.startTime - t), i = !1;
							}
						}
						break a;
					} finally {
						d = null, f = a, p = !1;
					}
				}
			} finally {
				i ? D() : S = !1;
			}
		}
	}
	var D;
	if (typeof y == "function") D = function() {
		y(ee);
	};
	else if (typeof MessageChannel < "u") {
		var O = new MessageChannel(), k = O.port2;
		O.port1.onmessage = ee, D = function() {
			k.postMessage(null);
		};
	} else D = function() {
		_(ee, 0);
	};
	function A(t, n) {
		C = _(function() {
			t(e.unstable_now());
		}, n);
	}
	e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
		e.callback = null;
	}, e.unstable_forceFrameRate = function(e) {
		0 > e || 125 < e ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : w = 0 < e ? Math.floor(1e3 / e) : 5;
	}, e.unstable_getCurrentPriorityLevel = function() {
		return f;
	}, e.unstable_next = function(e) {
		switch (f) {
			case 1:
			case 2:
			case 3:
				var t = 3;
				break;
			default: t = f;
		}
		var n = f;
		f = t;
		try {
			return e();
		} finally {
			f = n;
		}
	}, e.unstable_requestPaint = function() {
		g = !0;
	}, e.unstable_runWithPriority = function(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 3:
			case 4:
			case 5: break;
			default: e = 3;
		}
		var n = f;
		f = e;
		try {
			return t();
		} finally {
			f = n;
		}
	}, e.unstable_scheduleCallback = function(r, i, a) {
		var o = e.unstable_now();
		switch (typeof a == "object" && a ? (a = a.delay, a = typeof a == "number" && 0 < a ? o + a : o) : a = o, r) {
			case 1:
				var s = -1;
				break;
			case 2:
				s = 250;
				break;
			case 5:
				s = 1073741823;
				break;
			case 4:
				s = 1e4;
				break;
			default: s = 5e3;
		}
		return s = a + s, r = {
			id: u++,
			callback: i,
			priorityLevel: r,
			startTime: a,
			expirationTime: s,
			sortIndex: -1
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (v(C), C = -1) : h = !0, A(x, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, S || (S = !0, D()))), r;
	}, e.unstable_shouldYield = E, e.unstable_wrapCallback = function(e) {
		var t = f;
		return function() {
			var n = f;
			f = t;
			try {
				return e.apply(this, arguments);
			} finally {
				f = n;
			}
		};
	};
})), tf = /* @__PURE__ */ o(((e, t) => {
	t.exports = ef();
})), nf = /* @__PURE__ */ o(((e) => {
	var t = tf(), n = S(), r = Fe();
	function i(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function a(e) {
		return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
	}
	function o(e) {
		var t = e, n = e;
		if (e.alternate) for (; t.return;) t = t.return;
		else {
			e = t;
			do
				t = e, t.flags & 4098 && (n = t.return), e = t.return;
			while (e);
		}
		return t.tag === 3 ? n : null;
	}
	function s(e) {
		if (e.tag === 13) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function c(e) {
		if (e.tag === 31) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function l(e) {
		if (o(e) !== e) throw Error(i(188));
	}
	function u(e) {
		var t = e.alternate;
		if (!t) {
			if (t = o(e), t === null) throw Error(i(188));
			return t === e ? e : null;
		}
		for (var n = e, r = t;;) {
			var a = n.return;
			if (a === null) break;
			var s = a.alternate;
			if (s === null) {
				if (r = a.return, r !== null) {
					n = r;
					continue;
				}
				break;
			}
			if (a.child === s.child) {
				for (s = a.child; s;) {
					if (s === n) return l(a), e;
					if (s === r) return l(a), t;
					s = s.sibling;
				}
				throw Error(i(188));
			}
			if (n.return !== r.return) n = a, r = s;
			else {
				for (var c = !1, u = a.child; u;) {
					if (u === n) {
						c = !0, n = a, r = s;
						break;
					}
					if (u === r) {
						c = !0, r = a, n = s;
						break;
					}
					u = u.sibling;
				}
				if (!c) {
					for (u = s.child; u;) {
						if (u === n) {
							c = !0, n = s, r = a;
							break;
						}
						if (u === r) {
							c = !0, r = s, n = a;
							break;
						}
						u = u.sibling;
					}
					if (!c) throw Error(i(189));
				}
			}
			if (n.alternate !== r) throw Error(i(190));
		}
		if (n.tag !== 3) throw Error(i(188));
		return n.stateNode.current === n ? e : t;
	}
	function d(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e;
		for (e = e.child; e !== null;) {
			if (t = d(e), t !== null) return t;
			e = e.sibling;
		}
		return null;
	}
	var f = Object.assign, p = Symbol.for("react.element"), m = Symbol.for("react.transitional.element"), h = Symbol.for("react.portal"), g = Symbol.for("react.fragment"), _ = Symbol.for("react.strict_mode"), v = Symbol.for("react.profiler"), y = Symbol.for("react.consumer"), b = Symbol.for("react.context"), x = Symbol.for("react.forward_ref"), C = Symbol.for("react.suspense"), w = Symbol.for("react.suspense_list"), T = Symbol.for("react.memo"), E = Symbol.for("react.lazy"), ee = Symbol.for("react.activity"), D = Symbol.for("react.memo_cache_sentinel"), O = Symbol.iterator;
	function k(e) {
		return typeof e != "object" || !e ? null : (e = O && e[O] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var A = Symbol.for("react.client.reference");
	function j(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === A ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case g: return "Fragment";
			case v: return "Profiler";
			case _: return "StrictMode";
			case C: return "Suspense";
			case w: return "SuspenseList";
			case ee: return "Activity";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case h: return "Portal";
			case b: return e.displayName || "Context";
			case y: return (e._context.displayName || "Context") + ".Consumer";
			case x:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case T: return t = e.displayName || null, t === null ? j(e.type) || "Memo" : t;
			case E:
				t = e._payload, e = e._init;
				try {
					return j(e(t));
				} catch {}
		}
		return null;
	}
	var M = Array.isArray, N = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, P = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, te = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, ne = [], re = -1;
	function F(e) {
		return { current: e };
	}
	function I(e) {
		0 > re || (e.current = ne[re], ne[re] = null, re--);
	}
	function L(e, t) {
		re++, ne[re] = e.current, e.current = t;
	}
	var ie = F(null), ae = F(null), oe = F(null), se = F(null);
	function ce(e, t) {
		switch (L(oe, t), L(ae, e), L(ie, null), t.nodeType) {
			case 9:
			case 11:
				e = (e = t.documentElement) && (e = e.namespaceURI) ? Vd(e) : 0;
				break;
			default: if (e = t.tagName, t = t.namespaceURI) t = Vd(t), e = Hd(t, e);
			else switch (e) {
				case "svg":
					e = 1;
					break;
				case "math":
					e = 2;
					break;
				default: e = 0;
			}
		}
		I(ie), L(ie, e);
	}
	function le() {
		I(ie), I(ae), I(oe);
	}
	function ue(e) {
		e.memoizedState !== null && L(se, e);
		var t = ie.current, n = Hd(t, e.type);
		t !== n && (L(ae, e), L(ie, n));
	}
	function de(e) {
		ae.current === e && (I(ie), I(ae)), se.current === e && (I(se), Qf._currentValue = te);
	}
	var fe, pe;
	function me(e) {
		if (fe === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			fe = t && t[1] || "", pe = -1 < e.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + fe + e + pe;
	}
	var he = !1;
	function R(e, t) {
		if (!e || he) return "";
		he = !0;
		var n = Error.prepareStackTrace;
		Error.prepareStackTrace = void 0;
		try {
			var r = { DetermineComponentFrameRoot: function() {
				try {
					if (t) {
						var n = function() {
							throw Error();
						};
						if (Object.defineProperty(n.prototype, "props", { set: function() {
							throw Error();
						} }), typeof Reflect == "object" && Reflect.construct) {
							try {
								Reflect.construct(n, []);
							} catch (e) {
								var r = e;
							}
							Reflect.construct(e, [], n);
						} else {
							try {
								n.call();
							} catch (e) {
								r = e;
							}
							e.call(n.prototype);
						}
					} else {
						try {
							throw Error();
						} catch (e) {
							r = e;
						}
						(n = e()) && typeof n.catch == "function" && n.catch(function() {});
					}
				} catch (e) {
					if (e && r && typeof e.stack == "string") return [e.stack, r.stack];
				}
				return [null, null];
			} };
			r.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
			var i = Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot, "name");
			i && i.configurable && Object.defineProperty(r.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
			var a = r.DetermineComponentFrameRoot(), o = a[0], s = a[1];
			if (o && s) {
				var c = o.split("\n"), l = s.split("\n");
				for (i = r = 0; r < c.length && !c[r].includes("DetermineComponentFrameRoot");) r++;
				for (; i < l.length && !l[i].includes("DetermineComponentFrameRoot");) i++;
				if (r === c.length || i === l.length) for (r = c.length - 1, i = l.length - 1; 1 <= r && 0 <= i && c[r] !== l[i];) i--;
				for (; 1 <= r && 0 <= i; r--, i--) if (c[r] !== l[i]) {
					if (r !== 1 || i !== 1) do
						if (r--, i--, 0 > i || c[r] !== l[i]) {
							var u = "\n" + c[r].replace(" at new ", " at ");
							return e.displayName && u.includes("<anonymous>") && (u = u.replace("<anonymous>", e.displayName)), u;
						}
					while (1 <= r && 0 <= i);
					break;
				}
			}
		} finally {
			he = !1, Error.prepareStackTrace = n;
		}
		return (n = e ? e.displayName || e.name : "") ? me(n) : "";
	}
	function ge(e, t) {
		switch (e.tag) {
			case 26:
			case 27:
			case 5: return me(e.type);
			case 16: return me("Lazy");
			case 13: return e.child !== t && t !== null ? me("Suspense Fallback") : me("Suspense");
			case 19: return me("SuspenseList");
			case 0:
			case 15: return R(e.type, !1);
			case 11: return R(e.type.render, !1);
			case 1: return R(e.type, !0);
			case 31: return me("Activity");
			default: return "";
		}
	}
	function _e(e) {
		try {
			var t = "", n = null;
			do
				t += ge(e, n), n = e, e = e.return;
			while (e);
			return t;
		} catch (e) {
			return "\nError generating stack: " + e.message + "\n" + e.stack;
		}
	}
	var ve = Object.prototype.hasOwnProperty, ye = t.unstable_scheduleCallback, be = t.unstable_cancelCallback, xe = t.unstable_shouldYield, Se = t.unstable_requestPaint, Ce = t.unstable_now, we = t.unstable_getCurrentPriorityLevel, Te = t.unstable_ImmediatePriority, Ee = t.unstable_UserBlockingPriority, De = t.unstable_NormalPriority, Oe = t.unstable_LowPriority, z = t.unstable_IdlePriority, ke = t.log, Ae = t.unstable_setDisableYieldValue, je = null, Me = null;
	function Ne(e) {
		if (typeof ke == "function" && Ae(e), Me && typeof Me.setStrictMode == "function") try {
			Me.setStrictMode(je, e);
		} catch {}
	}
	var Pe = Math.clz32 ? Math.clz32 : Re, Ie = Math.log, Le = Math.LN2;
	function Re(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (Ie(e) / Le | 0) | 0;
	}
	var ze = 256, Be = 262144, Ve = 4194304;
	function B(e) {
		var t = e & 42;
		if (t !== 0) return t;
		switch (e & -e) {
			case 1: return 1;
			case 2: return 2;
			case 4: return 4;
			case 8: return 8;
			case 16: return 16;
			case 32: return 32;
			case 64: return 64;
			case 128: return 128;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072: return e & 261888;
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return e & 3932160;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return e & 62914560;
			case 67108864: return 67108864;
			case 134217728: return 134217728;
			case 268435456: return 268435456;
			case 536870912: return 536870912;
			case 1073741824: return 0;
			default: return e;
		}
	}
	function He(e, t, n) {
		var r = e.pendingLanes;
		if (r === 0) return 0;
		var i = 0, a = e.suspendedLanes, o = e.pingedLanes;
		e = e.warmLanes;
		var s = r & 134217727;
		return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = B(n))) : i = B(o) : i = B(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = B(n))) : i = B(o)) : i = B(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i;
	}
	function Ue(e, t) {
		return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
	}
	function We(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 4:
			case 8:
			case 64: return t + 250;
			case 16:
			case 32:
			case 128:
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return t + 5e3;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return -1;
			case 67108864:
			case 134217728:
			case 268435456:
			case 536870912:
			case 1073741824: return -1;
			default: return -1;
		}
	}
	function Ge() {
		var e = Ve;
		return Ve <<= 1, !(Ve & 62914560) && (Ve = 4194304), e;
	}
	function Ke(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function qe(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function Je(e, t, n, r, i, a) {
		var o = e.pendingLanes;
		e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
		var s = e.entanglements, c = e.expirationTimes, l = e.hiddenUpdates;
		for (n = o & ~n; 0 < n;) {
			var u = 31 - Pe(n), d = 1 << u;
			s[u] = 0, c[u] = -1;
			var f = l[u];
			if (f !== null) for (l[u] = null, u = 0; u < f.length; u++) {
				var p = f[u];
				p !== null && (p.lane &= -536870913);
			}
			n &= ~d;
		}
		r !== 0 && Ye(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function Ye(e, t, n) {
		e.pendingLanes |= t, e.suspendedLanes &= ~t;
		var r = 31 - Pe(t);
		e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 261930;
	}
	function Xe(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - Pe(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	function Ze(e, t) {
		var n = t & -t;
		return n = n & 42 ? 1 : Qe(n), (n & (e.suspendedLanes | t)) === 0 ? n : 0;
	}
	function Qe(e) {
		switch (e) {
			case 2:
				e = 1;
				break;
			case 8:
				e = 4;
				break;
			case 32:
				e = 16;
				break;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152:
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432:
				e = 128;
				break;
			case 268435456:
				e = 134217728;
				break;
			default: e = 0;
		}
		return e;
	}
	function $e(e) {
		return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
	}
	function et() {
		var e = P.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : mp(e.type)) : e;
	}
	function tt(e, t) {
		var n = P.p;
		try {
			return P.p = e, t();
		} finally {
			P.p = n;
		}
	}
	var nt = Math.random().toString(36).slice(2), rt = "__reactFiber$" + nt, it = "__reactProps$" + nt, at = "__reactContainer$" + nt, ot = "__reactEvents$" + nt, st = "__reactListeners$" + nt, ct = "__reactHandles$" + nt, lt = "__reactResources$" + nt, ut = "__reactMarker$" + nt;
	function dt(e) {
		delete e[rt], delete e[it], delete e[ot], delete e[st], delete e[ct];
	}
	function ft(e) {
		var t = e[rt];
		if (t) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[at] || n[rt]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = df(e); e !== null;) {
					if (n = e[rt]) return n;
					e = df(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function pt(e) {
		if (e = e[rt] || e[at]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function mt(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(i(33));
	}
	function ht(e) {
		var t = e[lt];
		return t ||= e[lt] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}, t;
	}
	function gt(e) {
		e[ut] = !0;
	}
	var _t = /* @__PURE__ */ new Set(), vt = {};
	function yt(e, t) {
		bt(e, t), bt(e + "Capture", t);
	}
	function bt(e, t) {
		for (vt[e] = t, e = 0; e < t.length; e++) _t.add(t[e]);
	}
	var xt = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), St = {}, Ct = {};
	function wt(e) {
		return ve.call(Ct, e) ? !0 : ve.call(St, e) ? !1 : xt.test(e) ? Ct[e] = !0 : (St[e] = !0, !1);
	}
	function Tt(e, t, n) {
		if (wt(t)) if (n === null) e.removeAttribute(t);
		else {
			switch (typeof n) {
				case "undefined":
				case "function":
				case "symbol":
					e.removeAttribute(t);
					return;
				case "boolean":
					var r = t.toLowerCase().slice(0, 5);
					if (r !== "data-" && r !== "aria-") {
						e.removeAttribute(t);
						return;
					}
			}
			e.setAttribute(t, "" + n);
		}
	}
	function Et(e, t, n) {
		if (n === null) e.removeAttribute(t);
		else {
			switch (typeof n) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(t);
					return;
			}
			e.setAttribute(t, "" + n);
		}
	}
	function Dt(e, t, n, r) {
		if (r === null) e.removeAttribute(n);
		else {
			switch (typeof r) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(n);
					return;
			}
			e.setAttributeNS(t, n, "" + r);
		}
	}
	function Ot(e) {
		switch (typeof e) {
			case "bigint":
			case "boolean":
			case "number":
			case "string":
			case "undefined": return e;
			case "object": return e;
			default: return "";
		}
	}
	function kt(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function At(e, t, n) {
		var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
		if (!e.hasOwnProperty(t) && r !== void 0 && typeof r.get == "function" && typeof r.set == "function") {
			var i = r.get, a = r.set;
			return Object.defineProperty(e, t, {
				configurable: !0,
				get: function() {
					return i.call(this);
				},
				set: function(e) {
					n = "" + e, a.call(this, e);
				}
			}), Object.defineProperty(e, t, { enumerable: r.enumerable }), {
				getValue: function() {
					return n;
				},
				setValue: function(e) {
					n = "" + e;
				},
				stopTracking: function() {
					e._valueTracker = null, delete e[t];
				}
			};
		}
	}
	function jt(e) {
		if (!e._valueTracker) {
			var t = kt(e) ? "checked" : "value";
			e._valueTracker = At(e, t, "" + e[t]);
		}
	}
	function Mt(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = kt(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
	}
	function Nt(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	var Pt = /[\n"\\]/g;
	function Ft(e) {
		return e.replace(Pt, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function It(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Ot(t)) : e.value !== "" + Ot(t) && (e.value = "" + Ot(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : Rt(e, o, Ot(n)) : Rt(e, o, Ot(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + Ot(s) : e.removeAttribute("name");
	}
	function Lt(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) {
				jt(e);
				return;
			}
			n = n == null ? "" : "" + Ot(n), t = t == null ? n : "" + Ot(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r ??= i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), jt(e);
	}
	function Rt(e, t, n) {
		t === "number" && Nt(e.ownerDocument) === e || e.defaultValue === "" + n || (e.defaultValue = "" + n);
	}
	function zt(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + Ot(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function V(e, t, n) {
		if (t != null && (t = "" + Ot(t), t !== e.value && (e.value = t), n == null)) {
			e.defaultValue !== t && (e.defaultValue = t);
			return;
		}
		e.defaultValue = n == null ? "" : "" + Ot(n);
	}
	function Bt(e, t, n, r) {
		if (t == null) {
			if (r != null) {
				if (n != null) throw Error(i(92));
				if (M(r)) {
					if (1 < r.length) throw Error(i(93));
					r = r[0];
				}
				n = r;
			}
			n ??= "", t = n;
		}
		n = Ot(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r), jt(e);
	}
	function Vt(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var Ht = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function Ut(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || Ht.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function Wt(e, t, n) {
		if (t != null && typeof t != "object") throw Error(i(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "");
			for (var a in t) r = t[a], t.hasOwnProperty(a) && n[a] !== r && Ut(e, a, r);
		} else for (var o in t) t.hasOwnProperty(o) && Ut(e, o, t[o]);
	}
	function Gt(e) {
		if (e.indexOf("-") === -1) return !1;
		switch (e) {
			case "annotation-xml":
			case "color-profile":
			case "font-face":
			case "font-face-src":
			case "font-face-uri":
			case "font-face-format":
			case "font-face-name":
			case "missing-glyph": return !1;
			default: return !0;
		}
	}
	var Kt = /* @__PURE__ */ new Map([
		["acceptCharset", "accept-charset"],
		["htmlFor", "for"],
		["httpEquiv", "http-equiv"],
		["crossOrigin", "crossorigin"],
		["accentHeight", "accent-height"],
		["alignmentBaseline", "alignment-baseline"],
		["arabicForm", "arabic-form"],
		["baselineShift", "baseline-shift"],
		["capHeight", "cap-height"],
		["clipPath", "clip-path"],
		["clipRule", "clip-rule"],
		["colorInterpolation", "color-interpolation"],
		["colorInterpolationFilters", "color-interpolation-filters"],
		["colorProfile", "color-profile"],
		["colorRendering", "color-rendering"],
		["dominantBaseline", "dominant-baseline"],
		["enableBackground", "enable-background"],
		["fillOpacity", "fill-opacity"],
		["fillRule", "fill-rule"],
		["floodColor", "flood-color"],
		["floodOpacity", "flood-opacity"],
		["fontFamily", "font-family"],
		["fontSize", "font-size"],
		["fontSizeAdjust", "font-size-adjust"],
		["fontStretch", "font-stretch"],
		["fontStyle", "font-style"],
		["fontVariant", "font-variant"],
		["fontWeight", "font-weight"],
		["glyphName", "glyph-name"],
		["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
		["glyphOrientationVertical", "glyph-orientation-vertical"],
		["horizAdvX", "horiz-adv-x"],
		["horizOriginX", "horiz-origin-x"],
		["imageRendering", "image-rendering"],
		["letterSpacing", "letter-spacing"],
		["lightingColor", "lighting-color"],
		["markerEnd", "marker-end"],
		["markerMid", "marker-mid"],
		["markerStart", "marker-start"],
		["overlinePosition", "overline-position"],
		["overlineThickness", "overline-thickness"],
		["paintOrder", "paint-order"],
		["panose-1", "panose-1"],
		["pointerEvents", "pointer-events"],
		["renderingIntent", "rendering-intent"],
		["shapeRendering", "shape-rendering"],
		["stopColor", "stop-color"],
		["stopOpacity", "stop-opacity"],
		["strikethroughPosition", "strikethrough-position"],
		["strikethroughThickness", "strikethrough-thickness"],
		["strokeDasharray", "stroke-dasharray"],
		["strokeDashoffset", "stroke-dashoffset"],
		["strokeLinecap", "stroke-linecap"],
		["strokeLinejoin", "stroke-linejoin"],
		["strokeMiterlimit", "stroke-miterlimit"],
		["strokeOpacity", "stroke-opacity"],
		["strokeWidth", "stroke-width"],
		["textAnchor", "text-anchor"],
		["textDecoration", "text-decoration"],
		["textRendering", "text-rendering"],
		["transformOrigin", "transform-origin"],
		["underlinePosition", "underline-position"],
		["underlineThickness", "underline-thickness"],
		["unicodeBidi", "unicode-bidi"],
		["unicodeRange", "unicode-range"],
		["unitsPerEm", "units-per-em"],
		["vAlphabetic", "v-alphabetic"],
		["vHanging", "v-hanging"],
		["vIdeographic", "v-ideographic"],
		["vMathematical", "v-mathematical"],
		["vectorEffect", "vector-effect"],
		["vertAdvY", "vert-adv-y"],
		["vertOriginX", "vert-origin-x"],
		["vertOriginY", "vert-origin-y"],
		["wordSpacing", "word-spacing"],
		["writingMode", "writing-mode"],
		["xmlnsXlink", "xmlns:xlink"],
		["xHeight", "x-height"]
	]), qt = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function Jt(e) {
		return qt.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	function Yt() {}
	var Xt = null;
	function Zt(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var Qt = null, $t = null;
	function en(e) {
		var t = pt(e);
		if (t && (e = t.stateNode)) {
			var n = e[it] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (It(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + Ft("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var a = r[it] || null;
								if (!a) throw Error(i(90));
								It(r, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && Mt(r);
					}
					break a;
				case "textarea":
					V(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && zt(e, !!n.multiple, t, !1);
			}
		}
	}
	var tn = !1;
	function nn(e, t, n) {
		if (tn) return e(t, n);
		tn = !0;
		try {
			return e(t);
		} finally {
			if (tn = !1, (Qt !== null || $t !== null) && (vu(), Qt && (t = Qt, e = $t, $t = Qt = null, en(t), e))) for (t = 0; t < e.length; t++) en(e[t]);
		}
	}
	function H(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = n[it] || null;
		if (r === null) return null;
		n = r[t];
		a: switch (t) {
			case "onClick":
			case "onClickCapture":
			case "onDoubleClick":
			case "onDoubleClickCapture":
			case "onMouseDown":
			case "onMouseDownCapture":
			case "onMouseMove":
			case "onMouseMoveCapture":
			case "onMouseUp":
			case "onMouseUpCapture":
			case "onMouseEnter":
				(r = !r.disabled) || (e = e.type, r = e !== "button" && e !== "input" && e !== "select" && e !== "textarea"), e = !r;
				break a;
			default: e = !1;
		}
		if (e) return null;
		if (n && typeof n != "function") throw Error(i(231, t, typeof n));
		return n;
	}
	var rn = !(typeof window > "u" || window.document === void 0 || window.document.createElement === void 0), an = !1;
	if (rn) try {
		var on = {};
		Object.defineProperty(on, "passive", { get: function() {
			an = !0;
		} }), window.addEventListener("test", on, on), window.removeEventListener("test", on, on);
	} catch {
		an = !1;
	}
	var sn = null, cn = null, ln = null;
	function un() {
		if (ln) return ln;
		var e, t = cn, n = t.length, r, i = "value" in sn ? sn.value : sn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return ln = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function dn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function fn() {
		return !0;
	}
	function pn() {
		return !1;
	}
	function mn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? fn : pn, this.isPropagationStopped = pn, this;
		}
		return f(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = fn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = fn);
			},
			persist: function() {},
			isPersistent: fn
		}), t;
	}
	var hn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, gn = mn(hn), _n = f({}, hn, {
		view: 0,
		detail: 0
	}), vn = mn(_n), U, yn, bn, xn = f({}, _n, {
		screenX: 0,
		screenY: 0,
		clientX: 0,
		clientY: 0,
		pageX: 0,
		pageY: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		getModifierState: Mn,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== bn && (bn && e.type === "mousemove" ? (U = e.screenX - bn.screenX, yn = e.screenY - bn.screenY) : yn = U = 0, bn = e), U);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : yn;
		}
	}), Sn = mn(xn), Cn = mn(f({}, xn, { dataTransfer: 0 })), wn = mn(f({}, _n, { relatedTarget: 0 })), Tn = mn(f({}, hn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), En = mn(f({}, hn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), Dn = mn(f({}, hn, { data: 0 })), On = {
		Esc: "Escape",
		Spacebar: " ",
		Left: "ArrowLeft",
		Up: "ArrowUp",
		Right: "ArrowRight",
		Down: "ArrowDown",
		Del: "Delete",
		Win: "OS",
		Menu: "ContextMenu",
		Apps: "ContextMenu",
		Scroll: "ScrollLock",
		MozPrintableKey: "Unidentified"
	}, kn = {
		8: "Backspace",
		9: "Tab",
		12: "Clear",
		13: "Enter",
		16: "Shift",
		17: "Control",
		18: "Alt",
		19: "Pause",
		20: "CapsLock",
		27: "Escape",
		32: " ",
		33: "PageUp",
		34: "PageDown",
		35: "End",
		36: "Home",
		37: "ArrowLeft",
		38: "ArrowUp",
		39: "ArrowRight",
		40: "ArrowDown",
		45: "Insert",
		46: "Delete",
		112: "F1",
		113: "F2",
		114: "F3",
		115: "F4",
		116: "F5",
		117: "F6",
		118: "F7",
		119: "F8",
		120: "F9",
		121: "F10",
		122: "F11",
		123: "F12",
		144: "NumLock",
		145: "ScrollLock",
		224: "Meta"
	}, An = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function jn(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = An[e]) ? !!t[e] : !1;
	}
	function Mn() {
		return jn;
	}
	var Nn = mn(f({}, _n, {
		key: function(e) {
			if (e.key) {
				var t = On[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = dn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? kn[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: Mn,
		charCode: function(e) {
			return e.type === "keypress" ? dn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? dn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), Pn = mn(f({}, xn, {
		pointerId: 0,
		width: 0,
		height: 0,
		pressure: 0,
		tangentialPressure: 0,
		tiltX: 0,
		tiltY: 0,
		twist: 0,
		pointerType: 0,
		isPrimary: 0
	})), Fn = mn(f({}, _n, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Mn
	})), In = mn(f({}, hn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Ln = mn(f({}, xn, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), Rn = mn(f({}, hn, {
		newState: 0,
		oldState: 0
	})), zn = [
		9,
		13,
		27,
		32
	], Bn = rn && "CompositionEvent" in window, Vn = null;
	rn && "documentMode" in document && (Vn = document.documentMode);
	var Hn = rn && "TextEvent" in window && !Vn, Un = rn && (!Bn || Vn && 8 < Vn && 11 >= Vn), Wn = " ", Gn = !1;
	function Kn(e, t) {
		switch (e) {
			case "keyup": return zn.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function qn(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var Jn = !1;
	function Yn(e, t) {
		switch (e) {
			case "compositionend": return qn(t);
			case "keypress": return t.which === 32 ? (Gn = !0, Wn) : null;
			case "textInput": return e = t.data, e === Wn && Gn ? null : e;
			default: return null;
		}
	}
	function Xn(e, t) {
		if (Jn) return e === "compositionend" || !Bn && Kn(e, t) ? (e = un(), ln = cn = sn = null, Jn = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return Un && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var Zn = {
		color: !0,
		date: !0,
		datetime: !0,
		"datetime-local": !0,
		email: !0,
		month: !0,
		number: !0,
		password: !0,
		range: !0,
		search: !0,
		tel: !0,
		text: !0,
		time: !0,
		url: !0,
		week: !0
	};
	function W(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!Zn[e.type] : t === "textarea";
	}
	function Qn(e, t, n, r) {
		Qt ? $t ? $t.push(r) : $t = [r] : Qt = r, t = Td(t, "onChange"), 0 < t.length && (n = new gn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var $n = null, er = null;
	function tr(e) {
		vd(e, 0);
	}
	function nr(e) {
		if (Mt(mt(e))) return e;
	}
	function rr(e, t) {
		if (e === "change") return t;
	}
	var ir = !1;
	if (rn) {
		var ar;
		if (rn) {
			var G = "oninput" in document;
			if (!G) {
				var or = document.createElement("div");
				or.setAttribute("oninput", "return;"), G = typeof or.oninput == "function";
			}
			ar = G;
		} else ar = !1;
		ir = ar && (!document.documentMode || 9 < document.documentMode);
	}
	function sr() {
		$n && ($n.detachEvent("onpropertychange", cr), er = $n = null);
	}
	function cr(e) {
		if (e.propertyName === "value" && nr(er)) {
			var t = [];
			Qn(t, er, e, Zt(e)), nn(tr, t);
		}
	}
	function lr(e, t, n) {
		e === "focusin" ? (sr(), $n = t, er = n, $n.attachEvent("onpropertychange", cr)) : e === "focusout" && sr();
	}
	function ur(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return nr(er);
	}
	function dr(e, t) {
		if (e === "click") return nr(t);
	}
	function fr(e, t) {
		if (e === "input" || e === "change") return nr(t);
	}
	function pr(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var mr = typeof Object.is == "function" ? Object.is : pr;
	function hr(e, t) {
		if (mr(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!ve.call(t, i) || !mr(e[i], t[i])) return !1;
		}
		return !0;
	}
	function gr(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function _r(e, t) {
		var n = gr(e);
		e = 0;
		for (var r; n;) {
			if (n.nodeType === 3) {
				if (r = e + n.textContent.length, e <= t && r >= t) return {
					node: n,
					offset: t - e
				};
				e = r;
			}
			a: {
				for (; n;) {
					if (n.nextSibling) {
						n = n.nextSibling;
						break a;
					}
					n = n.parentNode;
				}
				n = void 0;
			}
			n = gr(n);
		}
	}
	function vr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? vr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function yr(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = Nt(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = Nt(e.document);
		}
		return t;
	}
	function br(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var xr = rn && "documentMode" in document && 11 >= document.documentMode, Sr = null, Cr = null, wr = null, Tr = !1;
	function Er(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		Tr || Sr == null || Sr !== Nt(r) || (r = Sr, "selectionStart" in r && br(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), wr && hr(wr, r) || (wr = r, r = Td(Cr, "onSelect"), 0 < r.length && (t = new gn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = Sr)));
	}
	function Dr(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var Or = {
		animationend: Dr("Animation", "AnimationEnd"),
		animationiteration: Dr("Animation", "AnimationIteration"),
		animationstart: Dr("Animation", "AnimationStart"),
		transitionrun: Dr("Transition", "TransitionRun"),
		transitionstart: Dr("Transition", "TransitionStart"),
		transitioncancel: Dr("Transition", "TransitionCancel"),
		transitionend: Dr("Transition", "TransitionEnd")
	}, kr = {}, Ar = {};
	rn && (Ar = document.createElement("div").style, "AnimationEvent" in window || (delete Or.animationend.animation, delete Or.animationiteration.animation, delete Or.animationstart.animation), "TransitionEvent" in window || delete Or.transitionend.transition);
	function jr(e) {
		if (kr[e]) return kr[e];
		if (!Or[e]) return e;
		var t = Or[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in Ar) return kr[e] = t[n];
		return e;
	}
	var Mr = jr("animationend"), Nr = jr("animationiteration"), Pr = jr("animationstart"), Fr = jr("transitionrun"), Ir = jr("transitionstart"), Lr = jr("transitioncancel"), Rr = jr("transitionend"), zr = /* @__PURE__ */ new Map(), Br = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	Br.push("scrollEnd");
	function Vr(e, t) {
		zr.set(e, t), yt(t, [e]);
	}
	var Hr = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, Ur = [], Wr = 0, Gr = 0;
	function Kr() {
		for (var e = Wr, t = Gr = Wr = 0; t < e;) {
			var n = Ur[t];
			Ur[t++] = null;
			var r = Ur[t];
			Ur[t++] = null;
			var i = Ur[t];
			Ur[t++] = null;
			var a = Ur[t];
			if (Ur[t++] = null, r !== null && i !== null) {
				var o = r.pending;
				o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i;
			}
			a !== 0 && Xr(n, i, a);
		}
	}
	function qr(e, t, n, r) {
		Ur[Wr++] = e, Ur[Wr++] = t, Ur[Wr++] = n, Ur[Wr++] = r, Gr |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function Jr(e, t, n, r) {
		return qr(e, t, n, r), Zr(e);
	}
	function Yr(e, t) {
		return qr(e, null, null, t), Zr(e);
	}
	function Xr(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - Pe(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function Zr(e) {
		if (50 < lu) throw lu = 0, uu = null, Error(i(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var Qr = {};
	function $r(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function ei(e, t, n, r) {
		return new $r(e, t, n, r);
	}
	function ti(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function ni(e, t) {
		var n = e.alternate;
		return n === null ? (n = ei(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 65011712, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function ri(e, t) {
		e.flags &= 65011714;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function ii(e, t, n, r, a, o) {
		var s = 0;
		if (r = e, typeof e == "function") ti(e) && (s = 1);
		else if (typeof e == "string") s = Uf(e, n, ie.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (e) {
			case ee: return e = ei(31, n, t, a), e.elementType = ee, e.lanes = o, e;
			case g: return ai(n.children, a, o, t);
			case _:
				s = 8, a |= 24;
				break;
			case v: return e = ei(12, n, t, a | 2), e.elementType = v, e.lanes = o, e;
			case C: return e = ei(13, n, t, a), e.elementType = C, e.lanes = o, e;
			case w: return e = ei(19, n, t, a), e.elementType = w, e.lanes = o, e;
			default:
				if (typeof e == "object" && e) switch (e.$$typeof) {
					case b:
						s = 10;
						break a;
					case y:
						s = 9;
						break a;
					case x:
						s = 11;
						break a;
					case T:
						s = 14;
						break a;
					case E:
						s = 16, r = null;
						break a;
				}
				s = 29, n = Error(i(130, e === null ? "null" : typeof e, "")), r = null;
		}
		return t = ei(s, n, t, a), t.elementType = e, t.type = r, t.lanes = o, t;
	}
	function ai(e, t, n, r) {
		return e = ei(7, e, r, t), e.lanes = n, e;
	}
	function oi(e, t, n) {
		return e = ei(6, e, null, t), e.lanes = n, e;
	}
	function si(e) {
		var t = ei(18, null, null, 0);
		return t.stateNode = e, t;
	}
	function ci(e, t, n) {
		return t = ei(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	var li = /* @__PURE__ */ new WeakMap();
	function ui(e, t) {
		if (typeof e == "object" && e) {
			var n = li.get(e);
			return n === void 0 ? (t = {
				value: e,
				source: t,
				stack: _e(t)
			}, li.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: _e(t)
		};
	}
	var di = [], fi = 0, pi = null, mi = 0, hi = [], gi = 0, _i = null, vi = 1, yi = "";
	function bi(e, t) {
		di[fi++] = mi, di[fi++] = pi, pi = e, mi = t;
	}
	function xi(e, t, n) {
		hi[gi++] = vi, hi[gi++] = yi, hi[gi++] = _i, _i = e;
		var r = vi;
		e = yi;
		var i = 32 - Pe(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - Pe(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, vi = 1 << 32 - Pe(t) + i | n << i | r, yi = a + e;
		} else vi = 1 << a | n << i | r, yi = e;
	}
	function Si(e) {
		e.return !== null && (bi(e, 1), xi(e, 1, 0));
	}
	function Ci(e) {
		for (; e === pi;) pi = di[--fi], di[fi] = null, mi = di[--fi], di[fi] = null;
		for (; e === _i;) _i = hi[--gi], hi[gi] = null, yi = hi[--gi], hi[gi] = null, vi = hi[--gi], hi[gi] = null;
	}
	function wi(e, t) {
		hi[gi++] = vi, hi[gi++] = yi, hi[gi++] = _i, vi = t.id, yi = t.overflow, _i = e;
	}
	var Ti = null, Ei = null, K = !1, Di = null, Oi = !1, ki = Error(i(519));
	function Ai(e) {
		throw Ii(ui(Error(i(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), ki;
	}
	function ji(e) {
		var t = e.stateNode, n = e.type, r = e.memoizedProps;
		switch (t[rt] = e, t[it] = r, n) {
			case "dialog":
				Q("cancel", t), Q("close", t);
				break;
			case "iframe":
			case "object":
			case "embed":
				Q("load", t);
				break;
			case "video":
			case "audio":
				for (n = 0; n < gd.length; n++) Q(gd[n], t);
				break;
			case "source":
				Q("error", t);
				break;
			case "img":
			case "image":
			case "link":
				Q("error", t), Q("load", t);
				break;
			case "details":
				Q("toggle", t);
				break;
			case "input":
				Q("invalid", t), Lt(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0);
				break;
			case "select":
				Q("invalid", t);
				break;
			case "textarea": Q("invalid", t), Bt(t, r.value, r.defaultValue, r.children);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || jd(t.textContent, n) ? (r.popover != null && (Q("beforetoggle", t), Q("toggle", t)), r.onScroll != null && Q("scroll", t), r.onScrollEnd != null && Q("scrollend", t), r.onClick != null && (t.onclick = Yt), t = !0) : t = !1, t || Ai(e, !0);
	}
	function Mi(e) {
		for (Ti = e.return; Ti;) switch (Ti.tag) {
			case 5:
			case 31:
			case 13:
				Oi = !1;
				return;
			case 27:
			case 3:
				Oi = !0;
				return;
			default: Ti = Ti.return;
		}
	}
	function Ni(e) {
		if (e !== Ti) return !1;
		if (!K) return Mi(e), K = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = n === "form" || n === "button" || $(e.type, e.memoizedProps)), n = !n), n && Ei && Ai(e), Mi(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			Ei = uf(e);
		} else if (t === 31) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			Ei = uf(e);
		} else t === 27 ? (t = Ei, Xd(e.type) ? (e = lf, lf = null, Ei = e) : Ei = t) : Ei = Ti ? cf(e.stateNode.nextSibling) : null;
		return !0;
	}
	function Pi() {
		Ei = Ti = null, K = !1;
	}
	function Fi() {
		var e = Di;
		return e !== null && (Yl === null ? Yl = e : Yl.push.apply(Yl, e), Di = null), e;
	}
	function Ii(e) {
		Di === null ? Di = [e] : Di.push(e);
	}
	var Li = F(null), Ri = null, zi = null;
	function Bi(e, t, n) {
		L(Li, t._currentValue), t._currentValue = n;
	}
	function Vi(e) {
		e._currentValue = Li.current, I(Li);
	}
	function Hi(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function Ui(e, t, n, r) {
		var a = e.child;
		for (a !== null && (a.return = e); a !== null;) {
			var o = a.dependencies;
			if (o !== null) {
				var s = a.child;
				o = o.firstContext;
				a: for (; o !== null;) {
					var c = o;
					o = a;
					for (var l = 0; l < t.length; l++) if (c.context === t[l]) {
						o.lanes |= n, c = o.alternate, c !== null && (c.lanes |= n), Hi(o.return, n, e), r || (s = null);
						break a;
					}
					o = c.next;
				}
			} else if (a.tag === 18) {
				if (s = a.return, s === null) throw Error(i(341));
				s.lanes |= n, o = s.alternate, o !== null && (o.lanes |= n), Hi(s, n, e), s = null;
			} else s = a.child;
			if (s !== null) s.return = a;
			else for (s = a; s !== null;) {
				if (s === e) {
					s = null;
					break;
				}
				if (a = s.sibling, a !== null) {
					a.return = s.return, s = a;
					break;
				}
				s = s.return;
			}
			a = s;
		}
	}
	function Wi(e, t, n, r) {
		e = null;
		for (var a = t, o = !1; a !== null;) {
			if (!o) {
				if (a.flags & 524288) o = !0;
				else if (a.flags & 262144) break;
			}
			if (a.tag === 10) {
				var s = a.alternate;
				if (s === null) throw Error(i(387));
				if (s = s.memoizedProps, s !== null) {
					var c = a.type;
					mr(a.pendingProps.value, s.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (a === se.current) {
				if (s = a.alternate, s === null) throw Error(i(387));
				s.memoizedState.memoizedState !== a.memoizedState.memoizedState && (e === null ? e = [Qf] : e.push(Qf));
			}
			a = a.return;
		}
		e !== null && Ui(t, e, n, r), t.flags |= 262144;
	}
	function Gi(e) {
		for (e = e.firstContext; e !== null;) {
			if (!mr(e.context._currentValue, e.memoizedValue)) return !0;
			e = e.next;
		}
		return !1;
	}
	function Ki(e) {
		Ri = e, zi = null, e = e.dependencies, e !== null && (e.firstContext = null);
	}
	function qi(e) {
		return Yi(Ri, e);
	}
	function Ji(e, t) {
		return Ri === null && Ki(e), Yi(e, t);
	}
	function Yi(e, t) {
		var n = t._currentValue;
		if (t = {
			context: t,
			memoizedValue: n,
			next: null
		}, zi === null) {
			if (e === null) throw Error(i(308));
			zi = t, e.dependencies = {
				lanes: 0,
				firstContext: t
			}, e.flags |= 524288;
		} else zi = zi.next = t;
		return n;
	}
	var Xi = typeof AbortController < "u" ? AbortController : function() {
		var e = [], t = this.signal = {
			aborted: !1,
			addEventListener: function(t, n) {
				e.push(n);
			}
		};
		this.abort = function() {
			t.aborted = !0, e.forEach(function(e) {
				return e();
			});
		};
	}, Zi = t.unstable_scheduleCallback, Qi = t.unstable_NormalPriority, $i = {
		$$typeof: b,
		Consumer: null,
		Provider: null,
		_currentValue: null,
		_currentValue2: null,
		_threadCount: 0
	};
	function ea() {
		return {
			controller: new Xi(),
			data: /* @__PURE__ */ new Map(),
			refCount: 0
		};
	}
	function ta(e) {
		e.refCount--, e.refCount === 0 && Zi(Qi, function() {
			e.controller.abort();
		});
	}
	var na = null, ra = 0, ia = 0, aa = null;
	function oa(e, t) {
		if (na === null) {
			var n = na = [];
			ra = 0, ia = ud(), aa = {
				status: "pending",
				value: void 0,
				then: function(e) {
					n.push(e);
				}
			};
		}
		return ra++, t.then(sa, sa), t;
	}
	function sa() {
		if (--ra === 0 && na !== null) {
			aa !== null && (aa.status = "fulfilled");
			var e = na;
			na = null, ia = 0, aa = null;
			for (var t = 0; t < e.length; t++) (0, e[t])();
		}
	}
	function ca(e, t) {
		var n = [], r = {
			status: "pending",
			value: null,
			reason: null,
			then: function(e) {
				n.push(e);
			}
		};
		return e.then(function() {
			r.status = "fulfilled", r.value = t;
			for (var e = 0; e < n.length; e++) (0, n[e])(t);
		}, function(e) {
			for (r.status = "rejected", r.reason = e, e = 0; e < n.length; e++) (0, n[e])(void 0);
		}), r;
	}
	var la = N.S;
	N.S = function(e, t) {
		Ql = Ce(), typeof t == "object" && t && typeof t.then == "function" && oa(e, t), la !== null && la(e, t);
	};
	var ua = F(null);
	function da() {
		var e = ua.current;
		return e === null ? Fl.pooledCache : e;
	}
	function fa(e, t) {
		t === null ? L(ua, ua.current) : L(ua, t.pool);
	}
	function pa() {
		var e = da();
		return e === null ? null : {
			parent: $i._currentValue,
			pool: e
		};
	}
	var ma = Error(i(460)), ha = Error(i(474)), ga = Error(i(542)), _a = { then: function() {} };
	function va(e) {
		return e = e.status, e === "fulfilled" || e === "rejected";
	}
	function ya(e, t, n) {
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(Yt, Yt), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, Ca(e), e;
			default:
				if (typeof t.status == "string") t.then(Yt, Yt);
				else {
					if (e = Fl, e !== null && 100 < e.shellSuspendCounter) throw Error(i(482));
					e = t, e.status = "pending", e.then(function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "fulfilled", n.value = e;
						}
					}, function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "rejected", n.reason = e;
						}
					});
				}
				switch (t.status) {
					case "fulfilled": return t.value;
					case "rejected": throw e = t.reason, Ca(e), e;
				}
				throw xa = t, ma;
		}
	}
	function ba(e) {
		try {
			var t = e._init;
			return t(e._payload);
		} catch (e) {
			throw typeof e == "object" && e && typeof e.then == "function" ? (xa = e, ma) : e;
		}
	}
	var xa = null;
	function Sa() {
		if (xa === null) throw Error(i(459));
		var e = xa;
		return xa = null, e;
	}
	function Ca(e) {
		if (e === ma || e === ga) throw Error(i(483));
	}
	var wa = null, Ta = 0;
	function Ea(e) {
		var t = Ta;
		return Ta += 1, wa === null && (wa = []), ya(wa, e, t);
	}
	function Da(e, t) {
		t = t.props.ref, e.ref = t === void 0 ? null : t;
	}
	function Oa(e, t) {
		throw t.$$typeof === p ? Error(i(525)) : (e = Object.prototype.toString.call(t), Error(i(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
	}
	function ka(e) {
		function t(t, n) {
			if (e) {
				var r = t.deletions;
				r === null ? (t.deletions = [n], t.flags |= 16) : r.push(n);
			}
		}
		function n(n, r) {
			if (!e) return null;
			for (; r !== null;) t(n, r), r = r.sibling;
			return null;
		}
		function r(e) {
			for (var t = /* @__PURE__ */ new Map(); e !== null;) e.key === null ? t.set(e.index, e) : t.set(e.key, e), e = e.sibling;
			return t;
		}
		function a(e, t) {
			return e = ni(e, t), e.index = 0, e.sibling = null, e;
		}
		function o(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 67108866, n) : (r = r.index, r < n ? (t.flags |= 67108866, n) : r)) : (t.flags |= 1048576, n);
		}
		function s(t) {
			return e && t.alternate === null && (t.flags |= 67108866), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = oi(n, e.mode, r), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var i = n.type;
			return i === g ? d(e, t, n.props.children, r, n.key) : t !== null && (t.elementType === i || typeof i == "object" && i && i.$$typeof === E && ba(i) === t.type) ? (t = a(t, n.props), Da(t, n), t.return = e, t) : (t = ii(n.type, n.key, n.props, null, e.mode, r), Da(t, n), t.return = e, t);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = ci(n, e.mode, r), t.return = e, t) : (t = a(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, i) {
			return t === null || t.tag !== 7 ? (t = ai(n, e.mode, r, i), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number" || typeof t == "bigint") return t = oi("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case m: return n = ii(t.type, t.key, t.props, null, e.mode, n), Da(n, t), n.return = e, n;
					case h: return t = ci(t, e.mode, n), t.return = e, t;
					case E: return t = ba(t), f(e, t, n);
				}
				if (M(t) || k(t)) return t = ai(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, Ea(t), n);
				if (t.$$typeof === b) return f(e, Ji(e, t), n);
				Oa(e, t);
			}
			return null;
		}
		function p(e, t, n, r) {
			var i = t === null ? null : t.key;
			if (typeof n == "string" && n !== "" || typeof n == "number" || typeof n == "bigint") return i === null ? c(e, t, "" + n, r) : null;
			if (typeof n == "object" && n) {
				switch (n.$$typeof) {
					case m: return n.key === i ? l(e, t, n, r) : null;
					case h: return n.key === i ? u(e, t, n, r) : null;
					case E: return n = ba(n), p(e, t, n, r);
				}
				if (M(n) || k(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, Ea(n), r);
				if (n.$$typeof === b) return p(e, t, Ji(e, n), r);
				Oa(e, n);
			}
			return null;
		}
		function _(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number" || typeof r == "bigint") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case m: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case h: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case E: return r = ba(r), _(e, t, n, r, i);
				}
				if (M(r) || k(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return _(e, t, n, Ea(r), i);
				if (r.$$typeof === b) return _(e, t, n, Ji(t, r), i);
				Oa(t, r);
			}
			return null;
		}
		function v(i, a, s, c) {
			for (var l = null, u = null, d = a, m = a = 0, h = null; d !== null && m < s.length; m++) {
				d.index > m ? (h = d, d = null) : h = d.sibling;
				var g = p(i, d, s[m], c);
				if (g === null) {
					d === null && (d = h);
					break;
				}
				e && d && g.alternate === null && t(i, d), a = o(g, a, m), u === null ? l = g : u.sibling = g, u = g, d = h;
			}
			if (m === s.length) return n(i, d), K && bi(i, m), l;
			if (d === null) {
				for (; m < s.length; m++) d = f(i, s[m], c), d !== null && (a = o(d, a, m), u === null ? l = d : u.sibling = d, u = d);
				return K && bi(i, m), l;
			}
			for (d = r(d); m < s.length; m++) h = _(d, i, m, s[m], c), h !== null && (e && h.alternate !== null && d.delete(h.key === null ? m : h.key), a = o(h, a, m), u === null ? l = h : u.sibling = h, u = h);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), K && bi(i, m), l;
		}
		function y(a, s, c, l) {
			if (c == null) throw Error(i(151));
			for (var u = null, d = null, m = s, h = s = 0, g = null, v = c.next(); m !== null && !v.done; h++, v = c.next()) {
				m.index > h ? (g = m, m = null) : g = m.sibling;
				var y = p(a, m, v.value, l);
				if (y === null) {
					m === null && (m = g);
					break;
				}
				e && m && y.alternate === null && t(a, m), s = o(y, s, h), d === null ? u = y : d.sibling = y, d = y, m = g;
			}
			if (v.done) return n(a, m), K && bi(a, h), u;
			if (m === null) {
				for (; !v.done; h++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, h), d === null ? u = v : d.sibling = v, d = v);
				return K && bi(a, h), u;
			}
			for (m = r(m); !v.done; h++, v = c.next()) v = _(m, a, h, v.value, l), v !== null && (e && v.alternate !== null && m.delete(v.key === null ? h : v.key), s = o(v, s, h), d === null ? u = v : d.sibling = v, d = v);
			return e && m.forEach(function(e) {
				return t(a, e);
			}), K && bi(a, h), u;
		}
		function x(e, r, o, c) {
			if (typeof o == "object" && o && o.type === g && o.key === null && (o = o.props.children), typeof o == "object" && o) {
				switch (o.$$typeof) {
					case m:
						a: {
							for (var l = o.key; r !== null;) {
								if (r.key === l) {
									if (l = o.type, l === g) {
										if (r.tag === 7) {
											n(e, r.sibling), c = a(r, o.props.children), c.return = e, e = c;
											break a;
										}
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === E && ba(l) === r.type) {
										n(e, r.sibling), c = a(r, o.props), Da(c, o), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							o.type === g ? (c = ai(o.props.children, e.mode, c, o.key), c.return = e, e = c) : (c = ii(o.type, o.key, o.props, null, e.mode, c), Da(c, o), c.return = e, e = c);
						}
						return s(e);
					case h:
						a: {
							for (l = o.key; r !== null;) {
								if (r.key === l) if (r.tag === 4 && r.stateNode.containerInfo === o.containerInfo && r.stateNode.implementation === o.implementation) {
									n(e, r.sibling), c = a(r, o.children || []), c.return = e, e = c;
									break a;
								} else {
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							c = ci(o, e.mode, c), c.return = e, e = c;
						}
						return s(e);
					case E: return o = ba(o), x(e, r, o, c);
				}
				if (M(o)) return v(e, r, o, c);
				if (k(o)) {
					if (l = k(o), typeof l != "function") throw Error(i(150));
					return o = l.call(o), y(e, r, o, c);
				}
				if (typeof o.then == "function") return x(e, r, Ea(o), c);
				if (o.$$typeof === b) return x(e, r, Ji(e, o), c);
				Oa(e, o);
			}
			return typeof o == "string" && o !== "" || typeof o == "number" || typeof o == "bigint" ? (o = "" + o, r !== null && r.tag === 6 ? (n(e, r.sibling), c = a(r, o), c.return = e, e = c) : (n(e, r), c = oi(o, e.mode, c), c.return = e, e = c), s(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				Ta = 0;
				var i = x(e, t, n, r);
				return wa = null, i;
			} catch (t) {
				if (t === ma || t === ga) throw t;
				var a = ei(29, t, null, e.mode);
				return a.lanes = r, a.return = e, a;
			}
		};
	}
	var Aa = ka(!0), ja = ka(!1), Ma = !1;
	function Na(e) {
		e.updateQueue = {
			baseState: e.memoizedState,
			firstBaseUpdate: null,
			lastBaseUpdate: null,
			shared: {
				pending: null,
				lanes: 0,
				hiddenCallbacks: null
			},
			callbacks: null
		};
	}
	function Pa(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			callbacks: null
		});
	}
	function Fa(e) {
		return {
			lane: e,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function Ia(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, Y & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = Zr(e), Xr(e, null, n), t;
		}
		return qr(e, r, t, n), Zr(e);
	}
	function La(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, Xe(e, n);
		}
	}
	function Ra(e, t) {
		var n = e.updateQueue, r = e.alternate;
		if (r !== null && (r = r.updateQueue, n === r)) {
			var i = null, a = null;
			if (n = n.firstBaseUpdate, n !== null) {
				do {
					var o = {
						lane: n.lane,
						tag: n.tag,
						payload: n.payload,
						callback: null,
						next: null
					};
					a === null ? i = a = o : a = a.next = o, n = n.next;
				} while (n !== null);
				a === null ? i = a = t : a = a.next = t;
			} else i = a = t;
			n = {
				baseState: r.baseState,
				firstBaseUpdate: i,
				lastBaseUpdate: a,
				shared: r.shared,
				callbacks: r.callbacks
			}, e.updateQueue = n;
			return;
		}
		e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
	}
	var za = !1;
	function Ba() {
		if (za) {
			var e = aa;
			if (e !== null) throw e;
		}
	}
	function Va(e, t, n, r) {
		za = !1;
		var i = e.updateQueue;
		Ma = !1;
		var a = i.firstBaseUpdate, o = i.lastBaseUpdate, s = i.shared.pending;
		if (s !== null) {
			i.shared.pending = null;
			var c = s, l = c.next;
			c.next = null, o === null ? a = l : o.next = l, o = c;
			var u = e.alternate;
			u !== null && (u = u.updateQueue, s = u.lastBaseUpdate, s !== o && (s === null ? u.firstBaseUpdate = l : s.next = l, u.lastBaseUpdate = c));
		}
		if (a !== null) {
			var d = i.baseState;
			o = 0, u = l = c = null, s = a;
			do {
				var p = s.lane & -536870913, m = p !== s.lane;
				if (m ? (Z & p) === p : (r & p) === p) {
					p !== 0 && p === ia && (za = !0), u !== null && (u = u.next = {
						lane: 0,
						tag: s.tag,
						payload: s.payload,
						callback: null,
						next: null
					});
					a: {
						var h = e, g = s;
						p = t;
						var _ = n;
						switch (g.tag) {
							case 1:
								if (h = g.payload, typeof h == "function") {
									d = h.call(_, d, p);
									break a;
								}
								d = h;
								break a;
							case 3: h.flags = h.flags & -65537 | 128;
							case 0:
								if (h = g.payload, p = typeof h == "function" ? h.call(_, d, p) : h, p == null) break a;
								d = f({}, d, p);
								break a;
							case 2: Ma = !0;
						}
					}
					p = s.callback, p !== null && (e.flags |= 64, m && (e.flags |= 8192), m = i.callbacks, m === null ? i.callbacks = [p] : m.push(p));
				} else m = {
					lane: p,
					tag: s.tag,
					payload: s.payload,
					callback: s.callback,
					next: null
				}, u === null ? (l = u = m, c = d) : u = u.next = m, o |= p;
				if (s = s.next, s === null) {
					if (s = i.shared.pending, s === null) break;
					m = s, s = m.next, m.next = null, i.lastBaseUpdate = m, i.shared.pending = null;
				}
			} while (1);
			u === null && (c = d), i.baseState = c, i.firstBaseUpdate = l, i.lastBaseUpdate = u, a === null && (i.shared.lanes = 0), Ul |= o, e.lanes = o, e.memoizedState = d;
		}
	}
	function Ha(e, t) {
		if (typeof e != "function") throw Error(i(191, e));
		e.call(t);
	}
	function Ua(e, t) {
		var n = e.callbacks;
		if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) Ha(n[e], t);
	}
	var Wa = F(null), Ga = F(0);
	function Ka(e, t) {
		e = Vl, L(Ga, e), L(Wa, t), Vl = e | t.baseLanes;
	}
	function qa() {
		L(Ga, Vl), L(Wa, Wa.current);
	}
	function Ja() {
		Vl = Ga.current, I(Wa), I(Ga);
	}
	var Ya = F(null), Xa = null;
	function Za(e) {
		var t = e.alternate;
		L(no, no.current & 1), L(Ya, e), Xa === null && (t === null || Wa.current !== null || t.memoizedState !== null) && (Xa = e);
	}
	function Qa(e) {
		L(no, no.current), L(Ya, e), Xa === null && (Xa = e);
	}
	function $a(e) {
		e.tag === 22 ? (L(no, no.current), L(Ya, e), Xa === null && (Xa = e)) : eo(e);
	}
	function eo() {
		L(no, no.current), L(Ya, Ya.current);
	}
	function to(e) {
		I(Ya), Xa === e && (Xa = null), I(no);
	}
	var no = F(0);
	function ro(e) {
		for (var t = e; t !== null;) {
			if (t.tag === 13) {
				var n = t.memoizedState;
				if (n !== null && (n = n.dehydrated, n === null || af(n) || of(n))) return t;
			} else if (t.tag === 19 && (t.memoizedProps.revealOrder === "forwards" || t.memoizedProps.revealOrder === "backwards" || t.memoizedProps.revealOrder === "unstable_legacy-backwards" || t.memoizedProps.revealOrder === "together")) {
				if (t.flags & 128) return t;
			} else if (t.child !== null) {
				t.child.return = t, t = t.child;
				continue;
			}
			if (t === e) break;
			for (; t.sibling === null;) {
				if (t.return === null || t.return === e) return null;
				t = t.return;
			}
			t.sibling.return = t.return, t = t.sibling;
		}
		return null;
	}
	var io = 0, q = null, ao = null, oo = null, so = !1, co = !1, lo = !1, uo = 0, fo = 0, po = null, mo = 0;
	function ho() {
		throw Error(i(321));
	}
	function go(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!mr(e[n], t[n])) return !1;
		return !0;
	}
	function _o(e, t, n, r, i, a) {
		return io = a, q = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, N.H = e === null || e.memoizedState === null ? Ps : Fs, lo = !1, a = n(r, i), lo = !1, co && (a = yo(t, n, r, i)), vo(e), a;
	}
	function vo(e) {
		N.H = Ns;
		var t = ao !== null && ao.next !== null;
		if (io = 0, oo = ao = q = null, so = !1, fo = 0, po = null, t) throw Error(i(300));
		e === null || Qs || (e = e.dependencies, e !== null && Gi(e) && (Qs = !0));
	}
	function yo(e, t, n, r) {
		q = e;
		var a = 0;
		do {
			if (co && (po = null), fo = 0, co = !1, 25 <= a) throw Error(i(301));
			if (a += 1, oo = ao = null, e.updateQueue != null) {
				var o = e.updateQueue;
				o.lastEffect = null, o.events = null, o.stores = null, o.memoCache != null && (o.memoCache.index = 0);
			}
			N.H = Is, o = t(n, r);
		} while (co);
		return o;
	}
	function bo() {
		var e = N.H, t = e.useState()[0];
		return t = typeof t.then == "function" ? Do(t) : t, e = e.useState()[0], (ao === null ? null : ao.memoizedState) !== e && (q.flags |= 1024), t;
	}
	function xo() {
		var e = uo !== 0;
		return uo = 0, e;
	}
	function So(e, t, n) {
		t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~n;
	}
	function Co(e) {
		if (so) {
			for (e = e.memoizedState; e !== null;) {
				var t = e.queue;
				t !== null && (t.pending = null), e = e.next;
			}
			so = !1;
		}
		io = 0, oo = ao = q = null, co = !1, fo = uo = 0, po = null;
	}
	function wo() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return oo === null ? q.memoizedState = oo = e : oo = oo.next = e, oo;
	}
	function To() {
		if (ao === null) {
			var e = q.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = ao.next;
		var t = oo === null ? q.memoizedState : oo.next;
		if (t !== null) oo = t, ao = e;
		else {
			if (e === null) throw q.alternate === null ? Error(i(467)) : Error(i(310));
			ao = e, e = {
				memoizedState: ao.memoizedState,
				baseState: ao.baseState,
				baseQueue: ao.baseQueue,
				queue: ao.queue,
				next: null
			}, oo === null ? q.memoizedState = oo = e : oo = oo.next = e;
		}
		return oo;
	}
	function Eo() {
		return {
			lastEffect: null,
			events: null,
			stores: null,
			memoCache: null
		};
	}
	function Do(e) {
		var t = fo;
		return fo += 1, po === null && (po = []), e = ya(po, e, t), t = q, (oo === null ? t.memoizedState : oo.next) === null && (t = t.alternate, N.H = t === null || t.memoizedState === null ? Ps : Fs), e;
	}
	function Oo(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return Do(e);
			if (e.$$typeof === b) return qi(e);
		}
		throw Error(i(438, String(e)));
	}
	function ko(e) {
		var t = null, n = q.updateQueue;
		if (n !== null && (t = n.memoCache), t == null) {
			var r = q.alternate;
			r !== null && (r = r.updateQueue, r !== null && (r = r.memoCache, r != null && (t = {
				data: r.data.map(function(e) {
					return e.slice();
				}),
				index: 0
			})));
		}
		if (t ??= {
			data: [],
			index: 0
		}, n === null && (n = Eo(), q.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = D;
		return t.index++, n;
	}
	function Ao(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function jo(e) {
		return Mo(To(), ao, e);
	}
	function Mo(e, t, n) {
		var r = e.queue;
		if (r === null) throw Error(i(311));
		r.lastRenderedReducer = n;
		var a = e.baseQueue, o = r.pending;
		if (o !== null) {
			if (a !== null) {
				var s = a.next;
				a.next = o.next, o.next = s;
			}
			t.baseQueue = a = o, r.pending = null;
		}
		if (o = e.baseState, a === null) e.memoizedState = o;
		else {
			t = a.next;
			var c = s = null, l = null, u = t, d = !1;
			do {
				var f = u.lane & -536870913;
				if (f === u.lane ? (io & f) === f : (Z & f) === f) {
					var p = u.revertLane;
					if (p === 0) l !== null && (l = l.next = {
						lane: 0,
						revertLane: 0,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}), f === ia && (d = !0);
					else if ((io & p) === p) {
						u = u.next, p === ia && (d = !0);
						continue;
					} else f = {
						lane: 0,
						revertLane: u.revertLane,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}, l === null ? (c = l = f, s = o) : l = l.next = f, q.lanes |= p, Ul |= p;
					f = u.action, lo && n(o, f), o = u.hasEagerState ? u.eagerState : n(o, f);
				} else p = {
					lane: f,
					revertLane: u.revertLane,
					gesture: u.gesture,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}, l === null ? (c = l = p, s = o) : l = l.next = p, q.lanes |= f, Ul |= f;
				u = u.next;
			} while (u !== null && u !== t);
			if (l === null ? s = o : l.next = c, !mr(o, e.memoizedState) && (Qs = !0, d && (n = aa, n !== null))) throw n;
			e.memoizedState = o, e.baseState = s, e.baseQueue = l, r.lastRenderedState = o;
		}
		return a === null && (r.lanes = 0), [e.memoizedState, r.dispatch];
	}
	function No(e) {
		var t = To(), n = t.queue;
		if (n === null) throw Error(i(311));
		n.lastRenderedReducer = e;
		var r = n.dispatch, a = n.pending, o = t.memoizedState;
		if (a !== null) {
			n.pending = null;
			var s = a = a.next;
			do
				o = e(o, s.action), s = s.next;
			while (s !== a);
			mr(o, t.memoizedState) || (Qs = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function Po(e, t, n) {
		var r = q, a = To(), o = K;
		if (o) {
			if (n === void 0) throw Error(i(407));
			n = n();
		} else n = t();
		var s = !mr((ao || a).memoizedState, n);
		if (s && (a.memoizedState = n, Qs = !0), a = a.queue, as(Lo.bind(null, r, a, e), [e]), a.getSnapshot !== t || s || oo !== null && oo.memoizedState.tag & 1) {
			if (r.flags |= 2048, es(9, { destroy: void 0 }, Io.bind(null, r, a, n, t), null), Fl === null) throw Error(i(349));
			o || io & 127 || Fo(r, t, n);
		}
		return n;
	}
	function Fo(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = q.updateQueue, t === null ? (t = Eo(), q.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function Io(e, t, n, r) {
		t.value = n, t.getSnapshot = r, Ro(t) && zo(e);
	}
	function Lo(e, t, n) {
		return n(function() {
			Ro(t) && zo(e);
		});
	}
	function Ro(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !mr(e, n);
		} catch {
			return !0;
		}
	}
	function zo(e) {
		var t = Yr(e, 2);
		t !== null && pu(t, e, 2);
	}
	function Bo(e) {
		var t = wo();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), lo) {
				Ne(!0);
				try {
					n();
				} finally {
					Ne(!1);
				}
			}
		}
		return t.memoizedState = t.baseState = e, t.queue = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: Ao,
			lastRenderedState: e
		}, t;
	}
	function Vo(e, t, n, r) {
		return e.baseState = n, Mo(e, ao, typeof r == "function" ? r : Ao);
	}
	function Ho(e, t, n, r, a) {
		if (As(e)) throw Error(i(485));
		if (e = t.action, e !== null) {
			var o = {
				payload: a,
				action: e,
				next: null,
				isTransition: !0,
				status: "pending",
				value: null,
				reason: null,
				listeners: [],
				then: function(e) {
					o.listeners.push(e);
				}
			};
			N.T === null ? o.isTransition = !1 : n(!0), r(o), n = t.pending, n === null ? (o.next = t.pending = o, Uo(t, o)) : (o.next = n.next, t.pending = n.next = o);
		}
	}
	function Uo(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = N.T, o = {};
			N.T = o;
			try {
				var s = n(i, r), c = N.S;
				c !== null && c(o, s), Wo(e, t, s);
			} catch (n) {
				Ko(e, t, n);
			} finally {
				a !== null && o.types !== null && (a.types = o.types), N.T = a;
			}
		} else try {
			a = n(i, r), Wo(e, t, a);
		} catch (n) {
			Ko(e, t, n);
		}
	}
	function Wo(e, t, n) {
		typeof n == "object" && n && typeof n.then == "function" ? n.then(function(n) {
			Go(e, t, n);
		}, function(n) {
			return Ko(e, t, n);
		}) : Go(e, t, n);
	}
	function Go(e, t, n) {
		t.status = "fulfilled", t.value = n, qo(t), e.state = n, t = e.pending, t !== null && (n = t.next, n === t ? e.pending = null : (n = n.next, t.next = n, Uo(e, n)));
	}
	function Ko(e, t, n) {
		var r = e.pending;
		if (e.pending = null, r !== null) {
			r = r.next;
			do
				t.status = "rejected", t.reason = n, qo(t), t = t.next;
			while (t !== r);
		}
		e.action = null;
	}
	function qo(e) {
		e = e.listeners;
		for (var t = 0; t < e.length; t++) (0, e[t])();
	}
	function Jo(e, t) {
		return t;
	}
	function Yo(e, t) {
		if (K) {
			var n = Fl.formState;
			if (n !== null) {
				a: {
					var r = q;
					if (K) {
						if (Ei) {
							b: {
								for (var i = Ei, a = Oi; i.nodeType !== 8;) {
									if (!a) {
										i = null;
										break b;
									}
									if (i = cf(i.nextSibling), i === null) {
										i = null;
										break b;
									}
								}
								a = i.data, i = a === "F!" || a === "F" ? i : null;
							}
							if (i) {
								Ei = cf(i.nextSibling), r = i.data === "F!";
								break a;
							}
						}
						Ai(r);
					}
					r = !1;
				}
				r && (t = n[0]);
			}
		}
		return n = wo(), n.memoizedState = n.baseState = t, r = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: Jo,
			lastRenderedState: t
		}, n.queue = r, n = Ds.bind(null, q, r), r.dispatch = n, r = Bo(!1), a = ks.bind(null, q, !1, r.queue), r = wo(), i = {
			state: t,
			dispatch: null,
			action: e,
			pending: null
		}, r.queue = i, n = Ho.bind(null, q, i, a, n), i.dispatch = n, r.memoizedState = e, [
			t,
			n,
			!1
		];
	}
	function Xo(e) {
		return Zo(To(), ao, e);
	}
	function Zo(e, t, n) {
		if (t = Mo(e, t, Jo)[0], e = jo(Ao)[0], typeof t == "object" && t && typeof t.then == "function") try {
			var r = Do(t);
		} catch (e) {
			throw e === ma ? ga : e;
		}
		else r = t;
		t = To();
		var i = t.queue, a = i.dispatch;
		return n !== t.memoizedState && (q.flags |= 2048, es(9, { destroy: void 0 }, Qo.bind(null, i, n), null)), [
			r,
			a,
			e
		];
	}
	function Qo(e, t) {
		e.action = t;
	}
	function $o(e) {
		var t = To(), n = ao;
		if (n !== null) return Zo(t, n, e);
		To(), t = t.memoizedState, n = To();
		var r = n.queue.dispatch;
		return n.memoizedState = e, [
			t,
			r,
			!1
		];
	}
	function es(e, t, n, r) {
		return e = {
			tag: e,
			create: n,
			deps: r,
			inst: t,
			next: null
		}, t = q.updateQueue, t === null && (t = Eo(), q.updateQueue = t), n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
	}
	function ts() {
		return To().memoizedState;
	}
	function ns(e, t, n, r) {
		var i = wo();
		q.flags |= e, i.memoizedState = es(1 | t, { destroy: void 0 }, n, r === void 0 ? null : r);
	}
	function rs(e, t, n, r) {
		var i = To();
		r = r === void 0 ? null : r;
		var a = i.memoizedState.inst;
		ao !== null && r !== null && go(r, ao.memoizedState.deps) ? i.memoizedState = es(t, a, n, r) : (q.flags |= e, i.memoizedState = es(1 | t, a, n, r));
	}
	function is(e, t) {
		ns(8390656, 8, e, t);
	}
	function as(e, t) {
		rs(2048, 8, e, t);
	}
	function os(e) {
		q.flags |= 4;
		var t = q.updateQueue;
		if (t === null) t = Eo(), q.updateQueue = t, t.events = [e];
		else {
			var n = t.events;
			n === null ? t.events = [e] : n.push(e);
		}
	}
	function ss(e) {
		var t = To().memoizedState;
		return os({
			ref: t,
			nextImpl: e
		}), function() {
			if (Y & 2) throw Error(i(440));
			return t.impl.apply(void 0, arguments);
		};
	}
	function cs(e, t) {
		return rs(4, 2, e, t);
	}
	function ls(e, t) {
		return rs(4, 4, e, t);
	}
	function us(e, t) {
		if (typeof t == "function") {
			e = e();
			var n = t(e);
			return function() {
				typeof n == "function" ? n() : t(null);
			};
		}
		if (t != null) return e = e(), t.current = e, function() {
			t.current = null;
		};
	}
	function ds(e, t, n) {
		n = n == null ? null : n.concat([e]), rs(4, 4, us.bind(null, t, e), n);
	}
	function fs() {}
	function ps(e, t) {
		var n = To();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return t !== null && go(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function ms(e, t) {
		var n = To();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		if (t !== null && go(t, r[1])) return r[0];
		if (r = e(), lo) {
			Ne(!0);
			try {
				e();
			} finally {
				Ne(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function hs(e, t, n) {
		return n === void 0 || io & 1073741824 && !(Z & 261930) ? e.memoizedState = t : (e.memoizedState = n, e = fu(), q.lanes |= e, Ul |= e, n);
	}
	function gs(e, t, n, r) {
		return mr(n, t) ? n : Wa.current === null ? !(io & 42) || io & 1073741824 && !(Z & 261930) ? (Qs = !0, e.memoizedState = n) : (e = fu(), q.lanes |= e, Ul |= e, t) : (e = hs(e, n, r), mr(e, t) || (Qs = !0), e);
	}
	function _s(e, t, n, r, i) {
		var a = P.p;
		P.p = a !== 0 && 8 > a ? a : 8;
		var o = N.T, s = {};
		N.T = s, ks(e, !1, t, n);
		try {
			var c = i(), l = N.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? Os(e, t, ca(c, r), du(e)) : Os(e, t, r, du(e));
		} catch (n) {
			Os(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, du());
		} finally {
			P.p = a, o !== null && s.types !== null && (o.types = s.types), N.T = o;
		}
	}
	function vs() {}
	function ys(e, t, n, r) {
		if (e.tag !== 5) throw Error(i(476));
		var a = bs(e).queue;
		_s(e, a, t, te, n === null ? vs : function() {
			return xs(e), n(r);
		});
	}
	function bs(e) {
		var t = e.memoizedState;
		if (t !== null) return t;
		t = {
			memoizedState: te,
			baseState: te,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: Ao,
				lastRenderedState: te
			},
			next: null
		};
		var n = {};
		return t.next = {
			memoizedState: n,
			baseState: n,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: Ao,
				lastRenderedState: n
			},
			next: null
		}, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
	}
	function xs(e) {
		var t = bs(e);
		t.next === null && (t = e.alternate.memoizedState), Os(e, t.next.queue, {}, du());
	}
	function Ss() {
		return qi(Qf);
	}
	function Cs() {
		return To().memoizedState;
	}
	function ws() {
		return To().memoizedState;
	}
	function Ts(e) {
		for (var t = e.return; t !== null;) {
			switch (t.tag) {
				case 24:
				case 3:
					var n = du();
					e = Fa(n);
					var r = Ia(t, e, n);
					r !== null && (pu(r, t, n), La(r, t, n)), t = { cache: ea() }, e.payload = t;
					return;
			}
			t = t.return;
		}
	}
	function Es(e, t, n) {
		var r = du();
		n = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, As(e) ? js(t, n) : (n = Jr(e, t, n, r), n !== null && (pu(n, e, r), Ms(n, t, r)));
	}
	function Ds(e, t, n) {
		Os(e, t, n, du());
	}
	function Os(e, t, n, r) {
		var i = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (As(e)) js(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, mr(s, o)) return qr(e, t, i, 0), Fl === null && Kr(), !1;
			} catch {}
			if (n = Jr(e, t, i, r), n !== null) return pu(n, e, r), Ms(n, t, r), !0;
		}
		return !1;
	}
	function ks(e, t, n, r) {
		if (r = {
			lane: 2,
			revertLane: ud(),
			gesture: null,
			action: r,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, As(e)) {
			if (t) throw Error(i(479));
		} else t = Jr(e, n, r, 2), t !== null && pu(t, e, 2);
	}
	function As(e) {
		var t = e.alternate;
		return e === q || t !== null && t === q;
	}
	function js(e, t) {
		co = so = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function Ms(e, t, n) {
		if (n & 4194048) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, Xe(e, n);
		}
	}
	var Ns = {
		readContext: qi,
		use: Oo,
		useCallback: ho,
		useContext: ho,
		useEffect: ho,
		useImperativeHandle: ho,
		useLayoutEffect: ho,
		useInsertionEffect: ho,
		useMemo: ho,
		useReducer: ho,
		useRef: ho,
		useState: ho,
		useDebugValue: ho,
		useDeferredValue: ho,
		useTransition: ho,
		useSyncExternalStore: ho,
		useId: ho,
		useHostTransitionStatus: ho,
		useFormState: ho,
		useActionState: ho,
		useOptimistic: ho,
		useMemoCache: ho,
		useCacheRefresh: ho
	};
	Ns.useEffectEvent = ho;
	var Ps = {
		readContext: qi,
		use: Oo,
		useCallback: function(e, t) {
			return wo().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: qi,
		useEffect: is,
		useImperativeHandle: function(e, t, n) {
			n = n == null ? null : n.concat([e]), ns(4194308, 4, us.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return ns(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			ns(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = wo();
			t = t === void 0 ? null : t;
			var r = e();
			if (lo) {
				Ne(!0);
				try {
					e();
				} finally {
					Ne(!1);
				}
			}
			return n.memoizedState = [r, t], r;
		},
		useReducer: function(e, t, n) {
			var r = wo();
			if (n !== void 0) {
				var i = n(t);
				if (lo) {
					Ne(!0);
					try {
						n(t);
					} finally {
						Ne(!1);
					}
				}
			} else i = t;
			return r.memoizedState = r.baseState = i, e = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: i
			}, r.queue = e, e = e.dispatch = Es.bind(null, q, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = wo();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: function(e) {
			e = Bo(e);
			var t = e.queue, n = Ds.bind(null, q, t);
			return t.dispatch = n, [e.memoizedState, n];
		},
		useDebugValue: fs,
		useDeferredValue: function(e, t) {
			return hs(wo(), e, t);
		},
		useTransition: function() {
			var e = Bo(!1);
			return e = _s.bind(null, q, e.queue, !0, !1), wo().memoizedState = e, [!1, e];
		},
		useSyncExternalStore: function(e, t, n) {
			var r = q, a = wo();
			if (K) {
				if (n === void 0) throw Error(i(407));
				n = n();
			} else {
				if (n = t(), Fl === null) throw Error(i(349));
				Z & 127 || Fo(r, t, n);
			}
			a.memoizedState = n;
			var o = {
				value: n,
				getSnapshot: t
			};
			return a.queue = o, is(Lo.bind(null, r, o, e), [e]), r.flags |= 2048, es(9, { destroy: void 0 }, Io.bind(null, r, o, n, t), null), n;
		},
		useId: function() {
			var e = wo(), t = Fl.identifierPrefix;
			if (K) {
				var n = yi, r = vi;
				n = (r & ~(1 << 32 - Pe(r) - 1)).toString(32) + n, t = "_" + t + "R_" + n, n = uo++, 0 < n && (t += "H" + n.toString(32)), t += "_";
			} else n = mo++, t = "_" + t + "r_" + n.toString(32) + "_";
			return e.memoizedState = t;
		},
		useHostTransitionStatus: Ss,
		useFormState: Yo,
		useActionState: Yo,
		useOptimistic: function(e) {
			var t = wo();
			t.memoizedState = t.baseState = e;
			var n = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: null,
				lastRenderedState: null
			};
			return t.queue = n, t = ks.bind(null, q, !0, n), n.dispatch = t, [e, t];
		},
		useMemoCache: ko,
		useCacheRefresh: function() {
			return wo().memoizedState = Ts.bind(null, q);
		},
		useEffectEvent: function(e) {
			var t = wo(), n = { impl: e };
			return t.memoizedState = n, function() {
				if (Y & 2) throw Error(i(440));
				return n.impl.apply(void 0, arguments);
			};
		}
	}, Fs = {
		readContext: qi,
		use: Oo,
		useCallback: ps,
		useContext: qi,
		useEffect: as,
		useImperativeHandle: ds,
		useInsertionEffect: cs,
		useLayoutEffect: ls,
		useMemo: ms,
		useReducer: jo,
		useRef: ts,
		useState: function() {
			return jo(Ao);
		},
		useDebugValue: fs,
		useDeferredValue: function(e, t) {
			return gs(To(), ao.memoizedState, e, t);
		},
		useTransition: function() {
			var e = jo(Ao)[0], t = To().memoizedState;
			return [typeof e == "boolean" ? e : Do(e), t];
		},
		useSyncExternalStore: Po,
		useId: Cs,
		useHostTransitionStatus: Ss,
		useFormState: Xo,
		useActionState: Xo,
		useOptimistic: function(e, t) {
			return Vo(To(), ao, e, t);
		},
		useMemoCache: ko,
		useCacheRefresh: ws
	};
	Fs.useEffectEvent = ss;
	var Is = {
		readContext: qi,
		use: Oo,
		useCallback: ps,
		useContext: qi,
		useEffect: as,
		useImperativeHandle: ds,
		useInsertionEffect: cs,
		useLayoutEffect: ls,
		useMemo: ms,
		useReducer: No,
		useRef: ts,
		useState: function() {
			return No(Ao);
		},
		useDebugValue: fs,
		useDeferredValue: function(e, t) {
			var n = To();
			return ao === null ? hs(n, e, t) : gs(n, ao.memoizedState, e, t);
		},
		useTransition: function() {
			var e = No(Ao)[0], t = To().memoizedState;
			return [typeof e == "boolean" ? e : Do(e), t];
		},
		useSyncExternalStore: Po,
		useId: Cs,
		useHostTransitionStatus: Ss,
		useFormState: $o,
		useActionState: $o,
		useOptimistic: function(e, t) {
			var n = To();
			return ao === null ? (n.baseState = e, [e, n.queue.dispatch]) : Vo(n, ao, e, t);
		},
		useMemoCache: ko,
		useCacheRefresh: ws
	};
	Is.useEffectEvent = ss;
	function Ls(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : f({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var Rs = {
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = du(), i = Fa(r);
			i.payload = t, n != null && (i.callback = n), t = Ia(e, i, r), t !== null && (pu(t, e, r), La(t, e, r));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = du(), i = Fa(r);
			i.tag = 1, i.payload = t, n != null && (i.callback = n), t = Ia(e, i, r), t !== null && (pu(t, e, r), La(t, e, r));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = du(), r = Fa(n);
			r.tag = 2, t != null && (r.callback = t), t = Ia(e, r, n), t !== null && (pu(t, e, n), La(t, e, n));
		}
	};
	function zs(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !hr(n, r) || !hr(i, a) : !0;
	}
	function Bs(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Rs.enqueueReplaceState(t, t.state, null);
	}
	function Vs(e, t) {
		var n = t;
		if ("ref" in t) for (var r in n = {}, t) r !== "ref" && (n[r] = t[r]);
		if (e = e.defaultProps) for (var i in n === t && (n = f({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
		return n;
	}
	function Hs(e) {
		Hr(e);
	}
	function Us(e) {
		console.error(e);
	}
	function Ws(e) {
		Hr(e);
	}
	function Gs(e, t) {
		try {
			var n = e.onUncaughtError;
			n(t.value, { componentStack: t.stack });
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function Ks(e, t, n) {
		try {
			var r = e.onCaughtError;
			r(n.value, {
				componentStack: n.stack,
				errorBoundary: t.tag === 1 ? t.stateNode : null
			});
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function qs(e, t, n) {
		return n = Fa(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
			Gs(e, t);
		}, n;
	}
	function Js(e) {
		return e = Fa(e), e.tag = 3, e;
	}
	function Ys(e, t, n, r) {
		var i = n.type.getDerivedStateFromError;
		if (typeof i == "function") {
			var a = r.value;
			e.payload = function() {
				return i(a);
			}, e.callback = function() {
				Ks(t, n, r);
			};
		}
		var o = n.stateNode;
		o !== null && typeof o.componentDidCatch == "function" && (e.callback = function() {
			Ks(t, n, r), typeof i != "function" && (tu === null ? tu = /* @__PURE__ */ new Set([this]) : tu.add(this));
			var e = r.stack;
			this.componentDidCatch(r.value, { componentStack: e === null ? "" : e });
		});
	}
	function Xs(e, t, n, r, a) {
		if (n.flags |= 32768, typeof r == "object" && r && typeof r.then == "function") {
			if (t = n.alternate, t !== null && Wi(t, n, a, !0), n = Ya.current, n !== null) {
				switch (n.tag) {
					case 31:
					case 13: return Xa === null ? Tu() : n.alternate === null && Hl === 0 && (Hl = 3), n.flags &= -257, n.flags |= 65536, n.lanes = a, r === _a ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = /* @__PURE__ */ new Set([r]) : t.add(r), Wu(e, r, a)), !1;
					case 22: return n.flags |= 65536, r === _a ? n.flags |= 16384 : (t = n.updateQueue, t === null ? (t = {
						transitions: null,
						markerInstances: null,
						retryQueue: /* @__PURE__ */ new Set([r])
					}, n.updateQueue = t) : (n = t.retryQueue, n === null ? t.retryQueue = /* @__PURE__ */ new Set([r]) : n.add(r)), Wu(e, r, a)), !1;
				}
				throw Error(i(435, n.tag));
			}
			return Wu(e, r, a), Tu(), !1;
		}
		if (K) return t = Ya.current, t === null ? (r !== ki && (t = Error(i(423), { cause: r }), Ii(ui(t, n))), e = e.current.alternate, e.flags |= 65536, a &= -a, e.lanes |= a, r = ui(r, n), a = qs(e.stateNode, r, a), Ra(e, a), Hl !== 4 && (Hl = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = a, r !== ki && (e = Error(i(422), { cause: r }), Ii(ui(e, n)))), !1;
		var o = Error(i(520), { cause: r });
		if (o = ui(o, n), Jl === null ? Jl = [o] : Jl.push(o), Hl !== 4 && (Hl = 2), t === null) return !0;
		r = ui(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = a & -a, n.lanes |= e, e = qs(n.stateNode, r, e), Ra(n, e), !1;
				case 1: if (t = n.type, o = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || o !== null && typeof o.componentDidCatch == "function" && (tu === null || !tu.has(o)))) return n.flags |= 65536, a &= -a, n.lanes |= a, a = Js(a), Ys(a, e, n, r), Ra(n, a), !1;
			}
			n = n.return;
		} while (n !== null);
		return !1;
	}
	var Zs = Error(i(461)), Qs = !1;
	function $s(e, t, n, r) {
		t.child = e === null ? ja(t, null, n, r) : Aa(t, e.child, n, r);
	}
	function ec(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		if ("ref" in r) {
			var o = {};
			for (var s in r) s !== "ref" && (o[s] = r[s]);
		} else o = r;
		return Ki(t), r = _o(e, t, n, o, a, i), s = xo(), e !== null && !Qs ? (So(e, t, i), Cc(e, t, i)) : (K && s && Si(t), t.flags |= 1, $s(e, t, r, i), t.child);
	}
	function tc(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !ti(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, nc(e, t, a, r, i)) : (e = ii(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !wc(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? hr : n, n(o, r) && e.ref === t.ref) return Cc(e, t, i);
		}
		return t.flags |= 1, e = ni(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function nc(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (hr(a, r) && e.ref === t.ref) if (Qs = !1, t.pendingProps = r = a, wc(e, i)) e.flags & 131072 && (Qs = !0);
			else return t.lanes = e.lanes, Cc(e, t, i);
		}
		return uc(e, t, n, r, i);
	}
	function rc(e, t, n, r) {
		var i = r.children, a = e === null ? null : e.memoizedState;
		if (e === null && t.stateNode === null && (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), r.mode === "hidden") {
			if (t.flags & 128) {
				if (a = a === null ? n : a.baseLanes | n, e !== null) {
					for (r = t.child = e.child, i = 0; r !== null;) i = i | r.lanes | r.childLanes, r = r.sibling;
					r = i & ~a;
				} else r = 0, t.child = null;
				return ac(e, t, a, n, r);
			}
			if (n & 536870912) t.memoizedState = {
				baseLanes: 0,
				cachePool: null
			}, e !== null && fa(t, a === null ? null : a.cachePool), a === null ? qa() : Ka(t, a), $a(t);
			else return r = t.lanes = 536870912, ac(e, t, a === null ? n : a.baseLanes | n, n, r);
		} else a === null ? (e !== null && fa(t, null), qa(), eo(t)) : (fa(t, a.cachePool), Ka(t, a), eo(t), t.memoizedState = null);
		return $s(e, t, i, n), t.child;
	}
	function ic(e, t) {
		return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), t.sibling;
	}
	function ac(e, t, n, r, i) {
		var a = da();
		return a = a === null ? null : {
			parent: $i._currentValue,
			pool: a
		}, t.memoizedState = {
			baseLanes: n,
			cachePool: a
		}, e !== null && fa(t, null), qa(), $a(t), e !== null && Wi(e, t, r, !0), t.childLanes = i, null;
	}
	function oc(e, t) {
		return t = vc({
			mode: t.mode,
			children: t.children
		}, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
	}
	function sc(e, t, n) {
		return Aa(t, e.child, null, n), e = oc(t, t.pendingProps), e.flags |= 2, to(t), t.memoizedState = null, e;
	}
	function cc(e, t, n) {
		var r = t.pendingProps, a = !!(t.flags & 128);
		if (t.flags &= -129, e === null) {
			if (K) {
				if (r.mode === "hidden") return e = oc(t, r), t.lanes = 536870912, ic(null, e);
				if (Qa(t), (e = Ei) ? (e = rf(e, Oi), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: _i === null ? null : {
						id: vi,
						overflow: yi
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = si(e), n.return = t, t.child = n, Ti = t, Ei = null)) : e = null, e === null) throw Ai(t);
				return t.lanes = 536870912, null;
			}
			return oc(t, r);
		}
		var o = e.memoizedState;
		if (o !== null) {
			var s = o.dehydrated;
			if (Qa(t), a) if (t.flags & 256) t.flags &= -257, t = sc(e, t, n);
			else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
			else throw Error(i(558));
			else if (Qs || Wi(e, t, n, !1), a = (n & e.childLanes) !== 0, Qs || a) {
				if (r = Fl, r !== null && (s = Ze(r, n), s !== 0 && s !== o.retryLane)) throw o.retryLane = s, Yr(e, s), pu(r, e, s), Zs;
				Tu(), t = sc(e, t, n);
			} else e = o.treeContext, Ei = cf(s.nextSibling), Ti = t, K = !0, Di = null, Oi = !1, e !== null && wi(t, e), t = oc(t, r), t.flags |= 4096;
			return t;
		}
		return e = ni(e.child, {
			mode: r.mode,
			children: r.children
		}), e.ref = t.ref, t.child = e, e.return = t, e;
	}
	function lc(e, t) {
		var n = t.ref;
		if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
		else {
			if (typeof n != "function" && typeof n != "object") throw Error(i(284));
			(e === null || e.ref !== n) && (t.flags |= 4194816);
		}
	}
	function uc(e, t, n, r, i) {
		return Ki(t), n = _o(e, t, n, r, void 0, i), r = xo(), e !== null && !Qs ? (So(e, t, i), Cc(e, t, i)) : (K && r && Si(t), t.flags |= 1, $s(e, t, n, i), t.child);
	}
	function dc(e, t, n, r, i, a) {
		return Ki(t), t.updateQueue = null, n = yo(t, r, n, i), vo(e), r = xo(), e !== null && !Qs ? (So(e, t, a), Cc(e, t, a)) : (K && r && Si(t), t.flags |= 1, $s(e, t, n, a), t.child);
	}
	function fc(e, t, n, r, i) {
		if (Ki(t), t.stateNode === null) {
			var a = Qr, o = n.contextType;
			typeof o == "object" && o && (a = qi(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = Rs, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, Na(t), o = n.contextType, a.context = typeof o == "object" && o ? qi(o) : Qr, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (Ls(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && Rs.enqueueReplaceState(a, a.state, null), Va(t, r, a, i), Ba(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = Vs(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = Qr, typeof u == "object" && u && (o = qi(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && Bs(t, a, r, o), Ma = !1;
			var f = t.memoizedState;
			a.state = f, Va(t, r, a, i), Ba(), l = t.memoizedState, s || f !== l || Ma ? (typeof d == "function" && (Ls(t, n, d, r), l = t.memoizedState), (c = Ma || zs(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, Pa(e, t), o = t.memoizedProps, u = Vs(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = Qr, typeof l == "object" && l && (c = qi(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && Bs(t, a, r, c), Ma = !1, f = t.memoizedState, a.state = f, Va(t, r, a, i), Ba();
			var p = t.memoizedState;
			o !== d || f !== p || Ma || e !== null && e.dependencies !== null && Gi(e.dependencies) ? (typeof s == "function" && (Ls(t, n, s, r), p = t.memoizedState), (u = Ma || zs(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && Gi(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, lc(e, t), r = !!(t.flags & 128), a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = Aa(t, e.child, null, i), t.child = Aa(t, null, n, i)) : $s(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = Cc(e, t, i), e;
	}
	function pc(e, t, n, r) {
		return Pi(), t.flags |= 256, $s(e, t, n, r), t.child;
	}
	var mc = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0,
		hydrationErrors: null
	};
	function hc(e) {
		return {
			baseLanes: e,
			cachePool: pa()
		};
	}
	function gc(e, t, n) {
		return e = e === null ? 0 : e.childLanes & ~n, t && (e |= Kl), e;
	}
	function _c(e, t, n) {
		var r = t.pendingProps, a = !1, o = !!(t.flags & 128), s;
		if ((s = o) || (s = e !== null && e.memoizedState === null ? !1 : !!(no.current & 2)), s && (a = !0, t.flags &= -129), s = !!(t.flags & 32), t.flags &= -33, e === null) {
			if (K) {
				if (a ? Za(t) : eo(t), (e = Ei) ? (e = rf(e, Oi), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: _i === null ? null : {
						id: vi,
						overflow: yi
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = si(e), n.return = t, t.child = n, Ti = t, Ei = null)) : e = null, e === null) throw Ai(t);
				return of(e) ? t.lanes = 32 : t.lanes = 536870912, null;
			}
			var c = r.children;
			return r = r.fallback, a ? (eo(t), a = t.mode, c = vc({
				mode: "hidden",
				children: c
			}, a), r = ai(r, a, n, null), c.return = t, r.return = t, c.sibling = r, t.child = c, r = t.child, r.memoizedState = hc(n), r.childLanes = gc(e, s, n), t.memoizedState = mc, ic(null, r)) : (Za(t), J(t, c));
		}
		var l = e.memoizedState;
		if (l !== null && (c = l.dehydrated, c !== null)) {
			if (o) t.flags & 256 ? (Za(t), t.flags &= -257, t = yc(e, t, n)) : t.memoizedState === null ? (eo(t), c = r.fallback, a = t.mode, r = vc({
				mode: "visible",
				children: r.children
			}, a), c = ai(c, a, n, null), c.flags |= 2, r.return = t, c.return = t, r.sibling = c, t.child = r, Aa(t, e.child, null, n), r = t.child, r.memoizedState = hc(n), r.childLanes = gc(e, s, n), t.memoizedState = mc, t = ic(null, r)) : (eo(t), t.child = e.child, t.flags |= 128, t = null);
			else if (Za(t), of(c)) {
				if (s = c.nextSibling && c.nextSibling.dataset, s) var u = s.dgst;
				s = u, r = Error(i(419)), r.stack = "", r.digest = s, Ii({
					value: r,
					source: null,
					stack: null
				}), t = yc(e, t, n);
			} else if (Qs || Wi(e, t, n, !1), s = (n & e.childLanes) !== 0, Qs || s) {
				if (s = Fl, s !== null && (r = Ze(s, n), r !== 0 && r !== l.retryLane)) throw l.retryLane = r, Yr(e, r), pu(s, e, r), Zs;
				af(c) || Tu(), t = yc(e, t, n);
			} else af(c) ? (t.flags |= 192, t.child = e.child, t = null) : (e = l.treeContext, Ei = cf(c.nextSibling), Ti = t, K = !0, Di = null, Oi = !1, e !== null && wi(t, e), t = J(t, r.children), t.flags |= 4096);
			return t;
		}
		return a ? (eo(t), c = r.fallback, a = t.mode, l = e.child, u = l.sibling, r = ni(l, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = l.subtreeFlags & 65011712, u === null ? (c = ai(c, a, n, null), c.flags |= 2) : c = ni(u, c), c.return = t, r.return = t, r.sibling = c, t.child = r, ic(null, r), r = t.child, c = e.child.memoizedState, c === null ? c = hc(n) : (a = c.cachePool, a === null ? a = pa() : (l = $i._currentValue, a = a.parent === l ? a : {
			parent: l,
			pool: l
		}), c = {
			baseLanes: c.baseLanes | n,
			cachePool: a
		}), r.memoizedState = c, r.childLanes = gc(e, s, n), t.memoizedState = mc, ic(e.child, r)) : (Za(t), n = e.child, e = n.sibling, n = ni(n, {
			mode: "visible",
			children: r.children
		}), n.return = t, n.sibling = null, e !== null && (s = t.deletions, s === null ? (t.deletions = [e], t.flags |= 16) : s.push(e)), t.child = n, t.memoizedState = null, n);
	}
	function J(e, t) {
		return t = vc({
			mode: "visible",
			children: t
		}, e.mode), t.return = e, e.child = t;
	}
	function vc(e, t) {
		return e = ei(22, e, null, t), e.lanes = 0, e;
	}
	function yc(e, t, n) {
		return Aa(t, e.child, null, n), e = J(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function bc(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), Hi(e.return, t, n);
	}
	function xc(e, t, n, r, i, a) {
		var o = e.memoizedState;
		o === null ? e.memoizedState = {
			isBackwards: t,
			rendering: null,
			renderingStartTime: 0,
			last: r,
			tail: n,
			tailMode: i,
			treeForkCount: a
		} : (o.isBackwards = t, o.rendering = null, o.renderingStartTime = 0, o.last = r, o.tail = n, o.tailMode = i, o.treeForkCount = a);
	}
	function Sc(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		r = r.children;
		var o = no.current, s = !!(o & 2);
		if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, L(no, o), $s(e, t, r, n), r = K ? mi : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
			if (e.tag === 13) e.memoizedState !== null && bc(e, n, t);
			else if (e.tag === 19) bc(e, n, t);
			else if (e.child !== null) {
				e.child.return = e, e = e.child;
				continue;
			}
			if (e === t) break a;
			for (; e.sibling === null;) {
				if (e.return === null || e.return === t) break a;
				e = e.return;
			}
			e.sibling.return = e.return, e = e.sibling;
		}
		switch (i) {
			case "forwards":
				for (n = t.child, i = null; n !== null;) e = n.alternate, e !== null && ro(e) === null && (i = n), n = n.sibling;
				n = i, n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), xc(t, !1, i, n, a, r);
				break;
			case "backwards":
			case "unstable_legacy-backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && ro(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				xc(t, !0, n, null, a, r);
				break;
			case "together":
				xc(t, !1, null, null, void 0, r);
				break;
			default: t.memoizedState = null;
		}
		return t.child;
	}
	function Cc(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), Ul |= t.lanes, (n & t.childLanes) === 0) if (e !== null) {
			if (Wi(e, t, n, !1), (n & t.childLanes) === 0) return null;
		} else return null;
		if (e !== null && t.child !== e.child) throw Error(i(153));
		if (t.child !== null) {
			for (e = t.child, n = ni(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = ni(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function wc(e, t) {
		return (e.lanes & t) !== 0 || (e = e.dependencies, !!(e !== null && Gi(e)));
	}
	function Tc(e, t, n) {
		switch (t.tag) {
			case 3:
				ce(t, t.stateNode.containerInfo), Bi(t, $i, e.memoizedState.cache), Pi();
				break;
			case 27:
			case 5:
				ue(t);
				break;
			case 4:
				ce(t, t.stateNode.containerInfo);
				break;
			case 10:
				Bi(t, t.type, t.memoizedProps.value);
				break;
			case 31:
				if (t.memoizedState !== null) return t.flags |= 128, Qa(t), null;
				break;
			case 13:
				var r = t.memoizedState;
				if (r !== null) return r.dehydrated === null ? (n & t.child.childLanes) === 0 ? (Za(t), e = Cc(e, t, n), e === null ? null : e.sibling) : _c(e, t, n) : (Za(t), t.flags |= 128, null);
				Za(t);
				break;
			case 19:
				var i = !!(e.flags & 128);
				if (r = (n & t.childLanes) !== 0, r ||= (Wi(e, t, n, !1), (n & t.childLanes) !== 0), i) {
					if (r) return Sc(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), L(no, no.current), r) break;
				return null;
			case 22: return t.lanes = 0, rc(e, t, n, t.pendingProps);
			case 24: Bi(t, $i, e.memoizedState.cache);
		}
		return Cc(e, t, n);
	}
	function Ec(e, t, n) {
		if (e !== null) if (e.memoizedProps !== t.pendingProps) Qs = !0;
		else {
			if (!wc(e, n) && !(t.flags & 128)) return Qs = !1, Tc(e, t, n);
			Qs = !!(e.flags & 131072);
		}
		else Qs = !1, K && t.flags & 1048576 && xi(t, mi, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					var r = t.pendingProps;
					if (e = ba(t.elementType), t.type = e, typeof e == "function") ti(e) ? (r = Vs(e, r), t.tag = 1, t = fc(null, t, e, r, n)) : (t.tag = 0, t = uc(null, t, e, r, n));
					else {
						if (e != null) {
							var a = e.$$typeof;
							if (a === x) {
								t.tag = 11, t = ec(null, t, e, r, n);
								break a;
							}
							if (a === T) {
								t.tag = 14, t = tc(null, t, e, r, n);
								break a;
							}
						}
						throw t = j(e) || e, Error(i(306, t, ""));
					}
				}
				return t;
			case 0: return uc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, a = Vs(r, t.pendingProps), fc(e, t, r, a, n);
			case 3:
				a: {
					if (ce(t, t.stateNode.containerInfo), e === null) throw Error(i(387));
					r = t.pendingProps;
					var o = t.memoizedState;
					a = o.element, Pa(e, t), Va(t, r, null, n);
					var s = t.memoizedState;
					if (r = s.cache, Bi(t, $i, r), r !== o.cache && Ui(t, [$i], n, !0), Ba(), r = s.element, o.isDehydrated) if (o = {
						element: r,
						isDehydrated: !1,
						cache: s.cache
					}, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
						t = pc(e, t, r, n);
						break a;
					} else if (r !== a) {
						a = ui(Error(i(424)), t), Ii(a), t = pc(e, t, r, n);
						break a;
					} else {
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (Ei = cf(e.firstChild), Ti = t, K = !0, Di = null, Oi = !0, n = ja(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 4096, n = n.sibling;
					}
					else {
						if (Pi(), r === a) {
							t = Cc(e, t, n);
							break a;
						}
						$s(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return lc(e, t), e === null ? (n = kf(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : K || (n = t.type, e = t.pendingProps, r = Bd(oe.current).createElement(n), r[rt] = t, r[it] = e, Pd(r, n, e), gt(r), t.stateNode = r) : t.memoizedState = kf(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return ue(t), e === null && K && (r = t.stateNode = ff(t.type, t.pendingProps, oe.current), Ti = t, Oi = !0, a = Ei, Xd(t.type) ? (lf = a, Ei = cf(r.firstChild)) : Ei = a), $s(e, t, t.pendingProps.children, n), lc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && K && ((a = r = Ei) && (r = ef(r, t.type, t.pendingProps, Oi), r === null ? a = !1 : (t.stateNode = r, Ti = t, Ei = cf(r.firstChild), Oi = !1, a = !0)), a || Ai(t)), ue(t), a = t.type, o = t.pendingProps, s = e === null ? null : e.memoizedProps, r = o.children, $(a, o) ? r = null : s !== null && $(a, s) && (t.flags |= 32), t.memoizedState !== null && (a = _o(e, t, bo, null, null, n), Qf._currentValue = a), lc(e, t), $s(e, t, r, n), t.child;
			case 6: return e === null && K && ((e = n = Ei) && (n = nf(n, t.pendingProps, Oi), n === null ? e = !1 : (t.stateNode = n, Ti = t, Ei = null, e = !0)), e || Ai(t)), null;
			case 13: return _c(e, t, n);
			case 4: return ce(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Aa(t, null, r, n) : $s(e, t, r, n), t.child;
			case 11: return ec(e, t, t.type, t.pendingProps, n);
			case 7: return $s(e, t, t.pendingProps, n), t.child;
			case 8: return $s(e, t, t.pendingProps.children, n), t.child;
			case 12: return $s(e, t, t.pendingProps.children, n), t.child;
			case 10: return r = t.pendingProps, Bi(t, t.type, r.value), $s(e, t, r.children, n), t.child;
			case 9: return a = t.type._context, r = t.pendingProps.children, Ki(t), a = qi(a), r = r(a), t.flags |= 1, $s(e, t, r, n), t.child;
			case 14: return tc(e, t, t.type, t.pendingProps, n);
			case 15: return nc(e, t, t.type, t.pendingProps, n);
			case 19: return Sc(e, t, n);
			case 31: return cc(e, t, n);
			case 22: return rc(e, t, n, t.pendingProps);
			case 24: return Ki(t), r = qi($i), e === null ? (a = da(), a === null && (a = Fl, o = ea(), a.pooledCache = o, o.refCount++, o !== null && (a.pooledCacheLanes |= n), a = o), t.memoizedState = {
				parent: r,
				cache: a
			}, Na(t), Bi(t, $i, a)) : ((e.lanes & n) !== 0 && (Pa(e, t), Va(t, null, null, n), Ba()), a = e.memoizedState, o = t.memoizedState, a.parent === r ? (r = o.cache, Bi(t, $i, r), r !== a.cache && Ui(t, [$i], n, !0)) : (a = {
				parent: r,
				cache: r
			}, t.memoizedState = a, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a), Bi(t, $i, r))), $s(e, t, t.pendingProps.children, n), t.child;
			case 29: throw t.pendingProps;
		}
		throw Error(i(156, t.tag));
	}
	function Dc(e) {
		e.flags |= 4;
	}
	function Oc(e, t, n, r, i) {
		if ((t = !!(e.mode & 32)) && (t = !1), t) {
			if (e.flags |= 16777216, (i & 335544128) === i) if (e.stateNode.complete) e.flags |= 8192;
			else if (Su()) e.flags |= 8192;
			else throw xa = _a, ha;
		} else e.flags &= -16777217;
	}
	function kc(e, t) {
		if (t.type !== "stylesheet" || t.state.loading & 4) e.flags &= -16777217;
		else if (e.flags |= 16777216, !Wf(t)) if (Su()) e.flags |= 8192;
		else throw xa = _a, ha;
	}
	function Ac(e, t) {
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : Ge(), e.lanes |= t, ql |= t);
	}
	function jc(e, t) {
		if (!K) switch (e.tailMode) {
			case "hidden":
				t = e.tail;
				for (var n = null; t !== null;) t.alternate !== null && (n = t), t = t.sibling;
				n === null ? e.tail = null : n.sibling = null;
				break;
			case "collapsed":
				n = e.tail;
				for (var r = null; n !== null;) n.alternate !== null && (r = n), n = n.sibling;
				r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
		}
	}
	function Mc(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 65011712, r |= i.flags & 65011712, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function Nc(e, t, n) {
		var r = t.pendingProps;
		switch (Ci(t), t.tag) {
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return Mc(t), null;
			case 1: return Mc(t), null;
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), Vi($i), le(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (Ni(t) ? Dc(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, Fi())), Mc(t), null;
			case 26:
				var a = t.type, o = t.memoizedState;
				return e === null ? (Dc(t), o === null ? (Mc(t), Oc(t, a, null, r, n)) : (Mc(t), kc(t, o))) : o ? o === e.memoizedState ? (Mc(t), t.flags &= -16777217) : (Dc(t), Mc(t), kc(t, o)) : (e = e.memoizedProps, e !== r && Dc(t), Mc(t), Oc(t, a, e, r, n)), null;
			case 27:
				if (de(t), n = oe.current, a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && Dc(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return Mc(t), null;
					}
					e = ie.current, Ni(t) ? ji(t, e) : (e = ff(a, r, n), t.stateNode = e, Dc(t));
				}
				return Mc(t), null;
			case 5:
				if (de(t), a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && Dc(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return Mc(t), null;
					}
					if (o = ie.current, Ni(t)) ji(t, o);
					else {
						var s = Bd(oe.current);
						switch (o) {
							case 1:
								o = s.createElementNS("http://www.w3.org/2000/svg", a);
								break;
							case 2:
								o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
								break;
							default: switch (a) {
								case "svg":
									o = s.createElementNS("http://www.w3.org/2000/svg", a);
									break;
								case "math":
									o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
									break;
								case "script":
									o = s.createElement("div"), o.innerHTML = "<script><\/script>", o = o.removeChild(o.firstChild);
									break;
								case "select":
									o = typeof r.is == "string" ? s.createElement("select", { is: r.is }) : s.createElement("select"), r.multiple ? o.multiple = !0 : r.size && (o.size = r.size);
									break;
								default: o = typeof r.is == "string" ? s.createElement(a, { is: r.is }) : s.createElement(a);
							}
						}
						o[rt] = t, o[it] = r;
						a: for (s = t.child; s !== null;) {
							if (s.tag === 5 || s.tag === 6) o.appendChild(s.stateNode);
							else if (s.tag !== 4 && s.tag !== 27 && s.child !== null) {
								s.child.return = s, s = s.child;
								continue;
							}
							if (s === t) break a;
							for (; s.sibling === null;) {
								if (s.return === null || s.return === t) break a;
								s = s.return;
							}
							s.sibling.return = s.return, s = s.sibling;
						}
						t.stateNode = o;
						a: switch (Pd(o, a, r), a) {
							case "button":
							case "input":
							case "select":
							case "textarea":
								r = !!r.autoFocus;
								break a;
							case "img":
								r = !0;
								break a;
							default: r = !1;
						}
						r && Dc(t);
					}
				}
				return Mc(t), Oc(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n), null;
			case 6:
				if (e && t.stateNode != null) e.memoizedProps !== r && Dc(t);
				else {
					if (typeof r != "string" && t.stateNode === null) throw Error(i(166));
					if (e = oe.current, Ni(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, a = Ti, a !== null) switch (a.tag) {
							case 27:
							case 5: r = a.memoizedProps;
						}
						e[rt] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || jd(e.nodeValue, n)), e || Ai(t, !0);
					} else e = Bd(e).createTextNode(r), e[rt] = t, t.stateNode = e;
				}
				return Mc(t), null;
			case 31:
				if (n = t.memoizedState, e === null || e.memoizedState !== null) {
					if (r = Ni(t), n !== null) {
						if (e === null) {
							if (!r) throw Error(i(318));
							if (e = t.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(557));
							e[rt] = t;
						} else Pi(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						Mc(t), e = !1;
					} else n = Fi(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), e = !0;
					if (!e) return t.flags & 256 ? (to(t), t) : (to(t), null);
					if (t.flags & 128) throw Error(i(558));
				}
				return Mc(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (a = Ni(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!a) throw Error(i(318));
							if (a = t.memoizedState, a = a === null ? null : a.dehydrated, !a) throw Error(i(317));
							a[rt] = t;
						} else Pi(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						Mc(t), a = !1;
					} else a = Fi(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), a = !0;
					if (!a) return t.flags & 256 ? (to(t), t) : (to(t), null);
				}
				return to(t), t.flags & 128 ? (t.lanes = n, t) : (n = r !== null, e = e !== null && e.memoizedState !== null, n && (r = t.child, a = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (a = r.alternate.memoizedState.cachePool.pool), o = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (o = r.memoizedState.cachePool.pool), o !== a && (r.flags |= 2048)), n !== e && n && (t.child.flags |= 8192), Ac(t, t.updateQueue), Mc(t), null);
			case 4: return le(), e === null && xd(t.stateNode.containerInfo), Mc(t), null;
			case 10: return Vi(t.type), Mc(t), null;
			case 19:
				if (I(no), r = t.memoizedState, r === null) return Mc(t), null;
				if (a = !!(t.flags & 128), o = r.rendering, o === null) if (a) jc(r, !1);
				else {
					if (Hl !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
						if (o = ro(e), o !== null) {
							for (t.flags |= 128, jc(r, !1), e = o.updateQueue, t.updateQueue = e, Ac(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) ri(n, e), n = n.sibling;
							return L(no, no.current & 1 | 2), K && bi(t, r.treeForkCount), t.child;
						}
						e = e.sibling;
					}
					r.tail !== null && Ce() > $l && (t.flags |= 128, a = !0, jc(r, !1), t.lanes = 4194304);
				}
				else {
					if (!a) if (e = ro(o), e !== null) {
						if (t.flags |= 128, a = !0, e = e.updateQueue, t.updateQueue = e, Ac(t, e), jc(r, !0), r.tail === null && r.tailMode === "hidden" && !o.alternate && !K) return Mc(t), null;
					} else 2 * Ce() - r.renderingStartTime > $l && n !== 536870912 && (t.flags |= 128, a = !0, jc(r, !1), t.lanes = 4194304);
					r.isBackwards ? (o.sibling = t.child, t.child = o) : (e = r.last, e === null ? t.child = o : e.sibling = o, r.last = o);
				}
				return r.tail === null ? (Mc(t), null) : (e = r.tail, r.rendering = e, r.tail = e.sibling, r.renderingStartTime = Ce(), e.sibling = null, n = no.current, L(no, a ? n & 1 | 2 : n & 1), K && bi(t, r.treeForkCount), e);
			case 22:
			case 23: return to(t), Ja(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (Mc(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Mc(t), n = t.updateQueue, n !== null && Ac(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && I(ua), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), Vi($i), Mc(t), null;
			case 25: return null;
			case 30: return null;
		}
		throw Error(i(156, t.tag));
	}
	function Pc(e, t) {
		switch (Ci(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return Vi($i), le(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return de(t), null;
			case 31:
				if (t.memoizedState !== null) {
					if (to(t), t.alternate === null) throw Error(i(340));
					Pi();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 13:
				if (to(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(i(340));
					Pi();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return I(no), null;
			case 4: return le(), null;
			case 10: return Vi(t.type), null;
			case 22:
			case 23: return to(t), Ja(), e !== null && I(ua), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return Vi($i), null;
			case 25: return null;
			default: return null;
		}
	}
	function Fc(e, t) {
		switch (Ci(t), t.tag) {
			case 3:
				Vi($i), le();
				break;
			case 26:
			case 27:
			case 5:
				de(t);
				break;
			case 4:
				le();
				break;
			case 31:
				t.memoizedState !== null && to(t);
				break;
			case 13:
				to(t);
				break;
			case 19:
				I(no);
				break;
			case 10:
				Vi(t.type);
				break;
			case 22:
			case 23:
				to(t), Ja(), e !== null && I(ua);
				break;
			case 24: Vi($i);
		}
	}
	function Ic(e, t) {
		try {
			var n = t.updateQueue, r = n === null ? null : n.lastEffect;
			if (r !== null) {
				var i = r.next;
				n = i;
				do {
					if ((n.tag & e) === e) {
						r = void 0;
						var a = n.create, o = n.inst;
						r = a(), o.destroy = r;
					}
					n = n.next;
				} while (n !== i);
			}
		} catch (e) {
			Uu(t, t.return, e);
		}
	}
	function Lc(e, t, n) {
		try {
			var r = t.updateQueue, i = r === null ? null : r.lastEffect;
			if (i !== null) {
				var a = i.next;
				r = a;
				do {
					if ((r.tag & e) === e) {
						var o = r.inst, s = o.destroy;
						if (s !== void 0) {
							o.destroy = void 0, i = t;
							var c = n, l = s;
							try {
								l();
							} catch (e) {
								Uu(i, c, e);
							}
						}
					}
					r = r.next;
				} while (r !== a);
			}
		} catch (e) {
			Uu(t, t.return, e);
		}
	}
	function Rc(e) {
		var t = e.updateQueue;
		if (t !== null) {
			var n = e.stateNode;
			try {
				Ua(t, n);
			} catch (t) {
				Uu(e, e.return, t);
			}
		}
	}
	function zc(e, t, n) {
		n.props = Vs(e.type, e.memoizedProps), n.state = e.memoizedState;
		try {
			n.componentWillUnmount();
		} catch (n) {
			Uu(e, t, n);
		}
	}
	function Bc(e, t) {
		try {
			var n = e.ref;
			if (n !== null) {
				switch (e.tag) {
					case 26:
					case 27:
					case 5:
						var r = e.stateNode;
						break;
					case 30:
						r = e.stateNode;
						break;
					default: r = e.stateNode;
				}
				typeof n == "function" ? e.refCleanup = n(r) : n.current = r;
			}
		} catch (n) {
			Uu(e, t, n);
		}
	}
	function Vc(e, t) {
		var n = e.ref, r = e.refCleanup;
		if (n !== null) if (typeof r == "function") try {
			r();
		} catch (n) {
			Uu(e, t, n);
		} finally {
			e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
		}
		else if (typeof n == "function") try {
			n(null);
		} catch (n) {
			Uu(e, t, n);
		}
		else n.current = null;
	}
	function Hc(e) {
		var t = e.type, n = e.memoizedProps, r = e.stateNode;
		try {
			a: switch (t) {
				case "button":
				case "input":
				case "select":
				case "textarea":
					n.autoFocus && r.focus();
					break a;
				case "img": n.src ? r.src = n.src : n.srcSet && (r.srcset = n.srcSet);
			}
		} catch (t) {
			Uu(e, e.return, t);
		}
	}
	function Uc(e, t, n) {
		try {
			var r = e.stateNode;
			Fd(r, e.type, n, t), r[it] = t;
		} catch (t) {
			Uu(e, e.return, t);
		}
	}
	function Wc(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Xd(e.type) || e.tag === 4;
	}
	function Gc(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || Wc(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.tag === 27 && Xd(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function Kc(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(e, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(e), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = Yt));
		else if (r !== 4 && (r === 27 && Xd(e.type) && (n = e.stateNode, t = null), e = e.child, e !== null)) for (Kc(e, t, n), e = e.sibling; e !== null;) Kc(e, t, n), e = e.sibling;
	}
	function qc(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
		else if (r !== 4 && (r === 27 && Xd(e.type) && (n = e.stateNode), e = e.child, e !== null)) for (qc(e, t, n), e = e.sibling; e !== null;) qc(e, t, n), e = e.sibling;
	}
	function Jc(e) {
		var t = e.stateNode, n = e.memoizedProps;
		try {
			for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
			Pd(t, r, n), t[rt] = e, t[it] = n;
		} catch (t) {
			Uu(e, e.return, t);
		}
	}
	var Yc = !1, Xc = !1, Zc = !1, Qc = typeof WeakSet == "function" ? WeakSet : Set, $c = null;
	function el(e, t) {
		if (e = e.containerInfo, Rd = sp, e = yr(e), br(e)) {
			if ("selectionStart" in e) var n = {
				start: e.selectionStart,
				end: e.selectionEnd
			};
			else a: {
				n = (n = e.ownerDocument) && n.defaultView || window;
				var r = n.getSelection && n.getSelection();
				if (r && r.rangeCount !== 0) {
					n = r.anchorNode;
					var a = r.anchorOffset, o = r.focusNode;
					r = r.focusOffset;
					try {
						n.nodeType, o.nodeType;
					} catch {
						n = null;
						break a;
					}
					var s = 0, c = -1, l = -1, u = 0, d = 0, f = e, p = null;
					b: for (;;) {
						for (var m; f !== n || a !== 0 && f.nodeType !== 3 || (c = s + a), f !== o || r !== 0 && f.nodeType !== 3 || (l = s + r), f.nodeType === 3 && (s += f.nodeValue.length), (m = f.firstChild) !== null;) p = f, f = m;
						for (;;) {
							if (f === e) break b;
							if (p === n && ++u === a && (c = s), p === o && ++d === r && (l = s), (m = f.nextSibling) !== null) break;
							f = p, p = f.parentNode;
						}
						f = m;
					}
					n = c === -1 || l === -1 ? null : {
						start: c,
						end: l
					};
				} else n = null;
			}
			n ||= {
				start: 0,
				end: 0
			};
		} else n = null;
		for (zd = {
			focusedElem: e,
			selectionRange: n
		}, sp = !1, $c = t; $c !== null;) if (t = $c, e = t.child, t.subtreeFlags & 1028 && e !== null) e.return = t, $c = e;
		else for (; $c !== null;) {
			switch (t = $c, o = t.alternate, e = t.flags, t.tag) {
				case 0:
					if (e & 4 && (e = t.updateQueue, e = e === null ? null : e.events, e !== null)) for (n = 0; n < e.length; n++) a = e[n], a.ref.impl = a.nextImpl;
					break;
				case 11:
				case 15: break;
				case 1:
					if (e & 1024 && o !== null) {
						e = void 0, n = t, a = o.memoizedProps, o = o.memoizedState, r = n.stateNode;
						try {
							var h = Vs(n.type, a);
							e = r.getSnapshotBeforeUpdate(h, o), r.__reactInternalSnapshotBeforeUpdate = e;
						} catch (e) {
							Uu(n, n.return, e);
						}
					}
					break;
				case 3:
					if (e & 1024) {
						if (e = t.stateNode.containerInfo, n = e.nodeType, n === 9) $d(e);
						else if (n === 1) switch (e.nodeName) {
							case "HEAD":
							case "HTML":
							case "BODY":
								$d(e);
								break;
							default: e.textContent = "";
						}
					}
					break;
				case 5:
				case 26:
				case 27:
				case 6:
				case 4:
				case 17: break;
				default: if (e & 1024) throw Error(i(163));
			}
			if (e = t.sibling, e !== null) {
				e.return = t.return, $c = e;
				break;
			}
			$c = t.return;
		}
	}
	function tl(e, t, n) {
		var r = n.flags;
		switch (n.tag) {
			case 0:
			case 11:
			case 15:
				gl(e, n), r & 4 && Ic(5, n);
				break;
			case 1:
				if (gl(e, n), r & 4) if (e = n.stateNode, t === null) try {
					e.componentDidMount();
				} catch (e) {
					Uu(n, n.return, e);
				}
				else {
					var i = Vs(n.type, t.memoizedProps);
					t = t.memoizedState;
					try {
						e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
					} catch (e) {
						Uu(n, n.return, e);
					}
				}
				r & 64 && Rc(n), r & 512 && Bc(n, n.return);
				break;
			case 3:
				if (gl(e, n), r & 64 && (e = n.updateQueue, e !== null)) {
					if (t = null, n.child !== null) switch (n.child.tag) {
						case 27:
						case 5:
							t = n.child.stateNode;
							break;
						case 1: t = n.child.stateNode;
					}
					try {
						Ua(e, t);
					} catch (e) {
						Uu(n, n.return, e);
					}
				}
				break;
			case 27: t === null && r & 4 && Jc(n);
			case 26:
			case 5:
				gl(e, n), t === null && r & 4 && Hc(n), r & 512 && Bc(n, n.return);
				break;
			case 12:
				gl(e, n);
				break;
			case 31:
				gl(e, n), r & 4 && sl(e, n);
				break;
			case 13:
				gl(e, n), r & 4 && cl(e, n), r & 64 && (e = n.memoizedState, e !== null && (e = e.dehydrated, e !== null && (n = qu.bind(null, n), sf(e, n))));
				break;
			case 22:
				if (r = n.memoizedState !== null || Yc, !r) {
					t = t !== null && t.memoizedState !== null || Xc, i = Yc;
					var a = Xc;
					Yc = r, (Xc = t) && !a ? vl(e, n, !!(n.subtreeFlags & 8772)) : gl(e, n), Yc = i, Xc = a;
				}
				break;
			case 30: break;
			default: gl(e, n);
		}
	}
	function nl(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, nl(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && dt(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var rl = null, il = !1;
	function al(e, t, n) {
		for (n = n.child; n !== null;) ol(e, t, n), n = n.sibling;
	}
	function ol(e, t, n) {
		if (Me && typeof Me.onCommitFiberUnmount == "function") try {
			Me.onCommitFiberUnmount(je, n);
		} catch {}
		switch (n.tag) {
			case 26:
				Xc || Vc(n, t), al(e, t, n), n.memoizedState ? n.memoizedState.count-- : n.stateNode && (n = n.stateNode, n.parentNode.removeChild(n));
				break;
			case 27:
				Xc || Vc(n, t);
				var r = rl, i = il;
				Xd(n.type) && (rl = n.stateNode, il = !1), al(e, t, n), pf(n.stateNode), rl = r, il = i;
				break;
			case 5: Xc || Vc(n, t);
			case 6:
				if (r = rl, i = il, rl = null, al(e, t, n), rl = r, il = i, rl !== null) if (il) try {
					(rl.nodeType === 9 ? rl.body : rl.nodeName === "HTML" ? rl.ownerDocument.body : rl).removeChild(n.stateNode);
				} catch (e) {
					Uu(n, t, e);
				}
				else try {
					rl.removeChild(n.stateNode);
				} catch (e) {
					Uu(n, t, e);
				}
				break;
			case 18:
				rl !== null && (il ? (e = rl, Zd(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, n.stateNode), Np(e)) : Zd(rl, n.stateNode));
				break;
			case 4:
				r = rl, i = il, rl = n.stateNode.containerInfo, il = !0, al(e, t, n), rl = r, il = i;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				Lc(2, n, t), Xc || Lc(4, n, t), al(e, t, n);
				break;
			case 1:
				Xc || (Vc(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function" && zc(n, t, r)), al(e, t, n);
				break;
			case 21:
				al(e, t, n);
				break;
			case 22:
				Xc = (r = Xc) || n.memoizedState !== null, al(e, t, n), Xc = r;
				break;
			default: al(e, t, n);
		}
	}
	function sl(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
			e = e.dehydrated;
			try {
				Np(e);
			} catch (e) {
				Uu(t, t.return, e);
			}
		}
	}
	function cl(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
			Np(e);
		} catch (e) {
			Uu(t, t.return, e);
		}
	}
	function ll(e) {
		switch (e.tag) {
			case 31:
			case 13:
			case 19:
				var t = e.stateNode;
				return t === null && (t = e.stateNode = new Qc()), t;
			case 22: return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new Qc()), t;
			default: throw Error(i(435, e.tag));
		}
	}
	function ul(e, t) {
		var n = ll(e);
		t.forEach(function(t) {
			if (!n.has(t)) {
				n.add(t);
				var r = Ju.bind(null, e, t);
				t.then(r, r);
			}
		});
	}
	function dl(e, t) {
		var n = t.deletions;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var a = n[r], o = e, s = t, c = s;
			a: for (; c !== null;) {
				switch (c.tag) {
					case 27:
						if (Xd(c.type)) {
							rl = c.stateNode, il = !1;
							break a;
						}
						break;
					case 5:
						rl = c.stateNode, il = !1;
						break a;
					case 3:
					case 4:
						rl = c.stateNode.containerInfo, il = !0;
						break a;
				}
				c = c.return;
			}
			if (rl === null) throw Error(i(160));
			ol(o, s, a), rl = null, il = !1, o = a.alternate, o !== null && (o.return = null), a.return = null;
		}
		if (t.subtreeFlags & 13886) for (t = t.child; t !== null;) pl(t, e), t = t.sibling;
	}
	var fl = null;
	function pl(e, t) {
		var n = e.alternate, r = e.flags;
		switch (e.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				dl(t, e), ml(e), r & 4 && (Lc(3, e, e.return), Ic(3, e), Lc(5, e, e.return));
				break;
			case 1:
				dl(t, e), ml(e), r & 512 && (Xc || n === null || Vc(n, n.return)), r & 64 && Yc && (e = e.updateQueue, e !== null && (r = e.callbacks, r !== null && (n = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = n === null ? r : n.concat(r))));
				break;
			case 26:
				var a = fl;
				if (dl(t, e), ml(e), r & 512 && (Xc || n === null || Vc(n, n.return)), r & 4) {
					var o = n === null ? null : n.memoizedState;
					if (r = e.memoizedState, n === null) if (r === null) if (e.stateNode === null) {
						a: {
							r = e.type, n = e.memoizedProps, a = a.ownerDocument || a;
							b: switch (r) {
								case "title":
									o = a.getElementsByTagName("title")[0], (!o || o[ut] || o[rt] || o.namespaceURI === "http://www.w3.org/2000/svg" || o.hasAttribute("itemprop")) && (o = a.createElement(r), a.head.insertBefore(o, a.querySelector("head > title"))), Pd(o, r, n), o[rt] = e, gt(o), r = o;
									break a;
								case "link":
									var s = Vf("link", "href", a).get(r + (n.href || ""));
									if (s) {
										for (var c = 0; c < s.length; c++) if (o = s[c], o.getAttribute("href") === (n.href == null || n.href === "" ? null : n.href) && o.getAttribute("rel") === (n.rel == null ? null : n.rel) && o.getAttribute("title") === (n.title == null ? null : n.title) && o.getAttribute("crossorigin") === (n.crossOrigin == null ? null : n.crossOrigin)) {
											s.splice(c, 1);
											break b;
										}
									}
									o = a.createElement(r), Pd(o, r, n), a.head.appendChild(o);
									break;
								case "meta":
									if (s = Vf("meta", "content", a).get(r + (n.content || ""))) {
										for (c = 0; c < s.length; c++) if (o = s[c], o.getAttribute("content") === (n.content == null ? null : "" + n.content) && o.getAttribute("name") === (n.name == null ? null : n.name) && o.getAttribute("property") === (n.property == null ? null : n.property) && o.getAttribute("http-equiv") === (n.httpEquiv == null ? null : n.httpEquiv) && o.getAttribute("charset") === (n.charSet == null ? null : n.charSet)) {
											s.splice(c, 1);
											break b;
										}
									}
									o = a.createElement(r), Pd(o, r, n), a.head.appendChild(o);
									break;
								default: throw Error(i(468, r));
							}
							o[rt] = e, gt(o), r = o;
						}
						e.stateNode = r;
					} else Hf(a, e.type, e.stateNode);
					else e.stateNode = If(a, r, e.memoizedProps);
					else o === r ? r === null && e.stateNode !== null && Uc(e, e.memoizedProps, n.memoizedProps) : (o === null ? n.stateNode !== null && (n = n.stateNode, n.parentNode.removeChild(n)) : o.count--, r === null ? Hf(a, e.type, e.stateNode) : If(a, r, e.memoizedProps));
				}
				break;
			case 27:
				dl(t, e), ml(e), r & 512 && (Xc || n === null || Vc(n, n.return)), n !== null && r & 4 && Uc(e, e.memoizedProps, n.memoizedProps);
				break;
			case 5:
				if (dl(t, e), ml(e), r & 512 && (Xc || n === null || Vc(n, n.return)), e.flags & 32) {
					a = e.stateNode;
					try {
						Vt(a, "");
					} catch (t) {
						Uu(e, e.return, t);
					}
				}
				r & 4 && e.stateNode != null && (a = e.memoizedProps, Uc(e, a, n === null ? a : n.memoizedProps)), r & 1024 && (Zc = !0);
				break;
			case 6:
				if (dl(t, e), ml(e), r & 4) {
					if (e.stateNode === null) throw Error(i(162));
					r = e.memoizedProps, n = e.stateNode;
					try {
						n.nodeValue = r;
					} catch (t) {
						Uu(e, e.return, t);
					}
				}
				break;
			case 3:
				if (Bf = null, a = fl, fl = gf(t.containerInfo), dl(t, e), fl = a, ml(e), r & 4 && n !== null && n.memoizedState.isDehydrated) try {
					Np(t.containerInfo);
				} catch (t) {
					Uu(e, e.return, t);
				}
				Zc && (Zc = !1, hl(e));
				break;
			case 4:
				r = fl, fl = gf(e.stateNode.containerInfo), dl(t, e), ml(e), fl = r;
				break;
			case 12:
				dl(t, e), ml(e);
				break;
			case 31:
				dl(t, e), ml(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, ul(e, r)));
				break;
			case 13:
				dl(t, e), ml(e), e.child.flags & 8192 && e.memoizedState !== null != (n !== null && n.memoizedState !== null) && (Zl = Ce()), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, ul(e, r)));
				break;
			case 22:
				a = e.memoizedState !== null;
				var l = n !== null && n.memoizedState !== null, u = Yc, d = Xc;
				if (Yc = u || a, Xc = d || l, dl(t, e), Xc = d, Yc = u, ml(e), r & 8192) a: for (t = e.stateNode, t._visibility = a ? t._visibility & -2 : t._visibility | 1, a && (n === null || l || Yc || Xc || _l(e)), n = null, t = e;;) {
					if (t.tag === 5 || t.tag === 26) {
						if (n === null) {
							l = n = t;
							try {
								if (o = l.stateNode, a) s = o.style, typeof s.setProperty == "function" ? s.setProperty("display", "none", "important") : s.display = "none";
								else {
									c = l.stateNode;
									var f = l.memoizedProps.style, p = f != null && f.hasOwnProperty("display") ? f.display : null;
									c.style.display = p == null || typeof p == "boolean" ? "" : ("" + p).trim();
								}
							} catch (e) {
								Uu(l, l.return, e);
							}
						}
					} else if (t.tag === 6) {
						if (n === null) {
							l = t;
							try {
								l.stateNode.nodeValue = a ? "" : l.memoizedProps;
							} catch (e) {
								Uu(l, l.return, e);
							}
						}
					} else if (t.tag === 18) {
						if (n === null) {
							l = t;
							try {
								var m = l.stateNode;
								a ? Qd(m, !0) : Qd(l.stateNode, !1);
							} catch (e) {
								Uu(l, l.return, e);
							}
						}
					} else if ((t.tag !== 22 && t.tag !== 23 || t.memoizedState === null || t === e) && t.child !== null) {
						t.child.return = t, t = t.child;
						continue;
					}
					if (t === e) break a;
					for (; t.sibling === null;) {
						if (t.return === null || t.return === e) break a;
						n === t && (n = null), t = t.return;
					}
					n === t && (n = null), t.sibling.return = t.return, t = t.sibling;
				}
				r & 4 && (r = e.updateQueue, r !== null && (n = r.retryQueue, n !== null && (r.retryQueue = null, ul(e, n))));
				break;
			case 19:
				dl(t, e), ml(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, ul(e, r)));
				break;
			case 30: break;
			case 21: break;
			default: dl(t, e), ml(e);
		}
	}
	function ml(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				for (var n, r = e.return; r !== null;) {
					if (Wc(r)) {
						n = r;
						break;
					}
					r = r.return;
				}
				if (n == null) throw Error(i(160));
				switch (n.tag) {
					case 27:
						var a = n.stateNode;
						qc(e, Gc(e), a);
						break;
					case 5:
						var o = n.stateNode;
						n.flags & 32 && (Vt(o, ""), n.flags &= -33), qc(e, Gc(e), o);
						break;
					case 3:
					case 4:
						var s = n.stateNode.containerInfo;
						Kc(e, Gc(e), s);
						break;
					default: throw Error(i(161));
				}
			} catch (t) {
				Uu(e, e.return, t);
			}
			e.flags &= -3;
		}
		t & 4096 && (e.flags &= -4097);
	}
	function hl(e) {
		if (e.subtreeFlags & 1024) for (e = e.child; e !== null;) {
			var t = e;
			hl(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling;
		}
	}
	function gl(e, t) {
		if (t.subtreeFlags & 8772) for (t = t.child; t !== null;) tl(e, t.alternate, t), t = t.sibling;
	}
	function _l(e) {
		for (e = e.child; e !== null;) {
			var t = e;
			switch (t.tag) {
				case 0:
				case 11:
				case 14:
				case 15:
					Lc(4, t, t.return), _l(t);
					break;
				case 1:
					Vc(t, t.return);
					var n = t.stateNode;
					typeof n.componentWillUnmount == "function" && zc(t, t.return, n), _l(t);
					break;
				case 27: pf(t.stateNode);
				case 26:
				case 5:
					Vc(t, t.return), _l(t);
					break;
				case 22:
					t.memoizedState === null && _l(t);
					break;
				case 30:
					_l(t);
					break;
				default: _l(t);
			}
			e = e.sibling;
		}
	}
	function vl(e, t, n) {
		for (n &&= !!(t.subtreeFlags & 8772), t = t.child; t !== null;) {
			var r = t.alternate, i = e, a = t, o = a.flags;
			switch (a.tag) {
				case 0:
				case 11:
				case 15:
					vl(i, a, n), Ic(4, a);
					break;
				case 1:
					if (vl(i, a, n), r = a, i = r.stateNode, typeof i.componentDidMount == "function") try {
						i.componentDidMount();
					} catch (e) {
						Uu(r, r.return, e);
					}
					if (r = a, i = r.updateQueue, i !== null) {
						var s = r.stateNode;
						try {
							var c = i.shared.hiddenCallbacks;
							if (c !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < c.length; i++) Ha(c[i], s);
						} catch (e) {
							Uu(r, r.return, e);
						}
					}
					n && o & 64 && Rc(a), Bc(a, a.return);
					break;
				case 27: Jc(a);
				case 26:
				case 5:
					vl(i, a, n), n && r === null && o & 4 && Hc(a), Bc(a, a.return);
					break;
				case 12:
					vl(i, a, n);
					break;
				case 31:
					vl(i, a, n), n && o & 4 && sl(i, a);
					break;
				case 13:
					vl(i, a, n), n && o & 4 && cl(i, a);
					break;
				case 22:
					a.memoizedState === null && vl(i, a, n), Bc(a, a.return);
					break;
				case 30: break;
				default: vl(i, a, n);
			}
			t = t.sibling;
		}
	}
	function yl(e, t) {
		var n = null;
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && ta(n));
	}
	function bl(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && ta(e));
	}
	function xl(e, t, n, r) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) Sl(e, t, n, r), t = t.sibling;
	}
	function Sl(e, t, n, r) {
		var i = t.flags;
		switch (t.tag) {
			case 0:
			case 11:
			case 15:
				xl(e, t, n, r), i & 2048 && Ic(9, t);
				break;
			case 1:
				xl(e, t, n, r);
				break;
			case 3:
				xl(e, t, n, r), i & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && ta(e)));
				break;
			case 12:
				if (i & 2048) {
					xl(e, t, n, r), e = t.stateNode;
					try {
						var a = t.memoizedProps, o = a.id, s = a.onPostCommit;
						typeof s == "function" && s(o, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0);
					} catch (e) {
						Uu(t, t.return, e);
					}
				} else xl(e, t, n, r);
				break;
			case 31:
				xl(e, t, n, r);
				break;
			case 13:
				xl(e, t, n, r);
				break;
			case 23: break;
			case 22:
				a = t.stateNode, o = t.alternate, t.memoizedState === null ? a._visibility & 2 ? xl(e, t, n, r) : (a._visibility |= 2, Cl(e, t, n, r, !!(t.subtreeFlags & 10256) || !1)) : a._visibility & 2 ? xl(e, t, n, r) : wl(e, t), i & 2048 && yl(o, t);
				break;
			case 24:
				xl(e, t, n, r), i & 2048 && bl(t.alternate, t);
				break;
			default: xl(e, t, n, r);
		}
	}
	function Cl(e, t, n, r, i) {
		for (i &&= !!(t.subtreeFlags & 10256) || !1, t = t.child; t !== null;) {
			var a = e, o = t, s = n, c = r, l = o.flags;
			switch (o.tag) {
				case 0:
				case 11:
				case 15:
					Cl(a, o, s, c, i), Ic(8, o);
					break;
				case 23: break;
				case 22:
					var u = o.stateNode;
					o.memoizedState === null ? (u._visibility |= 2, Cl(a, o, s, c, i)) : u._visibility & 2 ? Cl(a, o, s, c, i) : wl(a, o), i && l & 2048 && yl(o.alternate, o);
					break;
				case 24:
					Cl(a, o, s, c, i), i && l & 2048 && bl(o.alternate, o);
					break;
				default: Cl(a, o, s, c, i);
			}
			t = t.sibling;
		}
	}
	function wl(e, t) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) {
			var n = e, r = t, i = r.flags;
			switch (r.tag) {
				case 22:
					wl(n, r), i & 2048 && yl(r.alternate, r);
					break;
				case 24:
					wl(n, r), i & 2048 && bl(r.alternate, r);
					break;
				default: wl(n, r);
			}
			t = t.sibling;
		}
	}
	var Tl = 8192;
	function El(e, t, n) {
		if (e.subtreeFlags & Tl) for (e = e.child; e !== null;) Dl(e, t, n), e = e.sibling;
	}
	function Dl(e, t, n) {
		switch (e.tag) {
			case 26:
				El(e, t, n), e.flags & Tl && e.memoizedState !== null && Gf(n, fl, e.memoizedState, e.memoizedProps);
				break;
			case 5:
				El(e, t, n);
				break;
			case 3:
			case 4:
				var r = fl;
				fl = gf(e.stateNode.containerInfo), El(e, t, n), fl = r;
				break;
			case 22:
				e.memoizedState === null && (r = e.alternate, r !== null && r.memoizedState !== null ? (r = Tl, Tl = 16777216, El(e, t, n), Tl = r) : El(e, t, n));
				break;
			default: El(e, t, n);
		}
	}
	function Ol(e) {
		var t = e.alternate;
		if (t !== null && (e = t.child, e !== null)) {
			t.child = null;
			do
				t = e.sibling, e.sibling = null, e = t;
			while (e !== null);
		}
	}
	function kl(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				$c = r, Ml(r, e);
			}
			Ol(e);
		}
		if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) Al(e), e = e.sibling;
	}
	function Al(e) {
		switch (e.tag) {
			case 0:
			case 11:
			case 15:
				kl(e), e.flags & 2048 && Lc(9, e, e.return);
				break;
			case 3:
				kl(e);
				break;
			case 12:
				kl(e);
				break;
			case 22:
				var t = e.stateNode;
				e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, jl(e)) : kl(e);
				break;
			default: kl(e);
		}
	}
	function jl(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				$c = r, Ml(r, e);
			}
			Ol(e);
		}
		for (e = e.child; e !== null;) {
			switch (t = e, t.tag) {
				case 0:
				case 11:
				case 15:
					Lc(8, t, t.return), jl(t);
					break;
				case 22:
					n = t.stateNode, n._visibility & 2 && (n._visibility &= -3, jl(t));
					break;
				default: jl(t);
			}
			e = e.sibling;
		}
	}
	function Ml(e, t) {
		for (; $c !== null;) {
			var n = $c;
			switch (n.tag) {
				case 0:
				case 11:
				case 15:
					Lc(8, n, t);
					break;
				case 23:
				case 22:
					if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
						var r = n.memoizedState.cachePool.pool;
						r != null && r.refCount++;
					}
					break;
				case 24: ta(n.memoizedState.cache);
			}
			if (r = n.child, r !== null) r.return = n, $c = r;
			else a: for (n = e; $c !== null;) {
				r = $c;
				var i = r.sibling, a = r.return;
				if (nl(r), r === n) {
					$c = null;
					break a;
				}
				if (i !== null) {
					i.return = a, $c = i;
					break a;
				}
				$c = a;
			}
		}
	}
	var Nl = {
		getCacheForType: function(e) {
			var t = qi($i), n = t.data.get(e);
			return n === void 0 && (n = e(), t.data.set(e, n)), n;
		},
		cacheSignal: function() {
			return qi($i).controller.signal;
		}
	}, Pl = typeof WeakMap == "function" ? WeakMap : Map, Y = 0, Fl = null, X = null, Z = 0, Il = 0, Ll = null, Rl = !1, zl = !1, Bl = !1, Vl = 0, Hl = 0, Ul = 0, Wl = 0, Gl = 0, Kl = 0, ql = 0, Jl = null, Yl = null, Xl = !1, Zl = 0, Ql = 0, $l = Infinity, eu = null, tu = null, nu = 0, ru = null, iu = null, au = 0, ou = 0, su = null, cu = null, lu = 0, uu = null;
	function du() {
		return Y & 2 && Z !== 0 ? Z & -Z : N.T === null ? et() : ud();
	}
	function fu() {
		if (Kl === 0) if (!(Z & 536870912) || K) {
			var e = Be;
			Be <<= 1, !(Be & 3932160) && (Be = 262144), Kl = e;
		} else Kl = 536870912;
		return e = Ya.current, e !== null && (e.flags |= 32), Kl;
	}
	function pu(e, t, n) {
		(e === Fl && (Il === 2 || Il === 9) || e.cancelPendingCommit !== null) && (bu(e, 0), _u(e, Z, Kl, !1)), qe(e, n), (!(Y & 2) || e !== Fl) && (e === Fl && (!(Y & 2) && (Wl |= n), Hl === 4 && _u(e, Z, Kl, !1)), nd(e));
	}
	function mu(e, t, n) {
		if (Y & 6) throw Error(i(327));
		var r = !n && !(t & 127) && (t & e.expiredLanes) === 0 || Ue(e, t), a = r ? Ou(e, t) : Eu(e, t, !0), o = r;
		do {
			if (a === 0) {
				zl && !r && _u(e, t, 0, !1);
				break;
			}
			if (n = e.current.alternate, o && !gu(n)) {
				a = Eu(e, t, !1), o = !1;
				continue;
			}
			if (a === 2) {
				if (o = t, e.errorRecoveryDisabledLanes & o) var s = 0;
				else s = e.pendingLanes & -536870913, s = s === 0 ? s & 536870912 ? 536870912 : 0 : s;
				if (s !== 0) {
					t = s;
					a: {
						var c = e;
						a = Jl;
						var l = c.current.memoizedState.isDehydrated;
						if (l && (bu(c, s).flags |= 256), s = Eu(c, s, !1), s !== 2) {
							if (Bl && !l) {
								c.errorRecoveryDisabledLanes |= o, Wl |= o, a = 4;
								break a;
							}
							o = Yl, Yl = a, o !== null && (Yl === null ? Yl = o : Yl.push.apply(Yl, o));
						}
						a = s;
					}
					if (o = !1, a !== 2) continue;
				}
			}
			if (a === 1) {
				bu(e, 0), _u(e, t, 0, !0);
				break;
			}
			a: {
				switch (r = e, o = a, o) {
					case 0:
					case 1: throw Error(i(345));
					case 4: if ((t & 4194048) !== t) break;
					case 6:
						_u(r, t, Kl, !Rl);
						break a;
					case 2:
						Yl = null;
						break;
					case 3:
					case 5: break;
					default: throw Error(i(329));
				}
				if ((t & 62914560) === t && (a = Zl + 300 - Ce(), 10 < a)) {
					if (_u(r, t, Kl, !Rl), He(r, 0, !0) !== 0) break a;
					au = t, r.timeoutHandle = Gd(hu.bind(null, r, n, Yl, eu, Xl, t, Kl, Wl, ql, Rl, o, "Throttled", -0, 0), a);
					break a;
				}
				hu(r, n, Yl, eu, Xl, t, Kl, Wl, ql, Rl, o, null, -0, 0);
			}
			break;
		} while (1);
		nd(e);
	}
	function hu(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
		if (e.timeoutHandle = -1, d = t.subtreeFlags, d & 8192 || (d & 16785408) == 16785408) {
			d = {
				stylesheets: null,
				count: 0,
				imgCount: 0,
				imgBytes: 0,
				suspenseyImages: [],
				waitingForImages: !0,
				waitingForViewTransition: !1,
				unsuspend: Yt
			}, Dl(t, a, d);
			var m = (a & 62914560) === a ? Zl - Ce() : (a & 4194048) === a ? Ql - Ce() : 0;
			if (m = qf(d, m), m !== null) {
				au = a, e.cancelPendingCommit = m(Fu.bind(null, e, t, a, n, r, i, o, s, c, u, d, null, f, p)), _u(e, a, o, !l);
				return;
			}
		}
		Fu(e, t, a, n, r, i, o, s, c);
	}
	function gu(e) {
		for (var t = e;;) {
			var n = t.tag;
			if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue, n !== null && (n = n.stores, n !== null))) for (var r = 0; r < n.length; r++) {
				var i = n[r], a = i.getSnapshot;
				i = i.value;
				try {
					if (!mr(a(), i)) return !1;
				} catch {
					return !1;
				}
			}
			if (n = t.child, t.subtreeFlags & 16384 && n !== null) n.return = t, t = n;
			else {
				if (t === e) break;
				for (; t.sibling === null;) {
					if (t.return === null || t.return === e) return !0;
					t = t.return;
				}
				t.sibling.return = t.return, t = t.sibling;
			}
		}
		return !0;
	}
	function _u(e, t, n, r) {
		t &= ~Gl, t &= ~Wl, e.suspendedLanes |= t, e.pingedLanes &= ~t, r && (e.warmLanes |= t), r = e.expirationTimes;
		for (var i = t; 0 < i;) {
			var a = 31 - Pe(i), o = 1 << a;
			r[a] = -1, i &= ~o;
		}
		n !== 0 && Ye(e, n, t);
	}
	function vu() {
		return Y & 6 ? !0 : (rd(0, !1), !1);
	}
	function yu() {
		if (X !== null) {
			if (Il === 0) var e = X.return;
			else e = X, zi = Ri = null, Co(e), wa = null, Ta = 0, e = X;
			for (; e !== null;) Fc(e.alternate, e), e = e.return;
			X = null;
		}
	}
	function bu(e, t) {
		var n = e.timeoutHandle;
		n !== -1 && (e.timeoutHandle = -1, Kd(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), au = 0, yu(), Fl = e, X = n = ni(e.current, null), Z = t, Il = 0, Ll = null, Rl = !1, zl = Ue(e, t), Bl = !1, ql = Kl = Gl = Wl = Ul = Hl = 0, Yl = Jl = null, Xl = !1, t & 8 && (t |= t & 32);
		var r = e.entangledLanes;
		if (r !== 0) for (e = e.entanglements, r &= t; 0 < r;) {
			var i = 31 - Pe(r), a = 1 << i;
			t |= e[i], r &= ~a;
		}
		return Vl = t, Kr(), n;
	}
	function xu(e, t) {
		q = null, N.H = Ns, t === ma || t === ga ? (t = Sa(), Il = 3) : t === ha ? (t = Sa(), Il = 4) : Il = t === Zs ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, Ll = t, X === null && (Hl = 1, Gs(e, ui(t, e.current)));
	}
	function Su() {
		var e = Ya.current;
		return e === null ? !0 : (Z & 4194048) === Z ? Xa === null : (Z & 62914560) === Z || Z & 536870912 ? e === Xa : !1;
	}
	function Cu() {
		var e = N.H;
		return N.H = Ns, e === null ? Ns : e;
	}
	function wu() {
		var e = N.A;
		return N.A = Nl, e;
	}
	function Tu() {
		Hl = 4, Rl || (Z & 4194048) !== Z && Ya.current !== null || (zl = !0), !(Ul & 134217727) && !(Wl & 134217727) || Fl === null || _u(Fl, Z, Kl, !1);
	}
	function Eu(e, t, n) {
		var r = Y;
		Y |= 2;
		var i = Cu(), a = wu();
		(Fl !== e || Z !== t) && (eu = null, bu(e, t)), t = !1;
		var o = Hl;
		a: do
			try {
				if (Il !== 0 && X !== null) {
					var s = X, c = Ll;
					switch (Il) {
						case 8:
							yu(), o = 6;
							break a;
						case 3:
						case 2:
						case 9:
						case 6:
							Ya.current === null && (t = !0);
							var l = Il;
							if (Il = 0, Ll = null, Mu(e, s, c, l), n && zl) {
								o = 0;
								break a;
							}
							break;
						default: l = Il, Il = 0, Ll = null, Mu(e, s, c, l);
					}
				}
				Du(), o = Hl;
				break;
			} catch (t) {
				xu(e, t);
			}
		while (1);
		return t && e.shellSuspendCounter++, zi = Ri = null, Y = r, N.H = i, N.A = a, X === null && (Fl = null, Z = 0, Kr()), o;
	}
	function Du() {
		for (; X !== null;) Au(X);
	}
	function Ou(e, t) {
		var n = Y;
		Y |= 2;
		var r = Cu(), a = wu();
		Fl !== e || Z !== t ? (eu = null, $l = Ce() + 500, bu(e, t)) : zl = Ue(e, t);
		a: do
			try {
				if (Il !== 0 && X !== null) {
					t = X;
					var o = Ll;
					b: switch (Il) {
						case 1:
							Il = 0, Ll = null, Mu(e, t, o, 1);
							break;
						case 2:
						case 9:
							if (va(o)) {
								Il = 0, Ll = null, ju(t);
								break;
							}
							t = function() {
								Il !== 2 && Il !== 9 || Fl !== e || (Il = 7), nd(e);
							}, o.then(t, t);
							break a;
						case 3:
							Il = 7;
							break a;
						case 4:
							Il = 5;
							break a;
						case 7:
							va(o) ? (Il = 0, Ll = null, ju(t)) : (Il = 0, Ll = null, Mu(e, t, o, 7));
							break;
						case 5:
							var s = null;
							switch (X.tag) {
								case 26: s = X.memoizedState;
								case 5:
								case 27:
									var c = X;
									if (s ? Wf(s) : c.stateNode.complete) {
										Il = 0, Ll = null;
										var l = c.sibling;
										if (l !== null) X = l;
										else {
											var u = c.return;
											u === null ? X = null : (X = u, Nu(u));
										}
										break b;
									}
							}
							Il = 0, Ll = null, Mu(e, t, o, 5);
							break;
						case 6:
							Il = 0, Ll = null, Mu(e, t, o, 6);
							break;
						case 8:
							yu(), Hl = 6;
							break a;
						default: throw Error(i(462));
					}
				}
				ku();
				break;
			} catch (t) {
				xu(e, t);
			}
		while (1);
		return zi = Ri = null, N.H = r, N.A = a, Y = n, X === null ? (Fl = null, Z = 0, Kr(), Hl) : 0;
	}
	function ku() {
		for (; X !== null && !xe();) Au(X);
	}
	function Au(e) {
		var t = Ec(e.alternate, e, Vl);
		e.memoizedProps = e.pendingProps, t === null ? Nu(e) : X = t;
	}
	function ju(e) {
		var t = e, n = t.alternate;
		switch (t.tag) {
			case 15:
			case 0:
				t = dc(n, t, t.pendingProps, t.type, void 0, Z);
				break;
			case 11:
				t = dc(n, t, t.pendingProps, t.type.render, t.ref, Z);
				break;
			case 5: Co(t);
			default: Fc(n, t), t = X = ri(t, Vl), t = Ec(n, t, Vl);
		}
		e.memoizedProps = e.pendingProps, t === null ? Nu(e) : X = t;
	}
	function Mu(e, t, n, r) {
		zi = Ri = null, Co(t), wa = null, Ta = 0;
		var i = t.return;
		try {
			if (Xs(e, i, t, n, Z)) {
				Hl = 1, Gs(e, ui(n, e.current)), X = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw X = i, t;
			Hl = 1, Gs(e, ui(n, e.current)), X = null;
			return;
		}
		t.flags & 32768 ? (K || r === 1 ? e = !0 : zl || Z & 536870912 ? e = !1 : (Rl = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = Ya.current, r !== null && r.tag === 13 && (r.flags |= 16384))), Pu(t, e)) : Nu(t);
	}
	function Nu(e) {
		var t = e;
		do {
			if (t.flags & 32768) {
				Pu(t, Rl);
				return;
			}
			e = t.return;
			var n = Nc(t.alternate, t, Vl);
			if (n !== null) {
				X = n;
				return;
			}
			if (t = t.sibling, t !== null) {
				X = t;
				return;
			}
			X = t = e;
		} while (t !== null);
		Hl === 0 && (Hl = 5);
	}
	function Pu(e, t) {
		do {
			var n = Pc(e.alternate, e);
			if (n !== null) {
				n.flags &= 32767, X = n;
				return;
			}
			if (n = e.return, n !== null && (n.flags |= 32768, n.subtreeFlags = 0, n.deletions = null), !t && (e = e.sibling, e !== null)) {
				X = e;
				return;
			}
			X = e = n;
		} while (e !== null);
		Hl = 6, X = null;
	}
	function Fu(e, t, n, r, a, o, s, c, l) {
		e.cancelPendingCommit = null;
		do
			Bu();
		while (nu !== 0);
		if (Y & 6) throw Error(i(327));
		if (t !== null) {
			if (t === e.current) throw Error(i(177));
			if (o = t.lanes | t.childLanes, o |= Gr, Je(e, n, o, s, c, l), e === Fl && (X = Fl = null, Z = 0), iu = t, ru = e, au = n, ou = o, su = a, cu = r, t.subtreeFlags & 10256 || t.flags & 10256 ? (e.callbackNode = null, e.callbackPriority = 0, Yu(De, function() {
				return Vu(), null;
			})) : (e.callbackNode = null, e.callbackPriority = 0), r = !!(t.flags & 13878), t.subtreeFlags & 13878 || r) {
				r = N.T, N.T = null, a = P.p, P.p = 2, s = Y, Y |= 4;
				try {
					el(e, t, n);
				} finally {
					Y = s, P.p = a, N.T = r;
				}
			}
			nu = 1, Iu(), Lu(), Ru();
		}
	}
	function Iu() {
		if (nu === 1) {
			nu = 0;
			var e = ru, t = iu, n = !!(t.flags & 13878);
			if (t.subtreeFlags & 13878 || n) {
				n = N.T, N.T = null;
				var r = P.p;
				P.p = 2;
				var i = Y;
				Y |= 4;
				try {
					pl(t, e);
					var a = zd, o = yr(e.containerInfo), s = a.focusedElem, c = a.selectionRange;
					if (o !== s && s && s.ownerDocument && vr(s.ownerDocument.documentElement, s)) {
						if (c !== null && br(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = _r(s, h), v = _r(s, g);
									if (_ && v && (p.rangeCount !== 1 || p.anchorNode !== _.node || p.anchorOffset !== _.offset || p.focusNode !== v.node || p.focusOffset !== v.offset)) {
										var y = d.createRange();
										y.setStart(_.node, _.offset), p.removeAllRanges(), h > g ? (p.addRange(y), p.extend(v.node, v.offset)) : (y.setEnd(v.node, v.offset), p.addRange(y));
									}
								}
							}
						}
						for (d = [], p = s; p = p.parentNode;) p.nodeType === 1 && d.push({
							element: p,
							left: p.scrollLeft,
							top: p.scrollTop
						});
						for (typeof s.focus == "function" && s.focus(), s = 0; s < d.length; s++) {
							var b = d[s];
							b.element.scrollLeft = b.left, b.element.scrollTop = b.top;
						}
					}
					sp = !!Rd, zd = Rd = null;
				} finally {
					Y = i, P.p = r, N.T = n;
				}
			}
			e.current = t, nu = 2;
		}
	}
	function Lu() {
		if (nu === 2) {
			nu = 0;
			var e = ru, t = iu, n = !!(t.flags & 8772);
			if (t.subtreeFlags & 8772 || n) {
				n = N.T, N.T = null;
				var r = P.p;
				P.p = 2;
				var i = Y;
				Y |= 4;
				try {
					tl(e, t.alternate, t);
				} finally {
					Y = i, P.p = r, N.T = n;
				}
			}
			nu = 3;
		}
	}
	function Ru() {
		if (nu === 4 || nu === 3) {
			nu = 0, Se();
			var e = ru, t = iu, n = au, r = cu;
			t.subtreeFlags & 10256 || t.flags & 10256 ? nu = 5 : (nu = 0, iu = ru = null, zu(e, e.pendingLanes));
			var i = e.pendingLanes;
			if (i === 0 && (tu = null), $e(n), t = t.stateNode, Me && typeof Me.onCommitFiberRoot == "function") try {
				Me.onCommitFiberRoot(je, t, void 0, (t.current.flags & 128) == 128);
			} catch {}
			if (r !== null) {
				t = N.T, i = P.p, P.p = 2, N.T = null;
				try {
					for (var a = e.onRecoverableError, o = 0; o < r.length; o++) {
						var s = r[o];
						a(s.value, { componentStack: s.stack });
					}
				} finally {
					N.T = t, P.p = i;
				}
			}
			au & 3 && Bu(), nd(e), i = e.pendingLanes, n & 261930 && i & 42 ? e === uu ? lu++ : (lu = 0, uu = e) : lu = 0, rd(0, !1);
		}
	}
	function zu(e, t) {
		(e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, ta(t)));
	}
	function Bu() {
		return Iu(), Lu(), Ru(), Vu();
	}
	function Vu() {
		if (nu !== 5) return !1;
		var e = ru, t = ou;
		ou = 0;
		var n = $e(au), r = N.T, a = P.p;
		try {
			P.p = 32 > n ? 32 : n, N.T = null, n = su, su = null;
			var o = ru, s = au;
			if (nu = 0, iu = ru = null, au = 0, Y & 6) throw Error(i(331));
			var c = Y;
			if (Y |= 4, Al(o.current), Sl(o, o.current, s, n), Y = c, rd(0, !1), Me && typeof Me.onPostCommitFiberRoot == "function") try {
				Me.onPostCommitFiberRoot(je, o);
			} catch {}
			return !0;
		} finally {
			P.p = a, N.T = r, zu(e, t);
		}
	}
	function Hu(e, t, n) {
		t = ui(n, t), t = qs(e.stateNode, t, 2), e = Ia(e, t, 2), e !== null && (qe(e, 2), nd(e));
	}
	function Uu(e, t, n) {
		if (e.tag === 3) Hu(e, e, n);
		else for (; t !== null;) {
			if (t.tag === 3) {
				Hu(t, e, n);
				break;
			}
			if (t.tag === 1) {
				var r = t.stateNode;
				if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (tu === null || !tu.has(r))) {
					e = ui(n, e), n = Js(2), r = Ia(t, n, 2), r !== null && (Ys(n, r, t, e), qe(r, 2), nd(r));
					break;
				}
			}
			t = t.return;
		}
	}
	function Wu(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new Pl();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (Bl = !0, i.add(n), e = Gu.bind(null, e, t, n), t.then(e, e));
	}
	function Gu(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, Fl === e && (Z & n) === n && (Hl === 4 || Hl === 3 && (Z & 62914560) === Z && 300 > Ce() - Zl ? !(Y & 2) && bu(e, 0) : Gl |= n, ql === Z && (ql = 0)), nd(e);
	}
	function Ku(e, t) {
		t === 0 && (t = Ge()), e = Yr(e, t), e !== null && (qe(e, t), nd(e));
	}
	function qu(e) {
		var t = e.memoizedState, n = 0;
		t !== null && (n = t.retryLane), Ku(e, n);
	}
	function Ju(e, t) {
		var n = 0;
		switch (e.tag) {
			case 31:
			case 13:
				var r = e.stateNode, a = e.memoizedState;
				a !== null && (n = a.retryLane);
				break;
			case 19:
				r = e.stateNode;
				break;
			case 22:
				r = e.stateNode._retryCache;
				break;
			default: throw Error(i(314));
		}
		r !== null && r.delete(t), Ku(e, n);
	}
	function Yu(e, t) {
		return ye(e, t);
	}
	var Xu = null, Zu = null, Qu = !1, $u = !1, ed = !1, td = 0;
	function nd(e) {
		e !== Zu && e.next === null && (Zu === null ? Xu = Zu = e : Zu = Zu.next = e), $u = !0, Qu || (Qu = !0, ld());
	}
	function rd(e, t) {
		if (!ed && $u) {
			ed = !0;
			do
				for (var n = !1, r = Xu; r !== null;) {
					if (!t) if (e !== 0) {
						var i = r.pendingLanes;
						if (i === 0) var a = 0;
						else {
							var o = r.suspendedLanes, s = r.pingedLanes;
							a = (1 << 31 - Pe(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0;
						}
						a !== 0 && (n = !0, cd(r, a));
					} else a = Z, a = He(r, r === Fl ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || Ue(r, a) || (n = !0, cd(r, a));
					r = r.next;
				}
			while (n);
			ed = !1;
		}
	}
	function id() {
		ad();
	}
	function ad() {
		$u = Qu = !1;
		var e = 0;
		td !== 0 && Wd() && (e = td);
		for (var t = Ce(), n = null, r = Xu; r !== null;) {
			var i = r.next, a = od(r, t);
			a === 0 ? (r.next = null, n === null ? Xu = i : n.next = i, i === null && (Zu = n)) : (n = r, (e !== 0 || a & 3) && ($u = !0)), r = i;
		}
		nu !== 0 && nu !== 5 || rd(e, !1), td !== 0 && (td = 0);
	}
	function od(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes & -62914561; 0 < a;) {
			var o = 31 - Pe(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = We(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = Fl, n = Z, n = He(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (Il === 2 || Il === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && be(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || Ue(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && be(r), $e(n)) {
				case 2:
				case 8:
					n = Ee;
					break;
				case 32:
					n = De;
					break;
				case 268435456:
					n = z;
					break;
				default: n = De;
			}
			return r = sd.bind(null, e), n = ye(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && be(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function sd(e, t) {
		if (nu !== 0 && nu !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (Bu() && e.callbackNode !== n) return null;
		var r = Z;
		return r = He(e, e === Fl ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (mu(e, r, t), od(e, Ce()), e.callbackNode != null && e.callbackNode === n ? sd.bind(null, e) : null);
	}
	function cd(e, t) {
		if (Bu()) return null;
		mu(e, t, !0);
	}
	function ld() {
		Jd(function() {
			Y & 6 ? ye(Te, id) : ad();
		});
	}
	function ud() {
		if (td === 0) {
			var e = ia;
			e === 0 && (e = ze, ze <<= 1, !(ze & 261888) && (ze = 256)), td = e;
		}
		return td;
	}
	function dd(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : Jt("" + e);
	}
	function fd(e, t) {
		var n = t.ownerDocument.createElement("input");
		return n.name = t.name, n.value = t.value, e.id && n.setAttribute("form", e.id), t.parentNode.insertBefore(n, t), e = new FormData(e), n.parentNode.removeChild(n), e;
	}
	function pd(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = dd((i[it] || null).action), o = r.submitter;
			o && (t = (t = o[it] || null) ? dd(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new gn("action", "action", null, r, i);
			e.push({
				event: s,
				listeners: [{
					instance: null,
					listener: function() {
						if (r.defaultPrevented) {
							if (td !== 0) {
								var e = o ? fd(i, o) : new FormData(i);
								ys(n, {
									pending: !0,
									data: e,
									method: i.method,
									action: a
								}, null, e);
							}
						} else typeof a == "function" && (s.preventDefault(), e = o ? fd(i, o) : new FormData(i), ys(n, {
							pending: !0,
							data: e,
							method: i.method,
							action: a
						}, a, e));
					},
					currentTarget: i
				}]
			});
		}
	}
	for (var md = 0; md < Br.length; md++) {
		var hd = Br[md];
		Vr(hd.toLowerCase(), "on" + (hd[0].toUpperCase() + hd.slice(1)));
	}
	Vr(Mr, "onAnimationEnd"), Vr(Nr, "onAnimationIteration"), Vr(Pr, "onAnimationStart"), Vr("dblclick", "onDoubleClick"), Vr("focusin", "onFocus"), Vr("focusout", "onBlur"), Vr(Fr, "onTransitionRun"), Vr(Ir, "onTransitionStart"), Vr(Lr, "onTransitionCancel"), Vr(Rr, "onTransitionEnd"), bt("onMouseEnter", ["mouseout", "mouseover"]), bt("onMouseLeave", ["mouseout", "mouseover"]), bt("onPointerEnter", ["pointerout", "pointerover"]), bt("onPointerLeave", ["pointerout", "pointerover"]), yt("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), yt("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), yt("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), yt("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), yt("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), yt("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
	var gd = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), _d = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(gd));
	function vd(e, t) {
		t = !!(t & 4);
		for (var n = 0; n < e.length; n++) {
			var r = e[n], i = r.event;
			r = r.listeners;
			a: {
				var a = void 0;
				if (t) for (var o = r.length - 1; 0 <= o; o--) {
					var s = r[o], c = s.instance, l = s.currentTarget;
					if (s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						Hr(e);
					}
					i.currentTarget = null, a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						Hr(e);
					}
					i.currentTarget = null, a = c;
				}
			}
		}
	}
	function Q(e, t) {
		var n = t[ot];
		n === void 0 && (n = t[ot] = /* @__PURE__ */ new Set());
		var r = e + "__bubble";
		n.has(r) || (Sd(t, e, 2, !1), n.add(r));
	}
	function yd(e, t, n) {
		var r = 0;
		t && (r |= 4), Sd(n, e, r, t);
	}
	var bd = "_reactListening" + Math.random().toString(36).slice(2);
	function xd(e) {
		if (!e[bd]) {
			e[bd] = !0, _t.forEach(function(t) {
				t !== "selectionchange" && (_d.has(t) || yd(t, !1, e), yd(t, !0, e));
			});
			var t = e.nodeType === 9 ? e : e.ownerDocument;
			t === null || t[bd] || (t[bd] = !0, yd("selectionchange", !1, t));
		}
	}
	function Sd(e, t, n, r) {
		switch (mp(t)) {
			case 2:
				var i = cp;
				break;
			case 8:
				i = lp;
				break;
			default: i = up;
		}
		n = i.bind(null, t, n, e), i = void 0, !an || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
			capture: !0,
			passive: i
		}) : i === void 0 ? e.addEventListener(t, n, !1) : e.addEventListener(t, n, { passive: i });
	}
	function Cd(e, t, n, r, i) {
		var a = r;
		if (!(t & 1) && !(t & 2) && r !== null) a: for (;;) {
			if (r === null) return;
			var s = r.tag;
			if (s === 3 || s === 4) {
				var c = r.stateNode.containerInfo;
				if (c === i) break;
				if (s === 4) for (s = r.return; s !== null;) {
					var l = s.tag;
					if ((l === 3 || l === 4) && s.stateNode.containerInfo === i) return;
					s = s.return;
				}
				for (; c !== null;) {
					if (s = ft(c), s === null) return;
					if (l = s.tag, l === 5 || l === 6 || l === 26 || l === 27) {
						r = a = s;
						continue a;
					}
					c = c.parentNode;
				}
			}
			r = r.return;
		}
		nn(function() {
			var r = a, i = Zt(n), s = [];
			a: {
				var c = zr.get(e);
				if (c !== void 0) {
					var l = gn, u = e;
					switch (e) {
						case "keypress": if (dn(n) === 0) break a;
						case "keydown":
						case "keyup":
							l = Nn;
							break;
						case "focusin":
							u = "focus", l = wn;
							break;
						case "focusout":
							u = "blur", l = wn;
							break;
						case "beforeblur":
						case "afterblur":
							l = wn;
							break;
						case "click": if (n.button === 2) break a;
						case "auxclick":
						case "dblclick":
						case "mousedown":
						case "mousemove":
						case "mouseup":
						case "mouseout":
						case "mouseover":
						case "contextmenu":
							l = Sn;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							l = Cn;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							l = Fn;
							break;
						case Mr:
						case Nr:
						case Pr:
							l = Tn;
							break;
						case Rr:
							l = In;
							break;
						case "scroll":
						case "scrollend":
							l = vn;
							break;
						case "wheel":
							l = Ln;
							break;
						case "copy":
						case "cut":
						case "paste":
							l = En;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							l = Pn;
							break;
						case "toggle":
						case "beforetoggle": l = Rn;
					}
					var d = !!(t & 4), f = !d && (e === "scroll" || e === "scrollend"), p = d ? c === null ? null : c + "Capture" : c;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = H(m, p), g != null && d.push(wd(m, g, h))), f) break;
						m = m.return;
					}
					0 < d.length && (c = new l(c, u, null, n, i), s.push({
						event: c,
						listeners: d
					}));
				}
			}
			if (!(t & 7)) {
				a: {
					if (c = e === "mouseover" || e === "pointerover", l = e === "mouseout" || e === "pointerout", c && n !== Xt && (u = n.relatedTarget || n.fromElement) && (ft(u) || u[at])) break a;
					if ((l || c) && (c = i.window === i ? i : (c = i.ownerDocument) ? c.defaultView || c.parentWindow : window, l ? (u = n.relatedTarget || n.toElement, l = r, u = u ? ft(u) : null, u !== null && (f = o(u), d = u.tag, u !== f || d !== 5 && d !== 27 && d !== 6) && (u = null)) : (l = null, u = r), l !== u)) {
						if (d = Sn, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = Pn, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = l == null ? c : mt(l), h = u == null ? c : mt(u), c = new d(g, m + "leave", l, n, i), c.target = f, c.relatedTarget = h, g = null, ft(i) === r && (d = new d(p, m + "enter", u, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, l && u) b: {
							for (d = Ed, p = l, m = u, h = 0, g = p; g; g = d(g)) h++;
							g = 0;
							for (var _ = m; _; _ = d(_)) g++;
							for (; 0 < h - g;) p = d(p), h--;
							for (; 0 < g - h;) m = d(m), g--;
							for (; h--;) {
								if (p === m || m !== null && p === m.alternate) {
									d = p;
									break b;
								}
								p = d(p), m = d(m);
							}
							d = null;
						}
						else d = null;
						l !== null && Dd(s, c, l, d, !1), u !== null && f !== null && Dd(s, f, u, d, !0);
					}
				}
				a: {
					if (c = r ? mt(r) : window, l = c.nodeName && c.nodeName.toLowerCase(), l === "select" || l === "input" && c.type === "file") var v = rr;
					else if (W(c)) if (ir) v = fr;
					else {
						v = ur;
						var y = lr;
					}
					else l = c.nodeName, !l || l.toLowerCase() !== "input" || c.type !== "checkbox" && c.type !== "radio" ? r && Gt(r.elementType) && (v = rr) : v = dr;
					if (v &&= v(e, r)) {
						Qn(s, v, n, i);
						break a;
					}
					y && y(e, c, r), e === "focusout" && r && c.type === "number" && r.memoizedProps.value != null && Rt(c, "number", c.value);
				}
				switch (y = r ? mt(r) : window, e) {
					case "focusin":
						(W(y) || y.contentEditable === "true") && (Sr = y, Cr = r, wr = null);
						break;
					case "focusout":
						wr = Cr = Sr = null;
						break;
					case "mousedown":
						Tr = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						Tr = !1, Er(s, n, i);
						break;
					case "selectionchange": if (xr) break;
					case "keydown":
					case "keyup": Er(s, n, i);
				}
				var b;
				if (Bn) b: {
					switch (e) {
						case "compositionstart":
							var x = "onCompositionStart";
							break b;
						case "compositionend":
							x = "onCompositionEnd";
							break b;
						case "compositionupdate":
							x = "onCompositionUpdate";
							break b;
					}
					x = void 0;
				}
				else Jn ? Kn(e, n) && (x = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (x = "onCompositionStart");
				x && (Un && n.locale !== "ko" && (Jn || x !== "onCompositionStart" ? x === "onCompositionEnd" && Jn && (b = un()) : (sn = i, cn = "value" in sn ? sn.value : sn.textContent, Jn = !0)), y = Td(r, x), 0 < y.length && (x = new Dn(x, e, null, n, i), s.push({
					event: x,
					listeners: y
				}), b ? x.data = b : (b = qn(n), b !== null && (x.data = b)))), (b = Hn ? Yn(e, n) : Xn(e, n)) && (x = Td(r, "onBeforeInput"), 0 < x.length && (y = new Dn("onBeforeInput", "beforeinput", null, n, i), s.push({
					event: y,
					listeners: x
				}), y.data = b)), pd(s, e, r, n, i);
			}
			vd(s, t);
		});
	}
	function wd(e, t, n) {
		return {
			instance: e,
			listener: t,
			currentTarget: n
		};
	}
	function Td(e, t) {
		for (var n = t + "Capture", r = []; e !== null;) {
			var i = e, a = i.stateNode;
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = H(e, n), i != null && r.unshift(wd(e, i, a)), i = H(e, t), i != null && r.push(wd(e, i, a))), e.tag === 3) return r;
			e = e.return;
		}
		return [];
	}
	function Ed(e) {
		if (e === null) return null;
		do
			e = e.return;
		while (e && e.tag !== 5 && e.tag !== 27);
		return e || null;
	}
	function Dd(e, t, n, r, i) {
		for (var a = t._reactName, o = []; n !== null && n !== r;) {
			var s = n, c = s.alternate, l = s.stateNode;
			if (s = s.tag, c !== null && c === r) break;
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = H(n, a), l != null && o.unshift(wd(n, l, c))) : i || (l = H(n, a), l != null && o.push(wd(n, l, c)))), n = n.return;
		}
		o.length !== 0 && e.push({
			event: t,
			listeners: o
		});
	}
	var Od = /\r\n?/g, kd = /\u0000|\uFFFD/g;
	function Ad(e) {
		return (typeof e == "string" ? e : "" + e).replace(Od, "\n").replace(kd, "");
	}
	function jd(e, t) {
		return t = Ad(t), Ad(e) === t;
	}
	function Md(e, t, n, r, a, o) {
		switch (n) {
			case "children":
				typeof r == "string" ? t === "body" || t === "textarea" && r === "" || Vt(e, r) : (typeof r == "number" || typeof r == "bigint") && t !== "body" && Vt(e, "" + r);
				break;
			case "className":
				Et(e, "class", r);
				break;
			case "tabIndex":
				Et(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				Et(e, n, r);
				break;
			case "style":
				Wt(e, r, o);
				break;
			case "data": if (t !== "object") {
				Et(e, "data", r);
				break;
			}
			case "src":
			case "href":
				if (r === "" && (t !== "a" || n !== "href")) {
					e.removeAttribute(n);
					break;
				}
				if (r == null || typeof r == "function" || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = Jt("" + r), e.setAttribute(n, r);
				break;
			case "action":
			case "formAction":
				if (typeof r == "function") {
					e.setAttribute(n, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
					break;
				}
				if (typeof o == "function" && (n === "formAction" ? (t !== "input" && Md(e, t, "name", a.name, a, null), Md(e, t, "formEncType", a.formEncType, a, null), Md(e, t, "formMethod", a.formMethod, a, null), Md(e, t, "formTarget", a.formTarget, a, null)) : (Md(e, t, "encType", a.encType, a, null), Md(e, t, "method", a.method, a, null), Md(e, t, "target", a.target, a, null))), r == null || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = Jt("" + r), e.setAttribute(n, r);
				break;
			case "onClick":
				r != null && (e.onclick = Yt);
				break;
			case "onScroll":
				r != null && Q("scroll", e);
				break;
			case "onScrollEnd":
				r != null && Q("scrollend", e);
				break;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						e.innerHTML = n;
					}
				}
				break;
			case "multiple":
				e.multiple = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "muted":
				e.muted = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "defaultValue":
			case "defaultChecked":
			case "innerHTML":
			case "ref": break;
			case "autoFocus": break;
			case "xlinkHref":
				if (r == null || typeof r == "function" || typeof r == "boolean" || typeof r == "symbol") {
					e.removeAttribute("xlink:href");
					break;
				}
				n = Jt("" + r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
				break;
			case "contentEditable":
			case "spellCheck":
			case "draggable":
			case "value":
			case "autoReverse":
			case "externalResourcesRequired":
			case "focusable":
			case "preserveAlpha":
				r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, "" + r) : e.removeAttribute(n);
				break;
			case "inert":
			case "allowFullScreen":
			case "async":
			case "autoPlay":
			case "controls":
			case "default":
			case "defer":
			case "disabled":
			case "disablePictureInPicture":
			case "disableRemotePlayback":
			case "formNoValidate":
			case "hidden":
			case "loop":
			case "noModule":
			case "noValidate":
			case "open":
			case "playsInline":
			case "readOnly":
			case "required":
			case "reversed":
			case "scoped":
			case "seamless":
			case "itemScope":
				r && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, "") : e.removeAttribute(n);
				break;
			case "capture":
			case "download":
				!0 === r ? e.setAttribute(n, "") : !1 !== r && r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "cols":
			case "rows":
			case "size":
			case "span":
				r != null && typeof r != "function" && typeof r != "symbol" && !isNaN(r) && 1 <= r ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "rowSpan":
			case "start":
				r == null || typeof r == "function" || typeof r == "symbol" || isNaN(r) ? e.removeAttribute(n) : e.setAttribute(n, r);
				break;
			case "popover":
				Q("beforetoggle", e), Q("toggle", e), Tt(e, "popover", r);
				break;
			case "xlinkActuate":
				Dt(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
				break;
			case "xlinkArcrole":
				Dt(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
				break;
			case "xlinkRole":
				Dt(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
				break;
			case "xlinkShow":
				Dt(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
				break;
			case "xlinkTitle":
				Dt(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
				break;
			case "xlinkType":
				Dt(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
				break;
			case "xmlBase":
				Dt(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
				break;
			case "xmlLang":
				Dt(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
				break;
			case "xmlSpace":
				Dt(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
				break;
			case "is":
				Tt(e, "is", r);
				break;
			case "innerText":
			case "textContent": break;
			default: (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") && (n = Kt.get(n) || n, Tt(e, n, r));
		}
	}
	function Nd(e, t, n, r, a, o) {
		switch (n) {
			case "style":
				Wt(e, r, o);
				break;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						e.innerHTML = n;
					}
				}
				break;
			case "children":
				typeof r == "string" ? Vt(e, r) : (typeof r == "number" || typeof r == "bigint") && Vt(e, "" + r);
				break;
			case "onScroll":
				r != null && Q("scroll", e);
				break;
			case "onScrollEnd":
				r != null && Q("scrollend", e);
				break;
			case "onClick":
				r != null && (e.onclick = Yt);
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": break;
			case "innerText":
			case "textContent": break;
			default: if (!vt.hasOwnProperty(n)) a: {
				if (n[0] === "o" && n[1] === "n" && (a = n.endsWith("Capture"), t = n.slice(2, a ? n.length - 7 : void 0), o = e[it] || null, o = o == null ? null : o[n], typeof o == "function" && e.removeEventListener(t, o, a), typeof r == "function")) {
					typeof o != "function" && o !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(t, r, a);
					break a;
				}
				n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : Tt(e, n, r);
			}
		}
	}
	function Pd(e, t, n) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "img":
				Q("error", e), Q("load", e);
				var r = !1, a = !1, o;
				for (o in n) if (n.hasOwnProperty(o)) {
					var s = n[o];
					if (s != null) switch (o) {
						case "src":
							r = !0;
							break;
						case "srcSet":
							a = !0;
							break;
						case "children":
						case "dangerouslySetInnerHTML": throw Error(i(137, t));
						default: Md(e, t, o, s, n, null);
					}
				}
				a && Md(e, t, "srcSet", n.srcSet, n, null), r && Md(e, t, "src", n.src, n, null);
				return;
			case "input":
				Q("invalid", e);
				var c = o = s = a = null, l = null, u = null;
				for (r in n) if (n.hasOwnProperty(r)) {
					var d = n[r];
					if (d != null) switch (r) {
						case "name":
							a = d;
							break;
						case "type":
							s = d;
							break;
						case "checked":
							l = d;
							break;
						case "defaultChecked":
							u = d;
							break;
						case "value":
							o = d;
							break;
						case "defaultValue":
							c = d;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (d != null) throw Error(i(137, t));
							break;
						default: Md(e, t, r, d, n, null);
					}
				}
				Lt(e, o, c, l, u, s, a, !1);
				return;
			case "select":
				for (a in Q("invalid", e), r = s = o = null, n) if (n.hasOwnProperty(a) && (c = n[a], c != null)) switch (a) {
					case "value":
						o = c;
						break;
					case "defaultValue":
						s = c;
						break;
					case "multiple": r = c;
					default: Md(e, t, a, c, n, null);
				}
				t = o, n = s, e.multiple = !!r, t == null ? n != null && zt(e, !!r, n, !0) : zt(e, !!r, t, !1);
				return;
			case "textarea":
				for (s in Q("invalid", e), o = a = r = null, n) if (n.hasOwnProperty(s) && (c = n[s], c != null)) switch (s) {
					case "value":
						r = c;
						break;
					case "defaultValue":
						a = c;
						break;
					case "children":
						o = c;
						break;
					case "dangerouslySetInnerHTML":
						if (c != null) throw Error(i(91));
						break;
					default: Md(e, t, s, c, n, null);
				}
				Bt(e, r, a, o);
				return;
			case "option":
				for (l in n) if (n.hasOwnProperty(l) && (r = n[l], r != null)) switch (l) {
					case "selected":
						e.selected = r && typeof r != "function" && typeof r != "symbol";
						break;
					default: Md(e, t, l, r, n, null);
				}
				return;
			case "dialog":
				Q("beforetoggle", e), Q("toggle", e), Q("cancel", e), Q("close", e);
				break;
			case "iframe":
			case "object":
				Q("load", e);
				break;
			case "video":
			case "audio":
				for (r = 0; r < gd.length; r++) Q(gd[r], e);
				break;
			case "image":
				Q("error", e), Q("load", e);
				break;
			case "details":
				Q("toggle", e);
				break;
			case "embed":
			case "source":
			case "link": Q("error", e), Q("load", e);
			case "area":
			case "base":
			case "br":
			case "col":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "track":
			case "wbr":
			case "menuitem":
				for (u in n) if (n.hasOwnProperty(u) && (r = n[u], r != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML": throw Error(i(137, t));
					default: Md(e, t, u, r, n, null);
				}
				return;
			default: if (Gt(t)) {
				for (d in n) n.hasOwnProperty(d) && (r = n[d], r !== void 0 && Nd(e, t, d, r, n, void 0));
				return;
			}
		}
		for (c in n) n.hasOwnProperty(c) && (r = n[c], r != null && Md(e, t, c, r, n, null));
	}
	function Fd(e, t, n, r) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "input":
				var a = null, o = null, s = null, c = null, l = null, u = null, d = null;
				for (m in n) {
					var f = n[m];
					if (n.hasOwnProperty(m) && f != null) switch (m) {
						case "checked": break;
						case "value": break;
						case "defaultValue": l = f;
						default: r.hasOwnProperty(m) || Md(e, t, m, null, r, f);
					}
				}
				for (var p in r) {
					var m = r[p];
					if (f = n[p], r.hasOwnProperty(p) && (m != null || f != null)) switch (p) {
						case "type":
							o = m;
							break;
						case "name":
							a = m;
							break;
						case "checked":
							u = m;
							break;
						case "defaultChecked":
							d = m;
							break;
						case "value":
							s = m;
							break;
						case "defaultValue":
							c = m;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (m != null) throw Error(i(137, t));
							break;
						default: m !== f && Md(e, t, p, m, r, f);
					}
				}
				It(e, s, c, l, u, d, o, a);
				return;
			case "select":
				for (o in m = s = c = p = null, n) if (l = n[o], n.hasOwnProperty(o) && l != null) switch (o) {
					case "value": break;
					case "multiple": m = l;
					default: r.hasOwnProperty(o) || Md(e, t, o, null, r, l);
				}
				for (a in r) if (o = r[a], l = n[a], r.hasOwnProperty(a) && (o != null || l != null)) switch (a) {
					case "value":
						p = o;
						break;
					case "defaultValue":
						c = o;
						break;
					case "multiple": s = o;
					default: o !== l && Md(e, t, a, o, r, l);
				}
				t = c, n = s, r = m, p == null ? !!r != !!n && (t == null ? zt(e, !!n, n ? [] : "", !1) : zt(e, !!n, t, !0)) : zt(e, !!n, p, !1);
				return;
			case "textarea":
				for (c in m = p = null, n) if (a = n[c], n.hasOwnProperty(c) && a != null && !r.hasOwnProperty(c)) switch (c) {
					case "value": break;
					case "children": break;
					default: Md(e, t, c, null, r, a);
				}
				for (s in r) if (a = r[s], o = n[s], r.hasOwnProperty(s) && (a != null || o != null)) switch (s) {
					case "value":
						p = a;
						break;
					case "defaultValue":
						m = a;
						break;
					case "children": break;
					case "dangerouslySetInnerHTML":
						if (a != null) throw Error(i(91));
						break;
					default: a !== o && Md(e, t, s, a, r, o);
				}
				V(e, p, m);
				return;
			case "option":
				for (var h in n) if (p = n[h], n.hasOwnProperty(h) && p != null && !r.hasOwnProperty(h)) switch (h) {
					case "selected":
						e.selected = !1;
						break;
					default: Md(e, t, h, null, r, p);
				}
				for (l in r) if (p = r[l], m = n[l], r.hasOwnProperty(l) && p !== m && (p != null || m != null)) switch (l) {
					case "selected":
						e.selected = p && typeof p != "function" && typeof p != "symbol";
						break;
					default: Md(e, t, l, p, r, m);
				}
				return;
			case "img":
			case "link":
			case "area":
			case "base":
			case "br":
			case "col":
			case "embed":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "source":
			case "track":
			case "wbr":
			case "menuitem":
				for (var g in n) p = n[g], n.hasOwnProperty(g) && p != null && !r.hasOwnProperty(g) && Md(e, t, g, null, r, p);
				for (u in r) if (p = r[u], m = n[u], r.hasOwnProperty(u) && p !== m && (p != null || m != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML":
						if (p != null) throw Error(i(137, t));
						break;
					default: Md(e, t, u, p, r, m);
				}
				return;
			default: if (Gt(t)) {
				for (var _ in n) p = n[_], n.hasOwnProperty(_) && p !== void 0 && !r.hasOwnProperty(_) && Nd(e, t, _, void 0, r, p);
				for (d in r) p = r[d], m = n[d], !r.hasOwnProperty(d) || p === m || p === void 0 && m === void 0 || Nd(e, t, d, p, r, m);
				return;
			}
		}
		for (var v in n) p = n[v], n.hasOwnProperty(v) && p != null && !r.hasOwnProperty(v) && Md(e, t, v, null, r, p);
		for (f in r) p = r[f], m = n[f], !r.hasOwnProperty(f) || p === m || p == null && m == null || Md(e, t, f, p, r, m);
	}
	function Id(e) {
		switch (e) {
			case "css":
			case "script":
			case "font":
			case "img":
			case "image":
			case "input":
			case "link": return !0;
			default: return !1;
		}
	}
	function Ld() {
		if (typeof performance.getEntriesByType == "function") {
			for (var e = 0, t = 0, n = performance.getEntriesByType("resource"), r = 0; r < n.length; r++) {
				var i = n[r], a = i.transferSize, o = i.initiatorType, s = i.duration;
				if (a && s && Id(o)) {
					for (o = 0, s = i.responseEnd, r += 1; r < n.length; r++) {
						var c = n[r], l = c.startTime;
						if (l > s) break;
						var u = c.transferSize, d = c.initiatorType;
						u && Id(d) && (c = c.responseEnd, o += u * (c < s ? 1 : (s - l) / (c - l)));
					}
					if (--r, t += 8 * (a + o) / (i.duration / 1e3), e++, 10 < e) break;
				}
			}
			if (0 < e) return t / e / 1e6;
		}
		return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
	}
	var Rd = null, zd = null;
	function Bd(e) {
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	function Vd(e) {
		switch (e) {
			case "http://www.w3.org/2000/svg": return 1;
			case "http://www.w3.org/1998/Math/MathML": return 2;
			default: return 0;
		}
	}
	function Hd(e, t) {
		if (e === 0) switch (t) {
			case "svg": return 1;
			case "math": return 2;
			default: return 0;
		}
		return e === 1 && t === "foreignObject" ? 0 : e;
	}
	function $(e, t) {
		return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
	}
	var Ud = null;
	function Wd() {
		var e = window.event;
		return e && e.type === "popstate" ? e !== Ud && (Ud = e, !0) : (Ud = null, !1);
	}
	var Gd = typeof setTimeout == "function" ? setTimeout : void 0, Kd = typeof clearTimeout == "function" ? clearTimeout : void 0, qd = typeof Promise == "function" ? Promise : void 0, Jd = typeof queueMicrotask == "function" ? queueMicrotask : qd === void 0 ? Gd : function(e) {
		return qd.resolve(null).then(e).catch(Yd);
	};
	function Yd(e) {
		setTimeout(function() {
			throw e;
		});
	}
	function Xd(e) {
		return e === "head";
	}
	function Zd(e, t) {
		var n = t, r = 0;
		do {
			var i = n.nextSibling;
			if (e.removeChild(n), i && i.nodeType === 8) if (n = i.data, n === "/$" || n === "/&") {
				if (r === 0) {
					e.removeChild(i), Np(t);
					return;
				}
				r--;
			} else if (n === "$" || n === "$?" || n === "$~" || n === "$!" || n === "&") r++;
			else if (n === "html") pf(e.ownerDocument.documentElement);
			else if (n === "head") {
				n = e.ownerDocument.head, pf(n);
				for (var a = n.firstChild; a;) {
					var o = a.nextSibling, s = a.nodeName;
					a[ut] || s === "SCRIPT" || s === "STYLE" || s === "LINK" && a.rel.toLowerCase() === "stylesheet" || n.removeChild(a), a = o;
				}
			} else n === "body" && pf(e.ownerDocument.body);
			n = i;
		} while (n);
		Np(t);
	}
	function Qd(e, t) {
		var n = e;
		e = 0;
		do {
			var r = n.nextSibling;
			if (n.nodeType === 1 ? t ? (n._stashedDisplay = n.style.display, n.style.display = "none") : (n.style.display = n._stashedDisplay || "", n.getAttribute("style") === "" && n.removeAttribute("style")) : n.nodeType === 3 && (t ? (n._stashedText = n.nodeValue, n.nodeValue = "") : n.nodeValue = n._stashedText || ""), r && r.nodeType === 8) if (n = r.data, n === "/$") {
				if (e === 0) break;
				e--;
			} else n !== "$" && n !== "$?" && n !== "$~" && n !== "$!" || e++;
			n = r;
		} while (n);
	}
	function $d(e) {
		var t = e.firstChild;
		for (t && t.nodeType === 10 && (t = t.nextSibling); t;) {
			var n = t;
			switch (t = t.nextSibling, n.nodeName) {
				case "HTML":
				case "HEAD":
				case "BODY":
					$d(n), dt(n);
					continue;
				case "SCRIPT":
				case "STYLE": continue;
				case "LINK": if (n.rel.toLowerCase() === "stylesheet") continue;
			}
			e.removeChild(n);
		}
	}
	function ef(e, t, n, r) {
		for (; e.nodeType === 1;) {
			var i = n;
			if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
				if (!r && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
			} else if (!r) if (t === "input" && e.type === "hidden") {
				var a = i.name == null ? null : "" + i.name;
				if (i.type === "hidden" && e.getAttribute("name") === a) return e;
			} else return e;
			else if (!e[ut]) switch (t) {
				case "meta":
					if (!e.hasAttribute("itemprop")) break;
					return e;
				case "link":
					if (a = e.getAttribute("rel"), a === "stylesheet" && e.hasAttribute("data-precedence") || a !== i.rel || e.getAttribute("href") !== (i.href == null || i.href === "" ? null : i.href) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin) || e.getAttribute("title") !== (i.title == null ? null : i.title)) break;
					return e;
				case "style":
					if (e.hasAttribute("data-precedence")) break;
					return e;
				case "script":
					if (a = e.getAttribute("src"), (a !== (i.src == null ? null : i.src) || e.getAttribute("type") !== (i.type == null ? null : i.type) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin)) && a && e.hasAttribute("async") && !e.hasAttribute("itemprop")) break;
					return e;
				default: return e;
			}
			if (e = cf(e.nextSibling), e === null) break;
		}
		return null;
	}
	function nf(e, t, n) {
		if (t === "") return null;
		for (; e.nodeType !== 3;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !n || (e = cf(e.nextSibling), e === null)) return null;
		return e;
	}
	function rf(e, t) {
		for (; e.nodeType !== 8;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = cf(e.nextSibling), e === null)) return null;
		return e;
	}
	function af(e) {
		return e.data === "$?" || e.data === "$~";
	}
	function of(e) {
		return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
	}
	function sf(e, t) {
		var n = e.ownerDocument;
		if (e.data === "$~") e._reactRetry = t;
		else if (e.data !== "$?" || n.readyState !== "loading") t();
		else {
			var r = function() {
				t(), n.removeEventListener("DOMContentLoaded", r);
			};
			n.addEventListener("DOMContentLoaded", r), e._reactRetry = r;
		}
	}
	function cf(e) {
		for (; e != null; e = e.nextSibling) {
			var t = e.nodeType;
			if (t === 1 || t === 3) break;
			if (t === 8) {
				if (t = e.data, t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F") break;
				if (t === "/$" || t === "/&") return null;
			}
		}
		return e;
	}
	var lf = null;
	function uf(e) {
		e = e.nextSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "/$" || n === "/&") {
					if (t === 0) return cf(e.nextSibling);
					t--;
				} else n !== "$" && n !== "$!" && n !== "$?" && n !== "$~" && n !== "&" || t++;
			}
			e = e.nextSibling;
		}
		return null;
	}
	function df(e) {
		e = e.previousSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "$" || n === "$!" || n === "$?" || n === "$~" || n === "&") {
					if (t === 0) return e;
					t--;
				} else n !== "/$" && n !== "/&" || t++;
			}
			e = e.previousSibling;
		}
		return null;
	}
	function ff(e, t, n) {
		switch (t = Bd(n), e) {
			case "html":
				if (e = t.documentElement, !e) throw Error(i(452));
				return e;
			case "head":
				if (e = t.head, !e) throw Error(i(453));
				return e;
			case "body":
				if (e = t.body, !e) throw Error(i(454));
				return e;
			default: throw Error(i(451));
		}
	}
	function pf(e) {
		for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
		dt(e);
	}
	var mf = /* @__PURE__ */ new Map(), hf = /* @__PURE__ */ new Set();
	function gf(e) {
		return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
	}
	var _f = P.d;
	P.d = {
		f: vf,
		r: yf,
		D: Sf,
		C: Cf,
		L: wf,
		m: Tf,
		X: Df,
		S: Ef,
		M: Of
	};
	function vf() {
		var e = _f.f(), t = vu();
		return e || t;
	}
	function yf(e) {
		var t = pt(e);
		t !== null && t.tag === 5 && t.type === "form" ? xs(t) : _f.r(e);
	}
	var bf = typeof document > "u" ? null : document;
	function xf(e, t, n) {
		var r = bf;
		if (r && typeof t == "string" && t) {
			var i = Ft(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), hf.has(i) || (hf.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), Pd(t, "link", e), gt(t), r.head.appendChild(t)));
		}
	}
	function Sf(e) {
		_f.D(e), xf("dns-prefetch", e, null);
	}
	function Cf(e, t) {
		_f.C(e, t), xf("preconnect", e, t);
	}
	function wf(e, t, n) {
		_f.L(e, t, n);
		var r = bf;
		if (r && e && t) {
			var i = "link[rel=\"preload\"][as=\"" + Ft(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + Ft(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + Ft(n.imageSizes) + "\"]")) : i += "[href=\"" + Ft(e) + "\"]";
			var a = i;
			switch (t) {
				case "style":
					a = Af(e);
					break;
				case "script": a = Pf(e);
			}
			mf.has(a) || (e = f({
				rel: "preload",
				href: t === "image" && n && n.imageSrcSet ? void 0 : e,
				as: t
			}, n), mf.set(a, e), r.querySelector(i) !== null || t === "style" && r.querySelector(jf(a)) || t === "script" && r.querySelector(Ff(a)) || (t = r.createElement("link"), Pd(t, "link", e), gt(t), r.head.appendChild(t)));
		}
	}
	function Tf(e, t) {
		_f.m(e, t);
		var n = bf;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + Ft(r) + "\"][href=\"" + Ft(e) + "\"]", a = i;
			switch (r) {
				case "audioworklet":
				case "paintworklet":
				case "serviceworker":
				case "sharedworker":
				case "worker":
				case "script": a = Pf(e);
			}
			if (!mf.has(a) && (e = f({
				rel: "modulepreload",
				href: e
			}, t), mf.set(a, e), n.querySelector(i) === null)) {
				switch (r) {
					case "audioworklet":
					case "paintworklet":
					case "serviceworker":
					case "sharedworker":
					case "worker":
					case "script": if (n.querySelector(Ff(a))) return;
				}
				r = n.createElement("link"), Pd(r, "link", e), gt(r), n.head.appendChild(r);
			}
		}
	}
	function Ef(e, t, n) {
		_f.S(e, t, n);
		var r = bf;
		if (r && e) {
			var i = ht(r).hoistableStyles, a = Af(e);
			t ||= "default";
			var o = i.get(a);
			if (!o) {
				var s = {
					loading: 0,
					preload: null
				};
				if (o = r.querySelector(jf(a))) s.loading = 5;
				else {
					e = f({
						rel: "stylesheet",
						href: e,
						"data-precedence": t
					}, n), (n = mf.get(a)) && Rf(e, n);
					var c = o = r.createElement("link");
					gt(c), Pd(c, "link", e), c._p = new Promise(function(e, t) {
						c.onload = e, c.onerror = t;
					}), c.addEventListener("load", function() {
						s.loading |= 1;
					}), c.addEventListener("error", function() {
						s.loading |= 2;
					}), s.loading |= 4, Lf(o, t, r);
				}
				o = {
					type: "stylesheet",
					instance: o,
					count: 1,
					state: s
				}, i.set(a, o);
			}
		}
	}
	function Df(e, t) {
		_f.X(e, t);
		var n = bf;
		if (n && e) {
			var r = ht(n).hoistableScripts, i = Pf(e), a = r.get(i);
			a || (a = n.querySelector(Ff(i)), a || (e = f({
				src: e,
				async: !0
			}, t), (t = mf.get(i)) && zf(e, t), a = n.createElement("script"), gt(a), Pd(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Of(e, t) {
		_f.M(e, t);
		var n = bf;
		if (n && e) {
			var r = ht(n).hoistableScripts, i = Pf(e), a = r.get(i);
			a || (a = n.querySelector(Ff(i)), a || (e = f({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = mf.get(i)) && zf(e, t), a = n.createElement("script"), gt(a), Pd(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function kf(e, t, n, r) {
		var a = (a = oe.current) ? gf(a) : null;
		if (!a) throw Error(i(446));
		switch (e) {
			case "meta":
			case "title": return null;
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (t = Af(n.href), n = ht(a).hoistableStyles, r = n.get(t), r || (r = {
				type: "style",
				instance: null,
				count: 0,
				state: null
			}, n.set(t, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			case "link":
				if (n.rel === "stylesheet" && typeof n.href == "string" && typeof n.precedence == "string") {
					e = Af(n.href);
					var o = ht(a).hoistableStyles, s = o.get(e);
					if (s || (a = a.ownerDocument || a, s = {
						type: "stylesheet",
						instance: null,
						count: 0,
						state: {
							loading: 0,
							preload: null
						}
					}, o.set(e, s), (o = a.querySelector(jf(e))) && !o._p && (s.instance = o, s.state.loading = 5), mf.has(e) || (n = {
						rel: "preload",
						as: "style",
						href: n.href,
						crossOrigin: n.crossOrigin,
						integrity: n.integrity,
						media: n.media,
						hrefLang: n.hrefLang,
						referrerPolicy: n.referrerPolicy
					}, mf.set(e, n), o || Nf(a, e, n, s.state))), t && r === null) throw Error(i(528, ""));
					return s;
				}
				if (t && r !== null) throw Error(i(529, ""));
				return null;
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = Pf(n), n = ht(a).hoistableScripts, r = n.get(t), r || (r = {
				type: "script",
				instance: null,
				count: 0,
				state: null
			}, n.set(t, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			default: throw Error(i(444, e));
		}
	}
	function Af(e) {
		return "href=\"" + Ft(e) + "\"";
	}
	function jf(e) {
		return "link[rel=\"stylesheet\"][" + e + "]";
	}
	function Mf(e) {
		return f({}, e, {
			"data-precedence": e.precedence,
			precedence: null
		});
	}
	function Nf(e, t, n, r) {
		e.querySelector("link[rel=\"preload\"][as=\"style\"][" + t + "]") ? r.loading = 1 : (t = e.createElement("link"), r.preload = t, t.addEventListener("load", function() {
			return r.loading |= 1;
		}), t.addEventListener("error", function() {
			return r.loading |= 2;
		}), Pd(t, "link", n), gt(t), e.head.appendChild(t));
	}
	function Pf(e) {
		return "[src=\"" + Ft(e) + "\"]";
	}
	function Ff(e) {
		return "script[async]" + e;
	}
	function If(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + Ft(n.href) + "\"]");
				if (r) return t.instance = r, gt(r), r;
				var a = f({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), gt(r), Pd(r, "style", a), Lf(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				a = Af(n.href);
				var o = e.querySelector(jf(a));
				if (o) return t.state.loading |= 4, t.instance = o, gt(o), o;
				r = Mf(n), (a = mf.get(a)) && Rf(r, a), o = (e.ownerDocument || e).createElement("link"), gt(o);
				var s = o;
				return s._p = new Promise(function(e, t) {
					s.onload = e, s.onerror = t;
				}), Pd(o, "link", r), t.state.loading |= 4, Lf(o, n.precedence, e), t.instance = o;
			case "script": return o = Pf(n.src), (a = e.querySelector(Ff(o))) ? (t.instance = a, gt(a), a) : (r = n, (a = mf.get(o)) && (r = f({}, n), zf(r, a)), e = e.ownerDocument || e, a = e.createElement("script"), gt(a), Pd(a, "link", r), e.head.appendChild(a), t.instance = a);
			case "void": return null;
			default: throw Error(i(443, t.type));
		}
		else t.type === "stylesheet" && !(t.state.loading & 4) && (r = t.instance, t.state.loading |= 4, Lf(r, n.precedence, e));
		return t.instance;
	}
	function Lf(e, t, n) {
		for (var r = n.querySelectorAll("link[rel=\"stylesheet\"][data-precedence],style[data-precedence]"), i = r.length ? r[r.length - 1] : null, a = i, o = 0; o < r.length; o++) {
			var s = r[o];
			if (s.dataset.precedence === t) a = s;
			else if (a !== i) break;
		}
		a ? a.parentNode.insertBefore(e, a.nextSibling) : (t = n.nodeType === 9 ? n.head : n, t.insertBefore(e, t.firstChild));
	}
	function Rf(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.title ??= t.title;
	}
	function zf(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.integrity ??= t.integrity;
	}
	var Bf = null;
	function Vf(e, t, n) {
		if (Bf === null) {
			var r = /* @__PURE__ */ new Map(), i = Bf = /* @__PURE__ */ new Map();
			i.set(n, r);
		} else i = Bf, r = i.get(n), r || (r = /* @__PURE__ */ new Map(), i.set(n, r));
		if (r.has(e)) return r;
		for (r.set(e, null), n = n.getElementsByTagName(e), i = 0; i < n.length; i++) {
			var a = n[i];
			if (!(a[ut] || a[rt] || e === "link" && a.getAttribute("rel") === "stylesheet") && a.namespaceURI !== "http://www.w3.org/2000/svg") {
				var o = a.getAttribute(t) || "";
				o = e + o;
				var s = r.get(o);
				s ? s.push(a) : r.set(o, [a]);
			}
		}
		return r;
	}
	function Hf(e, t, n) {
		e = e.ownerDocument || e, e.head.insertBefore(n, t === "title" ? e.querySelector("head > title") : null);
	}
	function Uf(e, t, n) {
		if (n === 1 || t.itemProp != null) return !1;
		switch (e) {
			case "meta":
			case "title": return !0;
			case "style":
				if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "") break;
				return !0;
			case "link":
				if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError) break;
				switch (t.rel) {
					case "stylesheet": return e = t.disabled, typeof t.precedence == "string" && e == null;
					default: return !0;
				}
			case "script": if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string") return !0;
		}
		return !1;
	}
	function Wf(e) {
		return !(e.type === "stylesheet" && !(e.state.loading & 3));
	}
	function Gf(e, t, n, r) {
		if (n.type === "stylesheet" && (typeof r.media != "string" || !1 !== matchMedia(r.media).matches) && !(n.state.loading & 4)) {
			if (n.instance === null) {
				var i = Af(r.href), a = t.querySelector(jf(i));
				if (a) {
					t = a._p, typeof t == "object" && t && typeof t.then == "function" && (e.count++, e = Jf.bind(e), t.then(e, e)), n.state.loading |= 4, n.instance = a, gt(a);
					return;
				}
				a = t.ownerDocument || t, r = Mf(r), (i = mf.get(i)) && Rf(r, i), a = a.createElement("link"), gt(a);
				var o = a;
				o._p = new Promise(function(e, t) {
					o.onload = e, o.onerror = t;
				}), Pd(a, "link", r), n.instance = a;
			}
			e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(n, t), (t = n.state.preload) && !(n.state.loading & 3) && (e.count++, n = Jf.bind(e), t.addEventListener("load", n), t.addEventListener("error", n));
		}
	}
	var Kf = 0;
	function qf(e, t) {
		return e.stylesheets && e.count === 0 && Xf(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(n) {
			var r = setTimeout(function() {
				if (e.stylesheets && Xf(e, e.stylesheets), e.unsuspend) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, 6e4 + t);
			0 < e.imgBytes && Kf === 0 && (Kf = 62500 * Ld());
			var i = setTimeout(function() {
				if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && Xf(e, e.stylesheets), e.unsuspend)) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, (e.imgBytes > Kf ? 50 : 800) + t);
			return e.unsuspend = n, function() {
				e.unsuspend = null, clearTimeout(r), clearTimeout(i);
			};
		} : null;
	}
	function Jf() {
		if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
			if (this.stylesheets) Xf(this, this.stylesheets);
			else if (this.unsuspend) {
				var e = this.unsuspend;
				this.unsuspend = null, e();
			}
		}
	}
	var Yf = null;
	function Xf(e, t) {
		e.stylesheets = null, e.unsuspend !== null && (e.count++, Yf = /* @__PURE__ */ new Map(), t.forEach(Zf, e), Yf = null, Jf.call(e));
	}
	function Zf(e, t) {
		if (!(t.state.loading & 4)) {
			var n = Yf.get(e);
			if (n) var r = n.get(null);
			else {
				n = /* @__PURE__ */ new Map(), Yf.set(e, n);
				for (var i = e.querySelectorAll("link[data-precedence],style[data-precedence]"), a = 0; a < i.length; a++) {
					var o = i[a];
					(o.nodeName === "LINK" || o.getAttribute("media") !== "not all") && (n.set(o.dataset.precedence, o), r = o);
				}
				r && n.set(null, r);
			}
			i = t.instance, o = i.getAttribute("data-precedence"), a = n.get(o) || r, a === r && n.set(null, i), n.set(o, i), this.count++, r = Jf.bind(this), i.addEventListener("load", r), i.addEventListener("error", r), a ? a.parentNode.insertBefore(i, a.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(i, e.firstChild)), t.state.loading |= 4;
		}
	}
	var Qf = {
		$$typeof: b,
		Provider: null,
		Consumer: null,
		_currentValue: te,
		_currentValue2: te,
		_threadCount: 0
	};
	function $f(e, t, n, r, i, a, o, s, c) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = Ke(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Ke(0), this.hiddenUpdates = Ke(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function ep(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new $f(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = ei(3, null, null, t), e.current = a, a.stateNode = e, t = ea(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, Na(a), e;
	}
	function tp(e) {
		return e ? (e = Qr, e) : Qr;
	}
	function np(e, t, n, r, i, a) {
		i = tp(i), r.context === null ? r.context = i : r.pendingContext = i, r = Fa(t), r.payload = { element: n }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = Ia(e, r, t), n !== null && (pu(n, e, t), La(n, e, t));
	}
	function rp(e, t) {
		if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
			var n = e.retryLane;
			e.retryLane = n !== 0 && n < t ? n : t;
		}
	}
	function ip(e, t) {
		rp(e, t), (e = e.alternate) && rp(e, t);
	}
	function ap(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = Yr(e, 67108864);
			t !== null && pu(t, e, 67108864), ip(e, 67108864);
		}
	}
	function op(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = du();
			t = Qe(t);
			var n = Yr(e, t);
			n !== null && pu(n, e, t), ip(e, t);
		}
	}
	var sp = !0;
	function cp(e, t, n, r) {
		var i = N.T;
		N.T = null;
		var a = P.p;
		try {
			P.p = 2, up(e, t, n, r);
		} finally {
			P.p = a, N.T = i;
		}
	}
	function lp(e, t, n, r) {
		var i = N.T;
		N.T = null;
		var a = P.p;
		try {
			P.p = 8, up(e, t, n, r);
		} finally {
			P.p = a, N.T = i;
		}
	}
	function up(e, t, n, r) {
		if (sp) {
			var i = dp(r);
			if (i === null) Cd(e, t, r, fp, n), Cp(e, r);
			else if (Tp(i, e, t, n, r)) r.stopPropagation();
			else if (Cp(e, r), t & 4 && -1 < Sp.indexOf(e)) {
				for (; i !== null;) {
					var a = pt(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = B(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - Pe(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									nd(a), !(Y & 6) && ($l = Ce() + 500, rd(0, !1));
								}
							}
							break;
						case 31:
						case 13: s = Yr(a, 2), s !== null && pu(s, a, 2), vu(), ip(a, 2);
					}
					if (a = dp(r), a === null && Cd(e, t, r, fp, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else Cd(e, t, r, null, n);
		}
	}
	function dp(e) {
		return e = Zt(e), pp(e);
	}
	var fp = null;
	function pp(e) {
		if (fp = null, e = ft(e), e !== null) {
			var t = o(e);
			if (t === null) e = null;
			else {
				var n = t.tag;
				if (n === 13) {
					if (e = s(t), e !== null) return e;
					e = null;
				} else if (n === 31) {
					if (e = c(t), e !== null) return e;
					e = null;
				} else if (n === 3) {
					if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
					e = null;
				} else t !== e && (e = null);
			}
		}
		return fp = e, null;
	}
	function mp(e) {
		switch (e) {
			case "beforetoggle":
			case "cancel":
			case "click":
			case "close":
			case "contextmenu":
			case "copy":
			case "cut":
			case "auxclick":
			case "dblclick":
			case "dragend":
			case "dragstart":
			case "drop":
			case "focusin":
			case "focusout":
			case "input":
			case "invalid":
			case "keydown":
			case "keypress":
			case "keyup":
			case "mousedown":
			case "mouseup":
			case "paste":
			case "pause":
			case "play":
			case "pointercancel":
			case "pointerdown":
			case "pointerup":
			case "ratechange":
			case "reset":
			case "resize":
			case "seeked":
			case "submit":
			case "toggle":
			case "touchcancel":
			case "touchend":
			case "touchstart":
			case "volumechange":
			case "change":
			case "selectionchange":
			case "textInput":
			case "compositionstart":
			case "compositionend":
			case "compositionupdate":
			case "beforeblur":
			case "afterblur":
			case "beforeinput":
			case "blur":
			case "fullscreenchange":
			case "focus":
			case "hashchange":
			case "popstate":
			case "select":
			case "selectstart": return 2;
			case "drag":
			case "dragenter":
			case "dragexit":
			case "dragleave":
			case "dragover":
			case "mousemove":
			case "mouseout":
			case "mouseover":
			case "pointermove":
			case "pointerout":
			case "pointerover":
			case "scroll":
			case "touchmove":
			case "wheel":
			case "mouseenter":
			case "mouseleave":
			case "pointerenter":
			case "pointerleave": return 8;
			case "message": switch (we()) {
				case Te: return 2;
				case Ee: return 8;
				case De:
				case Oe: return 32;
				case z: return 268435456;
				default: return 32;
			}
			default: return 32;
		}
	}
	var hp = !1, gp = null, _p = null, vp = null, yp = /* @__PURE__ */ new Map(), bp = /* @__PURE__ */ new Map(), xp = [], Sp = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
	function Cp(e, t) {
		switch (e) {
			case "focusin":
			case "focusout":
				gp = null;
				break;
			case "dragenter":
			case "dragleave":
				_p = null;
				break;
			case "mouseover":
			case "mouseout":
				vp = null;
				break;
			case "pointerover":
			case "pointerout":
				yp.delete(t.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": bp.delete(t.pointerId);
		}
	}
	function wp(e, t, n, r, i, a) {
		return e === null || e.nativeEvent !== a ? (e = {
			blockedOn: t,
			domEventName: n,
			eventSystemFlags: r,
			nativeEvent: a,
			targetContainers: [i]
		}, t !== null && (t = pt(t), t !== null && ap(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
	}
	function Tp(e, t, n, r, i) {
		switch (t) {
			case "focusin": return gp = wp(gp, e, t, n, r, i), !0;
			case "dragenter": return _p = wp(_p, e, t, n, r, i), !0;
			case "mouseover": return vp = wp(vp, e, t, n, r, i), !0;
			case "pointerover":
				var a = i.pointerId;
				return yp.set(a, wp(yp.get(a) || null, e, t, n, r, i)), !0;
			case "gotpointercapture": return a = i.pointerId, bp.set(a, wp(bp.get(a) || null, e, t, n, r, i)), !0;
		}
		return !1;
	}
	function Ep(e) {
		var t = ft(e.target);
		if (t !== null) {
			var n = o(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = s(n), t !== null) {
						e.blockedOn = t, tt(e.priority, function() {
							op(n);
						});
						return;
					}
				} else if (t === 31) {
					if (t = c(n), t !== null) {
						e.blockedOn = t, tt(e.priority, function() {
							op(n);
						});
						return;
					}
				} else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
					e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
					return;
				}
			}
		}
		e.blockedOn = null;
	}
	function Dp(e) {
		if (e.blockedOn !== null) return !1;
		for (var t = e.targetContainers; 0 < t.length;) {
			var n = dp(e.nativeEvent);
			if (n === null) {
				n = e.nativeEvent;
				var r = new n.constructor(n.type, n);
				Xt = r, n.target.dispatchEvent(r), Xt = null;
			} else return t = pt(n), t !== null && ap(t), e.blockedOn = n, !1;
			t.shift();
		}
		return !0;
	}
	function Op(e, t, n) {
		Dp(e) && n.delete(t);
	}
	function kp() {
		hp = !1, gp !== null && Dp(gp) && (gp = null), _p !== null && Dp(_p) && (_p = null), vp !== null && Dp(vp) && (vp = null), yp.forEach(Op), bp.forEach(Op);
	}
	function Ap(e, n) {
		e.blockedOn === n && (e.blockedOn = null, hp || (hp = !0, t.unstable_scheduleCallback(t.unstable_NormalPriority, kp)));
	}
	var jp = null;
	function Mp(e) {
		jp !== e && (jp = e, t.unstable_scheduleCallback(t.unstable_NormalPriority, function() {
			jp === e && (jp = null);
			for (var t = 0; t < e.length; t += 3) {
				var n = e[t], r = e[t + 1], i = e[t + 2];
				if (typeof r != "function") {
					if (pp(r || n) === null) continue;
					break;
				}
				var a = pt(n);
				a !== null && (e.splice(t, 3), t -= 3, ys(a, {
					pending: !0,
					data: i,
					method: n.method,
					action: r
				}, r, i));
			}
		}));
	}
	function Np(e) {
		function t(t) {
			return Ap(t, e);
		}
		gp !== null && Ap(gp, e), _p !== null && Ap(_p, e), vp !== null && Ap(vp, e), yp.forEach(t), bp.forEach(t);
		for (var n = 0; n < xp.length; n++) {
			var r = xp[n];
			r.blockedOn === e && (r.blockedOn = null);
		}
		for (; 0 < xp.length && (n = xp[0], n.blockedOn === null);) Ep(n), n.blockedOn === null && xp.shift();
		if (n = (e.ownerDocument || e).$$reactFormReplay, n != null) for (r = 0; r < n.length; r += 3) {
			var i = n[r], a = n[r + 1], o = i[it] || null;
			if (typeof a == "function") o || Mp(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[it] || null) s = o.formAction;
					else if (pp(i) !== null) continue;
				} else s = o.action;
				typeof s == "function" ? n[r + 1] = s : (n.splice(r, 3), r -= 3), Mp(n);
			}
		}
	}
	function Pp() {
		function e(e) {
			e.canIntercept && e.info === "react-transition" && e.intercept({
				handler: function() {
					return new Promise(function(e) {
						return i = e;
					});
				},
				focusReset: "manual",
				scroll: "manual"
			});
		}
		function t() {
			i !== null && (i(), i = null), r || setTimeout(n, 20);
		}
		function n() {
			if (!r && !navigation.transition) {
				var e = navigation.currentEntry;
				e && e.url != null && navigation.navigate(e.url, {
					state: e.getState(),
					info: "react-transition",
					history: "replace"
				});
			}
		}
		if (typeof navigation == "object") {
			var r = !1, i = null;
			return navigation.addEventListener("navigate", e), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(n, 100), function() {
				r = !0, navigation.removeEventListener("navigate", e), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), i !== null && (i(), i = null);
			};
		}
	}
	function Fp(e) {
		this._internalRoot = e;
	}
	Ip.prototype.render = Fp.prototype.render = function(e) {
		var t = this._internalRoot;
		if (t === null) throw Error(i(409));
		var n = t.current;
		np(n, du(), e, t, null, null);
	}, Ip.prototype.unmount = Fp.prototype.unmount = function() {
		var e = this._internalRoot;
		if (e !== null) {
			this._internalRoot = null;
			var t = e.containerInfo;
			np(e.current, 2, null, e, null, null), vu(), t[at] = null;
		}
	};
	function Ip(e) {
		this._internalRoot = e;
	}
	Ip.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = et();
			e = {
				blockedOn: null,
				target: e,
				priority: t
			};
			for (var n = 0; n < xp.length && t !== 0 && t < xp[n].priority; n++);
			xp.splice(n, 0, e), n === 0 && Ep(e);
		}
	};
	var Lp = n.version;
	if (Lp !== "19.2.8") throw Error(i(527, Lp, "19.2.8"));
	P.findDOMNode = function(e) {
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(i(188)) : (e = Object.keys(e).join(","), Error(i(268, e)));
		return e = u(t), e = e === null ? null : d(e), e = e === null ? null : e.stateNode, e;
	};
	var Rp = {
		bundleType: 0,
		version: "19.2.8",
		rendererPackageName: "react-dom",
		currentDispatcherRef: N,
		reconcilerVersion: "19.2.8"
	};
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
		var zp = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!zp.isDisabled && zp.supportsFiber) try {
			je = zp.inject(Rp), Me = zp;
		} catch {}
	}
	e.createRoot = function(e, t) {
		if (!a(e)) throw Error(i(299));
		var n = !1, r = "", o = Hs, s = Us, c = Ws;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (o = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = ep(e, 1, !1, null, null, n, r, null, o, s, c, Pp), e[at] = t.current, xd(e), new Fp(t);
	};
})), rf = (/* @__PURE__ */ o(((e, t) => {
	function n() {
		if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = nf();
})))(), af = rn({
	primaryColor: "frost",
	primaryShade: {
		light: 6,
		dark: 4
	},
	defaultRadius: "md",
	colors: {
		frost: [
			"#eef6fa",
			"#dceaf1",
			"#bdd8e4",
			"#9bc5d6",
			"#88c0d0",
			"#81a1c1",
			"#5e81ac",
			"#4c6c91",
			"#3b5675",
			"#2c415a"
		],
		dark: [
			"#eceff4",
			"#e5e9f0",
			"#d8dee9",
			"#b8c2d1",
			"#697386",
			"#4c566a",
			"#3b4252",
			"#2e3440",
			"#292f3a",
			"#242933"
		]
	}
}), of = (e) => e ? e.length > 18 ? `${e.slice(0, 9)}…${e.slice(-7)}` : e : "—", sf = (e) => {
	if (!e) return "—";
	let t = new Date(e);
	return Number.isNaN(t.valueOf()) ? e : t.toLocaleString();
}, cf = {
	online: "green",
	degraded: "yellow",
	offline: "red"
};
function lf({ title: e, detail: t }) {
	return /* @__PURE__ */ (0, V.jsxs)(Rs, {
		justify: "space-between",
		align: "baseline",
		mb: "md",
		wrap: "nowrap",
		children: [/* @__PURE__ */ (0, V.jsx)($d, {
			order: 2,
			size: "h4",
			children: e
		}), /* @__PURE__ */ (0, V.jsx)(J, {
			c: "dimmed",
			size: "xs",
			ta: "right",
			children: t
		})]
	});
}
function uf({ children: e }) {
	return /* @__PURE__ */ (0, V.jsx)(El, {
		mih: 108,
		children: /* @__PURE__ */ (0, V.jsx)(J, {
			c: "dimmed",
			size: "sm",
			children: e
		})
	});
}
function df() {
	let e = (0, C.useMemo)(() => new URL(window.location.href).searchParams.get("network") || "", []), [t, n] = (0, C.useState)(null), [r, i] = (0, C.useState)(e), [a, o] = (0, C.useState)(""), [s, c] = (0, C.useState)(!1), l = (0, C.useMemo)(() => new URL(window.location.href).searchParams.get("lab") === "1", []), [u, d] = (0, C.useState)("system:mesh_test"), [f, p] = (0, C.useState)(3), [m, h] = (0, C.useState)(""), [g, _] = (0, C.useState)("{}"), [v, y] = (0, C.useState)(""), [b, x] = (0, C.useState)(""), [S, w] = (0, C.useState)(3), [T, E] = (0, C.useState)(!1), [ee, D] = (0, C.useState)(null), [O, k] = (0, C.useState)(""), A = (0, C.useCallback)(async (e = r, t = !1) => {
		t && c(!0);
		try {
			let t = new URL("api/snapshot", window.location.href);
			e && t.searchParams.set("network", e);
			let r = await fetch(t, { cache: "no-store" });
			if (!r.ok) throw Error(`Console API returned ${r.status}`);
			let a = await r.json();
			n(a), i(a.selectedNetwork || ""), o("");
		} catch (e) {
			o(e instanceof Error ? e.message : "Unable to reach the console API");
		} finally {
			t && c(!1);
		}
	}, [r]);
	(0, C.useEffect)(() => {
		A();
		let e = window.setInterval(() => void A(), 2e3);
		return () => window.clearInterval(e);
	}, [A]);
	let j = a ? "offline" : t?.state || "offline", M = t?.networks.find((e) => e.name === r), N = (0, C.useMemo)(() => {
		let e = new URL("api/diagnostics", window.location.href);
		return r && e.searchParams.set("network", r), e.toString();
	}, [r]), P = (0, C.useMemo)(() => {
		if (!t) return [];
		let e = [], n = t.status.addressGroups || {};
		for (let t of [
			"lan",
			"public",
			"loopback",
			"other"
		]) for (let r of n[t] || []) e.push({
			scope: t,
			address: r
		});
		return e;
	}, [t]), te = (0, C.useMemo)(() => (t?.events || []).slice(0, 12), [t]), ne = [
		{
			label: "Device",
			value: of(t?.status.deviceId),
			mono: !0
		},
		{
			label: "Networks",
			value: String(t?.networks.length ?? 0)
		},
		{
			label: "Known peers",
			value: String(t?.peers?.length ?? 0)
		},
		{
			label: "Recent events",
			value: String(te.length)
		},
		{
			label: "Versions",
			value: t ? `${t.status.daemonVersion || "?"} · IPC ${t.status.protocolVersion || "?"} · DB ${t.status.storageSchemaVersion || "?"}` : "—"
		}
	], re = (0, C.useCallback)(async (e, t) => {
		let n = new URL(e, window.location.href), r = await fetch(n, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(t)
		});
		if (!r.ok) throw Error((await r.text()).trim() || `Lab API returned ${r.status}`);
		return r.json();
	}, []), F = (0, C.useCallback)(async () => {
		if (r) {
			E(!0), k("");
			try {
				let e = JSON.parse(g), t = await re("api/lab/publish", {
					network: r,
					stream: u,
					count: f,
					message: m,
					data: e
				});
				D(t), y(t.runId), x(t.originDeviceId), w(t.expected), await A(r);
			} catch (e) {
				k(e instanceof Error ? e.message : "Unable to publish test events");
			} finally {
				E(!1);
			}
		}
	}, [
		f,
		g,
		m,
		u,
		re,
		A,
		r
	]), I = (0, C.useCallback)(async () => {
		if (r) {
			E(!0), k("");
			try {
				let e = await re("api/lab/verify", {
					network: r,
					stream: u,
					runId: v,
					originDeviceId: b,
					expected: S
				});
				D(e);
			} catch (e) {
				k(e instanceof Error ? e.message : "Unable to verify test events");
			} finally {
				E(!1);
			}
		}
	}, [
		S,
		b,
		v,
		u,
		re,
		r
	]);
	return /* @__PURE__ */ (0, V.jsx)(G, {
		className: "app-shell",
		children: /* @__PURE__ */ (0, V.jsx)(Al, {
			size: "xl",
			py: {
				base: "lg",
				sm: "xl"
			},
			children: /* @__PURE__ */ (0, V.jsxs)(wd, {
				gap: "lg",
				children: [
					/* @__PURE__ */ (0, V.jsxs)(Rs, {
						justify: "space-between",
						align: "center",
						children: [/* @__PURE__ */ (0, V.jsxs)(Rs, {
							gap: "sm",
							children: [/* @__PURE__ */ (0, V.jsx)(Kd, {
								variant: "light",
								size: 42,
								radius: "md",
								"aria-hidden": !0,
								children: /* @__PURE__ */ (0, V.jsx)(J, {
									fw: 800,
									ff: "monospace",
									children: "T"
								})
							}), /* @__PURE__ */ (0, V.jsxs)("div", { children: [/* @__PURE__ */ (0, V.jsx)($d, {
								order: 1,
								size: "h3",
								children: "Thalweg Console"
							}), /* @__PURE__ */ (0, V.jsx)(J, {
								c: "dimmed",
								size: "sm",
								children: "A clear view of your local daemon"
							})] })]
						}), /* @__PURE__ */ (0, V.jsxs)(Rs, {
							gap: "sm",
							children: [
								/* @__PURE__ */ (0, V.jsx)(cl, {
									color: cf[j],
									variant: "light",
									size: "lg",
									leftSection: /* @__PURE__ */ (0, V.jsx)("span", { className: "status-dot" }),
									children: j
								}),
								/* @__PURE__ */ (0, V.jsx)(_l, {
									variant: "default",
									loading: s,
									onClick: () => void A(r, !0),
									children: "Refresh"
								}),
								/* @__PURE__ */ (0, V.jsx)(_l, {
									component: "a",
									href: N,
									variant: "light",
									children: "Export diagnostics"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, V.jsx)(Fo, {
						withBorder: !0,
						p: "md",
						children: /* @__PURE__ */ (0, V.jsxs)(Rs, {
							justify: "space-between",
							align: "end",
							children: [/* @__PURE__ */ (0, V.jsx)(fd, {
								label: "Network",
								placeholder: t ? "No mounted networks" : "Waiting for daemon",
								data: (t?.networks || []).map((e) => ({
									label: e.name,
									value: e.name
								})),
								value: r || null,
								disabled: !t?.networks.length,
								onChange: (e) => {
									let t = e || "";
									i(t), A(t, !0);
								},
								w: {
									base: "100%",
									sm: 280
								}
							}), /* @__PURE__ */ (0, V.jsxs)("div", { children: [/* @__PURE__ */ (0, V.jsx)(J, {
								c: "dimmed",
								size: "xs",
								ta: {
									base: "left",
									sm: "right"
								},
								children: "Network ID"
							}), /* @__PURE__ */ (0, V.jsx)(J, {
								ff: "monospace",
								size: "sm",
								children: M?.id || "—"
							})] })]
						})
					}),
					(a || t?.error) && /* @__PURE__ */ (0, V.jsx)(pc, {
						color: "red",
						title: "Console unavailable",
						variant: "light",
						children: a || t?.error
					}),
					l && /* @__PURE__ */ (0, V.jsxs)(wl, {
						withBorder: !0,
						padding: "lg",
						children: [
							/* @__PURE__ */ (0, V.jsx)(lf, {
								title: "Event Workbench",
								detail: "Explicit lab mode · writes test events"
							}),
							/* @__PURE__ */ (0, V.jsx)(pc, {
								color: "frost",
								variant: "light",
								mb: "md",
								children: "Test events use deterministic IDs, so retrying the same run ID is idempotent. They replicate like ordinary events."
							}),
							/* @__PURE__ */ (0, V.jsxs)(bd, {
								cols: {
									base: 1,
									md: 2
								},
								children: [/* @__PURE__ */ (0, V.jsxs)(wd, {
									gap: "sm",
									children: [
										/* @__PURE__ */ (0, V.jsx)(Ud, {
											label: "Stream",
											value: u,
											onChange: (e) => d(e.currentTarget.value)
										}),
										/* @__PURE__ */ (0, V.jsx)(ud, {
											label: "Event count",
											min: 1,
											max: 100,
											value: f,
											onChange: (e) => p(Number(e) || 1)
										}),
										/* @__PURE__ */ (0, V.jsx)(Ud, {
											label: "Message",
											placeholder: "Optional note for this run",
											value: m,
											onChange: (e) => h(e.currentTarget.value)
										}),
										/* @__PURE__ */ (0, V.jsx)($l, {
											label: "Generic JSON data",
											autosize: !0,
											minRows: 4,
											ff: "monospace",
											value: g,
											onChange: (e) => _(e.currentTarget.value)
										}),
										/* @__PURE__ */ (0, V.jsx)(_l, {
											disabled: !r,
											loading: T,
											onClick: () => void F(),
											children: "Publish deterministic run"
										})
									]
								}), /* @__PURE__ */ (0, V.jsxs)(wd, {
									gap: "sm",
									children: [
										/* @__PURE__ */ (0, V.jsx)(Ud, {
											label: "Run ID",
											value: v,
											onChange: (e) => y(e.currentTarget.value)
										}),
										/* @__PURE__ */ (0, V.jsx)(Ud, {
											label: "Origin device ID",
											description: "Copy from the publishing manifest; leave blank to match any origin",
											value: b,
											onChange: (e) => x(e.currentTarget.value)
										}),
										/* @__PURE__ */ (0, V.jsx)(ud, {
											label: "Expected sequences",
											min: 1,
											max: 100,
											value: S,
											onChange: (e) => w(Number(e) || 1)
										}),
										/* @__PURE__ */ (0, V.jsx)(_l, {
											variant: "default",
											disabled: !r || !v,
											loading: T,
											onClick: () => void I(),
											children: "Verify local replica"
										}),
										O && /* @__PURE__ */ (0, V.jsx)(pc, {
											color: "red",
											variant: "light",
											children: O
										}),
										ee && /* @__PURE__ */ (0, V.jsx)(Fo, {
											withBorder: !0,
											p: "md",
											bg: "dark.7",
											children: /* @__PURE__ */ (0, V.jsx)(J, {
												size: "xs",
												ff: "monospace",
												className: "payload",
												children: JSON.stringify(ee, null, 2)
											})
										})
									]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, V.jsxs)(wl, {
						withBorder: !0,
						padding: "lg",
						children: [/* @__PURE__ */ (0, V.jsx)(lf, {
							title: "Overview",
							detail: t ? `Captured ${sf(t.capturedAt)}` : "Not yet refreshed"
						}), /* @__PURE__ */ (0, V.jsx)(bd, {
							cols: {
								base: 1,
								xs: 2,
								md: 4
							},
							children: ne.map((e) => /* @__PURE__ */ (0, V.jsxs)(Fo, {
								withBorder: !0,
								p: "md",
								bg: "dark.7",
								children: [/* @__PURE__ */ (0, V.jsx)(J, {
									c: "dimmed",
									size: "xs",
									fw: 700,
									tt: "uppercase",
									lts: ".06em",
									children: e.label
								}), /* @__PURE__ */ (0, V.jsx)(J, {
									mt: 6,
									fw: 650,
									ff: e.mono ? "monospace" : void 0,
									truncate: !0,
									children: e.value
								})]
							}, e.label))
						})]
					}),
					/* @__PURE__ */ (0, V.jsxs)(Gl, {
						gap: "lg",
						children: [/* @__PURE__ */ (0, V.jsx)(Gl.Col, {
							span: {
								base: 12,
								md: 6
							},
							children: /* @__PURE__ */ (0, V.jsxs)(wl, {
								withBorder: !0,
								padding: "lg",
								h: "100%",
								children: [/* @__PURE__ */ (0, V.jsx)(lf, {
									title: "Node addresses",
									detail: "Advertised locally"
								}), P.length === 0 ? /* @__PURE__ */ (0, V.jsx)(uf, { children: "No advertised addresses." }) : /* @__PURE__ */ (0, V.jsxs)(wd, {
									gap: 0,
									children: [P.slice(0, 6).map((e, t) => /* @__PURE__ */ (0, V.jsxs)(G, { children: [t > 0 && /* @__PURE__ */ (0, V.jsx)(Pl, {}), /* @__PURE__ */ (0, V.jsxs)(Rs, {
										justify: "space-between",
										py: "sm",
										wrap: "nowrap",
										children: [
											/* @__PURE__ */ (0, V.jsx)(cl, {
												variant: "light",
												size: "sm",
												children: e.scope
											}),
											/* @__PURE__ */ (0, V.jsx)(J, {
												ff: "monospace",
												size: "xs",
												truncate: !0,
												className: "flex-text",
												children: e.address
											}),
											/* @__PURE__ */ (0, V.jsx)(J, {
												c: "dimmed",
												size: "xs",
												children: "advertised"
											})
										]
									})] }, `${e.scope}-${e.address}`)), P.length > 6 && /* @__PURE__ */ (0, V.jsxs)(J, {
										c: "dimmed",
										size: "xs",
										pt: "sm",
										children: [
											"+ ",
											P.length - 6,
											" more addresses"
										]
									})]
								})]
							})
						}), /* @__PURE__ */ (0, V.jsx)(Gl.Col, {
							span: {
								base: 12,
								md: 6
							},
							children: /* @__PURE__ */ (0, V.jsxs)(wl, {
								withBorder: !0,
								padding: "lg",
								h: "100%",
								children: [/* @__PURE__ */ (0, V.jsx)(lf, {
									title: "Streams",
									detail: "Recent 24-hour window"
								}), t?.streams.length ? /* @__PURE__ */ (0, V.jsxs)(wd, {
									gap: 0,
									children: [t.streams.slice(0, 6).map((e, t) => /* @__PURE__ */ (0, V.jsxs)(G, { children: [t > 0 && /* @__PURE__ */ (0, V.jsx)(Pl, {}), /* @__PURE__ */ (0, V.jsxs)(Rs, {
										justify: "space-between",
										py: "sm",
										wrap: "nowrap",
										children: [
											/* @__PURE__ */ (0, V.jsx)(cl, {
												variant: "light",
												size: "sm",
												children: "stream"
											}),
											/* @__PURE__ */ (0, V.jsx)(J, {
												ff: "monospace",
												size: "xs",
												truncate: !0,
												className: "flex-text",
												children: e.name
											}),
											/* @__PURE__ */ (0, V.jsxs)(J, {
												c: "dimmed",
												size: "xs",
												ta: "right",
												children: [
													e.eventCount,
													" · ",
													sf(e.latestAt)
												]
											})
										]
									})] }, e.name)), t.streams.length > 6 && /* @__PURE__ */ (0, V.jsxs)(J, {
										c: "dimmed",
										size: "xs",
										pt: "sm",
										children: [
											"+ ",
											t.streams.length - 6,
											" more streams"
										]
									})]
								}) : /* @__PURE__ */ (0, V.jsx)(uf, { children: "No events in the recent diagnostic window." })]
							})
						})]
					}),
					/* @__PURE__ */ (0, V.jsxs)(wl, {
						withBorder: !0,
						padding: "lg",
						children: [/* @__PURE__ */ (0, V.jsx)(lf, {
							title: "Peers",
							detail: r || "network required"
						}), t?.peers?.length ? /* @__PURE__ */ (0, V.jsx)(Eo, {
							type: "auto",
							children: /* @__PURE__ */ (0, V.jsxs)($, {
								verticalSpacing: "sm",
								miw: 760,
								children: [/* @__PURE__ */ (0, V.jsx)($.Thead, { children: /* @__PURE__ */ (0, V.jsxs)($.Tr, { children: [
									/* @__PURE__ */ (0, V.jsx)($.Th, { children: "Peer" }),
									/* @__PURE__ */ (0, V.jsx)($.Th, { children: "State" }),
									/* @__PURE__ */ (0, V.jsx)($.Th, { children: "Last synchronized" }),
									/* @__PURE__ */ (0, V.jsx)($.Th, { children: "Retry" })
								] }) }), /* @__PURE__ */ (0, V.jsx)($.Tbody, { children: t.peers.map((e) => /* @__PURE__ */ (0, V.jsxs)($.Tr, { children: [
									/* @__PURE__ */ (0, V.jsxs)($.Td, { children: [/* @__PURE__ */ (0, V.jsx)(J, {
										ff: "monospace",
										size: "sm",
										children: of(e.peerId)
									}), /* @__PURE__ */ (0, V.jsx)(J, {
										c: "dimmed",
										ff: "monospace",
										size: "xs",
										truncate: !0,
										maw: 340,
										children: e.address
									})] }),
									/* @__PURE__ */ (0, V.jsxs)($.Td, { children: [/* @__PURE__ */ (0, V.jsxs)(cl, {
										color: e.state === "healthy" ? "green" : e.state === "degraded" ? "yellow" : "frost",
										variant: "light",
										children: [e.state, e.connected ? " · connected" : ""]
									}), e.lastError && /* @__PURE__ */ (0, V.jsx)(J, {
										c: "yellow",
										size: "xs",
										mt: 4,
										children: e.lastError
									})] }),
									/* @__PURE__ */ (0, V.jsx)($.Td, { children: sf(e.lastSuccessAt) }),
									/* @__PURE__ */ (0, V.jsxs)($.Td, { children: [/* @__PURE__ */ (0, V.jsxs)(J, {
										size: "xs",
										children: [e.consecutiveFailures, " failures"]
									}), /* @__PURE__ */ (0, V.jsx)(J, {
										c: "dimmed",
										size: "xs",
										children: sf(e.nextAttemptAt)
									})] })
								] }, e.peerId)) })]
							})
						}) : /* @__PURE__ */ (0, V.jsx)(uf, { children: "No known peers for this network." })]
					}),
					/* @__PURE__ */ (0, V.jsxs)(wl, {
						withBorder: !0,
						padding: "lg",
						children: [/* @__PURE__ */ (0, V.jsx)(lf, {
							title: "Recent events",
							detail: `Latest 12 · ${r || "network required"}`
						}), te.length === 0 ? /* @__PURE__ */ (0, V.jsx)(uf, { children: "No events to display." }) : /* @__PURE__ */ (0, V.jsx)(Eo, {
							type: "auto",
							children: /* @__PURE__ */ (0, V.jsxs)($, {
								highlightOnHover: !0,
								verticalSpacing: "sm",
								miw: 900,
								children: [/* @__PURE__ */ (0, V.jsx)($.Thead, { children: /* @__PURE__ */ (0, V.jsxs)($.Tr, { children: [
									/* @__PURE__ */ (0, V.jsx)($.Th, { children: "Occurred" }),
									/* @__PURE__ */ (0, V.jsx)($.Th, { children: "Stream" }),
									/* @__PURE__ */ (0, V.jsx)($.Th, { children: "Origin" }),
									/* @__PURE__ */ (0, V.jsx)($.Th, { children: "Event" }),
									/* @__PURE__ */ (0, V.jsx)($.Th, { children: "Payload" })
								] }) }), /* @__PURE__ */ (0, V.jsx)($.Tbody, { children: te.map((e) => /* @__PURE__ */ (0, V.jsxs)($.Tr, { children: [
									/* @__PURE__ */ (0, V.jsx)($.Td, { children: sf(e.occurredAt) }),
									/* @__PURE__ */ (0, V.jsx)($.Td, { children: /* @__PURE__ */ (0, V.jsx)(J, {
										ff: "monospace",
										size: "sm",
										children: e.stream
									}) }),
									/* @__PURE__ */ (0, V.jsx)($.Td, { children: /* @__PURE__ */ (0, V.jsx)(J, {
										ff: "monospace",
										size: "sm",
										children: of(e.deviceId)
									}) }),
									/* @__PURE__ */ (0, V.jsx)($.Td, { children: /* @__PURE__ */ (0, V.jsx)(J, {
										ff: "monospace",
										size: "sm",
										children: of(e.id)
									}) }),
									/* @__PURE__ */ (0, V.jsx)($.Td, { children: /* @__PURE__ */ (0, V.jsx)(J, {
										ff: "monospace",
										size: "xs",
										className: "payload",
										children: JSON.stringify(e.payload) ?? "—"
									}) })
								] }, e.id)) })]
							})
						})]
					}),
					/* @__PURE__ */ (0, V.jsxs)(wl, {
						withBorder: !0,
						padding: "lg",
						children: [
							/* @__PURE__ */ (0, V.jsx)(lf, {
								title: "System notes",
								detail: "Current daemon capabilities"
							}),
							/* @__PURE__ */ (0, V.jsx)(bd, {
								cols: {
									base: 1,
									sm: 2
								},
								spacing: "xs",
								children: (t?.features || []).map((e) => /* @__PURE__ */ (0, V.jsxs)(Fo, {
									withBorder: !0,
									p: "md",
									bg: "dark.7",
									children: [/* @__PURE__ */ (0, V.jsxs)(Rs, {
										gap: "xs",
										mb: 4,
										children: [/* @__PURE__ */ (0, V.jsx)(cl, {
											color: e.supported ? "green" : "yellow",
											variant: "light",
											size: "xs",
											children: e.supported ? "Available" : "Planned"
										}), /* @__PURE__ */ (0, V.jsx)(J, {
											fw: 650,
											size: "sm",
											children: e.name
										})]
									}), /* @__PURE__ */ (0, V.jsx)(J, {
										c: "dimmed",
										size: "xs",
										children: e.detail
									})]
								}, e.name))
							}),
							!!t?.warnings.length && /* @__PURE__ */ (0, V.jsx)(wd, {
								gap: "xs",
								mt: "lg",
								children: t.warnings.map((e) => /* @__PURE__ */ (0, V.jsx)(pc, {
									color: "yellow",
									variant: "light",
									py: "xs",
									children: /* @__PURE__ */ (0, V.jsx)(J, {
										size: "xs",
										children: e
									})
								}, e))
							})
						]
					}),
					/* @__PURE__ */ (0, V.jsx)(J, {
						c: "dimmed",
						size: "xs",
						ta: "center",
						children: "Loopback-only session · payloads are rendered as inert text · refreshes every 2 seconds"
					})
				]
			})
		})
	});
}
(0, rf.createRoot)(document.getElementById("root")).render(/* @__PURE__ */ (0, V.jsx)(nn, {
	theme: af,
	forceColorScheme: "dark",
	children: /* @__PURE__ */ (0, V.jsx)(df, {})
}));
//#endregion
