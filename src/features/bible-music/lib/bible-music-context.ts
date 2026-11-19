import { createContext, useContext } from "react";
import type { BibleMusicTrack } from "../data/queries";

export type BibleMusicContextValue = {
  /** เพลงที่เปิดใช้ (is_active) เรียงตามที่แอดมินตั้ง */
  tracks: BibleMusicTrack[];
  open: boolean;
  /** กด 🎵: ปิดอยู่ = เปิดตัวเล่นและเริ่มเล่น, เปิดอยู่ = ปิดตัวเล่น */
  toggle: () => void;
};

export const BibleMusicContext = createContext<BibleMusicContextValue | null>(
  null,
);

// null = อยู่นอก BibleMusicProvider (เช่น BiblePanel แบบ embedded ในหน้าเขียน
// เฝ้าเดี่ยว) — ปุ่ม 🎵 จะไม่แสดง
export function useBibleMusic() {
  return useContext(BibleMusicContext);
}
