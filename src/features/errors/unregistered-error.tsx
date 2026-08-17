import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

// แสดงตอน login สำเร็จ (ผ่าน Google หรือ provider อื่นในอนาคต) แต่ไม่มีแถว
// lamb_info ผูกกับ auth user นี้ — session ถูก signOut ไปแล้วก่อนเด้งมาหน้านี้
// (ดู _authenticated/route.tsx beforeLoad) ตกลงใน grill-me 2026-08-17
export function UnregisteredError() {
  const navigate = useNavigate();
  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2 px-4">
        <h1 className="text-[4rem] leading-tight font-bold">
          บัญชีนี้ยังไม่ได้ลงทะเบียน
        </h1>
        <p className="text-center text-muted-foreground">
          บัญชีของคุณ login สำเร็จ แต่ยังไม่มีข้อมูลผูกไว้ในระบบ
          <br />
          กรุณาติดต่อแอดมินให้เพิ่มข้อมูลของคุณก่อนเข้าใช้งาน
        </p>
        <div className="mt-6 flex gap-4">
          <Button onClick={() => navigate({ to: "/sign-in" })}>
            กลับไปหน้าเข้าสู่ระบบ
          </Button>
        </div>
      </div>
    </div>
  );
}
