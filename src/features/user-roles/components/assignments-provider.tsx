import React, { useState } from "react";
import useDialogState from "@/hooks/use-dialog-state";
import { type AssignmentRow } from "../data/schema";

type AssignmentsDialogType = "add" | "edit" | "delete";

type AssignmentsContextType = {
  open: AssignmentsDialogType | null;
  setOpen: (str: AssignmentsDialogType | null) => void;
  currentRow: AssignmentRow | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<AssignmentRow | null>>;
};

const AssignmentsContext = React.createContext<AssignmentsContextType | null>(
  null,
);

export function AssignmentsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useDialogState<AssignmentsDialogType>(null);
  const [currentRow, setCurrentRow] = useState<AssignmentRow | null>(null);

  return (
    <AssignmentsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </AssignmentsContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAssignments = () => {
  const assignmentsContext = React.useContext(AssignmentsContext);

  if (!assignmentsContext) {
    throw new Error(
      "useAssignments has to be used within <AssignmentsContext>",
    );
  }

  return assignmentsContext;
};
