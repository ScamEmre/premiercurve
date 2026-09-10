/* PremierCurve controller.
   Editor-centric: pick a preset → it loads into the editable curve editor
   (cubic presets get drag handles; elastic/bounce load as display-only).
   Drag / type cubic-bezier to customize, then Apply → bakes the playhead segment. */
(function () {
  "use strict";

  var SAMPLES = 30;
  var APP_VERSION = "0.4";
  var UPDATE_URL = "https://emrekazak.com/api/version.php?product=premiercurve";
  var PRODUCT_PAGE = "https://emrekazak.com/premiercurve.php#indir";
  var SAVED_CAT = "Kayıtlı";   // internal category key — display text via I18N.cat()
  var LS_KEY = "premiercurve.customPresets";

  var cs = new CSInterface();
  var preview = new Preview();
  var editor = null;
  var state = { cat: "Temel", cur: null };
  var updateInfo = null;       // last version-check result, re-rendered on language switch

  var $ = function (id) { return document.getElementById(id); };
  var t = function (key) { return I18N.t(key); };
  var tabs = $("tabs"), strip = $("strip");

  function callHost(script, cb) { cs.evalScript(script, cb || function () {}); }
  function setStatus(msg, kind) { var el = $("status"); el.textContent = msg; el.className = "status" + (kind ? " is-" + kind : ""); }

  /* Host messages arrive as codes ("OK:BAKED|…", "ERR:E_NO_CLIP") — render per-language.
     Unknown payloads (old host, raw ExtendScript exceptions) fall through untranslated. */
  function fmtHostOk(payload) {
    var p = String(payload).split("|"), code = p[0];
    if (code === "BAKED"   && p.length >= 5) return I18N.f("host.baked",   { t0: p[1], t1: p[2], n: p[3], name: p.slice(4).join("|") });
    if (code === "CLEARED" && p.length >= 5) return I18N.f("host.cleared", { n: p[1], t0: p[2], t1: p[3], name: p.slice(4).join("|") });
    if (code === "CLEAN"   && p.length >= 4) return I18N.f("host.clean",   { t0: p[1], t1: p[2], name: p.slice(3).join("|") });
    return payload;
  }
  function fmtHostErr(payload) {
    payload = String(payload);
    if (/^E_[A-Z_]+$/.test(payload)) return t("host." + payload);
    if (payload.indexOf("EX|") === 0) return payload.slice(3);
    return payload;
  }
  function statusFromHost(res) {
    res = String(res || "");
    if (res.indexOf("OK:") === 0) setStatus(fmtHostOk(res.slice(3)), "ok");
    else if (res.indexOf("ERR:") === 0) setStatus(fmtHostErr(res.slice(4)), "err");
    else setStatus(t("status.unexpected") + res, "err");
  }

  // Build a cubic preset-like object from control points.
  function mkCubic(pts, name) {
    var over = (pts[1] < 0 || pts[1] > 1 || pts[3] < 0 || pts[3] > 1);
    var p = { id: "cur", name: name || t("custom"), type: "cubic", pts: pts.slice(0), over: over };
    p.ease = Bezier.makeEase(p);
    p.label = "cubic-bezier(" + pts.map(function (n) { return (Math.round(n * 1000) / 1000).toString(); }).join(", ") + ")";
    return p;
  }

  function loadCustoms() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch (e) { return []; } }
  function saveCustoms(a) { try { localStorage.setItem(LS_KEY, JSON.stringify(a)); } catch (e) {} }

  // ── connection status ───────────────────────────────
  function ping() {
    var conn = $("conn");
    if (!cs.isConnected()) { conn.textContent = t("conn.browser"); conn.className = "conn conn--browser"; return; }
    callHost("ocPing()", function (res) {
      res = String(res || "");
      if (res.indexOf("OK:") === 0) {
        var p = res.slice(3).split("|");
        if (p[0] === "PING" && p.length >= 3) {
          var clip = p.slice(2).join("|");
          conn.textContent = I18N.f("host.ping", { app: p[1].replace(/undefined/g, "Premiere"), clip: (clip === "-" ? t("conn.noSel") : clip) });
        } else {
          conn.textContent = res.slice(3);   // old host fallback
        }
        conn.className = "conn conn--ok";
      } else { conn.textContent = t("conn.error"); conn.className = "conn conn--wait"; }
    });
  }

  // ── update check ────────────────────────────────────
  function cmpVer(a, b) {
    var pa = String(a).split("."), pb = String(b).split("."), i, x, y;
    for (i = 0; i < Math.max(pa.length, pb.length); i++) {
      x = parseInt(pa[i] || "0", 10) || 0; y = parseInt(pb[i] || "0", 10) || 0;
      if (x > y) return 1; if (x < y) return -1;
    }
    return 0;
  }
  function openExternal(url) {
    try { if (window.cep && window.cep.util && window.cep.util.openURLInDefaultBrowser) window.cep.util.openURLInDefaultBrowser(url); else window.open(url, "_blank"); }
    catch (e) { try { window.open(url, "_blank"); } catch (e2) {} }
  }
  function renderUpdateButton() {
    var b = $("updateBtn"); if (!b) return;
    b.hidden = false;
    if (updateInfo && updateInfo.newer) {
      b.textContent = I18N.f("update.new", { v: updateInfo.version }); b.classList.add("is-new");
      b.onclick = function () { openExternal(updateInfo.page || PRODUCT_PAGE); };
    } else if (updateInfo) {
      b.textContent = I18N.f("update.current", { v: APP_VERSION }); b.classList.remove("is-new");
      b.onclick = function () { openExternal(PRODUCT_PAGE); };
    } else {
      b.textContent = t("update.btn"); b.classList.remove("is-new");
      b.onclick = function () { openExternal(PRODUCT_PAGE); };
    }
  }
  function checkUpdate() {
    if (typeof fetch !== "function") return;
    var ctrl, to;
    try { ctrl = new AbortController(); to = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, 4000); } catch (e) {}
    try {
      fetch(UPDATE_URL, { cache: "no-store", signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (to) clearTimeout(to);
          if (!j || !j.version) return;
          updateInfo = { version: j.version, page: j.download_page, newer: cmpVer(j.version, APP_VERSION) > 0 };
          renderUpdateButton();
        })
        .catch(function () { if (to) clearTimeout(to); });
    } catch (e) {}
  }

  // ── tabs + strip ────────────────────────────────────
  function buildTabs() {
    tabs.innerHTML = "";
    PRESET_CATS.concat([SAVED_CAT]).forEach(function (cat) {
      var b = document.createElement("button");
      b.className = "tab" + (cat === state.cat ? " is-active" : "");
      b.textContent = I18N.cat(cat);
      b.onclick = function () { state.cat = cat; buildTabs(); buildStrip(); };
      tabs.appendChild(b);
    });
  }

  function catItems(cat) {
    if (cat === SAVED_CAT) return loadCustoms().map(function (c, i) { var p = mkCubic(c.pts, c.name); p._savedIdx = i; return p; });
    return PRESETS.filter(function (p) { return p.cat === cat; });
  }

  function buildStrip() {
    strip.innerHTML = "";
    var items = catItems(state.cat);
    if (!items.length) {
      var empty = document.createElement("div");
      empty.className = "strip-empty";
      empty.textContent = t("strip.empty");
      strip.appendChild(empty);
      return;
    }
    items.forEach(function (p) {
      var th = document.createElement("div");
      th.className = "thumb" + (state.cur && state.cur.baseId === p.id ? " is-active" : "");
      th.setAttribute("data-id", p.id);
      var cv = document.createElement("canvas");
      var nm = document.createElement("div"); nm.className = "thumb-name"; nm.textContent = p.name;
      th.appendChild(cv); th.appendChild(nm);
      if (p._savedIdx != null) {
        var del = document.createElement("i"); del.className = "thumb-del"; del.textContent = "×";
        del.onclick = function (e) { e.stopPropagation(); var a = loadCustoms(); a.splice(p._savedIdx, 1); saveCustoms(a); buildStrip(); };
        th.appendChild(del);
      }
      strip.appendChild(th);
      Preview.drawThumb(cv, p);
      th.onclick = function () { selectPreset(p); };
    });
  }

  // ── selection + editing ─────────────────────────────
  function selectPreset(p) {
    editor.load(p);
    state.cur = { baseId: p.id, name: p.name, type: p.type, ease: p.ease, label: p.label, pts: p.pts ? p.pts.slice(0) : null, over: p.over };
    preview.select(state.cur);
    $("activeName").textContent = p.name;
    var inp = $("cubicInput");
    if (p.type === "cubic") { inp.readOnly = false; inp.value = p.label; inp.classList.remove("is-bad", "is-locked"); }
    else { inp.readOnly = true; inp.value = t("input.locked"); inp.classList.add("is-locked"); inp.classList.remove("is-bad"); }
    Array.prototype.forEach.call(strip.querySelectorAll(".thumb"), function (t) {
      t.classList.toggle("is-active", t.getAttribute("data-id") === p.id);
    });
  }

  function onEditorChange(pts) {
    var base = state.cur ? state.cur.name : t("custom");
    var cur = mkCubic(pts, base);
    state.cur = { baseId: (state.cur && state.cur.baseId) || "cur", name: base, type: "cubic", ease: cur.ease, label: cur.label, pts: pts.slice(0), over: cur.over };
    preview.select(state.cur);
    var inp = $("cubicInput");
    if (document.activeElement !== inp) inp.value = cur.label;
  }

  function applyCubicText() {
    var inp = $("cubicInput");
    var nums = (inp.value.match(/-?\d*\.?\d+/g) || []).map(Number);
    if (nums.length >= 4 && nums.every(function (n) { return isFinite(n); })) {
      editor.setPts([nums[0], nums[1], nums[2], nums[3]]);   // → onEditorChange
      inp.classList.remove("is-bad");
    } else { inp.classList.add("is-bad"); }
  }

  // ── apply / clear ───────────────────────────────────
  function applyEasing() {
    if (!state.cur) return;
    if (!cs.isConnected()) { setStatus(t("status.noHost"), "err"); return; }
    var csv = Bezier.sample(state.cur.ease, SAMPLES).map(function (n) { return n.toFixed(5); }).join(",");
    setStatus(t("status.applying"));
    callHost('ocBake("auto",' + JSON.stringify(csv) + ')', statusFromHost);
  }
  function clearEasing() {
    if (!cs.isConnected()) { setStatus(t("status.noHost"), "err"); return; }
    setStatus(t("status.removing"));
    callHost('ocClear("auto")', statusFromHost);
  }

  function buildModes() {
    Array.prototype.forEach.call($("modes").children, function (btn) {
      btn.onclick = function () {
        Array.prototype.forEach.call($("modes").children, function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        preview.setMode(btn.getAttribute("data-mode"));
      };
    });
  }

  // ── language ────────────────────────────────────────
  function markLangButtons() {
    Array.prototype.forEach.call($("lang").children, function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-lang") === I18N.lang);
    });
  }
  function initLang() {
    var env = cs.getHostEnvironment();
    I18N.init(env && env.appUILocale);
    I18N.apply(document);
    markLangButtons();
    Array.prototype.forEach.call($("lang").children, function (b) {
      b.onclick = function () { I18N.set(b.getAttribute("data-lang")); };
    });
    I18N.onChange(function () {
      I18N.apply(document);
      markLangButtons();
      buildTabs();
      buildStrip();
      renderUpdateButton();
      setStatus(t("status.ready"));
      // re-render language-dependent dynamic bits of the current selection
      var inp = $("cubicInput");
      if (state.cur && state.cur.type !== "cubic") inp.value = t("input.locked");
      ping();
    });
  }

  // ── init ────────────────────────────────────────────
  function init() {
    initLang();
    editor = new CurveEditor($("curveEditor"), onEditorChange);
    preview.setStage($("mover"), $("previewBox"));
    preview.onFrame = function (t) { if (editor) editor.setTrace(t); };

    buildTabs();
    buildModes();
    buildStrip();

    var def = PRESETS.filter(function (p) { return p.name === "Ease Out"; })[0] || PRESETS[0];
    state.cat = def.cat; buildTabs(); buildStrip();
    selectPreset(def);

    preview.setMode("position");
    preview.start();
    setTimeout(function () { editor.resize(); }, 0);

    $("applyBtn").onclick = applyEasing;
    $("clearBtn").onclick = clearEasing;
    $("saveBtn").onclick = function () {
      if (!state.cur || !state.cur.pts) { setStatus(t("status.cantSave"), "err"); return; }
      var a = loadCustoms(); a.push({ name: t("custom") + " " + (a.length + 1), pts: state.cur.pts.slice(0) }); saveCustoms(a);
      state.cat = SAVED_CAT; buildTabs(); buildStrip(); setStatus(t("status.saved"), "ok");
    };
    var inp = $("cubicInput");
    inp.addEventListener("change", applyCubicText);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { applyCubicText(); inp.blur(); } });
    window.addEventListener("resize", function () { if (editor) editor.resize(); });

    ping();
    setStatus(t("status.ready"));
    renderUpdateButton();
    checkUpdate();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
