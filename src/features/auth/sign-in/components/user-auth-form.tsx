import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { Separator } from "@/components/ui/separator";

// ไอคอน Google แบบ inline SVG (ไม่มีใน lucide-react เพราะเป็น brand logo)
function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// จำ email ล่าสุดไว้ใน localStorage ตอน login สำเร็จ ถ้าติ๊ก "จำ email ไว้"
// ไว้ — ตกลงใน grill-me 2026-08-17 (checkbox แบบ opt-in ไม่ใช่จำอัตโนมัติ
// เพราะเครื่องอาจใช้ร่วมกันได้)
const REMEMBERED_EMAIL_KEY = "auth:remembered-email";

function getRememberedEmail(): string {
  try {
    return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === "" ? "Please enter your email." : undefined),
  }),
  password: z
    .string()
    .min(1, "Please enter your password.")
    .min(7, "Password must be at least 7 characters long."),
  rememberEmail: z.boolean(),
});

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string;
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: getRememberedEmail(),
      password: "",
      rememberEmail: getRememberedEmail() !== "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    try {
      if (data.rememberEmail) {
        window.localStorage.setItem(REMEMBERED_EMAIL_KEY, data.email);
      } else {
        window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
    } catch {
      // localStorage อาจใช้ไม่ได้ (private mode ฯลฯ) — ไม่ใช่เรื่องคอขวด
      // ของการ login ปล่อยผ่านเงียบๆ
    }

    toast.success("Welcome back!");
    const targetPath = redirectTo || "/";
    navigate({ to: targetPath, replace: true });
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="relative">
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
              <Link
                to="/forgot-password"
                className="absolute inset-e-0 -top-0.5 text-sm font-medium text-muted-foreground hover:opacity-75"
              >
                Forgot password?
              </Link>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rememberEmail"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="text-sm font-normal text-muted-foreground">
                จำ email ไว้
              </FormLabel>
            </FormItem>
          )}
        />
        <Button className="mt-2" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : <LogIn />}
          Sign in
        </Button>

        <div className="my-1 flex items-center gap-2">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">หรือ</span>
          <Separator className="flex-1" />
        </div>

        {/*
          เปิด Google provider ใน Supabase แล้ว (2026-08-17) แต่ยัง disable
          ปุ่มนี้ไว้ก่อน — ต้องออกแบบก่อนว่าบัญชี Google ที่ login เข้ามาใหม่
          จะผูกกับแถวใน lamb_info (auth_user_id) ที่มีอยู่แล้วยังไง เพราะ
          role/permission ทั้งระบบอิงจาก auth_user_id ตรงนี้ ถ้าเปิดใช้ก่อน
          ออกแบบ อาจสร้างบัญชีใหม่ที่ไม่มี lamb_info ผูกอยู่ (ดู grill-me
          2026-08-17). เอา disabled ออกแล้วเติม onClick ที่เรียก
          supabase.auth.signInWithOAuth({ provider: "google" }) ทีหลังตอน
          ออกแบบเสร็จ
        */}
        <Button type="button" variant="outline" disabled>
          <GoogleIcon />
          Sign in with Google
        </Button>
      </form>
    </Form>
  );
}
