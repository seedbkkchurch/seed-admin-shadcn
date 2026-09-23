import { useState } from "react";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { type PexelsPhoto, usePexelsSearch } from "../data/pexels";

// คำค้นแนะนำ (grill-me 2026-09-23) — Pexels รองรับ locale th-TH จึงใช้คำไทยได้
const SUGGESTED_QUERIES = [
  "ฟ้า",
  "ภูเขา",
  "พระอาทิตย์ขึ้น",
  "ทะเล",
  "ดอกไม้",
  "ไม้กางเขน",
  "พระคัมภีร์",
  "อธิษฐาน",
];

// หน้าต่างค้นหารูปจาก Pexels ใน ArticleEditor — คลิกรูปแล้ว onSelect ทันที
// (ผู้เรียกแทรกรูป + บรรทัดเครดิตเอง) แล้วปิดหน้าต่าง ใช้ลิงก์รูปของ Pexels
// ตรงๆ ไม่ copy มาเก็บใน Supabase Storage (ตกลงกันใน grill-me)
export function PexelsPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (photo: PexelsPhoto) => void;
}) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const search = usePexelsSearch(query);
  const photos = search.data?.pages.flatMap((p) => p.photos) ?? [];

  const runSearch = (value: string) => {
    setInput(value);
    setQuery(value.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-4 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>ค้นหารูปจาก Pexels</DialogTitle>
          <DialogDescription>
            รูปฟรีจาก{" "}
            <a
              href="https://www.pexels.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Pexels
            </a>{" "}
            — คลิกรูปเพื่อแทรกพร้อมเครดิตช่างภาพ
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="พิมพ์คำค้น เช่น ภูเขา, sunrise"
            maxLength={100}
            autoFocus
          />
          <Button type="submit" disabled={!input.trim()}>
            <Search />
            ค้นหา
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUERIES.map((q) => (
            <Button
              key={q}
              type="button"
              size="sm"
              variant={query === q ? "secondary" : "outline"}
              className="h-7 rounded-full px-3 text-xs"
              onClick={() => runSearch(q)}
            >
              {q}
            </Button>
          ))}
        </div>

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          {!query ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              พิมพ์คำค้นหรือเลือกคำแนะนำด้านบน
            </p>
          ) : search.isError ? (
            <div className="text-destructive flex items-center justify-center gap-2 py-10 text-sm">
              <AlertCircle className="size-4" />
              {search.error instanceof Error
                ? search.error.message
                : "ค้นหารูปไม่สำเร็จ"}
            </div>
          ) : search.isPending ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] w-full" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              ไม่พบรูปสำหรับ “{query}” ลองคำอื่นหรือภาษาอังกฤษดู
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => onSelect(photo)}
                    className="group focus-visible:ring-ring relative overflow-hidden rounded-md focus-visible:ring-2 focus-visible:outline-none"
                    style={{ backgroundColor: photo.avgColor ?? undefined }}
                  >
                    <img
                      src={photo.thumbUrl}
                      alt={photo.alt}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-2 py-1 text-start text-[11px] text-white">
                      {photo.photographer}
                    </span>
                  </button>
                ))}
              </div>
              {search.hasNextPage && (
                <div className="flex justify-center py-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={search.isFetchingNextPage}
                    onClick={() => search.fetchNextPage()}
                  >
                    {search.isFetchingNextPage && (
                      <Loader2 className="animate-spin" />
                    )}
                    โหลดเพิ่ม
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
