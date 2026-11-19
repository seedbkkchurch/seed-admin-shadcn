// รายการวิดีโอ BibleProject ภาษาไทย (https://bibleproject.com/th/#videos)
// เก็บเป็นไฟล์ static แทน table ใน Supabase เพราะรายการแทบไม่เปลี่ยน (grill-me
// 2026-11-19) — มีวิดีโอใหม่ก็เพิ่มบรรทัดในไฟล์นี้ได้เลย
//
// หมายเหตุข้อมูล (ตรวจชื่อจาก YouTube oEmbed 2026-11-19):
// - ตัดหมวด "เพิ่มเติม" ออก (มีแค่มาระโก ซ้ำกับหมวดพันธสัญญาใหม่)
// - หมวดลูกา-กิจการ บนเว็บ BibleProject ลิงก์ "ลูกา 9-19" ไปที่วิดีโอ
//   ยอห์น 13-21 และ "ลูกา 24" ไปที่วิดีโอกิจการ 13-28 (ลิงก์ผิดฝั่งต้นทาง)
//   หา ID ที่ถูกไม่เจอ จึงตัด 2 ตัวนี้ออกแทนการใส่ลิงก์ผิด
// - bookNumbers = เลขเล่ม 1–66 ตาม /bible/books.json ใส่เฉพาะวิดีโอภาพรวม
//   รายเล่ม ใช้กับปุ่ม 🎬 ในหน้าอ่านพระคัมภีร์ (BookVideoButton)

export type BibleProjectVideo = {
  youtubeId: string;
  title: string;
  titleEn: string;
  bookNumbers?: number[];
};

export type BibleProjectSection = {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  videos: BibleProjectVideo[];
};

// hq = 480×360 (4:3 มีแถบดำบน-ล่าง ใช้กับกรอบ 16:9 ได้เพราะครอปแถบออกพอดี)
// mq = 320×180 (16:9 ไม่มีแถบดำ ใช้กับกรอบสี่เหลี่ยมจัตุรัส/3:2)
export function youtubeThumbnailUrl(
  youtubeId: string,
  size: "hq" | "mq" = "hq",
) {
  return `https://i.ytimg.com/vi/${youtubeId}/${size}default.jpg`;
}

