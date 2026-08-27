# ออกแบบตาราง `lamb_devotion` (เฝ้าเดี่ยว) + คำนวณขนาดข้อมูล

สรุปจากการ grill-me เมื่อ 2026-08-09 — สมมติฐานที่ตกลงกัน:

- ~~ลูกแกะส่งเฝ้าเดี่ยวได้ **วันละ 1 ครั้ง/คน** → unique constraint
  `(lamb_id, devotion_date)`~~ **อัปเดต 2026-08-14:** เอาคอนสตรเทนต์นี้ออกแล้ว
  (migration `drop_lamb_devotion_one_per_day`) — ส่งได้ไม่จำกัดจำนวนครั้ง/วัน
  ต่อคน ดู project memory `devotion_multi_submit_design` สำหรับดีไซน์เต็ม
  (ripple effects: heatmap popover หน้าโปรไฟล์ต้องแสดงได้หลายรายการ/วัน,
  draft-recovery ในหน้าเขียน) ตัวเลขปริมาณข้อมูลในหัวข้อ 3-4 ด้านล่างยังอิง
  สมมติฐานเดิม (คนละครั้ง/วันสูงสุด) — ถ้า engagement จริงเพิ่มจากการส่งได้
  หลายครั้ง/วัน ตัวเลข worst-case จะขยับขึ้นตามสัดส่วนจำนวนครั้งเฉลี่ย/คน/วัน
- รูปภาพเก็บใน **Supabase Storage bucket** (ไม่เก็บ base64 ใน DB)
- เฉลี่ย **~30%** ของการส่งต่อวันมีรูปแนบ
- เก็บ**ตลอดไป ไม่มีกำหนดลบ**
- โบสมี **50 คน**

## 0. อัปเดต 2026-08-26 — เพิ่ม `content_type` แยกเฝ้าเดี่ยว/คำเทศนา

grill-me 2026-08-26: เพิ่มคอลัมน์ `content_type text not null default 'devotion'
check (content_type in ('devotion', 'sermon'))` บนตาราง `lamb_devotion` เดิม (migration
`add_lamb_devotion_content_type`) — ไม่แยกตารางใหม่ ทุกอย่าง (schema/editor/feed/
table/public feed) ใช้ตารางเดียวกันต่อไปเหมือนก่อนหน้านี้ทุกประการ แถวเดิมทั้งหมด
default เป็น `'devotion'` อัตโนมัติ ไม่ต้อง backfill

สิ่งที่ทำเพิ่ม:

- `DevotionEditor`/`DevotionEditFormLoaded` (หน้าเขียนเต็ม) และ `DevotionUploadDialog`
  (popup เร็ว) — เพิ่ม dropdown เลือกประเภท default เฝ้าเดี่ยว บันทึกลง draft-recovery
  ด้วย (`devotion-draft-storage.ts`)
- ตาราง admin (`devotion-table-columns.tsx`/`devotion-table.tsx`) และตารางรายลูกแกะ
  (`lamb-devotion-table-columns.tsx`/`lamb-devotion-table.tsx`) — เพิ่มคอลัมน์ badge +
  filter ประเภท (`makeDevotionContentTypeColumn`, ใช้ร่วมกันทั้งสองตาราง)
- **ภาพรวมเฝ้าเดี่ยว** (`devotion-overview/data/queries.ts`), heatmap + สถิติ +
  กราฟรายเดือน บนหน้าโปรไฟล์ลูกแกะ (`devotion-section.tsx`) — นับเฉพาะ
  `content_type = 'devotion'` เท่านั้น สรุปว่า **คำเทศนาไม่ถูกนับเป็นการส่งเฝ้าเดี่ยว**
  ("ประวัติล่าสุด" ใต้กราฟยังแสดงทั้งสองประเภทปนกัน มี badge แยก — เป็นแค่รายการดู
  ย้อนหลัง ไม่ใช่ตัวชี้วัด)
