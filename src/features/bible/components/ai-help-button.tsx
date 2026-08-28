import { useState } from "react";
import { ChevronLeft, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  BIBLE_AI_PROMPT_TOPICS,
  buildBibleAiPrompt,
  type BibleAiPromptTopic,
} from "../lib/build-ai-help-prompt";

// ปุ่ม "อ่านไม่เข้าใจ อยากใช้ตัวช่วยไหม?" — ไอคอนเดียวข้างหัวข้อ [หนังสือ]
// บทที่ [X] กดแล้วเด้ง popover 2 ขั้น: (1) เลือกหัวข้อพรอมต์ที่จะศึกษา (4
// แบบ — ดู lib/build-ai-help-prompt.ts) (2) เลือกแอปที่จะส่งไป (ChatGPT/
// Gemini) แล้ว copy prompt ใส่ clipboard + เปิดแท็บใหม่ไปแอปนั้น ใช้ร่วมกัน
// ทั้ง BiblePanel ปกติและ BibleReadingMode (โหมดอ่านเต็มจอมือถือ) — ดู
// grill-me 2026-08-28 "อยากทำปุ่ม promt ที่กดแล้วเด้งไป gemini or chatGPT"
// (รอบแรกมีแค่หัวข้อประวัติศาสตร์หัวข้อเดียว + เลือกแอปขั้นเดียว รอบสอง
// ขยายเป็น 4 หัวข้อ + 2 ขั้นตอน, รอบสาม เพิ่มตัวเลือก "คัดลอกอย่างเดียว"
// ในแถวเดียวกับ ChatGPT/Gemini — ไม่เปิดแท็บไปแอปไหนเลย เผื่อคนอยากเอา
// พรอมต์ไปวางเองที่อื่น (แอป AI ตัวอื่น, โน้ต ฯลฯ) — ดู grill-me 2026-08-28
// "เพิ่มทางเลือก ให้สามารถ copy ข้อความโดยตรงได้เลย")
//
// ไม่มี URL scheme/API ทางการที่การันตีเติมข้อความในช่องพิมพ์ให้ (ลองจริง
// แล้วพบว่า Gemini/ChatGPT ไม่รับ ?q= เลยถ้าไม่มี browser extension ช่วย —
// ดู grill-me 2026-08-28 "เดียนี้มันเด้งไปหน้า gemini พร้อมข้อความไม่ได้
// หรอ") ทางที่ทำงานได้จริงคือ copy prompt ใส่ clipboard แล้วให้ผู้ใช้กด
// paste เอง — เน้นข้อความนี้ไว้ทั้งใน popover (ก่อนกด) และ toast (หลังกด)
// ไม่ใช่แค่ toast อย่างเดียวเพราะ toast หายเร็ว
//
// เปิดด้วย https URL ธรรมดา (ไม่ใช่ custom scheme) เพราะแอปมือถือทั้งสอง
// จดทะเบียนเป็น universal link กับโดเมนเว็บของตัวเองอยู่แล้ว และเรียก
// window.open "ก่อน" ค่อย copy clipboard (ไม่ await ก่อนเปิด) เพื่อไม่ให้
// เสีย user-gesture ที่ผูกกับ event คลิก (สลับลำดับผิดมาก่อน ทำให้แท็บที่
// เปิดเป็นเปล่า/popup blocker บล็อค — ดู grill-me 2026-08-28)
//
// lucide-react ไม่มีโลโก้จริงของ ChatGPT/Gemini — ใช้ตัวอักษรย่อ/ไอคอนใน
// วงกลมสีแทน (เหมือน pattern ปุ่ม LINE เดิมในแอปที่ใช้ตัวอักษร "LINE" แทน
// โลโก้จริง เลี่ยงปัญหาลิขสิทธิ์/ความไม่ตรง asset — ดู
// devotion-public/components/share-button.tsx)
type Step = "topic" | "app";

type AiApp = {
  id: string;
  label: string;
  badgeClassName: string;
  badgeContent: React.ReactNode;
  buildUrl: (prompt: string) => string;
};

