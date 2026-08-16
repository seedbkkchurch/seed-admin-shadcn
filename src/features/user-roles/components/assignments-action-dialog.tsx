"use client";

import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SelectDropdown } from "@/components/select-dropdown";
import {
  useAssignmentsList,
  useCreateAssignment,
  useLambOptions,
  useRolesList,
  useUpdateAssignment,
} from "../data/queries";
import { type AssignmentRow } from "../data/schema";
import { LambCombobox } from "./lamb-combobox";

const formSchema = z.object({
  lamb_id: z.string().min(1, "Please select a lamb."),
  role: z.string().min(1, "Please select a role."),
});
type AssignmentForm = z.infer<typeof formSchema>;

type AssignmentsActionDialogProps = {
  currentRow?: AssignmentRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toDefaultValues(currentRow?: AssignmentRow): AssignmentForm {
  if (!currentRow) return { lamb_id: "", role: "" };
  return { lamb_id: currentRow.lamb_id, role: currentRow.role };
}

export function AssignmentsActionDialog({
  currentRow,
  open,
  onOpenChange,
}: AssignmentsActionDialogProps) {
  const isEdit = !!currentRow;
  const { data: lambs } = useLambOptions();
  const { data: roles } = useRolesList();
  const { data: assignments } = useAssignmentsList();
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();

  const form = useForm<AssignmentForm>({
    resolver: zodResolver(formSchema),
    defaultValues: toDefaultValues(currentRow),
  });

  // Re-sync the form whenever the row being edited changes.
  useEffect(() => {
    form.reset(toDefaultValues(currentRow));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRow]);

  const isSubmitting = createAssignment.isPending || updateAssignment.isPending;

  const onSubmit = async (values: AssignmentForm) => {
    // DB has no unique constraint on (lamb_id, role) — guard duplicates
    // client-side instead (see grill-me 2026-08-15).
    const isDuplicate = (assignments ?? []).some(
      (a) =>
        a.lamb_id === values.lamb_id &&
        a.role === values.role &&
        a.id !== currentRow?.id,
    );
    if (isDuplicate) {
      form.setError("role", {
        message: "This lamb already has this role.",
      });
      return;
    }

    try {
      if (isEdit) {
        await updateAssignment.mutateAsync({
          id: currentRow.id,
          values: { lamb_id: values.lamb_id, role: values.role },
        });
        toast.success("Assignment updated.");
      } else {
        await createAssignment.mutateAsync({
          lamb_id: values.lamb_id,
          role: values.role,
        });
        toast.success("Assignment created.");
      }
      form.reset();
      onOpenChange(false);
    } catch {
      // Errors surface via the global mutation error handler (toast).
    }
  };

  const roleItems = (roles ?? []).map((r) => ({
    label: `${r.name_th} (${r.code})`,
    value: r.code,
  }));

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset();
        onOpenChange(state);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-start">
          <DialogTitle>
            {isEdit ? "Edit Assignment" : "Add Assignment"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the record here. " : "Create a new record here. "}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3">
          <Form {...form}>
            <form
              id="assignment-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 px-0.5"
            >
              <FormField
                control={form.control}
                name="lamb_id"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">Lamb</FormLabel>
                    <FormControl>
                      <LambCombobox
                        className="col-span-4"
                        lambs={lambs ?? []}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">Role</FormLabel>
                    <SelectDropdown
                      className="col-span-4"
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      isControlled
                      placeholder="Select a role"
                      items={roleItems}
                    />
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type="submit" form="assignment-form" disabled={isSubmitting}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
