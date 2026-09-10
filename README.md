# PremierCurve

**Free easing / bezier‑curve panel for Adobe Premiere Pro (CEP).**
31 ready presets + a draggable custom curve editor that **bakes real keyframes** — including Elastic & Bounce. Interface in **English · Türkçe · Русский** (auto‑detected from Premiere's UI language).

> Ücretsiz Adobe Premiere Pro easing / bezier eğri paneli. 31 hazır preset + gerçek keyframe **bake** eden sürüklenebilir özel eğri editörü (Elastic & Bounce dahil). Arayüz **İngilizce · Türkçe · Rusça** (Premiere diline göre otomatik).

---

## English

### What it is
PremierCurve is a lightweight CEP panel that gives Premiere Pro the easing‑curve workflow you know from motion tools. Pick a preset or draw your own cubic‑bezier on a graph‑paper editor, hit **Apply to Keyframes**, and it bakes the curve onto your selected keyframe segment.

Because Premiere's ExtendScript can't write native temporal‑ease handles, PremierCurve **samples the curve and bakes many keyframes** — which is exactly what makes Elastic/Bounce possible.

### Features
- **31 presets** in 10 categories (Cubic, Quart, Quint, Expo, Circ, Back, Elastic, Bounce, …).
- **Custom curve editor** — draggable P1/P2 handles on a square graph‑paper canvas + `cubic-bezier()` text input; save your own presets (localStorage).
- **Live preview** — a moving object shows the easing in 4 modes (Position / Scale / Opacity / Rotation).
- **Real keyframe bake** — targets the segment under the playhead; **✕ Remove** returns to 2 anchors.
- **Tri‑lingual UI** — EN / TR / RU, remembered per user.
- **Update check** — the panel notifies you when a newer version is out.

### Install
**Easiest (recommended):** download the ready‑to‑install ZIP from
**https://emrekazak.com/premiercurve.php** — it includes everything (fonts) and installs in one step.

**Manual (from this repo):**
1. Copy the plugin folder to your CEP extensions directory:
   - **Windows:** `%APPDATA%\Adobe\CEP\extensions\com.emrekazak.premiercurve.cep\`
   - **macOS:** `~/Library/Application Support/Adobe/CEP/extensions/com.emrekazak.premiercurve.cep/`
2. Enable unsigned CEP panels (PlayerDebugMode) — one time:
   - **Windows (regedit):** `HKEY_CURRENT_USER\Software\Adobe\CSXS.11` → new string `PlayerDebugMode` = `1`
   - **macOS (terminal):** `defaults write com.adobe.CSXS.11 PlayerDebugMode 1`
3. Restart Premiere → **Window ▸ Extensions ▸ PremierCurve** (may be under *Legacy Extensions* in 2025+).

> The `fonts/` folder (Neue Haas Grotesk) is **not** included in this repository for licensing reasons; without it the panel falls back to system fonts. The ZIP on the site contains the full styled build.

### Usage
1. Select a clip and add/position keyframes on a property (Position, Scale, Opacity, Rotation…).
2. Put the **playhead between the two keyframes** you want to ease.
3. Open PremierCurve, pick a preset **or** draw your own curve.
4. Click **Apply to Keyframes**. To undo the easing, click **✕ Remove**.

### Requirements
Adobe Premiere Pro 2020+ (tested on 2025 / 2026). Windows & macOS. No subscription, no account.

---

## Türkçe

### Nedir
PremierCurve, Premiere Pro'ya motion araçlarından bildiğiniz easing‑eğrisi iş akışını kazandıran hafif bir CEP panelidir. Bir preset seçin ya da çetvelli editörde kendi cubic‑bezier eğrinizi çizin, **Keyframe'lere Uygula**'ya basın — eğri, seçili keyframe segmentine bake edilir.

Premiere'in ExtendScript'i gerçek temporal‑ease tutamaçları yazamadığı için PremierCurve **eğriyi örnekleyip çok sayıda keyframe bake eder** — Elastic/Bounce'u mümkün kılan da tam olarak budur.

### Özellikler
- **31 preset**, 10 kategori (Cubic, Quart, Quint, Expo, Circ, Back, Elastic, Bounce, …).
- **Özel eğri editörü** — kare çetvel üzerinde sürüklenebilir P1/P2 tutamaçları + `cubic-bezier()` metin girişi; kendi presetlerinizi kaydedin (localStorage).
- **Canlı önizleme** — hareketli bir obje easing'i 4 modda gösterir (Konum / Ölçek / Opaklık / Dönme).
- **Gerçek keyframe bake** — playhead'in olduğu segmenti hedefler; **✕ Kaldır** iki anchor'a döndürür.
- **Üç dilli arayüz** — TR / EN / RU, kullanıcı bazında hatırlanır.
- **Güncelleme kontrolü** — yeni sürüm çıkınca panel haber verir.

### Kurulum
**En kolayı (önerilen):** hazır kurulum ZIP'ini siteden indirin:
**https://emrekazak.com/premiercurve.php** — her şeyi (fontlar dahil) içerir, tek adımda kurulur.

**Elle (bu repodan):**
1. Plugin klasörünü CEP eklenti dizinine kopyalayın:
   - **Windows:** `%APPDATA%\Adobe\CEP\extensions\com.emrekazak.premiercurve.cep\`
   - **macOS:** `~/Library/Application Support/Adobe/CEP/extensions/com.emrekazak.premiercurve.cep/`
2. İmzasız CEP panellerini bir kez etkinleştirin (PlayerDebugMode):
   - **Windows (regedit):** `HKEY_CURRENT_USER\Software\Adobe\CSXS.11` → yeni string `PlayerDebugMode` = `1`
   - **macOS (terminal):** `defaults write com.adobe.CSXS.11 PlayerDebugMode 1`
3. Premiere'i yeniden başlatın → **Pencere ▸ Uzantılar ▸ PremierCurve** (2025+ sürümlerde *Legacy Extensions* altında olabilir).

> `fonts/` klasörü (Neue Haas Grotesk) lisans nedeniyle bu repoda **yer almaz**; onsuz panel sistem fontlarına düşer. Sitedeki ZIP tam stilize sürümü içerir.

### Kullanım
1. Bir klibi seçip bir özelliğe (Konum, Ölçek, Opaklık, Dönme…) keyframe ekleyin/konumlandırın.
2. **Playhead'i easing yapmak istediğiniz iki keyframe'in ARASINA** koyun.
3. PremierCurve'ü açın, bir preset seçin **ya da** kendi eğrinizi çizin.
4. **Keyframe'lere Uygula**'ya tıklayın. Geri almak için **✕ Kaldır**.

### Gereksinimler
Adobe Premiere Pro 2020+ (2025 / 2026'da test edildi). Windows & macOS. Abonelik yok, hesap yok.

---

## License
Code released under the **MIT License** (see `LICENSE`). Fonts are excluded and remain under their own license. "Adobe" and "Premiere Pro" are trademarks of Adobe Inc.; this is an independent, unaffiliated tool.

Made by **Emre Kazak** — [emrekazak.com](https://emrekazak.com) · [@emre.kazak](https://instagram.com/emre.kazak)
