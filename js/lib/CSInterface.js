/* Minimal CEP CSInterface wrapper (clean-room).
   Wraps window.__adobe_cep__ for evalScript + paths + theme.
   Falls back to a browser "mock" so the panel renders during design/testing
   outside Premiere. Not the full Adobe library — only what CurveCraft uses. */
(function (global) {
  "use strict";

  var cep = (typeof window !== "undefined") ? window.__adobe_cep__ : null;

  function CSInterface() {}

  CSInterface.SystemPath = { EXTENSION: "extension", USER_DATA: "userData" };

  CSInterface.prototype.isConnected = function () { return !!cep; };

  CSInterface.prototype.getHostEnvironment = function () {
    if (!cep) return null;
    try { return JSON.parse(cep.getHostEnvironment()); } catch (e) { return null; }
  };

  CSInterface.prototype.getApplicationID = function () {
    var env = this.getHostEnvironment();
    return env ? env.appName : "BROWSER";
  };

  CSInterface.prototype.getSystemPath = function (type) {
    if (!cep) return "";
    try { return decodeURI(cep.getSystemPath(type)); } catch (e) { return ""; }
  };

  /* evalScript(script, cb) — cb receives the ExtendScript return value as a string.
     In browser mode we short-circuit a couple of calls so the UI stays alive. */
  CSInterface.prototype.evalScript = function (script, cb) {
    cb = cb || function () {};
    if (cep && cep.evalScript) {
      cep.evalScript(script, cb);
    } else {
      var mock = "MOCK";
      if (/ocPing/.test(script)) mock = "OK:PING|BROWSER v0|-";
      setTimeout(function () { cb(mock); }, 0);
    }
  };

  global.CSInterface = CSInterface;
})(this);
