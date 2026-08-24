import { Link } from "@tanstack/react-router";
import { ChevronsUpDown, LogOut } from "lucide-react";
import useDialogState from "@/hooks/use-dialog-state";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useMyLamb } from "@/hooks/use-my-lamb";
import { useMyRoles } from "@/hooks/use-my-roles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { SignOutDialog } from "@/components/sign-out-dialog";

// ปุ่มมุมซ้ายล่างของ sidebar — เดิมรับ props เป็น sidebarData.user ซึ่งเป็น
// ข้อมูลหลอกจาก template เดิม ("satnaing"/"satnaingdev@gmail.com"/"SN") ไม่
// เคยต่อ auth เลย ต่างจาก ProfileDropdown ที่หัว page (ปุ่มขวาบน) ที่ดึงข้อมูล
// จริงถูกต้องอยู่แล้ว — ตอนนี้แก้ให้ NavUser ดึงข้อมูลจริงเองเหมือนกัน
// (useAuthUser/useMyLamb/useMyRoles) และเปลี่ยนเมนูในนั้นให้ตรงกับ
// ProfileDropdown ทุกอย่าง (Profile/Settings/แจ้งเตือนเฝ้าเดี่ยว/
// เปลี่ยนรหัสผ่าน/Sign out) แทนเมนู demo เดิม (Upgrade to Pro/Account/
// Billing/Notifications) — ตัด props `user` ออก ไม่มีใครส่งอย่างอื่นเข้ามา
// นอกจาก AppSidebar อยู่แล้ว (ดู grill-me 2026-08-24)
//
// บรรทัดชื่อ/อีเมล: บรรทัดบน (ตัวหนา) = ชื่อลูกแกะ (nick_name ก่อน ไม่มีค่อย
// ต่อชื่อ-นามสกุล) ต่างจาก ProfileDropdown ที่ไม่มีชื่อลูกแกะเลย (มีแค่
// อีเมล+role) เพราะที่นี่มีพื้นที่ให้โชว์ได้ 2 บรรทัดอยู่แล้วจาก layout เดิม
// — บัญชีที่ไม่มีลูกแกะผูก (เช่น staff/super_admin bypass) fallback ไปโชว์
// roleLabel หรืออีเมลแทน
//
// avatar: ใช้ myLamb.profile_picture จริง (เหมือนที่แก้ ProfileDropdown คู่
// กัน) ตัวอักษร fallback ใช้ 2 ตัวแรกของอีเมล (logic เดียวกับ
// ProfileDropdown) แทนตัวอักษร "SN" แข็งๆ เดิม
export function NavUser() {
  const { isMobile } = useSidebar();
  const [open, setOpen] = useDialogState();

  const authUser = useAuthUser();
  const email = authUser?.email ?? "";
  const initials = email ? email.slice(0, 2).toUpperCase() : "??";

  const { data: myLamb } = useMyLamb();
  const { roleLabel } = useMyRoles();

  const displayName =
    myLamb?.nick_name ||
    (myLamb ? `${myLamb.first_name} ${myLamb.last_name}`.trim() : "") ||
    roleLabel ||
    email ||
    "ผู้ใช้";

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  {myLamb?.profile_picture && (
                    <AvatarImage
                      src={myLamb.profile_picture}
                      alt={displayName}
                    />
                  )}
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {displayName}
                  </span>
                  <span className="truncate text-xs">{email}</span>
                </div>
                <ChevronsUpDown className="ms-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    {myLamb?.profile_picture && (
                      <AvatarImage
                        src={myLamb.profile_picture}
                        alt={displayName}
                      />
                    )}
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {displayName}
                    </span>
                    <span className="truncate text-xs">{email}</span>
                    {roleLabel && (
                      <span className="truncate text-xs text-muted-foreground">
                        {roleLabel}
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {myLamb ? (
                  <DropdownMenuItem asChild>
                    <Link to="/lamb-info/$lambId" params={{ lambId: myLamb.id }}>
                      Profile
                      <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem>
                    Profile
                    <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem disabled>
                  Settings
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/subscribe">แจ้งเตือนเฝ้าเดี่ยว</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/change-password">เปลี่ยนรหัสผ่าน</Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setOpen(true)}
              >
                <LogOut />
                Sign out
                <DropdownMenuShortcut className="text-current">
                  ⇧⌘Q
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  );
}
