// ค่าตัวเล่นที่จำไว้ในเครื่อง (localStorage) — ไม่บันทึกลง DB (grill-me 2026-11-20)
export type BibleMusicPrefs = {
  volume: number;
  shuffle: boolean;
  /** ระยะที่ลากตัวเล่นออกจากมุมขวาล่าง (px) */
  offset: { x: number; y: number };
};

const KEY = "bible-music-prefs-v1";
const DEFAULTS: BibleMusicPrefs = {
  volume: 60,
  shuffle: true,
  offset: { x: 0, y: 0 },
};

export function readPrefs(): BibleMusicPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return {
      volume:
        typeof raw.volume === "number"
          ? Math.min(100, Math.max(0, raw.volume))
          : DEFAULTS.volume,
      shuffle:
        typeof raw.shuffle === "boolean" ? raw.shuffle : DEFAULTS.shuffle,
      offset:
        raw.offset &&
        typeof raw.offset.x === "number" &&
        typeof raw.offset.y === "number"
          ? raw.offset
          : DEFAULTS.offset,
    };
  } catch {
    return DEFAULTS;
  }
}

export function writePrefs(prefs: BibleMusicPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // ไม่มี storage ก็ไม่เป็นไร
  }
}
