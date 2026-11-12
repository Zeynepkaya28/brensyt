// Rusça modülü. Kelime biçimi: "kelime|anlam1/anlam2|okunuş|örnek cümle|cümlenin Türkçesi"; "# A1" satırları seviye başlığıdır
export default {
  code: "ru", name: "Rusça", flag: "🇷🇺", speech: "ru-RU", answerIn: "Türkçe", timeUp: "Время вышло!",
  words: `
# A1
дом|ev|dom|Этот дом большой.|Bu ev büyük.
вода|su|voda|Вода холодная.|Su soğuk.
книга|kitap|kniga|Это моя книга.|Bu benim kitabım.
друг|arkadaş/dost|drug|Он мой друг.|O benim arkadaşım.
время|zaman/vakit|vremya|Время идёт быстро.|Zaman hızlı geçiyor.
работа|iş/çalışma|rabota
школа|okul|şkola|Школа сегодня закрыта.|Okul bugün kapalı.
город|şehir/kent|gorod|Город очень красивый.|Şehir çok güzel.
день|gün|den
ночь|gece|noç
есть|yemek/yemek yemek|yest
пить|içmek|pit
идти|gitmek/yürümek|idti
приходить|gelmek|prihodit
говорить|konuşmak/söylemek|govorit
учиться|öğrenmek/okumak|uçitsya
красивый|güzel|krasivıy
большой|büyük|bolşoy
маленький|küçük|malenkiy
сегодня|bugün|sevodnya|Сегодня тепло.|Bugün hava ılık.
завтра|yarın|zaftra
спасибо|teşekkürler/teşekkür ederim/sağ ol|spasibo|Спасибо за помощь.|Yardım için teşekkürler.
пожалуйста|lütfen/rica ederim|pojalusta
семья|aile|semya|Моя семья живёт в Москве.|Ailem Moskova'da yaşıyor.
ребёнок|çocuk|rebyonok|Ребёнок играет в саду.|Çocuk bahçede oynuyor.
хлеб|ekmek|hleb|Я покупаю хлеб.|Ekmek alıyorum.
улица|sokak/cadde|ulitsa
окно|pencere|akno
счастливый|mutlu|şçaslivıy
может быть|belki|mojet bıt
# A2
мужчина|adam/erkek|mujçina
женщина|kadın|jenşçina
мать|anne|mat
отец|baba|atets
брат|erkek kardeş/kardeş/abi|brat
сестра|kız kardeş/kardeş/abla|sestra
рыба|balık|rıba
молоко|süt|malako
чай|çay|çay
кофе|kahve|kofe
сахар|şeker|sahar
соль|tuz|sol
мясо|et|myaso
фрукт|meyve|frukt
стол|masa|stol
стул|sandalye|stul
дверь|kapı|dver
комната|oda|komnata
кровать|yatak|kravat
машина|araba|maşina
дорога|yol|daroga
море|deniz|more
гора|dağ|gara
дерево|ağaç|derevo
цветок|çiçek|tsvetok
солнце|güneş|sontse
луна|ay|luna
дождь|yağmur|dojd
снег|kar|sneg
деньги|para|dengi
год|yıl/sene|god
неделя|hafta|nedelya
месяц|ay|mesyats
час|saat|ças
утро|sabah|utro
вечер|akşam|veçer
имя|isim/ad|imya
язык|dil|yazık
страна|ülke|strana
мир|dünya|mir
сердце|kalp/yürek|sertse
голова|baş/kafa|galava
рука|el|ruka
глаз|göz|glaz
вопрос|soru|vapros
ответ|cevap/yanıt|atvet
жизнь|hayat/yaşam|jizn
любовь|aşk/sevgi|lyubov
собака|köpek|sabaka
кошка|kedi|koşka
видеть|görmek|videt
знать|bilmek|znat
хотеть|istemek|hatet
давать|vermek|davat
брать|almak|brat
делать|yapmak|delat
писать|yazmak|pisat
читать|okumak|çitat
спать|uyumak|spat
любить|sevmek|lyubit
покупать|satın almak/almak|pakupat
работать|çalışmak|rabotat
хороший|iyi|haroşiy
плохой|kötü|plahoy
новый|yeni|novıy
старый|eski|starıy
горячий|sıcak|garyaçiy
холодный|soğuk|halodnıy
лёгкий|kolay|lyohkiy
трудный|zor/güç|trudnıy
`,
  idioms: [
    { p: "Вешать лапшу на уши", lit: "Kulaklara erişte asmak", nat: "Birini kandırmak, yalan söylemek" },
    { p: "Ни пуха ни пера!", lit: "Ne tüy ne telek!", nat: "Bol şans!" },
    { p: "Когда рак на горе свистнет", lit: "Kerevit dağda ıslık çalınca", nat: "Balık kavağa çıkınca" },
    { p: "Делать из мухи слона", lit: "Sinekten fil yapmak", nat: "Pireyi deve yapmak" },
    { p: "Как рыба в воде", lit: "Sudaki balık gibi", nat: "Çok rahat, kendi evinde gibi" },
    { p: "Убить двух зайцев", lit: "İki tavşan öldürmek", nat: "Bir taşla iki kuş vurmak" },
    { p: "Водить за нос", lit: "Burnundan tutup gezdirmek", nat: "Oyalamak, kandırmak" },
    { p: "Руки не доходят", lit: "Eller ulaşmıyor", nat: "Bir türlü fırsat bulamamak" },
  ],
};
