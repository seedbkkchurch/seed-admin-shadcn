import { useMutation } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

// รูปแบบ body ที่ Edge Function youversion-proxy รับ — path เป็น path ต่อจาก
// https://api.youversion.com/v1/ (ไม่ต้องมี "/" นำหน้า), params เป็น query
// string ธรรมดา ฝั่ง server เป็นคนแปะ host + version + X-YVP-App-Key ให้เอง
// (ดู grill-me 2026-08-20 ข้อ 6 — กันไม่ให้กลายเป็น open proxy)
export type YouVersionProxyRequest = {
  path: string;
  params: Record<string, string>;
};

export type YouVersionProxyResponse = {
  status: number;
  ok: boolean;
  body: unknown;
};

// ไม่ใช้ useQuery/cache เพราะเจตนาคือ "ยิงทีละครั้งตอนกดปุ่ม ดูผลสดๆ" ไม่ใช่
// ข้อมูลที่ควรถูก cache ไว้ (เนื้อหาที่ได้กลับมาอาจมีลิขสิทธิ์ — ดู grill-me
// 2026-08-20 ข้อ 7: ไม่เก็บ response ไว้ที่ไหนนอกจาก React state ชั่วคราวของ
// หน้านี้เอง หายเมื่อ refresh/ปิดหน้า)
export function useYouVersionProxy() {
  return useMutation({
    mutationFn: async (
      request: YouVersionProxyRequest,
    ): Promise<YouVersionProxyResponse> => {
      const { data, error } = await supabase.functions.invoke<YouVersionProxyResponse>(
        "youversion-proxy",
        { body: request },
      );

      if (error) {
        // supabase-js เวลา Edge Function ตอบกลับ non-2xx จะ throw
        // FunctionsHttpError ที่มี error.message เป็นข้อความทั่วไปแบบ "Edge
        // Function returned a non-2xx status code" — detail จริงที่ฟังก์ชัน
        // เราส่งกลับไป (เช่น "ยังไม่ได้ตั้ง YOUVERSION_APP_KEY", "Forbidden")
        // อยู่ใน error.context ซึ่งเป็น Response ต้อง .json() แยกอีกที (แก้
        // ตาม grill-me follow-up 2026-08-20 ที่เจอ error message ทึบ)
        if (error instanceof FunctionsHttpError) {
          let message = error.message;
          try {
            const details = (await error.context.json()) as { error?: string };
            if (details?.error) message = details.error;
          } catch {
            // parse ไม่ได้ (เช่น context ไม่ใช่ JSON) — ใช้ error.message เดิม
          }
          throw new Error(message);
        }
        throw error;
      }
      if (!data) throw new Error("Edge Function ไม่คืนข้อมูลกลับมา");
      return data;
    },
  });
}
