"use client";

import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDeleteAssignment } from "../data/queries";
import { type AssignmentRow } from "../data/schema";

type AssignmentsDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: AssignmentRow;
};

// Simple confirm (no type-to-confirm) — a lamb+role pair doesn't have a
// short unique label worth typing back, unlike personality_type.code or
// group_care.name. See grill-me 2026-08-15.
export function AssignmentsDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: AssignmentsDeleteDialogProps) {
  const deleteAssignment = useDeleteAssignment();

  const lambLabel = currentRow.lamb
    ? `${currentRow.lamb.first_name} ${currentRow.lamb.last_name}`.trim()
    : "this lamb";
  const roleLabel = currentRow.roleName ?? currentRow.role;

  const handleDelete = async () => {
    try {
      await deleteAssignment.mutateAsync(currentRow.id);
      toast.success("Assignment deleted.");
      onOpenChange(false);
    } catch {
      // Errors surface via the global mutation error handler (toast).
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={() => void handleDelete()}
      disabled={deleteAssignment.isPending}
      title={
        <span className="text-destructive">
          <AlertTriangle
            className="me-1 inline-block stroke-destructive"
            size={18}
          />{" "}
          Delete Assignment
        </span>
      }
      desc={
        <div className="space-y-4">
          <p>
            Remove the <span className="font-bold">{roleLabel}</span> role from{" "}
            <span className="font-bold">{lambLabel}</span>? This cannot be
            undone.
          </p>
          <Alert variant="destructive">
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be careful, this operation can not be rolled back.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText="Delete"
      destructive
    />
  );
}
