import {
  LayoutDashboard,
  IdCard,
  Bell,
  ShieldCheck,
  HandHeart,
  HeartHandshake,
  Sparkles,
  BrainCircuit,
  NotebookPen,
  Table,
  ClipboardCheck,
  Newspaper,
  BookOpen,
  KeyRound,
  FlaskConical,
  GitBranch,
  Cake,
} from "lucide-react";
import { Logo } from "@/assets/logo";
import { type SidebarData } from "../types";

// ลบเมนู demo ของ template เดิม (Tasks, Apps, Users, Secured by Clerk)
// ออกจาก Sidebar ตามที่ตกลงใน grill-me 2026-08-16 — ลบแค่รายการเมนู หน้า
// route เดิม (/tasks, /apps, /users, /clerk/*) ยังอยู่ในโค้ด เข้าถึงได้ถ้า
// พิมพ์ URL ตรงๆ (ไม่ได้ลบไฟล์ route ทิ้ง) เมนูนี้ตัวเดียวกันขับ Cmd+K
// search menu ด้วย (ดู components/command-menu.tsx) ลบตรงนี้จุดเดียวก็หาย
// จาก search ไปด้วยอัตโนมัติ
export const sidebarData: SidebarData = {
  user: {
    name: "satnaing",
    email: "satnaingdev@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Seed Admin",
      logo: Logo,
      plan: "Vite + ShadcnUI",
    },
  ],
  navGroups: [
    // เดิมเป็นกลุ่ม "General" กลุ่มเดียว 13 รายการยาวเดียว — แยกเป็น 3
    // หมวดตามที่ขอ (grill-me 2026-08-30): ภาพรวม / สมาชิก / เนื้อหา-กิจกรรม
    // เก็บ hiddenForRoles ของแต่ละ item ไว้เหมือนเดิมทุกอัน แค่ย้ายตำแหน่ง
    {
      title: "ภาพรวม",
      items: [
        {
          title: "Dashboard",
          url: "/",
          icon: LayoutDashboard,
        },
        // แยกออกมาจากการ์ด "เกิดเดือนนี้" บน Dashboard (ที่ยังคงอยู่เหมือน
        // เดิม) ให้เลือกดูเดือนอื่นได้ด้วย — เปิดให้ทุก role เห็น เหมือน
        // Dashboard เดิม (grill-me 2026-08-30)
        {
          title: "เดือนเกิด",
          url: "/birthdays",
          icon: Cake,
        },
      ],
    },
    {
      title: "สมาชิก",
      items: [
        {
          title: "Lamb Info",
          url: "/lamb-info",
          icon: IdCard,
          // รายชื่อลูกแกะหลายคน — member/visitor ดูได้แค่ profile ตัวเอง
          // (ผ่านปุ่ม Profile ใน dropdown/tab bar) ไม่ควรเห็นเมนูรายการนี้
          // เลย กันซ้ำที่ route ด้วย (ดู /_authenticated/lamb-info,
          // grill-me 2026-08-23)
          hiddenForRoles: ["member", "visitor"],
        },
        {
          title: "Group Care",
          url: "/group-care",
          icon: HeartHandshake,
        },
        // พี่เลี้ยงลูกแกะ — grill-me 2026-08-28. หน้าแก้ไข (/mentorship) ซ่อน
        // จาก member/visitor/cell_leader เพราะแก้ไขไม่ได้อยู่ดี
        // (lamb:edit:mentor เป็นของ team_leader/admin/super_admin เท่านั้น —
        // กันซ้ำที่ route ด้วย) ส่วนผัง (/mentorship-chart) ให้ทุกคนเห็นเมนู
        // ได้ เพราะดูได้ทุก role ที่ login แล้ว
        {
          title: "พี่เลี้ยงลูกแกะ",
          url: "/mentorship",
          icon: HandHeart,
          hiddenForRoles: ["member", "visitor", "cell_leader"],
        },
        {
          title: "ผังพี่เลี้ยง",
          url: "/mentorship-chart",
          icon: GitBranch,
        },
        {
          title: "เช็คชื่อรายสัปดาห์",
          url: "/attendance",
          icon: ClipboardCheck,
          // เมนูคุมงานเช็คชื่อทั้งกลุ่มแคร์ — ไม่ใช่ของ member/visitor
          // (ดู /_authenticated/attendance, grill-me 2026-08-23)
          hiddenForRoles: ["member", "visitor"],
        },
      ],
    },
    {
      title: "เนื้อหา-กิจกรรม",
      items: [
        {
          title: "เฝ้าเดี่ยว",
          url: "/lamb-info/devotion",
          icon: NotebookPen,
        },
        {
          title: "ข่าว",
          url: "/news",
          icon: Newspaper,
        },
        // จัดการข่าว (เขียน/แก้ไข/เก็บถาวร/หมวดหมู่) — เฉพาะคนมีสิทธิ์เขียนข่าว
        // (news:write: team_leader/admin/super_admin/cell_leader — เพิ่ม
        // cell_leader ตามคำขอ 2026-08-25 รอบสอง, ดู migration
        // news_write_add_cell_leader) ตกลงใน grill-me 2026-08-25 ใช้
        // hiddenForRoles ซ่อนจาก role อื่นๆ เหมือนรายการอื่นในกลุ่มนี้ (ดู
        // "เช็คชื่อรายสัปดาห์"/"Lamb Info" ในกลุ่ม "สมาชิก") แทนที่จะย้ายไป
        // กลุ่ม Admin (superAdminOnly) เพราะหลายสิทธิ์ต้องเห็นเมนูนี้ ไม่ใช่
        // แค่ super_admin
        {
          title: "จัดการข่าว",
          url: "/news/table",
          icon: Table,
          hiddenForRoles: ["member", "visitor"],
        },
        {
          title: "รายการคำอธิษฐาน",
          url: "/prayer-list",
          icon: HandHeart,
        },
        {
          title: "แบบสำรวจของประทาน",
          url: "/spiritual-gifts-survey",
          icon: Sparkles,
        },
        // Public page (no login) where a lamb picks their name and
        // subscribes to push reminders — linked here so staff can reach it
        // quickly to test or share the link (grill-me follow-up,
        // 2026-08-12).
        // {
        //   title: "สมัครรับแจ้งเตือนเฝ้าเดี่ยว",
        //   url: "/subscribe",
        //   icon: BellPlus,
        // },
        // ต้อง login ถึงเข้าได้ (เปลี่ยนใจจาก public เดิม, ดู grill-me
        // 2026-08-13 + เปลี่ยนใจ 2026-08-13)
        {
          // เดิมชื่อ "พระคัมภีร์ (KJV)" — ตัด "(KJV)" ออก เหลือแค่
          // "พระคัมภีร์" เฉยๆ (ดู grill-me 2026-08-24) หน้า /bible เอง
          // (features/bible/index.tsx) ก็แก้หัวข้อให้ตรงกันด้วย
          title: "พระคัมภีร์",
          url: "/bible/1/1",
          icon: BookOpen,
        },
      ],
    },
    // Permission-gated admin tools — everything here redirects non-
    // super_admin visitors to /403 in its own route's beforeLoad (see
    // routes/_authenticated/user-roles, /personality-type currently isn't
    // gated but lives here anyway since it's config, not day-to-day data,
    // and /permissions). Grouped together per grill-me follow-up
    // 2026-08-17 (moved out of "General" — was previously mixed in there).
    // superAdminOnly ซ่อนทั้งกลุ่มนี้จาก sidebar + Cmd+K ให้คนที่ไม่ใช่
    // super_admin ตั้งแต่แรกเลย (ไม่ใช่แค่กันตอนกดเข้าแล้ว) — ตกลงใน
    // grill-me 2026-08-18 ดูการกรองจริงที่ useVisibleNavGroups()
    {
      title: "Admin",
      superAdminOnly: true,
      items: [
        {
          title: "User Roles",
          url: "/user-roles",
          icon: ShieldCheck,
        },
        {
          title: "Permissions",
          url: "/permissions",
          icon: KeyRound,
        },
        {
          title: "Personality Type",
          url: "/personality-type",
          icon: BrainCircuit,
        },
        {
          title: "เฝ้าเดี่ยว (ตาราง)",
          url: "/lamb-info/devotion/table",
          icon: Table,
        },
        // แผงตั้งเวลา + broadcast แจ้งเตือนเฝ้าเดี่ยวหาทุกคน แยกออกมาจาก
        // /settings/notifications เดิม (ตกลงใน grill-me 2026-08-18) — ต่างจาก
        // /subscribe ที่เป็นปุ่มรับแจ้งเตือนส่วนตัว (อยู่ใน dropdown โปรไฟล์
        // แทน ดู profile-dropdown.tsx)
        {
          title: "แจ้งเตือนเฝ้าเดี่ยว",
          url: "/devotion-reminders",
          icon: Bell,
        },
        // Dev tool สำรวจ YouVersion Platform API แบบสด (ดู grill-me
        // 2026-08-20) — ไม่ใช่ฟีเจอร์สำหรับสมาชิกทั่วไป จึงอยู่ในกลุ่ม Admin
        {
          title: "Bible API Tester",
          url: "/bible-api-tester",
          icon: FlaskConical,
        },
        // ย้ายมาจากกลุ่ม General เข้ากลุ่ม Admin ตามคำขอ (2026-08-21) — ยังอ่าน
        // สดผ่าน YouVersion Platform API เหมือนเดิม แค่เปลี่ยนตำแหน่งเมนู
        {
          title: "พระคัมภีร์ (Live)",
          url: "/bible-live/1/1",
          icon: BookOpen,
        },
      ],
    },
    // {
    //   title: "Pages",
    //   items: [
    //     {
    //       title: "Auth",
    //       icon: ShieldCheck,
    //       items: [
    //         {
    //           title: "Sign In",
    //           url: "/sign-in",
    //         },
    //         {
    //           title: "Sign In (2 Col)",
    //           url: "/sign-in-2",
    //         },
    //         {
    //           title: "Sign Up",
    //           url: "/sign-up",
    //         },
    //         {
    //           title: "Forgot Password",
    //           url: "/forgot-password",
    //         },
    //         {
    //           title: "OTP",
    //           url: "/otp",
    //         },
    //       ],
    //     },
    //     {
    //       title: "Errors",
    //       icon: Bug,
    //       items: [
    //         {
    //           title: "Unauthorized",
    //           url: "/errors/unauthorized",
    //           icon: Lock,
    //         },
    //         {
    //           title: "Forbidden",
    //           url: "/errors/forbidden",
    //           icon: UserX,
    //         },
    //         {
    //           title: "Not Found",
    //           url: "/errors/not-found",
    //           icon: FileX,
    //         },
    //         {
    //           title: "Internal Server Error",
    //           url: "/errors/internal-server-error",
    //           icon: ServerOff,
    //         },
    //         {
    //           title: "Maintenance Error",
    //           url: "/errors/maintenance-error",
    //           icon: Construction,
    //         },
    //       ],
    //     },
    //   ],
    // },
    // {
    //   title: "Other",
    //   items: [
    //     {
    //       title: "Settings",
    //       icon: Settings,
    //       items: [
    //         {
    //           title: "Profile",
    //           url: "/settings",
    //           icon: UserCog,
    //         },
    //         {
    //           title: "Account",
    //           url: "/settings/account",
    //           icon: Wrench,
    //         },
    //         {
    //           title: "Appearance",
    //           url: "/settings/appearance",
    //           icon: Palette,
    //         },
    //         {
    //           title: "Notifications",
    //           url: "/settings/notifications",
    //           icon: Bell,
    //         },
    //         {
    //           title: "Display",
    //           url: "/settings/display",
    //           icon: Monitor,
    //         },
    //       ],
    //     },
    //     {
    //       title: "Help Center",
    //       url: "/help-center",
    //       icon: HelpCircle,
    //     },
    //   ],
    // },
  ],
};