const AI_APPS: AiApp[] = [
  {
    id: "chatgpt",
    label: "ChatGPT",
    badgeClassName: "bg-black text-white dark:bg-white dark:text-black",
    badgeContent: <span className="text-[10px] font-bold">GPT</span>,
    buildUrl: (prompt) =>
      `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
  },
  {
    id: "gemini",
    label: "Gemini",
    badgeClassName:
      "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white",
    badgeContent: <Sparkles className="size-4" />,
    buildUrl: (prompt) =>
      `https://gemini.google.com/app?q=${encodeURIComponent(prompt)}`,
  },
];

export function AiHelpButton({
  bookNameTh,
  chapter,
}: {
  bookNameTh: string;
  chapter: number;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("topic");
  const [selectedTopic, setSelectedTopic] = useState<BibleAiPromptTopic | null>(
    null,
  );

  const resetAndClose = () => {
    setOpen(false);
    setStep("topic");
    setSelectedTopic(null);
  };

  const copyPrompt = (prompt: string, successMessage: string) => {
    navigator.clipboard
      .writeText(prompt)
      .then(() => toast.success(successMessage))
      .catch(() => toast.error("คัดลอกพรอมต์ไม่สำเร็จ ลองวางข้อความเองนะ"));
  };

  const handlePickApp = (app: AiApp) => {
    if (!selectedTopic) return;
    const prompt = buildBibleAiPrompt(selectedTopic, bookNameTh, chapter);
    window.open(app.buildUrl(prompt), "_blank", "noopener,noreferrer");
    resetAndClose();
    copyPrompt(prompt, "คัดลอกพรอมต์แล้ว! ไปกดวาง (Paste) ในช่องแชทได้เลย");
  };

  // คัดลอกอย่างเดียว — ไม่เปิดแท็บไปแอปไหน (ดู grill-me 2026-08-28 "เพิ่ม
  // ทางเลือก ให้สามารถ copy ข้อความโดยตรงได้เลย")
  const handleCopyOnly = () => {
    if (!selectedTopic) return;
    const prompt = buildBibleAiPrompt(selectedTopic, bookNameTh, chapter);
    resetAndClose();
    copyPrompt(prompt, "คัดลอกพรอมต์แล้ว! วางที่ไหนก็ได้เลย");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setStep("topic");
          setSelectedTopic(null);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-teal-600 hover:text-teal-700 dark:text-teal-400"
          aria-label="อ่านไม่เข้าใจ อยากใช้ตัวช่วยไหม?"
        >
          <Sparkles className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        {step === "topic" ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              อ่านไม่เข้าใจ อยากใช้ตัวช่วยไหม?
            </p>
            <p className="text-xs text-muted-foreground">
              เลือกหัวข้อที่อยากให้ AI ช่วยอธิบาย
            </p>
            <div className="flex flex-col gap-1.5 pt-1">
              {BIBLE_AI_PROMPT_TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => {
                    setSelectedTopic(topic);
                    setStep("app");
                  }}
                  className="rounded-md border p-2 text-left transition-colors hover:bg-accent"
                >
                  <div className="text-sm font-medium">{topic.title}</div>
                  <div className="text-muted-foreground text-xs">
                    {topic.subtitle}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setStep("topic")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-3.5" />
              เลือกหัวข้ออื่น
            </button>
            <p className="text-sm font-medium">ส่งไปที่แอปไหน?</p>
            <p className="text-xs text-muted-foreground">
              ระบบจะคัดลอกพรอมต์ให้อัตโนมัติเสมอ — พอแอปเปิดขึ้น กดวาง (Paste)
              ในช่องแชทได้เลย หรือกด "คัดลอก" เพื่อเอาไปวางเองที่ไหน ก็ได้
            </p>
            <div className="flex justify-center gap-4 pt-1">
              {AI_APPS.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => handlePickApp(app)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full",
                      app.badgeClassName,
                    )}
                  >
                    {app.badgeContent}
                  </span>
                  <span className="text-xs">{app.label}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={handleCopyOnly}
                className="flex flex-col items-center gap-1.5"
              >
                <span className="flex size-11 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                  <Copy className="size-4" />
                </span>
                <span className="text-xs">คัดลอก</span>
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
