# ออกแบบตาราง `lamb_prayer_request` (รายการคำอธิษฐาน)

สรุปจากการ grill-me เมื่อ 2026-08-18 — สมมติฐานที่ตกลงกัน:

- **Self-service** — ลูกแกะกรอกเองผ่านบัญชีที่ผูกกับ `lamb_info.auth_user_id`
  (เหมือน DevotionEditor/Subscribe/MobileTabBar — auto-detect lamb จาก auth
  แทน manual picker) ไม่ใช่ admin กรอกแทนแบบ `lamb_devotion`
- 1 lamb มีได้หลายรายการ, แยก 2 ประเภทตายตัว (`prayer_entry_type` enum):
  `prayer` (คำอธิษฐาน) กับ `conversation` (สิ่งที่พระเจ้าคุยด้วย) — เพิ่ม
  `andrew` (รายชื่อแอนดรู) เป็นประเภทที่ 3 เมื่อ 2026-10-28 ดูข้อ 3.1
- เนื้อหาแยก `title` (บังคับ) + `detail` (ไม่บังคับ) — plain text ทั้งคู่
- **Private โดย default** — เจ้าของเลือกเปิดแชร์ (`is_shared`) ทีละรายการ
  ให้ cell_leader (เซลตัวเอง) / team_leader (ทีม) / admin / super_admin
  เห็นได้ ตามสโคป RBAC เดิม (`progress:read:group` / `progress:read:all`)
- "พระเจ้าตอบแล้ว" = `is_answered` + `answered_date` (date, เลือกเองได้ผ่าน
  date picker ไม่ auto = วันนี้เสมอ เผื่อกรอกย้อนหลัง) — uncheck ได้ (revert
  กลับเป็นยังไม่ตอบ ไม่ใช่ audit-trail กันแก้)
- ระยะเวลา "รอกี่วัน" = `created_at` (วันที่กรอก) ถึง `answered_date` —
  แสดงเฉพาะรายการที่ตอบแล้วเท่านั้น (รายการที่ยังไม่ตอบไม่นับถอยหลัง) —
  คำนวณฝั่งแอปล้วนๆ ไม่เก็บเป็นคอลัมน์ (ดู `prayerDurationDays()` ใน
  `src/features/prayer-list/data/schema.ts`)
- แก้ไข/ลบรายการของตัวเองได้เสมอ (hard delete, ไม่มี soft-delete/history)

## 1. ตาราง

```sql
create type prayer_entry_type as enum ('prayer', 'conversation');

create table lamb_prayer_request (
  id uuid primary key default gen_random_uuid(),
  lamb_id uuid not null references lamb_info(id) on delete cascade,
  type prayer_entry_type not null default 'prayer',
  title text not null,
  detail text,
  is_shared boolean not null default false,
  is_answered boolean not null default false,
  answered_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lamb_prayer_request_answered_date_check
    check (is_answered = false or answered_date is not null)
);

create index lamb_prayer_request_lamb_id_idx on lamb_prayer_request (lamb_id);
create index lamb_prayer_request_type_idx on lamb_prayer_request (type);
```

## 2. RLS

```sql
alter table lamb_prayer_request enable row level security;

-- เจ้าของอ่าน/เขียน/แก้/ลบรายการของตัวเองได้เสมอ ไม่ว่าจะแชร์หรือไม่
create policy "lamb can manage own prayer requests"
  on lamb_prayer_request for all
  to authenticated
  using (lamb_id = auth_lamb_id())
  with check (lamb_id = auth_lamb_id());

-- leader/admin เห็นได้เฉพาะรายการที่เจ้าของเปิดแชร์ไว้ ตามสโคป RBAC เดิม
create policy "leaders can view shared prayer requests in scope"
  on lamb_prayer_request for select
  to authenticated
  using (
    is_shared = true
    and (
      auth_has_permission('progress:read:all')
      or (
        auth_has_permission('progress:read:group')
        and lamb_id in (select id from lamb_info where group_care in (select auth_cell_ids()))
      )
    )
  );
```

ใช้ helper function เดิมจาก `docs/rbac-db-design.md` (`auth_lamb_id()`,
`auth_has_permission()`, `auth_cell_ids()`) — ไม่มีการเพิ่ม helper ใหม่
ตรงกับ scope เดียวกับที่ `lamb_attendance_log` ใช้อยู่แล้ว
(`progress:read:all` = super_admin/admin/team_leader, `progress:read:group`
= + cell_leader ในเซลตัวเอง)

## 3. Migration ที่ apply แล้ว

`create_lamb_prayer_request` — apply ตรงบน project `xfafvwecxcpidoliuqpg`
(supabase-seed-data) วันที่ 2026-08-18

