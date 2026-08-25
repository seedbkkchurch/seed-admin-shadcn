// ตารางแมป "ของประทานฝ่ายวิญญาณ" (25 ชนิด) -> 5 ข้อคำถามในแบบสำรวจ (จาก
// spiritualGifts.ts ที่ผู้ใช้ส่งมา) + ไฟล์รูปคำอธิบาย (จาก
// spiritualGiftsKey ที่ผู้ใช้ส่งมา, คัดลอกรูปจริงมาไว้ที่
// public/gifts/<ชื่อไฟล์เดิม>.png แล้ว — ดู grill-me 2026-08-25)
//
// ที่มาของ column/name/category คือ GIFT_DEFINITIONS ใน
// features/lamb-info/data/gifts.ts (ผูกกับตาราง `gift_from_god` จริง) —
// ไฟล์นี้ไม่ประกาศ column ใหม่เอง กัน source of truth แตกเป็นสองที่ แค่แมป
// "ชื่อของประทาน" (ต้องตรงกับ GiftDefinition.name เป๊ะ) เข้ากับข้อคำถาม +
// รูป แล้วปล่อยให้ GIFT_SCORING ด้านล่างประกอบร่างให้เอง — ถ้าแมปไม่ครบ
// (พิมพ์ชื่อผิด/ตกหล่น) จะ throw ทันทีตอน import กันเงียบๆ พลาดจุดคะแนน
// ของประทานบางชนิดหายไปเฉยๆ
import {
  GIFT_DEFINITIONS,
  type GiftCategory,
  type GiftScores,
} from "@/features/lamb-info/data/gifts";

export const TOTAL_QUESTIONS = 125;
export const SCALE_MIN = 0;
export const SCALE_MAX = 3;

// สเกลคำตอบต่อข้อ: มาก=3, บ้าง=2, น้อย=1, ไม่มี=0 — 5 ข้อ/ของประทาน รวมได้
// 0-15 ต่อชนิด ตรงกับ GIFT_SCORE_MIN/MAX ใน gifts.ts พอดี (ยืนยันแล้วว่า
// ตารางออกแบบมาให้ใช้สเกลนี้)
export const ANSWER_SCALE = [
  { value: 3, label: "มาก" },
  { value: 2, label: "บ้าง" },
  { value: 1, label: "น้อย" },
  { value: 0, label: "ไม่มี" },
] as const;

const QUESTION_INDICES_BY_GIFT_NAME: Record<string, number[]> = {
  เผยพระวจนะ: [1, 26, 51, 76, 101],
  อภิบาล: [2, 27, 52, 77, 102],
  การสอน: [3, 28, 53, 78, 103],
  ถ้อยคำประกอบด้วยสติปัญญา: [4, 29, 54, 79, 104],
  ถ้อยคำประกอบด้วยความรู้: [5, 30, 55, 80, 105],
  การตักเตือนและหนุนใจ: [6, 31, 56, 81, 106],
  การสังเกตวิญญาณ: [7, 32, 57, 82, 107],
  การบริจาค: [8, 33, 58, 83, 108],
  การปรนนิบัติ: [9, 34, 59, 84, 109],
  ความเมตตา: [10, 35, 60, 85, 110],
  มิชชันนารี: [11, 36, 61, 86, 111],
  ผู้ประกาศ: [12, 37, 62, 87, 112],
  การรับรองแขก: [13, 38, 63, 88, 113],
  ความเชื่อ: [14, 39, 64, 89, 114],
  ผู้ครอบครอง: [15, 40, 65, 90, 115],
  ผู้บริหาร: [16, 41, 66, 91, 116],
  การอัศจรรย์: [17, 42, 67, 92, 117],
  การรักษาโรค: [18, 43, 68, 93, 118],
  การพูดภาษาแปลก: [19, 44, 69, 94, 119],
  การแปลภาษาแปลก: [20, 45, 70, 95, 120],
  อัครทูต: [21, 46, 71, 96, 121],
  การอยู่เป็นโสด: [22, 47, 72, 97, 122],
  การอธิษฐานอ้อนวอน: [23, 48, 73, 98, 123],
  การขับผี: [24, 49, 74, 99, 124],
  ผู้อุปการะ: [25, 50, 75, 100, 125],
};

