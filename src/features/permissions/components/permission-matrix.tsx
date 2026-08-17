import { useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { derivePermissionKeys, useToggleRolePermission } from "../data/queries";
import { type RolePermissionRow, type RoleRow } from "../data/schema";

// Thai label per domain (the part of a permission key before its first
// ":", e.g. "lamb:edit:own" -> "lamb") — purely cosmetic, groups the
// matrix's rows into visual sections. Falls back to the raw domain string
// for anything not listed (there shouldn't be any right now — see
// rbac_design project memory's 5-domain matrix, `user:*` excluded).
const DOMAIN_LABELS: Record<string, string> = {
  lamb: "ลูกแกะ",
  group: "กลุ่มแคร์",
  progress: "ความคืบหน้า",
  report: "รายงาน",
};

type PermissionMatrixProps = {
  roles: RoleRow[];
  rows: RolePermissionRow[];
};

export function PermissionMatrix({ roles, rows }: PermissionMatrixProps) {
  const toggle = useToggleRolePermission();

  const permissions = useMemo(() => derivePermissionKeys(rows), [rows]);
  const granted = useMemo(
    () => new Set(rows.map((r) => `${r.role}:${r.permission}`)),
    [rows],
  );

  const domains = useMemo(() => {
    const order: string[] = [];
    for (const p of permissions) {
      if (!order.includes(p.domain)) order.push(p.domain);
    }
    return order;
  }, [permissions]);

  const handleToggle = (role: string, permission: string, checked: boolean) => {
    toggle.mutate(
      { role, permission, grant: checked },
      {
        onError: (error) =>
          toast.error(
            error instanceof Error
              ? error.message
              : "Couldn't update this permission.",
          ),
      },
    );
  };

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-56 bg-background">Permission</TableHead>
            {roles.map((role) => (
              <TableHead
                key={role.code}
                className="bg-background text-center whitespace-nowrap"
              >
                {role.name_th}
                <div className="text-muted-foreground font-mono text-xs font-normal">
                  {role.code}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {domains.map((domain) => (
            <>
              <TableRow key={`domain-${domain}`} className="bg-muted/40">
                <TableCell
                  colSpan={roles.length + 1}
                  className="text-muted-foreground text-xs font-semibold"
                >
                  {DOMAIN_LABELS[domain] ?? domain}{" "}
                  <span className="font-mono font-normal">({domain})</span>
                </TableCell>
              </TableRow>
              {permissions
                .filter((p) => p.domain === domain)
                .map((permission) => (
                  <TableRow key={permission.key}>
                    <TableCell className="font-mono text-sm">
                      {permission.key}
                    </TableCell>
                    {roles.map((role) => {
                      const isGranted = granted.has(
                        `${role.code}:${permission.key}`,
                      );
                      return (
                        <TableCell
                          key={role.code}
                          className={cn("text-center")}
                        >
                          <Checkbox
                            checked={isGranted}
                            disabled={toggle.isPending}
                            onCheckedChange={(checked) =>
                              handleToggle(
                                role.code,
                                permission.key,
                                checked === true,
                              )
                            }
                            aria-label={`${role.code} - ${permission.key}`}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
