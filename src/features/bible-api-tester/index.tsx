import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponseViewer } from "./components/response-viewer";
import { useYouVersionProxy } from "./data/queries";
import { YOUVERSION_PRESETS } from "./data/presets";

type ParamRow = { key: string; value: string };

// หน้า dev tool สำหรับสำรวจ YouVersion Platform API แบบสด ผ่าน Edge Function
// proxy "youversion-proxy" (เก็บ X-YVP-App-Key ไว้ฝั่ง server เท่านั้น) —
// ไม่ใช่ฟีเจอร์สำหรับสมาชิกทั่วไป จำกัดเฉพาะ super_admin เหมือนหน้าอื่นใน
// กลุ่มเมนู Admin (ดู route ในไฟล์คู่กันสำหรับ beforeLoad guard) เจตนาคือ
// "ทดสอบดูก่อน" ว่า endpoint ไหนใช้ได้จริง คืนอะไรบ้าง (เช่น มี THSV11 ให้
// ดึงเต็มข้อความไหม) — ไม่มีที่ไหนใน flow นี้ persist ผลลัพธ์ (ดู grill-me
// 2026-08-20 ข้อ 7) และห้ามนำข้อความที่ดึงมาได้ไปแปะไว้ที่อื่นในระบบ
// (README/comment ฯลฯ) เพราะยังเป็นเนื้อหาลิขสิทธิ์อยู่ดี แม้จะมาจาก API ที่
// มี license ก็ตาม
export function BibleApiTester() {
  const [path, setPath] = useState("bibles");
  const [paramRows, setParamRows] = useState<ParamRow[]>([
    { key: "language_ranges[]", value: "tha" },
  ]);

  const proxy = useYouVersionProxy();

  const applyPreset = (presetIndex: number) => {
    const preset = YOUVERSION_PRESETS[presetIndex];
    if (!preset) return;
    setPath(preset.path);
    setParamRows(preset.params.length > 0 ? preset.params : [{ key: "", value: "" }]);
  };

  const updateParamRow = (index: number, field: "key" | "value", value: string) => {
    setParamRows((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const addParamRow = () => setParamRows((rows) => [...rows, { key: "", value: "" }]);

  const removeParamRow = (index: number) =>
    setParamRows((rows) => rows.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = Object.fromEntries(
      paramRows.filter((row) => row.key.trim() !== "").map((row) => [row.key, row.value]),
    );
    proxy.mutate({ path: path.trim(), params });
  };

  return (
    <>
      <Header fixed>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Bible API Tester
          </h2>
          <p className="text-muted-foreground">
            เครื่องมือทดสอบ YouVersion Platform API (dev tool, super_admin
            เท่านั้น) — ยิง request สดผ่าน Edge Function proxy แล้วดู raw
            response ไม่มีการเก็บผลลัพธ์ไว้ที่ไหนทั้งสิ้น
          </p>
        </div>

        {!import.meta.env.VITE_SUPABASE_URL ? null : (
          <Alert>
            <AlertCircle />
            <AlertTitle>ต้องตั้งค่า secret ก่อนใช้งานจริง</AlertTitle>
            <AlertDescription>
              Edge Function ต้องมี secret ชื่อ YOUVERSION_APP_KEY (ได้จากการ
              สมัคร developers.youversion.com แล้วรอ approve) ถ้ายังไม่ได้ตั้ง
              จะเห็น error 500 ตอนกด &quot;ยิง request&quot;
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Request</CardTitle>
              <CardDescription>
                path ต่อจาก https://api.youversion.com/v1/ (ไม่ต้องมี &quot;/&quot;
                นำหน้า)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {YOUVERSION_PRESETS.map((preset, index) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => applyPreset(index)}
                    title={preset.description}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="path">Path</Label>
                  <Input
                    id="path"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="bibles"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Query params</Label>
                  {paramRows.map((row, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={row.key}
                        onChange={(e) => updateParamRow(index, "key", e.target.value)}
                        placeholder="key"
                      />
                      <Input
                        value={row.value}
                        onChange={(e) => updateParamRow(index, "value", e.target.value)}
                        placeholder="value"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParamRow(index)}
                      >
                        ลบ
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addParamRow}>
                    + เพิ่ม param
                  </Button>
                </div>

                <Button type="submit" disabled={proxy.isPending || !path.trim()}>
                  {proxy.isPending ? "กำลังยิง request..." : "ยิง request"}
                </Button>
              </form>

              {proxy.isError ? (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>เรียก Edge Function ไม่สำเร็จ</AlertTitle>
                  <AlertDescription>
                    {proxy.error instanceof Error
                      ? proxy.error.message
                      : "Something went wrong."}
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response</CardTitle>
              <CardDescription>raw JSON จาก YouVersion (ผ่าน proxy)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponseViewer response={proxy.data} />
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  );
}
