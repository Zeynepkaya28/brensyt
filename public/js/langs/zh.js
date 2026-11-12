// Çince modülü. Kelime biçimi: "kelime|anlam1/anlam2|okunuş|örnek cümle|cümlenin Türkçesi"; "# A1" satırları seviye başlığıdır
export default {
  code: "zh", name: "Çince", flag: "🇨🇳", speech: "zh-CN", answerIn: "Türkçe", timeUp: "时间到了！",
  words: `
# A1
家|ev/aile|jiā|我的家很大。|Evim çok büyük.
水|su|shuǐ|我喝水。|Su içiyorum.
书|kitap|shū|这是我的书。|Bu benim kitabım.
朋友|arkadaş/dost|péngyou|他是我的朋友。|O benim arkadaşım.
时间|zaman/vakit|shíjiān|我没有时间。|Vaktim yok.
工作|iş/çalışmak|gōngzuò
学校|okul|xuéxiào|学校今天关门。|Okul bugün kapalı.
城市|şehir/kent|chéngshì|这个城市很漂亮。|Bu şehir çok güzel.
天|gün/gökyüzü|tiān
晚上|gece/akşam|wǎnshang
吃|yemek/yemek yemek|chī
喝|içmek|hē
去|gitmek|qù
来|gelmek|lái
说|konuşmak/söylemek|shuō
学习|öğrenmek/ders çalışmak|xuéxí
漂亮|güzel|piàoliang
大|büyük|dà
小|küçük|xiǎo
今天|bugün|jīntiān|今天很热。|Bugün hava çok sıcak.
明天|yarın|míngtiān
谢谢|teşekkürler/teşekkür ederim/sağ ol|xièxie|谢谢你的帮助。|Yardımın için teşekkürler.
请|lütfen|qǐng
家庭|aile|jiātíng
孩子|çocuk|háizi|孩子在花园里玩。|Çocuk bahçede oynuyor.
面包|ekmek|miànbāo|我买面包。|Ekmek alıyorum.
街|sokak/cadde|jiē
窗户|pencere|chuānghu
快乐|mutlu|kuàilè|我很快乐。|Çok mutluyum.
也许|belki|yěxǔ
# A2
男人|adam/erkek|nánrén
女人|kadın|nǚrén
妈妈|anne|māma
爸爸|baba|bàba
哥哥|erkek kardeş/kardeş/abi|gēge
姐姐|kız kardeş/kardeş/abla|jiějie
鱼|balık|yú
牛奶|süt|niúnǎi
茶|çay|chá
咖啡|kahve|kāfēi
糖|şeker|táng
盐|tuz|yán
肉|et|ròu
水果|meyve|shuǐguǒ
桌子|masa|zhuōzi
椅子|sandalye|yǐzi
门|kapı|mén
房间|oda|fángjiān
床|yatak|chuáng
车|araba|chē
路|yol|lù
海|deniz|hǎi
山|dağ|shān
树|ağaç|shù
花|çiçek|huā
太阳|güneş|tàiyáng
月亮|ay|yuèliang
雨|yağmur|yǔ
雪|kar|xuě
钱|para|qián
年|yıl/sene|nián
星期|hafta|xīngqī
月|ay|yuè
小时|saat|xiǎoshí
早上|sabah|zǎoshang
晚上|akşam|wǎnshang
名字|isim/ad|míngzi
语言|dil|yǔyán
国家|ülke|guójiā
世界|dünya|shìjiè
心|kalp/yürek|xīn
头|baş/kafa|tóu
手|el|shǒu
眼睛|göz|yǎnjing
问题|soru|wèntí
回答|cevap/yanıt|huídá
生活|hayat/yaşam|shēnghuó
爱|aşk/sevgi|ài
狗|köpek|gǒu
猫|kedi|māo
看见|görmek|kànjiàn
知道|bilmek|zhīdào
想要|istemek|xiǎngyào
给|vermek|gěi
拿|almak|ná
做|yapmak|zuò
写|yazmak|xiě
读|okumak|dú
睡觉|uyumak|shuìjiào
喜欢|sevmek|xǐhuan
买|satın almak/almak|mǎi
上班|çalışmak|shàngbān
好|iyi|hǎo
坏|kötü|huài
新|yeni|xīn
旧|eski|jiù
热|sıcak|rè
冷|soğuk|lěng
容易|kolay|róngyì
难|zor/güç|nán
`,
  idioms: [
    { p: "马马虎虎 (mǎmǎhūhū)", lit: "At at kaplan kaplan", nat: "Şöyle böyle, idare eder" },
    { p: "加油！(jiāyóu)", lit: "Yağ ekle!", nat: "Haydi, başarırsın!" },
    { p: "画蛇添足 (huà shé tiān zú)", lit: "Yılan çizip ayak eklemek", nat: "Gereksiz bir eklemeyle işi bozmak" },
    { p: "对牛弹琴 (duì niú tán qín)", lit: "İneğe çalgı çalmak", nat: "Anlamayana laf anlatmak" },
    { p: "井底之蛙 (jǐng dǐ zhī wā)", lit: "Kuyunun dibindeki kurbağa", nat: "Dünyadan bihaber, dar görüşlü kişi" },
    { p: "吃醋 (chī cù)", lit: "Sirke yemek", nat: "Kıskanmak" },
    { p: "开夜车 (kāi yèchē)", lit: "Gece arabası sürmek", nat: "Sabahlamak, gece geç saate kadar çalışmak" },
    { p: "小菜一碟 (xiǎo cài yī dié)", lit: "Bir tabak küçük meze", nat: "Çocuk oyuncağı" },
  ],
};
