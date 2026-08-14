import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthLayout } from "../auth-layout";
import { ResetPasswordForm } from "./components/reset-password-form";

export function ResetPassword() {
  return (
    <AuthLayout>
      <Card className="max-w-sm gap-4 sm:min-w-sm">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">
            ตั้งรหัสผ่านใหม่
          </CardTitle>
          <CardDescription>กรอกรหัสผ่านใหม่ที่ต้องการใช้</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
