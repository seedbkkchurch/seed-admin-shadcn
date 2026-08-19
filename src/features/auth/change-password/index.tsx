import { useSearch } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthUser } from "@/hooks/use-auth-user";
import { AuthLayout } from "../auth-layout";
import { ChangePasswordForm } from "./components/change-password-form";

// หน้านี้ใช้ได้สองทาง (ตกลงใน grill-me 2026-08-18):
// 1. ถูกบังคับมา — _authenticated/route.tsx เด้งมาเองถ้า
//    user_metadata.must_change_password ยังเป็น true (บัญชี bulk-created
//    ที่ยังไม่เคยเปลี่ยนรหัสผ่านตั้งต้น)
// 2. เข้ามาเองแบบสมัครใจ — จาก dropdown โปรไฟล์ (ProfileDropdown) ตอนไหนก็
//    ได้ที่ล็อกอินอยู่ อยากเปลี่ยนรหัสผ่านของตัวเองตามปกติ
// โชว์ข้อความคนละแบบตามเคส — เคส 1 ต้องอธิบายว่า "ทำไมถึงเด้งมาที่นี่"
// เคส 2 ไม่ต้องมีคำเตือนอะไร แค่เปลี่ยนรหัสผ่านปกติ
export function ChangePassword() {
  const { redirect: redirectTo } = useSearch({
    from: "/_authenticated/change-password/",
  });
  const user = useAuthUser();
  const isForced = user?.user_metadata?.must_change_password === true;

  return (
    <AuthLayout>
      <Card className="max-w-sm gap-4 sm:min-w-sm">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">
            {isForced ? "ต้องเปลี่ยนรหัสผ่านก่อนใช้งาน" : "เปลี่ยนรหัสผ่าน"}
          </CardTitle>
          <CardDescription>
            {isForced
              ? "บัญชีนี้ยังใช้รหัสผ่านตั้งต้นอยู่ กรุณาตั้งรหัสผ่านใหม่ก่อนเข้าใช้งานต่อ"
              : "ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm redirectTo={redirectTo} />
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
