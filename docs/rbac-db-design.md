# ออกแบบ RBAC (auth ↔ lamb_id + role/permission matrix)

สรุปจากการ grill-me เมื่อ 2026-08-13 (ต่อจาก [`attendance-db-design.md`](./attendance-db-design.md))
— อ้างอิงจาก `dataSeedV2Permission_Matrix_.csv` ที่ผู้ใช้ส่งมา

**แก้ไขความเข้าใจผิดจาก session ก่อนหน้า:** ตอนคุยเรื่อง attendance เข้าใจผิดว่า
`progress:edit:own` ให้สิทธิ์ member ด้วย จึงถามว่า attendance ควรเป็นข้อยกเว้นไหม — อ่าน CSV
ใหม่ชัดๆ แล้วพบว่า **`progress:edit:own` ไม่มี member เลย** (มีแค่ super_admin/admin/
team_leader/cell_leader) มีแต่ `progress:read:own` เท่านั้นที่ member เห็นได้ — เพราะฉะนั้น
attendance ไม่ต้องมี exception พิเศษ ใช้ตรรกะ `progress:edit:*` ปกติของ matrix ได้เลย
(member อ่านได้ แก้ไม่ได้ อยู่แล้วโดย matrix เอง)

## 1. ขอบเขตรอบนี้

ทำเต็มรูปแบบตาม CSV **ยกเว้น**:
- หมวด `lamb:delete` / `group:delete` — เอาออกจากรอบนี้ก่อน (ตัดสินใจทีหลัง)
- หมวด `user:invite` / `edit_role` / `reset_password` / `deactivate` — ต้องเรียก Supabase
  Admin API (service role key) ซึ่งทำ client-side ตรงๆ ไม่ได้ รอบนี้ออกแค่สคีมา + แนวทาง
  ไม่สร้าง Edge Function จริง (ดูข้อ 5)

## 2. ตาราง

```sql
-- รายชื่อ role ทั้งหมด — แยกตารางเพื่อให้ FK อ้างอิงได้ และเพิ่ม role ใหม่ในอนาคตได้โดยไม่ต้อง
-- แก้ enum/migration (เช่นถ้าจะแยก super_admin ออกจาก admin จริง ก็ insert role ใหม่ได้เลย)
create table roles (
  code text primary key,
  name_th text not null,
  sort_order int not null default 0
);

insert into roles (code, name_th, sort_order) values
  ('super_admin', 'ผู้ดูแลระบบสูงสุด', 1),
  ('admin', 'ผู้ดูแลระบบ', 2),
  ('team_leader', 'หัวหน้าทีม (เดิม: leader)', 3),
  ('cell_leader', 'หัวหน้าแคร์ (เดิม: leader_group)', 4),
  ('member', 'สมาชิก', 5),
  ('visitor', 'ผู้เยี่ยมชม', 6);

-- Data-driven matrix — แก้สิทธิ์ได้ด้วย SQL update เฉยๆ ไม่ต้อง migrate โค้ด
-- (รองรับ note ท้าย CSV ที่บอกว่าจะเพิ่ม system:settings ให้ super_admin ทีหลัง)
create table role_permissions (
  role text not null references roles(code) on delete cascade,
  permission text not null,
  primary key (role, permission)
);

-- seed ตรงจาก CSV ทุกช่องที่มี X (ไม่รวม *:delete และ user:* — ดูข้อ 1)
insert into role_permissions (role, permission) values
  -- lamb
  ('super_admin','lamb:create'),('admin','lamb:create'),('team_leader','lamb:create'),('cell_leader','lamb:create'),
  ('super_admin','lamb:read:all'),('admin','lamb:read:all'),('team_leader','lamb:read:all'),
  ('super_admin','lamb:read:group'),('admin','lamb:read:group'),('team_leader','lamb:read:group'),('cell_leader','lamb:read:group'),
  ('super_admin','lamb:read:own'),('admin','lamb:read:own'),('team_leader','lamb:read:own'),('cell_leader','lamb:read:own'),('member','lamb:read:own'),('visitor','lamb:read:own'),
  ('super_admin','lamb:edit:all'),('admin','lamb:edit:all'),
  ('super_admin','lamb:edit:group'),('admin','lamb:edit:group'),('team_leader','lamb:edit:group'),('cell_leader','lamb:edit:group'),
  ('super_admin','lamb:edit:own'),('admin','lamb:edit:own'),('team_leader','lamb:edit:own'),('cell_leader','lamb:edit:own'),('member','lamb:edit:own'),
  ('super_admin','lamb:export'),('admin','lamb:export'),('team_leader','lamb:export'),('cell_leader','lamb:export'),
  -- group
  ('super_admin','group:create'),('admin','group:create'),('team_leader','group:create'),
  ('super_admin','group:read:all'),('admin','group:read:all'),('team_leader','group:read:all'),
  ('super_admin','group:read:own'),('admin','group:read:own'),('team_leader','group:read:own'),('cell_leader','group:read:own'),('member','group:read:own'),
  ('super_admin','group:edit:all'),('admin','group:edit:all'),('team_leader','group:edit:all'),
  ('super_admin','group:edit:own'),('admin','group:edit:own'),('team_leader','group:edit:own'),('cell_leader','group:edit:own'),
  ('super_admin','group:assign_leader'),('admin','group:assign_leader'),('team_leader','group:assign_leader'),
  -- progress (attendance อยู่ในหมวดนี้)
  ('super_admin','progress:read:all'),('admin','progress:read:all'),('team_leader','progress:read:all'),
  ('super_admin','progress:read:group'),('admin','progress:read:group'),('team_leader','progress:read:group'),('cell_leader','progress:read:group'),
  ('super_admin','progress:read:own'),('admin','progress:read:own'),('team_leader','progress:read:own'),('cell_leader','progress:read:own'),('member','progress:read:own'),
  ('super_admin','progress:edit:all'),('admin','progress:edit:all'),
  ('super_admin','progress:edit:group'),('admin','progress:edit:group'),('team_leader','progress:edit:group'),('cell_leader','progress:edit:group'),
  ('super_admin','progress:edit:own'),('admin','progress:edit:own'),('team_leader','progress:edit:own'),('cell_leader','progress:edit:own'),
  -- report
  ('super_admin','report:view'),('admin','report:view'),('team_leader','report:view'),('cell_leader','report:view'),
  ('super_admin','report:export'),('admin','report:export'),('team_leader','report:export');

-- ใครมี role อะไรบ้าง — 1 คนมีได้หลาย role (เช่น team_leader ที่เป็น cell_leader ของ
-- เซลตัวเองด้วย)
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  lamb_id uuid not null references lamb_info(id) on delete cascade,
  role text not null references roles(code),
  created_at timestamptz not null default now(),
  unique (lamb_id, role)
);

-- ผูก auth account เข้ากับ lamb_info โดยตรงตามที่ตกลง — nullable เพราะแกะบางคนยังไม่มี
-- account ของตัวเอง (เช่น เด็กเล็ก, คนที่แอดมินกรอกให้แต่ยังไม่ได้ invite)
alter table lamb_info add column auth_user_id uuid unique references auth.users(id) on delete set null;

-- ผูก "ทีม" เข้ากับ team_leader โดยตรง (ไม่มี team entity แยก ตามที่ตกลง) — group_care
-- หลายแถวชี้มาที่ team_leader_lamb_id เดียวกันได้ = กลุ่มเซลทั้งหมดที่ทีมนี้ดูแล
alter table group_care add column team_leader_lamb_id uuid references lamb_info(id) on delete set null;

create index user_roles_lamb_idx on user_roles (lamb_id);
create index group_care_team_leader_idx on group_care (team_leader_lamb_id);
```

