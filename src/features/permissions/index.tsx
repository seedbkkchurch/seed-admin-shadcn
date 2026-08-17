import { AlertCircle } from "lucide-react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissionMatrix, useRolesList } from "./data/queries";
import { PermissionMatrix } from "./components/permission-matrix";

export function Permissions() {
  const rolesQuery = useRolesList();
  const matrixQuery = usePermissionMatrix();

  const isPending = rolesQuery.isPending || matrixQuery.isPending;
  const isError = rolesQuery.isError || matrixQuery.isError;
  const error = rolesQuery.error ?? matrixQuery.error;

  return (
    <>
      <Header fixed>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Permissions</h2>
          <p className="text-muted-foreground">
            What each role can do — tick a box to grant it, clear it to
            revoke. Only super_admin can make changes here. Changes take
            effect wherever the app checks permissions via
            auth_has_permission() (not every feature does this yet).
          </p>
        </div>

        {isError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Couldn&apos;t load permission data.</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Something went wrong."}
            </AlertDescription>
          </Alert>
        ) : isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <PermissionMatrix
            roles={rolesQuery.data ?? []}
            rows={matrixQuery.data ?? []}
          />
        )}
      </Main>
    </>
  );
}
