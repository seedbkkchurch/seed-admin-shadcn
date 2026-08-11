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
import { Textarea } from "@/components/ui/textarea";
import {
  useCreatePersonalityType,
  useUpdatePersonalityType,
} from "../data/queries";
import { type PersonalityTypeRow } from "../data/schema";

const formSchema = z.object({
  code: z.string().min(1, "Code is required."),
  description_en: z.string().optional(),
  description_th: z.string().optional(),
  explain: z.string().optional(),
  archetype: z.string().optional(),
});
type PersonalityTypeForm = z.infer<typeof formSchema>;

type PersonalityTypeActionDialogProps = {
  currentRow?: PersonalityTypeRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toDefaultValues(currentRow?: PersonalityTypeRow): PersonalityTypeForm {
  if (!currentRow) {
    return {
      code: "",
      description_en: "",
      description_th: "",
      explain: "",
      archetype: "",
    };
  }
  return {
    code: currentRow.code ?? "",
    description_en: currentRow.description_en ?? "",
    description_th: currentRow.description_th ?? "",
    explain: currentRow.explain ?? "",
    archetype: currentRow.archetype ?? "",
  };
}

export function PersonalityTypeActionDialog({
  currentRow,
  open,
  onOpenChange,
}: PersonalityTypeActionDialogProps) {
  const isEdit = !!currentRow;
  const createPersonalityType = useCreatePersonalityType();
  const updatePersonalityType = useUpdatePersonalityType();

  const form = useForm<PersonalityTypeForm>({
    resolver: zodResolver(formSchema),
    defaultValues: toDefaultValues(currentRow),
  });

  // Re-sync the form whenever the row being edited changes.
  useEffect(() => {
    form.reset(toDefaultValues(currentRow));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRow]);

  const isSubmitting =
    createPersonalityType.isPending || updatePersonalityType.isPending;

  const onSubmit = async (values: PersonalityTypeForm) => {
    try {
      if (isEdit) {
        await updatePersonalityType.mutateAsync({
          code: currentRow.code,
          values: {
            description_en: values.description_en || null,
            description_th: values.description_th || null,
            explain: values.explain || null,
            archetype: values.archetype || null,
          },
        });
        toast.success("Personality type updated.");
      } else {
        await createPersonalityType.mutateAsync({
          code: values.code,
          description_en: values.description_en || null,
          description_th: values.description_th || null,
          explain: values.explain || null,
          archetype: values.archetype || null,
        });
        toast.success("Personality type created.");
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
            {isEdit ? "Edit Personality Type" : "Add Personality Type"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the record here. " : "Create a new record here. "}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="h-105 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3">
          <Form {...form}>
            <form
              id="personality-type-form"
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
                name="description_en"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">
                      Description (EN)
                    </FormLabel>
                    <FormControl>
                      <Textarea className="col-span-4" rows={2} {...field} />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description_th"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">
                      Description (TH)
                    </FormLabel>
                    <FormControl>
                      <Textarea className="col-span-4" rows={2} {...field} />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="archetype"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">
                      Archetype
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
                name="explain"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-end">
                      Explain
                    </FormLabel>
                    <FormControl>
                      <Textarea className="col-span-4" rows={3} {...field} />
                    </FormControl>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            form="personality-type-form"
            disabled={isSubmitting}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