**หมายเหตุ `is_leader_group_care`:** ตกลงกันว่าเก็บไว้ทั้งสองอย่าง — `lamb_info.is_leader_group_care`
(flag เดิม ใช้แสดงผล UI) กับ `user_roles.role = 'cell_leader'` (ใช้เช็คสิทธิ์จริงผ่าน RLS) จะไม่
sync กันอัตโนมัติ ต้องอัปเดตคู่กันเองตอนแต่งตั้ง/ถอดหัวหน้าแคร์ — ถ้าในอนาคตเจอบั๊กข้อมูลสอง
จุดไม่ตรงกัน ให้กลับมาดูข้อนี้ก่อน

## 3. Helper functions (ใช้ใน RLS)

```sql
-- lamb_info.id ของผู้ใช้ที่ล็อกอินอยู่ — SECURITY DEFINER เพื่อไม่ให้ชนกับ RLS ของ lamb_info เอง
create function auth_lamb_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from lamb_info where auth_user_id = auth.uid();
$$;

-- เช็คว่าผู้ใช้ปัจจุบันมี permission นี้ไหม (ผ่าน role ใดก็ได้ที่ตัวเองมี)
create function auth_has_permission(perm text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from user_roles ur
    join role_permissions rp on rp.role = ur.role
    where ur.lamb_id = auth_lamb_id()
      and rp.permission = perm
  );
$$;

-- เซลทั้งหมดที่ผู้ใช้ปัจจุบันมี "group scope" อยู่เหนือ:
-- - cell_leader → เซลของตัวเอง (lamb_info.group_care ของตัวเอง)
-- - team_leader → ทุกเซลที่ group_care.team_leader_lamb_id ชี้มาที่ตัวเอง
create function auth_cell_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from group_care where team_leader_lamb_id = auth_lamb_id()
  union
  select group_care from lamb_info where id = auth_lamb_id() and group_care is not null;
$$;
```

