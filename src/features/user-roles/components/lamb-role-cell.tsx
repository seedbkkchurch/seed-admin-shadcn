import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateLambRole } from "../data/queries";
import { type LambRoleRow, type RoleRow } from "../data/schema";

type LambRoleCellProps = {
  lamb: LambRoleRow;
  roles: RoleRow[];
};

// Inline edit, saves immediately on change — replaces the old
// add/edit/delete "Assignment" dialog flow now that role is a single field
// on lamb_info instead of rows in a junction table (grill-me 2026-08-17,
// see rbac_lamb_role_redesign project memory: "เพิ่มช่อง role ในหน้าแก้ไข
// ข้อมูลลูกแกะ"). The DB (trg_lamb_info_guard_role_change) is the real
// authorization boundary — a non-super_admin caller gets a Postgres
// permission-denied error back here, surfaced as a toast via onError.
export function LambRoleCell({ lamb, roles }: LambRoleCellProps) {
  const updateRole = useUpdateLambRole();

  const roleItems = roles.map((r) => ({
    label: `${r.name_th} (${r.code})`,
    value: r.code,
  }));

  return (
    <Select
      value={lamb.role}
      disabled={updateRole.isPending}
      onValueChange={(value) => {
        if (value === lamb.role) return;
        updateRole.mutate(
          { id: lamb.id, role: value },
          {
            onSuccess: () => toast.success(`Updated ${lamb.first_name}'s role.`),
            onError: (error) =>
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Couldn't update this role.",
              ),
          },
        );
      }}
    >
      <SelectTrigger className="w-full max-w-56">
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent>
        {roleItems.map(({ label, value }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
