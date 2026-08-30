import {
  differenceInYears,
  format,
  isValid,
  parseISO,
  startOfWeek,
  subWeeks,
} from "date-fns";
import {
  GIFT_DEFINITIONS,
  type Gift,
  type GiftFromGodRow,
} from "@/features/lamb-info/data/gifts";
import { splitTags } from "@/lib/tag-color";
import type {
  DashboardAttendanceRow,
  DashboardGroupCare,
  DashboardLamb,
  DashboardPersonalityType,
} from "../data/schema";

// สรุปดีไซน์จาก grill-me 2026-08-14 (`dashboard_design` ใน project memory):
// - "สมาชิกทั้งหมด" นับทุกแถวไม่กรอง status ส่วน active/ผู้นำ/สมาชิกทั่วไป
//   คำนวณจากสมาชิก active เท่านั้น (ผู้นำ = active ที่มี role เป็น cell_leader/
//   team_leader หรือมีคำว่า "leader" ใน tags แบบ case-insensitive, สมาชิกทั่วไป
//   = active ลบผู้นำ ไม่ทับซ้อนกัน)
// - อัปเดต 2026-08-17 (rbac_lamb_role_redesign): RBAC ใช้งานจริงแล้ว —
//   is_leader_group_care ถูกลบไปแล้ว เปลี่ยนมาเช็ค lamb_info.role ตรงๆ แทน
//   (tags heuristic ยังคงไว้เป็น fallback เดิม ไม่ได้ตัดออก)

export type MemberCounts = {
  total: number;
  active: number;
  leaders: number;
  regularMembers: number;
};

function isLeader(lamb: DashboardLamb): boolean {
  if (lamb.role === "cell_leader" || lamb.role === "team_leader") return true;
  return splitTags(lamb.tags).some((tag) =>
    tag.toLowerCase().includes("leader"),
  );
}

export function computeMemberCounts(lambs: DashboardLamb[]): MemberCounts {
  const total = lambs.length;
  const activeLambs = lambs.filter((l) => l.status === true);
  const leaders = activeLambs.filter(isLeader).length;
  return {
    total,
    active: activeLambs.length,
    leaders,
    regularMembers: activeLambs.length - leaders,
  };
}

// เกิดเดือนนี้ — เฉพาะสมาชิก active (สอดคล้องกับสมมติฐานว่าการ์ดนี้ไว้ฉลอง
// วันเกิดสมาชิกปัจจุบัน ไม่ใช่คนที่ลาออกไปแล้ว) เรียงตามวันที่ในเดือน
// month: 0-11 (JS Date convention). Underlies computeBirthdaysThisMonth
// (below) and the standalone "เดือนเกิด" page (features/birthdays/) which
// lets you pick any of the 12 months — same filter/sort as the Dashboard
// card by design (grill-me 2026-08-30): active members only
// (status === true), sorted by day-of-month.
export function computeBirthdaysInMonth(
  lambs: DashboardLamb[],
  month: number,
): DashboardLamb[] {
  return lambs
    .filter((l) => l.status === true && l.birthday)
    .map((l) => ({ lamb: l, date: parseISO(l.birthday as string) }))
    .filter(({ date }) => isValid(date) && date.getMonth() === month)
    .sort((a, b) => a.date.getDate() - b.date.getDate())
    .map(({ lamb }) => lamb);
}

export function computeBirthdaysThisMonth(
  lambs: DashboardLamb[],
  today: Date,
): DashboardLamb[] {
  return computeBirthdaysInMonth(lambs, today.getMonth());
}

export type GenderCounts = { male: number; female: number };

// "female"/"male" เป็น substring ของกันและกัน (female ⊃ male) จึงต้องเช็ค
// female ก่อนเสมอ ไม่งั้น "female"/"หญิง" จะโดนนับเป็นชายผิดๆ ดู grill-me
// 2026-08-14 (`dashboard_design`) — group ตามค่า raw เป๊ะๆ ไม่ normalize
// ยกเว้น 2 การ์ดนี้ที่ทำ contains match แบบ case-insensitive
function classifyGender(raw: string | null): "male" | "female" | null {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (v.includes("หญิง") || v.includes("female")) return "female";
  if (v.includes("ชาย") || v.includes("male")) return "male";
  return null;
}

