/* Easing math (clean-room).
   Two easing kinds share ONE interface: ease(t) -> progress, t in [0,1].
   - cubic-bezier presets  -> solved via Newton-Raphson + bisection fallback
   - closed-form presets    -> Penner-style functions (elastic / bounce), which
     CANNOT be expressed as a single cubic-bezier — this is exactly why a
     sampling/"bake" engine is the right foundation for a rich preset set. */
(function (global) {
  "use strict";

  // ── Unit cubic-bezier easing: P0=(0,0) P3=(1,1), controls (x1,y1)(x2,y2) ──
  function cubicBezier(x1, y1, x2, y2) {
    var NEWTON_ITER = 5, NEWTON_MIN_SLOPE = 0.001;
    var SUBDIV_PREC = 1e-7, SUBDIV_MAX = 12;

    function A(a, b) { return 1.0 - 3.0 * b + 3.0 * a; }
    function B(a, b) { return 3.0 * b - 6.0 * a; }
    function C(a)    { return 3.0 * a; }
    function calc(t, a, b) { return ((A(a, b) * t + B(a, b)) * t + C(a)) * t; }
    function slope(t, a, b) { return 3.0 * A(a, b) * t * t + 2.0 * B(a, b) * t + C(a); }

    function tForX(x) {
      var t = x, i, s, xt;
      for (i = 0; i < NEWTON_ITER; i++) {
        s = slope(t, x1, x2);
        if (s < 1e-9) break;
        xt = calc(t, x1, x2) - x;
        t -= xt / s;
      }
      // bisection fallback (guarantees convergence for awkward handles)
      var lo = 0, hi = 1; t = x;
      if (t < lo) return lo;
      if (t > hi) return hi;
      var cx;
      for (i = 0; i < SUBDIV_MAX; i++) {
        cx = calc(t, x1, x2);
        if (Math.abs(cx - x) < SUBDIV_PREC) return t;
        if (x > cx) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return t;
    }

    var isLinear = (x1 === y1 && x2 === y2);
    return function (x) {
      if (isLinear) return x;
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      return calc(tForX(x), y1, y2);
    };
  }

  // ── Closed-form easings (overshoot / oscillation) ──
  function outBounce(t) {
    var n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1)      return n1 * t * t;
    if (t < 2 / d1)      { t -= 1.5 / d1;  return n1 * t * t + 0.75; }
    if (t < 2.5 / d1)    { t -= 2.25 / d1; return n1 * t * t + 0.9375; }
    t -= 2.625 / d1;     return n1 * t * t + 0.984375;
  }
  var Fn = {
    outBounce: outBounce,
    inBounce: function (t) { return 1 - outBounce(1 - t); },
    inOutBounce: function (t) {
      return t < 0.5 ? (1 - outBounce(1 - 2 * t)) / 2 : (1 + outBounce(2 * t - 1)) / 2;
    },
    outElastic: function (t) {
      var c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    inElastic: function (t) {
      var c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    },
    inOutElastic: function (t) {
      var c5 = (2 * Math.PI) / 4.5;
      if (t === 0) return 0;
      if (t === 1) return 1;
      return t < 0.5
        ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
        :  (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
    }
  };

  /* Build a unified ease(t) from a preset definition. */
  function makeEase(preset) {
    if (preset.type === "fn") return Fn[preset.fn];
    var p = preset.pts;
    return cubicBezier(p[0], p[1], p[2], p[3]);
  }

  /* Sample an ease into N+1 evenly time-spaced progress values in [0..1] time.
     Endpoints are forced to exact 0 and 1 so anchor keyframes stay put. */
  function sample(ease, n) {
    var out = new Array(n + 1), i;
    for (i = 0; i <= n; i++) out[i] = ease(i / n);
    out[0] = 0; out[n] = 1;
    return out;
  }

  global.Bezier = { cubicBezier: cubicBezier, Fn: Fn, makeEase: makeEase, sample: sample };
})(this);
