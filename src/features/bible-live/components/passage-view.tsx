import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { type YouVersionPassageBody } from "../data/queries";

type PassageViewProps = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  data: YouVersionPassageBody | undefined;
};

// แสดงเนื้อความที่ได้จาก /v1/bibles/{id}/passages/{ref} (format=text) สดๆ —
// ไม่รู้ shape ที่แน่นอนล่วงหน้าเพราะยังไม่เคยเรียกจริง (เอกสารสาธารณะไม่ได้
// ลง field ละเอียด) เผื่อ fallback ไว้ด้วยถ้า data.content ไม่มีตามคาด (ดู
// grill-me 2026-08-20) โชว์ copyright ที่ API ส่งมาด้วยถ้ามี — เป็นการ
// attribution ตามเงื่อนไข license ปกติของ Bible API
export function PassageView({ isPending, isError, error, data }: PassageViewProps) {
  if (isPending) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>โหลดข้อความไม่สำเร็จ</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Something went wrong."}
        </AlertDescription>
      </Alert>
    );
  }

  if (data?.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>YouVersion ตอบกลับเป็น error</AlertTitle>
        <AlertDescription>{data.error}</AlertDescription>
      </Alert>
    );
  }

  if (!data?.data?.content) {
    return (
      <Alert>
        <AlertCircle />
        <AlertTitle>ไม่พบเนื้อความในรูปแบบที่คาดไว้</AlertTitle>
        <AlertDescription>
          Response ที่ได้กลับมาไม่มี data.content ตามที่คาด — ลองเปิดหน้า
          Bible API Tester ยิง endpoint นี้ตรงๆ ดู raw response เพื่อปรับ
          โค้ดแสดงผลให้ตรงกับ shape จริง
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {data.data.reference ? (
        <p className="text-muted-foreground text-sm">{data.data.reference}</p>
      ) : null}
      <div className="text-sm leading-relaxed whitespace-pre-wrap">
        {data.data.content}
      </div>
      {data.data.copyright ? (
        <p className="text-muted-foreground border-t pt-2 text-xs">
          {data.data.copyright}
        </p>
      ) : null}
    </div>
  );
}
