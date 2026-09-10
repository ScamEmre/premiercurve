/* Interactive curve editor (always visible).
   load(preset): cubic presets → draggable P1/P2 handles (editable);
                 fn presets (elastic/bounce) → curve drawn, handles hidden.
   Shows a graph-paper grid + an animated trace dot (set via setTrace).
   Emits pts on drag (cubic only). x clamped [0,1], y free (overshoot room). */
(function (global) {
  "use strict";

  var Y_MIN = -0.55, Y_MAX = 1.55, HIT = 16;

  function CurveEditor(canvas, onChange) {
    this.canvas = canvas;
    this.onChange = onChange || function () {};
    this.pts = [0.25, 0.10, 0.25, 1.0];
    this.editable = true;
    this.ease = Bezier.cubicBezier(0.25, 0.10, 0.25, 1.0);
    this.traceT = null;
    this.drag = -1;
    this._bind();
    this.resize();
  }

  CurveEditor.prototype.load = function (preset) {
    this.editable = (preset.type === "cubic");
    if (this.editable) {
      this.pts = preset.pts.slice(0);
      this.ease = Bezier.cubicBezier(this.pts[0], this.pts[1], this.pts[2], this.pts[3]);
    } else {
      this.ease = preset.ease;   // fn preset: display-only
    }
    this.draw();
  };

  CurveEditor.prototype.setPts = function (pts, silent) {
    this.editable = true;
    this.pts = [Math.max(0, Math.min(1, pts[0])), pts[1], Math.max(0, Math.min(1, pts[2])), pts[3]];
    this.ease = Bezier.cubicBezier(this.pts[0], this.pts[1], this.pts[2], this.pts[3]);
    this.draw();
    if (!silent) this.onChange(this.pts.slice(0));
  };

  CurveEditor.prototype.setTrace = function (t) { this.traceT = t; this.draw(); };

  CurveEditor.prototype._pad = function () { return 18; };
  CurveEditor.prototype._X = function (x) { var p = this._pad(); return p + x * (this.w - 2 * p); };
  CurveEditor.prototype._Y = function (y) { var p = this._pad(); return this.h - p - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (this.h - 2 * p); };
  CurveEditor.prototype._invX = function (px) { var p = this._pad(); return (px - p) / (this.w - 2 * p); };
  CurveEditor.prototype._invY = function (py) { var p = this._pad(); return Y_MIN + ((this.h - p - py) / (this.h - 2 * p)) * (Y_MAX - Y_MIN); };

  CurveEditor.prototype.resize = function () {
    var dpr = global.devicePixelRatio || 1;
    var stage = this.canvas.parentNode;
    var availW = (stage && stage.clientWidth) || 300;
    var availH = (stage && stage.clientHeight) || 300;
    var side = Math.max(140, Math.min(availW, availH));
    this.canvas.style.width = side + "px";
    this.canvas.style.height = side + "px";
    this.canvas.width = Math.round(side * dpr);
    this.canvas.height = Math.round(side * dpr);
    this.ctx = this.canvas.getContext("2d");
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = side; this.h = side;
    this.draw();
  };

  CurveEditor.prototype._localPos = function (e) {
    var r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  CurveEditor.prototype._hit = function (pos) {
    if (!this.editable) return -1;
    var h1x = this._X(this.pts[0]), h1y = this._Y(this.pts[1]);
    var h2x = this._X(this.pts[2]), h2y = this._Y(this.pts[3]);
    var d1 = Math.hypot(pos.x - h1x, pos.y - h1y), d2 = Math.hypot(pos.x - h2x, pos.y - h2y);
    if (d1 <= HIT && d1 <= d2) return 0;
    if (d2 <= HIT) return 1;
    return -1;
  };
  CurveEditor.prototype._bind = function () {
    var self = this;
    this.canvas.addEventListener("mousedown", function (e) {
      var pos = self._localPos(e);
      self.drag = self._hit(pos);
      if (self.drag >= 0) { e.preventDefault(); self.canvas.style.cursor = "grabbing"; }
    });
    global.addEventListener("mousemove", function (e) {
      var pos = self._localPos(e);
      if (self.drag < 0) { self.canvas.style.cursor = (self._hit(pos) >= 0) ? "grab" : "default"; return; }
      var x = Math.max(0, Math.min(1, self._invX(pos.x)));
      var y = Math.max(Y_MIN, Math.min(Y_MAX, self._invY(pos.y)));
      if (self.drag === 0) { self.pts[0] = x; self.pts[1] = y; } else { self.pts[2] = x; self.pts[3] = y; }
      self.ease = Bezier.cubicBezier(self.pts[0], self.pts[1], self.pts[2], self.pts[3]);
      self.draw();
      self.onChange(self.pts.slice(0));
    });
    global.addEventListener("mouseup", function () {
      if (self.drag >= 0) { self.drag = -1; self.canvas.style.cursor = "grab"; }
    });
  };

  CurveEditor.prototype.draw = function () {
    var ctx = this.ctx, w = this.w, h = this.h, i;
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    var X = this._X.bind(this), Y = this._Y.bind(this);
    var yTop = Y(Y_MAX), yBot = Y(Y_MIN), xL = X(0), xR = X(1);

    // graph-paper grid
    ctx.lineWidth = 1; ctx.strokeStyle = "rgba(241,242,245,0.045)";
    ctx.beginPath();
    for (i = 0; i <= 10; i++) { var px = X(i / 10); ctx.moveTo(px, yTop); ctx.lineTo(px, yBot); }
    for (i = Math.ceil(Y_MIN * 10); i <= Math.floor(Y_MAX * 10); i++) { var py = Y(i / 10); ctx.moveTo(xL, py); ctx.lineTo(xR, py); }
    ctx.stroke();
    ctx.strokeStyle = "rgba(241,242,245,0.08)";
    ctx.beginPath(); ctx.moveTo(X(0.5), yTop); ctx.lineTo(X(0.5), yBot); ctx.moveTo(xL, Y(0.5)); ctx.lineTo(xR, Y(0.5)); ctx.stroke();

    // unit band + unit lines
    ctx.fillStyle = "rgba(214,255,107,0.035)";
    ctx.fillRect(xL, Y(1), xR - xL, Y(0) - Y(1));
    ctx.strokeStyle = "rgba(241,242,245,0.20)";
    ctx.beginPath(); ctx.moveTo(xL, Y(0)); ctx.lineTo(xR, Y(0)); ctx.moveTo(xL, Y(1)); ctx.lineTo(xR, Y(1)); ctx.stroke();

    // handle guides + curve
    if (this.editable) {
      ctx.strokeStyle = "rgba(214,255,107,0.42)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(this.pts[0]), Y(this.pts[1])); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(1), Y(1)); ctx.lineTo(X(this.pts[2]), Y(this.pts[3])); ctx.stroke();
    }
    var N = 72, xx;
    ctx.beginPath();
    for (i = 0; i <= N; i++) { xx = i / N; if (i === 0) ctx.moveTo(X(xx), Y(this.ease(xx))); else ctx.lineTo(X(xx), Y(this.ease(xx))); }
    ctx.strokeStyle = "#D6FF6B"; ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.stroke();

    // trace dot (live "what it does")
    if (this.traceT != null) {
      var tx = X(this.traceT), ty = Y(this.ease(this.traceT));
      ctx.strokeStyle = "rgba(214,255,107,0.20)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tx, yTop); ctx.lineTo(tx, yBot); ctx.stroke();
      ctx.fillStyle = "#F1F2F5"; ctx.beginPath(); ctx.arc(tx, ty, 3.2, 0, Math.PI * 2); ctx.fill();
    }

    // endpoints + handles
    ctx.fillStyle = "rgba(241,242,245,0.35)";
    dot(ctx, X(0), Y(0), 3); dot(ctx, X(1), Y(1), 3);
    if (this.editable) { handle(ctx, X(this.pts[0]), Y(this.pts[1])); handle(ctx, X(this.pts[2]), Y(this.pts[3])); }
  };

  function dot(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function handle(ctx, x, y) {
    ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#F1F2F5"; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = "#A6CC42"; ctx.stroke();
  }

  global.CurveEditor = CurveEditor;
})(this);
