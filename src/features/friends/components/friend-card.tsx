import { useState } from "react";
import { RotateCcw, ThumbsDown, ThumbsUp, UsersRound } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type FriendCardData = {
  id: string;
  nickName: string;
  fullName: string | null;
  age: number | null;
  interests: string[];
  imageUrl: string | null;
  imageCredit: string | null;
  personality: {
    code: string;
    name: string | null;
    archetype: string | null;
    explain: string | null;
  } | null;
  favoriteFood: string | null;
  dislikedFood: string | null;
};

const MAX_CHIPS = 4;

type FriendCardProps = {
  friend: FriendCardData;
  flipped: boolean;
};

// การ์ดเพื่อน 1 ใบ (grill-me 2026-11-19) — สองหน้า พลิกด้วย rotateY
// หน้า: รูปเต็มใบ, ป้าย MBTI มุมขวาบน, ชื่อเล่น · อายุ, ชื่อจริง, ชิปสิ่งที่สนใจ
// หลัง: รหัส MBTI ตัวใหญ่, description_th, archetype, explain, อาหารที่ชอบ/ไม่ชอบ
// การลาก/แตะ/พลิกจัดการที่ FriendSwipeDeck — คอมโพเนนต์นี้แค่วาด
export function FriendCard({ friend, flipped }: FriendCardProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = !!friend.imageUrl && failedUrl !== friend.imageUrl;
  const extraChips = friend.interests.length - MAX_CHIPS;

  const art = showImage ? (
    <img
      src={friend.imageUrl!}
      alt=""
      draggable={false}
      className="absolute inset-0 size-full object-cover"
      onError={() => setFailedUrl(friend.imageUrl)}
    />
  ) : (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500">
      <UsersRound className="size-28 text-white/40" strokeWidth={1} />
    </div>
  );

  return (
    <div className="size-full" style={{ perspective: "1400px" }}>
      <div
        className="relative size-full transition-transform duration-500 ease-out"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "none",
        }}
      >
        {/* ---------- ด้านหน้า ---------- */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[28px] bg-[#1c1c1f] text-white shadow-xl ring-1 ring-white/10"
          style={{ backfaceVisibility: "hidden" }}
          aria-hidden={flipped}
        >
          {art}

          {friend.personality && (
            <PersonalityBadge personality={friend.personality} />
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-5 pt-20 pb-5">
            <p className="text-3xl leading-tight font-bold">
              {friend.nickName}
              {friend.age !== null && (
                <span className="text-2xl font-normal text-white/80">
                  {" "}
                  · {friend.age}
                </span>
              )}
            </p>
            {friend.fullName && (
              <p className="mt-0.5 truncate text-sm text-white/75">
                {friend.fullName}
              </p>
            )}
            {friend.interests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {friend.interests.slice(0, MAX_CHIPS).map((interest) => (
                  <span
                    key={interest}
                    className="max-w-[10rem] truncate rounded-full bg-white/15 px-2.5 py-0.5 text-xs backdrop-blur-sm ring-1 ring-white/20"
                  >
                    {interest}
                  </span>
                ))}
                {extraChips > 0 && (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/80">
                    +{extraChips}
                  </span>
                )}
              </div>
            )}
            {friend.imageCredit && (
              <p className="mt-2 text-[10px] text-white/50">
                {friend.imageCredit}
              </p>
            )}
          </div>
        </div>

        {/* ---------- ด้านหลัง ---------- */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[28px] bg-[#1c1c1f] text-white shadow-xl ring-1 ring-white/10"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          aria-hidden={!flipped}
        >
          <div className="absolute inset-0 scale-110 blur-xl brightness-[0.35]">
            {art}
          </div>

          <div className="relative flex size-full flex-col p-6">
            <div className="flex items-center justify-between text-sm text-white/80">
              <span className="truncate font-medium">{friend.nickName}</span>
              <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
            </div>

            <div className="flex flex-1 flex-col items-center justify-center text-center">
              {friend.personality ? (
                <>
                  <p className="text-6xl font-black tracking-widest">
                    {friend.personality.code}
                  </p>
                  {friend.personality.name && (
                    <p className="mt-2 text-lg font-semibold">
                      {friend.personality.name}
                    </p>
                  )}
                  {friend.personality.archetype && (
                    <p className="mt-3 text-base text-white/85 italic">
                      “{friend.personality.archetype}”
                    </p>
                  )}
                  {friend.personality.explain && (
                    <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-white/75">
                      {friend.personality.explain}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-white/60">ยังไม่มีข้อมูลบุคลิกภาพ</p>
              )}
            </div>

            {(friend.favoriteFood || friend.dislikedFood) && (
              <div className="space-y-1.5 border-t border-white/15 pt-4 text-sm">
                {friend.favoriteFood && (
                  <div className="flex items-start gap-2">
                    <ThumbsUp className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                    <p className="line-clamp-2">
                      <span className="text-white/70">ชอบกิน: </span>
                      {friend.favoriteFood}
                    </p>
                  </div>
                )}
                {friend.dislikedFood && (
                  <div className="flex items-start gap-2">
                    <ThumbsDown className="mt-0.5 size-4 shrink-0 text-rose-300" />
                    <p className="line-clamp-2">
                      <span className="text-white/70">ไม่ชอบกิน: </span>
                      {friend.dislikedFood}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ป้ายบุคลิกภาพมุมขวาบน: รหัส MBTI + archetype (เพิ่ม 2026-11-19)
// hover (desktop) = tooltip แสดง explain — บนมือถือไม่มี hover ใช้แตะการ์ด
// พลิกไปดู explain ด้านหลังแทน
function PersonalityBadge({
  personality,
}: {
  personality: NonNullable<FriendCardData["personality"]>;
}) {
  const badge = (
    <span className="absolute top-4 right-4 flex max-w-[62%] flex-col items-end rounded-2xl bg-black/45 px-3 py-1.5 text-right backdrop-blur-md ring-1 ring-white/25">
      <span className="text-sm leading-tight font-bold tracking-wider">
        {personality.code}
      </span>
      {personality.archetype && (
        <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/85">
          {personality.archetype}
        </span>
      )}
    </span>
  );

  if (!personality.explain) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="end"
        className="max-w-64 text-xs leading-relaxed"
      >
        {personality.explain}
      </TooltipContent>
    </Tooltip>
  );
}
