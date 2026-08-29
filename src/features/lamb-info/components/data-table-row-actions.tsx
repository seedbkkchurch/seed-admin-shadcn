import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useNavigate } from "@tanstack/react-router";
import { type Row } from "@tanstack/react-table";
import { KeyRound, Trash2, UserPen, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCreateLambAuthAccount } from "../data/queries";
import { type LambInfoRow } from "../data/schema";
import { useLambInfo } from "./lamb-info-provider";

type DataTableRowActionsProps = {
  row: Row<LambInfoRow>;
};

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useLambInfo();
  const navigate = useNavigate();
  const createAuthAccount = useCreateLambAuthAccount();

  // ปกติทุก lamb ที่มี email ควรมี auth_user_id ผูกอยู่แล้ว (bulk-create
  // เดิม + trigger `lamb_info_auto_create_auth_account_trigger` ตอนนี้)
  // แถวที่ยังไม่มีเป็น edge case จริงๆ (ดู grill-me 2026-08-29,
  // teekawin300@gmail.com) — โชว์ปุ่มนี้เฉพาะแถวนั้นเป็นทางสำรองให้แอดมิน
  const needsAuthAccount = !!row.original.email && !row.original.auth_user_id;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => {
            navigate({
              to: "/lamb-info/$lambId",
              params: { lambId: row.original.id },
            });
          }}
        >
          View Profile
          <DropdownMenuShortcut>
            <UserRound size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(row.original);
            setOpen("edit");
          }}
        >
          Edit
          <DropdownMenuShortcut>
            <UserPen size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        {needsAuthAccount && (
          <DropdownMenuItem
            disabled={createAuthAccount.isPending}
            onClick={() => {
              toast.promise(
                createAuthAccount.mutateAsync(row.original.id),
                {
                  loading: "กำลังสร้างบัญชีเข้าสู่ระบบ...",
                  success: (result) =>
                    result?.linkedExisting
                      ? "ผูกบัญชีเข้าสู่ระบบที่มีอยู่แล้วให้เรียบร้อย"
                      : "สร้างบัญชีเข้าสู่ระบบแล้ว (รหัสผ่านเริ่มต้น 1234567 บังคับเปลี่ยนตอน login ครั้งแรก)",
                  error: (err) =>
                    err instanceof Error
                      ? err.message
                      : "สร้างบัญชีเข้าสู่ระบบไม่สำเร็จ",
                },
              );
            }}
          >
            สร้างบัญชีเข้าสู่ระบบ
            <DropdownMenuShortcut>
              <KeyRound size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(row.original);
            setOpen("delete");
          }}
          className="text-red-500!"
        >
          Delete
          <DropdownMenuShortcut>
            <Trash2 size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
