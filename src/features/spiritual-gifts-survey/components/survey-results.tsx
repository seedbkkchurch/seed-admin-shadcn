import { useMemo } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  GIFT_SCORE_MAX,
  type GiftScores,
} from "@/features/lamb-info/data/gifts";
import { GIFT_SCORING } from "../data/scoring";

type SurveyResultsProps = {
  scores: GiftScores;
  onRetake: () => void;
};

// หน้าสรุปผลหลังส่งแบบสำรวจสำเร็จ — เรียงของประทานมากไปน้อยตามคะแนน (0-15)
// แต่ละชื่อคลิก/แตะแล้วเปิด popover โชว์รูปคำอธิบาย (ตกลงใน grill-me
// 2026-08-25 — popover อยู่ที่หน้านี้เท่านั้น ไม่โชว์ระหว่างทำแบบสำรวจ กัน
// คนตอบเดาว่าข้อไหนคือของประทานอะไรแล้วตอบเอนเอียง)
export function SurveyResults({ scores, onRetake }: SurveyResultsProps) {
  const ranked = useMemo(
    () =>
      [...GIFT_SCORING].sort(
        (a, b) => (scores[b.column] ?? 0) - (scores[a.column] ?? 0),
      ),
    [scores],
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        ผลของประทานฝ่ายวิญญาณของคุณ เรียงจากมากไปน้อย —
        แตะชื่อของประทานเพื่อดูคำอธิบาย
      </p>

      <div className="space-y-2">
        {ranked.map((gift, i) => {
          const score = scores[gift.column] ?? 0;
          const percent = Math.round((score / GIFT_SCORE_MAX) * 100);
          return (
            <div
              key={gift.column}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <span className="w-5 shrink-0 text-sm text-muted-foreground">
                {i + 1}
              </span>

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex min-w-0 items-center gap-1 text-start font-medium hover:underline"
                  >
                    <span className="truncate">{gift.name}</span>
                    <Info className="size-3.5 shrink-0 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72">
                  <img
                    src={gift.imageUrl}
                    alt={gift.name}
                    className="w-full rounded-md object-cover"
                  />
                  <p className="mt-2 text-sm font-medium">{gift.name}</p>
                </PopoverContent>
              </Popover>

              <div className="ms-auto flex shrink-0 items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-muted sm:w-32">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-10 text-right text-sm tabular-nums">
                  {score}/{GIFT_SCORE_MAX}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pb-8">
        <Button variant="outline" onClick={onRetake}>
          ทำแบบสำรวจใหม่
        </Button>
      </div>
    </div>
  );
}
