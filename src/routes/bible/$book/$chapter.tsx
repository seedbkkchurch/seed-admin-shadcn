// DEPRECATED — ไม่ได้ใช้แล้ว ย้ายไป
// src/routes/_authenticated/bible/$book/$chapter.tsx แทน (ผู้ใช้เปลี่ยนใจให้
// หน้า Bible ต้อง login + มีเมนู sidebar, 2026-08-13)
// ลบไฟล์นี้ทิ้งได้เลย — ไม่มีทาง `rm` ให้อัตโนมัติเพราะเครื่องมือรันคำสั่งบน
// เครื่องผู้ใช้ใช้ไม่ได้ใน session ที่ทำงานนี้ ไฟล์นี้จงใจไม่ export `Route`
// จึง TanStack router-plugin จะไม่เอาไปสร้างเส้นทางซ้ำกับของใหม่
export {};
