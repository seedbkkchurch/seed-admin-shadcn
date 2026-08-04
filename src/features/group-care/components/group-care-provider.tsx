import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type GroupCareRow } from '../data/schema'

type GroupCareDialogType = 'add' | 'edit' | 'delete'

type GroupCareContextType = {
  open: GroupCareDialogType | null
  setOpen: (str: GroupCareDialogType | null) => void
  currentRow: GroupCareRow | null
  setCurrentRow: React.Dispatch<React.SetStateAction<GroupCareRow | null>>
}

const GroupCareContext = React.createContext<GroupCareContextType | null>(null)

export function GroupCareProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<GroupCareDialogType>(null)
  const [currentRow, setCurrentRow] = useState<GroupCareRow | null>(null)

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
