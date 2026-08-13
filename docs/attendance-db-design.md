# ออกแบบตาราง `lamb_attendance_log` (มาโบสถ์ + มากลุ่มแคร์ รายสัปดาห์)

สรุปจากการ grill-me เมื่อ 2026-08-13 — สมมติฐานที่ตกลงกัน:

- **เรื่องสิทธิ์ "หัวหน้าแคร์เท่านั้นที่แก้ไขได้" ยังไม่ได้ตัดสินใจ** — ระบบตอนนี้ล็อกอินแบบ
  single shared login ผ่าน Supabase Auth (แอดมินทุกคนเห็น/แก้เหมือนกันหมด) ยังไม่มีการ map
  ระหว่าง auth user กับหัวหน้าแคร์คนไหน ผู้ใช้ขอให้ **ออกแบบตารางก่อน** แล้วค่อยกลับมาคุยเรื่อง
  auth/RLS ทีหลัง — ดู "สิ่งที่เหลือทำ" ท้ายเอกสาร
- 1 แถว = 1 คน × 1 สัปดาห์ (normalized ไม่ใช้ array แบบ `quiet_time_weekly_log`)
- โบสถ์กับแคร์เป็นคนละวันกัน (โบสถ์ = วันอาทิตย์เสมอ, แคร์ = แล้วแต่ `group_care.day`) แต่
  **รวมอยู่แถวเดียวกัน** เป็น 2 boolean columns คนละช่อง ไม่แยก type เป็นคนละแถว
- นับสัปดาห์เริ่มจาก**วันอาทิตย์** (`week_start` = วันอาทิตย์ของสัปดาห์นั้น) เพื่อให้โบสถ์
  (อาทิตย์) กับแคร์ (วันอื่นในสัปดาห์เดียวกัน) ตกอยู่ใน bucket เดียวกันเสมอ
- ค่า attendance เก็บแค่ **boolean มา/ไม่มา** ไม่มี status ละเอียด (ลา/ป่วย ฯลฯ) — ถ้าอยากใส่
  บริบทเพิ่มมี `note` text ช่องเดียวให้ใช้ร่วมกันทั้งสองอย่าง
- **ไม่ snapshot `group_care_id`** ลงในแถว — อิงจาก `lamb_info.group_care` สดตอน query/join
  เสมอ (ถ้าสมาชิกย้ายกลุ่ม ข้อมูลเก่าจะขยับไปอยู่กับกลุ่มใหม่ตามไปด้วย ไม่ใช่ค้างอยู่กลุ่มเดิม)
- **ไม่ pre-populate** แถวให้ทุกคนล่วงหน้า — insert เฉพาะตอนหัวหน้าแคร์กดบันทึกจริง (แถวไม่มี
  = "ยังไม่ได้เช็ค" ไม่ใช่ "ไม่มาโดย default")
- เก็บ `recorded_by` (อ้าง `auth.users`, nullable) ไว้ตั้งแต่ตอนนี้เพื่อเตรียม audit trail แม้
  ระบบสิทธิ์เฉพาะหัวหน้าแคร์จะยังไม่เสร็จ

## 1. ตาราง

