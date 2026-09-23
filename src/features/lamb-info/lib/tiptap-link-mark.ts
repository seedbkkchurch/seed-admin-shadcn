import { Mark, mergeAttributes } from "@tiptap/react";

// Mark ลิงก์แบบเล็กสุดสำหรับเครดิตรูป Pexels ("ภาพ: ชื่อช่างภาพ / Pexels")
// ที่แทรกใต้รูปอัตโนมัติ (grill-me 2026-09-23) — ไม่ได้ติดตั้ง
// @tiptap/extension-link เพราะติดตั้ง dependency ใหม่จากที่นี่ไม่ได้ (ดู
// device_bash_npm_install_platform_bug) และต้องการแค่ render <a> ให้ถูกเท่านั้น
// ยอมรับเฉพาะ href ที่เป็น http(s) — ลิงก์ javascript: ฯลฯ จะถูกทิ้งตั้งแต่
// ตอน parse ไม่หลุดไปอยู่ใน content_html ที่ render ด้วย dangerouslySetInnerHTML
function safeHref(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export const LinkMark = Mark.create({
  name: "link",
  inclusive: false,

  addAttributes() {
    return {
      href: {
        default: null,
        parseHTML: (element) => safeHref(element.getAttribute("href")),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "a[href]",
        getAttrs: (element) =>
          safeHref((element as HTMLElement).getAttribute("href"))
            ? null
            : false,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        target: "_blank",
        rel: "noopener noreferrer nofollow",
      }),
      0,
    ];
  },
});
