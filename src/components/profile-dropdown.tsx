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
//
// เพิ่ม "เปลี่ยนรหัสผ่าน" ใน grill-me 2026-08-18 — ลิงก์ไป /change-password
// เดียวกับหน้าที่บังคับเปลี่ยนตอน login ครั้งแรก แต่เข้าแบบสมัครใจได้ทุกเมื่อ
// (หน้า /change-password เองแยกข้อความบังคับ/สมัครใจให้อัตโนมัติแล้ว ดู
// features/auth/change-password/index.tsx) เปลี่ยนได้แค่ของบัญชีตัวเอง
// เท่านั้น ไม่ใช่ admin reset ให้คนอื่น
//
// เพิ่ม "แจ้งเตือนเฝ้าเดี่ยว" ใน grill-me 2026-08-18 (รอบถัดมา) — ลิงก์ไป
// /subscribe (ปุ่มรับแจ้งเตือนส่วนตัว) แยกออกมาจากแผงควบคุมแอดมิน
// (DevotionReminderSettingsForm) ที่ตั้งเวลา/broadcast หาทุกคน ซึ่งย้ายไปอยู่
// เมนู Admin → /devotion-reminders แทน (super_admin เท่านั้น) — ทุกคนกดรับ
// แจ้งเตือนของตัวเองจากตรงนี้ได้ ไม่มีความเสี่ยงเรื่องสิทธิ์
//
// avatar ตรงปุ่มเปิด — เดิม hardcode src="/avatars/01.png" (path หลอกที่ไม่
// มีไฟล์จริง เลย 404 แล้ว fallback เป็นตัวอักษรเสมอ) เปลี่ยนมาใช้
// myLamb.profile_picture จริง (คอลัมน์ lamb_info.profile_picture, อัปโหลดผ่าน
// AvatarUpload บนหน้าโปรไฟล์ — ดู avatar-upload.tsx) ถ้ายังไม่เคยอัปโหลด
// (null) ก็ยังคง fallback เป็นตัวอักษรย่ออีเมลเหมือนเดิม ไม่ต้องเปลี่ยน UX
// (ดู grill-me 2026-08-24)
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
              {myLamb?.profile_picture && (
                <AvatarImage src={myLamb.profile_picture} alt={email} />
              )}
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
