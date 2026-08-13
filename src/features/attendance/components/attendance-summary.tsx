import { AlertCircle, Church, HeartHandshake } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttendanceSummary } from "../data/queries";

type AttendanceSummaryProps = {
  weekStart: string;
};

type StatTileProps = {
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
};

function StatTile({ icon, label, count, total }: StatTileProps) {
  const percent = total === 0 ? 0 : Math.round((count / total) * 100);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="text-4xl font-bold tracking-tight sm:text-5xl">
          {count} <span className="text-2xl text-muted-foreground">/ {total} คน</span>
        </div>
        <div className="text-sm text-muted-foreground">{percent}%</div>
      </CardContent>
    </Card>
  );
}

// สรุปยอดรวมทุกกลุ่มแคร์ของสัปดาห์ที่เลือก — โหมด "แสดงทั้งหมด" เป็นอิสระจาก
// Select กลุ่มแคร์ สลับแทนที่ตารางรายคน (ดู grill-me 2026-08-13)
export function AttendanceSummary({ weekStart }: AttendanceSummaryProps) {
  const { data, isPending, isError } = useAttendanceSummary(weekStart);

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>โหลดสรุปยอดไม่สำเร็จ</AlertTitle>
        <AlertDescription>ลองรีเฟรชหน้านี้อีกครั้ง</AlertDescription>
      </Alert>
    );
  }

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }

  const { totalMembers, cameToChurch, cameToGroupCare } = data;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <StatTile
        icon={<Church className="size-4" />}
        label="มาโบสถ์"
        count={cameToChurch}
        total={totalMembers}
      />
      <StatTile
        icon={<HeartHandshake className="size-4" />}
        label="มาแคร์"
        count={cameToGroupCare}
        total={totalMembers}
      />
    </div>
  );
}
