/* PremierCurve ExtendScript host (Premiere Pro) — clean-room.
   Bakes normalized progress samples (CSV 0..1) onto ONE keyframe segment:
   the two anchor keyframes bracketing the PLAYHEAD.

   Adobe exposes no keyframe-selection API, so the playhead picks the segment.
   BUT keyframe times (getKeys) are in CLIP/SOURCE time while getPlayerPosition
   is SEQUENCE time (see "keyframe time off by an hour"). So we convert the
   playhead through several reference candidates and use whichever lands inside
   the property's key range — robust to trimmed/moved clips and source timecode.

   The chosen segment [t0..t1] is echoed in the status so the user can verify.   */

#target premierepro

function ccErr(m) { return "ERR:" + m; }
function ccOk(m)  { return "OK:" + m; }
function ccKsec(k) { return (typeof k === "number") ? k : (k && k.seconds != null ? Number(k.seconds) : Number(k)); }
function ccFmt(x) { return (Math.round(x * 100) / 100); }

function ccKeySecs(prop) {
  var raw = prop.getKeys(), a = [], i;
  if (!raw) return a;
  for (i = 0; i < raw.length; i++) a.push(ccKsec(raw[i]));
  a.sort(function (x, y) { return x - y; });
  return a;
}
function ccHasKey(keys, t) { for (var i = 0; i < keys.length; i++) if (Math.abs(keys[i] - t) < 1e-4) return true; return false; }

function ccLerp(v0, v1, e) {
  if (v0 instanceof Array || v1 instanceof Array) {
    var a = (v0 instanceof Array) ? v0 : [v0];
    var b = (v1 instanceof Array) ? v1 : [v1];
    var n = Math.max(a.length, b.length), out = [], i;
    for (i = 0; i < n; i++) {
      var s = (a[i] == null) ? a[a.length - 1] : a[i];
      var t = (b[i] == null) ? b[b.length - 1] : b[i];
      out.push(s + (t - s) * e);
    }
    return out;
  }
  return v0 + (v1 - v0) * e;
}

// ── target discovery ────────────────────────────────
function ccFirstSelectedClip(seq) {
  if (!seq) return null;
  var tracks = seq.videoTracks, i, j;
  for (i = 0; i < tracks.numTracks; i++) {
    var tr = tracks[i];
    for (j = 0; j < tr.clips.numItems; j++) {
      var clip = tr.clips[j];
      try { if (clip.isSelected()) return clip; } catch (e) {}
    }
  }
  return null;
}
function ccCandidates(clip) {
  var out = [], ci, pi;
  if (!clip || !clip.components) return out;
  for (ci = 0; ci < clip.components.numItems; ci++) {
    var comp = clip.components[ci], props;
    try { props = comp.properties; } catch (e) { continue; }
    if (!props) continue;
    for (pi = 0; pi < props.numItems; pi++) {
      var prop = props[pi];
      try {
        if (!prop.isTimeVarying()) continue;
        var keys = prop.getKeys();
        if (keys && keys.length >= 2) out.push({ prop: prop, name: comp.displayName + " › " + prop.displayName });
      } catch (e2) {}
    }
  }
  return out;
}
function ccPickTarget(clip, spec) {
  var cands = ccCandidates(clip);
  if (!cands.length) return null;
  if (spec && spec !== "auto") for (var i = 0; i < cands.length; i++) if (cands[i].name.indexOf(spec) >= 0) return cands[i];
  var pref = ["Position", "Scale", "Rotation", "Opacity"];
  for (var p = 0; p < pref.length; p++)
    for (var k = 0; k < cands.length; k++)
      if (cands[k].name.indexOf(pref[p]) >= 0) return cands[k];
  return cands[0];
}
/* Messages are locale-free CODES (E_* / BAKED|… / PING|…) — the panel translates. */
function ccResolve(targetSpec) {
  var seq = app.project ? app.project.activeSequence : null;
  if (!seq) return ccErr("E_NO_SEQ");
  var clip = ccFirstSelectedClip(seq);
  if (!clip) return ccErr("E_NO_CLIP");
  var target = ccPickTarget(clip, targetSpec);
  if (!target) return ccErr("E_NO_PROP");
  return { seq: seq, clip: clip, target: target };
}

// ── playhead → key reference ────────────────────────
function ccClipTimes(clip) {
  var s = 0, ip = 0;
  try { s = ccKsec(clip.start); } catch (e) {}
  try { ip = ccKsec(clip.inPoint); } catch (e2) {}
  return { start: s, inPoint: ip };
}
/* Convert the sequence playhead into the same reference as getKeys() by trying
   several candidates and returning the one that falls inside the key range. */
function ccPlayheadInKeyRef(seq, clip, keys) {
  var ph; try { ph = ccKsec(seq.getPlayerPosition()); } catch (e) { return null; }
  if (ph == null || !isFinite(ph)) return null;
  var ct = ccClipTimes(clip);
  var cands = [ph, ph - ct.start + ct.inPoint, ph - ct.start, ph + ct.inPoint, ph + ct.start];
  var lo = keys[0], hi = keys[keys.length - 1], margin = Math.max(0.05, (hi - lo) * 0.05);
  for (var i = 0; i < cands.length; i++) { var c = cands[i]; if (isFinite(c) && c >= lo - margin && c <= hi + margin) return c; }
  return null;
}

