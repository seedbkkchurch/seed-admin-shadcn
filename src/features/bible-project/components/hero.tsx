import type { CSSProperties } from "react";
import "./hero.css";

// Hero ด้านบนของหน้า /bible-project — วงแหวนรูปการ์ดหมุน 2 วง + หัวข้อใหญ่
// จาก getanyui capture ของ bibleproject.com/th/#videos (2026-11-19) จำนวนช่อง
// ต่อวง (62 / 58) และลำดับรูปตามต้นทางเป๊ะ (ทั้งสองวงวนซ้ำทุก 13 รูป)
//
// รูปในวงแหวนเป็นของ BibleProject — ลิงก์ตรงจาก CDN ของเขา ไม่ copy ไฟล์เข้า
// โปรเจกต์ ตามแนวทาง "For app creators" ของ BibleProject (ฝัง/ลิงก์แทนการเก็บ
// เนื้อหาไว้ในแอป + ให้เครดิต — ดู BibleProjectCredit ท้ายหน้า) ถ้ารูปโหลดไม่
// ได้ ช่องจะเป็นสีพื้นหลังเฉยๆ ไม่ทำให้หน้าพัง
const CAROUSEL_CDN =
  "https://ik.imagekit.io/bpweb1/media/bibleproject-homepage-carousel-images/hub/tr:q-50,w-600";

const RINGS = [
  {
    slots: 62,
    images: [11, 12, 13, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
  {
    slots: 58,
    images: [20, 21, 22, 23, 24, 25, 26, 14, 15, 16, 17, 18, 19],
  },
] as const;

function carouselImageUrl(images: readonly number[], slot: number) {
  const n = String(images[slot % images.length]).padStart(2, "0");
  return `${CAROUSEL_CDN}/home-hub-carousel-${n}.jpg`;
}

export function BibleProjectHero({ subtitle }: { subtitle?: string }) {
  return (
    <section className="bp-hero -mx-4">
      <div className="bp-carousel" aria-hidden="true">
        <div className="bp-carousel-clip">
          {RINGS.map(({ slots, images }, ring) => (
            <div
              key={ring}
              className="bp-carousel-ring"
              style={{ "--home-carousel-slot-count": slots } as CSSProperties}
            >
              {Array.from({ length: slots }, (_, slot) => (
                <div
                  key={slot}
                  className="bp-carousel-item"
                  style={{ "--home-carousel-slot": slot } as CSSProperties}
                >
                  <img
                    src={carouselImageUrl(images, slot)}
                    alt=""
                    decoding="async"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <h1 className="bp-hero-heading">
        ดูภาพรวมพระคัมภีร์ทีละเล่ม แล้วเห็นเรื่องราวเดียวที่นำไปสู่พระเยซู
      </h1>
      {subtitle && (
        <p className="text-muted-foreground mx-4 mt-4 text-center">
          {subtitle}
        </p>
      )}
    </section>
  );
}

// เครดิตตามที่ BibleProject กำหนดสำหรับแอปที่นำเนื้อหาของเขามาแสดง
export function BibleProjectCredit() {
  return (
    <p className="text-muted-foreground mt-6 text-center text-xs">
      BibleProject is the author and owner of this content. To find more
      BibleProject resources, visit{" "}
      <a
        href="https://bibleproject.com"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-foreground underline underline-offset-2"
      >
        bibleproject.com
      </a>
      .
    </p>
  );
}
