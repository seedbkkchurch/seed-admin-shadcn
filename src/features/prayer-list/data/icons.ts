import {
  BookOpen,
  Briefcase,
  Church,
  GraduationCap,
  HandHeart,
  Heart,
  HeartPulse,
  House,
  Lightbulb,
  MessageCircle,
  Plane,
  Shield,
  Sparkles,
  Sprout,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { PrayerEntryType } from "./schema";

// ชุดไอคอนให้เลือกในแท็บคำอธิษฐาน / สิ่งที่พระเจ้าคุยด้วย (grill-me
// 2026-10-28) — ใช้ชุดเดียวกันทั้งสองแท็บ คอลัมน์ lamb_prayer_request.icon
// เก็บแค่ key ด้านล่าง (text) จึงเพิ่ม/ลดชุดได้โดยไม่ต้องแก้ DB — key ที่ไม่
// รู้จักแล้ว (เช่นถูกตัดออกจากชุด) จะตกไปใช้ไอคอนตั้งต้นของแท็บแทน
export const PRAYER_ICONS = [
  { key: "heart", label: "ครอบครัว / ความรัก", Icon: Heart },
  { key: "heart-pulse", label: "สุขภาพ", Icon: HeartPulse },
  { key: "briefcase", label: "งาน", Icon: Briefcase },
  { key: "graduation-cap", label: "การเรียน", Icon: GraduationCap },
  { key: "wallet", label: "การเงิน", Icon: Wallet },
  { key: "plane", label: "การเดินทาง", Icon: Plane },
  { key: "lightbulb", label: "การทรงนำ / ตัดสินใจ", Icon: Lightbulb },
  { key: "sparkles", label: "การอัศจรรย์ / ขอบคุณ", Icon: Sparkles },
  { key: "house", label: "บ้าน / ที่อยู่", Icon: House },
  { key: "users", label: "เพื่อน / ความสัมพันธ์", Icon: Users },
  { key: "church", label: "คริสตจักร / เซล", Icon: Church },
  { key: "book-open", label: "พระคำ", Icon: BookOpen },
  { key: "sprout", label: "การเติบโตฝ่ายวิญญาณ", Icon: Sprout },
  { key: "shield", label: "การปกป้อง", Icon: Shield },
  { key: "message-circle", label: "พระเจ้าพูด", Icon: MessageCircle },
  { key: "hand-heart", label: "การรับใช้ / ช่วยเหลือ", Icon: HandHeart },
] as const satisfies readonly { key: string; label: string; Icon: LucideIcon }[];

export type PrayerIconKey = (typeof PRAYER_ICONS)[number]["key"];

// ไม่เลือกไอคอน = ใช้ไอคอนตั้งต้นของแท็บ
const DEFAULT_ICON_BY_TYPE: Partial<Record<PrayerEntryType, PrayerIconKey>> = {
  prayer: "hand-heart",
  conversation: "message-circle",
};

export function resolvePrayerIcon(
  type: PrayerEntryType,
  iconKey: string | null | undefined,
): LucideIcon {
  const found =
    PRAYER_ICONS.find((i) => i.key === iconKey) ??
    PRAYER_ICONS.find((i) => i.key === DEFAULT_ICON_BY_TYPE[type]) ??
    PRAYER_ICONS[0];
  return found.Icon;
}
