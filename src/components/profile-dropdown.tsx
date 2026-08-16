import { Link } from "@tanstack/react-router";
import useDialogState from "@/hooks/use-dialog-state";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useMyLamb } from "@/hooks/use-my-lamb";
import { useMyRoles } from "@/hooks/use-my-roles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { SignOutDialog } from "@/components/sign-out-dialog";

// ตกลงใน grill-me 2026-08-16 ("disable Setting แล้วก็ Profile เด้งไปหา
// lamb-profile ของคนๆนั้น แล้วก็บอก role ด้วย"):
// - "Settings" ปิดใช้งานถาวร (ยังไม่มีหน้า settings ที่ผูกกับ auth
//   user จริงๆ — ของเดิมลิงก์ไป /settings เฉยๆ ซึ่งไม่ได้ทำอะไรกับบัญชีที่
//   ล็อกอินอยู่)
// - "Profile" เปลี่ยนจาก /settings เดิม → ไปหน้าโปรไฟล์ลูกแกะจริงของคนที่
//   ล็อกอินอยู่ (/lamb-info/$lambId ผ่าน useMyLamb — ตัวกลางเดียวกับที่
//   MobileTabBar ใช้) ปิดใช้งานถ้าไม่มีลูกแกะผูกอยู่ (เช่น staff account)
//   เหมือน pattern เดิมใน mobile-tab-bar.tsx กันพาไปหน้าคนอื่นแบบผิดๆ
// - โชว์ role (useMyRoles) ใต้อีเมล — รวม super_admin hardcoded bypass
//   account ที่ไม่มีแถว lamb_info ผูกด้วย
export function ProfileDropdown() {
  const [open, setOpen] = useDialogState();
  const user = useAuthUser();
  const email = user?.email ?? "";
  const initials = email ? email.slice(0, 2).toUpperCase() : "??";

  const { data: myLamb } = useMyLamb();
  const { roleLabel } = useMyRoles();

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatars/01.png" alt={email} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1.5">
              <p className="text-xs leading-none text-muted-foreground">
                {email || "Signed in"}
              </p>
              {roleLabel && (
                <p className="text-xs leading-none font-medium">{roleLabel}</p>
              )}
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
              <DropdownMenuItem disabled>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem disabled>
              Settings
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setOpen(true)}>
            Sign out
            <DropdownMenuShortcut className="text-current">
              ⇧⌘Q
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  );
}
