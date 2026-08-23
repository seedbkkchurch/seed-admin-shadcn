import { type LinkProps } from "@tanstack/react-router";

type User = {
  name: string;
  email: string;
  avatar: string;
};

type Team = {
  name: string;
  logo: React.ElementType;
  plan: string;
};

type BaseNavItem = {
  title: string;
  badge?: string;
  icon?: React.ElementType;
  // ซ่อนรายการเมนูนี้ (ไม่ใช่ทั้งกลุ่มแบบ superAdminOnly) จาก role พวกนี้ —
  // ใช้กับ "เช็คชื่อรายสัปดาห์"/"Lamb Info" ที่ต้องซ่อนจาก member/visitor
  // แต่ item อื่นในกลุ่ม General เดียวกันยังโชว์ปกติ — กรองจริงที่
  // useVisibleNavGroups() (ดู grill-me 2026-08-23)
  hiddenForRoles?: string[];
};

type NavLink = BaseNavItem & {
  url: LinkProps["to"] | (string & {});
  items?: never;
};

type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps["to"] | (string & {}) })[];
  url?: never;
};

type NavItem = NavCollapsible | NavLink;

type NavGroup = {
  title: string;
  items: NavItem[];
  // ซ่อนทั้งกลุ่มจนกว่าจะยืนยันว่าเป็น super_admin — ดู
  // useVisibleNavGroups() ที่ AppSidebar และ CommandMenu ใช้กรองก่อน render
  // (grill-me 2026-08-18)
  superAdminOnly?: boolean;
};

type SidebarData = {
  user: User;
  teams: Team[];
  navGroups: NavGroup[];
};

export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink };
