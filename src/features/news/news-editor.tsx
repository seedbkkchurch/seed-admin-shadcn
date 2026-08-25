import { useRef, useState } from "react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ImageIcon, Loader2, Save, Send, X } from "lucide-react";
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
import { useMyLamb } from "@/hooks/use-my-lamb";
import { uploadNewsCoverImage, uploadNewsImage } from "@/lib/supabase/news-image";
import { cn } from "@/lib/utils";
import { ArticleEditor, type ArticleEditorHandle } from "@/features/lamb-info/components/article-editor";
import {
  useCreateNews,
  useNewsCategories,
  useNewsDetail,
  useUpdateNews,
} from "./data/queries";
import { NEWS_STATUS_LABELS, type NewsRowWithRelations } from "./data/schema";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const UNIQUE_VIOLATION_CODE = "23505";

function extractImageUrls(html: string): string[] {
  const matches = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)];
  return matches.map((m) => m[1]);
}

function isEmptyHtml(value: string) {
  return value.trim().length === 0 || value === "<p></p>";
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// สรุปสั้นอัตโนมัติจากเนื้อหา — เดิมให้คนเขียนพิมพ์เอง ตอนหลัง (2026-08-25
// รอบสาม) ผู้ใช้ขอให้ทำอัตโนมัติแทน ไม่ต้องพิมพ์เอง ตัดข้อความล้วน (ไม่มี
// tag) ที่ maxLen ตัวอักษร ต่อด้วย "…" ถ้าเนื้อหายาวกว่านั้น
function deriveExcerpt(html: string, maxLen = 160): string {
  const text = stripHtml(html);
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trim() + "…";
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function friendlySaveError(error: unknown): string | undefined {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === UNIQUE_VIOLATION_CODE
  ) {
    return "slug นี้ถูกใช้ไปแล้ว ลองเปลี่ยนเป็นอย่างอื่น";
  }
  return error instanceof Error ? error.message : undefined;
}

// Cover image field — เก็บแยกจากรูปในเนื้อหา (ArticleEditor แทรกรูปเองผ่าน
// uploadNewsImage) ใช้เฉพาะรูปหน้าปกที่โชว์ในการ์ด list/thumbnail ตกลงใน
// grill-me 2026-08-25
function CoverImageField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadNewsCoverImage(file);
      onChange(url);
    } catch (error) {
      toast.error("อัปโหลดรูปหน้าปกไม่สำเร็จ", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-muted-foreground text-xs">รูปหน้าปก (ถ้ามี)</label>
      {value ? (
        <div className="relative w-full max-w-sm">
          <img
            src={value}
            alt=""
            className="aspect-video w-full rounded-md border object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 size-7"
            onClick={() => onChange(null)}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ImageIcon />
          )}
          อัปโหลดรูปหน้าปก
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}

type CategorySelectProps = {
  value: string | null;
  onChange: (id: string | null) => void;
};

function CategorySelect({ value, onChange }: CategorySelectProps) {
  const { data: categories } = useNewsCategories();

  return (
    <div className="space-y-1.5">
      <label className="text-muted-foreground text-xs">หมวดหมู่ (ถ้ามี)</label>
      <Select
        value={value ?? "none"}
        onValueChange={(v) => onChange(v === "none" ? null : v)}
      >
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue placeholder="เลือกหมวดหมู่" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">ไม่มีหมวดหมู่</SelectItem>
          {categories?.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name_th}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// เขียนข่าวใหม่ — Medium-style editor เดียวกับเฝ้าเดี่ยว (ArticleEditor
// ถูกย้ายไปใช้ร่วมกันจาก features/lamb-info/components/article-editor.tsx)
// เข้าถึงได้เฉพาะคนมี permission news:write (route beforeLoad เช็คไว้ชั้น
// นอก, RLS เช็คซ้ำที่ DB) เขียนในนามตัวเองเสมอ (author_id = lamb ของ
// ตัวเอง — auto-detect จาก auth เหมือน DevotionEditor) ตกลงใน grill-me
// 2026-08-25
export function NewsEditor() {
  const navigate = useNavigate();
  const editorRef = useRef<ArticleEditorHandle>(null);

  const {
    data: myLamb,
    isLoading: isMyLambLoading,
    isResolvingUser: isMyLambResolvingUser,
    isError: isMyLambError,
  } = useMyLamb();
  const lambId = myLamb?.id;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouchedManually, setSlugTouchedManually] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [html, setHtml] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const createNews = useCreateNews();

  // เติม slug อัตโนมัติจาก title (แปลงเป็นอักษรพิมพ์เล็ก/ขีดกลาง) จนกว่าจะ
  // แก้ slug เองครั้งแรก — สะดวกกว่ากรอกเองทั้งหมดแต่ยังแก้ทับได้เสมอ (ตกลง
  // ว่าคนเขียนกรอก slug เองได้ ไม่ได้บังคับห้ามช่วย auto-fill เบื้องต้น)
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouchedManually) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugTouchedManually(true);
    setSlug(value);
  };

  const showTitleError = titleTouched && title.trim().length === 0;
  const showSlugError =
    slugTouched && slug.length > 0 && !SLUG_PATTERN.test(slug);
  const canSubmit =
    !!lambId &&
    title.trim().length > 0 &&
    slug.length > 0 &&
    SLUG_PATTERN.test(slug) &&
    !isEmptyHtml(html) &&
    !isUploadingImage;

  const handleSubmit = () => {
    if (!canSubmit || !lambId) return;

    createNews.mutate(
      {
        author_id: lambId,
        category_id: categoryId,
        title: title.trim(),
        slug,
        excerpt: deriveExcerpt(html) || null,
        content_html: html,
        cover_image_url: coverImageUrl,
        image_urls: extractImageUrls(html),
        status: isPublished ? "published" : "draft",
      },
      {
        onSuccess: () => {
          toast.success(isPublished ? "เผยแพร่ข่าวแล้ว" : "บันทึกร่างแล้ว");
          navigate({ to: "/news/table" });
        },
        onError: (error: unknown) => {
          toast.error("บันทึกไม่สำเร็จ", {
            description: friendlySaveError(error),
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
            <h2 className="text-2xl font-bold tracking-tight">เขียนข่าว</h2>
            <p className="text-muted-foreground">
              เขียนบทความ แทรกรูปภาพกลางเนื้อหาได้เหมือน Medium
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit || createNews.isPending}
          >
            <Send /> {isPublished ? "เผยแพร่ข่าว" : "บันทึกร่าง"}
          </Button>
        </div>

        <div className="mx-auto w-full max-w-3xl space-y-4">
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs">เขียนในนามของ</label>
            {isMyLambResolvingUser || isMyLambLoading ? (
              <Skeleton className="h-9 w-full sm:w-80" />
            ) : isMyLambError || !myLamb ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>ไม่พบลูกแกะที่ผูกกับบัญชีนี้</AlertTitle>
                <AlertDescription>
                  บัญชีที่ล็อกอินอยู่ยังไม่ได้ผูกกับข้อมูลลูกแกะใน lamb_info —
                  เขียนข่าวไม่ได้จนกว่าจะมีลูกแกะผูกอยู่ (ติดต่อผู้ดูแลระบบ)
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
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={() => setTitleTouched(true)}
              placeholder="หัวข้อข่าว..."
              aria-invalid={showTitleError}
              className={cn(
                "h-auto text-3xl font-bold shadow-none focus-visible:ring-0 md:text-4xl",
                showTitleError
                  ? "rounded-md border border-destructive px-3 focus-visible:ring-destructive/40"
                  : "border-none px-0",
              )}
            />
            {showTitleError && (
              <p className="text-sm text-destructive">กรุณาใส่หัวข้อข่าวก่อนบันทึก</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs">
              slug (ใช้ในลิงก์ /news/…) — ตัวพิมพ์เล็ก a-z, 0-9 และขีดกลาง (-)
              เท่านั้น
            </label>
            <Input
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              onBlur={() => setSlugTouched(true)}
              placeholder="how-to-pray"
              aria-invalid={showSlugError}
            />
            {showSlugError && (
              <p className="text-sm text-destructive">
                slug ใช้ได้เฉพาะตัวพิมพ์เล็ก a-z, 0-9 และขีดกลาง (-) เท่านั้น
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <CategorySelect value={categoryId} onChange={setCategoryId} />
            <CoverImageField value={coverImageUrl} onChange={setCoverImageUrl} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            เผยแพร่ทันที (ปิดไว้ = บันทึกเป็นร่างก่อน)
          </label>

          <ArticleEditor
            ref={editorRef}
            onChangeHtml={setHtml}
            onUploadingChange={setIsUploadingImage}
            uploadImage={uploadNewsImage}
            placeholder="เขียนเนื้อหาข่าวของคุณที่นี่..."
          />
        </div>
      </Main>
    </>
  );
}

const editRoute = getRouteApi("/_authenticated/news/$newsId/edit");

// แก้ไขข่าวที่มีอยู่แล้ว — ใครมี news:write ก็แก้ของใครก็ได้ (ตกลงใน
// grill-me 2026-08-25) จึงมี Select สถานะแบบเต็ม (ร่าง/เผยแพร่/เก็บถาวร)
// ต่างจากตอนสร้างใหม่ที่มีแค่ Switch เผยแพร่/ไม่เผยแพร่
export function NewsEditForm() {
  const { newsId } = editRoute.useParams();
  const { data: entry, isPending, isError, error } = useNewsDetail(newsId);

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
            <AlertTitle>ไม่พบข่าวนี้</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "รายการนี้อาจถูกเก็บถาวรไปแล้ว หรือไม่มีสิทธิ์เข้าถึง"}
            </AlertDescription>
          </Alert>
        ) : isPending || !entry ? (
          <div className="mx-auto w-full max-w-3xl space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <NewsEditFormLoaded key={entry.id} entry={entry} />
        )}
      </Main>
    </>
  );
}

function NewsEditFormLoaded({ entry }: { entry: NewsRowWithRelations }) {
  const navigate = useNavigate();
  const updateNews = useUpdateNews();
  const editorRef = useRef<ArticleEditorHandle>(null);

  const [title, setTitle] = useState(entry.title);
  const [slug, setSlug] = useState(entry.slug);
  const [categoryId, setCategoryId] = useState<string | null>(
    entry.category_id,
  );
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    entry.cover_image_url,
  );
  const [html, setHtml] = useState(entry.content_html);
  const [status, setStatus] = useState(entry.status);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const showTitleError = titleTouched && title.trim().length === 0;
  const showSlugError = slugTouched && !SLUG_PATTERN.test(slug);
  const canSubmit =
    title.trim().length > 0 &&
    SLUG_PATTERN.test(slug) &&
    !isEmptyHtml(html) &&
    !isUploadingImage;

  const handleSubmit = () => {
    if (!canSubmit) return;

    updateNews.mutate(
      {
        id: entry.id,
        values: {
          title: title.trim(),
          slug,
          excerpt: deriveExcerpt(html) || null,
          content_html: html,
          cover_image_url: coverImageUrl,
          image_urls: extractImageUrls(html),
          category_id: categoryId,
          status,
        },
      },
      {
        onSuccess: () => {
          toast.success("บันทึกการแก้ไขแล้ว");
          navigate({ to: "/news/table" });
        },
        onError: (err: unknown) => {
          toast.error("บันทึกไม่สำเร็จ", {
            description: friendlySaveError(err),
          });
        },
      },
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">แก้ไขข่าว</h2>
          <p className="text-muted-foreground">
            {entry.author
              ? (entry.author.nick_name ?? entry.author.first_name)
              : "ไม่ทราบผู้เขียน"}
          </p>
        </div>
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!canSubmit || updateNews.isPending}
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
            placeholder="หัวข้อข่าว..."
            aria-invalid={showTitleError}
            className={cn(
              "h-auto text-3xl font-bold shadow-none focus-visible:ring-0 md:text-4xl",
              showTitleError
                ? "rounded-md border border-destructive px-3 focus-visible:ring-destructive/40"
                : "border-none px-0",
            )}
          />
          {showTitleError && (
            <p className="text-sm text-destructive">กรุณาใส่หัวข้อข่าวก่อนบันทึก</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-muted-foreground text-xs">
            slug (ใช้ในลิงก์ /news/…)
          </label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            onBlur={() => setSlugTouched(true)}
            aria-invalid={showSlugError}
          />
          {showSlugError && (
            <p className="text-sm text-destructive">
              slug ใช้ได้เฉพาะตัวพิมพ์เล็ก a-z, 0-9 และขีดกลาง (-) เท่านั้น
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <CategorySelect value={categoryId} onChange={setCategoryId} />
          <CoverImageField value={coverImageUrl} onChange={setCoverImageUrl} />
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs">สถานะ</label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as typeof status)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NEWS_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ArticleEditor
          ref={editorRef}
          initialContent={entry.content_html}
          onChangeHtml={setHtml}
          onUploadingChange={setIsUploadingImage}
          uploadImage={uploadNewsImage}
        />
      </div>
    </>
  );
}
