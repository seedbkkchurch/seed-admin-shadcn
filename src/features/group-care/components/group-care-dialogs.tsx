import { GroupCareActionDialog } from "./group-care-action-dialog";
import { GroupCareDeleteDialog } from "./group-care-delete-dialog";
import { GroupCareMembersDialog } from "./group-care-members-dialog";
import { useGroupCare } from "./group-care-provider";

export function GroupCareDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useGroupCare();
  return (
    <>
      <GroupCareActionDialog
        key="group-care-add"
        open={open === "add"}
        onOpenChange={() => setOpen("add")}
      />

      {currentRow && (
        <>
          <GroupCareActionDialog
            key={`group-care-edit-${currentRow.id}`}
            open={open === "edit"}
            onOpenChange={() => {
              setOpen("edit");
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow}
          />

          <GroupCareDeleteDialog
            key={`group-care-delete-${currentRow.id}`}
            open={open === "delete"}
            onOpenChange={() => {
              setOpen("delete");
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow}
          />

          <GroupCareMembersDialog
            key={`group-care-members-${currentRow.id}`}
            open={open === "members"}
            onOpenChange={() => {
              setOpen("members");
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  );
}
