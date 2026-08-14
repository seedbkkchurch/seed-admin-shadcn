import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PersonalityCodeCount } from "../lib/aggregate";

type PersonalityDistributionChartProps = {
  data: PersonalityCodeCount[];
};

// จำนวนสมาชิก active ตาม personality_code (4 ตัวแบบ MBTI เช่น ENTJ, INFJ) —
// เฉพาะคนที่มี personality_code ที่ match กับ personality_type จริง (ดู
// computePersonalityDistribution) ตกลงใน grill-me 2026-08-14 รอบสี่
// (`dashboard_design`): เปลี่ยนจากแสดง archetype มาแสดง code ตรงๆ แทน
export function PersonalityDistributionChart({
  data,
}: PersonalityDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">บุคลิกภาพของสมาชิก (MBTI)</CardTitle>
      </CardHeader>
      <CardContent className="ps-2">
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            ยังไม่มีสมาชิกที่ทำแบบทดสอบบุคลิกภาพ
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis
                dataKey="code"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Bar
                dataKey="count"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
