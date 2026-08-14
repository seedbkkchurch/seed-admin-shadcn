import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";
import { ChangePassword } from "@/features/auth/change-password";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

// อยู่ใน _authenticated เพราะต้อง login (มี session ชั่วคราวด้วยรหัสผ่าน
// ตั้งต้น) ก่อนถึงเปลี่ยนรหัสผ่านได้ — route.tsx ของ _authenticated จะเด้งมา
// หน้านี้เองถ้า user_metadata.must_change_password ยังเป็น true (ยกเว้น path
// นี้เอง กันเด้งวน)
export const Route = createFileRoute("/_authenticated/change-password/")({
  component: ChangePassword,
  validateSearch: searchSchema,
});
