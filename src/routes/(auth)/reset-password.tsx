import { createFileRoute } from "@tanstack/react-router";
import { ResetPassword } from "@/features/auth/reset-password";

// ปลายทางของลิงก์ resetPasswordForEmail() ใน forgot-password-form.tsx
// (redirectTo: `${origin}/reset-password`) — ต้องเพิ่ม URL นี้ใน Supabase
// Dashboard → Authentication → URL Configuration → Redirect URLs ด้วย
// (ทำผ่าน dashboard เท่านั้น ไม่ใช่ SQL/migration)
export const Route = createFileRoute("/(auth)/reset-password")({
  component: ResetPassword,
});
