import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type GroupCareRowWithMembers } from '../data/schema'

type GroupCareDialogType = 'add' | 'edit' | 'delete' | 'members'

type GroupCareContextType = {
  open: GroupCareDialogType | null
  setOpen: (str: GroupCareDialogType | null) => void
  // Rows always carry their members list once table data is loaded (see
  // index.tsx), so currentRow uses the augmented type even though the
  // add/edit/delete dialogs only read the base GroupCareRow fields off it.
  currentRow: GroupCareRowWithMembers | null
  setCurrentRow: React.Dispatch<
    React.SetStateAction<GroupCareRowWithMembers | null>
  >
}

const GroupCareContext = React.createContext<GroupCareContextType | null>(null)

export function GroupCareProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<GroupCareDialogType>(null)
  const [currentRow, setCurrentRow] =
    useState<GroupCareRowWithMembers | null>(null)

  return (
    <GroupCareContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </GroupCareContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useGroupCare = () => {
  const groupCareContext = React.useContext(GroupCareContext)

  if (!groupCareContext) {
    throw new Error('useGroupCare has to be used within <GroupCareContext>')
  }

  return groupCareContext
}
