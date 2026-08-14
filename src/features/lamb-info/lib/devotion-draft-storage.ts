import { format } from "date-fns";

// ร่างเฝ้าเดี่ยวที่ยังไม่ได้ส่ง — กันเผลอรีเฟรชแล้วเสียของที่เขียนไว้ (ตกลงใน
// grill-me 2026-08-14, `devotion_multi_submit_design` ใน project memory)
// Pattern เดียวกับ features/bible/lib/quick-ref-storage.ts (localStorage,
// try/catch เงียบๆ ถ้าอ่าน/เขียนไม่ได้) แต่เพิ่มการ "หมดอายุข้ามวัน" —
// ร่างที่บันทึกไว้เมื่อวานจะไม่โผล่มาอีกถ้าเปิดหน้าวันถัดไป (ตัดสินใจไว้ว่า
// ไม่อยากให้ร่างเก่าค้างอยู่ข้ามวันแบบไม่มีกำหนด)
//
// สองจุดที่ใช้ draft นี้:
//   - หน้าเขียนเต็ม (devotion-editor.tsx, DevotionEditor) — ใช้
//     DEVOTION_EDITOR_DRAFT_KEY เดียว ไม่แยกตาม lamb เพราะมีแค่หน้าเดียว
//   - Popup เร็วในหน้าโปรไฟล์ (devotion-upload-dialog.tsx) — คีย์แยกตาม
//     lambId กันสลับไปโปรไฟล์คนอื่นแล้วเจอร่างของคนก่อนหน้า

function todayKey(today: Date): string {
  return format(today, "yyyy-MM-dd");
}

// ===== หน้าเขียนเต็ม (DevotionEditor, /lamb-info/devotion/new) =====

const EDITOR_DRAFT_KEY = "devotion-editor-draft-v1";

export type DevotionEditorDraft = {
  lambId: string | undefined;
  title: string;
  html: string;
  isPublic: boolean;
};

type StoredEditorDraft = DevotionEditorDraft & { savedDate: string };

export function loadDevotionEditorDraft(
  today: Date,
): DevotionEditorDraft | null {
  try {
    const raw = localStorage.getItem(EDITOR_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredEditorDraft>;
    if (parsed.savedDate !== todayKey(today)) {
      // ข้ามวันแล้ว — ทิ้งร่างเก่า ไม่ต้องรอผู้ใช้กด Clear เอง
      localStorage.removeItem(EDITOR_DRAFT_KEY);
      return null;
    }
    if (typeof parsed.title !== "string" || typeof parsed.html !== "string") {
      return null;
    }
    return {
      lambId: typeof parsed.lambId === "string" ? parsed.lambId : undefined,
      title: parsed.title,
      html: parsed.html,
      isPublic: parsed.isPublic !== false,
    };
  } catch {
    return null;
  }
}

export function saveDevotionEditorDraft(
  draft: DevotionEditorDraft,
  today: Date,
): void {
  try {
    const stored: StoredEditorDraft = { ...draft, savedDate: todayKey(today) };
    localStorage.setItem(EDITOR_DRAFT_KEY, JSON.stringify(stored));
  } catch {
    // localStorage เต็ม/ถูกบล็อก — ไม่ใช่เรื่องคอขาดบาดตาย เงียบไปเลย
  }
}

export function clearDevotionEditorDraft(): void {
  try {
    localStorage.removeItem(EDITOR_DRAFT_KEY);
  } catch {
    // เงียบไว้เหมือนกัน
  }
}

// ===== Popup เร็วในหน้าโปรไฟล์ (DevotionUploadDialog) =====
//
// เก็บเฉพาะ tab "พิมพ์ข้อความ" — tab "อัปโหลดรูป" มีค่าเป็น File object
// ซึ่ง serialize ลง localStorage ไม่ได้ ถ้าเผลอรีเฟรชตอนอยู่ tab รูป ส่วนรูป
// จะรีเซ็ตแต่ข้อความ (ถ้ามี) ยังกู้กลับมาได้ปกติ

const DIALOG_DRAFT_KEY_PREFIX = "devotion-dialog-draft-v1:";

export type DevotionDialogDraft = {
  text: string;
  isPublic: boolean;
};

type StoredDialogDraft = DevotionDialogDraft & { savedDate: string };

function dialogDraftKey(lambId: string): string {
  return `${DIALOG_DRAFT_KEY_PREFIX}${lambId}`;
}

export function loadDevotionDialogDraft(
  lambId: string,
  today: Date,
): DevotionDialogDraft | null {
  try {
    const raw = localStorage.getItem(dialogDraftKey(lambId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDialogDraft>;
    if (parsed.savedDate !== todayKey(today)) {
      localStorage.removeItem(dialogDraftKey(lambId));
      return null;
    }
    if (typeof parsed.text !== "string" || parsed.text.trim() === "") {
      return null;
    }
    return {
      text: parsed.text,
      isPublic: parsed.isPublic !== false,
    };
  } catch {
    return null;
  }
}

export function saveDevotionDialogDraft(
  lambId: string,
  draft: DevotionDialogDraft,
  today: Date,
): void {
  try {
    const stored: StoredDialogDraft = { ...draft, savedDate: todayKey(today) };
    localStorage.setItem(dialogDraftKey(lambId), JSON.stringify(stored));
  } catch {
    // localStorage เต็ม/ถูกบล็อก — เงียบไว้
  }
}

export function clearDevotionDialogDraft(lambId: string): void {
  try {
    localStorage.removeItem(dialogDraftKey(lambId));
  } catch {
    // เงียบไว้
  }
}
