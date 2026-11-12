// Dil bilgisi kartları. Her konu: kısa anlatım, örnekler ve mini alıştırma (a = doğru seçeneğin sırası, 0'dan başlar).
// Yeni konu eklemek için ilgili dilin listesine bir nesne ekleyin.
export const GRAMMAR = {
  en: [
    { title: "Geniş zaman mı, şimdiki zaman mı?",
      text: "Alışkanlıklar ve genel doğrular için Present Simple (I work), şu anda olan ya da geçici durumlar için Present Continuous (I am working) kullanılır. “always, usually, every day” geniş zamanın; “now, at the moment” şimdiki zamanın ipucudur.",
      examples: [["She drinks tea every morning.", "Her sabah çay içer."], ["She is drinking tea now.", "Şu anda çay içiyor."]],
      quiz: [
        { q: "Listen! The baby ___.", options: ["cries", "is crying", "cry", "cried"], a: 1 },
        { q: "Water ___ at 100 degrees.", options: ["boils", "is boiling", "boil", "boiling"], a: 0 },
      ] },
    { title: "Zıtlık bağlaçları: although / despite",
      text: "İkisi de “-e rağmen” demektir ama yapıları farklıdır: although + cümle (özne + fiil), despite + isim ya da -ing. Sınavlarda boşluktan sonra gelen yapıya bak.",
      examples: [["Although it was raining, we went out.", "Yağmur yağmasına rağmen dışarı çıktık."], ["Despite the rain, we went out.", "Yağmura rağmen dışarı çıktık."]],
      quiz: [
        { q: "___ being tired, she finished the report.", options: ["Although", "Despite", "However", "Because"], a: 1 },
        { q: "___ he studied hard, he failed the exam.", options: ["Despite", "In spite of", "Although", "Due to"], a: 2 },
      ] },
  ],
  de: [
    { title: "Artikeller: der, die, das",
      text: "Almancada her ismin bir cinsiyeti vardır: der (eril), die (dişil), das (nötr). Çoğulda hep “die” kullanılır. İsmi her zaman artikeliyle birlikte ezberle.",
      examples: [["der Tisch", "masa (eril)"], ["die Schule", "okul (dişil)"], ["das Buch", "kitap (nötr)"]],
      quiz: [
        { q: "___ Buch ist neu.", options: ["Der", "Die", "Das", "Den"], a: 2 },
        { q: "___ Kinder spielen. (çoğul)", options: ["Der", "Die", "Das", "Dem"], a: 1 },
      ] },
    { title: "Fiil ikinci sırada",
      text: "Düz cümlede çekimli fiil her zaman ikinci sıradadır. Cümle zaman ifadesiyle başlarsa özne fiilin arkasına geçer.",
      examples: [["Ich lerne heute Deutsch.", "Bugün Almanca öğreniyorum."], ["Heute lerne ich Deutsch.", "Bugün Almanca öğreniyorum."]],
      quiz: [
        { q: "Morgen ___ nach Berlin.", options: ["ich fahre", "fahre ich", "ich fahren", "fahren ich"], a: 1 },
        { q: "Doğru cümle hangisi?", options: ["Ich heute gehe ins Kino.", "Heute ich gehe ins Kino.", "Heute gehe ich ins Kino.", "Gehe heute ich ins Kino."], a: 2 },
      ] },
  ],
  es: [
    { title: "ser mi, estar mı?",
      text: "İkisi de “olmak” demektir. Kalıcı özellikler, meslek ve kimlik için ser; geçici durumlar, duygular ve konum için estar kullanılır.",
      examples: [["Soy profesor.", "Öğretmenim."], ["Estoy cansado.", "Yorgunum."], ["Madrid está en España.", "Madrid İspanya'dadır."]],
      quiz: [
        { q: "Hoy ___ muy feliz.", options: ["soy", "estoy", "es", "eres"], a: 1 },
        { q: "Mi hermano ___ médico.", options: ["está", "estoy", "es", "son"], a: 2 },
      ] },
    { title: "Cinsiyet: el / la",
      text: "İsimlerin çoğu -o ile bitiyorsa eril (el), -a ile bitiyorsa dişildir (la). Sıfat da isme uyar. Bazı istisnalar vardır: el día, la mano.",
      examples: [["el libro nuevo", "yeni kitap"], ["la casa nueva", "yeni ev"]],
      quiz: [
        { q: "___ mesa es grande.", options: ["El", "La", "Los", "Un"], a: 1 },
        { q: "El gato es ___.", options: ["pequeña", "pequeñas", "pequeño", "pequeños"], a: 2 },
      ] },
  ],
  fr: [
    { title: "Belirli artikeller: le, la, les",
      text: "Eril isimlerde le, dişil isimlerde la, çoğulda les kullanılır. İsim sesli harfle başlıyorsa le ve la kısalıp l' olur.",
      examples: [["le livre", "kitap"], ["la maison", "ev"], ["l'école", "okul"], ["les enfants", "çocuklar"]],
      quiz: [
        { q: "___ ami de Paul est ici.", options: ["Le", "La", "L'", "Les"], a: 2 },
        { q: "___ maisons sont grandes.", options: ["Le", "La", "L'", "Les"], a: 3 },
      ] },
    { title: "Olumsuzluk: ne … pas",
      text: "Fiili olumsuz yapmak için fiilin önüne ne, arkasına pas gelir. Fiil sesli harfle başlıyorsa ne kısalıp n' olur.",
      examples: [["Je parle français.", "Fransızca konuşuyorum."], ["Je ne parle pas français.", "Fransızca konuşmuyorum."], ["Je n'aime pas le café.", "Kahve sevmem."]],
      quiz: [
        { q: "Il ___ mange ___ de viande.", options: ["ne … pas", "pas … ne", "non … pas", "ne … non"], a: 0 },
        { q: "“Anlamıyorum” nasıl denir?", options: ["Je comprends pas ne.", "Je ne comprends pas.", "Je pas comprends.", "Ne je comprends pas."], a: 1 },
      ] },
  ],
  tr: [
    { title: "Vowel harmony: -ler or -lar?",
      text: "Turkish suffixes change to match the last vowel of the word. For the plural: use -ler after e, i, ö, ü and -lar after a, ı, o, u.",
      examples: [["ev → evler", "house → houses"], ["kitap → kitaplar", "book → books"], ["göz → gözler", "eye → eyes"]],
      quiz: [
        { q: "okul → ?", options: ["okuller", "okullar", "okulır", "okuler"], a: 1 },
        { q: "şehir → ?", options: ["şehirlar", "şehirlır", "şehirler", "şehirlor"], a: 2 },
      ] },
    { title: "Word order: the verb comes last",
      text: "A neutral Turkish sentence is Subject – Object – Verb. The verb also carries the person ending, so the subject pronoun is often dropped.",
      examples: [["Ben kitap okuyorum.", "I am reading a book."], ["Çay içiyoruz.", "We are drinking tea."]],
      quiz: [
        { q: "Which sentence is correct?", options: ["Ben okuyorum kitap.", "Okuyorum ben kitap.", "Ben kitap okuyorum.", "Kitap ben okuyorum."], a: 2 },
        { q: "“Su içiyorum” means…", options: ["You drink water.", "I am drinking water.", "They drank water.", "Drink water!"], a: 1 },
      ] },
  ],
  pt: [
    { title: "ser mi, estar mı?",
      text: "Kalıcı özellikler, meslek ve kimlik için ser; geçici durumlar, duygular ve konum için estar kullanılır.",
      examples: [["Eu sou professor.", "Öğretmenim."], ["Eu estou cansado.", "Yorgunum."]],
      quiz: [
        { q: "Hoje eu ___ feliz.", options: ["sou", "estou", "é", "são"], a: 1 },
        { q: "Ela ___ médica.", options: ["está", "estou", "é", "estão"], a: 2 },
      ] },
    { title: "Artikeller: o / a",
      text: "Eril isimlerde o, dişil isimlerde a kullanılır; çoğulları os ve as olur. -o ile biten isimler genelde eril, -a ile bitenler dişildir.",
      examples: [["o livro", "kitap"], ["a casa", "ev"], ["os livros", "kitaplar"]],
      quiz: [
        { q: "___ escola é grande.", options: ["O", "A", "Os", "As"], a: 1 },
        { q: "___ amigos chegaram.", options: ["O", "A", "Os", "As"], a: 2 },
      ] },
  ],
  ku: [
    { title: "Zamirler ve “olmak”",
      text: "Kurmancîde “olmak” eki kelimenin sonuna gelir ve kişiye göre değişir: ez … im (ben), tu … î (sen), ew … e (o). Sesli harfle biten kelimelerden sonra me / yî / ye olur.",
      examples: [["Ez mamoste me.", "Ben öğretmenim."], ["Tu xwendekar î.", "Sen öğrencisin."], ["Ew mezin e.", "O büyük."]],
      quiz: [
        { q: "Ez kêfxweş ___.", options: ["e", "î", "im", "in"], a: 2 },
        { q: "Ew bajar xweşik ___.", options: ["e", "im", "î", "me"], a: 0 },
      ] },
    { title: "Şimdiki zamanda olumsuzluk: na-",
      text: "Şimdiki zamanda fiilin başındaki di- ekinin yerine na- gelir: diçim → naçim. “Bilmek” fiili kuraldışıdır: dizanim → nizanim.",
      examples: [["Ez diçim.", "Gidiyorum."], ["Ez naçim.", "Gitmiyorum."], ["Ez nizanim.", "Bilmiyorum."]],
      quiz: [
        { q: "“Ez dixwim” (yiyorum) cümlesinin olumsuzu hangisi?", options: ["Ez dinaxwim.", "Ez naxwim.", "Ez nedixwim.", "Ez xwim na."], a: 1 },
        { q: "“Bilmiyorum” nasıl denir?", options: ["Ez nizanim.", "Ez nadizanim.", "Ez zanim ne.", "Ez dizanim na."], a: 0 },
      ] },
  ],
  ru: [
    { title: "Artikel yok, şimdiki zamanda “olmak” yok",
      text: "Rusçada “bir / the” gibi artikel yoktur ve şimdiki zamanda “olmak” fiili söylenmez. “Bu bir kitap” demek için yalnızca “Это книга” denir.",
      examples: [["Это книга.", "Bu bir kitap."], ["Он студент.", "O öğrenci."], ["Я дома.", "Evdeyim."]],
      quiz: [
        { q: "“O doktor” nasıl denir?", options: ["Он есть врач.", "Он врач.", "Он быть врач.", "Он а врач."], a: 1 },
        { q: "“Bu bir ev” nasıl denir?", options: ["Это дом.", "Это есть один дом.", "Этот быть дом.", "Дом это есть."], a: 0 },
      ] },
    { title: "İsimlerin cinsiyeti",
      text: "Cinsiyet çoğunlukla son harften anlaşılır: ünsüzle bitenler eril (дом), -а / -я ile bitenler dişil (книга), -о / -е ile bitenler nötrdür (окно). Sıfat ve “benim” gibi kelimeler buna uyar: мой, моя, моё.",
      examples: [["мой дом", "benim evim"], ["моя книга", "benim kitabım"], ["моё окно", "benim pencerem"]],
      quiz: [
        { q: "___ семья (ailem)", options: ["мой", "моя", "моё", "мои"], a: 1 },
        { q: "“город” (şehir) hangi cinstir?", options: ["eril", "dişil", "nötr", "çoğul"], a: 0 },
      ] },
  ],
  zh: [
    { title: "Fiil çekimi yok; 是 (shì) ile tanımlama",
      text: "Çincede fiiller kişiye ve zamana göre değişmez. İki ismi “-dır” anlamıyla bağlamak için 是 kullanılır. Sıfatlarda 是 yerine genellikle 很 (hěn) gelir.",
      examples: [["我是学生。", "Ben öğrenciyim."], ["他是老师。", "O öğretmen."], ["我很好。", "Ben iyiyim."]],
      quiz: [
        { q: "她 ___ 我的朋友。", options: ["很", "是", "吗", "不"], a: 1 },
        { q: "“Bugün hava çok sıcak” için doğru olan hangisi?", options: ["今天是热。", "今天很热。", "今天热是。", "很今天热。"], a: 1 },
      ] },
    { title: "Evet-hayır sorusu: 吗 (ma)",
      text: "Düz cümlenin sonuna 吗 eklersen soru olur; kelime sırası değişmez. Olumsuzluk için fiilin önüne 不 (bù) gelir.",
      examples: [["你是学生。", "Sen öğrencisin."], ["你是学生吗？", "Sen öğrenci misin?"], ["我不是学生。", "Ben öğrenci değilim."]],
      quiz: [
        { q: "“Çay içiyor musun?” hangisi?", options: ["吗你喝茶？", "你喝茶吗？", "你吗喝茶？", "你喝吗茶？"], a: 1 },
        { q: "“Ben öğretmen değilim” hangisi?", options: ["我是不老师。", "我不是老师。", "不我是老师。", "我是老师不。"], a: 1 },
      ] },
  ],
};
