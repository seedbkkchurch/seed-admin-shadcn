import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Info } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  GIFT_SCORE_MAX,
  getGiftRadarData,
  mergeGiftScores,
  type GiftScores,
} from "@/features/lamb-info/data/gifts";
import { GIFT_SCORING } from "../data/scoring";

// สีเดียวกับ radar chart ในการ์ด Gifts from God ที่หน้าโปรไฟล์
// (features/lamb-info/components/gifts-card.tsx) — ให้หน้าตาสอดคล้องกัน
const GIFT_COLOR = "#7c6ff0";

type SurveyResultsProps = {
  lambId: string;
  scores: GiftScores;
  onRetake: () => void;
};

// หน้าสรุปผลหลังส่งแบบสำรวจสำเร็จ — โชว์ radar chart แบบเดียวกับที่หน้า
// โปรไฟล์ (GiftsCard) ใช้ + ลิสต์คะแนนของประทานทั้ง 25 ชนิดเรียงมากไปน้อย
// แต่ละชื่อคลิก/แตะแล้วเปิด popover โชว์รูปคำอธิบาย ไม่โชว์ระหว่างทำแบบ
// สำรวจ (กันคนตอบเดาว่าข้อไหนคือของประทานอะไรแล้วตอบเอนเอียง) — บอกด้วยว่า
// ข้อมูลอัปเดตในหน้าโปรไฟล์แล้ว พร้อมลิงก์กลับไปดู (ตกลงใน grill-me
// 2026-08-25)
export function SurveyResults({
  lambId,
  scores,
  onRetake,
}: SurveyResultsProps) {
  const gifts = useMemo(() => mergeGiftScores(scores), [scores]);
  const radarData = useMemo(() => getGiftRadarData(gifts), [gifts]);

  const ranked = useMemo(
    () =>
      [...GIFT_SCORING].sort(
        (a, b) => (scores[b.column] ?? 0) - (scores[a.column] ?? 0),
      ),
    [scores],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm">
            บันทึกผลแล้ว — ข้อมูลของคุณอัปเดตในหน้าโปรไฟล์ (การ์ด Gifts from
            God) เรียบร้อยแล้ว
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link to="/lamb-info/$lambId" params={{ lambId }}>
            ไปที่หน้าโปรไฟล์
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border p-4">
        <ResponsiveContainer width="100%" height={340}>
          <RadarChart data={radarData} outerRadius="75%">
            <PolarGrid />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            />
            <Radar
              name="Gifts"
              dataKey="score"
              stroke={GIFT_COLOR}
              fill={GIFT_COLOR}
              fillOpacity={0.5}
            />
          </RadarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex items-center justify-center gap-2 text-sm">
          <span
            className="inline-block size-2.5 rounded-xs"
            style={{ backgroundColor: GIFT_COLOR }}
          />
          <span style={{ color: GIFT_COLOR }}>Gifts</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        ของประทานฝ่ายวิญญาณของคุณ เรียงจากมากไปน้อย —
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
