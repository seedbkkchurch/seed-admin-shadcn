import type { FriendCardData } from "../components/friend-card";
import { differenceInYears, isValid, parseISO } from "date-fns";

// รูปโปรไฟล์ที่ใช้ได้ต้องเป็น URL จริง — ข้อมูลเก่าบางแถวเก็บเป็นตัวเลขล้วน
// (เหมือน profilePhotoUrl ใน birthdays/components/birthday-fan.tsx)
export function profilePhotoUrl(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed && /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

// อายุจริงวันนี้ คำนวณจาก birthday (ไม่ใช้คอลัมน์ age ที่ไม่อัปเดตเอง)
export function ageFromBirthday(
  birthday: string | null,
  today: Date,
): number | null {
  if (!birthday) return null;
  const date = parseISO(birthday);
  if (!isValid(date)) return null;
  const age = differenceInYears(today, date);
  return age > 0 && age < 120 ? age : null;
}

// interesting เป็นข้อความอิสระ ไทยปนอังกฤษ คั่นด้วย , / หรือเว้นวรรค — แยกเป็น
// รายการสำหรับชิป: แยกด้วย , / ก่อน ถ้าไม่มีตัวคั่นและเป็นภาษาไทยค่อยแยกด้วย
// เว้นวรรค (กติกาเดียวกับ firstInterest ใน birthdays/data/interest-photo.ts)
export function splitInterests(interesting: string | null): string[] {
  if (!interesting) return [];
  let parts = interesting
    .split(/[,/、]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 1 && /[฀-๿]/.test(parts[0])) {
    parts = parts[0].split(/\s+/).filter(Boolean);
  }
  return parts.map((part) => part.replace(/^ชอบ/, "").trim()).filter(Boolean);
}

// สุ่มลำดับแบบมี seed — seed เดียวกัน = ลำดับเดิม (refetch แล้วไม่สลับใหม่)
// กด "สุ่มใหม่อีกรอบ" = เปลี่ยน seed
export function seededShuffle<T>(items: T[], seed: number): T[] {
  let state = Math.floor(seed * 2 ** 32) >>> 0;
  const random = () => {
    // mulberry32
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// มีด้านหลังให้พลิกไหม — ต้องมีบุคลิกภาพหรืออาหารที่ชอบ/ไม่ชอบอย่างน้อยหนึ่งอย่าง
export function hasBack(friend: FriendCardData) {
  return !!friend.personality || !!friend.favoriteFood || !!friend.dislikedFood;
}
