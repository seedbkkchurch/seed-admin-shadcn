import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GIFT_SCORE_MAX,
  getGiftRadarData,
  mergeGiftScores,
} from "@/features/lamb-info/data/gifts";
import { useGiftFromGod } from "@/features/lamb-info/data/queries";

// สีเดียวกับ radar ของประทานในโปรไฟล์/Dashboard (gifts-card.tsx,
// dashboard/components/gift-radar-chart.tsx) ให้ดูเป็นชุดเดียวกัน
const GIFT_COLOR = "#7c6ff0";
const TOP_COUNT = 5;

// Radar ของประทานของตัวเอง (5 หมวด, 0-100 จาก getGiftRadarData ตัวเดียวกับ
// โปรไฟล์) + ของประทานคะแนนสูงสุด 5 อันดับพร้อมคะแนนเต็ม 15 — อ่านอย่างเดียว
// แก้คะแนนยังทำที่หน้าโปรไฟล์/แบบสำรวจเหมือนเดิม
export function MyGiftRadarCard({ lambId }: { lambId: string }) {
  const { data: giftRow, isPending } = useGiftFromGod(lambId);
  const gifts = useMemo(() => mergeGiftScores(giftRow), [giftRow]);
  const radarData = useMemo(() => getGiftRadarData(gifts), [gifts]);
  const topGifts = useMemo(
    () =>
      gifts
        .filter((gift) => gift.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, TOP_COUNT),
    [gifts],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ของประทานของฉัน</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-72 w-full" />
        ) : topGifts.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-muted-foreground text-sm">
              ยังไม่มีคะแนนของประทาน ลองทำแบบสำรวจดูก่อน
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/spiritual-gifts-survey">ทำแบบสำรวจของประทาน</Link>
            </Button>
          </div>
        ) : (
          <div className="grid items-center gap-6 lg:grid-cols-2">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                />
                <Radar
                  dataKey="score"
                  stroke={GIFT_COLOR}
                  fill={GIFT_COLOR}
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>

            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                คะแนนสูงสุด {topGifts.length} อันดับ (เต็ม {GIFT_SCORE_MAX})
              </p>
              <ul className="space-y-3">
                {topGifts.map((gift) => (
                  <li key={gift.column} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{gift.name}</span>
                      <span className="text-muted-foreground shrink-0 tabular-nums">
                        {gift.score}/{GIFT_SCORE_MAX}
                      </span>
                    </div>
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(gift.score / GIFT_SCORE_MAX) * 100}%`,
                          backgroundColor: GIFT_COLOR,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
