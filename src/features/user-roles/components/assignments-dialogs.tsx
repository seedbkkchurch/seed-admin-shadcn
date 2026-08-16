import { AssignmentsActionDialog } from "./assignments-action-dialog";
import { AssignmentsDeleteDialog } from "./assignments-delete-dialog";
import { useAssignments } from "./assignments-provider";

export function AssignmentsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useAssignments();
  return (
    <>
      <AssignmentsActionDialog
        key="assignment-add"
        open={open === "add"}
        onOpenChange={() => setOpen("add")}
      />

      {currentRow && (
        <>
          <AssignmentsActionDialog
            key={`assignment-edit-${currentRow.id}`}
            open={open === "edit"}
            onOpenChange={() => {
              setOpen("edit");
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow}
          />

          <AssignmentsDeleteDialog
            key={`assignment-delete-${currentRow.id}`}
            open={open === "delete"}
            onOpenChange={() => {
              setOpen("delete");
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
