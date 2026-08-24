import { useState } from "react";
import { X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type FootnoteMarkerProps = {
  marker: string;
  note: string;
};

// เชิงอรรถ ERV — สัญลักษณ์ superscript เล็กๆ ต่อท้ายคำ (เช่น ᵃ) กดแล้วเปิด
// popover โชว์เนื้อ note (เหมือน Strong's แต่ไม่มีสี H/G, ไม่มี dictionary
// lookup — note มาจากไฟล์ preprocess ตรงๆ) ใช้ <sup> + font-size เล็กแทน
// อักษร superscript ยูนิโค้ดจริง เพราะบางตัวอักษร (เช่น q) ไม่มีอักษร
// superscript ในยูนิโค้ด (ดู grill-me 2026-08-24)
export function FootnoteMarker({ marker, note }: FootnoteMarkerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <sup>
          <button
            type="button"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "cursor-help px-0.5 text-[0.7em] font-semibold text-primary/70 underline decoration-dotted underline-offset-2",
              open && "text-primary",
            )}
          >
            {marker}
          </button>
        </sup>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 max-w-[90vw] border-2 pr-8"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="ปิด"
          className="absolute right-2 top-2 rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        <p className="text-sm">{note}</p>
      </PopoverContent>
    </Popover>
  );
}