export function computeGenderCounts(lambs: DashboardLamb[]): GenderCounts {
  let male = 0;
  let female = 0;
  for (const lamb of lambs) {
    const g = classifyGender(lamb.gender);
    if (g === "male") male++;
    else if (g === "female") female++;
  }
  return { male, female };
}

export const AGE_BRACKETS = [
  { label: "0-12", min: 0, max: 12 },
  { label: "13-19", min: 13, max: 19 },
  { label: "20-35", min: 20, max: 35 },
  { label: "36-50", min: 36, max: 50 },
  { label: "51-65", min: 51, max: 65 },
  { label: "65+", min: 66, max: Infinity },
] as const;

export type AgeBracketCount = { label: string; count: number };

export type AgeStats = {
  averageAge: number | null;
  brackets: AgeBracketCount[];
};

// คำนวณอายุจาก birthday เสมอ (ไม่ใช้คอลัมน์ age ที่เก็บตรงๆ ซึ่งอาจไม่อัปเดต
// ตามรอบ) — ตกลงใน grill-me 2026-08-14
function calculateAge(birthday: string, today: Date): number | null {
  const parsed = parseISO(birthday);
  if (!isValid(parsed)) return null;
  return differenceInYears(today, parsed);
}

// คนที่ไม่มี birthday (null) ถูกตัดออกจากทั้งค่าเฉลี่ยและช่วงอายุทั้งหมด
// (ไม่ fallback ไปใช้คอลัมน์ age) รวม active + inactive ตามที่ตกลง —
// excludePastor (2026-08-28 grill-me) ตัดคนที่มี tag "Pastor" ออกทั้งจาก
// ค่าเฉลี่ยและกราฟช่วงอายุ (lamb_info.tags เป็น comma-separated string เช่น
// "Pastor, Leader team" — เช็คแบบ includes ไม่ใช่ exact match) ปิดไว้เป็น
// default (นับรวม Pastor) ผู้ใช้กดเปิดเองจาก Dashboard
export function computeAgeStats(
  lambs: DashboardLamb[],
  today: Date,
  excludePastor = false,
): AgeStats {
  const scoped = excludePastor
    ? lambs.filter((l) => !splitTags(l.tags).includes("Pastor"))
    : lambs;
  const ages = scoped
    .map((l) => (l.birthday ? calculateAge(l.birthday, today) : null))
    .filter((age): age is number => age !== null && age >= 0);

  const averageAge =
    ages.length === 0
      ? null
      : Math.round((ages.reduce((sum, a) => sum + a, 0) / ages.length) * 10) /
        10;

  const brackets: AgeBracketCount[] = AGE_BRACKETS.map((bucket) => ({
    label: bucket.label,
    count: ages.filter((age) => age >= bucket.min && age <= bucket.max).length,
  }));

  return { averageAge, brackets };
}

// เฉลี่ยคะแนนต่อของประทาน (ทั้ง 25 ชนิด) เฉพาะคนที่มี row ใน gift_from_god
// (ทำแบบประเมินแล้ว) — ไม่ default คนที่ยังไม่ทำเป็น 0 เพราะจะกดค่าเฉลี่ยของ
// ทุกของประทานให้ต่ำเกินจริงอย่างไม่เป็นธรรม (ตกลงใน grill-me 2026-08-14)
// คืนค่าเป็น Gift[] แบบเดียวกับ mergeGiftScores เพื่อป้อนเข้า
// getGiftRadarData() ของ lamb-info/data/gifts.ts ได้ตรงๆ (ใช้ตัวเดียวกับ
// GiftsCard ของรายคน ไม่ reimplement การ group เป็น category)
export function computeGiftAverages(giftRows: GiftFromGodRow[]): Gift[] {
  if (giftRows.length === 0) return [];
  return GIFT_DEFINITIONS.map((def) => {
    const total = giftRows.reduce((sum, row) => {
      const raw = row[def.column];
      const score = typeof raw === "number" ? raw : Number(raw ?? 0);
      return sum + (Number.isFinite(score) ? score : 0);
    }, 0);
    return { ...def, score: total / giftRows.length };
  });
}

export type GiftHighlight = { name: string; average: number } | null;

export type GiftStats = {
  assessedCount: number;
  top: GiftHighlight;
  bottom: GiftHighlight;
};

