import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isIos, isStandalone } from "@/lib/pwa";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import { useMyLamb } from "@/hooks/use-my-lamb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// เดิมเป็นหน้า public ให้เลือกชื่อตัวเองจาก dropdown (Lamb ยังไม่มี account —
// ดู comment เดิมด้านล่าง) imports ที่เคยใช้:
//   import { useQuery } from "@tanstack/react-query";
//   import { supabase } from "@/lib/supabase/client";
//   import { lambDisplayName } from "@/features/lamb-info/data/devotion-schema";
//   import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// type LambOption = { id: string; nick_name: string | null; first_name: string; last_name: string };
// คอมเมนต์ไว้เป็น reference — ตอนนี้ auto-detect จาก auth ผ่าน useMyLamb()
// แทน, ย้ายหน้านี้เข้า _authenticated แล้ว (ตกลงใน grill-me 2026-08-14
// รอบเจ็ด, `rbac_design`/`auth_lamb_link_design`)
//
// เดิม: Public "who are you" page for the เฝ้าเดี่ยว push reminder (grill-me
// follow-up, 2026-08-12; simplified to one tap 2026-08-12) — pick your name
// from the church's ~50 members, that single selection *is* the user
// gesture that lets the browser show its permission dialog. ตอนนี้ปุ่มกด
// "รับการแจ้งเตือน" เป็น user gesture แทน (ต้อง login ก่อนอยู่แล้ว จึงรู้ lamb
// จาก auth ได้ทันที ไม่ต้องเลือกเอง)
export function Subscribe() {
  const [subscribed, setSubscribed] = useState(false);
  const { subscribe, status } = usePushSubscription();
  const { data: myLamb, isLoading, isResolvingUser, isError } = useMyLamb();

  const iosNotInstalled = isIos() && !isStandalone();

  // ต้องเรียกจาก click handler ตรงๆ ไม่มี await ก่อนหน้า subscribe() —
  // permission request ของ browser ต้องอยู่ใน "recent user gesture" window
  // ของคลิกปุ่มนี้เท่านั้นถึงจะโชว์ dialog ได้แน่นอน
  const handleSubscribeClick = () => {
    if (!myLamb) return;
    void (async () => {
      const result = await subscribe(myLamb.id);
      switch (result) {
        case "subscribed":
          setSubscribed(true);
          toast.success("รับการแจ้งเตือนแล้ว");
          break;
        case "permission-denied":
          toast.error("ต้องอนุญาตการแจ้งเตือนในเบราว์เซอร์ก่อนถึงจะใช้ได้");
          break;
        case "unsupported":
          toast.error("เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนแบบ push");
          break;
        case "error":
          toast.error("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
          break;
      }
    })();
  };

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>รับแจ้งเตือนเฝ้าเดี่ยว</CardTitle>
          <CardDescription>
            กดปุ่มด้านล่าง ระบบจะขออนุญาตแจ้งเตือนให้ทันที — จะมีข้อความเตือน
            ตอนเช้าและเย็น ถ้ายังไม่ได้ส่งเฝ้าเดี่ยววันนั้น
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {iosNotInstalled && (
            <p className="bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 rounded-md p-3 text-sm">
              บน iPhone ต้องติดตั้งแอปนี้ลงเครื่องก่อน (แตะปุ่มแชร์ แล้วเลือก
              &quot;เพิ่มไปยังหน้าจอโฮม&quot;) ถึงจะรับการแจ้งเตือนได้
            </p>
          )}

          {subscribed ? (
            <div className="text-emerald-700 dark:text-emerald-400 flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4" />
              รับการแจ้งเตือนเรียบร้อยแล้ว
            </div>
          ) : isResolvingUser || isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              กำลังโหลด...
            </div>
          ) : isError || !myLamb ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>ไม่พบลูกแกะที่ผูกกับบัญชีนี้</AlertTitle>
              <AlertDescription>
                บัญชีที่ล็อกอินอยู่ยังไม่ได้ผูกกับข้อมูลลูกแกะใน lamb_info —
                ติดต่อผู้ดูแลระบบ
              </AlertDescription>
            </Alert>
          ) : (
            <Button
              onClick={handleSubscribeClick}
              disabled={status === "subscribing"}
              className="w-full"
            >
              {status === "subscribing" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  กำลังสมัคร...
                </>
              ) : (
                `รับการแจ้งเตือน (${myLamb.nick_name || myLamb.first_name})`
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
