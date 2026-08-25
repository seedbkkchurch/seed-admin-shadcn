import {
  LayoutDashboard,
  IdCard,
  Bell,
  ShieldCheck,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  HandHeart,
  HeartHandshake,
  Sparkles,
  BrainCircuit,
  NotebookPen,
  Table,
  ClipboardCheck,
  BookOpen,
  KeyRound,
  FlaskConical,
} from "lucide-react";
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
      name: "Shadcn Admin",
      logo: Command,
      plan: "Vite + ShadcnUI",
    },
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
  ],
  navGroups: [
    {
      title: "General",
      items: [
        {
          title: "Dashboard",
          url: "/",
          icon: LayoutDashboard,
        },
        // {
        //   title: "Chats",
        //   url: "/chats",
        //   badge: "3",
        //   icon: MessagesSquare,
        // },
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
          title: "เฝ้าเดี่ยว",
          url: "/lamb-info/devotion",
          icon: NotebookPen,
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
        {
          title: "Group Care",
          url: "/group-care",
          icon: HeartHandshake,
        },
        {
          title: "เช็คชื่อรายสัปดาห์",
          url: "/attendance",
          icon: ClipboardCheck,
          // เมนูคุมงานเช็คชื่อทั้งกลุ่มแคร์ — ไม่ใช่ของ member/visitor
          // (ดู /_authenticated/attendance, grill-me 2026-08-23)
          hiddenForRoles: ["member", "visitor"],
        },
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