// top1/bottom1 ต่อของประทานเดี่ยว (ไม่ใช่ category) — สร้างจาก
// computeGiftAverages() ตัวเดียวกับที่ป้อนเข้า radar chart กันตัวเลขไม่ตรงกัน
export function computeGiftStats(giftRows: GiftFromGodRow[]): GiftStats {
  const assessedCount = giftRows.length;
  const averages = computeGiftAverages(giftRows);
  if (assessedCount === 0 || averages.length === 0) {
    return { assessedCount: 0, top: null, bottom: null };
  }

  const top = averages.reduce((best, cur) =>
    cur.score > best.score ? cur : best,
  );
  const bottom = averages.reduce((worst, cur) =>
    cur.score < worst.score ? cur : worst,
  );

  return {
    assessedCount,
    top: { name: top.name, average: top.score },
    bottom: { name: bottom.name, average: bottom.score },
  };
}

// สรุปดีไซน์เพิ่มเติมจาก grill-me 2026-08-14 รอบสอง (`dashboard_design` ใน
// project memory) — กลุ่มแคร์/เทรนด์มาโบสถ์-แคร์/บุคลิกภาพ/จบครบหลักสูตร ทุก
// หมวดนับเฉพาะสมาชิก active เหมือนหมวดอื่นๆ ในหน้านี้

// แถว group_care ที่เป็น sentinel/placeholder สำหรับ UI (เช่น dropdown
// "ทั้งหมด"/"ไม่มีกลุ่ม") ไม่ใช่กลุ่มแคร์จริง — ยืนยันจากข้อมูลจริงใน DB
// (2026-08-14 รอบสาม, `dashboard_design`): มีแค่ 2 แถวชื่อนี้ทั้งคู่ day/address
// เป็น null ต่างจากกลุ่มแคร์จริงทุกกลุ่ม เทียบแบบ trim + lowercase กันเผื่อมี
// เว้นวรรค/ตัวพิมพ์ต่างกัน
const SENTINEL_GROUP_NAMES = new Set(["all", "none"]);

function isSentinelGroup(name: string | null): boolean {
  return name !== null && SENTINEL_GROUP_NAMES.has(name.trim().toLowerCase());
}

export type GroupCareStats = {
  totalGroups: number;
  averageSize: number | null;
};

// จำนวนกลุ่ม = แถว group_care ทั้งหมด "ที่ไม่ใช่ sentinel" — ขนาดเฉลี่ยต่อ
// กลุ่ม = สมาชิก active ที่มี group_care ชี้ไปกลุ่มจริง (ไม่ใช่ sentinel) หาร
// ด้วยจำนวนกลุ่มจริง (รวมกลุ่มที่ยังไม่มีสมาชิกด้วย ไม่ใช่แค่กลุ่มที่มีคน
// แล้ว) — คนที่ group_care ชี้ไปกลุ่ม sentinel (พบจริงใน DB ว่ามี 2 คนชี้ไป
// "all") ถือว่า "ยังไม่มีกลุ่มจริง" ไม่นับในตัวเศษ ตกลงใน grill-me 2026-08-14
// รอบสาม (`dashboard_design`)
export function computeGroupCareStats(
  lambs: DashboardLamb[],
  groupCareList: DashboardGroupCare[],
): GroupCareStats {
  const realGroups = groupCareList.filter((g) => !isSentinelGroup(g.name));
  const sentinelGroupIds = new Set(
    groupCareList.filter((g) => isSentinelGroup(g.name)).map((g) => g.id),
  );

  const assigned = lambs.filter(
    (l) =>
      l.status === true &&
      !!l.group_care &&
      !sentinelGroupIds.has(l.group_care),
  ).length;

  const totalGroups = realGroups.length;
  return {
    totalGroups,
    averageSize:
      totalGroups === 0 ? null : Math.round((assigned / totalGroups) * 10) / 10,
  };
}

// 12 สัปดาห์ล่าสุด (รวมสัปดาห์นี้) แบบ week_start เป็นวันอาทิตย์ เดียวกับ
// convention ของหน้า attendance (attendance/index.tsx toWeekStart) — คืนค่า
// เรียงเก่า -> ใหม่ ให้ตรงกับแกน X ของกราฟเทรนด์
export function getRecentWeekStarts(today: Date, count: number): string[] {
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 0 });
  return Array.from({ length: count }, (_, i) =>
    format(subWeeks(currentWeekStart, count - 1 - i), "yyyy-MM-dd"),
  );
}

