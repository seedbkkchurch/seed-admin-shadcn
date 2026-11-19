import { useMemo, useState } from "react";
import { ChevronDown, Search as SearchIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { BibleProjectCredit, BibleProjectHero } from "./components/hero";
import { VideoPlayerDialog } from "./components/video-player-dialog";
import { VideoRow } from "./components/video-row";
import {
  BIBLE_PROJECT_SECTIONS,
  type BibleProjectSection,
  type BibleProjectVideo,
  youtubeThumbnailUrl,
} from "./data/videos";

// หน้า "Bible Project" — วิดีโอ BibleProject ภาษาไทยทุกหมวด เลย์เอาต์ตาม
// bibleproject.com/th/#videos: หัวข้อหมวดใหญ่ (รูป + ชื่อ + จำนวนวิดีโอ)
// พับ/กางได้ → คำอธิบาย → รายการวิดีโอ (grill-me 2026-11-19)
// - เปิดครั้งแรกกางแค่หมวดพันธสัญญาเดิม กางพร้อมกันได้หลายหมวด
// - ค้นหาได้ทั้งไทย/อังกฤษ ระหว่างค้นหากางหมวดที่มีผลลัพธ์ให้อัตโนมัติ
// - ไม่เก็บว่าใครดูอะไรไปแล้ว
const DEFAULT_OPEN = ["ot-overviews"];

const TOTAL_VIDEOS = BIBLE_PROJECT_SECTIONS.reduce(
  (sum, s) => sum + s.videos.length,
  0,
);

function matches(text: string, query: string) {
  return text.toLowerCase().includes(query);
}

function filterSections(query: string): BibleProjectSection[] {
  const q = query.trim().toLowerCase();
  if (!q) return BIBLE_PROJECT_SECTIONS;
  return BIBLE_PROJECT_SECTIONS.flatMap((section) => {
    // ค้นเจอชื่อหมวด → แสดงทั้งหมวด
    if (matches(section.title, q) || matches(section.titleEn, q)) {
      return [section];
    }
    const videos = section.videos.filter(
      (video) => matches(video.title, q) || matches(video.titleEn, q),
    );
    return videos.length ? [{ ...section, videos }] : [];
  });
}

export function BibleProject() {
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState<string[]>(DEFAULT_OPEN);
  const [playing, setPlaying] = useState<BibleProjectVideo | null>(null);

  const isSearching = query.trim().length > 0;
  const sections = useMemo(() => filterSections(query), [query]);

  const toggle = (id: string, open: boolean) =>
    setOpenIds((prev) =>
      open ? [...prev, id] : prev.filter((existing) => existing !== id),
    );

  return (
    <>
      <Header fixed>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <BibleProjectHero
          subtitle={`วิดีโอแอนิเมชันจาก BibleProject ภาษาไทย ${TOTAL_VIDEOS} วิดีโอ`}
        />

        <div className="relative mx-auto w-full max-w-2xl">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาวิดีโอ เช่น โรม หรือ Romans"
            className="h-12 rounded-full ps-12 pe-12 text-base md:text-lg"
            aria-label="ค้นหาวิดีโอ"
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-1.5"
              aria-label="ล้างคำค้นหา"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        {sections.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center">
            ไม่พบวิดีโอที่ตรงกับ “{query.trim()}”
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {sections.map((section) => {
              const open = isSearching || openIds.includes(section.id);
              const cover = section.videos[0]?.youtubeId;
              return (
                <Collapsible
                  key={section.id}
                  open={open}
                  onOpenChange={(next) => toggle(section.id, next)}
                  className="border-b pb-2 last:border-b-0"
                >
                  <CollapsibleTrigger
                    disabled={isSearching}
                    className="hover:bg-muted/40 flex w-full items-center gap-4 rounded-xl p-2 text-start transition-colors disabled:cursor-default"
                  >
                    <div className="bg-muted aspect-[3/2] w-24 shrink-0 overflow-hidden rounded-2xl sm:w-40">
                      {cover && (
                        <img
                          src={youtubeThumbnailUrl(cover, "mq")}
                          alt=""
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg leading-snug font-bold sm:text-xl">
                        {section.title}{" "}
                        <span className="font-normal">- {section.titleEn}</span>
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {section.videos.length} วิดีโอ
                      </p>
                    </div>
                    {!isSearching && (
                      <ChevronDown
                        className={cn(
                          "text-muted-foreground size-5 shrink-0 transition-transform",
                          open && "rotate-180",
                        )}
                      />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="flex flex-col gap-1 pt-2 sm:ps-8">
                      {!isSearching && (
                        <p className="text-muted-foreground mb-2 max-w-2xl px-2 text-sm sm:text-base">
                          {section.description}
                        </p>
                      )}
                      {section.videos.map((video) => (
                        <VideoRow
                          key={video.youtubeId}
                          video={video}
                          onPlay={setPlaying}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
        <BibleProjectCredit />
      </Main>

      <VideoPlayerDialog
        videos={playing ? [playing] : []}
        open={playing !== null}
        onOpenChange={(next) => {
          if (!next) setPlaying(null);
        }}
      />
    </>
  );
}
