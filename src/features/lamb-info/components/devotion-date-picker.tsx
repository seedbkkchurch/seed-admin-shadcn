import { endOfToday, format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ช่องเลือกวันที่เฝ้าเดี่ยว (devotion_date) — grill-me 2026-10-07:
// เลือกได้วันนี้หรือย้อนหลังเท่านั้น (ห้ามอนาคต) ไม่จำกัดว่าย้อนได้กี่วัน
// value/onChange เป็นสตริง "yyyy-MM-dd" ตรงกับคอลัมน์ date ใน DB
export function DevotionDatePicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-44 justify-start font-normal"
        >
          <CalendarIcon />
          {format(parseISO(value), "d MMM yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <DevotionDateCalendar value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}

export function DevotionDateCalendar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = parseISO(value);
  return (
    <Calendar
      mode="single"
      selected={selected}
      defaultMonth={selected}
      onSelect={(date) => {
        if (date) onChange(format(date, "yyyy-MM-dd"));
      }}
      disabled={{ after: endOfToday() }}
    />
  );
}