// session memory of baked segments (for re-apply, since baked keys pollute adjacency)
function ccSegs() { if (!$.global.__pc_segs) $.global.__pc_segs = []; return $.global.__pc_segs; }
function ccManagedAt(pt) { var s = ccSegs(), i; for (i = 0; i < s.length; i++) if (pt >= s[i].t0 - 1e-4 && pt <= s[i].t1 + 1e-4) return s[i]; return null; }
function ccRecordSeg(t0, t1) { var s = ccSegs(), i; for (i = 0; i < s.length; i++) if (Math.abs(s[i].t0 - t0) < 1e-4 && Math.abs(s[i].t1 - t1) < 1e-4) return; s.push({ t0: t0, t1: t1 }); }
function ccForgetSeg(t0, t1) { var s = ccSegs(), i; for (i = 0; i < s.length; i++) if (Math.abs(s[i].t0 - t0) < 1e-4 && Math.abs(s[i].t1 - t1) < 1e-4) { s.splice(i, 1); return; } }

function ccPickSegment(prop, seq, clip) {
  var keys = ccKeySecs(prop);
  if (keys.length < 2) return null;
  var ph = ccPlayheadInKeyRef(seq, clip, keys);
  if (ph != null) {
    var m = ccManagedAt(ph);
    if (m && ccHasKey(keys, m.t0) && ccHasKey(keys, m.t1)) return { t0: m.t0, t1: m.t1, ph: ph };
    for (var j = 0; j < keys.length - 1; j++) if (ph >= keys[j] - 1e-6 && ph <= keys[j + 1] + 1e-6) return { t0: keys[j], t1: keys[j + 1], ph: ph };
    if (ph < keys[0]) return { t0: keys[0], t1: keys[1], ph: ph };
    return { t0: keys[keys.length - 2], t1: keys[keys.length - 1], ph: ph };
  }
  // no usable playhead → last segment, preferring a managed segment that ends there
  var last0 = keys[keys.length - 2], last1 = keys[keys.length - 1], segs = ccSegs(), i;
  for (i = 0; i < segs.length; i++) if (Math.abs(segs[i].t1 - last1) < 1e-3 && ccHasKey(keys, segs[i].t0)) return { t0: segs[i].t0, t1: segs[i].t1, ph: null };
  return { t0: last0, t1: last1, ph: null };
}

function ccStripBetween(prop, t0, t1) {
  var before = ccKeySecs(prop).length;
  try { prop.removeKeyRange(t0 + 1e-6, t1 - 1e-6, true); } catch (e) {}
  return before - ccKeySecs(prop).length;
}

// ── public ──────────────────────────────────────────
function ocPing() {
  try {
    var seq = app.project ? app.project.activeSequence : null;
    var clip = seq ? ccFirstSelectedClip(seq) : null;
    return ccOk("PING|" + (app.appName || "Premiere") + " v" + app.version + "|" + (clip ? clip.name : "-"));
  } catch (e) { return ccErr("EX|" + String(e)); }
}

function ocBake(targetSpec, csv) {
  try {
    var r = ccResolve(targetSpec);
    if (typeof r === "string") return r;
    var prop = r.target.prop;

    var seg = ccPickSegment(prop, r.seq, r.clip);
    if (!seg) return ccErr("E_MIN_KEYS");
    var t0 = seg.t0, t1 = seg.t1;
    if (!(t1 > t0)) return ccErr("E_NO_RANGE");

    var v0 = prop.getValueAtKey(t0), v1 = prop.getValueAtKey(t1);
    var parts = csv.split(","), n = parts.length - 1;
    if (n < 2) return ccErr("E_SAMPLES");

    ccStripBetween(prop, t0, t1);
    var count = 0, i;
    for (i = 1; i < n; i++) {
      var tt = t0 + (t1 - t0) * (i / n);
      prop.addKey(tt);
      prop.setValueAtKey(tt, ccLerp(v0, v1, parseFloat(parts[i])), true);
      count++;
    }
    ccRecordSeg(t0, t1);
    // target name goes LAST — it may contain arbitrary characters, panel re-joins the tail.
    return ccOk("BAKED|" + ccFmt(t0) + "|" + ccFmt(t1) + "|" + count + "|" + r.target.name);
  } catch (e) { return ccErr("EX|" + String(e)); }
}

function ocClear(targetSpec) {
  try {
    var r = ccResolve(targetSpec);
    if (typeof r === "string") return r;
    var prop = r.target.prop;
    var seg = ccPickSegment(prop, r.seq, r.clip);
    if (!seg) return ccErr("E_NO_CLEAR");
    var removed = ccStripBetween(prop, seg.t0, seg.t1);
    ccForgetSeg(seg.t0, seg.t1);
    if (removed === 0) return ccOk("CLEAN|" + ccFmt(seg.t0) + "|" + ccFmt(seg.t1) + "|" + r.target.name);
    return ccOk("CLEARED|" + removed + "|" + ccFmt(seg.t0) + "|" + ccFmt(seg.t1) + "|" + r.target.name);
  } catch (e) { return ccErr("EX|" + String(e)); }
}
