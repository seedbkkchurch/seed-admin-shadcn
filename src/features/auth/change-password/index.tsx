import { useSearch } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthLayout } from "../auth-layout";
import { ChangePasswordForm } from "./components/change-password-form";

export function ChangePassword() {
  const { redirect: redirectTo } = useSearch({
    from: "/_authenticated/change-password/",
  });

  return (
    <AuthLayout>
      <Card className="max-w-sm gap-4 sm:min-w-sm">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">
            ต้องเปลี่ยนรหัสผ่านก่อนใช้งาน
          </CardTitle>
          <CardDescription>
            บัญชีนี้ยังใช้รหัสผ่านตั้งต้นอยู่ กรุณาตั้งรหัสผ่านใหม่ก่อนเข้าใช้งานต่อ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm redirectTo={redirectTo} />
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
