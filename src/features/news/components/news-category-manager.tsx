import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateNewsCategory,
  useDeleteNewsCategory,
  useNewsCategories,
  useUpdateNewsCategory,
} from "../data/queries";
import { type NewsCategoryRow } from "../data/schema";

const formSchema = z.object({
  code: z.string().min(1, "กรุณากรอก code"),
  name_th: z.string().min(1, "กรุณากรอกชื่อ"),
  sort_order: z
    .string()
    .min(1, "กรุณากรอกลำดับ")
    .refine((v) => Number.isInteger(Number(v)), "ต้องเป็นจำนวนเต็ม"),
});
type CategoryForm = z.infer<typeof formSchema>;

function toDefaultValues(row?: NewsCategoryRow): CategoryForm {
  if (!row) return { code: "", name_th: "", sort_order: "0" };
  return {
    code: row.code,
    name_th: row.name_th,
    sort_order: String(row.sort_order),
  };
}

function CategoryDialog({
  row,
  open,
  onOpenChange,
}: {
  row?: NewsCategoryRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = !!row;
  const createCategory = useCreateNewsCategory();
  const updateCategory = useUpdateNewsCategory();

  const form = useForm<CategoryForm>({
    resolver: zodResolver(formSchema),
    defaultValues: toDefaultValues(row),
  });

  useEffect(() => {
    form.reset(toDefaultValues(row));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row, open]);

  const isSubmitting = createCategory.isPending || updateCategory.isPending;

  const onSubmit = async (values: CategoryForm) => {
    try {
      const sortOrder = Number(values.sort_order);
      if (isEdit) {
        await updateCategory.mutateAsync({
          id: row.id,
          values: { name_th: values.name_th, sort_order: sortOrder },
        });
        toast.success("แก้ไขหมวดหมู่แล้ว");
      } else {
        await createCategory.mutateAsync({
          code: values.code,
          name_th: values.name_th,
          sort_order: sortOrder,
        });
        toast.success("เพิ่มหมวดหมู่แล้ว");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error("บันทึกไม่สำเร็จ", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-start">
          <DialogTitle>{isEdit ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "อัปเดตหมวดหมู่ข่าวนี้" : "สร้างหมวดหมู่ข่าวใหม่"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="news-category-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      placeholder="e.g. event"
                      disabled={isEdit}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name_th"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อหมวดหมู่</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ลำดับการแสดงผล</FormLabel>
                  <FormControl>
                    <Input type="number" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type="submit" form="news-category-form" disabled={isSubmitting}>
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// จัดการหมวดหมู่ข่าว — admin เพิ่ม/แก้ไข/ลบเองได้โดยไม่ต้อง deploy โค้ด
// (ตกลงใน grill-me 2026-08-25) เป็น tab ที่สองในหน้าจัดการข่าว
// (news-table-page.tsx) เขียนแบบ self-contained ไม่ใช้ provider pattern
// แบบ user-roles/components/roles-provider.tsx เพราะ scope เล็กกว่ามาก
// (ไม่มี usage-count pre-check ก่อนลบ — category_id เป็น ON DELETE SET NULL
// ลบได้เสมอไม่มี FK block)
export function NewsCategoryManager() {
  const { data: categories, isPending } = useNewsCategories();
  const deleteCategory = useDeleteNewsCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<NewsCategoryRow | undefined>();
  const [deleteRow, setDeleteRow] = useState<NewsCategoryRow | null>(null);

  const openAdd = () => {
    setEditingRow(undefined);
    setDialogOpen(true);
  };
  const openEdit = (row: NewsCategoryRow) => {
    setEditingRow(row);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteRow) return;
    try {
      await deleteCategory.mutateAsync(deleteRow.id);
      toast.success("ลบหมวดหมู่แล้ว");
      setDeleteRow(null);
    } catch (error) {
      toast.error("ลบไม่สำเร็จ", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          หมวดหมู่ที่เลือกได้ตอนเขียน/แก้ไขข่าว
        </p>
        <Button onClick={openAdd}>
          <Plus /> เพิ่มหมวดหมู่
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>ชื่อหมวดหมู่</TableHead>
              <TableHead>ลำดับ</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : !categories?.length ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  ยังไม่มีหมวดหมู่
                </TableCell>
              </TableRow>
            ) : (
              categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono">{c.code}</TableCell>
                  <TableCell>{c.name_th}</TableCell>
                  <TableCell>{c.sort_order}</TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(c)}
                      aria-label="แก้ไขหมวดหมู่"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteRow(c)}
                      aria-label="ลบหมวดหมู่"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CategoryDialog
        key={editingRow?.id ?? "new"}
        row={editingRow}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {deleteRow && (
        <ConfirmDialog
          open={!!deleteRow}
          onOpenChange={(open) => !open && setDeleteRow(null)}
          handleConfirm={() => void handleDelete()}
          disabled={deleteCategory.isPending}
          title={
            <span className="text-destructive">
              <AlertTriangle className="me-1 inline-block stroke-destructive" size={18} />{" "}
              ลบหมวดหมู่
            </span>
          }
          desc={`ลบหมวดหมู่ "${deleteRow.name_th}"? ข่าวที่เคยอยู่หมวดนี้จะกลายเป็น "ไม่มีหมวดหมู่" แทน (ไม่ได้ถูกลบไปด้วย)`}
          confirmText="ลบ"
          cancelBtnText="ยกเลิก"
          destructive
        />
      )}
    </div>
  );
}
