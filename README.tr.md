<div align="center">

<img src="icons/icon.png" width="72" alt="PremierCurve ikonu" />

# PremierCurve

[English](README.md) · **Türkçe**

**Adobe Premiere Pro için easing & bezier eğri editörü** — Premiere'in hiç vermediği graph editor.

[![sürüm](https://img.shields.io/badge/s%C3%BCr%C3%BCm-0.4.1-D6FF6B?labelColor=0A0A0A)](https://emrekazak.com/api/version.php?product=premiercurve)
[![host](https://img.shields.io/badge/Premiere%20Pro-2024%2B-9999FF?labelColor=0A0A0A)](#gereksinimler)
[![platform](https://img.shields.io/badge/platform-Windows%20%C2%B7%20macOS-F1F2F5?labelColor=0A0A0A)](#kurulum)
[![arayüz dilleri](https://img.shields.io/badge/aray%C3%BCz-TR%20%C2%B7%20EN%20%C2%B7%20RU-E5FF8C?labelColor=0A0A0A)](#%C3%BC%C3%A7-dilli-aray%C3%BCz)
[![lisans](https://img.shields.io/badge/lisans-MIT-A6CC42?labelColor=0A0A0A)](LICENSE)
[![fiyat](https://img.shields.io/badge/fiyat-%C3%BCcretsiz%2C%20abonelik%20yok-D6FF6B?labelColor=0A0A0A)](https://emrekazak.com/premiercurve.php)

[**⬇ İndir**](https://emrekazak.com/premiercurve.php#indir) · [Ürün sayfası](https://emrekazak.com/premiercurve.php) · [Hata bildir](https://github.com/ScamEmre/premiercurve/issues)

<img src="docs/panel-tr.png" width="420" alt="PremierCurve paneli — preset galerisi, eğri editörü ve canlı hareket önizlemesi" />

</div>

---

## Neden

Premiere Pro'da bir keyframe'i yumuşatmak, sağ tıklayıp *Ease In / Ease Out* seçmekten ibaret — her seferinde aynı, ayarlanamayan yumuşama. **Graph editor da yok, cubic-bezier girişi de**; After Effects kullanıcılarının doğal karşıladığı araç, Premiere keyframe'leri için hiç var olmadı.

PremierCurve bunu dock'lanabilir bir panel olarak ekliyor:

- **31 seçilmiş preset**, 10 aile — Ease, Cubic, Quart, Quint, Expo, Circ, Back, Snappy, **Elastic**, **Bounce**
- **Kendi eğrini çiz** — kareli graph-paper editörde iki kontrol noktasını sürükle veya herhangi bir `cubic-bezier(…)` değerini yapıştır
- **Canlı hareket önizlemesi** — 4 modda (Konum / Ölçek / Opaklık / Dönme) gerçek animasyonlu obje; önizleme ile uygulanan keyframe'ler *aynı* `ease(t)` fonksiyonunu kullanır → ne görürsen onu alırsın
- **Özel eğrileri kaydet**, preset gibi yeniden kullan
- **Tek tıkla Kaldır** — uygulanan easing'i 2 uç keyframe'e geri temizler
- **Yerleşik güncelleme kontrolü** — yeni sürüm çıktığında footer haber verir

<div align="center">
<img src="docs/panel-custom-en.png" width="380" alt="Sürükleme tutamaklarıyla düzenlenen overshoot eğrisi" />
<br/><sub>Overshoot eğrisi düzenlenirken — tutamakları sürükle veya cubic-bezier değerini yaz.</sub>
</div>

## Üç Dilli Arayüz

Panel **Türkçe, English ve Русский** konuşur. İlk açılışta Premiere'in arayüz diline otomatik uyar; istediğin an footer'daki `TR · EN · RU` düğmeleriyle değiştirirsin.

<div align="center">
<img src="docs/panel-en.png" width="330" alt="İngilizce arayüz" />&nbsp;&nbsp;
<img src="docs/panel-ru.png" width="330" alt="Rusça arayüz" />
</div>

**v0.4.1**'den beri özellik hedefleme tamamen **dilden bağımsız**: klipler görünen isim yerine `Component.matchName` + parametre index'i ile taranır — host *Scale*'e *Skalieren* (Almanca) ya da *Échelle* (Fransızca) dese bile doğru özellik bulunur.

## Gereksinimler

| | |
|---|---|
| **Host** | Adobe Premiere Pro 2024 veya üzeri (2025 / 2026 önerilir) |
| **İşletim sistemi** | Windows · macOS |
| **Motor** | CEP · ExtendScript (kurulum sihirbazı yok, servis yok, telemetri yok) |

## Kurulum

> **En hızlı yol:** [indirme sayfasından](https://emrekazak.com/premiercurve.php#indir) hazır ZIP'i al — içinde üç dilli, adım adım `KURULUM.txt` var. Bu repodan kurmak da aynı şekilde çalışır (not: repo, ticari NHG font dosyalarını **içermez** — panel sistem fontuna düşer; resmi ZIP tam stillidir).

**1 — İmzasız eklenti iznini aç** *(bir kez — PlayerDebugMode)*

Windows — `regedit` içinde şu anahtarların her birine `PlayerDebugMode = 1` String (`REG_SZ`) değeri ekle:

```
HKEY_CURRENT_USER\Software\Adobe\CSXS.11
HKEY_CURRENT_USER\Software\Adobe\CSXS.12
```

macOS — Terminal'de:

```bash
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
```

**2 — Eklenti klasörünü kopyala**

Paneli (bu repoyu, ya da ZIP'teki `com.emrekazak.premiercurve.cep` klasörünü) şuraya kopyala:

```
Windows:  %APPDATA%\Adobe\CEP\extensions\com.emrekazak.premiercurve.cep\
macOS:    ~/Library/Application Support/Adobe/CEP/extensions/com.emrekazak.premiercurve.cep/
```

**3 — Premiere'i yeniden başlat** → `Window ▸ Extensions ▸ PremierCurve` *(2025/2026'da `Window ▸ Extensions (Legacy)` altında olabilir)*.

## Kullanım

1. Zaman çizelgesinde, bir özelliğinde **en az 2 keyframe** olan bir klip seç (ör. *Effect Controls ▸ Motion ▸ Position*).
2. **Playhead'i, yumuşatmak istediğin iki keyframe'in arasına** koy — hedef segment böyle seçilir (Premiere keyframe-seçimi API'si sunmaz).
3. Hedef özelliği **Konum / Ölçek / Opaklık / Dönme** düğmeleriyle seç — bu düğmeler hem canlı önizlemeyi hem de Uygula'nın yazacağı özelliği belirler.
4. Bir preset seç ya da kendi eğrini çiz, sonra **Keyframe'lere Uygula**'ya bas. Durum çubuğu tam olarak ne yazıldığını söyler: `Motion › Scale • 4.0–4.7s • 29 kf`.
5. **✕ Kaldır** segmenti tek tıkla 2 uç keyframe'e temizler. Farklı bir eğri uygulamak için direkt yeni preset'e bas; öncekini otomatik değiştirir.

> **İpucu:** Easing, ara keyframe'ler olarak *bake* edilir — bu yüzden `Ctrl+Z` tek tek geri alır; onun yerine **✕ Kaldır** kullan.

## Nasıl çalışır

Premiere'in ExtendScript API'si gerçek temporal-ease tutamakları yazamaz (bu, başka yerlerde *True Handles* diye pazarlanan, yalnız-UXP bir yetenek). PremierCurve bunun yerine **bake eder**: easing fonksiyonunu örnekleyip iki uç arasına ~30 ara keyframe yazar. Bedeli daha yoğun bir keyframe izi — kazancı ise hareketin *birebir* olması ve tek bir cubic-bezier'in ifade edemeyeceği ailelerin (**Elastic**, **Bounce**) mümkün olması.

Diğer mühendislik notları:

- **Playhead → segment eşleme**, sequence zamanını `getKeys()`'in kullandığı klip/kaynak zaman referansına çevirir; birden çok aday dener — kırpılmış/taşınmış klipler ve source timecode hedeflemeyi bozmaz.
- **Dilden bağımsız host protokolü** — ExtendScript tarafı mesaj kodları döndürür (`E_NO_CLIP`, `BAKED|…`), panel bunları aktif arayüz dilinde gösterir.
- **Güncelleme kontrolü** açılışta `emrekazak.com/api/version.php`'ye sorar (4 sn timeout, sessizce geçer, takip yok).

## Geliştirme

Build adımı yok — düz HTML/CSS/JS + ExtendScript.

```bash
git clone https://github.com/ScamEmre/premiercurve.git
```

- **Tasarım-zamanı önizleme:** `index.html`'i Chrome'da aç — arayüzün tamamı "tarayıcı önizleme" modunda çalışır (host olmadan Uygula devre dışıdır).
- **Premiere içinde canlı debug:** panel `http://localhost:8560` adresinde Chrome DevTools sunar (bkz. `.debug`).

<details>
<summary><b>Proje yapısı</b></summary>

```
premiercurve-cep/
├─ CSXS/manifest.xml      host=PPRO, panel geometrisi, jsx/host.jsx'i yükler
├─ .debug                 uzak-debug portu 8560
├─ index.html             panel girişi
├─ css/style.css          karbon-siyah + fosfor arayüz
├─ js/
│  ├─ lib/CSInterface.js  minimal CEP köprüsü (+ tarayıcı fallback)
│  ├─ i18n.js             TR/EN/RU sözlük + dil seçici
│  ├─ bezier.js           easing matematiği (cubic-bezier çözücü + Penner fonksiyonları)
│  ├─ presets.js          seçilmiş preset verisi
│  ├─ preview.js          paylaşımlı-rAF canlı önizleme motoru
│  ├─ editor.js           sürüklenebilir graph-paper eğri editörü
│  └─ main.js             kontrolcü (galeri/sekme/uygula/i18n/güncelleme)
├─ jsx/host.jsx           ExtendScript bake motoru (dilden bağımsız mesaj kodları)
└─ docs/                  ekran görüntüleri
```

</details>

## Sürüm geçmişi

| Sürüm | Tarih | Öne çıkanlar |
|---|---|---|
| **0.4.1** | 18.09.2026 | Dilden bağımsız özellik hedefleme (`matchName` + parametre index'i); mod düğmeleri artık Uygula/Kaldır hedefini de seçiyor |
| **0.4** | 09.09.2026 | Üç dilli arayüz (TR / EN / RU) + otomatik dil algılama; dilden bağımsız host protokolü |
| **0.3** | 03.09.2026 | Editör-merkezli tek-ekran arayüz; her preset düzenlenebilir; playhead-segment hedefleme; güncelleme kontrolü |
| **0.2** | 02.09.2026 | İlk halka açık sürüm — preset galerisi, canlı önizleme, bake motoru |

## Yol haritası

- ZXP imzalama → tek tıkla kurulum (PlayerDebugMode gerekmez)
- Motion/Opacity dışındaki efekt özellikleri için parametre seçici
- Aynı arayüzü paylaşan UXP sürümü (CEP uzun vadede kullanımdan kalkıyor)

## Emeği geçenler & Lisans

[MIT](LICENSE) © [Emre Kazak](https://emrekazak.com). Clean-room geliştirme: bake yaklaşımı [OpenCurve](https://github.com/fayewave/OpenCurve)'den kavramsal olarak incelendi, preset-galerisi/canlı-önizleme deneyimi Eaze'den esinlendi — **hiçbir üçüncü taraf kodu kullanılmadı**. Neue Haas Grotesk ticari bir yazı tipidir ve bu repoda dağıtılmaz.
