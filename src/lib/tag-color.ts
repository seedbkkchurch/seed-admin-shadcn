// Deterministic color assignment for free-text labels (lamb_info.tags,
// group_care.name, ...). The same input string always maps to the same
// entry in TAG_COLORS, so identical labels always render with identical
// colors wherever they're shown (table cells, profile badges, etc.).
const TAG_COLORS = [
  'bg-violet-100/30 text-violet-900 border-violet-200 dark:text-violet-200',
  'bg-sky-100/30 text-sky-900 border-sky-200 dark:text-sky-200',
  'bg-amber-100/30 text-amber-900 border-amber-200 dark:text-amber-200',
  'bg-rose-100/30 text-rose-900 border-rose-200 dark:text-rose-200',
  'bg-emerald-100/30 text-emerald-900 border-emerald-200 dark:text-emerald-200',
  'bg-orange-100/30 text-orange-900 border-orange-200 dark:text-orange-200',
] as const

export function getTagColorClass(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0
  }
  const index = Math.abs(hash) % TAG_COLORS.length
  return TAG_COLORS[index]
}
