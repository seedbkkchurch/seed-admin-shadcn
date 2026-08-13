import { useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useStrongsDictionary } from "../data/queries";
import { type StrongsDictionaryEntry } from "../data/types";

type StrongsWordProps = {
  text: string;
  codes: string[];
};

// สีแยกภาษาต้นฉบับ — ฮีบรู (H) = อำพัน, กรีก (G) = ฟ้า ใช้กับ badge/กรอบ
// popover เท่านั้น (ดู grill-me รอบ 2026-08-13 "ปิด popover") — ตัวคำในเนื้อ
// ข้อความปกติเป็นสีธรรมดา จะเปลี่ยนเป็นสีนี้ก็ต่อเมื่อ popover เปิดอยู่
// เท่านั้น (เดิมเป็นสีตลอดเวลา ผู้ใช้ขอให้ลดสีลงเหลือแค่ตอนดูอยู่)
const LANG_STYLES = {
  H: {
    label: "ฮีบรู",
    text: "text-amber-700 dark:text-amber-400",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    ring: "border-amber-300 dark:border-amber-800",
  },
  G: {
    label: "กรีก",
    text: "text-blue-700 dark:text-blue-400",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    ring: "border-blue-300 dark:border-blue-800",
  },
} as const;

// สี field label/value ใน popover — ตายตัวเหมือนภาพตัวอย่างที่ผู้ใช้ส่งมา
// (ไม่เปลี่ยนตามภาษาเหมือน badge/กรอบด้านนอก)
const FIELD_LABEL_CLASS = "italic text-blue-600 dark:text-blue-400";
const FIELD_VALUE_CLASS = "italic text-amber-600 dark:text-amber-400";

function codeLang(code: string): "H" | "G" {
  return code.startsWith("H") ? "H" : "G";
}

// คำที่มีรหัส Strong's (กรีก/ฮีบรู) — ขีดเส้นใต้จางๆ ตลอดเวลา แต่สีตัวอักษร
// จะขึ้นเฉพาะตอน popover เปิด (hover บน desktop, tap เปิด/ปิด บนมือถือ) —
// เพิ่มปุ่มปิด (X) มุมขวาบนของ popover ให้ปิดได้ชัดเจน แทนที่จะต้องคลิกออก
// นอกกรอบเท่านั้น (ดู grill-me 2026-08-13)
export function StrongsWord({ text, codes }: StrongsWordProps) {
  const [open, setOpen] = useState(false);

  const hasHebrew = codes.some((c) => c.startsWith("H"));
  const hasGreek = codes.some((c) => c.startsWith("G"));

  const hebrewDict = useStrongsDictionary("hebrew", open && hasHebrew);
  const greekDict = useStrongsDictionary("greek", open && hasGreek);

  const entries = useMemo(() => {
    return codes
      .map((code): [string, StrongsDictionaryEntry | undefined] => {
        const dict = code.startsWith("H") ? hebrewDict.data : greekDict.data;
        return [code, dict?.[code]];
      })
      .filter(
        (pair): pair is [string, StrongsDictionaryEntry] => !!pair[1],
      );
  }, [codes, hebrewDict.data, greekDict.data]);

  const isLoading =
    (hasHebrew && hebrewDict.isPending) || (hasGreek && greekDict.isPending);

  // สีของ badge/กรอบ popover: ถ้ามีแค่ภาษาเดียวใช้สีนั้น ถ้าปนกัน (ไม่ค่อย
  // เกิด) ใช้สีของรหัสตัวแรก
  const primaryLang = codeLang(codes[0]);
  const style = LANG_STYLES[primaryLang];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "cursor-help underline decoration-current/50 decoration-dotted underline-offset-4",
            open && style.text,
          )}
        >
          {text}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-80 max-w-[90vw] border-2 pr-8", style.ring)}
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

        {isLoading ? (
          <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            ไม่พบข้อมูลใน dictionary
          </p>
        ) : (
          <div className="space-y-4">
            {entries.map(([code, entry]) => {
              const entryStyle = LANG_STYLES[codeLang(code)];
              return (
                <div key={code} className="space-y-1">
                  <span
                    className={cn(
                      "inline-block rounded px-1.5 py-0.5 text-xs font-medium",
                      entryStyle.badge,
                    )}
                  >
                    {entryStyle.label}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={cn("text-lg font-bold", entryStyle.text)}
                    >
                      {entry.lemma}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {code}
                    </span>
                  </div>
                  <p className="text-sm">
                    <span className={FIELD_LABEL_CLASS}>
                      Transliteration:{" "}
                    </span>
                    <span className={FIELD_VALUE_CLASS}>
                      {entry.xlit ?? entry.translit}
                    </span>
                  </p>
                  {entry.pron && (
                    <p className="text-sm">
                      <span className={FIELD_LABEL_CLASS}>
                        Pronunciation:{" "}
                      </span>
                      <span className={FIELD_VALUE_CLASS}>{entry.pron}</span>
                    </p>
                  )}
                  {entry.derivation && (
                    <p className="text-sm">
                      <span className={FIELD_LABEL_CLASS}>Derivation: </span>
                      <span className={FIELD_VALUE_CLASS}>
                        {entry.derivation}
                      </span>
                    </p>
                  )}
                  <p className="text-sm">
                    <span className={FIELD_LABEL_CLASS}>Definition: </span>
                    <span className={FIELD_VALUE_CLASS}>
                      {entry.strongs_def}
                    </span>
                  </p>
                  {entry.kjv_def && (
                    <p className="text-sm">
                      <span className={FIELD_LABEL_CLASS}>KJV Usage: </span>
                      <span className={FIELD_VALUE_CLASS}>
                        {entry.kjv_def}
                      </span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
