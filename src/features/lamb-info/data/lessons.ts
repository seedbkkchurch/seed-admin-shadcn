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
