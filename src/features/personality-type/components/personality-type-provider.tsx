import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type PersonalityTypeRow } from '../data/schema'

type PersonalityTypeDialogType = 'add' | 'edit' | 'delete'

type PersonalityTypeContextType = {
  open: PersonalityTypeDialogType | null
  setOpen: (str: PersonalityTypeDialogType | null) => void
  currentRow: PersonalityTypeRow | null
  setCurrentRow: React.Dispatch<React.SetStateAction<PersonalityTypeRow | null>>
}

const PersonalityTypeContext =
  React.createContext<PersonalityTypeContextType | null>(null)

export function PersonalityTypeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useDialogState<PersonalityTypeDialogType>(null)
  const [currentRow, setCurrentRow] = useState<PersonalityTypeRow | null>(null)

  return (
    <PersonalityTypeContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </PersonalityTypeContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePersonalityType = () => {
  const personalityTypeContext = React.useContext(PersonalityTypeContext)

  if (!personalityTypeContext) {
    throw new Error(
      'usePersonalityType has to be used within <PersonalityTypeContext>'
    )
  }

  return personalityTypeContext
}
