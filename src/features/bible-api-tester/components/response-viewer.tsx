import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type YouVersionProxyResponse } from "../data/queries";

type ResponseViewerProps = {
  response: YouVersionProxyResponse | undefined;
};

// แสดง raw JSON ที่ยิงกลับมาจาก Edge Function เท่านั้น — ไม่ persist ที่ไหน
// (ดู grill-me 2026-08-20 ข้อ 7) ปุ่ม copy มีไว้ให้ก็อปไปแปะใช้เองชั่วคราว
// ระหว่างทดสอบ ไม่ใช่ช่องทางเก็บถาวรในระบบ
export function ResponseViewer({ response }: ResponseViewerProps) {
  const [copied, setCopied] = useState(false);

  if (!response) {
    return (
      <p className="text-muted-foreground text-sm">
        ยังไม่มีผลลัพธ์ — กรอก path แล้วกด &quot;ยิง request&quot;
      </p>
    );
  }

  const pretty = JSON.stringify(response.body, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pretty);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={response.ok ? "default" : "destructive"}>
          {response.status}
        </Badge>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ms-auto"
          onClick={handleCopy}
        >
          {copied ? <Check /> : <Copy />}
          {copied ? "คัดลอกแล้ว" : "คัดลอก JSON"}
        </Button>
      </div>
      <ScrollArea className="h-[420px] rounded-md border">
        <pre className="p-4 text-xs whitespace-pre-wrap break-all">
          {pretty}
        </pre>
      </ScrollArea>
    </div>
  );
}