```sql
-- ตารางหลัก: 1 แถว = attendance ของ 1 คนใน 1 สัปดาห์ (ทั้งโบสถ์และแคร์)
create table lamb_attendance_log (
  id uuid primary key default gen_random_uuid(),
  lamb_id uuid not null references lamb_info(id) on delete cascade,

  -- วันอาทิตย์ของสัปดาห์นั้น เช่น 2026-08-09 — ใช้เป็น bucket เดียวสำหรับทั้ง
  -- โบสถ์ (เกิดวันอาทิตย์เป๊ะ) และแคร์ (เกิดวันอื่นในสัปดาห์เดียวกัน แล้วแต่กลุ่ม)
  week_start date not null,

  came_to_church boolean not null default false,
  came_to_group_care boolean not null default false,

  -- เหตุผล/บริบทเพิ่มเติม ใช้ร่วมกันทั้งสองช่อง เช่น "ลาป่วย", "ติดธุระต่างจังหวัด"
  note text,

  -- ใครเป็นคนบันทึก — เตรียมไว้สำหรับ audit trail แม้ตอนนี้ระบบยังไม่แยกสิทธิ์
  -- ตามหัวหน้าแคร์แต่ละกลุ่ม (ดู "สิ่งที่เหลือทำ")
  recorded_by uuid references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint lamb_attendance_log_one_per_week unique (lamb_id, week_start)
);

-- Query หลักคือ "ดูสัปดาห์นี้ทั้งกลุ่ม" และ "ดูประวัติของคนคนเดียว" — สอง index นี้ครอบคลุม
create index lamb_attendance_log_week_idx on lamb_attendance_log (week_start desc);
create index lamb_attendance_log_lamb_idx on lamb_attendance_log (lamb_id);

-- RLS: เปิดใช้แล้วอนุญาต authenticated ทุกคนอ่าน/เขียนได้ไปก่อน (เหมือน lamb_devotion) —
-- ต้องกลับมาทำ policy จำกัดสิทธิ์ "หัวหน้าแคร์แก้ได้เฉพาะกลุ่มตัวเอง" ทีหลัง เมื่อตัดสินใจ
-- เรื่อง auth mapping แล้ว (ดูข้อ 3)
alter table lamb_attendance_log enable row level security;

create policy "authenticated can read attendance"
  on lamb_attendance_log for select
  to authenticated
  using (true);

create policy "authenticated can write attendance"
  on lamb_attendance_log for insert
  to authenticated
  with check (true);

create policy "authenticated can update attendance"
  on lamb_attendance_log for update
  to authenticated
  using (true);
```

**ทำไม `week_start` แทน `attendance_date` ตรงๆ:** เพราะโบสถ์กับแคร์เกิดคนละวันในสัปดาห์
เดียวกัน ถ้าเก็บวันที่จริงแยกกันจะต้องมี 2 คอลัมน์วันที่ (`church_date`, `group_care_date`)
ซึ่งซับซ้อนเกินจำเป็นเมื่อ business rule คือ "โบสถ์เกิดอาทิตย์เสมอ" — ใช้ `week_start` เป็น
anchor เดียวพอ ถ้าจำเป็นต้องรู้วันที่แคร์นัดจริง หาได้จาก `group_care.day` (join แยก)

**ทำไมไม่แยกตาราง `church_attendance` กับ `group_care_attendance`:** สองอย่างนี้ผูกกับคนเดียว
ในสัปดาห์เดียวกันเสมอ และ UI (ตาราง/กริดรายสัปดาห์) น่าจะโชว์คู่กันเป็นปกติ — รวมแถวเดียวทำให้
query "ใครมาโบสถ์แต่ไม่มาแคร์" ง่ายกว่ามาก (ไม่ต้อง join เทียบสองตาราง)

## 2. ตัวอย่าง query ที่ต้องใช้บ่อย

```sql
-- ตารางรายสัปดาห์ของกลุ่มแคร์กลุ่มหนึ่ง (join lamb_info เพื่อกรองตามกลุ่มปัจจุบัน)
select li.id, li.nick_name, al.came_to_church, al.came_to_group_care, al.note
from lamb_info li
left join lamb_attendance_log al
  on al.lamb_id = li.id and al.week_start = '2026-08-09'
where li.group_care = '<group_care_id>'
order by li.nick_name;

-- Upsert ตอนหัวหน้าแคร์กดบันทึก (insert เฉพาะตอนบันทึกจริง ไม่ pre-populate)
insert into lamb_attendance_log (lamb_id, week_start, came_to_church, came_to_group_care, note, recorded_by)
values ($1, $2, $3, $4, $5, auth.uid())
on conflict (lamb_id, week_start)
do update set
  came_to_church = excluded.came_to_church,
  came_to_group_care = excluded.came_to_group_care,
  note = excluded.note,
  recorded_by = excluded.recorded_by,
  updated_at = now();
```

## 3. สิ่งที่เหลือทำ — **อัปเดต: ตัดสินใจแล้ว ดู `rbac-db-design.md`**

เรื่องสิทธิ์ "หัวหน้าแคร์เท่านั้นที่แก้ไขได้" คุยต่อในรอบ grill-me ถัดมา (2026-08-13 เช่นกัน)
ผลสรุปคือระบบ RBAC เต็มรูปแบบ (auth ผูกกับ `lamb_id` + role/permission matrix 6 role) — ดู
รายละเอียดทั้งหมดใน [`rbac-db-design.md`](./rbac-db-design.md) โดยเฉพาะข้อ 4 ที่มี RLS policy
จริงของตารางนี้ (แทนที่ policy แบบ `using (true)` ในข้อ 1 ด้านบน)
