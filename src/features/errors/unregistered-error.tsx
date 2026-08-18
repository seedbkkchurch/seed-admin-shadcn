import { useEffect } from "react";
import { UserX } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase/client";
import { Route as UnregisteredRoute } from "@/routes/(errors)/unregistered";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// แสดงตอน login สำเร็จ (ผ่าน Google หรือ provider อื่นในอนาคต) แต่ไม่มีแถว
// lamb_info ผูกกับ auth user นี้ — โชว์ email ที่พยายาม login เข้ามาด้วย
// ช่วยให้คนที่เผลอเลือกบัญชี Google ผิดรู้ตัวได้เอง ไม่ต้องไปกวนแอดมินโดย
// ไม่จำเป็น — ตกลงใน grill-me 2026-08-18
//
// signOut() ทำที่นี่ (ตอน mount) แทนที่จะทำใน _authenticated/route.tsx
// beforeLoad ก่อน throw redirect — เจอ bug จริงว่า await signOut() ก่อน
// throw ทำให้เกิด race กับ TanStack Router จน redirect หลุดไป /sign-in
// แทน /unregistered (ดู commit message เดียวกัน) ย้ายมาทำที่นี่แทนเพราะ
// ตอนนี้ component mount แปลว่า navigate ไปหน้านี้สำเร็จแล้วจริงๆ ไม่มี
// อะไรมาแย่ง navigation ได้อีก
export function UnregisteredError() {
  const navigate = useNavigate();
  const { email } = UnregisteredRoute.useSearch();

  useEffect(() => {
    void supabase.auth.signOut();
  }, []);

  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
        <div className="mb-2 flex size-16 items-center justify-center rounded-full bg-muted">
          <UserX className="size-8 text-muted-foreground" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          ไม่พบบัญชีของคุณในระบบ
        </h1>

        <p className="text-muted-foreground">
          เข้าสู่ระบบด้วยบัญชี Google สำเร็จ แต่ยังไม่มีข้อมูลสมาชิกที่ผูกกับ
          อีเมลนี้อยู่ในระบบ
        </p>

        {email && (
          <Badge variant="secondary" className="px-3 py-1 font-mono text-sm">
            {email}
          </Badge>
        )}

        <p className="text-sm text-muted-foreground">
          หากอีเมลด้านบนไม่ใช่บัญชีที่คุณตั้งใจใช้งาน ลองเข้าสู่ระบบใหม่ด้วย
          บัญชี Google ที่ลงทะเบียนไว้กับทีมแทน แต่ถ้าคิดว่านี่คือบัญชีที่
          ถูกต้องแล้ว กรุณาติดต่อผู้ดูแลระบบให้เพิ่มข้อมูลของคุณก่อนเข้าใช้งาน
        </p>

        <Button className="mt-4" onClick={() => navigate({ to: "/sign-in" })}>
          กลับไปหน้าเข้าสู่ระบบ
        </Button>
      </div>
    </div>
  );
}
