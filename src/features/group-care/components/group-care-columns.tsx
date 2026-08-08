import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type GroupCareRowWithMembers } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'
import { GroupCareMembersCell } from './group-care-members-cell'

export const groupCareColumns: ColumnDef<GroupCareRowWithMembers>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-48 ps-3'>{row.getValue('name')}</LongText>
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
    accessorKey: 'address',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Address' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-64'>
        {row.getValue('address') || '-'}
      </LongText>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'day',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Meeting Day' />
    ),
    cell: ({ row }) => <div>{row.getValue('day') || '-'}</div>,
    enableSorting: false,
  },
  {
    id: 'members',
    accessorFn: (row) => row.members.length,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Members' />
    ),
    cell: GroupCareMembersCell,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
