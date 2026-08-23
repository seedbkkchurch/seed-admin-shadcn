import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { isIos, isStandalone, markIosStandaloneOAuthStart } from "@/lib/pwa";
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

  // เปิดใช้งานจริงแล้ว (grill-me 2026-08-17) — email ที่ verified แล้วตรง
  // กับบัญชี bulk-created เดิม (ทั้ง 40 บัญชี confirm หมด) จะถูก Supabase
  // auto-link เข้า auth.users.id เดิมให้อัตโนมัติ ไม่กระทบ lamb_info /
  // role / permission ที่ผูกไว้อยู่แล้ว ส่วนกรณี email ไม่ตรงกับใครเลย
  // (auth.users ใหม่ ไม่มี lamb_info ผูก) ถูกกันไว้ที่
  // _authenticated/route.tsx beforeLoad — signOut + เด้งไป /unregistered
  // ให้อัตโนมัติ ไม่ต้องเช็คซ้ำตรงนี้

  // Popup-based OAuth (grill-me 2026-08-23) — เดิม signInWithOAuth ทำ
  // full-page navigation ออกจากหน้าต่างปัจจุบันตรงๆ ซึ่งถ้าเรียกจาก
  // installed PWA (standalone window) จะพาหลุดออกจาก standalone shell เข้า
  // browser/Custom Tab เสมอ ไม่มีทาง "เด้งกลับเข้า standalone window เดิม"
  // ตรงๆ โดย spec (ยืนยันจาก Supabase OAuth docs — ไม่มี option ควบคุมพฤติกรรม
  // นี้) เปลี่ยนมาเปิด popup แยกต่างหากแทน — หน้าต่าง standalone เดิมไม่ขยับ
  // ไปไหนเลย รอรับ session ผ่าน BroadcastChannel-style postMessage จาก
  // /auth/popup-callback (ดู route นั้นประกอบ) ยกเว้น iOS standalone ที่
  // window.open() จาก home-screen web app ไม่การันตีพฤติกรรมตาม spec (บาง
  // เวอร์ชัน iOS เปิด popup จริง บางเวอร์ชัน hand off ไป Safari เหมือนเดิม)
  // เลยข้าม popup ไปใช้ full-page redirect เดิมตรงๆ แล้วชดเชยด้วยหน้า
  // "ปิดแท็บนี้แล้วเปิดจากโฮมสกรีน" ที่ /auth/popup-callback แทน (ดูฝั่ง
  // consumeIosStandaloneOAuthFlag ใน src/lib/pwa.ts)
  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);

    const popupCallbackUrl = `${window.location.origin}/auth/popup-callback`;

    if (isIos() && isStandalone()) {
      markIosStandaloneOAuthStart();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: popupCallbackUrl },
      });
      if (error) {
        toast.error(error.message);
        setIsGoogleLoading(false);
      }
      return;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: popupCallbackUrl, skipBrowserRedirect: true },
    });

    if (error || !data?.url) {
      toast.error(error?.message ?? "Something went wrong.");
      setIsGoogleLoading(false);
      return;
    }

    const popup = window.open(
      data.url,
      "google-oauth",
      "width=480,height=640,menubar=no,toolbar=no,location=yes,status=no",
    );

    if (!popup) {
      // Popup ถูกบล็อก — fallback เป็น full-page redirect ทันที (เสีย
      // standalone shell ไปก็ยังดีกว่า login ไม่ได้เลย)
      const { error: redirectError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: popupCallbackUrl },
      });
      if (redirectError) {
        toast.error(redirectError.message);
        setIsGoogleLoading(false);
      }
      return;
    }

    let settled = false;

    function handleMessage(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.data?.source !== "app-oauth-callback"
      ) {
        return;
      }
      settled = true;
      window.removeEventListener("message", handleMessage);
      window.clearInterval(pollClosed);
      setIsGoogleLoading(false);
      if (event.data.ok) {
        toast.success("Welcome back!");
        navigate({ to: redirectTo || "/", replace: true });
      } else {
        toast.error("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }
    }

    window.addEventListener("message", handleMessage);

    // ผู้ใช้ปิด popup เองก่อน auth เสร็จ (ไม่มี error event ให้ดักจับ) —
    // poll popup.closed เงียบๆ แล้ว reset loading state
    const pollClosed = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(pollClosed);
        if (!settled) {
          window.removeEventListener("message", handleMessage);
          setIsGoogleLoading(false);
        }
      }
    }, 500);
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

        <Button
          type="button"
          variant="outline"
          disabled={isGoogleLoading || isLoading}
          onClick={handleGoogleSignIn}
        >
          {isGoogleLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Sign in with Google
        </Button>
      </form>
    </Form>
  );
}
