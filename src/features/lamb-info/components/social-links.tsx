import { type ComponentType, type SVGProps } from "react";
import { IconFacebook, IconInstagram, IconX } from "@/assets/brand-icons";
import { cn } from "@/lib/utils";
import { type LambInfoRow } from "../data/schema";

// Row of Facebook / Instagram / X icons under the lamb's name on the
// profile header (grill-me 2026-11-15). All three always render: a
// platform with a link shows in its brand colour and opens in a new tab;
// an empty one is a faded grey, non-interactive placeholder.
const PLATFORMS: {
  key: "facebook_url" | "instagram_url" | "x_url";
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  colorClass: string;
}[] = [
  {
    key: "facebook_url",
    label: "Facebook",
    Icon: IconFacebook,
    colorClass: "text-[#1877F2]",
  },
  {
    key: "instagram_url",
    label: "Instagram",
    Icon: IconInstagram,
    colorClass: "text-[#E4405F]",
  },
  // X's brand colour is black/white — follow the theme foreground.
  { key: "x_url", label: "X", Icon: IconX, colorClass: "text-foreground" },
];

export function SocialLinks({
  row,
  className,
}: {
  row: Pick<LambInfoRow, "facebook_url" | "instagram_url" | "x_url">;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {PLATFORMS.map(({ key, label, Icon, colorClass }) => {
        const url = row[key];
        if (!url) {
          return (
            <span
              key={key}
              title={`ยังไม่ได้เพิ่ม ${label}`}
              aria-label={`ยังไม่ได้เพิ่ม ${label}`}
              className="text-muted-foreground/40 inline-flex size-9 items-center justify-center"
            >
              <Icon className="size-5" aria-hidden />
            </span>
          );
        }
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={label}
            aria-label={`เปิด ${label}`}
            className={cn(
              "hover:bg-accent focus-visible:ring-ring inline-flex size-9 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none",
              colorClass,
            )}
          >
            <Icon className="size-5" aria-hidden />
          </a>
        );
      })}
    </div>
  );
}
