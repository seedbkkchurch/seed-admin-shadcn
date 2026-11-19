import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "@tanstack/react-router";
import {
  GripHorizontal,
  ListMusic,
  ListPlus,
  Loader2,
  Pause,
  Play,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { BibleMusicTrack } from "../data/queries";
import { type BibleMusicPrefs, readPrefs, writePrefs } from "../lib/prefs";
import { loadYouTubeIframeApi, type YTPlayer } from "../lib/youtube-iframe-api";
import { TrackAdder } from "./track-adder";

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const PLAYING = 1;
const PAUSED = 2;
const ENDED = 0;

type BibleMusicPlayerProps = {
  tracks: BibleMusicTrack[];
  onClose: () => void;
  /** สถานะเล่น/หยุด เก็บใน BibleMusicProvider ให้ปุ่ม 🎵 รู้ด้วย */
  playing: boolean;
  setPlaying: (playing: boolean) => void;
};

// Mini player ลอยมุมขวาล่าง (grill-me 2026-11-20):
// - วิดีโอ YouTube (youtube-nocookie) ต้องมองเห็นได้อย่างน้อย 200×200 ตาม
//   เงื่อนไข YouTube — ตัวเล่นกว้าง 240 ส่วนวิดีโอสูง 200
// - เริ่มที่เพลงสุ่ม จบเพลงเล่นเพลงถัดไปเอง ครบแล้ววนกลับ ปุ่ม 🔀 สลับโหมด
//   สุ่มลำดับ (ค่าเริ่มต้นเปิด) ปุ่ม ☰ เลือกเพลงเอง
// - ลากที่แถบด้านบนเพื่อย้าย (ดับเบิลคลิกแถบ = กลับมุมขวาล่าง)
// - ความดัง/โหมดสุ่ม/ตำแหน่ง จำใน localStorage
// - วิดีโอที่ฝังไม่ได้ (เจ้าของปิด embed) ข้ามไปเพลงถัดไปเอง
export function BibleMusicPlayer({
  tracks,
  onClose,
  playing,
  setPlaying,
}: BibleMusicPlayerProps) {
  const [prefs, setPrefs] = useState<BibleMusicPrefs>(readPrefs);
  useEffect(() => writePrefs(prefs), [prefs]);

  // ลำดับเล่น (เก็บเป็น id) + ตำแหน่งปัจจุบันในลำดับ
  const [queueState, setQueueState] = useState(() => {
    const ids = tracks.map((t) => t.id);
    return prefs.shuffle
      ? { order: shuffled(ids), pos: 0 }
      : { order: ids, pos: Math.floor(Math.random() * ids.length) };
  });

  const byId = useMemo(
    () => new Map(tracks.map((track) => [track.id, track])),
    [tracks],
  );
  // แอดมินแก้รายการระหว่างเปิดอยู่: ตัดเพลงที่หายไป ต่อท้ายเพลงใหม่
  const queue = useMemo(() => {
    const kept = queueState.order.filter((id) => byId.has(id));
    const added = tracks
      .map((t) => t.id)
      .filter((id) => !queueState.order.includes(id));
    return [...kept, ...added];
  }, [queueState.order, byId, tracks]);
  const pos = queue.length ? queueState.pos % queue.length : 0;
  const current = byId.get(queue[pos]) ?? tracks[0];

  const goTo = useCallback(
    (nextPos: number) =>
      setQueueState({
        order: queue,
        pos: ((nextPos % queue.length) + queue.length) % queue.length,
      }),
    [queue],
  );
  const goNext = useCallback(() => goTo(pos + 1), [goTo, pos]);
  const goPrev = useCallback(() => goTo(pos - 1), [goTo, pos]);

  const playTrack = (id: string) => {
    const index = queue.indexOf(id);
    if (index >= 0) goTo(index);
  };

  const toggleShuffle = () => {
    const nextShuffle = !prefs.shuffle;
    setPrefs((p) => ({ ...p, shuffle: nextShuffle }));
    if (nextShuffle) {
      const others = queue.filter((id) => id !== current.id);
      setQueueState({ order: [current.id, ...shuffled(others)], pos: 0 });
    } else {
      const natural = tracks.map((t) => t.id);
      setQueueState({
        order: natural,
        pos: Math.max(0, natural.indexOf(current.id)),
      });
    }
  };

  // ---------- YouTube player ----------
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const loadedIdRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const errorStreak = useRef(0);

  // อ่านค่าล่าสุดใน callback ของ YouTube โดยไม่ต้องสร้าง player ใหม่
  const latest = useRef({
    goNext,
    current,
    volume: prefs.volume,
    trackCount: tracks.length,
    setPlaying,
    offset: prefs.offset,
  });
  useEffect(() => {
    latest.current = {
      goNext,
      current,
      volume: prefs.volume,
      trackCount: tracks.length,
      setPlaying,
      offset: prefs.offset,
    };
  });

  useEffect(() => {
    let cancelled = false;
    let player: YTPlayer | null = null;

    loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled || !hostRef.current) return;
        const mount = document.createElement("div");
        hostRef.current.appendChild(mount);
        const firstId = latest.current.current.youtube_id;
        loadedIdRef.current = firstId;
        player = new YT.Player(mount, {
          host: "https://www.youtube-nocookie.com",
          videoId: firstId,
          width: "100%",
          height: "100%",
          playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
          events: {
            onReady: (event) => {
              event.target.setVolume(latest.current.volume);
              event.target.playVideo();
              setReady(true);
            },
            onStateChange: (event) => {
              if (event.data === PLAYING) {
                errorStreak.current = 0;
                latest.current.setPlaying(true);
              } else if (event.data === PAUSED) {
                latest.current.setPlaying(false);
              } else if (event.data === ENDED) {
                latest.current.setPlaying(false);
                latest.current.goNext();
              }
            },
            onError: () => {
              errorStreak.current += 1;
              latest.current.setPlaying(false);
              // ทุกเพลงเล่นไม่ได้ — หยุด ไม่วนข้ามไม่รู้จบ
              if (errorStreak.current >= latest.current.trackCount) {
                toast.error("เล่นเพลงไม่ได้ ลองใหม่ภายหลัง");
                return;
              }
              toast.message(
                `"${latest.current.current.title}" เล่นนอก YouTube ไม่ได้ — ข้ามไปเพลงถัดไป`,
              );
              latest.current.goNext();
            },
          },
        });
        playerRef.current = player;
      })
      .catch((error: Error) => toast.error(error.message));

    return () => {
      cancelled = true;
      playerRef.current = null;
      player?.destroy();
    };
  }, []);

  // เปลี่ยนเพลง
  useEffect(() => {
    if (!ready || !playerRef.current) return;
    if (loadedIdRef.current === current.youtube_id) return;
    loadedIdRef.current = current.youtube_id;
    playerRef.current.loadVideoById(current.youtube_id);
  }, [ready, current.youtube_id]);

  // ความดัง
  useEffect(() => {
    if (ready) playerRef.current?.setVolume(prefs.volume);
  }, [ready, prefs.volume]);

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    if (playing) player.pauseVideo();
    else player.playVideo();
  };

  // ---------- ลากย้ายตำแหน่ง ----------
  const panelRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    id: number;
    startX: number;
    startY: number;
    ox: number;
    oy: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null>(null);

  const onHandleDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    const { x: ox, y: oy } = prefs.offset;
    const margin = 8;
    drag.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      ox,
      oy,
      minX: ox - rect.left + margin,
      maxX: ox + (window.innerWidth - rect.right) - margin,
      minY: oy - rect.top + margin,
      maxY: oy + (window.innerHeight - rect.bottom) - margin,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onHandleMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    const x = Math.min(
      d.maxX,
      Math.max(d.minX, d.ox + event.clientX - d.startX),
    );
    const y = Math.min(
      d.maxY,
      Math.max(d.minY, d.oy + event.clientY - d.startY),
    );
    setPrefs((p) => ({ ...p, offset: { x, y } }));
  };

  const onHandleUp = () => {
    drag.current = null;
  };

  // ดึงกล่องตัวเล่นกลับเข้าจอเสมอ (2026-11-20 "ให้มันแสดงเป็น popup เล็ก ๆ
  // แบบเดิม") — ตำแหน่งที่ลากไว้จำใน localStorage ใช้ร่วมกันทุกขนาดจอของ
  // เบราว์เซอร์เดียวกัน ลากไว้ไกล ๆ บนจอคอมแล้วมาเปิดจอแคบ (มือถือ/โหมด
  // responsive/หมุนจอ) กล่องจะหลุดออกนอกจอทั้งที่เพลงเล่นอยู่ — เช็คตอนเปิด
  // ตัวเล่นและทุกครั้งที่ขนาดจอเปลี่ยน ถ้ากล่องใหญ่กว่าจอให้ชิดซ้าย/บนไว้
  // (แถบลากกับปุ่ม ✕ ต้องเห็น) คำนวณเป็นค่า offset ตรง ๆ ไม่ใช่บวกเพิ่ม
  // resize หลายครั้งก่อน render ก็ได้ค่าเดิม
  useEffect(() => {
    const keepInView = () => {
      const el = panelRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const { x: ox, y: oy } = latest.current.offset;
      const margin = 8;
      const left = rect.left - ox;
      const top = rect.top - oy;
      const minX = margin - left;
      const maxX = window.innerWidth - margin - (left + rect.width);
      const minY = margin - top;
      const maxY = window.innerHeight - margin - (top + rect.height);
      const x = Math.max(minX, Math.min(maxX, ox));
      const y = Math.max(minY, Math.min(maxY, oy));
      if (x !== ox || y !== oy) {
        setPrefs((p) => ({ ...p, offset: { x, y } }));
      }
    };
    const frame = requestAnimationFrame(keepInView);
    window.addEventListener("resize", keepInView);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", keepInView);
    };
  }, []);

  return (
    <div
      ref={panelRef}
      role="region"
      aria-label="ตัวเล่นเพลงพื้นหลัง"
      className="bg-background fixed right-4 bottom-[calc(var(--mobile-tab-bar-height)+4.5rem)] z-[60] w-[240px] overflow-hidden rounded-xl border shadow-2xl md:bottom-4"
      style={{
        transform: `translate(${prefs.offset.x}px, ${prefs.offset.y}px)`,
      }}
    >
      {/* แถบลาก */}
      <div
        className="text-muted-foreground flex h-7 cursor-grab touch-none items-center justify-between px-2 select-none active:cursor-grabbing"
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onPointerUp={onHandleUp}
        onPointerCancel={onHandleUp}
        onDoubleClick={() =>
          setPrefs((p) => ({ ...p, offset: { x: 0, y: 0 } }))
        }
        title="ลากเพื่อย้าย · ดับเบิลคลิกเพื่อกลับมุมขวาล่าง"
      >
        <GripHorizontal className="size-4" />
        <span className="text-[11px]">เพลงพื้นหลัง</span>
        <button
          type="button"
          className="hover:text-foreground rounded p-0.5"
          aria-label="ปิดตัวเล่นเพลง"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
        >
          <X className="size-4" />
        </button>
      </div>

      {/* วิดีโอ YouTube (≥ 200×200) */}
      <div className="relative h-[200px] w-full bg-black">
        <div ref={hostRef} className="absolute inset-0 [&>iframe]:size-full" />
        {!ready && (
          <Loader2 className="absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2 animate-spin text-white/70" />
        )}
      </div>

      <div className="space-y-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" title={current.title}>
            {current.title}
          </p>
          {current.artist && (
            <p className="text-muted-foreground truncate text-xs">
              {current.artist}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "size-8",
              prefs.shuffle && "text-violet-600 dark:text-violet-400",
            )}
            aria-label={prefs.shuffle ? "ปิดสุ่มลำดับ" : "เปิดสุ่มลำดับ"}
            aria-pressed={prefs.shuffle}
            onClick={toggleShuffle}
          >
            <Shuffle className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="เพลงก่อนหน้า"
            onClick={goPrev}
          >
            <SkipBack className="size-4" />
          </Button>
          <Button
            size="icon"
            className="size-9 rounded-full"
            aria-label={playing ? "หยุดชั่วคราว" : "เล่น"}
            disabled={!ready}
            onClick={togglePlay}
          >
            {playing ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="เพลงถัดไป"
            onClick={goNext}
          >
            <SkipForward className="size-4" />
          </Button>
          <Popover open={listOpen} onOpenChange={setListOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="รายการเพลง"
              >
                <ListMusic className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              className="z-[70] max-h-72 w-64 overflow-y-auto p-1"
            >
              <ul>
                {tracks.map((track) => (
                  <li key={track.id}>
                    <button
                      type="button"
                      className={cn(
                        "hover:bg-accent w-full rounded px-2 py-1.5 text-left",
                        track.id === current.id && "bg-accent",
                      )}
                      onClick={() => playTrack(track.id)}
                    >
                      <span className="block truncate text-sm">
                        {track.title}
                      </span>
                      {track.artist && (
                        <span className="text-muted-foreground block truncate text-xs">
                          {track.artist}
                        </span>
                      )}
                      <TrackAdder adder={track.adder} className="mt-0.5" />
                    </button>
                  </li>
                ))}
              </ul>
              {/* ทุกคนไปหน้ารายการเพลงได้ — เพิ่มเพลงเอง (music:add) หรือ
                  จัดการ (music:manage) grill-me 2026-11-20 */}
              <div className="mt-1 border-t pt-1">
                <Link
                  to="/bible-music"
                  onClick={() => setListOpen(false)}
                  className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-2 rounded px-2 py-1.5 text-sm"
                >
                  <ListPlus className="size-4" />
                  เพิ่ม / จัดการเพลง
                </Link>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <label className="flex items-center gap-2">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            aria-label={prefs.volume === 0 ? "เปิดเสียง" : "ปิดเสียง"}
            onClick={() =>
              setPrefs((p) => ({ ...p, volume: p.volume === 0 ? 60 : 0 }))
            }
          >
            {prefs.volume === 0 ? (
              <VolumeX className="size-4" />
            ) : (
              <Volume2 className="size-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={prefs.volume}
            aria-label="ความดัง"
            className="accent-primary h-1 flex-1"
            onChange={(e) =>
              setPrefs((p) => ({ ...p, volume: Number(e.target.value) }))
            }
          />
        </label>
      </div>
    </div>
  );
}