- Public feed (`public_devotion_feed` view + หน้า `/devotion`, `/devotion/$id`) — ไม่แยก
  ตามประเภท ยังกรองด้วย `is_public` เดิมเหมือนทุกอย่างก่อนหน้านี้ (คำเทศนาที่ตั้ง
  public ก็ขึ้น public feed ได้เหมือนเฝ้าเดี่ยว) แค่เพิ่ม `content_type` ในคอลัมน์ที่
  expose ให้ badge แยกแสดงได้

## 1. ตาราง

```sql
-- ตารางหลัก: 1 แถว = เฝ้าเดี่ยว 1 ครั้งของ 1 คนใน 1 วัน
create table lamb_devotion (
  id uuid primary key default gen_random_uuid(),
  lamb_id uuid not null references lamb_info(id) on delete cascade,
  devotion_date date not null,
  title text not null,
  -- HTML ที่ได้จาก Tiptap editor (ArticleEditor) — เก็บเป็น text ธรรมดา
  -- ไม่ใช่ jsonb เพราะ feed แค่ต้อง render ตรงๆ ไม่ได้ query เข้าไปในเนื้อหา
  content_html text not null,
  -- URL รูปที่แทรกในเนื้อหา (จาก Supabase Storage) เรียงตามลำดับที่แทรก
  -- null/empty array = ไม่มีรูป
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()

  -- constraint lamb_devotion_one_per_day unique (lamb_id, devotion_date)
  -- ^ เอาออกแล้ว 2026-08-14 (migration drop_lamb_devotion_one_per_day) —
  --   ส่งได้ไม่จำกัดจำนวนครั้ง/วัน/คน ดูหมายเหตุด้านบน
);

-- Feed เรียงตามวันที่ล่าสุดก่อน — index เดียวพอ เพราะข้อมูลมีน้อย (ดูหัวข้อ 3)
create index lamb_devotion_date_idx on lamb_devotion (devotion_date desc);

-- RLS: เปิดใช้แล้วอนุญาต authenticated ทุกคนอ่าน/เขียนได้ (แอปนี้เป็น admin
-- dashboard ภายใน ไม่ใช่ระบบให้ลูกแกะ login ส่งเอง) — ปรับ policy ทีหลังได้
-- ถ้าจะเปิดให้ลูกแกะส่งเองผ่านมือถือในอนาคต
alter table lamb_devotion enable row level security;

create policy "authenticated can read devotions"
  on lamb_devotion for select
  to authenticated
  using (true);

create policy "authenticated can write own church's devotions"
  on lamb_devotion for insert
  to authenticated
  with check (true);

create policy "authenticated can update devotions"
  on lamb_devotion for update
  to authenticated
  using (true);
```

**ทำไมไม่แยกตาราง `devotion_image` ต่างหาก:** ด้วย 1 คน 1 วัน 1 โพสต์ และรูปมีแค่ไม่กี่รูปต่อโพสต์
เก็บเป็น `text[]` ใน column เดียวพอ ไม่ต้อง join เพิ่ม — ประหยัดทั้ง query และ index
ถ้าในอนาคตอยากทำ "กดไลก์/คอมเมนต์" แบบ Facebook ค่อยแยกตาราง `lamb_devotion_reaction` /
`lamb_devotion_comment` ต่างหาก (คนละ concern จากตัวโพสต์)

## 2. รูปภาพ: อย่าลืม resize ก่อนอัปโหลด

โปรเจกต์มี `src/lib/image-resize.ts` อยู่แล้ว (ใช้กับรูปโปรไฟล์ ย่อเหลือ 256×256) —
สำหรับรูปในเนื้อหาบทความ แนะนำเพิ่มฟังก์ชันคล้ายกันแต่ resize แบบไม่ครอปสี่เหลี่ยม
จำกัดด้านยาวสุดไม่เกิน **1600px**, JPEG quality **0.8** → ได้ไฟล์เฉลี่ย ~150-250KB/รูป
(ถ่ายจากมือถือตรงๆ ไม่ย่อ อาจเป็น 3-8MB/รูป ซึ่งจะทำให้ตัวเลขข้อ 3 คูณขึ้นอีก ~20 เท่า)

