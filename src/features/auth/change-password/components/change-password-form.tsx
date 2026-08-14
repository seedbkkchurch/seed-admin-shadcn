import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { PasswordInput } from "@/components/password-input";

const formSchema = z
  .object({
    password: z
      .string()
      .min(7, "Password must be at least 7 characters long.")
      .refine((v) => v !== "1234567", {
        message: "กรุณาตั้งรหัสผ่านใหม่ที่ไม่ใช่รหัสผ่านตั้งต้น",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

interface ChangePasswordFormProps
  extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string;
}

// บังคับตั้งรหัสผ่านใหม่ตอน login ครั้งแรก — ทุกบัญชีที่สร้างแบบ bulk เริ่ม
// จากรหัสผ่านเดียวกัน (1234567, raw_user_meta_data.must_change_password =
// true) ตกลงใน grill-me 2026-08-14 รอบเจ็ด (`auth_lamb_link_design`) หน้านี้
// เชื่อมกับ guard ใน src/routes/_authenticated/route.tsx ที่เด้งผู้ใช้มาที่นี่
// อัตโนมัติถ้า flag ยังเป็น true และยังพยายามเข้าหน้าอื่นอยู่
export function ChangePasswordForm({
  className,
  redirectTo,
  ...props
}: ChangePasswordFormProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

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

    toast.success("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
    navigate({ to: redirectTo || "/", replace: true });
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
        <Button className="mt-2" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : <KeyRound />}
          เปลี่ยนรหัสผ่าน
        </Button>
      </form>
    </Form>
  );
}
