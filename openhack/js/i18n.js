/* i18n.js - interface strings. Each entry is [English, Urdu, Sindhi]. Urdu and Sindhi are right-to-left. */
(function (root) {
  "use strict";
  var LANGS = { en: 0, ur: 1, sd: 2 };
  var D = {
    today: ["Today", "آج", "اڄ"],
    meds: ["Medicines", "ادویات", "دوائون"],
    scan: ["Scan", "اسکین", "اسڪين"],
    more: ["Settings", "ترتیبات", "سيٽنگون"],
    language: ["Language", "زبان", "ٻولي"],
    help: ["Help", "مدد", "مدد"],
    sos: ["Emergency", "ایمرجنسی", "ايمرجنسي"],
    textSize: ["Text size", "متن کا سائز", "لکت جو سائيز"],
    sizeS: ["Standard", "معیاری", "معياري"],
    sizeL: ["Large", "بڑا", "وڏو"],
    sizeXL: ["Extra large", "بہت بڑا", "تمام وڏو"],
    theme: ["Appearance", "ظاہری شکل", "ظاهري شڪل"],
    auto: ["Auto", "خودکار", "خودڪار"],
    light: ["Light", "روشن", "روشن"],
    dark: ["Dark", "تاریک", "اونداهو"],
    toggleTheme: ["Switch light or dark", "روشن یا تاریک بدلیں", "روشن يا اونداهو بدلايو"],

    morning: ["Morning", "صبح", "صبح"],
    afternoon: ["Afternoon", "دوپہر", "منجهند"],
    night: ["Night", "رات", "رات"],
    taken: ["Taken", "لے لی", "ورتي"],
    missed: ["Missed", "چھوٹ گئی", "رهجي وئي"],
    due: ["Due now", "ابھی وقت ہے", "هاڻي وقت آهي"],
    up: ["Upcoming", "آنے والی", "ايندڙ"],
    markTaken: ["Mark as taken", "لے لی نشان زد کریں", "ورتي نشان ڪريو"],
    undo: ["Undo", "واپس", "واپس"],
    next: ["Next medicine", "اگلی دوا", "ايندڙ دوا"],
    prog: ["{a} of {b} doses taken today", "آج {b} میں سے {a} خوراکیں لی گئیں", "اڄ {b} مان {a} دوزون ورتيون"],
    listen: ["Listen", "سنیں", "ٻڌو"],
    magnify: ["Enlarge", "بڑا کریں", "وڏو ڪريو"],
    emptyTitle: ["No medicines yet", "ابھی کوئی دوا نہیں", "اڃا ڪا دوا ناهي"],
    emptyBody: ["Scan a prescription or add a medicine to build today's schedule.", "آج کا شیڈول بنانے کے لیے نسخہ اسکین کریں یا دوا شامل کریں۔", "اڄ جو شيڊيول ٺاهڻ لاءِ نسخو اسڪين ڪريو يا دوا شامل ڪريو."],
    low: ["{n}: {p} pills left, about {d} days", "{n}: {p} گولیاں باقی، تقریباً {d} دن", "{n}: {p} گوليون باقي، تقريباً {d} ڏينهن"],

    add: ["Add medicine", "دوا شامل کریں", "دوا شامل ڪريو"],
    name: ["Medicine name", "دوا کا نام", "دوا جو نالو"],
    dose: ["Dose, as written", "خوراک، جیسا لکھا ہے", "مقدار، جيئن لکيل آهي"],
    times: ["Times, for example 8:00 AM, 8:30 PM", "اوقات، مثلاً \u20668:00 AM, 8:30 PM\u2069", "وقت، مثال \u20668:00 AM, 8:30 PM\u2069"],
    timesOk: ["Will remind at: {t}", "یاد دہانی کے اوقات: {t}", "ياد ڏياريندڙ وقت: {t}"],
    timesBad: ["Not a valid time: {t}", "غلط وقت: {t}", "غلط وقت: {t}"],
    instr: ["With food", "کھانے کے ساتھ ہدایت", "ماني بابت هدايت"],
    before: ["Before food", "کھانے سے پہلے", "ماني کان اڳ"],
    after: ["After food", "کھانے کے بعد", "ماني کان پوءِ"],
    with: ["With food", "کھانے کے ساتھ", "ماني سان گڏ"],
    any: ["Any time", "کسی بھی وقت", "ڪنهن به وقت"],
    left: ["Pills left (optional)", "باقی گولیاں (اختیاری)", "باقي گوليون (اختياري)"],
    save: ["Save", "محفوظ کریں", "محفوظ ڪريو"],
    cancel: ["Cancel", "منسوخ کریں", "رد ڪريو"],
    edit: ["Edit", "ترمیم", "ايڊٽ"],
    del: ["Delete", "حذف کریں", "ختم ڪريو"],
    sure: ["Delete this medicine?", "کیا یہ دوا حذف کریں؟", "ڇا هي دوا ختم ڪريون؟"],
    yes: ["Yes, delete", "ہاں، حذف کریں", "ها، ختم ڪريو"],
    no: ["Keep it", "رہنے دیں", "رهڻ ڏيو"],
    errName: ["Enter the medicine name.", "دوا کا نام لکھیں۔", "دوا جو نالو لکو."],
    errTimes: ["Add at least one valid time, for example 8:00 AM.", "کم از کم ایک درست وقت لکھیں، مثلاً \u20668:00 AM\u2069۔", "گهٽ ۾ گهٽ هڪ صحيح وقت لکو، مثال \u20668:00 AM\u2069."],

    freq: ["How often", "کتنی بار", "ڪيترا ڀيرا"],
    daily: ["Every day", "روزانہ", "روزانو"],
    weekly: ["Once a week", "ہفتے میں ایک بار", "هفتي ۾ هڪ ڀيرو"],
    weekday: ["Day of the week", "ہفتے کا دن", "هفتي جو ڏينهن"],
    days: ["Take for how many days (optional)", "کتنے دن لینی ہے (اختیاری)", "ڪيترا ڏينهن کائڻي آهي (اختياري)"],
    daysHint: ["Leave empty if the prescription gives no end date.", "اگر نسخے میں آخری تاریخ نہ ہو تو خالی چھوڑیں۔", "جيڪڏهن نسخي ۾ آخري تاريخ نه هجي ته خالي ڇڏيو."],
    errDays: ["Enter a whole number of days, 1 or more.", "دنوں کی تعداد 1 یا زیادہ لکھیں۔", "ڏينهن جو تعداد 1 يا وڌيڪ لکو."],
    courseDay: ["Day {a} of {b}", "دن {a} از {b}", "ڏينهن {a} مان {b}"],
    lastDay: ["Last day of this course", "اس کورس کا آخری دن", "هن ڪورس جو آخري ڏينهن"],
    finished: ["Course finished", "کورس مکمل", "ڪورس ختم"],
    everyWeek: ["Every {d}", "ہر {d}", "هر {d}"],
    emptyToday: ["Nothing to take today", "آج کوئی دوا نہیں لینی", "اڄ ڪابه دوا کائڻي ناهي"],
    emptyTodayBody: ["Weekly medicines and finished courses are listed under Medicines.", "ہفتہ وار ادویات اور مکمل کورس ادویات میں دیکھیں۔", "هفتيوار دوائون ۽ ختم ٿيل ڪورس دوائون ۾ ڏسو."],
    pick: ["Choose a prescription photo", "نسخے کی تصویر منتخب کریں", "نسخي جي تصوير چونڊيو"],
    tapzoom: ["Tap the photo to zoom in or out.", "بڑا یا چھوٹا کرنے کے لیے تصویر پر ٹیپ کریں۔", "وڏو يا ننڍو ڪرڻ لاءِ تصوير تي ٽيپ ڪريو."],
    ocr: ["Read text from photo", "تصویر سے متن پڑھیں", "تصوير مان لکت پڙهو"],
    ocrRun: ["Reading the photo…", "تصویر پڑھی جا رہی ہے…", "تصوير پڙهي پئي وڃي…"],
    ocrfail: ["The photo could not be read here. Type or paste the text instead.", "تصویر یہاں نہیں پڑھی جا سکی۔ متن خود لکھیں یا پیسٹ کریں۔", "تصوير هتي پڙهي نه سگهي. لکت پاڻ لکو يا پيسٽ ڪريو."],
    nophoto: ["Choose a photo first.", "پہلے تصویر منتخب کریں۔", "پهرين تصوير چونڊيو."],
    paste: ["Prescription text. Fix anything that looks wrong.", "نسخے کا متن۔ جو غلط لگے اسے درست کریں۔", "نسخي جي لکت. جيڪو غلط لڳي ان کي درست ڪريو."],
    sample: ["Use a sample prescription", "نمونہ نسخہ استعمال کریں", "نمونو نسخو استعمال ڪريو"],
    parse: ["Find medicines", "ادویات تلاش کریں", "دوائون ڳوليو"],
    found: ["{n} medicines found. Check each one before adding.", "{n} ادویات ملیں۔ شامل کرنے سے پہلے ہر ایک جانچیں۔", "{n} دوائون ملیون. شامل ڪرڻ کان اڳ هر هڪ چيڪ ڪريو."],
    nothing: ["No medicines found. Each line needs a name and a dose, like Metformin 500 mg.", "کوئی دوا نہیں ملی۔ ہر سطر میں نام اور خوراک ہونی چاہیے، جیسے Metformin 500 mg۔", "ڪا دوا نه ملي. هر سٽ ۾ نالو ۽ مقدار هجڻ گهرجي، جيئن Metformin 500 mg."],
    check: ["Times suggested from the prescription. Please confirm.", "اوقات نسخے سے تجویز کیے گئے ہیں۔ تصدیق کریں۔", "وقت نسخي مان تجويز ڪيل آهن. تصديق ڪريو."],
    addall: ["Add to schedule", "شیڈول میں شامل کریں", "شيڊيول ۾ شامل ڪريو"],
    step1: ["Photo", "تصویر", "تصوير"],
    step2: ["Text", "متن", "لکت"],
    step3: ["Review", "جانچ", "چيڪ"],

    cg: ["Caregiver", "نگہبان", "سنڀاليندڙ"],
    cgn: ["Caregiver name", "نگہبان کا نام", "سنڀاليندڙ جو نالو"],
    cgp: ["Caregiver phone, with country code", "نگہبان کا فون، ملک کوڈ کے ساتھ", "سنڀاليندڙ جو فون، ملڪ ڪوڊ سان"],
    sosn: ["Emergency phone number", "ایمرجنسی فون نمبر", "ايمرجنسي فون نمبر"],
    nosos: ["Add an emergency number in Settings first.", "پہلے ترتیبات میں ایمرجنسی نمبر درج کریں۔", "پهرين سيٽنگون ۾ ايمرجنسي نمبر درج ڪريو."],
    grace: ["Count a dose as missed after (minutes)", "اتنے منٹ بعد خوراک چھوٹی ہوئی شمار کریں", "ايترن منٽن کان پوءِ دوز رهيل ڳڻيو"],
    alerts: ["Reminders", "یاد دہانیاں", "ياد ڏياريندڙ"],
    voice: ["Speak reminders aloud", "یاد دہانی آواز میں سنائیں", "ياد ڏياريندڙ آواز ۾ ٻڌايو"],
    notif: ["Allow browser notifications", "براؤزر نوٹیفکیشن کی اجازت دیں", "براؤزر نوٽيفڪيشن جي اجازت ڏيو"],
    notifNo: ["Notifications are not available in this browser.", "اس براؤزر میں نوٹیفکیشن دستیاب نہیں۔", "هن براؤزر ۾ نوٽيفڪيشن دستياب ناهن."],
    notifOk: ["Notifications are on.", "نوٹیفکیشن آن ہیں۔", "نوٽيفڪيشن آن آهن."],
    notify: ["Message caregiver", "نگہبان کو پیغام بھیجیں", "سنڀاليندڙ کي پيغام موڪليو"],
    msg: ["Missed dose: {n} {d} was due at {t} and has not been marked as taken.", "خوراک چھوٹ گئی: {n} {d} کا وقت {t} تھا اور لی ہوئی نشان زد نہیں۔", "دوز رهجي وئي: {n} {d} جو وقت {t} هو ۽ ورتل نشان نه آهي."],
    report: ["Last 7 days", "پچھلے 7 دن", "گذريل 7 ڏينهن"],
    share: ["Share report", "رپورٹ شیئر کریں", "رپورٽ شيئر ڪريو"],
    copied: ["Report copied.", "رپورٹ کاپی ہو گئی۔", "رپورٽ ڪاپي ٿي وئي."],

    dueTitle: ["Time for your medicine", "دوا کا وقت ہو گیا", "دوا جو وقت ٿي ويو"],
    againTitle: ["Reminder: not yet taken", "یاد دہانی: ابھی تک نہیں لی", "ياد ڏياريندڙ: اڃا نه ورتي"],
    missTitle: ["You missed your {t} {n}", "آپ کی {t} کی {n} چھوٹ گئی", "توهان جي {t} واري {n} رهجي وئي"],
    snooze: ["Remind me in 10 minutes", "10 منٹ بعد یاد دلائیں", "10 منٽن کان پوءِ ياد ڏيارجو"],
    close: ["Close", "بند کریں", "بند ڪريو"],
    ok: ["Got it", "ٹھیک ہے", "ٺيڪ"],
    novoice: ["No voice for this language on this device. Using English.", "اس ڈیوائس پر اس زبان کی آواز نہیں۔ انگریزی استعمال ہو گی۔", "هن ڊوائيس تي هن ٻولي جو آواز ناهي. انگريزي استعمال ٿيندي."],
    nomic: ["Voice input is not available in this browser.", "اس براؤزر میں آواز سے لکھنا دستیاب نہیں۔", "هن براؤزر ۾ آواز سان لکڻ دستياب ناهي."],
    speak: ["Dictate", "بول کر لکھیں", "ڳالهائي لکو"],
    disc: ["MedAssist copies what your prescription says. It never decides or changes a dose. Confirm every medicine with your doctor or pharmacist.", "میڈ اسسٹ صرف وہی نقل کرتا ہے جو نسخے میں لکھا ہے۔ یہ خوراک طے یا تبدیل نہیں کرتا۔ ہر دوا کی تصدیق ڈاکٹر یا فارماسسٹ سے کریں۔", "ميڊ اسسٽ رڳو اهو نقل ڪري ٿو جيڪو نسخي ۾ لکيل آهي. هي دوز طئي يا تبديل نٿو ڪري. هر دوا جي تصديق ڊاڪٽر يا فارماسسٽ کان ڪريو."],
    safety: ["Safety note", "حفاظتی نوٹ", "حفاظتي نوٽ"],
    helpTitle: ["How MedAssist works", "میڈ اسسٹ کیسے کام کرتا ہے", "ميڊ اسسٽ ڪيئن ڪم ڪري ٿو"],
    h1: ["Scan your prescription or add each medicine yourself.", "اپنا نسخہ اسکین کریں یا ہر دوا خود شامل کریں۔", "پنهنجو نسخو اسڪين ڪريو يا هر دوا پاڻ شامل ڪريو."],
    h2: ["Check every name, dose and time. Fix anything that is wrong.", "ہر نام، خوراک اور وقت جانچیں۔ جو غلط ہو اسے درست کریں۔", "هر نالو، مقدار ۽ وقت چيڪ ڪريو. جيڪو غلط هجي ان کي درست ڪريو."],
    h3: ["When a reminder appears, take your medicine and tap Mark as taken.", "یاد دہانی آنے پر دوا کھائیں اور لے لی نشان زد کریں دبائیں۔", "ياد ڏياريندڙ اچڻ تي دوا کائو ۽ ورتي نشان ڪريو دٻايو."]
  };

  function t(lang, key) {
    var a = D[key];
    if (!a) return key;
    return a[LANGS[lang] || 0] || a[0];
  }
  var DATES = {
    ur: { months: ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"],
          days: ["اتوار", "پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"] },
    sd: { months: ["جنوري", "فيبروري", "مارچ", "اپريل", "مئي", "جون", "جولاءِ", "آگسٽ", "سيپٽمبر", "آڪٽوبر", "نومبر", "ڊسمبر"],
          days: ["آچر", "سومر", "اڱارو", "اربع", "خميس", "جمع", "ڇنڇر"] }
  };
  /** Weekday name for 0 (Sunday) to 6. */
  function weekday(lang, i) {
    if (DATES[lang]) return DATES[lang].days[i];
    return new Date(2024, 0, 7 + i).toLocaleDateString("en-GB", { weekday: "long" });
  }
  /** "Wednesday 14 October" in the chosen language. */
  function longDate(lang, d) {
    if (DATES[lang]) return DATES[lang].days[d.getDay()] + "، " + d.getDate() + " " + DATES[lang].months[d.getMonth()];
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  }
  root.I18N = { t: t, LANGS: LANGS, dict: D, weekday: weekday, longDate: longDate };
})(window);