## 3. คำนวณขนาดข้อมูล (โบส 50 คน)

### ฝั่งตาราง (ข้อความ — อยู่ใน Postgres database)

ประมาณขนาดต่อแถว (title + content_html + image_urls array + metadata + index overhead):

| ส่วน                                                                     | ขนาดโดยประมาณ  |
| ------------------------------------------------------------------------ | -------------- |
| เนื้อหาเฝ้าเดี่ยวสั้นๆ แบบในตัวอย่าง (title + html ~150-300 ตัวอักษรไทย) | ~700-900 bytes |
| `image_urls` (เฉลี่ยไม่ถึง 1 รูป/แถว เพราะมีรูปแค่ 30%)                  | ~40 bytes      |
| uuid × 2, date, timestamptz × 2, row overhead                            | ~90 bytes      |
| index overhead (unique constraint + date index)                          | ~40 bytes      |
| **รวมโดยประมาณ**                                                         | **~1 KB/แถว**  |

จำนวนแถว ถ้าสมมติ**ทุกคนส่งทุกวัน** (worst case เต็มความจุ — ในทางปฏิบัติจะน้อยกว่านี้เสมอ):

| ช่วงเวลา | จำนวนแถว          | ขนาดตารางโดยประมาณ |
| -------- | ----------------- | ------------------ |
| 1 ปี     | 50 × 365 = 18,250 | ~18 MB             |
| 5 ปี     | 91,250            | ~91 MB             |
| 10 ปี    | 182,500           | ~180 MB            |
| 20 ปี    | 365,000           | ~360 MB            |

**สรุป: ตารางนี้ไม่มีทางบวมเลย** แม้เก็บ 20 ปีก็ยังต่ำกว่า 0.5 GB — Supabase free tier
ให้ database 500 MB, Pro plan ให้ 8 GB ขึ้นไป เหลือเฟือมาก ไม่ต้องคิดเรื่อง archive/ลบข้อมูลทิ้งเลย

### ฝั่งรูปภาพ (Supabase Storage — คนละโควต้ากับ database)

สมมติ 30% ของการส่งมีรูป และเฉลี่ย 1.3 รูป/โพสต์ที่มีรูป (มีตัวเลือกแทรกได้หลายรูป),
รูปละ ~200KB หลัง resize:

- รูปต่อวัน ≈ 50 × 0.30 × 1.3 ≈ **19-20 รูป/วัน**
- ต่อปี ≈ 20 × 365 ≈ **7,300 รูป/ปี** ≈ **~1.4 GB/ปี**

| ช่วงเวลา | จำนวนรูป | ขนาด Storage โดยประมาณ |
| -------- | -------- | ---------------------- |
| 1 ปี     | ~7,300   | ~1.4 GB                |
| 5 ปี     | ~36,500  | ~7 GB                  |
| 10 ปี    | ~73,000  | ~14 GB                 |
| 20 ปี    | ~146,000 | ~28 GB                 |

**ค่าใช้จ่าย:** Supabase Storage ฟรี 1 GB แรก แล้วคิด ~$0.021/GB/เดือน — แม้ 20 ปี
ผ่านไป (~28 GB) ก็ตกเดือนละ**ไม่ถึง $1** เพิ่มจาก storage เพียงอย่างเดียว
(ยังไม่รวมค่า egress ตอนโหลดรูปมาดู ซึ่งก็เล็กมากสำหรับผู้ใช้ 50 คน)

## 4. ถ้าโบสมี 3,000 คน (แทน 50 คน)

สเกลขึ้น 60 เท่า — ใช้สมมติฐานเดิมทุกอย่าง (worst case: ทุกคนส่งทุกวัน, 30% มีรูป,
รูปเฉลี่ย ~200KB หลัง resize) แต่คราวนี้ตัวเลขเริ่มชนแพ็กเกจฟรีของ Supabase แล้ว
ต้องใช้แพ็กเกจ **Pro ($25/เดือน)** ซึ่งรวม database 8 GB + file storage 100 GB มาให้
แล้วเกินจากนั้นคิดเพิ่ม **database $0.125/GB** และ **file storage $0.0213/GB**
(ราคาจริงจาก supabase.com/pricing ณ ส.ค. 2026 — อัตราแลกเปลี่ยน ~33 บาท/ดอลลาร์)

