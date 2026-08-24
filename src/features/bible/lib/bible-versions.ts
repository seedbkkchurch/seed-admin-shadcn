import { type BibleLanguageMode, type BibleVersion } from "../data/types";

// เพิ่ม/ลบฉบับใหม่ในอนาคต แก้ 4 จุดนี้พอ: BIBLE_VERSIONS, VERSION_LABELS,
// VERSION_SUPPORTS_TH, VERSION_SUPPORTS_EN — ที่เหลือ derive ทั้งหมด (ดู
// grill-me 2026-08-24 รอบ 2 "เปลี่ยน กดเลือกภาษาก่อน แล้วจะแสดง dropdown
// bible") — เพิ่ม VERSION_SUPPORTS_EN รอบ 3 (2026-08-24 "เพิ่ม TCV") ตอน
// เจอฉบับที่มีแต่ไทยล้วนฉบับแรก (เดิมมีแค่ enVersion ที่ไม่รองรับไทย เช่น
// niv/esv ไม่เคยมีฉบับที่ไม่รองรับอังกฤษมาก่อนเลย) — เพิ่ม tncv รอบ 6
// (2026-08-24 "เพิ่ม TNCV ทำเพิ่มอีกอัน") ฉบับไทยล้วนตัวที่สอง ตัวจริงของ
// "TNCV 2007 อมตธรรมร่วมสมัย" ที่ผู้ใช้เคยเข้าใจผิดว่าคือ tcv มาก่อน (ดู
// หมายเหตุ VERSION_LABELS ด้านล่าง) คนละไฟล์ข้อมูลกับ tcv โดยสิ้นเชิง
export const BIBLE_VERSIONS: BibleVersion[] = ["kjv", "niv", "esv", "erv", "tcv", "tncv"];

// เดิมมีแค่ตัวย่ออังกฤษล้วน (KJV/NIV/ESV/ERV/TCV) ผู้ใช้ขอเพิ่มคำอธิบาย
// ภาษาไทยต่อท้ายทุกฉบับให้เข้าใจง่ายขึ้น (2026-08-24 หลังแก้บั๊ก TCV) — ป้าย
// TCV ลองเปลี่ยนเป็น "TNCV 2007 อมตธรรมร่วมสมัย" ไปรอบนึงตามที่ผู้ใช้บอก แต่
// ผู้ใช้แจ้งกลับว่าผิด ชื่อจริงคือ "Open Thai Common Version 2025" (OTCV)
// ตรงกับ metadata.xml ตั้งแต่แรก (identification/name, abbreviation) —
// แก้กลับให้ตรง metadata จริง ไม่เดา/ไม่ใช้ชื่อฉบับอื่นที่คล้ายกันมาแทน — นี่
// คือแค่เปลี่ยนป้ายที่โชว์ ไม่ได้แตะ internal key "tcv"/โฟลเดอร์ข้อมูล
// tcv-th เลย เพราะกระทบวงกว้างเกินไป (type, zod schema, ชื่อโฟลเดอร์บนดิสก์)
// — KJV คงข้อความ "(มี Strong's)" ต่อท้ายไว้เหมือนเดิมด้วย
// tncv (2026-08-24 รอบ 6) = "Biblica® Open Thai New Contemporary Version
// 2007" ยืนยันจาก metadata.xml ของโฟลเดอร์ใหม่ที่ผู้ใช้อัปโหลด — publication
// abbreviation ในไฟล์เดียวกันคือ "TNCV" (ไม่ใช่ OTNCV แม้ full name จะขึ้น
// ต้นด้วย "Open") ชื่อไทย (nameLocal) คือ "...ฉบับอมตธรรมร่วมสมัยแบบเปิด"
// — นี่คือฉบับที่ผู้ใช้เคยขอเปลี่ยนชื่อ tcv ไปเป็น "TNCV 2007
// อมตธรรมร่วมสมัย" ผิดตัวมาก่อน (ดูหมายเหตุ tcv ด้านบน) รอบนี้ label ตรงกับ
// metadata จริงแล้ว
export const VERSION_LABELS: Record<BibleVersion, string> = {
  kjv: "KJV ฉบับคิงเจมส์ (มี Strong's)",
  niv: "NIV ฉบับมาตรฐานสากลใหม่",
  esv: "ESV ฉบับมาตรฐานอังกฤษ",
  erv: "ERV ฉบับอ่านง่าย",
  tcv: "OTCV 2025 ฉบับไทยสามัญแบบเปิด",
  tncv: "TNCV 2007 อมตธรรมร่วมสมัย",
};

