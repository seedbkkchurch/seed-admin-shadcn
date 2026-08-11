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
import { useCreateGroupCare, useUpdateGroupCare } from "../data/queries";
import { type GroupCareRow } from "../data/schema";

const formSchema = z.object({
  name: z.string().min(1, "Name is required."),
  address: z.string().optional(),
  day: z.string().optional(),
});
type GroupCareForm = z.infer<typeof formSchema>;

type GroupCareActionDialogProps = {
  currentRow?: GroupCareRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toDefaultValues(currentRow?: GroupCareRow): GroupCareForm {
  if (!currentRow) {
    return {
      name: "",
      address: "",
      day: "",
    };
  }
  return {
    name: currentRow.name ?? "",
    address: currentRow.address ?? "",
    day: currentRow.day ?? "",
  };
}

export function GroupCareActionDialog({
  currentRow,
  open,
  onOpenChange,
}: GroupCareActionDialogProps) {
  const isEdit = !!currentRow;
  const createGroupCare = useCreateGroupCare();
  const updateGroupCare = useUpdateGroupCare();

  const form = useForm<GroupCareForm>({
    resolver: zodResolver(formSchema),
    defaultValues: toDefaultValues(currentRow),
  });

  // Re-sync the form whenever the row being edited changes.
  useEffect(() => {
    form.reset(toDefaultValues(currentRow));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRow]);

  const isSubmitting = createGroupCare.isPending || updateGroupCare.isPending;

  const onSubmit = async (values: GroupCareForm) => {
    const payload = {
      name: values.name,
      address: values.address || null,
      day: values.day || null,
    };

    try {
      if (isEdit) {
        await updateGroupCare.mutateAsync({
          id: currentRow.id,
          values: payload,
        });
        toast.success("Group care updated.");
      } else {
        await createGroupCare.mutateAsync(payload);
        toast.success("Group care created.");
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
          <DialogTitle>
            {isEdit ? "Edit Group Care" : "Add Group Care"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the record here. " : "Create a new record here. "}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3">
          <Form {...form}>
            <form
              id="group-care-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 px-0.5"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">Name</FormLabel>
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
                name="address"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">
                      Address
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
                name="day"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">
                      Meeting Day
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="col-span-4"
                        autoComplete="off"
                        placeholder="e.g. Sunday"
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
          <Button type="submit" form="group-care-form" disabled={isSubmitting}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
