import { ContentSection } from "../components/content-section";
import { NotificationsForm } from "./notifications-form";

// เอา DevotionReminderSettingsForm ออกจากหน้านี้แล้ว (ตกลงใน grill-me
// 2026-08-18) — ย้ายไปเป็นหน้าแยก /devotion-reminders ในเมนู Admin แทน
// (super_admin เท่านั้น) เพราะเป็นแผงควบคุมระดับแอดมิน ต่างจาก
// NotificationsForm ที่เหลืออยู่นี้ซึ่งเป็นค่าตั้งส่วนตัวทั่วไป — ดู
// features/devotion-reminder-admin/index.tsx
export function SettingsNotifications() {
  return (
    <ContentSection
      title="Notifications"
      desc="Configure how you receive notifications."
    >
      <NotificationsForm />
    </ContentSection>
  );
}
