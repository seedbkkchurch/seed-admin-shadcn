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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// จำ email/เบอร์ ล่าสุดไว้ใน localStorage ตอน login สำเร็จ ถ้าติ๊ก "จำอีเมล/
// เบอร์ไว้" — ตกลงใน grill-me 2026-08-17 (checkbox แบบ opt-in ไม่ใช่จำ
// อัตโนมัติ เพราะเครื่องอาจใช้ร่วมกันได้) ตั้งแต่ grill-me 2026-11-24 เก็บ
// สิ่งที่ผู้ใช้พิมพ์ตรงๆ จะเป็นอีเมลหรือเบอร์ก็ได้ (key เดิม ค่าเดิมที่เป็น
// อีเมลยังใช้ต่อได้)
const REMEMBERED_EMAIL_KEY = "auth:remembered-email";

function getRememberedEmail(): string {
  try {
    return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

// เข้าสู่ระบบด้วยเบอร์โทร (grill-me 2026-11-24) — ช่องเดียวรับได้ทั้งอีเมล
// และเบอร์: มี "@" = อีเมล (signInWithPassword ตรงเหมือนเดิม) ไม่มี = เบอร์
// ส่งไป Edge Function `phone-sign-in` ซึ่งหาอีเมลจริงของบัญชีฝั่ง server
// แล้วคืนแค่ session (อีเมลไม่เคยลงมาที่ client) บัญชีที่ยังใช้รหัสเริ่มต้น
// (must_change_password) ต้องยืนยันวันเกิดเพิ่ม เฉพาะทางเบอร์เท่านั้น
function isEmailIdentifier(value: string) {
  return value.includes("@");
}

type PhoneSignInResponse =
  | { ok: true; session: { access_token: string; refresh_token: string } }
  | { ok: false; code: string };

// แยกข้อความตามกรณีตามที่ตกลงกัน (ไม่ใช้ข้อความรวมแบบหน้าลืมรหัสผ่าน)
const PHONE_SIGN_IN_MESSAGES: Record<string, string> = {
  phone_not_found: "ไม่พบเบอร์นี้ในระบบ ลองเบอร์อื่น หรือติดต่อผู้ดูแล",
  no_account: "เบอร์นี้ยังไม่มีบัญชีเข้าใช้งาน กรุณาติดต่อผู้ดูแล",
  google_only:
    "บัญชีนี้เข้าสู่ระบบด้วย Google กรุณากดปุ่ม Sign in with Google",
  wrong_password: "รหัสผ่านไม่ถูกต้อง",
  birthday_mismatch: "วันเกิดไม่ตรงกับในระบบ",
  no_birthday_on_file: "ยังไม่มีวันเกิดของคุณในระบบ กรุณาติดต่อผู้ดูแล",
  rate_limited: "มีการเข้าสู่ระบบถี่เกินไป กรุณารอสักครู่แล้วลองใหม่",
};
const SIGN_IN_FAILED_MESSAGE = "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];
const BUDDHIST_ERA_OFFSET = 543;
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1));
// ปี พ.ศ. ย้อนจากปีปัจจุบันไป 100 ปี เรียงใหม่ → เก่า
const YEAR_BE_OPTIONS = (() => {
  const currentBe = new Date().getFullYear() + BUDDHIST_ERA_OFFSET;
  return Array.from({ length: 101 }, (_, i) => String(currentBe - i));
})();

