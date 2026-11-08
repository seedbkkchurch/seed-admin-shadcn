import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useIsSuperAdmin } from "@/features/user-roles/data/queries";
import { useMyLamb } from "@/hooks/use-my-lamb";
import { useUpdateLambDevotion } from "../data/queries";
import { ensureDevotionOgCard, shouldUseOgCard } from "../lib/og-card";

type Props = {
  entry: {
    id: string;
    lamb_id: string;
    is_public: boolean;
    image_urls: string[];
    use_card_og: boolean | null;
    og_card_url: string | null;
  };
};

// checkbox "ใช้การ์ดเฝ้าเดี่ยวเป็นรูปพรีวิวลิงก์" บนหน้ารายละเอียดเฝ้าเดี่ยว
// (grill-me 2026-11-08) — เห็นเฉพาะเจ้าของ + super_admin และเฉพาะรายการ
// public (รายการส่วนตัวแชร์ลิงก์ไม่ได้อยู่แล้ว)
// - ค่าเริ่มต้น: ติ๊กไว้ถ้าไม่มีรูป (แทนรูปแมว), ไม่ติ๊กถ้ามีรูปของตัวเอง
// - เจ้าของเปิดหน้านี้แล้วรายการควรมีการ์ดแต่ยังไม่มี → สร้างให้เงียบๆ
//   (เฝ้าเดี่ยวเก่าก่อนมีฟีเจอร์นี้จะได้การ์ดตอนเจ้าของเปิดดู)
export function DevotionOgCardOption({ entry }: Props) {
  const queryClient = useQueryClient();
  const { data: myLamb } = useMyLamb();
  const { data: isSuperAdmin } = useIsSuperAdmin();
  const updateDevotion = useUpdateLambDevotion();
  const [generating, setGenerating] = useState(false);
  const autoStarted = useRef(false);

  const canManage = myLamb?.id === entry.lamb_id || isSuperAdmin === true;
  const checked = shouldUseOgCard(entry);

  const generate = async (force: boolean) => {
    setGenerating(true);
    try {
      await ensureDevotionOgCard(entry.id, { force });
      await queryClient.invalidateQueries({ queryKey: ["lamb-devotion"] });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (!canManage || autoStarted.current) return;
    if (!entry.is_public || !checked || entry.og_card_url) return;
    // เลื่อนไป tick ถัดไป (ไม่ setState ตรงๆ ใน effect) และตั้ง flag ใน
    // callback เพื่อให้ StrictMode ที่รัน effect 2 รอบยังสร้างได้ครั้งเดียว
    const timer = setTimeout(() => {
      if (autoStarted.current) return;
      autoStarted.current = true;
      generate(false).catch(() => undefined);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage, entry.is_public, checked, entry.og_card_url]);

  if (!canManage || !entry.is_public) return null;

  const handleChange = (value: boolean) => {
    updateDevotion.mutate(
      { id: entry.id, values: { use_card_og: value } },
      {
        onSuccess: () => {
          if (value) {
            generate(false).catch(() =>
              toast.error("สร้างการ์ดพรีวิวไม่สำเร็จ ลองใหม่อีกครั้ง"),
            );
          }
        },
        onError: () => toast.error("บันทึกไม่สำเร็จ"),
      },
    );
  };

  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2">
      <Checkbox
        id="use-card-og"
        checked={checked}
        disabled={updateDevotion.isPending || generating}
        onCheckedChange={(v) => handleChange(v === true)}
      />
      <Label htmlFor="use-card-og" className="text-sm font-normal">
        ใช้การ์ดเฝ้าเดี่ยวเป็นรูปพรีวิวตอนแชร์ลิงก์
      </Label>
      {generating ? (
        <Loader2 className="text-muted-foreground size-4 animate-spin" />
      ) : (
        checked &&
        entry.og_card_url && (
          <a
            href={entry.og_card_url}
            target="_blank"
            rel="noreferrer"
            title="ดูรูปพรีวิว"
          >
            <img
              src={entry.og_card_url}
              alt="รูปพรีวิวลิงก์"
              className="size-9 rounded border object-cover"
            />
          </a>
        )
      )}
    </div>
  );
}
