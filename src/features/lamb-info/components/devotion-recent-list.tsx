import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type DevotionRecentListEntry = {
  id: string;
  devotion_date: string;
  title: string;
  image_urls: string[];
  is_public: boolean;
};

type DevotionRecentListProps = {
  lambId: string;
  // Must already be sorted most-recent-first.
  entries: DevotionRecentListEntry[];
};

const PREVIEW_COUNT = 5;

function DevotionListItem({ entry }: { entry: DevotionRecentListEntry }) {
  return (
    <Link
      to="/lamb-info/devotion/$devotionId"
      params={{ devotionId: entry.id }}
      className="hover:bg-muted flex items-center gap-3 rounded-md px-2 py-2 text-sm"
    >
      {entry.image_urls[0] ? (
        <img
          src={entry.image_urls[0]}
          alt={entry.title}
          className="size-10 shrink-0 rounded-md border object-cover"
        />
      ) : (
        <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md border text-xs">
          —
        </div>
      )}
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-muted-foreground shrink-0 text-xs">
            {format(parseISO(entry.devotion_date), "d MMM yyyy")}
          </span>
          <span className="truncate font-medium">{entry.title}</span>
        </div>
        <Badge
          variant={entry.is_public ? "default" : "outline"}
          className="shrink-0"
        >
          {entry.is_public ? "สาธารณะ" : "ส่วนตัว"}
        </Badge>
      </div>
    </Link>
  );
}

// "ประวัติล่าสุด" — a flat, most-recent-first list of a lamb's เฝ้าเดี่ยว
// entries (with a thumbnail of the first image, if any), shown under the
// graph (all 3 views: day/month/year) on devotion-section.tsx. Per
// grill-me follow-up (2026-08-11): 5-item preview + a "ดูทั้งหมด" link to
// the full per-lamb table page (lamb-devotion-table-page.tsx) — replaces
// the earlier scrollable-list dialog, since that page now also offers
// sort/filter/edit/delete, not just "see the rest of the list". Every row
// links straight to the full article at /devotion/$id, same destination
// as the heatmap popover's "อ่านเต็ม" link.
export function DevotionRecentList({
  lambId,
  entries,
}: DevotionRecentListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-muted-foreground mt-4 border-t pt-4 text-center text-sm">
        ยังไม่มีประวัติเฝ้าเดี่ยว
      </div>
    );
  }

  const preview = entries.slice(0, PREVIEW_COUNT);

  return (
    <div className="mt-4 border-t pt-4">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-sm font-medium">ประวัติล่าสุด</div>
        <Button variant="link" size="sm" className="h-auto p-0" asChild>
          <Link to="/lamb-info/$lambId/devotion" params={{ lambId }}>
            ดูทั้งหมด ({entries.length})
          </Link>
        </Button>
      </div>
      <div className="divide-y">
        {preview.map((entry) => (
          <DevotionListItem key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
