import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttendanceWeekPoint } from "../lib/aggregate";

type AttendanceTrendChartProps = {
  data: AttendanceWeekPoint[];
};

// สีเดียวกับ AttendanceSummary ของหน้า attendance (Church/HeartHandshake) —
// ไม่มี icon color ที่ตรึงไว้ตรงนั้น เลยเลือกสีฟ้า/เขียวที่แยกกันชัดเจนแทน
const CHURCH_COLOR = "#3b82f6";
const CARE_COLOR = "#14b8a6";

// เทรนด์ % มาโบสถ์/มาแคร์ 12 สัปดาห์ล่าสุด — % คำนวณจากจำนวนสมาชิก active
// "ปัจจุบัน" คงที่ทุกสัปดาห์ (ดู computeAttendanceTrend) ตกลงใน grill-me
// 2026-08-14 รอบสอง (`dashboard_design`)
export function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          เทรนด์การมาโบสถ์ / มาแคร์ (12 สัปดาห์ล่าสุด)
        </CardTitle>
      </CardHeader>
      <CardContent className="ps-2">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeOpacity={0.2} vertical={false} />
            <XAxis
              dataKey="weekLabel"
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
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="churchPercent"
              name="มาโบสถ์"
              stroke={CHURCH_COLOR}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="carePercent"
              name="มาแคร์"
              stroke={CARE_COLOR}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
