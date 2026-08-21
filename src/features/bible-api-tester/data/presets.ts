// Preset path/param combos สำหรับปุ่มลัดในหน้า tester — endpoint ที่รู้จักแล้ว
// จากเอกสาร YouVersion Platform (developers.youversion.com/quick-reference,
// ดู grill-me 2026-08-20) กรอกเองในช่อง path ได้เสมอถ้าอยากลอง endpoint
// อื่นที่ไม่อยู่ในลิสต์นี้ — พรีเซ็ตพวกนี้แค่ช่วยความเร็วตอนสำรวจ ไม่ได้จำกัด
// scope (การจำกัด scope จริงอยู่ที่ Edge Function ฝั่ง server แทน)
export type YouVersionPreset = {
  label: string;
  description: string;
  path: string;
  params: { key: string; value: string }[];
};

export const YOUVERSION_PRESETS: YouVersionPreset[] = [
  {
    label: "List Bibles",
    description: "รายชื่อฉบับพระคัมภีร์ที่ App Key นี้เรียกได้ (ต้องมี language_ranges[])",
    path: "bibles",
    params: [{ key: "language_ranges[]", value: "tha" }],
  },
  {
    label: "List Bibles (all_available)",
    description: "เหมือนด้านบนแต่โชว์ทุกฉบับที่มีในระบบ ไม่ใช่แค่ที่ App Key เปิดสิทธิ์",
    path: "bibles",
    params: [
      { key: "language_ranges[]", value: "tha" },
      { key: "all_available", value: "true" },
    ],
  },
  {
    label: "Passage (John 3, plain text)",
    description:
      "ดึงข้อความ — ต้องแก้ {bible_id} เป็น id จริงที่ได้จาก List Bibles ก่อน",
    path: "bibles/{bible_id}/passages/JHN.3",
    params: [{ key: "format", value: "text" }],
  },
  {
    label: "Verse of the Day",
    description: "ข้อพระคัมภีร์ประจำวันของ YouVersion (เลือกเองไม่ได้)",
    path: "verse_of_the_days/{day}",
    params: [],
  },
];
