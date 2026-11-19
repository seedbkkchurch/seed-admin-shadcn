import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { InstallPwaButton } from "@/components/install-pwa-button";
import { BibleMusicButton } from "@/features/bible-music/components/bible-music-button";

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean;
  ref?: React.Ref<HTMLElement>;
};

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop);
    };

    // Add scroll listener to the body
    document.addEventListener("scroll", onScroll, { passive: true });

    // Clean up the event listener on unmount
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "z-50 h-16",
        fixed && "header-fixed peer/header sticky top-0 w-[inherit]",
        offset > 10 && fixed ? "shadow" : "shadow-none",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "relative flex h-full items-center gap-3 p-4 sm:gap-4",
          offset > 10 &&
            fixed &&
            "after:absolute after:inset-0 after:-z-10 after:bg-background/20 after:backdrop-blur-lg",
        )}
      >
        <SidebarTrigger variant="outline" className="max-md:scale-125" />
        <Separator orientation="vertical" className="h-6" />
        {/* มือถือ (< md): ปุ่ม 🎵 กลมใหญ่แทนช่อง Search ซึ่งซ่อนบนมือถือ
            (grill-me 2026-11-20) — me-auto อยู่ที่ wrapper ให้ปุ่มอื่นยังชิด
            ขวาแทน Search ได้แม้ปุ่มไม่แสดง (นอก BibleMusicProvider) */}
        <div className="me-auto flex md:hidden">
          <BibleMusicButton variant="mobile-header" />
        </div>
        {children}
        {/* Installable-app trigger (grill-me follow-up, 2026-08-12). Global
            here so every route gets it without each one wiring it in. */}
        <InstallPwaButton />
      </div>
    </header>
  );
}
