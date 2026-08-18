import {
  LayoutDashboard,
  Monitor,
  HelpCircle,
  IdCard,
  Bell,
  Palette,
  Settings,
  Wrench,
  UserCog,
  ShieldCheck,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  HandHeart,
  HeartHandshake,
  BrainCircuit,
  NotebookPen,
  Table,
  ClipboardCheck,
  BookOpen,
  KeyRound,
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
        },
        // ต้อง login ถึงเข้าได้ (เปลี่ยนใจจาก public เดิม, ดู grill-me
        // 2026-08-13 + เปลี่ยนใจ 2026-08-13)
        {
          title: "พระคัมภีร์ (KJV)",
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
    {
      title: "Admin",
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
    {
      title: "Other",
      items: [
        {
          title: "Settings",
          icon: Settings,
          items: [
            {
              title: "Profile",
              url: "/settings",
              icon: UserCog,
            },
            {
              title: "Account",
              url: "/settings/account",
              icon: Wrench,
            },
            {
              title: "Appearance",
              url: "/settings/appearance",
              icon: Palette,
            },
            {
              title: "Notifications",
              url: "/settings/notifications",
              icon: Bell,
            },
            {
              title: "Display",
              url: "/settings/display",
              icon: Monitor,
            },
          ],
        },
        {
          title: "Help Center",
          url: "/help-center",
          icon: HelpCircle,
        },
      ],
    },
  ],
};