// ชื่อไฟล์ตรงกับที่คัดลอกมาไว้ใน public/gifts/ (ชื่อไฟล์เดิมจาก
// GiftFromGod/public/notes, ภาษาไทยเป๊ะ — รวมทั้งจุดที่สะกดไม่มีไม้โท เช่น
// "ถอยคำ" ที่ต้นทางสะกดแบบนั้นจริง)
const IMAGE_FILENAME_BY_GIFT_NAME: Record<string, string> = {
  เผยพระวจนะ: "การเผยพระวจนะ.png",
  อภิบาล: "อภิบาล.png",
  การสอน: "การสอน.png",
  ถ้อยคำประกอบด้วยสติปัญญา: "ถอยคำประกอบด้วยสติปัญญา.png",
  ถ้อยคำประกอบด้วยความรู้: "ความรู้.png",
  การตักเตือนและหนุนใจ: "การหนุนใจ.png",
  การสังเกตวิญญาณ: "ความหยั่งรู้.png",
  การบริจาค: "การให้.png",
  การปรนนิบัติ: "การรับใช้.png",
  ความเมตตา: "ความเมตตา.png",
  มิชชันนารี: "มิชชันนารี.png",
  ผู้ประกาศ: "การประกาศ.png",
  การรับรองแขก: "แขก.png",
  ความเชื่อ: "ความเชื่อ.png",
  ผู้ครอบครอง: "ความเป็นผู้นำ.png",
  ผู้บริหาร: "ผู้บริหาร.png",
  การอัศจรรย์: "การอัศจรรย์.png",
  การรักษาโรค: "การรักษาโรค.png",
  การพูดภาษาแปลก: "ภาษาแปลก.png",
  การแปลภาษาแปลก: "แปลภาษาแปลก.png",
  อัครทูต: "อัครฑูต.png",
  การอยู่เป็นโสด: "โสด.png",
  การอธิษฐานอ้อนวอน: "อธิฐาน.png",
  การขับผี: "ไล่ผี.png",
  ผู้อุปการะ: "อุปการะ.png",
};

export type GiftScoringEntry = {
  column: string;
  name: string;
  category: GiftCategory;
  questionIndices: number[];
  imageUrl: string;
};

export const GIFT_SCORING: GiftScoringEntry[] = GIFT_DEFINITIONS.map((def) => {
  const questionIndices = QUESTION_INDICES_BY_GIFT_NAME[def.name];
  const imageFilename = IMAGE_FILENAME_BY_GIFT_NAME[def.name];
  if (!questionIndices || !imageFilename) {
    throw new Error(
      `spiritual-gifts-survey: missing survey mapping for gift "${def.name}"`,
    );
  }
  return {
    column: def.column,
    name: def.name,
    category: def.category,
    questionIndices,
    imageUrl: `/gifts/${encodeURIComponent(imageFilename)}`,
  };
});

export type SurveyAnswers = Record<number, number>;

export function computeGiftScores(answers: SurveyAnswers): GiftScores {
  const scores: GiftScores = {};
  for (const entry of GIFT_SCORING) {
    scores[entry.column] = entry.questionIndices.reduce(
      (sum, idx) => sum + (answers[idx] ?? 0),
      0,
    );
  }
  return scores;
}

export function countAnswered(answers: SurveyAnswers): number {
  return Object.keys(answers).length;
}

export function isSurveyComplete(answers: SurveyAnswers): boolean {
  for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
    if (answers[i] === undefined) return false;
  }
  return true;
}
