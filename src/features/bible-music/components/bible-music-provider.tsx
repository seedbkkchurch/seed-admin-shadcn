import { type ReactNode, useCallback, useMemo, useState } from "react";
import { useBibleMusicTracks } from "../data/queries";
import { BibleMusicContext } from "../lib/bible-music-context";
import { BibleMusicPlayer } from "./bible-music-player";

// ครอบทั้งแอปใน AuthenticatedLayout (เปลี่ยนจากเฉพาะหน้าพระคัมภีร์ 2026-11-20)
// — เพลงเล่นต่อเนื่องระหว่างเปลี่ยนหน้า ตราบที่แอป/แท็บยังเปิดอยู่ ปิดแอป =
// เพลงหยุด (ตัวเล่น YouTube ฝังในหน้า เล่นเบื้องหลังหลังปิดแอปไม่ได้)
export function BibleMusicProvider({ children }: { children: ReactNode }) {
  const { data } = useBibleMusicTracks({ activeOnly: true });
  const tracks = useMemo(() => data ?? [], [data]);
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((value) => !value), []);
  const close = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ tracks, open, toggle }),
    [tracks, open, toggle],
  );

  return (
    <BibleMusicContext.Provider value={value}>
      {children}
      {open && tracks.length > 0 && (
        <BibleMusicPlayer tracks={tracks} onClose={close} />
      )}
    </BibleMusicContext.Provider>
  );
}