อัตราเติบโต/ปี (worst case): DB text ≈ 1.1 GB/ปี, รูปภาพ ≈ 85 GB/ปี

| ช่วงเวลา | DB (ข้อความ) | Storage (รูป) | เกินโควต้า Pro ($8GB DB / 100GB Storage)? | ค่าใช้จ่าย/เดือน (Pro + overage) |
| -------- | ------------ | ------------- | ----------------------------------------- | -------------------------------- |
| 1 ปี     | 1.1 GB       | 85 GB         | ยังไม่เกินทั้งคู่                         | $25 (~825 บาท)                   |
| 2 ปี     | 2.2 GB       | 170 GB        | Storage เกิน 70GB                         | ~$26.5 (~875 บาท)                |
| 5 ปี     | 5.5 GB       | 427 GB        | Storage เกิน 327GB                        | ~$32 (~1,055 บาท)                |
| 10 ปี    | 11 GB        | 854 GB        | DB เกิน 3GB, Storage เกิน 754GB           | ~$41 (~1,370 บาท)                |
| 20 ปี    | 22 GB        | 1.7 TB        | DB เกิน 14GB, Storage เกิน 1.6TB          | ~$61 (~2,015 บาท)                |

**ข้อควรระวัง:** ตัวเลขนี้คือ worst case ที่**ทุกคนใน 3,000 คนส่งเฝ้าเดี่ยวทุกวันไม่เว้นวัน
ตลอดหลายปี** ซึ่งในความเป็นจริงแทบไม่มีทางเกิดขึ้น (church engagement ทั่วไปมักอยู่ที่
20-50% ของสมาชิกที่ active สม่ำเสมอ) — ถ้าคิดที่ ~40% participation ตัวเลขทั้งหมด
ข้างบนหารด้วย ~2.5 ได้เลย เช่น 20 ปี จะเหลือ Storage ~680GB แทน 1.7TB และ
ค่าใช้จ่ายจะอยู่ราวๆ $37/เดือน (~1,220 บาท) แทน

**สรุป:** ที่ 3,000 คน แพ็กเกจฟรีของ Supabase ใช้ไม่ได้ตั้งแต่ปีแรก (500MB DB / 1GB storage
เล็กเกินไปทันที) ต้องขึ้น Pro plan ($25/เดือนตั้งต้น) แต่ต่อให้เก็บยาวถึง 20 ปีแบบ worst
case ค่าใช้จ่ายรวมก็ยังอยู่ระดับ **$25-61/เดือน (~825-2,015 บาท/เดือน)** เท่านั้น
ถูกกว่าการจ้างคนดูแลระบบเก็บไฟล์เองมาก

## 5. สรุปสั้นๆ (โบส 50 คน)

สำหรับโบสขนาด 50 คน ต่อให้เก็บข้อมูลเฝ้าเดี่ยว**ตลอดไปไม่มีวันลบ** ทั้งตัวเนื้อหาและรูปภาพ
ก็ยังเล็กมากเทียบกับ quota ของ Supabase ทุก tier — ไม่ต้องกังวลเรื่อง "ตารางบวม" เลย
จุดที่ควรระวังจริงๆ มีแค่อย่างเดียวคือ **ต้อง resize รูปก่อนอัปโหลดเสมอ** (ห้ามอัปรูปจากมือถือ
ตรงๆ ไฟล์ 5-8MB) ไม่งั้นตัวเลข Storage ข้างบนจะพุ่งขึ้นสิบกว่าเท่าโดยไม่จำเป็น

## 6. INSERT SQL สำหรับทดสอบ (5 แถว)

