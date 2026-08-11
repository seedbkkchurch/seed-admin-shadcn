"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDeleteLambInfo } from "../data/queries";
import { type LambInfoRow } from "../data/schema";

type LambInfoDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: LambInfoRow;
};

export function LambInfoDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: LambInfoDeleteDialogProps) {
  const [value, setValue] = useState("");
  const deleteLambInfo = useDeleteLambInfo();
  const fullName = [currentRow.first_name, currentRow.last_name]
    .filter(Boolean)
    .join(" ");

  const handleDelete = async () => {
    if (value.trim() !== fullName) return;

    try {
      await deleteLambInfo.mutateAsync(currentRow.id);
      toast.success("Lamb info deleted.");
      onOpenChange(false);
    } catch {
      // Errors surface via the global mutation error handler (toast).
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      form="lamb-info-delete-form"
      disabled={value.trim() !== fullName || deleteLambInfo.isPending}
      title={
        <span className="text-destructive">
          <AlertTriangle
            className="me-1 inline-block stroke-destructive"
            size={18}
          />{" "}
          Delete Lamb Info
        </span>
      }
      desc={
        <form
          id="lamb-info-delete-form"
          onSubmit={(e) => {
            e.preventDefault();
            void handleDelete();
          }}
          className="space-y-4"
        >
          <p className="mb-2">
            Are you sure you want to delete{" "}
            <span className="font-bold">{fullName}</span>? This will permanently
            remove the record. This cannot be undone.
          </p>

          <Label className="my-2">
            Full name:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Type the full name to confirm deletion."
              autoFocus
            />
          </Label>

          <Alert variant="destructive">
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be careful, this operation can not be rolled back.
            </AlertDescription>
          </Alert>
        </form>
      }
      confirmText="Delete"
      destructive
    />
  );
}
