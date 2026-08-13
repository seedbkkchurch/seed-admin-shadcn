// Fixed discipleship curriculum used on the lamb profile's Growth Progress
// card. This list is the same for every lamb — there is no backing table
// for it yet, so completion state on the profile page is local-only (not
// persisted). See growth-progress-card.tsx.
export type GrowthLesson = {
  id: number;
  title: string;
};

// Titles below come from dataSeedV2Lessons.csv (18 chapters), with a
// handful of obvious spelling fixes applied per user request (2026-08-06):
// เฝ้าเดียว -> เฝ้าเดี่ยว, บัพศมา/บัพตืศมา -> บัพติศมา, วิญญาน -> วิญญาณ,
// ขุมชน -> ชุมชน, จุดยิน -> จุดยืน, คริสจักร -> คริสตจักร.
export const GROWTH_LESSONS: GrowthLesson[] = [
  { id: 1, title: "การกลับใจใหม่" },
  { id: 2, title: "มั่นใจในความรอด" },
  { id: 3, title: "การเฝ้าเดี่ยว" },
  { id: 4, title: "รู้จักพระเจ้า" },
  { id: 5, title: "พระคัมภีร์คู่มือแห่งชีวิต" },
  { id: 6, title: "การสนทนากับพระเจ้า" },
  { id: 7, title: "การบัพติศมาในพระวิญญาณบริสุทธิ์" },
  { id: 8, title: "การนมัสการ" },
  { id: 9, title: "ชัยชนะเหนือการทดลอง" },
  { id: 10, title: "ชุมชนแห่งพระพร" },
  { id: 11, title: "การเป็นพยาน" },
  { id: 12, title: "พิธีมหาสนิท" },
  { id: 13, title: "บัพติศมาในน้ำ" },
  { id: 14, title: "การถวายจากใจ" },
  { id: 15, title: "การเชื่อฟังและผู้นำ" },
  { id: 16, title: "จุดยืนคริสตชน" },
  { id: 17, title: "การชนะปัญหาชีวิต" },
  { id: 18, title: "การมีส่วนร่วมในคริสตจักรท้องถิ่น" },
];

// "ลักษณะชีวิตคริสเตียน" curriculum — 36 หัวข้อ แบ่งเป็น 2 ตอน ตอนละ 18 หัวข้อ
// (dataSeedV2Christian_life_topics_1.csv / _2.csv, ดู grill-me 2026-08-13).
// ขับเคลื่อนด้วย `lamb_info.lamb_lesson_life_progress` คอลัมน์เดียว นับต่อเนื่อง
// 0-36 (1-18 = ตอน 1 กำลังทำ, 19-36 = ตอน 1 จบแล้วทำตอน 2 ต่อ) — ดู
// growth-progress-card.tsx สำหรับการแบ่งค่าออกเป็นสองตอน
export const CHRISTIAN_LIFE_LESSONS_PART1: GrowthLesson[] = [
  { id: 1, title: "ความสำคัญของการสร้างลักษณะชีวิตคริสเตียน" },
  { id: 2, title: "การรื้อฟื้นสภาพชีวิตใหม่" },
  { id: 3, title: "การมีจุดมุ่งหมายที่ถูกต้อง (ตอนที่ 1)" },
  { id: 4, title: "การมีจุดมุ่งหมายที่ถูกต้อง (ตอนที่ 2)" },
  { id: 5, title: "การมีจุดมุ่งหมายที่ถูกต้อง (ตอนที่ 3)" },
  { id: 6, title: "การมีแรงจูงใจที่ถูกต้อง (ตอนที่ 1)" },
  { id: 7, title: "การมีแรงจูงใจที่ถูกต้อง (ตอนที่ 2)" },
  { id: 8, title: "ท่าทีชีวิตที่ภาวนาพระวจนะพระเจ้า ตอนที่ 1" },
  { id: 9, title: "ท่าทีชีวิตที่ภาวนาพระวจนะพระเจ้า ตอนที่ 2" },
  { id: 10, title: "การเอาชนะความหยิ่ง ตอนที่ 1" },
  { id: 11, title: "การเอาชนะความหยิ่ง ตอนที่ 2" },
  { id: 12, title: "การเอาชนะความหยิ่ง ตอนที่ 3" },
  { id: 13, title: "การเอาชนะความหยิ่ง ตอนที่ 4" },
  { id: 14, title: "การเชื่อฟัง ตอนที่ 1" },
  { id: 15, title: "การเชื่อฟัง ตอนที่ 2" },
  { id: 16, title: "ความรับผิดชอบของคริสเตียน ตอนที่ 1" },
  { id: 17, title: "ความรับผิดชอบของคริสเตียน ตอนที่ 2" },
  { id: 18, title: "ความรับผิดชอบของคริสเตียน ตอนที่ 3" },
];

export const CHRISTIAN_LIFE_LESSONS_PART2: GrowthLesson[] = [
  { id: 1, title: "การเอาชนะความโกรธ ตอน 1" },
  { id: 2, title: "การเอาชนะความโกรธ ตอน 2" },
  { id: 3, title: "การเอาชนะความขมขื่น ตอน 1" },
  { id: 4, title: "การเอาชนะความขมขื่น ตอน 2" },
  { id: 5, title: "การเอาชนะความกลัว" },
  { id: 6, title: "การเอาชนะปมด้อย" },
  { id: 7, title: "การเอาชนะชีวิตที่ไม่บริสุทธิ์ทางเพศ ตอน 1" },
  { id: 8, title: "การเอาชนะชีวิตที่ไม่บริสุทธิ์ทางเพศ ตอน 2" },
  { id: 9, title: "การเอาชนะชีวิตที่ไม่บริสุทธิ์ทางเพศ ตอน 3" },
  { id: 10, title: "การเอาชนะจิตสำนึกผิด ตอน 1" },
  { id: 11, title: "การเอาชนะจิตสำนึกผิด ตอน 2" },
  { id: 12, title: "การเอาชนะจิตสำนึกผิด ตอน 3" },
  { id: 13, title: "การเอาชนะจิตสำนึกผิด ตอน 4" },
  { id: 14, title: "การสร้างมิตร" },
  { id: 15, title: "การพูดของคริสเตียน ตอน 1" },
  { id: 16, title: "การพูดของคริสเตียน ตอน 2" },
  { id: 17, title: "การพูดของคริสเตียน ตอน 3" },
  { id: 18, title: "มารยาทคริสเตียน" },
];
