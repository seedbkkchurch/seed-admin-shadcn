import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type YouVersionBibleSummary } from "../data/queries";

type BibleSelectProps = {
  bibles: YouVersionBibleSummary[];
  bibleId: string | undefined;
  onChange: (bibleId: string) => void;
};

// เลือกฉบับจาก id จริงที่ได้จาก /v1/bibles (metadata เท่านั้น) — ไม่ hardcode
// id ของ THSV11 ไว้ล่วงหน้าเพราะยังไม่ยืนยันว่ามีให้ใช้จริงหรือ id คืออะไร
// (ดู grill-me 2026-08-20) ให้ผู้ใช้เลือกเองจาก dropdown นี้แทน
export function BibleSelect({ bibles, bibleId, onChange }: BibleSelectProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="bible-select">ฉบับ</Label>
      <Select value={bibleId} onValueChange={onChange}>
        <SelectTrigger id="bible-select" className="w-64">
          <SelectValue placeholder="เลือกฉบับ" />
        </SelectTrigger>
        <SelectContent>
          {bibles.map((bible) => (
            <SelectItem key={bible.id} value={bible.id}>
              {bible.local_title ?? bible.title ?? bible.abbreviation ?? bible.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