`add_andrew_prayer_entry_type` — apply วันที่ 2026-10-28:

```sql
alter type prayer_entry_type add value if not exists 'andrew';
```

## 3.1 แท็บ "รายชื่อแอนดรู" (grill-me 2026-10-28)

- เพิ่มเป็นประเภทที่ 3 ในตารางเดิม (enum `andrew`) — ไม่สร้างตารางใหม่
  ใช้ RLS / `is_shared` เดิมได้ทันที
- ใช้ฟิลด์เดิม: `title` = ชื่อคนที่อธิษฐานเผื่อ, `detail` = หมายเหตุ,
  `is_answered` + `answered_date` = "รับเชื่อแล้ว" + วันที่ (แสดง "รอ X วัน"
  เหมือนเดิม) — ข้อความต่อประเภทอยู่ใน `PRAYER_ENTRY_TYPE_COPY`
- ไม่มีสถานะหลายขั้น / เบอร์โทร / จำกัดจำนวนชื่อ

## 3.3 รูปคนในแท็บแอนดรู (grill-me 2026-10-28)

เป็นรูปของคนภายนอกที่ไม่ได้ยินยอม จึงแยกไว้ใน **bucket private จริง**
`prayer-private` (ไม่ใช้ `bucket-seed` ซึ่ง public ทั้ง bucket) —
migration `add_prayer_request_photo_private_bucket`:

- คอลัมน์ใหม่ `lamb_prayer_request.photo_path text` (storage path ไม่ใช่ URL)
- bucket `prayer-private`: `public=false`, ≤ 2MB, `image/jpeg` เท่านั้น
- path = `{lamb_id}/{request_id}.jpg` — RLS บน `storage.objects` ให้
  select/insert/update/delete ได้เฉพาะเมื่อโฟลเดอร์แรก = `auth_lamb_id()`
- แสดงผลผ่าน signed URL อายุ 1 ชม. (`usePrayerPhotoUrl` ใน
  `src/lib/supabase/prayer-photo.ts`) — ไม่มีลิงก์ถาวร
- อัปโหลดใช้ `AvatarUpload` โหมด deferred (ครอปจัตุรัส 256px) แล้วอัปตอนกด
  บันทึก; ลบรายการ/กด "ลบรูป" จะลบไฟล์ตาม
- หมายเหตุ: leader ที่เห็นรายการแชร์ (`is_shared`) จะ**ไม่**เห็นรูป เพราะ
  storage RLS ให้เจ้าของเท่านั้น — ถ้าต้องการทีหลังต้องเพิ่ม policy

## 3.4 ไอคอนในแท็บคำอธิษฐาน / สิ่งที่พระเจ้าคุยด้วย (grill-me 2026-10-28)

- migration `add_prayer_request_icon`: คอลัมน์ `icon text` (nullable) เก็บ
  key ไอคอน เช่น `heart-pulse` — ไม่ใช้ enum/check เพื่อให้เพิ่ม/ลดชุดได้
  โดยไม่แก้ DB
- ชุด 16 ไอคอน lucide ใช้ร่วมกันทั้งสองแท็บ อยู่ใน
  `src/features/prayer-list/data/icons.ts` (`PRAYER_ICONS`)
- ไม่บังคับเลือก — ไม่เลือก/key ไม่รู้จัก = ไอคอนตั้งต้นของแท็บ (คำอธิษฐาน
  `hand-heart`, สิ่งที่พระเจ้าคุยด้วย `message-circle`)
- แท็บแอนดรูไม่มีไอคอน (ใช้รูปแทน ข้อ 3.3)

## 3.2 การ์ดย่อ/ขยายข้อความ (grill-me 2026-10-28)

- ทุกแท็บ: `title` ตัด 1 บรรทัด, `detail` ตัด 2 บรรทัด — กดที่ข้อความหรือ
  "ดูเพิ่มเติม" เพื่อขยายในการ์ด (ไม่ใช้ป๊อปอัป) ลิงก์โผล่เฉพาะเมื่อล้นจริง

## 4. ขอบเขตที่ยังไม่ทำรอบนี้

- ยังไม่มีหน้าให้ leader/admin ดูรายการที่แชร์มา (`is_shared=true`) — RLS
  รองรับแล้ว (policy ข้อ 2) แต่หน้า UI ยังไม่สร้าง เพราะโจทย์รอบนี้ขอแค่
  หน้า self-service ของเจ้าของ (`/prayer-list`) ถ้าต้องการหน้าดูของทีม/เซล
  ทีหลัง ต่อยอดจาก policy เดิมได้เลยไม่ต้องแก้ schema
- ไม่มี answer note (คำอธิบายว่าพระตอบอย่างไร) — ตกลงว่าเอาแค่
  checkbox + วันที่พอ
