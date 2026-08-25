// Class string ที่ใช้จัดสไตล์เนื้อหา content_html ของเฝ้าเดี่ยว — ใช้ร่วมกัน
// 3 จุด (ต้องหน้าตาตรงกันเป๊ะ ไม่งั้นสิ่งที่เห็นตอนเขียนกับตอนอ่านจะไม่ตรงกัน):
//   - ArticleEditor (components/article-editor.tsx) — พื้นที่พิมพ์จริง
//   - DevotionDetail (devotion-detail.tsx) — หน้าอ่านฝั่งแอดมิน/เจ้าของ
//   - DevotionPublicDetail (features/devotion-public/...) — หน้าอ่านสาธารณะ
// เดิม copy-paste กัน 3 ที่แยกกัน (ดู grill-me 2026-08-25 "upgrade editor
// เฝ้าเดี่ยว — Color/Highlight") ตอนนี้รวมไว้ที่เดียวเพื่อกันหลุดตอนแก้ไข
// เพิ่ม mark/node ใหม่ในอนาคต
//
// Color/Highlight มาร์กเป็น inline style="color:#..." / style="background-
// color:#..." ที่ฝังมากับ content_html ตรงๆ (ไม่ต้องพึ่ง class ที่นี่) —
// ปลอดภัยเพราะจานสีที่ให้เลือกใน editor (ดู devotion-content-colors.ts)
// เลือกมาให้อ่านได้ทั้ง light/dark theme อยู่แล้ว
export const DEVOTION_CONTENT_CLASS =
  "[&_p]:my-3 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold " +
  "[&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold " +
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-6 " +
  "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-6 " +
  "[&_blockquote]:my-3 [&_blockquote]:border-s-4 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:ps-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic " +
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] " +
  "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-[0.85em] [&_pre]:leading-relaxed " +
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 " +
  "[&_mark]:rounded-sm [&_mark]:px-0.5 [&_mark]:py-px " +
  "[&_img]:my-4 [&_img]:max-h-[480px] [&_img]:w-full [&_img]:rounded-md [&_img]:object-contain";
