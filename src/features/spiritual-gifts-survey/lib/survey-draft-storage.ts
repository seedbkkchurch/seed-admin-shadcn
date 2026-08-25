// ร่างแบบสำรวจของประทานที่ยังทำไม่เสร็จ — กันเผลอปิดหน้า/รีเฟรชแล้วต้องเริ่ม
// ทำ 125 ข้อใหม่หมด (ตกลงใน grill-me 2026-08-25) คีย์แยกตาม lambId
// (pattern เดียวกับ devotion-dialog-draft ใน
// features/lamb-info/lib/devotion-draft-storage.ts) แต่ *ไม่* หมดอายุข้าม
// วันแบบร่างเฝ้าเดี่ยว — ตกลงชัดเจนว่าแบบสำรวจนี้ยาวมาก อาจทำคนละวันได้
// ร่างต้องอยู่จนกว่าจะกด "ส่งแบบสำรวจ" สำเร็จ หรือผู้ใช้ล้างเอง
import type { SurveyAnswers } from "../data/scoring";

const DRAFT_KEY_PREFIX = "spiritual-gifts-survey-draft-v1:";

type StoredDraft = {
  answers: SurveyAnswers;
};

function draftKey(lambId: string): string {
  return `${DRAFT_KEY_PREFIX}${lambId}`;
}

export function loadSurveyDraft(lambId: string): SurveyAnswers | null {
  try {
    const raw = localStorage.getItem(draftKey(lambId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDraft>;
    if (!parsed.answers || typeof parsed.answers !== "object") return null;

    const answers: SurveyAnswers = {};
    for (const [key, value] of Object.entries(parsed.answers)) {
      const index = Number(key);
      const score = Number(value);
      if (
        Number.isInteger(index) &&
        index >= 1 &&
        index <= 125 &&
        Number.isInteger(score) &&
        score >= 0 &&
        score <= 3
      ) {
        answers[index] = score;
      }
    }
    return Object.keys(answers).length > 0 ? answers : null;
  } catch {
    return null;
  }
}

export function saveSurveyDraft(lambId: string, answers: SurveyAnswers): void {
  try {
    const stored: StoredDraft = { answers };
    localStorage.setItem(draftKey(lambId), JSON.stringify(stored));
  } catch {
    // localStorage เต็ม/ถูกบล็อก — ไม่ใช่เรื่องคอขาดบาดตาย เงียบไปเลย
  }
}

export function clearSurveyDraft(lambId: string): void {
  try {
    localStorage.removeItem(draftKey(lambId));
  } catch {
    // เงียบไว้เหมือนกัน
  }
}
