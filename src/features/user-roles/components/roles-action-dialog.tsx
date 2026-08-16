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
import { Input } from "@/components/ui/input";
import { useCreateRole, useUpdateRole } from "../data/queries";
import { type RoleRow } from "../data/schema";

const formSchema = z.object({
  code: z.string().min(1, "Code is required."),
  name_th: z.string().min(1, "Name (TH) is required."),
  // Kept as a string field (not z.coerce.number()) — coerce schemas give
  // the zodResolver's input type `unknown`, which react-hook-form's <Form>
  // can't reconcile with a plain number field. Converted to a number in
  // onSubmit instead.
  sort_order: z
    .string()
    .min(1, "Sort order is required.")
    .refine((v) => Number.isInteger(Number(v)), "Must be a whole number."),
});
type RoleForm = z.infer<typeof formSchema>;

type RolesActionDialogProps = {
  currentRow?: RoleRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toDefaultValues(currentRow?: RoleRow): RoleForm {
  if (!currentRow) {
    return { code: "", name_th: "", sort_order: "0" };
  }
  return {
    code: currentRow.code,
    name_th: currentRow.name_th,
    sort_order: String(currentRow.sort_order),
  };
}

export function RolesActionDialog({
  currentRow,
  open,
  onOpenChange,
}: RolesActionDialogProps) {
  const isEdit = !!currentRow;
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const form = useForm<RoleForm>({
    resolver: zodResolver(formSchema),
    defaultValues: toDefaultValues(currentRow),
  });

  // Re-sync the form whenever the row being edited changes.
  useEffect(() => {
    form.reset(toDefaultValues(currentRow));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRow]);

  const isSubmitting = createRole.isPending || updateRole.isPending;

  const onSubmit = async (values: RoleForm) => {
    try {
      const sortOrder = Number(values.sort_order);
      if (isEdit) {
        await updateRole.mutateAsync({
          code: currentRow.code,
          values: {
            name_th: values.name_th,
            sort_order: sortOrder,
          },
        });
        toast.success("Role updated.");
      } else {
        await createRole.mutateAsync({
          code: values.code,
          name_th: values.name_th,
          sort_order: sortOrder,
        });
        toast.success("Role created.");
      }
      form.reset();
      onOpenChange(false);
    } catch {
      // Errors surface via the global mutation error handler (toast).
    }
  };

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
          <DialogTitle>{isEdit ? "Edit Role" : "Add Role"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the record here. " : "Create a new record here. "}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3">
          <Form {...form}>
            <form
              id="role-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 px-0.5"
            >
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">Code</FormLabel>
                    <FormControl>
                      <Input
                        className="col-span-4"
                        autoComplete="off"
                        placeholder="e.g. cell_leader"
                        disabled={isEdit}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name_th"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">
                      Name (TH)
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="col-span-4"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">
                      Sort Order
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="col-span-4"
                        type="number"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type="submit" form="role-form" disabled={isSubmitting}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
