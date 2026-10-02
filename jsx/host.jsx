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
/* Locale-independent property identity. Premiere LOCALIZES displayName
   ("Scale" → "Skalieren" on a German host, "Motion" → "Bewegung"), so name
   matching breaks outside English. Component.matchName ("AE.ADBE Motion")
   and the parameter ORDER inside the intrinsic components are stable across
   languages → key candidates by matchName + param index; English display
   names are only a fallback for unknown components (e.g. Transform effect). */
var CC_PARAM_KEYS = {
  "AE.ADBE Motion":  { 0: "position", 1: "scale", 4: "rotation", 5: "anchor" },
  "AE.ADBE Opacity": { 0: "opacity" },
  // Transform effect (Distort > Transform) — the motion-blur workflow animates here.
  "AE.ADBE Geometry":  { 0: "anchor", 1: "position", 3: "scale", 7: "rotation", 8: "opacity" },
  "AE.ADBE Geometry2": { 0: "anchor", 1: "position", 3: "scale", 7: "rotation", 8: "opacity" }
};
function ccParamKey(compMatch, idx, dispName) {
  var m = CC_PARAM_KEYS[compMatch] || CC_PARAM_KEYS["AE." + compMatch];
  if (m && m[idx] != null) return m[idx];
  var n = String(dispName || "");
  if (n.indexOf("Position") >= 0) return "position";
  if (n.indexOf("Scale") >= 0 && n.indexOf("Width") < 0) return "scale";
  if (n.indexOf("Rotation") >= 0) return "rotation";
  if (n.indexOf("Opacity") >= 0) return "opacity";
  return "";
}
function ccCandidates(clip) {
  var out = [], ci, pi;
  if (!clip || !clip.components) return out;
  for (ci = 0; ci < clip.components.numItems; ci++) {
    var comp = clip.components[ci], props, mn = "";
    try { props = comp.properties; } catch (e) { continue; }
    if (!props) continue;
    try { mn = String(comp.matchName || ""); } catch (eMn) {}
    for (pi = 0; pi < props.numItems; pi++) {
      var prop = props[pi];
      try {
        if (!prop.isTimeVarying()) continue;
        var keys = prop.getKeys();
        if (keys && keys.length >= 2) out.push({
          prop: prop,
          key: ccParamKey(mn, pi, prop.displayName),
          name: comp.displayName + " › " + prop.displayName
        });
      } catch (e2) {}
    }
  }
  return out;
}
/* spec = canonical key from the panel ("position"|"scale"|"rotation"|"opacity")
   or "auto". No key match → legacy substring → auto preference (old behavior),
   so a request for an un-keyframed property degrades exactly like v0.3 "auto". */