export type AttendanceWeekPoint = {
  weekStart: string;
  weekLabel: string;
  churchPercent: number;
  carePercent: number;
};

// % ต่อสัปดาห์ = จำนวนคน active ที่เช็คชื่อว่ามา / จำนวนสมาชิก active
// "ปัจจุบัน" คงที่ทุกสัปดาห์ในกราฟ (ไม่ได้ปรับตามจำนวนสมาชิก ณ ตอนนั้น) —
// เดียวกับ convention ของ useAttendanceSummary ที่ใช้ขอบเขต active ปัจจุบัน
export function computeAttendanceTrend(
  weekStarts: string[],
  totalActiveMembers: number,
  rows: DashboardAttendanceRow[],
): AttendanceWeekPoint[] {
  const byWeek = new Map<string, { church: number; care: number }>();
  for (const row of rows) {
    const bucket = byWeek.get(row.week_start) ?? { church: 0, care: 0 };
    if (row.came_to_church) bucket.church++;
    if (row.came_to_group_care) bucket.care++;
    byWeek.set(row.week_start, bucket);
  }

  return weekStarts.map((weekStart) => {
    const bucket = byWeek.get(weekStart) ?? { church: 0, care: 0 };
    return {
      weekStart,
      weekLabel: format(parseISO(weekStart), "d MMM"),
      churchPercent:
        totalActiveMembers === 0
          ? 0
          : Math.round((bucket.church / totalActiveMembers) * 100),
      carePercent:
        totalActiveMembers === 0
          ? 0
          : Math.round((bucket.care / totalActiveMembers) * 100),
    };
  });
}

export type PersonalityCodeCount = {
  code: string;
  count: number;
};

// จำนวนสมาชิก active ต่อ personality_code (4 ตัวแบบ MBTI เช่น ENTJ, INFJ) —
// ยัง validate code กับ personality_type.code ฝั่ง client อยู่ (ทั้ง 2 query
// แยกกันอยู่แล้ว) โค้ดที่ไม่ตรงกับ personality_type แถวไหนเลย (ข้อมูลเพี้ยน/
// พิมพ์ผิด) ถูกข้าม ไม่นับเป็น "ไม่ระบุ" — เรียงจากมากไปน้อย ตกลงใน grill-me
// 2026-08-14 รอบสี่ (`dashboard_design`): เปลี่ยนจาก group ตาม archetype มา
// group ตาม code ตรงๆ แทน
export function computePersonalityDistribution(
  lambs: DashboardLamb[],
  personalityTypes: DashboardPersonalityType[],
): PersonalityCodeCount[] {
  const validCodes = new Set(personalityTypes.map((p) => p.code));

  const counts = new Map<string, number>();
  for (const lamb of lambs) {
    if (lamb.status !== true || !lamb.personality_code) continue;
    if (!validCodes.has(lamb.personality_code)) continue;
    counts.set(
      lamb.personality_code,
      (counts.get(lamb.personality_code) ?? 0) + 1,
    );
  }

  return Array.from(counts.entries())
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count);
}

const CHAPTER_LESSON_TOTAL = 18;
const LIFE_LESSON_TOTAL = 36;

export type LessonCompletionStats = {
  activeCount: number;
  chapterCompletedCount: number;
  lifeCompletedCount: number;
};

// "จบครบ" = lamb_lesson_ch18_progress >= 18 / lamb_lesson_life_progress >= 36
// (ตัวเลขรวม 2 หลักสูตรของ GrowthProgressCard ในโปรไฟล์รายคน — ดู
// lamb-info/components/growth-progress-card.tsx) นับเฉพาะสมาชิก active
export function computeLessonCompletionStats(
  lambs: DashboardLamb[],
): LessonCompletionStats {
  const activeLambs = lambs.filter((l) => l.status === true);
  return {
    activeCount: activeLambs.length,
    chapterCompletedCount: activeLambs.filter(
      (l) => (l.lamb_lesson_ch18_progress ?? 0) >= CHAPTER_LESSON_TOTAL,
    ).length,
    lifeCompletedCount: activeLambs.filter(
      (l) => (l.lamb_lesson_life_progress ?? 0) >= LIFE_LESSON_TOTAL,
    ).length,
  };
}
