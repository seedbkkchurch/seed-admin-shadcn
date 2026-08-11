import { useMemo } from "react";
import { format, startOfMonth, subMonths } from "date-fns";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DevotionMonthlyChartProps = {
  today: Date;
  entries: { devotion_date: string }[];
};

// Rolling 12-month bar chart — the "รายเดือน" view on devotion-section.tsx,
// per grill-me follow-up (2026-08-11). No navigation, same as the daily/
// yearly heatmaps: always "this month back 11 more", full stop. Bars use
// the same green as the heatmap's "ส่งแล้ว" dots so all three views read
// as one system (green = a submitted เฝ้าเดี่ยว).
export function DevotionMonthlyChart({
  today,
  entries,
}: DevotionMonthlyChartProps) {
  const data = useMemo(() => {
    const months: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(startOfMonth(today), i);
      const monthKey = format(monthDate, "yyyy-MM");
      const count = entries.filter((e) =>
        e.devotion_date.startsWith(monthKey),
      ).length;
      months.push({ month: format(monthDate, "MMM yyyy"), count });
    }
    return months;
  }, [today, entries]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="month"
          stroke="#888888"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={28}
        />
        <Tooltip
          cursor={{ className: "fill-muted", opacity: 0.5 }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
                <div className="font-medium">{label}</div>
                <div className="text-muted-foreground">
                  {payload[0].value} ครั้ง
                </div>
              </div>
            );
          }}
        />
        <Bar
          dataKey="count"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
          className="fill-green-500 dark:fill-green-600"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