// วัน/เดือน/ปี พ.ศ. จาก dropdown → "YYYY-MM-DD" ค.ศ. (รูปแบบเดียวกับ
// lamb_info.birthday) หรือ null ถ้าวันที่ไม่มีจริง เช่น 31 กุมภาพันธ์
function toIsoBirthday(day: string, month: string, yearBe: string) {
  const d = Number(day);
  const m = Number(month);
  const y = Number(yearBe) - BUDDHIST_ERA_OFFSET;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const formSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "กรุณากรอกอีเมลหรือเบอร์โทรศัพท์")
    .refine(
      (value) =>
        isEmailIdentifier(value)
          ? z.email().safeParse(value).success
          : value.replace(/\D/g, "").length >= 8,
      { message: "รูปแบบอีเมลหรือเบอร์โทรศัพท์ไม่ถูกต้อง" },
    ),
  password: z
    .string()
    .min(1, "Please enter your password.")
    .min(7, "Password must be at least 7 characters long."),
  rememberEmail: z.boolean(),
  birthDay: z.string(),
  birthMonth: z.string(),
  birthYear: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

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
  // true หลัง phone-sign-in ตอบ needs_birthday — แสดง dropdown วันเกิด
  const [needsBirthday, setNeedsBirthday] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: getRememberedEmail(),
      password: "",
      rememberEmail: getRememberedEmail() !== "",
      birthDay: "",
      birthMonth: "",
      birthYear: "",
    },
  });

  function finishSignIn(data: FormValues) {
    try {
      if (data.rememberEmail) {
        window.localStorage.setItem(REMEMBERED_EMAIL_KEY, data.identifier);
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

  async function signInWithEmail(data: FormValues) {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.identifier,
      password: data.password,
    });

    if (error) {
      toast.error(
        error.code === "invalid_credentials"
          ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
          : error.status === 429
            ? PHONE_SIGN_IN_MESSAGES.rate_limited
            : error.message,
      );
      return;
    }

    finishSignIn(data);
  }

  async function signInWithPhone(data: FormValues) {
    let birthday: string | undefined;
    if (needsBirthday) {
      if (!data.birthDay || !data.birthMonth || !data.birthYear) {
        form.setError("birthYear", { message: "กรุณาเลือกวันเกิดให้ครบ" });
        return;
      }
      const iso = toIsoBirthday(data.birthDay, data.birthMonth, data.birthYear);
      if (!iso) {
        form.setError("birthYear", { message: "ไม่มีวันที่นี้ในปฏิทิน" });
        return;
      }
      birthday = iso;
    }

    const { data: result, error } =
      await supabase.functions.invoke<PhoneSignInResponse>("phone-sign-in", {
        body: { phone: data.identifier, password: data.password, birthday },
      });

    if (error || !result) {
      toast.error(SIGN_IN_FAILED_MESSAGE);
      return;
    }

    if (!result.ok) {
      if (result.code === "needs_birthday") {
        setNeedsBirthday(true);
        return;
      }
      toast.error(PHONE_SIGN_IN_MESSAGES[result.code] ?? SIGN_IN_FAILED_MESSAGE);
      return;
    }

    const { error: sessionError } = await supabase.auth.setSession(
      result.session,
    );
    if (sessionError) {
      toast.error(SIGN_IN_FAILED_MESSAGE);
      return;
    }

    finishSignIn(data);
  }

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      if (isEmailIdentifier(data.identifier)) {
        await signInWithEmail(data);
      } else {
        await signInWithPhone(data);
      }
    } finally {
      setIsLoading(false);
    }
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
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>อีเมล หรือ เบอร์โทรศัพท์</FormLabel>
              <FormControl>
                <Input
                  placeholder="name@example.com หรือ 0812345678"
                  autoComplete="username"
                  {...field}
                  onChange={(event) => {
                    field.onChange(event);
                    // เปลี่ยนเบอร์/อีเมลแล้ว ขั้นยืนยันวันเกิดของเบอร์เดิมไม่
                    // เกี่ยวแล้ว — ซ่อนกลับ ให้ server ถามใหม่ถ้าจำเป็น
                    if (needsBirthday) setNeedsBirthday(false);
                  }}
                />
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
        {needsBirthday && (
          <div className="grid gap-2 rounded-md border border-dashed p-3">
            <p className="text-sm font-medium">วันเกิด</p>
            <p className="text-xs text-muted-foreground">
              เข้าด้วยเบอร์ครั้งแรก กรุณายืนยันวันเกิด
            </p>
            <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-2">
              <FormField
                control={form.control}
                name="birthDay"
                render={({ field }) => (
                  <FormItem>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full" aria-label="วัน">
                          <SelectValue placeholder="วัน" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DAY_OPTIONS.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthMonth"
                render={({ field }) => (
                  <FormItem>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full" aria-label="เดือน">
                          <SelectValue placeholder="เดือน" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {THAI_MONTHS.map((month, index) => (
                          <SelectItem key={month} value={String(index + 1)}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthYear"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.clearErrors("birthYear");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full" aria-label="ปี พ.ศ.">
                          <SelectValue placeholder="ปี พ.ศ." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {YEAR_BE_OPTIONS.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            {form.formState.errors.birthYear?.message && (
              <p className="text-sm text-destructive">
                {form.formState.errors.birthYear.message}
              </p>
            )}
          </div>
        )}
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
                จำอีเมล/เบอร์ไว้
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