## 4. RLS ของ `lamb_attendance_log` (แทนเวอร์ชัน permissive เดิม)

อัปเดตจาก `attendance-db-design.md` ข้อ 1 — แทนที่ 3 policy แบบ `using (true)` เดิมด้วยอันนี้:

```sql
drop policy if exists "authenticated can read attendance" on lamb_attendance_log;
drop policy if exists "authenticated can write attendance" on lamb_attendance_log;
drop policy if exists "authenticated can update attendance" on lamb_attendance_log;

create policy "read attendance by scope"
  on lamb_attendance_log for select
  to authenticated
  using (
    auth_has_permission('progress:read:all')
    or (
      auth_has_permission('progress:read:group')
      and lamb_id in (select id from lamb_info where group_care in (select auth_cell_ids()))
    )
    or (
      auth_has_permission('progress:read:own')
      and lamb_id = auth_lamb_id()
    )
  );

create policy "insert attendance by scope"
  on lamb_attendance_log for insert
  to authenticated
  with check (
    auth_has_permission('progress:edit:all')
    or (
      auth_has_permission('progress:edit:group')
      and lamb_id in (select id from lamb_info where group_care in (select auth_cell_ids()))
    )
  );

create policy "update attendance by scope"
  on lamb_attendance_log for update
  to authenticated
  using (
    auth_has_permission('progress:edit:all')
    or (
      auth_has_permission('progress:edit:group')
      and lamb_id in (select id from lamb_info where group_care in (select auth_cell_ids()))
    )
  );
```

ไม่มี branch `progress:edit:own` เพราะ matrix ไม่ได้ให้สิทธิ์นี้กับ member เลย (ดูหัวข้อแก้ไข
ความเข้าใจผิดด้านบน) — ผลคือ **หัวหน้าแคร์ (cell_leader) แก้ได้เฉพาะสมาชิกในเซลตัวเอง,
หัวหน้าทีม (team_leader) แก้ได้ทุกเซลในทีม, admin/super_admin แก้ได้ทุกคน, member/visitor
อ่านได้อย่างเดียว (เห็นแค่แถวของตัวเอง)** ตรงกับโจทย์ตั้งต้นเป๊ะ

ตารางอื่นในโดเมน "ความคืบหน้า" (`lamb_lesson_progress`, `gift_from_god`, `quiet_time_weekly_log`,
`lamb_time_logs`) ใช้แพทเทิร์น RLS เดียวกันนี้ได้เลย เปลี่ยนแค่ชื่อตาราง/คอลัมน์ `lamb_id`

## 5. `user:*` (invite / edit_role / reset_password / deactivate) — แนวทาง ยังไม่ทำรอบนี้

permission กลุ่มนี้ควบคุมการเรียก Supabase Admin API ซึ่งต้องใช้ service role key — **ห้ามเรียก
จาก client โดยตรงเด็ดขาด** (key จะหลุดไปอยู่ใน browser) ต้องผ่าน Edge Function เท่านั้น
แนวทางเมื่อจะสร้างจริง:

1. Edge Function รับ request พร้อม JWT ของผู้เรียก
2. เช็คสิทธิ์ก่อนด้วย `auth_has_permission('user:invite')` (หรือ permission ที่ตรงกับ action) ผ่าน
   client Supabase ที่ผูก JWT ของผู้เรียก (ไม่ใช่ service role) — ถ้าไม่มีสิทธิ์ ปฏิเสธทันที
3. ผ่านแล้วค่อยสลับไปใช้ service role client เรียก `supabase.auth.admin.*` (inviteUserByEmail /
   updateUserById / deleteUser ฯลฯ)
4. `edit_role` แก้ที่ตาราง `user_roles` ธรรมดา (insert/delete แถว) ไม่ต้องผ่าน Admin API เลย —
   แต่ endpoint เดียวกันควรเช็คสิทธิ์เหมือนกันเพื่อไม่ให้ cell_leader เผลอมาแก้ role ตัวเองได้

## 6. สิ่งที่เหลือทำ

- ยังไม่ตัดสินใจ semantics ของ `lamb:delete` / `group:delete` (ลบจริง vs ปิดใช้งานผ่าน
  `status`/`is_active`) — ตัดออกจากรอบนี้ตามที่ขอ
- ยังไม่สร้าง Edge Function จริงสำหรับหมวด `user:*` (ดูข้อ 5)
- ต้องตัดสินใจว่าใครเป็นคนกด "invite" ให้แกะแต่ละคนผูก `auth_user_id` ครั้งแรก (ตอนนี้ยังไม่มี
  flow สมัคร/เชิญ — ต้องออกแบบหน้าจอ "เชิญสมาชิกเข้าระบบ" แยกอีกที)
- `is_leader_group_care` กับ `user_roles.role='cell_leader'` ไม่ sync กันอัตโนมัติ (ข้อ 2)
