import { useEffect, useRef, useState } from "react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { AlertCircle, Eraser, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { ConfigDrawer } from "@/components/config-drawer";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { BibleQuickReferenceSheet } from "@/features/bible/components/bible-quick-reference-sheet";
import { useMyLamb } from "@/hooks/use-my-lamb";
import { cn } from "@/lib/utils"; 
// เดิมมี Select ให้เลือกลูกแกะเอง (ดู commit ก่อนหน้า grill-me 2026-08-14
// รอบเจ็ด, `rbac_design`/`auth_lamb_link_design`) — imports ที่เคยใช้:
//   import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
//   import { useLambNameOptions } from "./data/queries";
//   import { lambDisplayName } from "./data/devotion-schema";
// คอมเมนต์ไว้เป็น reference — ตอนนี้ auto-detect จาก auth ผ่าน useMyLamb() แทน
import { ArticleEditor, type ArticleEditorHandle } from "./components/article-editor";
import { uploadDevotionImage } from "@/lib/supabase/devotion-image";
import {
  useCreateLambDevotion,
  useLambDevotionDetail,
  useUpdateLambDevotion,
} from "./data/queries";
import {
  devotionContentTypeOptions,
  lambDisplayName,
  type DevotionContentType,
  type LambDevotionRow,
} from "./data/devotion-schema";
import {
  clearDevotionEditorDraft,
  loadDevotionEditorDraft,
  saveDevotionEditorDraft,
} from "./lib/devotion-draft-storage";

function extractImageUrls(html: string): string[] {
  const matches = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)];
  return matches.map((m) => m[1]);
}

function isEmptyHtml(value: string) {
  return value.trim().length === 0 || value === "<p></p>";
}

