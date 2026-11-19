import { type FormEvent, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Loader2,
  Music,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfigDrawer } from "@/components/config-drawer";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { BibleMusicButton } from "@/features/bible-music/components/bible-music-button";
import { TrackAdder } from "@/features/bible-music/components/track-adder";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  type BibleMusicTrack,
  useAddBibleMusicTrack,
  useBibleMusicTracks,
  useCanAddBibleMusic,
  useCanManageBibleMusic,
  useDeleteBibleMusicTrack,
  useSwapBibleMusicOrder,
  useUpdateBibleMusicTrack,
} from "./data/queries";
import {
  fetchYoutubeMeta,
  parseYoutubeId,
  youtubeThumbnail,
} from "./data/youtube";

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: string }).code;
    if (code === "23505") return "มีเพลงนี้ในรายการแล้ว";
    if (code === "42501") return "บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้";
  }
  return error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
}

// หน้า "เพลงตอนอ่านพระคัมภีร์" (/bible-music) — ทุกคนที่ล็อกอินเข้าได้
// (grill-me 2026-11-20): คนมี music:add วางลิงก์ YouTube → ระบบดึง video ID +
// ชื่อเพลงจาก oEmbed ให้ แก้ชื่อเองได้ก่อนบันทึก เพลงขึ้นตัวเล่นทันที
// ทุกคนเห็นรายการทั้งหมด (เพลงที่ปิดแสดงแบบจาง + ป้าย "ปิดอยู่") และชื่อคน
// เพิ่ม ปุ่มเปิด/ปิด เรียงลำดับ ลบ โชว์เฉพาะคนมี music:manage
// ตัวเล่นใช้เฉพาะเพลงที่เปิดอยู่ (is_active)
export function BibleMusic() {
  const { data: tracks, isPending, isError, error } = useBibleMusicTracks();
  const { data: canAdd } = useCanAddBibleMusic();
  const { data: canManage } = useCanManageBibleMusic();

  return (
    <>
      <Header fixed>
        <Search className="me-auto" />
        <BibleMusicButton className="rounded-full" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            เพลงตอนอ่านพระคัมภีร์
          </h2>
          <p className="text-muted-foreground">
            เพลงพื้นหลังของตัวเล่น 🎵 — ช่วยกันเพิ่มเพลงที่ชอบได้เลย
            แนะนำเพลงบรรเลงที่ไม่มีเนื้อร้อง เพิ่มแล้วแก้หรือลบเองไม่ได้
            ถ้าเพิ่มผิดแจ้งแอดมินได้
          </p>
        </div>

        {canAdd && <AddTrackForm nextSortOrder={nextSortOrder(tracks)} />}

        {isError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>โหลดรายการเพลงไม่สำเร็จ</AlertTitle>
            <AlertDescription>{errorMessage(error)}</AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Music className="size-4" />
                {isPending
                  ? "กำลังโหลด..."
                  : `รายการเพลง — ${tracks.length} เพลง (เปิดอยู่ ${tracks.filter((t) => t.is_active).length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <div className="space-y-2">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : tracks.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  ยังไม่มีเพลง — วางลิงก์ YouTube ด้านบนเพื่อเพิ่มเพลงแรก
                </p>
              ) : (
                <ul className="divide-y">
                  {tracks.map((track, index) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      prev={tracks[index - 1]}
                      next={tracks[index + 1]}
                      canManage={canManage === true}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </Main>
    </>
  );
}

function nextSortOrder(tracks: BibleMusicTrack[] | undefined) {
  if (!tracks || tracks.length === 0) return 0;
  return Math.max(...tracks.map((t) => t.sort_order)) + 1;
}

function AddTrackForm({ nextSortOrder }: { nextSortOrder: number }) {
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [fetching, setFetching] = useState(false);
  const addTrack = useAddBibleMusicTrack();

  const youtubeId = parseYoutubeId(link);
  const linkInvalid = link.trim() !== "" && !youtubeId;

  // วางลิงก์แล้วดึงชื่อเพลง/ช่องให้อัตโนมัติ (ไม่ทับถ้าพิมพ์ชื่อไว้แล้ว) —
  // ทำใน onChange แทน effect; requestedId กันผลของลิงก์เก่าที่ตอบกลับช้า
  const requestedId = useRef<string | null>(null);
  const onLinkChange = (value: string) => {
    setLink(value);
    const id = parseYoutubeId(value);
    if (!id || id === requestedId.current) return;
    requestedId.current = id;
    setFetching(true);
    fetchYoutubeMeta(id)
      .then((meta) => {
        if (requestedId.current !== id || !meta) return;
        setTitle((current) => current || meta.title);
        setArtist((current) => current || meta.author || "");
      })
      .finally(() => {
        if (requestedId.current === id) setFetching(false);
      });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!youtubeId || !title.trim()) return;
    addTrack.mutate(
      {
        youtube_id: youtubeId,
        title: title.trim(),
        artist: artist.trim() || null,
        sort_order: nextSortOrder,
      },
      {
        onSuccess: () => {
          toast.success(`เพิ่ม "${title.trim()}" แล้ว`);
          setLink("");
          requestedId.current = null;
          setTitle("");
          setArtist("");
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">เพิ่มเพลง</CardTitle>
        <CardDescription>
          รองรับลิงก์ youtube.com/watch, youtu.be, shorts และ YouTube Music
          (ทีละเพลง)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          className="grid gap-4 md:grid-cols-[auto_1fr]"
        >
          <div className="bg-muted hidden aspect-video w-48 overflow-hidden rounded-md md:block">
            {youtubeId && (
              <img
                src={youtubeThumbnail(youtubeId)}
                alt=""
                className="size-full object-cover"
              />
            )}
          </div>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="bible-music-link">ลิงก์ YouTube</Label>
              <Input
                id="bible-music-link"
                placeholder="https://www.youtube.com/watch?v=..."
                value={link}
                onChange={(e) => onLinkChange(e.target.value)}
                aria-invalid={linkInvalid}
              />
              {linkInvalid && (
                <p className="text-destructive text-xs">
                  ไม่พบ video ID ในลิงก์นี้
                </p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="bible-music-title">
                  ชื่อเพลง{" "}
                  {fetching && (
                    <Loader2 className="inline size-3 animate-spin" />
                  )}
                </Label>
                <Input
                  id="bible-music-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="bible-music-artist">ศิลปิน / ช่อง</Label>
                <Input
                  id="bible-music-artist"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Button
                type="submit"
                disabled={!youtubeId || !title.trim() || addTrack.isPending}
              >
                {addTrack.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Plus />
                )}
                เพิ่มเพลง
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function TrackRow({
  track,
  prev,
  next,
  canManage,
}: {
  track: BibleMusicTrack;
  prev?: BibleMusicTrack;
  next?: BibleMusicTrack;
  canManage: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const update = useUpdateBibleMusicTrack();
  const swap = useSwapBibleMusicOrder();
  const remove = useDeleteBibleMusicTrack();

  // ลำดับซ้ำกัน (เช่นเพิ่มพร้อมกัน) — สลับด้วยตำแหน่งในรายการแทนค่าเดิม
  const move = (other: BibleMusicTrack, direction: -1 | 1) => {
    const sameOrder = other.sort_order === track.sort_order;
    swap.mutate(
      {
        a: { id: track.id, sort_order: track.sort_order },
        b: {
          id: other.id,
          sort_order: sameOrder
            ? track.sort_order + direction
            : other.sort_order,
        },
      },
      { onError: (error) => toast.error(errorMessage(error)) },
    );
  };

  return (
    <li className="flex items-center gap-3 py-3">
      <a
        href={`https://www.youtube.com/watch?v=${track.youtube_id}`}
        target="_blank"
        rel="noreferrer"
        className="bg-muted aspect-video w-24 shrink-0 overflow-hidden rounded"
      >
        <img
          src={youtubeThumbnail(track.youtube_id)}
          alt=""
          loading="lazy"
          className="size-full object-cover"
        />
      </a>
      <div
        className={
          track.is_active ? "min-w-0 flex-1" : "min-w-0 flex-1 opacity-60"
        }
      >
        <div className="flex items-center gap-2">
          <p
            className={
              track.is_active
                ? "truncate font-medium"
                : "text-muted-foreground truncate font-medium line-through"
            }
          >
            {track.title}
          </p>
          {!track.is_active && (
            <Badge variant="secondary" className="shrink-0">
              ปิดอยู่
            </Badge>
          )}
        </div>
        {track.artist && (
          <p className="text-muted-foreground truncate text-xs">
            {track.artist}
          </p>
        )}
        <TrackAdder adder={track.adder} className="mt-1" />
      </div>
      {canManage && (
        <div className="flex shrink-0 items-center gap-1">
          <Switch
            checked={track.is_active}
            aria-label={track.is_active ? "ปิดเพลงนี้" : "เปิดเพลงนี้"}
            onCheckedChange={(checked) =>
              update.mutate(
                { id: track.id, is_active: checked },
                { onError: (error) => toast.error(errorMessage(error)) },
              )
            }
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label="เลื่อนขึ้น"
            disabled={!prev || swap.isPending}
            onClick={() => prev && move(prev, -1)}
          >
            <ArrowUp />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="เลื่อนลง"
            disabled={!next || swap.isPending}
            onClick={() => next && move(next, 1)}
          >
            <ArrowDown />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            aria-label="ลบเพลง"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 />
          </Button>
        </div>
      )}
      {canManage && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="ลบเพลงนี้?"
          desc={`"${track.title}" จะถูกลบออกจากรายการเพลงตอนอ่านพระคัมภีร์ (ถ้าแค่ไม่อยากให้เล่นชั่วคราว ใช้สวิตช์ปิดแทนได้)`}
          destructive
          confirmText="ลบ"
          isLoading={remove.isPending}
          handleConfirm={() =>
            remove.mutate(track.id, {
              onSuccess: () => setConfirmDelete(false),
              onError: (error) => toast.error(errorMessage(error)),
            })
          }
        />
      )}
    </li>
  );
}
