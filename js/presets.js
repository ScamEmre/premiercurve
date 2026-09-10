/* Curated easing presets (Eaze-inspired categories, own values).
   cubic presets: pts = [x1,y1,x2,y2].  fn presets: fn = key in Bezier.Fn.
   Each gets .ease(t) attached at load. Overshoot/oscillation presets are
   flagged so the graph auto-scales its Y range. */
(function (global) {
  "use strict";

  var RAW = [
    // Basic
    { cat: "Temel",   name: "Linear",       type: "cubic", pts: [0, 0, 1, 1] },
    { cat: "Temel",   name: "Ease",         type: "cubic", pts: [0.25, 0.10, 0.25, 1.0] },
    { cat: "Temel",   name: "Ease In",      type: "cubic", pts: [0.42, 0, 1, 1] },
    { cat: "Temel",   name: "Ease Out",     type: "cubic", pts: [0, 0, 0.58, 1] },
    { cat: "Temel",   name: "Ease InOut",   type: "cubic", pts: [0.42, 0, 0.58, 1] },

    // Cubic
    { cat: "Cubic",   name: "In Cubic",     type: "cubic", pts: [0.32, 0, 0.67, 0] },
    { cat: "Cubic",   name: "Out Cubic",    type: "cubic", pts: [0.33, 1, 0.68, 1] },
    { cat: "Cubic",   name: "InOut Cubic",  type: "cubic", pts: [0.65, 0, 0.35, 1] },

    // Quart
    { cat: "Quart",   name: "In Quart",     type: "cubic", pts: [0.50, 0, 0.75, 0] },
    { cat: "Quart",   name: "Out Quart",    type: "cubic", pts: [0.25, 1, 0.50, 1] },
    { cat: "Quart",   name: "InOut Quart",  type: "cubic", pts: [0.76, 0, 0.24, 1] },

    // Quint
    { cat: "Quint",   name: "In Quint",     type: "cubic", pts: [0.64, 0, 0.78, 0] },
    { cat: "Quint",   name: "Out Quint",    type: "cubic", pts: [0.22, 1, 0.36, 1] },
    { cat: "Quint",   name: "InOut Quint",  type: "cubic", pts: [0.83, 0, 0.17, 1] },

    // Expo
    { cat: "Expo",    name: "In Expo",      type: "cubic", pts: [0.70, 0, 0.84, 0] },
    { cat: "Expo",    name: "Out Expo",     type: "cubic", pts: [0.16, 1, 0.30, 1] },
    { cat: "Expo",    name: "InOut Expo",   type: "cubic", pts: [0.87, 0, 0.13, 1] },

    // Circ
    { cat: "Circ",    name: "In Circ",      type: "cubic", pts: [0.55, 0, 1, 0.45] },
    { cat: "Circ",    name: "Out Circ",     type: "cubic", pts: [0, 0.55, 0.45, 1] },
    { cat: "Circ",    name: "InOut Circ",   type: "cubic", pts: [0.85, 0, 0.15, 1] },

    // Back (overshoot)
    { cat: "Back",    name: "In Back",      type: "cubic", pts: [0.36, 0, 0.66, -0.56], over: true },
    { cat: "Back",    name: "Out Back",     type: "cubic", pts: [0.34, 1.56, 0.64, 1],  over: true },
    { cat: "Back",    name: "InOut Back",   type: "cubic", pts: [0.68, -0.60, 0.32, 1.60], over: true },

    // Snappy
    { cat: "Snappy",  name: "Snappy",       type: "cubic", pts: [0.87, 0, 0.13, 1] },
    { cat: "Snappy",  name: "Snap Out",     type: "cubic", pts: [0.05, 0.7, 0.10, 1] },

    // Elastic (oscillation)
    { cat: "Elastic", name: "Out Elastic",   type: "fn", fn: "outElastic",   over: true },
    { cat: "Elastic", name: "In Elastic",    type: "fn", fn: "inElastic",    over: true },
    { cat: "Elastic", name: "InOut Elastic", type: "fn", fn: "inOutElastic", over: true },

    // Bounce
    { cat: "Bounce",  name: "Out Bounce",    type: "fn", fn: "outBounce",    over: true },
    { cat: "Bounce",  name: "In Bounce",     type: "fn", fn: "inBounce",     over: true },
    { cat: "Bounce",  name: "InOut Bounce",  type: "fn", fn: "inOutBounce",  over: true }
  ];

  var CATS = [];
  RAW.forEach(function (p, i) {
    p.id = "p" + i;
    p.ease = Bezier.makeEase(p);
    p.label = (p.type === "cubic")
      ? "cubic-bezier(" + p.pts.map(function (n) {
          return (Math.round(n * 100) / 100).toString();
        }).join(", ") + ")"
      : "fn: " + p.fn + "()";
    if (CATS.indexOf(p.cat) < 0) CATS.push(p.cat);
  });

  global.PRESETS = RAW;
  global.PRESET_CATS = CATS;
})(this);