// Medium-style เฝ้าเดี่ยว (daily devotion) writer — a title plus a rich
// text body that can have images inserted inline, submitted with a single
// button. Persists to the real `lamb_devotion` table (see
// docs/devotion-db-design.md for the schema). ส่งได้ไม่จำกัดจำนวนครั้ง/วัน
// (คอนสตรเทนต์ 1 ครั้ง/วันเอาออกแล้ว — ดู grill-me 2026-08-14,
// `devotion_multi_submit_design`).
//
// "ส่งในนามของ" — เดิมเป็น Select ให้เลือกลูกแกะเอง (stand-in ตอนยังไม่มี
// per-user auth จริง — ดู comment คอมเมนต์ imports ด้านบน) ตอนนี้ auto-detect
// จาก auth ผ่าน useMyLamb() แทนแล้ว (ตกลงใน grill-me 2026-08-14 รอบเจ็ด,
// `rbac_design`/`auth_lamb_link_design`) — ทุกลูกแกะที่มี email มี auth
// account ผูกไว้แล้ว (bulk-create ตอน migration) จึงคาดว่า useMyLamb() จะ
// resolve ได้เกือบทุกครั้ง กรณีไม่มี (เช่น staff account ที่ไม่ใช่ลูกแกะจริง)
// แสดง error state แทนการปล่อยให้ส่งได้โดยไม่มี lamb_id
export function DevotionEditor() {
  const navigate = useNavigate();
  const editorRef = useRef<ArticleEditorHandle>(null);
  // Stable for the component's lifetime — used both for the draft's
  // "day stamp" and the submitted devotion_date, so a draft started right
  // before midnight can't end up saved under a different day than it was
  // restored/expired against.
  const [today] = useState(() => new Date());

  // กู้ร่างที่ค้างไว้ (ถ้ามีและยังไม่ข้ามวัน) ครั้งเดียวตอน mount — เผลอ
  // รีเฟรชระหว่างเขียนแล้วไม่ต้องเขียนใหม่ (ดู grill-me 2026-08-14,
  // `devotion_multi_submit_design`)
  const [initialDraft] = useState(() => loadDevotionEditorDraft(today));

  const {
    data: myLamb,
    isLoading: isMyLambLoading,
    isResolvingUser: isMyLambResolvingUser,
    isError: isMyLambError,
  } = useMyLamb();
  const lambId = myLamb?.id;
  const [title, setTitle] = useState(initialDraft?.title ?? "");
  // เพิ่งออกจากช่องหัวข้อไปครั้งแรกหรือยัง — ใช้คุมว่าข้อความเตือน "ลืมใส่
  // หัวข้อ" ควรโผล่หรือไม่ (โผล่หลัง blur ครั้งแรกที่ยังว่างอยู่เท่านั้น
  // ไม่ใช่ตั้งแต่เปิดหน้ามา จะได้ไม่น่ารำคาญ — ดู grill-me 2026-08-13)
  const [titleTouched, setTitleTouched] = useState(false);
  const [html, setHtml] = useState(initialDraft?.html ?? "");
  const [isPublic, setIsPublic] = useState(initialDraft?.isPublic ?? true);
  // เฝ้าเดี่ยว/คำเทศนา — เพิ่มโดย grill-me 2026-08-26, default เฝ้าเดี่ยวเสมอ
  // (ตัวเลือกส่วนน้อย เลือกเองตอนต้องการ)
  const [contentType, setContentType] = useState<DevotionContentType>(
    initialDraft?.contentType ?? "devotion",
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // แยกจาก `html` ที่ไหลตาม onChangeHtml ทุกคีย์สโตรก — ค่านี้ใช้เป็น
  // initialContent ตอน (re)mount ของ ArticleEditor เท่านั้น (กู้ร่างตอนเปิด
  // หน้าครั้งแรก, หรือรีเซ็ตเป็นค่าว่างตอนกด Clear) ส่วน editorResetKey
  // บังคับ ArticleEditor remount ใหม่หลัง Clear (ตัว editor เองไม่มี API
  // ให้ล้างเนื้อหาจากภายนอก ดู article-editor.tsx)
  const [editorInitialContent, setEditorInitialContent] = useState(
    initialDraft?.html ?? "",
  );
  const [editorResetKey, setEditorResetKey] = useState(0);

  const createDevotion = useCreateLambDevotion();

  // บันทึกร่างทุกครั้งที่ฟิลด์เปลี่ยน — ข้ามการเขียนตอนทุกอย่างยังว่างเปล่า
  // (เปิดหน้ามาเฉยๆ ไม่ต้องสร้างร่างว่างทิ้งไว้ใน localStorage)
  useEffect(() => {
    if (!lambId && title.trim() === "" && isEmptyHtml(html)) return;
    saveDevotionEditorDraft(
      { lambId, title, html, isPublic, contentType },
      today,
    );
  }, [lambId, title, html, isPublic, contentType, today]);

  const showTitleError = titleTouched && title.trim().length === 0;
  const canSubmit =
    !!lambId &&
    title.trim().length > 0 &&
    !isEmptyHtml(html) &&
    !isUploadingImage;

  const handleSubmit = () => {
    if (!canSubmit || !lambId) return;

    createDevotion.mutate(
      {
        lamb_id: lambId,
        devotion_date: format(today, "yyyy-MM-dd"),
        title: title.trim(),
        content_html: html,
        image_urls: extractImageUrls(html),
        is_public: isPublic,
        content_type: contentType,
      },
      {
        onSuccess: () => {
          clearDevotionEditorDraft();
          toast.success(
            contentType === "sermon" ? "บันทึกคำเทศนาแล้ว" : "ส่งเฝ้าเดี่ยวแล้ว",
          );
          navigate({ to: "/lamb-info/devotion" });
        },
        onError: (error: unknown) => {
          toast.error("บันทึกไม่สำเร็จ", {
            description: error instanceof Error ? error.message : undefined,
          });
        },
      },
    );
  };

  // ล้างทั้งฟอร์ม + ร่างที่บันทึกไว้ — แยกต่างหากจากปุ่มส่ง เพราะเป็นการ
  // กระทำที่ล้างข้อมูลทิ้งจริง (ตกลงใน grill-me 2026-08-14 ให้มี confirm
  // dialog ก่อนเสมอ ดู handleConfirmClear ด้านล่าง)
  const handleConfirmClear = () => {
    setTitle("");
    setTitleTouched(false);
    setHtml("");
    setIsPublic(true);
    setContentType("devotion");
    clearDevotionEditorDraft();
    setEditorInitialContent("");
    setEditorResetKey((key) => key + 1);
    setClearDialogOpen(false);
  };

  // lambId มาจาก auth เสมอ (auto-detect ไม่ใช่ตัวเลือกที่ผู้ใช้กดเอง) จึงไม่
  // นับเป็น "เนื้อหาที่ต้องล้าง" อีกต่อไป — ต่างจากก่อนหน้านี้ที่เคยรวม
  // !!lambId ด้วยตอนยังเป็น Select ให้เลือกเอง
  const hasContentToClear = title.trim().length > 0 || !isEmptyHtml(html);

  return (
    <>
      <Header fixed>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              เขียนเฝ้าเดี่ยว
            </h2>
            <p className="text-muted-foreground">
              {format(today, "d MMMM yyyy")} — เขียนบทความ แทรกรูปภาพ
              กลางเนื้อหาได้เหมือน Medium
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* ปุ่มล้างข้อมูลแยกจากปุ่มส่ง — ต้องกดยืนยันก่อนเสมอเพราะล้าง
            ข้อมูลจริง (ตกลงใน grill-me 2026-08-14,
            `devotion_multi_submit_design`) */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => setClearDialogOpen(true)}
              disabled={!hasContentToClear}
            >
              <Eraser /> ล้างข้อมูล
            </Button>
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={!canSubmit || createDevotion.isPending}
            >
              <Send /> ส่งเฝ้าเดี่ยว
            </Button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-3xl space-y-4">
          {/* auto-detect จาก auth แทน Select เดิม (ดู useMyLamb comment
          ด้านบน) — โชว์ error ถ้า auth account นี้ไม่มีลูกแกะผูกอยู่ แทนที่จะ
          ปล่อยให้ส่งได้แบบไม่มี lamb_id */}
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs">
              ส่งในนามของ
            </label>
            {isMyLambResolvingUser || isMyLambLoading ? (
              <Skeleton className="h-9 w-full sm:w-80" />
            ) : isMyLambError || !myLamb ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>ไม่พบลูกแกะที่ผูกกับบัญชีนี้</AlertTitle>
                <AlertDescription>
                  บัญชีที่ล็อกอินอยู่ยังไม่ได้ผูกกับข้อมูลลูกแกะใน lamb_info —
                  ติดต่อผู้ดูแลระบบ
                </AlertDescription>
              </Alert>
            ) : (
              <p className="text-sm font-medium">
                {myLamb.nick_name || `${myLamb.first_name} ${myLamb.last_name}`}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTitleTouched(true)}
              placeholder="หัวข้อบทความ..."
              aria-invalid={showTitleError}
              className={cn(
                "h-auto text-3xl font-bold shadow-none focus-visible:ring-0 md:text-4xl",
                showTitleError
                  ? "rounded-md border border-destructive px-3 focus-visible:ring-destructive/40"
                  : "border-none px-0",
              )}
            />
            {showTitleError && (
              <p className="text-sm text-destructive">
                กรุณาใส่หัวข้อบทความก่อนส่ง
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* เลือกเฝ้าเดี่ยว/คำเทศนา — เพิ่มโดย grill-me 2026-08-26 */}
            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs">ประเภท</label>
              <Select
                value={contentType}
                onValueChange={(v) => setContentType(v as DevotionContentType)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {devotionContentTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            เผยแพร่ในหน้าเฝ้าเดี่ยวสาธารณะ
          </label>

          <ArticleEditor
            key={editorResetKey}
            ref={editorRef}
            initialContent={editorInitialContent}
            onChangeHtml={setHtml}
            onUploadingChange={setIsUploadingImage}
            uploadImage={(file) => uploadDevotionImage(file, isPublic)}
          />
        </div>
      </Main>

      <BibleQuickReferenceSheet
        onInsertHtml={(insertedHtml) =>
          editorRef.current?.insertHtml(insertedHtml)
        }
      />

      <ConfirmDialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        handleConfirm={handleConfirmClear}
        title="ล้างข้อมูลที่เขียนไว้ทั้งหมด?"
        desc="หัวข้อ เนื้อหา และการเลือกลูกแกะที่เขียนไว้จะหายไปทั้งหมด กู้คืนไม่ได้"
        confirmText="ล้างข้อมูล"
        cancelBtnText="ยกเลิก"
        destructive
      />
    </>
  );
}

const editRoute = getRouteApi(
  "/_authenticated/lamb-info/devotion/$devotionId/edit",
);

// Edit an existing เฝ้าเดี่ยว entry — reuses the same title + ArticleEditor
// + public/private toggle UI as DevotionEditor (create) above, opened via
// the "แก้ไข" row action on the admin test table (devotion-table.tsx) or
// the "แก้ไข" button on the detail page (devotion-detail.tsx). Only
// title/content/status are editable — lamb + submission date stay fixed
// (shown as read-only context) per grill-me follow-up (2026-08-11).
export function DevotionEditForm() {
  const { devotionId } = editRoute.useParams();
  const {
    data: entry,
    isPending,
    isError,
    error,
  } = useLambDevotionDetail(devotionId);

  return (
    <>
      <Header fixed>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        {isError ? (
          <Alert variant="destructive" className="mx-auto w-full max-w-3xl">
            <AlertCircle />
            <AlertTitle>ไม่พบเฝ้าเดี่ยวนี้</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "รายการนี้อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง"}
            </AlertDescription>
          </Alert>
        ) : isPending || !entry ? (
          <div className="mx-auto w-full max-w-3xl space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          // Keyed on entry.id so switching between two devotionIds (or a
          // background refetch swapping in a fresh object after save)
          // remounts this with fresh initial state instead of an effect
          // reaching in to overwrite in-progress edits.
          <DevotionEditFormLoaded key={entry.id} entry={entry} />
        )}
      </Main>
    </>
  );
}

type DevotionEditFormLoadedProps = {
  entry: LambDevotionRow;
};

// Owns the actual editable state — mounts only once `entry` has loaded, so
// title/content_html/is_public can be seeded straight from props with no
// loading-triggered effect required.
function DevotionEditFormLoaded({ entry }: DevotionEditFormLoadedProps) {
  const navigate = useNavigate();
  const updateDevotion = useUpdateLambDevotion();
  const editorRef = useRef<ArticleEditorHandle>(null);

  const [title, setTitle] = useState(entry.title);
  // ดูหมายเหตุเดียวกับ DevotionEditor ด้านบน — โผล่เตือนหลัง blur ครั้งแรก
  // ที่ยังว่างอยู่เท่านั้น (ดู grill-me 2026-08-13)
  const [titleTouched, setTitleTouched] = useState(false);
  const [html, setHtml] = useState(entry.content_html);
  const [isPublic, setIsPublic] = useState(entry.is_public);
  // เพิ่มโดย grill-me 2026-08-26 — แก้ไขประเภทได้เหมือนสถานะสาธารณะ/ส่วนตัว
  const [contentType, setContentType] = useState<DevotionContentType>(
    entry.content_type,
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const showTitleError = titleTouched && title.trim().length === 0;
  const canSubmit =
    title.trim().length > 0 && !isEmptyHtml(html) && !isUploadingImage;

  const handleSubmit = () => {
    if (!canSubmit) return;

    updateDevotion.mutate(
      {
        id: entry.id,
        values: {
          title: title.trim(),
          content_html: html,
          image_urls: extractImageUrls(html),
          is_public: isPublic,
          content_type: contentType,
        },
      },
      {
        onSuccess: () => {
          toast.success("บันทึกการแก้ไขแล้ว");
          navigate({
            to: "/lamb-info/devotion/$devotionId",
            params: { devotionId: entry.id },
          });
        },
        onError: (err: unknown) => {
          toast.error("บันทึกไม่สำเร็จ", {
            description: err instanceof Error ? err.message : undefined,
          });
        },
      },
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">แก้ไขเฝ้าเดี่ยว</h2>
          <p className="text-muted-foreground">
            {entry.lamb_info ? lambDisplayName(entry.lamb_info) : "ไม่ทราบชื่อ"}{" "}
            · {format(parseISO(entry.devotion_date), "d MMMM yyyy")} —
            แก้ไขได้เฉพาะหัวข้อ เนื้อหา ประเภท และสถานะ
          </p>
        </div>
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!canSubmit || updateDevotion.isPending}
        >
          <Save /> บันทึกการแก้ไข
        </Button>
      </div>

      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="space-y-1.5">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTitleTouched(true)}
            placeholder="หัวข้อบทความ..."
            aria-invalid={showTitleError}
            className={cn(
              "h-auto text-3xl font-bold shadow-none focus-visible:ring-0 md:text-4xl",
              showTitleError
                ? "rounded-md border border-destructive px-3 focus-visible:ring-destructive/40"
                : "border-none px-0",
            )}
          />
          {showTitleError && (
            <p className="text-sm text-destructive">
              กรุณาใส่หัวข้อบทความก่อนบันทึก
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-muted-foreground text-xs">ประเภท</label>
          <Select
            value={contentType}
            onValueChange={(v) => setContentType(v as DevotionContentType)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {devotionContentTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          เผยแพร่ในหน้าเฝ้าเดี่ยวสาธารณะ
        </label>

        <ArticleEditor
          ref={editorRef}
          initialContent={entry.content_html}
          onChangeHtml={setHtml}
          onUploadingChange={setIsUploadingImage}
          uploadImage={(file) => uploadDevotionImage(file, isPublic)}
        />
      </div>

      <BibleQuickReferenceSheet
        onInsertHtml={(insertedHtml) =>
          editorRef.current?.insertHtml(insertedHtml)
        }
      />
    </>
  );
}
