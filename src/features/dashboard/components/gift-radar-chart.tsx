import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGiftRadarData, type Gift } from "@/features/lamb-info/data/gifts";

type GiftRadarChartProps = {
  averages: Gift[];
  assessedCount: number;
};

// สีเดียวกับ GiftsCard ของโปรไฟล์รายคน (lamb-info/components/gifts-card.tsx)
// เพื่อให้ radar chart ทั้งโบสกับรายคนดูเป็นชุดเดียวกัน
const GIFT_COLOR = "#7c6ff0";

// Radar chart รวมของประทานทั้งโบส — เฉลี่ยคะแนนต่อคน (เฉพาะคนที่ทำแบบประเมิน
// แล้ว) แล้ว group เป็น 5 category ด้วย getGiftRadarData() ตัวเดียวกับที่ใช้
// ในหน้าโปรไฟล์รายคน (ไม่ reimplement การ group) — ตกลงใน grill-me
// 2026-08-14 (`dashboard_design` ใน project memory)
export function GiftRadarChart({ averages, assessedCount }: GiftRadarChartProps) {
  const radarData = getGiftRadarData(averages);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ของประทานทั้งโบส (เฉลี่ย)</CardTitle>
      </CardHeader>
      <CardContent>
        {assessedCount === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            ยังไม่มีใครทำแบบประเมินของประทาน
          </p>
        ) : (
          <>
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
                  name="ของประทานทั้งโบส"
                  dataKey="score"
                  stroke={GIFT_COLOR}
                  fill={GIFT_COLOR}
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              เฉลี่ยจากสมาชิก {assessedCount} คนที่ทำแบบประเมินแล้ว
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
