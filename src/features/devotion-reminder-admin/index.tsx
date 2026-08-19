import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { DevotionReminderSettingsForm } from "@/features/settings/notifications/devotion-reminder-settings-form";

// แยกออกมาจากหน้า /settings/notifications เดิม (ตกลงใน grill-me 2026-08-18)
// — เดิม DevotionReminderSettingsForm ถูกรวมไว้กับ NotificationsForm ทั่วไป
// ในหน้าเดียว แต่หน้านั้นเข้าไม่ถึงเพราะ "Settings" ใน dropdown โปรไฟล์ปิดไว้
// ถาวร (ดู profile-dropdown.tsx) แผงนี้ควบคุมเวลาส่งแจ้งเตือนให้ "ทุกคน"
// พร้อมกันและมีปุ่ม broadcast ทันที จึงต้องอยู่ในเมนู Admin (super_admin
// เท่านั้น — ดู routes/_authenticated/devotion-reminders/index.tsx) ไม่ใช่
// ในเมนูของผู้ใช้ทั่วไป ต่างจาก /subscribe ที่เป็นปุ่มรับแจ้งเตือนส่วนตัว
// ยังคง import DevotionReminderSettingsForm จากที่เดิมใน
// features/settings/notifications/ ไม่ได้ย้ายไฟล์ (ลดความเสี่ยงจาก merge
// conflict / broken import อื่นๆ ที่อาจอ้างอิงอยู่)
export function DevotionReminderAdmin() {
  return (
    <>
      <Header fixed>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            แจ้งเตือนเฝ้าเดี่ยว
          </h2>
          <p className="text-muted-foreground">
            ตั้งเวลาส่งแจ้งเตือนอัตโนมัติหาทุกคนที่สมัครรับไว้ (ผ่านหน้า
            /subscribe) และทดสอบ/ส่งด่วนได้จากที่นี่
          </p>
        </div>

        <DevotionReminderSettingsForm />
      </Main>
    </>
  );
}
