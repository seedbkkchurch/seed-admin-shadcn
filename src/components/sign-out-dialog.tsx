import { useNavigate, useLocation } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface SignOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // เคลียร์ React Query cache ทั้งหมดตอน sign out (บั๊กจริง — grill-me
    // 2026-08-23) — query เช่น useIsSuperAdmin() ผูก staleTime 5 นาที ไม่มี
    // user id อยู่ใน queryKey ถ้าไม่ล้างตรงนี้ แล้วมีคนอื่น sign in ต่อใน
    // browser เดียวกันภายใน 5 นาที (เช่น sign out จากบัญชี super_admin
    // แล้ว login คนละคนทันที) จะเห็นผลลัพธ์ค้างของบัญชีก่อนหน้า — เจอจริง
    // ว่า sign out จาก super_admin แล้ว login เป็นหัวหน้าแคร์ (cell_leader)
    // ต่อ ยังเห็นเมนู Admin โผล่ใน sidebar/Cmd+K search อยู่
    queryClient.clear();
    // Preserve current location for redirect after sign-in
    const currentPath = location.href;
    navigate({
      to: "/sign-in",
      search: { redirect: currentPath },
      replace: true,
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sign out"
      desc="Are you sure you want to sign out? You will need to sign in again to access your account."
      confirmText="Sign out"
      destructive
      handleConfirm={() => void handleSignOut()}
      className="sm:max-w-sm"
    />
  );
}