function ccPickTarget(clip, spec) {
  var cands = ccCandidates(clip);
  if (!cands.length) return null;
  spec = String(spec || "auto");
  var i, p, k;
  if (spec !== "auto") {
    for (i = 0; i < cands.length; i++) if (cands[i].key === spec) return cands[i];
    for (i = 0; i < cands.length; i++) if (cands[i].name.indexOf(spec) >= 0) return cands[i];
  }
  var pref = ["position", "scale", "rotation", "opacity"];
  for (p = 0; p < pref.length; p++)
    for (k = 0; k < cands.length; k++)
      if (cands[k].key === pref[p]) return cands[k];
  var prefEn = ["Position", "Scale", "Rotation", "Opacity"];
  for (p = 0; p < prefEn.length; p++)
    for (k = 0; k < cands.length; k++)
      if (cands[k].name.indexOf(prefEn[p]) >= 0) return cands[k];
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

// ── motion blur (Transform effect + shutter angle) ──
/* Premiere has no per-clip motion blur for intrinsic Motion. The standard trick:
   animate inside the Transform effect, untick "Use Composition's Shutter Angle",
   set Shutter Angle (360 = strongest). ocMotionBlur does it in one click:
     1) find the Transform effect on the selected clip, or add it (QE DOM —
        the public API cannot add effects),
     2) shutter: use-composition OFF + angle,
     3) MOVE keyframed Motion Position / Scale / Rotation into Transform so the
        existing animation gets blurred (Motion is reset to its neutral value).
   Identity is by matchName + param index (locale-independent, like targeting). */
var CC_T_IDX = { position: 1, uniform: 2, scale: 3, scaleW: 4, rotation: 7, opacity: 8, useComp: 9, shutter: 10 };
var CC_M_IDX = { position: 0, scale: 1, scaleW: 2, uniform: 3, rotation: 4 };
// getVideoEffectByName wants the UI (localized) name — try the known ones.
var CC_TRANSFORM_NAMES = ["Transform", "Transformieren", "Transformation", "Transformar", "Trasformazione",
  "\u0422\u0440\u0430\u043d\u0441\u0444\u043e\u0440\u043c\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435",
  "\u041f\u0440\u0435\u043e\u0431\u0440\u0430\u0437\u043e\u0432\u0430\u043d\u0438\u0435",
  "\u30c8\u30e9\u30f3\u30b9\u30d5\u30a9\u30fc\u30e0", "\ubcc0\ud615", "\u53d8\u6362", "\u8b8a\u5f62"];

function ccInList(list, v) { for (var i = 0; i < list.length; i++) if (list[i] === v) return true; return false; }
function ccCompMatch(c) { var mn = ""; try { mn = String(c.matchName || ""); } catch (e) {} return mn; }
function ccCompName(c) { var n = ""; try { n = String(c.displayName || ""); } catch (e) {} return n; }
function ccHasParamNamed(c, part) {
  try { for (var i = 0; i < c.properties.numItems; i++) if (String(c.properties[i].displayName || "").indexOf(part) >= 0) return true; } catch (e) {}
  return false;
}
/* The Transform effect is recognised by ANY of: matchName (Premiere builds differ:
   "AE.ADBE Geometry2" / "ADBE Geometry2"), its UI name (localized list), or its
   signature parameter ("Shutter Angle"). Never rely on a single identity. */
function ccIsTransform(c) {
  var mn = ccCompMatch(c);
  if (mn.indexOf("ADBE Geometry") >= 0) return true;
  if (mn.indexOf("ADBE Motion") >= 0 || mn.indexOf("ADBE Opacity") >= 0) return false;
  if (ccInList(CC_TRANSFORM_NAMES, ccCompName(c))) return true;
  return ccHasParamNamed(c, "Shutter Angle");
}
function ccFindTransform(clip) {
  if (!clip || !clip.components) return null;
  for (var i = 0; i < clip.components.numItems; i++) if (ccIsTransform(clip.components[i])) return clip.components[i];
  return null;
}
function ccFindOpacity(clip) {
  if (!clip || !clip.components) return null;
  var i, c;
  for (i = 0; i < clip.components.numItems; i++) { c = clip.components[i]; if (ccCompMatch(c).indexOf("ADBE Opacity") >= 0) return c; }
  for (i = 0; i < clip.components.numItems; i++) { c = clip.components[i]; if (ccCompName(c) === "Opacity") return c; }
  return null;
}
function ccFindMotion(clip) {
  if (!clip || !clip.components) return null;
  var i, c;
  for (i = 0; i < clip.components.numItems; i++) { c = clip.components[i]; if (ccCompMatch(c).indexOf("ADBE Motion") >= 0) return c; }
  for (i = 0; i < clip.components.numItems; i++) { c = clip.components[i]; if (ccCompName(c) === "Motion") return c; }
  return null;
}
function ccQEClip(seq, clip) {
  try { app.enableQE(); } catch (e) { return null; }
  var qSeq; try { qSeq = qe.project.getActiveSequence(); } catch (e2) { return null; }
  if (!qSeq) return null;
  var start = ccKsec(clip.start), ti, k;
  for (ti = 0; ti < seq.videoTracks.numTracks; ti++) {
    var tr = seq.videoTracks[ti], onTrack = false, j;
    for (j = 0; j < tr.clips.numItems; j++) {
      var cj = tr.clips[j], same = false;
      try { same = (cj.nodeId === clip.nodeId); } catch (eN) {}
      if (same) { onTrack = true; break; }
    }
    if (!onTrack) continue;
    var qTr; try { qTr = qSeq.getVideoTrackAt(ti); } catch (e3) { return null; }
    for (k = 0; k < qTr.numItems; k++) {
      var it; try { it = qTr.getItemAt(k); } catch (e4) { continue; }
      if (!it || String(it.type) !== "Clip") continue;
      var st = NaN; try { st = Number(it.start.secs); } catch (e5) {}
      if (Math.abs(st - start) < 0.02) return it;
    }
  }
  return null;
}
function ccAddTransform(seq, clip) {
  var qClip = ccQEClip(seq, clip);
  if (!qClip) return null;
  for (var i = 0; i < CC_TRANSFORM_NAMES.length; i++) {
    var before = clip.components.numItems;
    try {
      var fx = qe.project.getVideoEffectByName(CC_TRANSFORM_NAMES[i]);
      if (!fx) continue;
      qClip.addVideoEffect(fx);
    } catch (e) { continue; }
    var comp = ccFindTransform(clip);
    if (comp) return comp;
    // identity unknown on this build → the effect we just added is the new last component
    if (clip.components.numItems > before) return clip.components[clip.components.numItems - 1];
  }
  return null;
}
/* Shutter params: English display names first (most hosts), then fixed indices. */
function ccShutterProps(comp) {
  var props = comp.properties, use = null, ang = null, i;
  for (i = 0; i < props.numItems; i++) {
    var n = ""; try { n = String(props[i].displayName || ""); } catch (e) {}
    if (n.indexOf("Shutter Angle") >= 0) { if (n.indexOf("Use") >= 0) use = props[i]; else ang = props[i]; }
  }
  if (!use && props.numItems > CC_T_IDX.useComp) use = props[CC_T_IDX.useComp];
  if (!ang && props.numItems > CC_T_IDX.shutter) ang = props[CC_T_IDX.shutter];
  return { use: use, angle: ang };
}
function ccSetBool(prop, v) {
  try { prop.setValue(v, true); return true; } catch (e) {}
  try { prop.setValue(v ? 1 : 0, true); return true; } catch (e2) {}
  return false;
}
/* ── coordinate spaces (verified on Premiere 2026) ──────────────────────────
   Motion › Position is normalized to the SEQUENCE frame and applied AFTER
   Motion › Scale. Transform › Position is normalized to the clip's SOURCE frame
   and applied BEFORE Motion. So the same numbers do not mean the same move:
   a clip at Motion Scale 38 would travel only 38% as far.
   To keep the move identical we (a) carry Motion's scale into Transform so
   Motion ends at 100, and (b) convert positions around the centre by
   sequence size / (source size × remaining Motion scale).                    */
function ccNum(v, d) { v = Number(v); return isFinite(v) ? v : d; }
function ccSeqSize(seq) {
  var w = ccNum(seq.frameSizeHorizontal, 0), h = ccNum(seq.frameSizeVertical, 0);
  return (w > 0 && h > 0) ? [w, h] : null;
}
function ccSourceSize(clip) {
  try {
    var md = String(clip.projectItem.getProjectMetadata());
    var m = md.match(/Column\.Intrinsic\.VideoInfo>\s*(\d+)\s*x\s*(\d+)/);
    if (m) { var w = Number(m[1]), h = Number(m[2]); if (w > 0 && h > 0) return [w, h]; }
  } catch (e) {}
  return null;
}
function ccIsTV(p) { try { return !!p.isTimeVarying(); } catch (e) { return false; } }
function ccKeyed(p) { return ccIsTV(p) && ccKeySecs(p).length >= 2; }

/* Copy every keyframe of mProp onto tProp (values mapped by fn), then clear mProp
   and leave it at `neutral`. Returns the number of keyframes moved. */
function ccMoveKeys(mProp, tProp, fn, neutral) {
  var keys = ccKeySecs(mProp), vals = [], i;
  for (i = 0; i < keys.length; i++) { var v = mProp.getValueAtKey(keys[i]); vals.push(fn ? fn(v) : v); }
  try { tProp.setTimeVarying(true); } catch (e) {}
  for (i = 0; i < keys.length; i++) { tProp.addKey(keys[i]); tProp.setValueAtKey(keys[i], vals[i], true); }
  try { mProp.removeKeyRange(keys[0] - 1, keys[keys.length - 1] + 1, true); } catch (e2) {}
  try { mProp.setTimeVarying(false); } catch (e3) {}
  try { mProp.setValue(neutral, true); } catch (e4) {}
  return keys.length;
}

function ocMotionBlur(angle) {
  try {
    var seq = app.project ? app.project.activeSequence : null;
    if (!seq) return ccErr("E_NO_SEQ");
    var clip = ccFirstSelectedClip(seq);
    if (!clip) return ccErr("E_NO_CLIP");
    var a = Number(angle);
    if (!isFinite(a)) a = 360;
    a = Math.max(0, Math.min(360, a));

    var added = 0, tComp = ccFindTransform(clip);
    if (!tComp) { tComp = ccAddTransform(seq, clip); added = 1; }
    if (!tComp) return ccErr("E_BLUR_ADD");

    var sh = ccShutterProps(tComp);
    if (!sh.angle) return ccErr("E_BLUR_PARAM");
    if (sh.use) ccSetBool(sh.use, false);
    sh.angle.setValue(a, true);

    var moved = 0, mComp = ccFindMotion(clip);
    if (mComp && mComp.properties.numItems > CC_M_IDX.rotation && tComp.properties.numItems > CC_T_IDX.rotation) {
      var M = mComp.properties, T = tComp.properties;
      var mPos = M[CC_M_IDX.position], mSc = M[CC_M_IDX.scale], mScW = M[CC_M_IDX.scaleW], mRot = M[CC_M_IDX.rotation];
      var tPos = T[CC_T_IDX.position], tSc = T[CC_T_IDX.scale], tScW = T[CC_T_IDX.scaleW], tRot = T[CC_T_IDX.rotation];
      var posK = ccKeyed(mPos), scK = ccKeyed(mSc), rotK = ccKeyed(mRot);

      if (posK || scK || rotK) {
        var uniform = true; try { uniform = !!M[CC_M_IDX.uniform].getValue(); } catch (eU) {}
        // Motion scale that will REMAIN on Motion after this call (percent, per axis)
        var remH = 100, remW = 100;

        if (scK) {
          ccSetBool(T[CC_T_IDX.uniform], uniform);
          moved += ccMoveKeys(mSc, tSc, null, 100);
          if (!uniform && ccKeyed(mScW)) moved += ccMoveKeys(mScW, tScW, null, 100);
        } else {
          var sH = ccNum(mSc.getValue(), 100), sW = uniform ? sH : ccNum(mScW.getValue(), 100);
          var tFree = !ccIsTV(tSc) && Math.abs(ccNum(tSc.getValue(), 100) - 100) < 0.01;
          if (posK && tFree && (Math.abs(sH - 100) > 0.01 || Math.abs(sW - 100) > 0.01)) {
            // carry the static scale into Transform → Motion back to 100, picture unchanged
            ccSetBool(T[CC_T_IDX.uniform], uniform);
            tSc.setValue(sH, true);
            if (!uniform) { try { tScW.setValue(sW, true); } catch (eW) {} }
            mSc.setValue(100, true);
            if (!uniform) { try { mScW.setValue(100, true); } catch (eW2) {} }
          } else { remH = sH; remW = sW; }
        }

        if (posK) {
          var sq = ccSeqSize(seq), src = ccSourceSize(clip) || sq;
          var fx = 1, fy = 1;
          if (sq && src) { fx = sq[0] / (src[0] * remW / 100); fy = sq[1] / (src[1] * remH / 100); }
          if (!isFinite(fx) || fx <= 0) fx = 1;
          if (!isFinite(fy) || fy <= 0) fy = 1;
          moved += ccMoveKeys(mPos, tPos, function (v) {
            if (!(v instanceof Array) || v.length < 2) return v;
            return [0.5 + (v[0] - 0.5) * fx, 0.5 + (v[1] - 0.5) * fy];
          }, [0.5, 0.5]);
        }
        if (rotK) moved += ccMoveKeys(mRot, tRot, null, 0);
      }
    }
    // Opacity lives in its own intrinsic component → Transform › Opacity (same 0–100 range)
    var oComp = ccFindOpacity(clip);
    if (oComp && oComp.properties.numItems > 0 && tComp.properties.numItems > CC_T_IDX.opacity) {
      var mOp = oComp.properties[0];
      if (ccKeyed(mOp)) moved += ccMoveKeys(mOp, tComp.properties[CC_T_IDX.opacity], null, 100);
    }
    return ccOk("BLUR|" + a + "|" + moved + "|" + added);
  } catch (e) { return ccErr("EX|" + String(e)); }
}
