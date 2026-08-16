import { z } from "zod";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkIsSuperAdmin } from "@/features/user-roles/data/queries";
import { UserRoles } from "@/features/user-roles";

// Namespaced search keys (see RolesTable/AssignmentsTable) — both tables'
// TabsContent stay mounted at once, so they can't share plain page/code.
const userRolesSearchSchema = z.object({
  rolesPage: z.number().optional().catch(1),
  rolesPageSize: z.number().optional().catch(10),
  rolesName: z.string().optional().catch(""),
  assignPage: z.number().optional().catch(1),
  assignPageSize: z.number().optional().catch(10),
  assignName: z.string().optional().catch(""),
});

export const Route = createFileRoute("/_authenticated/user-roles/")({
  validateSearch: userRolesSearchSchema,
  // First permission-gated route in the app (see grill-me 2026-08-15) —
  // everything else only checks the auth session (see
  // routes/_authenticated/route.tsx). Redirects non-super_admin to /403
  // before the page (and its RLS-blocked write UI) ever renders.
  beforeLoad: async () => {
    const isSuperAdmin = await checkIsSuperAdmin();
    if (!isSuperAdmin) {
      throw redirect({ to: "/403" });
    }
  },
  component: UserRoles,
});
