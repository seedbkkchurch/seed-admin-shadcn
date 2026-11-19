import { type ReactNode, useCallback, useMemo, useState } from "react";
import { useBibleMusicTracks } from "../data/queries";
import { BibleMusicContext } from "../lib/bible-music-context";
import { BibleMusicPlayer } from "./bible-music-player";

// ครอบทั้งแอปใน AuthenticatedLayout (เปลี่ยนจากเฉพาะหน้าพระคัมภีร์ 2026-11-20)
// — เพลงเล่นต่อเนื่องระหว่างเปลี่ยนหน้า ตราบที่แอป/แท็บยังเปิดอยู่ ปิดแอป =
// เพลงหยุด (ตัวเล่น YouTube ฝังในหน้า เล่นเบื้องหลังหลังปิดแอปไม่ได้)
export function BibleMusicProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = useBibleMusicTracks({ activeOnly: true });
  const tracks = useMemo(() => data ?? [], [data]);
  const [open, setOpen] = useState(false);
  // สถานะเล่น/หยุดจริงจาก YouTube — ตัวเล่นเป็นคนอัปเดตผ่าน setPlaying ให้
  // ปุ่ม 🎵 ทุกปุ่มโชว์แท่งเสียงขยับตอนเล่น (grill-me 2026-11-20) รีเซ็ตทุก
  // ครั้งที่เปิด/ปิดตัวเล่น — เปิดใหม่แล้ว YouTube จะบอกเองเมื่อเริ่มเล่น
  const [playing, setPlaying] = useState(false);
  const toggle = useCallback(() => {
    setOpen((value) => !value);
    setPlaying(false);
  }, []);
  const close = useCallback(() => {
    setOpen(false);
    setPlaying(false);
  }, []);

  const showPlayer = open && tracks.length > 0;

  const value = useMemo(
    () => ({
      tracks,
      isLoading: isPending,
      open,
      playing: showPlayer && playing,
      toggle,
    }),
    [tracks, isPending, open, showPlayer, playing, toggle],
  );

  return (
    <BibleMusicContext.Provider value={value}>
      {children}
      {showPlayer && (
        <BibleMusicPlayer
          tracks={tracks}
          onClose={close}
          playing={playing}
          setPlaying={setPlaying}
        />
      )}
    </BibleMusicContext.Provider>
  );
}
