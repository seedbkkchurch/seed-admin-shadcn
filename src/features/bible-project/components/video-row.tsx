import { Play } from "lucide-react";
import { type BibleProjectVideo, youtubeThumbnailUrl } from "../data/videos";

// แถววิดีโอ — รูปปก YouTube 16:9 + ปุ่ม ▶ ซ้อน แทนวงกลมเทาแบบเว็บต้นทาง
// (grill-me 2026-11-19)
export function VideoRow({
  video,
  onPlay,
}: {
  video: BibleProjectVideo;
  onPlay: (video: BibleProjectVideo) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPlay(video)}
      className="group hover:bg-muted/60 flex w-full items-center gap-3 rounded-xl p-2 text-start transition-colors sm:gap-4"
    >
      <div className="bg-muted relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg sm:w-40">
        <img
          src={youtubeThumbnailUrl(video.youtubeId)}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute inset-0 grid place-items-center bg-black/10 transition-colors group-hover:bg-black/25">
          <span className="grid size-8 place-items-center rounded-full bg-white/90 text-black shadow sm:size-10">
            <Play className="ms-0.5 size-4 fill-current sm:size-5" />
          </span>
        </span>
      </div>
      <div className="min-w-0">
        <p className="leading-snug font-semibold">{video.title}</p>
        <p className="text-muted-foreground text-sm">{video.titleEn}</p>
      </div>
    </button>
  );
}
