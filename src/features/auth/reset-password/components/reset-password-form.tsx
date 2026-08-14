import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/password-input";

const formSchema = z
  .object({
    password: z.string().min(7, "Password must be at least 7 characters long."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

// หน้านี้เป็นปลายทางของลิงก์รีเซ็ตรหัสผ่านที่ supabase ส่งทางอีเมล (จาก
// resetPasswordForEmail ใน forgot-password-form.tsx) — supabase client จะ
// อ่าน token จาก URL hash แล้วสร้าง session ชั่วคราวให้อัตโนมัติ (event
// PASSWORD_RECOVERY) เราแค่รอ session นั้นแล้วให้ผู้ใช้ตั้งรหัสผ่านใหม่ผ่าน
// updateUser() — ไม่ใช่หน้า public ทั่วไปที่กรอกอีเมล/รหัสเดิม
export function ResetPasswordForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) setHasRecoverySession(!!data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" || session) {
          setHasRecoverySession(true);
        }
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: data.password,
      data: { must_change_password: false },
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว");
    navigate({ to: "/", replace: true });
  }

  if (hasRecoverySession === false) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle />
        <AlertTitle>ลิงก์นี้หมดอายุหรือใช้ไปแล้ว</AlertTitle>
        <AlertDescription>
          กรุณากดขอลิงก์รีเซ็ตรหัสผ่านใหม่จากหน้า "ลืมรหัสผ่าน" อีกครั้ง
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid gap-3", className)}
        {...props}
      >
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>รหัสผ่านใหม่</FormLabel>
              <FormControl>
                <PasswordInput placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ยืนยันรหัสผ่านใหม่</FormLabel>
              <FormControl>
                <PasswordInput placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          className="mt-2"
          disabled={isLoading || hasRecoverySession !== true}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <KeyRound />}
          ตั้งรหัสผ่านใหม่
        </Button>
      </form>
    </Form>
  );
}
