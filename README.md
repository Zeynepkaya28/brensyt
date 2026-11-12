# Brensyt 🧸

Kırmızı atkılı, kahverengi bereli ayıcık Brensyt ile dil öğrenme uygulaması.
Dokuz dil modülü: İngilizce, Almanca, İspanyolca, Fransızca, Türkçe, Portekizce, Kürtçe (Kurmancî), Rusça, Çince.

## Çalıştırma

```bash
npm install
```

```bash
npm start
```

Sonra tarayıcıda `http://localhost:5173` adresini açın. Node.js 21.7 veya üstü gerekir.

## Ayarlar (`.env`)

`.env.example` dosyasını `.env` adıyla kopyalayıp doldurun, sonra uygulamayı yeniden başlatın:

| Ayar | Ne işe yarar |
|---|---|
| `ANTHROPIC_API_KEY` | Brensyt ile sohbet ve çeviri, kişisel program, okuma parçası üretme, yazı düzeltme, deneme sınavı. Anahtar yalnızca sunucuda durur. |
| `GOOGLE_CLIENT_ID` | "Google ile bağlan" düğmesi. Google Cloud Console → OAuth istemcisi; izin verilen kaynak `http://localhost:5173`. |

Anahtar olmadan çalışanlar: kartlar, tekrar, hata defteri, kelime sınavı, kalıp defteri, dil bilgisi, hazır İngilizce okuma parçası, geri sayım, hazır program, ödüller, çocuk bölümü.

## Neler var

**Günlük çalışma**
- **Kart köşesi**: günde 5 kelime. Kartı çevir, dinle, mikrofona söyle; sonra anlamını yaz. Doğruysa tik ve "dın"; yanlışsa ayıcık homurdanır ve aynı kartta kalırsın.
- **Seri**: 7 günlük seri tamamlanınca günlük kelime 6 olur; her 7 günde bir artarak 100'e kadar gider. "Seri dondurma" bir günlük boşluğu affeder.
- **Akıllı tekrar**: bilinen kelime 1, 3, 7, 14, 30 gün sonra; takılınan kelime ertesi gün yeniden gelir.
- **Zor kelimelerim**: kartlarda ve sınavda takılınan kelimelerin hata defteri.
- **Günün görevleri** ve çalışma **hatırlatması** (bildirim yalnızca uygulama açıkken gelir).

**Sınav**
- **Kelime sınavı**: yalnızca öğrenilen kelimelerden; anlam, dinleme, boşluk doldurma, cümle sıralama. Süre bitince Brensyt ekrana atlar ve o dilde "bitti" der.
- **Deneme sınavı**: Brensyt YDS, YDT, IELTS ya da TOEFL tarzında özgün sorular yazar (5–20 soru); sonuçta konu bazında başarı ve çözümler.
- **Geri sayım**: YDS, YDT, IELTS, TOEFL ve kendi eklediğin sınavlar. "Tarihleri canlı güncelle" düğmesi tarihleri resmi sitelerden (ÖSYM, IELTS, ETS) web aramasıyla çeker ve kaynağını gösterir; API anahtarı gerekir. YDS ve YDT tarihleri ÖSYM takviminden gelir (`public/js/core/exam-dates.js`) ve sınav geçince sıradaki oturuma geçer; IELTS ve TOEFL çok sık yapıldığı için kendi randevu tarihini girersin.
- **Sınav sonuçlarım** (Geçmiş sayfası): gerçek IELTS, TOEFL, YDS, YDT, YÖKDİL ya da başka sınav puanlarını gir, hedef belirle, gelişimini grafikte gör.

**Atölye**
- **Dil bilgisi**: her dil için kısa konu anlatımı, örnekler, mini alıştırma.
- **Okuma**: seviyeye göre parça; kelimeye dokununca anlamı çıkar ve kart destesine eklenebilir.
- **Yazma**: yazdığını Brensyt düzeltir; IELTS/TOEFL görevlerinde tahmini puan verir.
- **Dinleme**: dikte (cümleyi dinle, yaz) ve iki kişilik diyalog + sorular. Hazır İngilizce diyalog var; yenilerini Brensyt yazar.
- **Konuşma provası**: IELTS/TOEFL tarzı soru, mikrofona 60 saniyelik cevap, yazıya dökülen cevabın Brensyt tarafından değerlendirilmesi.
- **Kelime aileleri**: kartın altında eş anlamlı, zıt anlamlı ve kalıplar (24 İngilizce sınav kelimesi hazır; diğerlerini Brensyt çıkarır).

**Diğer**
- **Kalıp defteri** ve "Tavuk avı": kelimesi kelimesine çeviri mi, doğal çeviri mi?
- **Brensyt ile sohbet**: çeviri masası veya "bugünkü konumuz"; Kolay / Orta / Zor; isteğe bağlı kaynak taraması.
- **Çalışma programı**, **ilerleme grafikleri**, **rozetler** ve **Brensyt'in dolabı**.
- **Çocuk bölümü**: 13 konu (hayvanlar, renkler, sayılar, meyveler, aile, vücut, sofra, taşıtlar, ev, hava, okul, meslekler, doğa); her konuda animasyonlu ders, eşleştirme ve hafıza oyunu, kelime şarkısı. Ayrıca 22 renkli ve kendi rengini seçebildiğin boyama sayfası, hikâye kitabı, ebeveyn özeti, ebeveyn kilidi ve günlük süre sınırı.
- **Düello** (Sınav sayfası): aynı cihazda iki kişi sırayla yarışır. İnternet üzerinden düello henüz yok.
- **Lider tablosu** (Ödüller): bulut açıkken tüm kullanıcılar, kapalıyken bu cihazdaki hesaplar.
- **Koyu tema**; telefona ana ekran uygulaması olarak kurulabilir.

