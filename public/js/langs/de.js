// Almanca modülü. Kelime biçimi: "kelime|anlam1/anlam2|okunuş|örnek cümle|cümlenin Türkçesi"; "# A1" satırları seviye başlığıdır
export default {
  code: "de", name: "Almanca", flag: "🇩🇪", speech: "de-DE", answerIn: "Türkçe", timeUp: "Die Zeit ist um!",
  words: `
# A1
Haus|ev||Das Haus ist groß.|Ev büyük.
Wasser|su||Ich trinke Wasser.|Su içiyorum.
Buch|kitap||Das Buch ist neu.|Kitap yeni.
Freund|arkadaş/dost||Er ist mein Freund.|O benim arkadaşım.
Zeit|zaman/vakit||Ich habe keine Zeit.|Vaktim yok.
Arbeit|iş/çalışma
Schule|okul||Die Schule ist heute geschlossen.|Okul bugün kapalı.
Stadt|şehir/kent||Die Stadt ist sehr schön.|Şehir çok güzel.
Tag|gün
Nacht|gece
essen|yemek/yemek yemek
trinken|içmek
gehen|gitmek/yürümek
kommen|gelmek
sprechen|konuşmak
lernen|öğrenmek
schön|güzel
groß|büyük/uzun
klein|küçük
heute|bugün||Ich lerne heute Deutsch.|Bugün Almanca öğreniyorum.
morgen|yarın
danke|teşekkürler/teşekkür ederim/sağ ol
bitte|lütfen/rica ederim
Familie|aile||Meine Familie wohnt in Berlin.|Ailem Berlin'de yaşıyor.
Kind|çocuk||Das Kind spielt im Garten.|Çocuk bahçede oynuyor.
Brot|ekmek||Wir kaufen Brot.|Ekmek alıyoruz.
Straße|sokak/cadde/yol
Fenster|pencere
glücklich|mutlu||Ich bin sehr glücklich.|Çok mutluyum.
vielleicht|belki
# A2
Mann|adam/erkek
Frau|kadın
Mutter|anne
Vater|baba
Bruder|erkek kardeş/kardeş/abi
Schwester|kız kardeş/kardeş/abla
Fisch|balık
Milch|süt
Tee|çay
Kaffee|kahve
Zucker|şeker
Salz|tuz
Fleisch|et
Obst|meyve
Tisch|masa
Stuhl|sandalye
Tür|kapı
Zimmer|oda
Bett|yatak
Auto|araba
Weg|yol
Meer|deniz
Berg|dağ
Baum|ağaç
Blume|çiçek
Sonne|güneş
Mond|ay
Regen|yağmur
Schnee|kar
Geld|para
Jahr|yıl/sene
Woche|hafta
Monat|ay
Stunde|saat
Morgen|sabah
Abend|akşam
Name|isim/ad
Sprache|dil
Land|ülke
Welt|dünya
Herz|kalp/yürek
Kopf|baş/kafa
Hand|el
Auge|göz
Frage|soru
Antwort|cevap/yanıt
Leben|hayat/yaşam
Liebe|aşk/sevgi
Hund|köpek
Katze|kedi
sehen|görmek
wissen|bilmek
wollen|istemek
geben|vermek
nehmen|almak
machen|yapmak
schreiben|yazmak
lesen|okumak
schlafen|uyumak
lieben|sevmek
kaufen|satın almak/almak
arbeiten|çalışmak
gut|iyi
schlecht|kötü
neu|yeni
alt|eski
heiß|sıcak
kalt|soğuk
einfach|kolay
schwierig|zor/güç
`,
  idioms: [
    { p: "Ich verstehe nur Bahnhof", lit: "Sadece tren istasyonu anlıyorum", nat: "Hiçbir şey anlamadım" },
    { p: "Ich drücke dir die Daumen", lit: "Senin için başparmaklarımı sıkıyorum", nat: "Sana şans diliyorum" },
    { p: "Das ist nicht mein Bier", lit: "Bu benim biram değil", nat: "Bu beni ilgilendirmez" },
    { p: "Tomaten auf den Augen haben", lit: "Gözlerinde domates olmak", nat: "Burnunun ucunu görememek" },
    { p: "Schwein haben", lit: "Domuza sahip olmak", nat: "Şanslı olmak" },
    { p: "Die Nase voll haben", lit: "Burnu dolu olmak", nat: "Bıkmak, burasına kadar gelmek" },
    { p: "Jemandem auf den Keks gehen", lit: "Birinin bisküvisinin üstüne gitmek", nat: "Birinin sinirine dokunmak" },
    { p: "Zwei Fliegen mit einer Klappe schlagen", lit: "Bir sineklikle iki sinek vurmak", nat: "Bir taşla iki kuş vurmak" },
  ],
};
