import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === "" ? "Please enter your email." : undefined),
  }),
});

// เดิมเป็น fake UI (sleep 2000ms แล้วพาไปหน้า /otp เฉยๆ ไม่มีการเรียก
// supabase จริง) — ตอนนี้เชื่อมกับ supabase.auth.resetPasswordForEmail()
// จริงแล้ว (ลิงก์ทางอีเมลมาตรฐานของ Supabase ไม่ใช่กรอก OTP 6 หลัก — ตกลงใน
// grill-me 2026-08-14 รอบเจ็ด, `rbac_design`/`auth_lamb_link_design`)
// redirectTo ชี้ไปหน้า /reset-password ที่ตั้งรหัสผ่านใหม่ — ต้องเพิ่ม URL
// นี้ใน Supabase Dashboard → Authentication → URL Configuration →
// Redirect URLs ด้วย ไม่งั้นลิงก์จะถูกปฏิเสธ (ทำให้ทาง dashboard เอง ไม่ใช่
// จาก SQL/migration ได้)
export function ForgotPasswordForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const [isLoading, setIsLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsLoading(false);

    // ไม่บอกว่า email มีอยู่ในระบบไหม (กัน enumeration) — โชว์ข้อความสำเร็จ
    // เดียวกันไม่ว่าจะเจอ error หรือไม่ ยกเว้น error จริงๆ ที่ไม่ใช่เรื่อง
    // "ไม่พบผู้ใช้" (เช่น rate limit) ค่อยโชว์ error ให้เห็น
    if (error && error.status !== 400 && error.status !== 404) {
      form.setError("email", { message: error.message });
      return;
    }

    setSentTo(data.email);
  }

  if (sentTo) {
    return (
      <div className={cn("grid gap-2 text-sm", className)}>
        <div className="text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="size-4" />
          ส่งลิงก์รีเซ็ตรหัสผ่านไปที่ {sentTo} แล้ว
        </div>
        <p className="text-muted-foreground">
          กดลิงก์ในอีเมลเพื่อตั้งรหัสผ่านใหม่ (ถ้าไม่เจอ ลองดูใน Spam)
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid gap-2", className)}
        {...props}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="mt-2" disabled={isLoading}>
          ส่งลิงก์รีเซ็ตรหัสผ่าน
          {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </form>
    </Form>
  );
}
