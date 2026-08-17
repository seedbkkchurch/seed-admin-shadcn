"use client";

import { AlertTriangle, Loader } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDeleteRole, useRoleUsageCount } from "../data/queries";
import { type RoleRow } from "../data/schema";

type RolesDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: RoleRow;
};

// lamb_info_role_fkey is ON DELETE NO ACTION (see grill-me 2026-08-15,
// still true after the 2026-08-17 redesign that moved role onto lamb_info
// directly) — a role still assigned to at least one lamb would otherwise
// fail with a raw Postgres FK-violation error. Pre-check the usage count
// while the dialog is open and block the confirm button with a friendly
// count instead.
export function RolesDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: RolesDeleteDialogProps) {
  const deleteRole = useDeleteRole();
  const usage = useRoleUsageCount(currentRow.code, open);
  const inUseCount = usage.data ?? 0;
  const blocked = usage.isPending || inUseCount > 0;

  const handleDelete = async () => {
    if (blocked) return;
    try {
      await deleteRole.mutateAsync(currentRow.code);
      toast.success("Role deleted.");
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
      disabled={blocked || deleteRole.isPending}
      title={
        <span className="text-destructive">
          <AlertTriangle
            className="me-1 inline-block stroke-destructive"
            size={18}
          />{" "}
          Delete Role
        </span>
      }
      desc={
        <div className="space-y-4">
          <p>
            Are you sure you want to delete{" "}
            <span className="font-bold">{currentRow.name_th}</span> (
            <span className="font-mono">{currentRow.code}</span>)? This will
            permanently remove the record. This cannot be undone.
          </p>

          {usage.isPending ? (
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader className="size-4 animate-spin" /> Checking whether this
              role is still assigned to anyone...
            </p>
          ) : inUseCount > 0 ? (
            <Alert variant="destructive">
              <AlertTitle>Still assigned</AlertTitle>
              <AlertDescription>
                {inUseCount} {inUseCount === 1 ? "person" : "people"} still hold
                this role. Remove those assignments on the Assignments tab first
                before deleting it.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTitle>Warning!</AlertTitle>
              <AlertDescription>
                Please be careful, this operation can not be rolled back.
              </AlertDescription>
            </Alert>
          )}
        </div>
      }
      confirmText="Delete"
      destructive
    />
  );
}
