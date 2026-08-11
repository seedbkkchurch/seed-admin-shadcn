import React, { useState } from "react";
import useDialogState from "@/hooks/use-dialog-state";
import { type LambInfoRow } from "../data/schema";

type LambInfoDialogType = "add" | "edit" | "delete";

type LambInfoContextType = {
  open: LambInfoDialogType | null;
  setOpen: (str: LambInfoDialogType | null) => void;
  currentRow: LambInfoRow | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<LambInfoRow | null>>;
};

const LambInfoContext = React.createContext<LambInfoContextType | null>(null);

export function LambInfoProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<LambInfoDialogType>(null);
  const [currentRow, setCurrentRow] = useState<LambInfoRow | null>(null);

  return (
    <LambInfoContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </LambInfoContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLambInfo = () => {
  const lambInfoContext = React.useContext(LambInfoContext);

  if (!lambInfoContext) {
    throw new Error("useLambInfo has to be used within <LambInfoContext>");
  }

  return lambInfoContext;
};
