import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { isIos, isStandalone } from "@/lib/pwa";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import { lambDisplayName } from "@/features/lamb-info/data/devotion-schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LambOption = {
  id: string;
  nick_name: string | null;
  first_name: string;
  last_name: string;
};

// Public "who are you" page for the เฝ้าเดี่ยว push reminder (grill-me
// follow-up, 2026-08-12; simplified to one tap 2026-08-12). Lambs don't
// have accounts yet, so this is a deliberately low-security stand-in: pick
// your name from the church's ~50 members — that single selection *is* the
// user gesture that lets the browser show its permission dialog, so there's
// no separate "subscribe" button to tap afterward. Reads from the
// `lamb_directory` view (id + display name only — not the full lamb_info
// table, which stays authenticated-only) so this works for the anon role.
export function Subscribe() {
  const [lambId, setLambId] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { subscribe, status } = usePushSubscription();

  const { data: lambs, isPending } = useQuery({
    queryKey: ["lamb-directory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lamb_directory")
        .select("id, nick_name, first_name, last_name");
      if (error) throw error;
      return data as LambOption[];
    },
  });

  const iosNotInstalled = isIos() && !isStandalone();

  // Called straight from the Select's onValueChange — this MUST run with no
  // `await` before the permission request inside `subscribe()`, since that
  // request only reliably shows a dialog while still inside the browser's
  // "recent user gesture" window that the selection click just opened.
  const handleSelect = (value: string) => {
    setLambId(value);
    void (async () => {
      const result = await subscribe(value);
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
            เลือกชื่อของคุณ ระบบจะขออนุญาตแจ้งเตือนให้ทันที — จะมีข้อความเตือน
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
          ) : (
            <Select
              value={lambId}
              onValueChange={handleSelect}
              disabled={isPending || status === "subscribing"}
            >
              <SelectTrigger className="w-full">
                {status === "subscribing" ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    กำลังสมัคร...
                  </span>
                ) : (
                  <SelectValue
                    placeholder={isPending ? "กำลังโหลด..." : "เลือกชื่อของคุณ"}
                  />
                )}
              </SelectTrigger>
              <SelectContent>
                {lambs?.map((lamb) => (
                  <SelectItem key={lamb.id} value={lamb.id}>
                    {lambDisplayName(lamb)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
