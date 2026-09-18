/* PremierCurve i18n — TR / EN / RU.
   Static labels: [data-i18n] / [data-i18n-title] attributes → I18N.apply().
   Dynamic strings: I18N.t(key) / I18N.f(key, params).
   Host (ExtendScript) messages arrive as codes (E_*, BAKED|…, PING|…) and are
   rendered per-language here — host.jsx stays language-free. */
(function (global) {
  "use strict";

  var LS_KEY = "premiercurve.lang";
  var LANGS = ["tr", "en", "ru"];

  var DICT = {
    tr: {
      "conn.title": "Host bağlantısı",
      "conn.connecting": "bağlanıyor…",
      "conn.browser": "tarayıcı önizleme",
      "conn.error": "bağlantı hatası",
      "conn.clip": "klip",
      "conn.noSel": "seçim yok",
      "mode.position": "Konum",
      "mode.scale": "Ölçek",
      "mode.opacity": "Opaklık",
      "mode.rotate": "Dönme",
      "mode.title": "Hem önizleme modu hem Uygula/Kaldır hedefi — eğri bu özelliğe işlenir",
      "save.title": "Bu eğriyi kaydet",
      "clear.btn": "✕ Kaldır",
      "clear.title": "Bu segmentteki eğriyi sil (playhead'in olduğu iki keyframe arası)",
      "apply.btn": "Keyframe'lere Uygula",
      "update.btn": "⟳ Güncelle",
      "update.title": "Güncellemeleri denetle / indirme sayfası",
      "update.new": "● Yeni sürüm v{v} → Güncelle",
      "update.current": "✓ Güncel (v{v})",
      "status.ready": "hazır",
      "status.applying": "uygulanıyor…",
      "status.removing": "kaldırılıyor…",
      "status.saved": "kaydedildi",
      "status.noHost": "Premiere yok — tarayıcı önizleme",
      "status.cantSave": "bu eğri kaydedilemez (çok-noktalı)",
      "status.unexpected": "beklenmeyen: ",
      "input.locked": "çok-noktalı — elle düzenlenemez",
      "strip.empty": "Kayıtlı eğri yok — bir eğri seçip ＋ ile kaydet.",
      "custom": "Özel",
      "cat.Temel": "Temel",
      "cat.Kayıtlı": "Kayıtlı",
      "host.E_NO_SEQ": "Aktif sequence yok",
      "host.E_NO_CLIP": "Seçili klip yok — zaman çizelgesinde bir klip seç",
      "host.E_NO_PROP": "En az 2 keyframe'i olan bir özellik yok (Motion/Transform)",
      "host.E_MIN_KEYS": "En az 2 keyframe gerekli",
      "host.E_NO_RANGE": "Aralık yok — playhead'i iki keyframe arasına koy",
      "host.E_SAMPLES": "Örnek sayısı yetersiz",
      "host.E_NO_CLEAR": "Kaldırılacak aralık yok",
      "host.baked": "{name} • {t0}–{t1}s • {n} kf",
      "host.clean": "{name} • {t0}–{t1}s zaten temiz",
      "host.cleared": "{name} • {n} kf kaldırıldı ({t0}–{t1}s)",
      "host.ping": "{app} • klip: {clip}"
    },
    en: {
      "conn.title": "Host connection",
      "conn.connecting": "connecting…",
      "conn.browser": "browser preview",
      "conn.error": "connection error",
      "conn.clip": "clip",
      "conn.noSel": "no selection",
      "mode.position": "Position",
      "mode.scale": "Scale",
      "mode.opacity": "Opacity",
      "mode.rotate": "Rotation",
      "mode.title": "Preview mode and Apply/Remove target — the curve bakes onto this property",
      "save.title": "Save this curve",
      "clear.btn": "✕ Remove",
      "clear.title": "Remove the eased segment (between the two keyframes at the playhead)",
      "apply.btn": "Apply to Keyframes",
      "update.btn": "⟳ Update",
      "update.title": "Check for updates / download page",
      "update.new": "● New version v{v} → Update",
      "update.current": "✓ Up to date (v{v})",
      "status.ready": "ready",
      "status.applying": "applying…",
      "status.removing": "removing…",
      "status.saved": "saved",
      "status.noHost": "No Premiere — browser preview",
      "status.cantSave": "this curve can't be saved (multi-point)",
      "status.unexpected": "unexpected: ",
      "input.locked": "multi-point — not hand-editable",
      "strip.empty": "No saved curves — pick a curve and save it with ＋.",
      "custom": "Custom",
      "cat.Temel": "Basic",
      "cat.Kayıtlı": "Saved",
      "host.E_NO_SEQ": "No active sequence",
      "host.E_NO_CLIP": "No clip selected — select a clip in the timeline",
      "host.E_NO_PROP": "No property with 2+ keyframes (Motion/Transform)",
      "host.E_MIN_KEYS": "Needs at least 2 keyframes",
      "host.E_NO_RANGE": "No range — put the playhead between two keyframes",
      "host.E_SAMPLES": "Not enough samples",
      "host.E_NO_CLEAR": "Nothing to remove",
      "host.baked": "{name} • {t0}–{t1}s • {n} kf",
      "host.clean": "{name} • {t0}–{t1}s already clean",
      "host.cleared": "{name} • {n} kf removed ({t0}–{t1}s)",
      "host.ping": "{app} • clip: {clip}"
    },
    ru: {
      "conn.title": "Соединение с хостом",
      "conn.connecting": "подключение…",
      "conn.browser": "предпросмотр в браузере",
      "conn.error": "ошибка подключения",
      "conn.clip": "клип",
      "conn.noSel": "нет выбора",
      "mode.position": "Позиция",
      "mode.scale": "Масштаб",
      "mode.opacity": "Непрозрачность",
      "mode.rotate": "Поворот",
      "mode.title": "Режим предпросмотра и цель Применить/Убрать — кривая запекается в это свойство",
      "save.title": "Сохранить эту кривую",
      "clear.title": "Удалить кривую на этом сегменте (между двумя ключами у плейхеда)",
      "clear.btn": "✕ Убрать",
      "apply.btn": "Применить к ключам",
      "update.btn": "⟳ Обновить",
      "update.title": "Проверить обновления / страница загрузки",
      "update.new": "● Новая версия v{v} → Обновить",
      "update.current": "✓ Актуально (v{v})",
      "status.ready": "готово",
      "status.applying": "применяется…",
      "status.removing": "удаляется…",
      "status.saved": "сохранено",
      "status.noHost": "Premiere не найден — предпросмотр в браузере",
      "status.cantSave": "эту кривую нельзя сохранить (многоточечная)",
      "status.unexpected": "неожиданный ответ: ",
      "input.locked": "многоточечная — нельзя править вручную",
      "strip.empty": "Нет сохранённых кривых — выберите кривую и сохраните её кнопкой ＋.",
      "custom": "Своя",
      "cat.Temel": "Базовые",
      "cat.Kayıtlı": "Сохранённые",
      "host.E_NO_SEQ": "Нет активной секвенции",
      "host.E_NO_CLIP": "Клип не выбран — выберите клип на таймлайне",
      "host.E_NO_PROP": "Нет свойства минимум с 2 ключами (Motion/Transform)",
      "host.E_MIN_KEYS": "Нужно минимум 2 ключевых кадра",
      "host.E_NO_RANGE": "Нет диапазона — поставьте плейхед между двумя ключами",
      "host.E_SAMPLES": "Недостаточно сэмплов",
      "host.E_NO_CLEAR": "Нечего удалять",
      "host.baked": "{name} • {t0}–{t1}s • {n} kf",
      "host.clean": "{name} • {t0}–{t1}s уже чисто",
      "host.cleared": "{name} • удалено {n} kf ({t0}–{t1}s)",
      "host.ping": "{app} • клип: {clip}"
    }
  };

  var I18N = {
    lang: "en",
    _listeners: [],

    /* hostLocale: CEP appUILocale like "tr_TR" / "en_US"; browser falls back to navigator.language. */
    init: function (hostLocale) {
      var saved = null;
      try { saved = localStorage.getItem(LS_KEY); } catch (e) {}
      if (saved && LANGS.indexOf(saved) >= 0) { this.lang = saved; return this.lang; }
      var loc = String(hostLocale || (typeof navigator !== "undefined" && navigator.language) || "en").toLowerCase();
      if (loc.indexOf("tr") === 0) this.lang = "tr";
      else if (loc.indexOf("ru") === 0) this.lang = "ru";
      else this.lang = "en";
      return this.lang;
    },

    set: function (lang) {
      if (LANGS.indexOf(lang) < 0 || lang === this.lang) return;
      this.lang = lang;
      try { localStorage.setItem(LS_KEY, lang); } catch (e) {}
      for (var i = 0; i < this._listeners.length; i++) this._listeners[i](lang);
    },

    onChange: function (fn) { this._listeners.push(fn); },

    t: function (key) {
      var d = DICT[this.lang] || DICT.en;
      return (d[key] != null) ? d[key] : (DICT.en[key] != null ? DICT.en[key] : key);
    },

    /* t() + {param} interpolation: I18N.f("update.new", { v: "0.4" }) */
    f: function (key, params) {
      var s = this.t(key);
      if (params) for (var k in params) if (params.hasOwnProperty(k)) s = s.split("{" + k + "}").join(String(params[k]));
      return s;
    },

    /* Category display name — untranslated categories (Cubic, Expo…) pass through. */
    cat: function (name) {
      var key = "cat." + name;
      var d = DICT[this.lang] || DICT.en;
      return (d[key] != null) ? d[key] : name;
    },

    /* Walk [data-i18n] (textContent) + [data-i18n-title] (title attr). */
    apply: function (root) {
      root = root || document;
      var els = root.querySelectorAll("[data-i18n]"), i;
      for (i = 0; i < els.length; i++) els[i].textContent = this.t(els[i].getAttribute("data-i18n"));
      els = root.querySelectorAll("[data-i18n-title]");
      for (i = 0; i < els.length; i++) els[i].title = this.t(els[i].getAttribute("data-i18n-title"));
      try { document.documentElement.lang = this.lang; } catch (e) {}
    }
  };

  global.I18N = I18N;
})(this);
