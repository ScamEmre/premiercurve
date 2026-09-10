/* Live motion preview.
   Drives the object-motion box (the beloved animated preview) and fires onFrame(t)
   each frame so the editor can move its trace dot along the curve.
   Also exposes a STATIC thumbnail drawer for the preset strip (no animation). */
(function (global) {
  "use strict";

  var COL = { curve: "#D6FF6B", zero: "rgba(241,242,245,.18)", grid: "rgba(241,242,245,.08)" };
  var PLAY_MS = 1150, HOLD_MS = 650;

  function fit(canvas) {
    var dpr = global.devicePixelRatio || 1;
    var w = canvas.clientWidth || parseInt(canvas.getAttribute("width"), 10) || 100;
    var h = canvas.clientHeight || parseInt(canvas.getAttribute("height"), 10) || 100;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  // static mini curve (preset strip thumbnails)
  function drawThumb(canvas, preset) {
    var f = fit(canvas), ctx = f.ctx, w = f.w, h = f.h, pad = 6;
    var over = preset.over, ymin = over ? -0.42 : -0.06, ymax = over ? 1.42 : 1.06;
    var X = function (x) { return pad + x * (w - 2 * pad); };
    var Y = function (y) { return h - pad - ((y - ymin) / (ymax - ymin)) * (h - 2 * pad); };
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1; ctx.strokeStyle = COL.zero;
    ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(1), Y(0)); ctx.stroke();
    ctx.strokeStyle = COL.grid; ctx.beginPath(); ctx.moveTo(X(0), Y(1)); ctx.lineTo(X(1), Y(1)); ctx.stroke();
    var N = 48, i, xx;
    ctx.beginPath();
    for (i = 0; i <= N; i++) { xx = i / N; if (i === 0) ctx.moveTo(X(xx), Y(preset.ease(xx))); else ctx.lineTo(X(xx), Y(preset.ease(xx))); }
    ctx.strokeStyle = COL.curve; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();
  }

  function Preview() {
    this.mover = null; this.box = null; this.mode = "position"; this.preset = null;
    this.onFrame = null; this._raf = 0;
  }
  Preview.prototype.setStage = function (mover, box) { this.mover = mover; this.box = box; };
  Preview.prototype.select = function (preset) { this.preset = preset; };
  Preview.prototype.setMode = function (mode) { this.mode = mode; };

  Preview.prototype._phase = function (now) {
    var cycle = PLAY_MS + HOLD_MS, m = now % cycle;
    return m < PLAY_MS ? (m / PLAY_MS) : 1;
  };
  Preview.prototype._applyMover = function (p) {
    if (!this.box || !this.mover) return;
    var moverW = this.mover.offsetWidth || 28;
    var travel = Math.max(0, this.box.clientWidth - 20 - 20 - moverW), half = travel / 2, s;
    this.mover.style.opacity = "1";
    switch (this.mode) {
      case "position": this.mover.style.transform = "translateX(" + (travel * p) + "px)"; break;
      case "scale":    s = 0.35 + 0.70 * p; this.mover.style.transform = "translateX(" + half + "px) scale(" + s + ")"; break;
      case "opacity":  this.mover.style.opacity = (0.12 + 0.88 * p).toFixed(3); this.mover.style.transform = "translateX(" + half + "px)"; break;
      case "rotate":   this.mover.style.transform = "translateX(" + half + "px) rotate(" + (p * 180) + "deg)"; break;
    }
  };
  Preview.prototype.start = function () {
    var self = this;
    function frame(ts) {
      var t = self._phase(ts);
      if (self.preset) { self._applyMover(self.preset.ease(t)); }
      if (self.onFrame) self.onFrame(t);
      self._raf = global.requestAnimationFrame(frame);
    }
    if (!self._raf) self._raf = global.requestAnimationFrame(frame);
  };

  Preview.drawThumb = drawThumb;
  global.Preview = Preview;
})(this);
