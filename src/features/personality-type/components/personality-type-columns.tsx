import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type PersonalityTypeRow } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const personalityTypeColumns: ColumnDef<PersonalityTypeRow>[] = [
  {
    accessorKey: 'code',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Code' />
    ),
    cell: ({ row }) => (
      <div className='ps-3 font-medium'>{row.getValue('code')}</div>
    ),
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'archetype',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Archetype' />
    ),
    cell: ({ row }) => <div>{row.getValue('archetype') || '-'}</div>,
    enableSorting: false,
  },
  {
    accessorKey: 'description_th',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Description (TH)' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-64'>
        {row.getValue('description_th') || '-'}
      </LongText>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'description_en',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Description (EN)' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-64'>
        {row.getValue('description_en') || '-'}
      </LongText>
    ),
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