export function youtubeWatchUrl(youtubeId: string) {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

export function youtubeEmbedUrl(youtubeId: string) {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&playsinline=1`;
}

const v = (
  youtubeId: string,
  title: string,
  titleEn: string,
  bookNumbers?: number[],
): BibleProjectVideo => ({ youtubeId, title, titleEn, bookNumbers });

export const BIBLE_PROJECT_SECTIONS: BibleProjectSection[] = [
  {
    id: "ot-overviews",
    title: "ภาพรวม: พันธสัญญาเดิม",
    titleEn: "Old Testament Overviews",
    description:
      "วิดีโอสรุปพระธรรมทุกเล่มในพันธสัญญาเดิม เห็นโครงสร้าง แนวคิดหลัก และความเชื่อมโยงของแต่ละเล่มกับเรื่องราวทั้งหมดของพระคัมภีร์",
    videos: [
      v(
        "O1-gHfN4IKM",
        "ภาพรวม: พันธสัญญาเดิม / ทานัค",
        "TaNaK / Old Testament",
      ),
      v("kOiGyv4YWy8", "ภาพรวม: ปฐมกาล 1-11", "Genesis 1-11", [1]),
      v("Y9nWZ89eYEs", "ภาพรวม: ปฐมกาล 12-50", "Genesis 12-50", [1]),
      v("8d2w8ltOBkk", "ภาพรวม: อพยพ 1-18", "Exodus 1-18", [2]),
      v("Gz80NEh1FiI", "ภาพรวม: อพยพ 19-40", "Exodus 19-40", [2]),
      v("_iwP0wAWqJQ", "ภาพรวม: เลวีนิติ", "Leviticus", [3]),
      v("rEfU20wTjdA", "ภาพรวม: กันดารวิถี", "Numbers", [4]),
      v("NSIi6Bqh-vE", "ภาพรวม: เฉลยธรรมบัญญัติ", "Deuteronomy", [5]),
      v("o9Tpy_rpsp8", "ภาพรวม: โยชูวา", "Joshua", [6]),
      v("9gm_bmlhzHE", "ภาพรวม: ผู้วินิจฉัย", "Judges", [7]),
      v("xZUfnJi4XM0", "ภาพรวม: นางรูธ", "Ruth", [8]),
      v("VYdlVw9wdZg", "ภาพรวม: 1 ซามูเอล", "1 Samuel", [9]),
      v("is2h-vnS3ds", "ภาพรวม: 2 ซามูเอล", "2 Samuel", [10]),
      v("qo1CAilfL7c", "ภาพรวม: 1-2 พงศ์กษัตริย์", "1-2 Kings", [11, 12]),
      v("uC6fQL4RyUo", "ภาพรวม: เอสรา-เนหะมีย์", "Ezra-Nehemiah", [15, 16]),
      v("lUTStn9DXQ0", "ภาพรวม: เอสเธอร์", "Esther", [17]),
      v("a_FeH9TmqU8", "ภาพรวม: โยบ", "Job", [18]),
      v("E9pUer7RR98", "ภาพรวม: สดุดี", "Psalms", [19]),
      v("HT-3ht0U6JQ", "ภาพรวม: สุภาษิต", "Proverbs", [20]),
      v("VJZ1QplYP_w", "ภาพรวม: ปัญญาจารย์", "Ecclesiastes", [21]),
      v("clNZuij-x94", "ภาพรวม: เพลงโซโลมอน", "Song of Songs", [22]),
      v("9Y4IZowT1S8", "ภาพรวม: อิสยาห์ 1-39", "Isaiah 1-39", [23]),
      v("zdtW6-bedIA", "ภาพรวม: อิสยาห์ 40-66", "Isaiah 40-66", [23]),
      v("wCuXVoWRk8A", "ภาพรวม: เยเรมีย์", "Jeremiah", [24]),
      v("YijEZ_APwbk", "ภาพรวม: บทเพลงคร่ำครวญ", "Lamentations", [25]),
      v("rUEcEAoy-6M", "ภาพรวม: เอเสเคียล 1-33", "Ezekiel 1-33", [26]),
      v("M2diLHzF_UQ", "ภาพรวม: เอเสเคียล 34-48", "Ezekiel 34-48", [26]),
      v("BN8UeWS1fXc", "ภาพรวม: ดาเนียล", "Daniel", [27]),
      v("IbUC5ENFjcs", "ภาพรวม: โฮเชยา", "Hosea", [28]),
      v("PsPG5ldq5xg", "ภาพรวม: โยเอล", "Joel", [29]),
      v("mZLmiSKEdDY", "ภาพรวม: อาโมส", "Amos", [30]),
      v("IQgo30EE2d8", "ภาพรวม: โอบาดีย์", "Obadiah", [31]),
      v("FaRZMwRs5pY", "ภาพรวม: โยนาห์", "Jonah", [32]),
      v("YcTdhYtr3Po", "ภาพรวม: มีคาห์", "Micah", [33]),
      v("nKLdQnXO1yM", "ภาพรวม: นาฮูม", "Nahum", [34]),
      v("ph7J13hUDzI", "ภาพรวม: ฮาบากุก", "Habakkuk", [35]),
      v("TDVlCtbvYvI", "ภาพรวม: เศฟันยาห์", "Zephaniah", [36]),
      v("hJNOcq3yIw8", "ภาพรวม: ฮักกัย", "Haggai", [37]),
      v("jZDCR50bHo0", "ภาพรวม: เศคาริยาห์", "Zechariah", [38]),
      v("1B5EoLyssu8", "ภาพรวม: มาลาคี", "Malachi", [39]),
      v("89YiW4SpDfA", "ภาพรวม: 1-2 พงศาวดาร", "1-2 Chronicles", [13, 14]),
    ],
  },
  {
    id: "nt-overviews",
    title: "ภาพรวม: พันธสัญญาใหม่",
    titleEn: "New Testament Overviews",
    description:
      "วิดีโอสรุปพระธรรมทุกเล่มในพันธสัญญาใหม่ ตั้งแต่พระกิตติคุณ กิจการ จดหมายฝาก จนถึงวิวรณ์",
    videos: [
      v("VzrUY-tyUSw", "ภาพรวม: พันธสัญญาใหม่", "New Testament"),
      v("YJmpA-LHabc", "ภาพรวม: มัทธิว 1-13", "Matthew 1-13", [40]),
      v("6gxiPPnHgT8", "ภาพรวม: มัทธิว 14-28", "Matthew 14-28", [40]),
      v("FCvAGwq32ME", "ภาพรวม: มาระโก", "Mark", [41]),
      v("qZmPyvXIo7Q", "ภาพรวม: ยอห์น 1-12", "John 1-12", [43]),
      v("DzlliFTGdjw", "ภาพรวม: ยอห์น 13-21", "John 13-21", [43]),
      v("GKZF417Pbmc", "ภาพรวม: ลูกา 1-9", "Luke 1-9", [42]),
      v("TkHAkQF0J_w", "ภาพรวม: ลูกา 10-24", "Luke 10-24", [42]),
      v("_6TMDDrX0oY", "ภาพรวม: กิจการ 1-12", "Acts 1-12", [44]),
      v("teh_A2gIP8M", "ภาพรวม: กิจการ 13-28", "Acts 13-28", [44]),
      v("9fdkToBi-wI", "ภาพรวม: โรม 1-4", "Romans 1-4", [45]),
      v("hH5fDUXGb7s", "ภาพรวม: โรม 5-16", "Romans 5-16", [45]),
      v("U9JTp74ssGs", "ภาพรวม: 1 โครินธ์", "1 Corinthians", [46]),
      v("bUgqNYk2Ujs", "ภาพรวม: 2 โครินธ์", "2 Corinthians", [47]),
      v("SFQuV0OrVmc", "ภาพรวม: กาลาเทีย", "Galatians", [48]),
      v("6SExoMxIfBQ", "ภาพรวม: เอเฟซัส", "Ephesians", [49]),
      v("70kROyeAUvk", "ภาพรวม: ฟีลิปปี", "Philippians", [50]),
      v("acdz_U9YdkA", "ภาพรวม: โคโลสี", "Colossians", [51]),
      v("P_5VAQm2vS0", "ภาพรวม: 1 เธสะโลนิกา", "1 Thessalonians", [52]),
      v("4V0viP4Hz4g", "ภาพรวม: 2 เธสะโลนิกา", "2 Thessalonians", [53]),
      v("bAufPmab0RA", "ภาพรวม: 1 ทิโมธี", "1 Timothy", [54]),
      v("WT4NXEvRVLE", "ภาพรวม: 2 ทิโมธี", "2 Timothy", [55]),
      v("bdAfUCrqkfc", "ภาพรวม: ทิตัส", "Titus", [56]),
      v("vT3FCOOFF1Y", "ภาพรวม: ฟิเลโมน", "Philemon", [57]),
      v("_KRGU_EFoTM", "ภาพรวม: ฮีบรู", "Hebrews", [58]),
      v("byvhGguLH-E", "ภาพรวม: ยากอบ", "James", [59]),
      v("npvqt1GiRko", "ภาพรวม: 1 เปโตร", "1 Peter", [60]),
      v("XE8NrvWeSNU", "ภาพรวม: 2 เปโตร", "2 Peter", [61]),
      v("h3fNhvgpMOw", "ภาพรวม: 1-3 ยอห์น", "1-3 John", [62, 63, 64]),
      v("zA8OvH4J1cg", "ภาพรวม: ยูดา", "Jude", [65]),
      v("mN0kKlEY3s4", "ภาพรวม: วิวรณ์ 1-11", "Revelation 1-11", [66]),
      v("OibEyRt7dqw", "ภาพรวม: วิวรณ์ 12-22", "Revelation 12-22", [66]),
    ],
  },
  {
    id: "themes",
    title: "แนวคิดหลักในพระคัมภีร์",
    titleEn: "Themes",
    description:
      "ติดตามแนวคิดสำคัญที่ร้อยเรียงอยู่ตลอดพระคัมภีร์ ตั้งแต่ปฐมกาลจนถึงวิวรณ์",
    videos: [
      v("AvepA7Cl32I", "ความเอื้อเฟื้อเผื่อแผ่", "Generosity"),
      v("cSO_jbmzDk8", "บุตรมนุษย์", "Son of Man"),
      v("iiIgU2KwKEo", "วิถีแห่งผู้พลัดถิ่น", "Way of the Exile"),
      v("U7thW5eyjhA", "ความยุติธรรม", "Justice"),
      v(
        "YWMplYrEkl8",
        "การอ่านพระคัมภีร์ในที่สาธารณะ",
        "Public Reading of Scripture",
      ),
      v("8QkrNB2CRMQ", "พระวิญญาณบริสุทธิ์", "Holy Spirit"),
      v("OvdI5WSYejQ", "วันแห่งองค์พระผู้เป็นเจ้า", "Day of the Lord"),
      v("FUMoXmLmtKY", "พระฉายของพระเจ้า", "Image of God"),
      v("F3p4cbwdk1Y", "พระกิตติคุณแห่งอาณาจักร", "Gospel of the Kingdom"),
      v("qwxTQ2BnyeE", "ธรรมบัญญัติ", "The Law"),
      v("6PW2BhnYyQA", "สัตวบูชาและการไถ่บาป", "Sacrifice and Atonement"),
      v("RKszGMMPgSc", "ความบริสุทธิ์", "Holiness"),
      v("1cXp8P0wWVA", "พันธสัญญา", "Covenants"),
      v("r9AKRb4Hde4", "พระเมสสิยาห์", "Messiah"),
      v("4WEPzsa9jLA", "สวรรค์และโลก", "Heaven and Earth"),
    ],
  },
  {
    id: "how-to-read",
    title: "อ่านพระคัมภีร์อย่างไร",
    titleEn: "How to Read the Bible",
    description:
      "เครื่องมือช่วยอ่านพระคัมภีร์ให้เข้าใจ ทั้งรูปแบบวรรณกรรม เรื่องเล่า บทกวี ผู้เผยพระวจนะ และจดหมายฝาก",
    videos: [
      v(
        "32k3yKe32DM",
        "วิธีการอ่านพระคัมภีร์: พระคัมภีร์คืออะไร",
        "What is the Bible?",
      ),
      v(
        "OTuJWTEswws",
        "วิธีการอ่านพระคัมภีร์: เรื่องราวในพระคัมภีร์",
        "The Story of the Bible",
      ),
      v(
        "co3S1vUCg1Q",
        "วิธีการอ่านพระคัมภีร์: รูปแบบวรรณกรรมในพระคัมภีร์",
        "Literary Styles in the Bible",
      ),
      v(
        "rFw7sEuzZi4",
        "วิธีการอ่านพระคัมภีร์: พระคัมภีร์ในฐานะวรรณกรรมที่ยิวใช้ใคร่ครวญ",
        "Ancient Jewish Meditation Literature",
      ),
      v(
        "DofPSDK7Vjg",
        "วิธีการอ่านพระคัมภีร์: โครงเรื่องในเรื่องเล่าของพระคัมภีร์",
        "Plot in Biblical Narrative",
      ),
      v(
        "vPHLJ0MTfiE",
        "วิธีการอ่านพระคัมภีร์: ตัวละครในเรื่องเล่าของพระคัมภีร์",
        "Character in Biblical Narrative",
      ),
      v(
        "5iWxA8dv2Iw",
        "วิธีการอ่านพระคัมภีร์: ฉากของเรื่องเล่าในพระคัมภีร์",
        "Setting in Biblical Narrative",
      ),
      v(
        "wqTp0yiQFAU",
        "วิธีการอ่านพระคัมภีร์: รูปแบบที่ถูกออกแบบไว้ของเรื่องเล่าในพระคัมภีร์",
        "Design Patterns in Biblical Narrative",
      ),
      v(
        "Taln74GfD6Y",
        "วิธีการอ่านพระคัมภีร์: บทกวี",
        "The Art of Biblical Poetry",
      ),
      v(
        "3Aycj_IS0-Q",
        "วิธีการอ่านพระคัมภีร์: ภาพเปรียบเทียบของบทกวีในพระคัมภีร์",
        "Metaphor in Biblical Poetry",
      ),
      v("_WKsvNWMfOk", "อ่านพระคัมภีร์อย่างไร: พระธรรมสดุดี", "Book of Psalms"),
      v(
        "vdS4tD3jyEQ",
        "อ่านพระคัมภีร์อย่างไร: หมวดผู้เผยพระวจนะ",
        "The Prophets",
      ),
      v(
        "W6Fq9g-Rb_A",
        "อ่านพระคัมภีร์อย่างไร: หมวดธรรมบัญญัติ",
        "Biblical Law",
      ),
      v(
        "J6YEwU2lOYI",
        "อ่านพระคัมภีร์อย่างไร: หนังสือของซาโลมอน",
        "Books of Solomon",
      ),
      v("CQgmsklLhTU", "อ่านพระคัมภีร์อย่างไร: พระกิตติคุณ", "The Gospel"),
      v(
        "E2gvgp4uNy8",
        "อ่านพระคัมภีร์อย่างไร: คำอุปมา",
        "The Parables of Jesus",
      ),
      v(
        "zP8q-xAx80s",
        "จดหมายในพันธสัญญาใหม่: บริบททางประวัติศาสตร์",
        "NT Letters: Historical Context",
      ),
      v(
        "b9-htjdIhrI",
        "จดหมายในพันธสัญญาใหม่: บริบททางวรรณกรรม",
        "NT Letters: Literary Context",
      ),
      v(
        "kQPf3Ls-QwU",
        "อ่านพระคัมภีร์อย่างไร: วิวรณ์สาสน์",
        "Apocalyptic Literature",
      ),
    ],
  },
  {
    id: "spiritual-beings",
    title: "สิ่งมีชีวิตฝ่ายวิญญาณ",
    titleEn: "Spiritual Beings",
    description: "สิ่งที่พระคัมภีร์สอนเรื่องพระเจ้า ทูตสวรรค์ และโลกฝ่ายวิญญาณ",
    videos: [
      v("unpnNHw3ioc", "พระเจ้า", "God"),
      v(
        "tqqN2VX54AE",
        "คำนำเรื่องสิ่งมีชีวิตฝ่ายวิญญาณ",
        "Intro to Spiritual Beings",
      ),
      v("28tdD1FDnNo", "เอโลฮิม", "Elohim"),
      v("7djpTBqCYBM", "สภาสวรรค์", "The Divine Council"),
      v("Zniy5MxqzHc", "ทูตสวรรค์และเครูบ", "Angels and Cherubim"),
      v("ySLzVPRi4iU", "ทูตขององค์พระผู้เป็นเจ้า", "Angel of the Lord"),
      v("J1Ddggk8JK0", "ซาตาน และ ผี", "The Satan and Demons"),
      v("82Ko-HFr6s0", "มนุษยชาติใหม่", "The New Humanity"),
    ],
  },
  {
    id: "character-of-god",
    title: "การศึกษาคำเรื่องพระลักษณะของพระเจ้า",
    titleEn: "Character of God",
    description:
      "ศึกษาคำฮีบรูที่พระเจ้าใช้บรรยายพระลักษณะของพระองค์เองใน อพยพ 34:6-7",
    videos: [
      v("_Bq2pF9RvDA", "เมตตากรุณา", "Compassion"),
      v("XTWySbGn-e4", "พระคุณ", "Grace"),
      v("qev7xrLWaRI", "ทรงกริ้วช้า", "Slow to Anger"),
      v("OCs-NHHpaIU", "ความรักมั่นคง", "Loyal Love"),
      v("PsGFiMitBzw", "ความซื่อสัตย์", "Faithful"),
    ],
  },
  {
    id: "advent",
    title: "การศึกษาคำในเทศกาลเตรียมรับเสด็จ",
    titleEn: "Advent",
    description:
      "ความหวัง สันติสุข ความชื่นชมยินดี และความรัก — สี่คำสำหรับเทศกาลเตรียมรับเสด็จ",
    videos: [
      v("VBKwQuwJTVk", 'ยาคาล - "ความหวัง"', "Hope"),
      v("zfOfV8mlUfA", 'ชาโลม - "สันติสุข"', "Peace"),
      v("r7gOPifPReA", 'คารา - "ความชื่นชมยินดี"', "Joy"),
      v("2Qf4lxat70U", 'อากาเป - "ความรัก"', "Love"),
    ],
  },
  {
    id: "luke-acts",
    title: "ชุดวิดีโอ ลูกา-กิจการ",
    titleEn: "Luke-Acts",
    description:
      "ติดตามเรื่องราวของพระเยซูและคริสตจักรยุคแรกตามที่ลูกาบันทึกไว้ทีละช่วง",
    videos: [
      v(
        "mpM5n0y_yN0",
        "กำเนิดพระเยซู - พระกิตติคุณลูกา บทที่ 1-2",
        "The Birth of Jesus: Luke 1-2",
      ),
      v("P5G59q0k9yQ", "พระกิตติคุณลูกา บทที่ 3-9", "Luke 3-9"),
      v("TuCoi1u_s_Q", "พระกิตติคุณลูกา บทที่ 19-23", "Luke 19-23"),
      v("Jnm4qs07pSY", "กิจการ บทที่ 1-7", "Acts 1-7"),
      v("L_I3fqAmh3g", "กิจการ บทที่ 8-12", "Acts 8-12"),
      v("Zx9nVQyUAA0", "กิจการ บทที่ 13-20", "Acts 13-20"),
      v("dbRTm9oen1o", "กิจการ บทที่ 21-28", "Acts 21-28"),
    ],
  },
  {
    id: "wisdom",
    title: "วรรณกรรมแห่งปัญญา",
    titleEn: "Wisdom",
    description:
      "สุภาษิต ปัญญาจารย์ และโยบ — สามมุมมองต่อการใช้ชีวิตอย่างมีปัญญา",
    videos: [
      v("u2QKsjk7vdU", "พระธรรมสุภาษิต", "Book of Proverbs"),
      v("0AByJdKzcvk", "พระธรรมปัญญาจารย์", "Book of Ecclesiastes"),
      v("DlZrjC6eX-4", "พระธรรมโยบ", "Book of Job"),
    ],
  },
];

// วิดีโอภาพรวมของเล่มนี้ (เรียงตามลำดับในหมวด เช่น ปฐมกาล 1-11 ก่อน 12-50)
export function getOverviewVideosForBook(bookNumber: number) {
  return BIBLE_PROJECT_SECTIONS.flatMap((s) => s.videos).filter((video) =>
    video.bookNumbers?.includes(bookNumber),
  );
}
