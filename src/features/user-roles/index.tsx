import { useMemo } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAssignmentsList,
  useLambOptions,
  useRolesList,
} from "./data/queries";
import { type AssignmentRow } from "./data/schema";
import { AssignmentsDialogs } from "./components/assignments-dialogs";
import { AssignmentsPrimaryButtons } from "./components/assignments-primary-buttons";
import { AssignmentsProvider } from "./components/assignments-provider";
import { AssignmentsTable } from "./components/assignments-table";
import { RolesDialogs } from "./components/roles-dialogs";
import { RolesPrimaryButtons } from "./components/roles-primary-buttons";
import { RolesProvider } from "./components/roles-provider";
import { RolesTable } from "./components/roles-table";

const route = getRouteApi("/_authenticated/user-roles/");

export function UserRoles() {
  const search = route.useSearch();
  const navigate = route.useNavigate();

  const rolesQuery = useRolesList();
  const assignmentsQuery = useAssignmentsList();
  const lambsQuery = useLambOptions();

  // Client-side join, same pattern as GroupCare (see
  // features/group-care/index.tsx): user_roles carries only lamb_id/role,
  // display needs the lamb's name and the role's Thai name.
  const assignmentRows: AssignmentRow[] = useMemo(() => {
    if (!assignmentsQuery.data) return [];
    const lambs = lambsQuery.data ?? [];
    const roles = rolesQuery.data ?? [];
    return assignmentsQuery.data.map((assignment) => ({
      ...assignment,
      lamb: lambs.find((l) => l.id === assignment.lamb_id) ?? null,
      roleName: roles.find((r) => r.code === assignment.role)?.name_th ?? null,
    }));
  }, [assignmentsQuery.data, lambsQuery.data, rolesQuery.data]);

  const isPending =
    rolesQuery.isPending || assignmentsQuery.isPending || lambsQuery.isPending;
  const isError = rolesQuery.isError || assignmentsQuery.isError;
  const error = rolesQuery.error ?? assignmentsQuery.error;

  return (
    <RolesProvider>
      <AssignmentsProvider>
        <Header fixed>
          <Search className="me-auto" />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </Header>

        <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">User Roles</h2>
            <p className="text-muted-foreground">
              Manage the roles dictionary and who holds which role.
            </p>
          </div>

          {isError ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Couldn&apos;t load role data.</AlertTitle>
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : "Something went wrong."}
              </AlertDescription>
            </Alert>
          ) : isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <Tabs defaultValue="assignments" className="flex-1">
              <TabsList>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="roles">Roles</TabsTrigger>
              </TabsList>

              <TabsContent
                value="assignments"
                className="flex flex-1 flex-col gap-4"
              >
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <p className="text-muted-foreground text-sm">
                    Who holds which role (user_roles).
                  </p>
                  <AssignmentsPrimaryButtons />
                </div>
                <AssignmentsTable
                  data={assignmentRows}
                  search={search}
                  navigate={navigate}
                />
              </TabsContent>

              <TabsContent value="roles" className="flex flex-1 flex-col gap-4">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <p className="text-muted-foreground text-sm">
                    The role dictionary (roles).
                  </p>
                  <RolesPrimaryButtons />
                </div>
                <RolesTable
                  data={rolesQuery.data ?? []}
                  search={search}
                  navigate={navigate}
                />
              </TabsContent>
            </Tabs>
          )}
        </Main>

        <RolesDialogs />
        <AssignmentsDialogs />
      </AssignmentsProvider>
    </RolesProvider>
  );
}
