import { useState } from "react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { AlertCircle, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { ConfigDrawer } from "@/components/config-drawer";
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
import { ArticleEditor } from "./components/article-editor";
import {
  DEVOTION_ALREADY_SUBMITTED_CODE,
  useCreateLambDevotion,
  useLambDevotionDetail,
  useLambNameOptions,
  useUpdateLambDevotion,
} from "./data/queries";
import { lambDisplayName, type LambDevotionRow } from "./data/devotion-schema";

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
// docs/devotion-db-design.md for the schema).
//
// The "ส่งในนามของ" lamb select box is a stand-in for real per-user auth:
// this app has no notion of "the lamb currently using this page" (Clerk
// auth identifies staff/admins, not individual lambs), so for now
// whoever fills out the form manually picks which lamb the entry
// belongs to. Per grill-me follow-up (2026-08-09) — explicitly a test
// affordance, not the final submission flow.
export function DevotionEditor() {
  const navigate = useNavigate();
  const [lambId, setLambId] = useState<string | undefined>();
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { data: lambOptions, isPending: isLambOptionsPending } =
    useLambNameOptions();
  const createDevotion = useCreateLambDevotion();

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
        devotion_date: format(new Date(), "yyyy-MM-dd"),
        title: title.trim(),
        content_html: html,
        image_urls: extractImageUrls(html),
        is_public: isPublic,
      },
      {
        onSuccess: () => {
          toast.success("ส่งเฝ้าเดี่ยววันนี้แล้ว");
          navigate({ to: "/lamb-info/devotion" });
        },
        onError: (error: unknown) => {
          const code = (error as { code?: string } | null)?.code;
          if (code === DEVOTION_ALREADY_SUBMITTED_CODE) {
            toast.error("คนนี้ส่งเฝ้าเดี่ยววันนี้ไปแล้ว", {
              description: "ส่งได้วันละ 1 ครั้งต่อคนเท่านั้น",
            });
            return;
          }
          toast.error("บันทึกไม่สำเร็จ", {
            description: error instanceof Error ? error.message : undefined,
          });
        },
      },
    );
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
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              เขียนเฝ้าเดี่ยววันนี้
            </h2>
            <p className="text-muted-foreground">
              {format(new Date(), "d MMMM yyyy")} — เขียนบทความ แทรกรูปภาพ
              กลางเนื้อหาได้เหมือน Medium
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit || createDevotion.isPending}
          >
            <Send /> ส่งเฝ้าเดี่ยว
          </Button>
        </div>

        <div className="mx-auto w-full max-w-3xl space-y-4">
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs">
              ส่งในนามของ (สำหรับทดสอบ — ยังไม่ผูกกับผู้ใช้จริง)
            </label>
            <Select value={lambId} onValueChange={setLambId}>
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder="เลือกลูกแกะ..." />
              </SelectTrigger>
              <SelectContent>
                {isLambOptionsPending ? (
                  <SelectItem disabled value="loading">
                    กำลังโหลด...
                  </SelectItem>
                ) : (
                  lambOptions?.map((lamb) => (
                    <SelectItem key={lamb.id} value={lamb.id}>
                      {lambDisplayName(lamb)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="หัวข้อบทความ..."
            className="h-auto border-none px-0 text-3xl font-bold shadow-none focus-visible:ring-0 md:text-4xl"
          />

          <label className="flex items-center gap-2 text-sm">
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            เผยแพร่ในหน้าเฝ้าเดี่ยวสาธารณะ
          </label>

          <ArticleEditor
            onChangeHtml={setHtml}
            onUploadingChange={setIsUploadingImage}
            isPublic={isPublic}
          />
        </div>
      </Main>
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

  const [title, setTitle] = useState(entry.title);
  const [html, setHtml] = useState(entry.content_html);
  const [isPublic, setIsPublic] = useState(entry.is_public);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
            แก้ไขได้เฉพาะหัวข้อ เนื้อหา และสถานะ
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
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="หัวข้อบทความ..."
          className="h-auto border-none px-0 text-3xl font-bold shadow-none focus-visible:ring-0 md:text-4xl"
        />

        <label className="flex items-center gap-2 text-sm">
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          เผยแพร่ในหน้าเฝ้าเดี่ยวสาธารณะ
        </label>

        <ArticleEditor
          initialContent={entry.content_html}
          onChangeHtml={setHtml}
          onUploadingChange={setIsUploadingImage}
          isPublic={isPublic}
        />
      </div>
    </>
  );
}
