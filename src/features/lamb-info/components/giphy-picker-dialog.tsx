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
import { type GiphyGif, useGiphySearch } from "../data/giphy";

// คำค้นแนะนำ — GIPHY ค้นภาษาไทยได้บ้าง แต่ภาษาอังกฤษได้ผลดีกว่า
const SUGGESTED_QUERIES = [
  "praise",
  "amen",
  "thank you",
  "pray",
  "joy",
  "love",
  "happy",
  "peace",
];

// หน้าต่างค้นหา GIF ใน ArticleEditor (grill-me 2026-11-08) — เปิดมาเจอ GIF
// ยอดนิยมก่อน พิมพ์ค้นหรือแตะคำแนะนำได้ คลิก GIF แล้ว onSelect ทันที ใช้ลิงก์
// ไฟล์ของ GIPHY ตรงๆ (ข้อกำหนด GIPHY ห้ามเก็บไฟล์ไว้เอง) และต้องมี
// "Powered by GIPHY" ในหน้าค้นหา
export function GiphyPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (gif: GiphyGif) => void;
}) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const search = useGiphySearch(query, open);
  const gifs = search.data?.pages.flatMap((p) => p.gifs) ?? [];

  const runSearch = (value: string) => {
    setInput(value);
    setQuery(value.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-4 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>แทรก GIF</DialogTitle>
          <DialogDescription>
            คลิก GIF เพื่อแทรกลงในบทความ — GIF จะขยับได้ตอนอ่าน
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
            placeholder="พิมพ์คำค้น เช่น praise, amen, ขอบคุณ"
            maxLength={50}
            autoFocus
          />
          <Button type="submit">
            <Search />
            ค้นหา
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={query === "" ? "secondary" : "outline"}
            className="h-7 rounded-full px-3 text-xs"
            onClick={() => runSearch("")}
          >
            ยอดนิยม
          </Button>
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
          {search.isError ? (
            <div className="text-destructive flex items-center justify-center gap-2 py-10 text-sm">
              <AlertCircle className="size-4" />
              {search.error instanceof Error
                ? search.error.message
                : "ค้นหา GIF ไม่สำเร็จ"}
            </div>
          ) : search.isPending ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full" />
              ))}
            </div>
          ) : gifs.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              ไม่พบ GIF สำหรับ “{query}” ลองคำภาษาอังกฤษดู
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {gifs.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => onSelect(gif)}
                    className="group bg-muted focus-visible:ring-ring relative overflow-hidden rounded-md focus-visible:ring-2 focus-visible:outline-none"
                    title={gif.title}
                  >
                    <img
                      src={gif.thumbUrl}
                      alt={gif.title}
                      loading="lazy"
                      className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                    />
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

        <div className="text-muted-foreground text-end text-xs font-semibold tracking-wide">
          Powered by{" "}
          <a
            href="https://giphy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground"
          >
            GIPHY
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
