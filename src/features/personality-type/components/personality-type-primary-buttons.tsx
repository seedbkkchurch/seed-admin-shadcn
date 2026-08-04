import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonalityType } from './personality-type-provider'

export function PersonalityTypePrimaryButtons() {
  const { setOpen } = usePersonalityType()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Add Personality Type</span> <Plus size={18} />
      </Button>
    </div>
  )
}
