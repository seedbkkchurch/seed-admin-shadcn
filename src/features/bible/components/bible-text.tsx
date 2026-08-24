import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { parseFootnoteText } from "../lib/parse-footnotes";
import { parseStrongsText } from "../lib/parse-strongs";
import { type BibleFootnote, type BibleHeading } from "../data/types";
import { FootnoteMarker } from "./footnote-marker";
import { StrongsWord } from "./strongs-word";

// วิธี parse เนื้อข้อความต่อฉบับ — kjv มีรหัส Strong's ฝัง, erv (ทั้งอังกฤษ/
// ไทย) มีเชิงอรรถฝังแทน, niv/esv/thai(กษัตริย์เจมส์ไทย) เป็นข้อความล้วนไม่มี
// markup อะไรเลย (ดู grill-me 2026-08-24 "เพิ่ม ERV")
export type BibleTextParseMode = "strongs" | "footnotes" | "plain";

type BibleTextProps = {
  text: string;
  parseMode: BibleTextParseMode;
  // สวิตช์เดียวกันคุมทั้ง Strong's และเชิงอรรถ ERV (ดู grill-me 2026-08-24
  // "ใช้สวิตช์เดียวกัน") — false: คำ Strong's กลายเป็นข้อความธรรมดา,
  // เครื่องหมายเชิงอรรถ ERV ถูกซ่อนไปเลย (ไม่ใช่แค่ปิดสี เหมือน Strong's)
  showMarkup: boolean;
  footnotes?: BibleFootnote[];
};

export function BibleText({
  text,
  parseMode,
  showMarkup,
  footnotes,
}: BibleTextProps) {
  if (parseMode === "strongs") {
    return (
      <>
        {parseStrongsText(text).map((segment, i) => (
          <Fragment key={i}>
            {segment.type === "text" || !showMarkup ? (
              segment.text
            ) : (
              <StrongsWord text={segment.text} codes={segment.codes} />
            )}
          </Fragment>
        ))}
      </>
    );
  }

  if (parseMode === "footnotes") {
    return (
      <>
        {parseFootnoteText(text, footnotes).map((segment, i) => {
          if (segment.type === "text") return <Fragment key={i}>{segment.text}</Fragment>;
          if (!showMarkup) return null;
          return (
            <FootnoteMarker key={i} marker={segment.marker} note={segment.note} />
          );
        })}
      </>
    );
  }

  return <>{text}</>;
}

// หัวข้อ ERV ก่อนข้อ — ตัวหนา จัดกึ่งกลาง หัวข้อหลัก (level 1) ตัวโตกว่าหัวข้อ
// ย่อย (level 2 — รวมคำนำสดุดี/cross-reference) (ดู grill-me 2026-08-24
// "แสดงต่างกัน")
export function BibleHeadings({ headings }: { headings?: BibleHeading[] }) {
  if (!headings?.length) return null;
  return (
    <>
      {headings.map((h, i) => (
        <p
          key={i}
          className={cn(
            "text-center font-bold",
            h.level === 1
              ? "mt-4 mb-1 text-base first:mt-0"
              : "mb-1 text-sm text-muted-foreground first:mt-0",
          )}
        >
          {h.text}
        </p>
      ))}
    </>
  );
}
