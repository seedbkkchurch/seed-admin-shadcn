// Fixed discipleship curriculum used on the lamb profile's Growth Progress
// card. This list is the same for every lamb — there is no backing table
// for it yet, so completion state on the profile page is local-only (not
// persisted). See growth-progress-card.tsx.
export type GrowthLesson = {
  id: number
  title: string
}

export const GROWTH_LESSONS: GrowthLesson[] = [
  { id: 1, title: 'พระเจ้าคือใคร' },
  { id: 2, title: 'พระเยซูคริสต์' },
  { id: 3, title: 'พระวิญญาณบริสุทธิ์' },
  { id: 4, title: 'การอธิษฐาน' },
  { id: 5, title: 'พระคัมภีร์' },
  { id: 6, title: 'ความรอด' },
  { id: 7, title: 'การบัพติศมา' },
  { id: 8, title: 'คริสตจักร' },
  { id: 9, title: 'การเป็นสาวก' },
  { id: 10, title: 'การเป็นพยาน' },
  { id: 11, title: 'การถวาย' },
  { id: 12, title: 'การรับใช้' },
  { id: 13, title: 'การนมัสการ' },
  { id: 14, title: 'ความบาป' },
  { id: 15, title: 'การกลับใจใหม่' },
  { id: 16, title: 'ชีวิตที่บริสุทธิ์' },
  { id: 17, title: 'การทดลอง' },
  { id: 18, title: 'การเติบโตฝ่ายวิญญาณ' },
]
