import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkIsSuperAdmin } from "@/features/user-roles/data/queries";
import { Permissions } from "@/features/permissions";

export const Route = createFileRoute("/_authenticated/permissions/")({
  // Same guard as /user-roles (see grill-me 2026-08-15) — permission
  // editing is at least as sensitive as role assignment, gate it the same
  // way. Reuses checkIsSuperAdmin() from features/user-roles rather than
  // duplicating it.
  beforeLoad: async () => {
    const isSuperAdmin = await checkIsSuperAdmin();
    if (!isSuperAdmin) {
      throw redirect({ to: "/403" });
    }
  },
  component: Permissions,
});
