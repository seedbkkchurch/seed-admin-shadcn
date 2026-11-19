import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useInterestPhotos } from "@/features/birthdays/data/interest-photo";
import { useMyLamb } from "@/hooks/use-my-lamb";
import type { FriendCardData } from "./components/friend-card";
import { FriendSwipeDeck } from "./components/friend-swipe-deck";
import { useFriendLambs } from "./data/queries";
import {
  ageFromBirthday,
  profilePhotoUrl,
  seededShuffle,
  splitInterests,
} from "./lib/friend-utils";

// หน้า "รู้จักเพื่อน" (/friends) — grill-me 2026-11-19:
// - การ์ดสมาชิกทุกคนที่ยังอยู่ (status = true) ยกเว้นตัวเอง ปัดทีละใบแบบ Tinder
// - สุ่มลำดับใหม่ทุกครั้งที่เปิดหน้า (seed คงที่ระหว่างอยู่ในหน้า refetch แล้ว
//   ไม่สลับ) ใบสุดท้ายมีปุ่ม "สุ่มใหม่อีกรอบ"
// - ไม่มีรูปโปรไฟล์ = รูปจาก Pexels ตามสิ่งที่สนใจ (ใช้ useInterestPhotos ตัว
//   เดียวกับการ์ดวันเกิด)
// - ทุก role เปิดได้ (รวม visitor) แตะการ์ดไม่พาไปหน้าโปรไฟล์ เพราะ
//   member/visitor เปิดโปรไฟล์คนอื่นไม่ได้
export function Friends() {
  const { data: lambs, isPending, isError, error } = useFriendLambs();
  const { data: myLamb } = useMyLamb();
  const [seed, setSeed] = useState(() => Math.random());

  const others = useMemo(
    () => (lambs ?? []).filter((lamb) => lamb.id !== myLamb?.id),
    [lambs, myLamb?.id],
  );

  const photos = useInterestPhotos(
    useMemo(
      () => others.filter((lamb) => !profilePhotoUrl(lamb.profile_picture)),
      [others],
    ),
  );

  const today = useMemo(() => new Date(), []);

  const friends = useMemo<FriendCardData[]>(() => {
    const cards = others.map((lamb) => {
      const fullName =
        [lamb.first_name, lamb.last_name].filter(Boolean).join(" ") || null;
      const profilePhoto = profilePhotoUrl(lamb.profile_picture);
      const interestPhoto = profilePhoto ? undefined : photos.get(lamb.id);
      const personality = lamb.personality_type;

      return {
        id: lamb.id,
        nickName: lamb.nick_name?.trim() || fullName || "-",
        fullName: lamb.nick_name?.trim() ? fullName : null,
        age: ageFromBirthday(lamb.birthday, today),
        interests: splitInterests(lamb.interesting),
        imageUrl: profilePhoto ?? interestPhoto?.imageUrl ?? null,
        imageCredit: interestPhoto
          ? `ภาพ: ${interestPhoto.photographer} / Pexels`
          : null,
        personality: personality?.code
          ? {
              code: personality.code,
              name: personality.description_th,
              archetype: personality.archetype,
              explain: personality.explain,
            }
          : null,
        favoriteFood: lamb.favorite_food?.trim() || null,
        dislikedFood: lamb.unfavorite_food?.trim() || null,
      } satisfies FriendCardData;
    });
    // เรียงตาม id ก่อนสุ่ม ให้ผลสุ่มขึ้นกับ seed อย่างเดียว ไม่ขึ้นกับลำดับที่ DB ส่งมา
    cards.sort((a, b) => a.id.localeCompare(b.id));
    return seededShuffle(cards, seed);
  }, [others, photos, today, seed]);

  return (
    <>
      <Header fixed>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">รู้จักเพื่อน</h2>
          <p className="text-muted-foreground">
            ทำความรู้จักพี่น้องในโบสถ์ทีละคน — ชื่อเล่น อายุ สิ่งที่สนใจ
            และบุคลิกภาพ
          </p>
        </div>

        {isError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>โหลดข้อมูลไม่สำเร็จ</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Something went wrong."}
            </AlertDescription>
          </Alert>
        ) : isPending ? (
          <Skeleton className="mx-auto aspect-[4/5] w-[min(480px,92vw,calc((100dvh_-_260px)_*_0.8))] rounded-[28px]" />
        ) : friends.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">
            ยังไม่มีสมาชิกให้แสดง
          </p>
        ) : (
          <div className="py-2">
            <FriendSwipeDeck
              // สุ่มใหม่ = เริ่มกองใหม่จากใบแรก
              key={seed}
              friends={friends}
              onReshuffle={() => setSeed(Math.random())}
            />
          </div>
        )}
      </Main>
    </>
  );
}
