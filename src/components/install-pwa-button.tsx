import { useState } from "react";
import { Download, Share, SquarePlus } from "lucide-react";
import { toast } from "sonner";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function InstallPwaButton() {
  const { canInstall, isIos, promptInstall } = usePwaInstall();
  const [iosDialogOpen, setIosDialogOpen] = useState(false);

  if (!canInstall) return null;

  const handleClick = async () => {
    if (isIos) {
      setIosDialogOpen(true);
      return;
    }

    const outcome = await promptInstall();
    if (outcome === "accepted") {
      toast.success("App installed");
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="scale-95 rounded-full"
        onClick={handleClick}
      >
        <Download className="size-[1.2rem]" />
        <span className="sr-only">Install app</span>
      </Button>

      <Dialog open={iosDialogOpen} onOpenChange={setIosDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install this app</DialogTitle>
            <DialogDescription>
              Safari doesn&apos;t let websites trigger installation
              automatically. Add it to your Home Screen manually:
            </DialogDescription>
          </DialogHeader>
          <ol className="text-muted-foreground ms-1 flex flex-col gap-3 text-sm">
            <li className="flex items-center gap-2">
              <span className="bg-muted text-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                1
              </span>
              Tap the Share icon
              <Share className="size-4 shrink-0" />
              in Safari&apos;s toolbar.
            </li>
            <li className="flex items-center gap-2">
              <span className="bg-muted text-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                2
              </span>
              Scroll down and tap &quot;Add to Home Screen&quot;
              <SquarePlus className="size-4 shrink-0" />.
            </li>
            <li className="flex items-center gap-2">
              <span className="bg-muted text-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                3
              </span>
              Tap &quot;Add&quot; to confirm.
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