// ฉบับที่มีไฟล์ภาษาไทยด้วย — kjv/erv มีคู่กับอังกฤษ, tcv เป็นไทยล้วน (ไม่มี
// ไฟล์อังกฤษเลย ต่างจาก niv/esv ที่เป็นอังกฤษล้วนไม่มีไฟล์ไทย)
export const VERSION_SUPPORTS_TH: Record<BibleVersion, boolean> = {
  kjv: true,
  niv: false,
  esv: false,
  erv: true,
  tcv: true,
  tncv: true,
};

// ฉบับที่มีไฟล์ภาษาอังกฤษด้วย — tcv (Thai Common Version 2025) เป็นไทยล้วน
// จาก USX ต้นฉบับที่ผู้ใช้อัปโหลด ไม่มีคู่ภาษาอังกฤษเลย (ดู grill-me
// 2026-08-24 รอบ 3 "โชว์เฉพาะโหมดไทยอย่างเดียว") — ต่างจากฉบับอื่นทั้งหมดที่
// เคยเพิ่มมาก่อนหน้านี้ซึ่งมีอังกฤษเสมอ
export const VERSION_SUPPORTS_EN: Record<BibleVersion, boolean> = {
  kjv: true,
  niv: true,
  esv: true,
  erv: true,
  tcv: false,
  tncv: false,
};

const FALLBACK_VERSION: BibleVersion = "kjv";

// dropdown ฉบับกรองตามโหมดภาษาที่เลือกไว้ก่อน — "อังกฤษอย่างเดียว" เห็นฉบับ
// ที่มีอังกฤษ (kjv/niv/esv/erv, ไม่มี tcv), "ไทยอย่างเดียว" เห็นฉบับที่มีไทย
// (kjv/erv/tcv), "ทั้งสองภาษา" เห็นเฉพาะฉบับที่มีครบทั้งสองภาษา (kjv/erv
// เท่านั้น — tcv ไม่มีอังกฤษเลยจึงไม่โผล่ตอนนี้)
export function versionsForMode(mode: BibleLanguageMode): BibleVersion[] {
  if (mode === "en") return BIBLE_VERSIONS.filter((v) => VERSION_SUPPORTS_EN[v]);
  if (mode === "th") return BIBLE_VERSIONS.filter((v) => VERSION_SUPPORTS_TH[v]);
  return BIBLE_VERSIONS.filter((v) => VERSION_SUPPORTS_TH[v] && VERSION_SUPPORTS_EN[v]);
}

// เปลี่ยนโหมดภาษาแล้วฉบับที่เลือกไว้ใช้ไม่ได้กับโหมดใหม่ (เช่น NIV ตอน
// เปลี่ยนจาก "อังกฤษอย่างเดียว" ไปเป็น "ทั้งสองภาษา" หรือ TCV ตอนเปลี่ยนจาก
// "ไทยอย่างเดียว" ไปเป็นโหมดอื่น) — เด้งกลับไป KJV อัตโนมัติ (ดู grill-me
// 2026-08-24 รอบ 2 "Fallback ฉบับ")
export function resolveVersionForMode(
  version: BibleVersion,
  mode: BibleLanguageMode,
): BibleVersion {
  return versionsForMode(mode).includes(version) ? version : FALLBACK_VERSION;
}

// เรียกใช้แม้ตอน mode="th" (ไม่โชว์ฝั่งอังกฤษเลย) เพราะ bible-panel.tsx ยิง
// fetch ทั้งสองภาษาเสมอไม่ว่าจะโชว์หรือไม่ (ของเดิมทำแบบนี้อยู่แล้วกับ
// niv/esv ตอน mode="en" ก็ยิง fetch "thai" ทิ้งเปล่าๆ เหมือนกัน) — tcv ไม่มี
// ไฟล์อังกฤษเลย จึง fallback ไป "kjv" เฉยๆ (ไม่ถูกใช้แสดงผลจริงเพราะ tcv
// เลือกได้แค่ตอน mode="th" เท่านั้น)
export function enFileLangFor(
  version: BibleVersion,
): "kjv" | "niv" | "esv" | "erv-en" {
  if (version === "erv") return "erv-en";
  if (version === "tcv" || version === "tncv") return "kjv";
  return version;
}

export function thFileLangFor(
  version: BibleVersion,
): "thai" | "erv-th" | "tcv-th" | "tncv-th" {
  if (version === "erv") return "erv-th";
  if (version === "tcv") return "tcv-th";
  if (version === "tncv") return "tncv-th";
  return "thai";
}