ตารางจริงที่คุณสร้างไว้มีคอลัมน์ตรงกับที่ออกแบบไว้ทุกอย่าง บวกคอลัมน์เพิ่มเติม
`is_public boolean` (คุมว่าจะให้ขึ้นในหน้าเฝ้าเดี่ยวสาธารณะไหม — ดูหัวข้อ 7) โค้ดแอปอัปเดต
ให้รองรับคอลัมน์นี้แล้ว

SQL ด้านล่างดึง `lamb_id` จริงจาก `lamb_info` มาสุ่มใส่เองอัตโนมัติ (ไม่ต้องไปคัดลอก id
มาเอง) คัดลูกแกะ 5 คนแบบสุ่ม ให้คนละวันที่กัน (กันชน unique constraint 1 คน/1 วัน) และตั้ง
แถวสุดท้ายเป็น `is_public = false` ไว้เทส filter ส่วนตัว/สาธารณะในหน้าตาราง — รันได้ตรงๆ ใน
Supabase SQL Editor เลย (ต้องมีลูกแกะอย่างน้อย 5 คนในตาราง `lamb_info` ก่อน):

```sql
with picked_lambs as (
  select id, row_number() over (order by random()) as rn
  from lamb_info
  limit 5
)
insert into lamb_devotion (lamb_id, devotion_date, title, content_html, image_urls, is_public)
select
  id,
  current_date - (rn - 1),
  case rn
    when 1 then 'พระเจ้าทรงเลี้ยงดูเราเหมือนเลี้ยงแกะ'
    when 2 then 'ไม่มีสิ่งใดพรากเราจากความรักของพระเจ้าได้'
    when 3 then 'แขนงที่ติดสนิทกับเถาองุ่น'
    when 4 then 'อธิษฐานแทนความกังวล'
    else 'ไว้วางใจพระเจ้าสุดใจ'
  end,
  case rn
    when 1 then '<p>วันนี้อ่านพระธรรมสดุดี 23 รู้สึกอบอุ่นใจมากที่พระเจ้าทรงดูแลเราในทุกฤดูกาลของชีวิต</p>'
    when 2 then '<p>อ่านโรม 8 ตอนที่ไม่มีสิ่งใดพรากเราจากความรักของพระเจ้าได้ ขอบคุณพระเจ้าสำหรับพระคุณที่ยิ่งใหญ่</p>'
    when 3 then '<p>เฝ้าเดี่ยวเช้านี้จากยอห์น 15 เรื่องการเป็นแขนงที่ติดสนิทกับเถาองุ่น</p>'
    when 4 then '<p>อ่านฟีลิปปี 4:6-7 เรื่องการอธิษฐานแทนความกังวล รู้สึกสงบใจขึ้นมาก</p>'
    else '<p>อ่านสุภาษิต 3:5-6 ไว้วางใจพระเจ้าสุดใจ ไม่พึ่งพาความเข้าใจของตนเอง</p>'
  end,
  '{}',
  rn <> 5
from picked_lambs;
```

อยากได้แถวเพิ่ม/เปลี่ยนจำนวน — แก้แค่ `limit 5` (ทั้งใน CTE และจำนวน `case` ที่ครอบคลุม)
ตามจำนวนที่ต้องการได้เลย

## 7. `is_public` — คุมว่าขึ้น feed สาธารณะไหม

- `true` (ค่าเริ่มต้นตอนกรอกฟอร์ม) → ขึ้นในหน้าเฝ้าเดี่ยวสาธารณะ `/lamb-info/devotion`
- `false` → **ไม่ขึ้น**ในหน้าเฝ้าเดี่ยวสาธารณะ แต่ยังเห็นได้ในหน้าตารางทดสอบ (admin)
  `/lamb-info/devotion/table` ซึ่งดึงข้อมูลทั้งหมดไม่กรอง
- หน้าเขียนเฝ้าเดี่ยว (`/lamb-info/devotion/new`) มี toggle "เผยแพร่ในหน้าเฝ้าเดี่ยวสาธารณะ"
  ให้ตั้งค่านี้ตอนส่งได้เลย
