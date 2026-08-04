import { PersonalityTypeActionDialog } from './personality-type-action-dialog'
import { PersonalityTypeDeleteDialog } from './personality-type-delete-dialog'
import { usePersonalityType } from './personality-type-provider'

export function PersonalityTypeDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = usePersonalityType()
  return (
    <>
      <PersonalityTypeActionDialog
        key='personality-type-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      {currentRow && (
        <>
          <PersonalityTypeActionDialog
            key={`personality-type-edit-${currentRow.code}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <PersonalityTypeDeleteDialog
            key={`personality-type-delete-${currentRow.code}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  )
}
