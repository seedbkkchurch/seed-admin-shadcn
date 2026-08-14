import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgeBracketCount } from "../lib/aggregate";

type AgeDistributionChartProps = {
  brackets: AgeBracketCount[];
};

// แท่งกราฟแนวตั้งแบ่งช่วงอายุ — สไตล์เดียวกับ Overview chart เดิมของ
// template (recharts BarChart) ตกลงใน grill-me 2026-08-14 (`dashboard_design`)
export function AgeDistributionChart({ brackets }: AgeDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">แบ่งจำนวนตามช่วงอายุ</CardTitle>
      </CardHeader>
      <CardContent className="ps-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={brackets}>
            <XAxis
              dataKey="label"
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
      </CardContent>
    </Card>
  );
}
