import { LambInfoActionDialog } from "./lamb-info-action-dialog";
import { LambInfoDeleteDialog } from "./lamb-info-delete-dialog";
import { useLambInfo } from "./lamb-info-provider";

export function LambInfoDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useLambInfo();
  return (
    <>
      <LambInfoActionDialog
        key="lamb-info-add"
        open={open === "add"}
        onOpenChange={() => setOpen("add")}
      />

      {currentRow && (
        <>
          <LambInfoActionDialog
            key={`lamb-info-edit-${currentRow.id}`}
            open={open === "edit"}
            onOpenChange={() => {
              setOpen("edit");
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow}
          />

          <LambInfoDeleteDialog
            key={`lamb-info-delete-${currentRow.id}`}
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