## Yapı

```
server.js              Yerel sunucu: dosyaları sunar, yapay zekâ isteklerini güvenle iletir
lib/api.js             Yapay zekâ mantığı (yerel sunucu ve Netlify işlevi ortak kullanır)
netlify/functions/     Netlify'da /api uçları: giriş ve günlük kota denetimi + lib/api.js
netlify.toml           Netlify ayarı ve güvenlik başlıkları
public/config.js       Herkese açık bulut ayarı (Supabase adresi ve publishable anahtar)
public/js/langs/       Her dil ayrı modül (kelimeler, örnek cümleler, kalıplar); grammar.js dil bilgisi konuları
public/js/core/        Giriş, kayıt, sesler, ayıcık, günlük kelime ve tekrar mantığı, görevler, dolap
public/js/views/       Ekranlar
public/css/style.css   Tasarım (açık ve koyu tema)
public/sw.js           İnternetsiz kullanım için dosya önbelleği
```

Yeni dil eklemek: `public/js/langs/` altına bir modül dosyası yazıp `langs/index.js` listesine ekleyin.
Kelime satırı biçimi: `kelime|anlam1/anlam2|okunuş|örnek cümle|cümlenin çevirisi`; `# A1` gibi satırlar seviye başlığıdır.

## Güvenlik notları

- API anahtarı tarayıcıya hiç gitmez; istekler sunucudan geçer, hız sınırı ve girdi denetimi vardır.
- Şifreler saklanmaz; tuzlanmış PBKDF2 özeti saklanır. 5 hatalı denemede 5 dakika kilit.
- Sıkı içerik güvenlik politikası (CSP); kullanıcı ve yapay zekâ metinleri sayfaya düz metin olarak eklenir.
- Bulut açıkken hesaplar Supabase'de tutulur; ilerleme yalnızca sahibi tarafından okunabilir/yazılabilir (satır güvenliği kuralları). Bulut kapalıyken hesap ve ilerleme yalnızca bu cihazın tarayıcısındadır.
- Herkese açık sitede yapay zekâ isteklerinin hepsi giriş ister ve günlük kotaya tabidir (kullanıcı başına 40, toplam 1500; aşağıya bakın). Böylece API krediniz kötüye kullanılamaz.

## Bulut hesap (Supabase)

`public/config.js` doluysa giriş ve ilerleme Supabase'dedir; boşaltırsanız uygulama tamamen yerel çalışır.

- **Tablolar:** `progress` (kullanıcının tüm ilerlemesi), `profiles` (lider tablosu için ad ve sayılar), `ai_usage` (günlük yapay zekâ kotası). Hepsinde satır güvenliği (RLS) açıktır.
- **Kota:** `bump_ai_usage` işlevi, Netlify işlevinin gönderdiği giriş anahtarını doğrular ve günlük sayacı artırır; gizli veritabanı anahtarı gerekmez.
- **E-posta doğrulaması:** Supabase varsayılan olarak kayıtta doğrulama e-postası ister ve ücretsiz e-posta gönderimi saatte birkaç ileti ile sınırlıdır. Kolaylık için panelden *Authentication → Providers → Email → Confirm email* seçeneğini kapatabilirsiniz.
- **Google ile giriş:** Panelde *Authentication → Providers → Google* açılıp Google Cloud'dan alınan istemci kimliği ve gizli anahtar girildikten sonra `public/config.js` içinde `googleLogin: true` yapın. Yönlendirme adresi olarak sitenizin adresini ve Supabase'in gösterdiği geri dönüş adresini ekleyin.
- **Sızdırılmış şifre koruması:** Supabase panelinde (planınız izin veriyorsa) *Authentication → Passwords* altından açın.

## Yayınlama (Netlify)

Site statik dosyalar (`public/`) ve tek bir Netlify işlevinden (`netlify/functions/api.mjs`) oluşur.

1. Netlify'da bu depoyu bağlayın (ya da klasörü yükleyin). Ayarlar `netlify.toml` içindedir.
2. **Site configuration → Environment variables** altına gizli anahtarı ekleyin:
   - `ANTHROPIC_API_KEY` — Claude API anahtarınız (gizli; kimseyle paylaşmayın).
   - İsteğe bağlı: `AI_DAILY_LIMIT_PER_USER` (varsayılan 40), `AI_DAILY_LIMIT_GLOBAL` (varsayılan 1500), `BRENSYT_MODEL` (varsayılan `claude-opus-5-5`; daha ucuz ve hızlı bir model yazabilirsiniz).
3. **Site configuration → Access & security → Visitor access** altında "Team login" (yalnızca takım girişi) seçeneğini kapatın, site herkese açık olsun.
4. Yeniden yayınlayın.

Not: Netlify işlevleri en fazla 60 saniye çalışır. Uzun yapay zekâ işleri (20 soruluk deneme sınavı, canlı tarih araması) nadiren bu sınıra takılabilir; yeniden denemek yeterlidir.
