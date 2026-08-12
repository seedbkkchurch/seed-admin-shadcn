import { Separator } from "@/components/ui/separator";
import { ContentSection } from "../components/content-section";
import { DevotionReminderSettingsForm } from "./devotion-reminder-settings-form";
import { NotificationsForm } from "./notifications-form";

export function SettingsNotifications() {
  return (
    <ContentSection
      title="Notifications"
      desc="Configure how you receive notifications."
    >
      <div className="space-y-8">
        <DevotionReminderSettingsForm />
        <Separator />
        <NotificationsForm />
      </div>
    </ContentSection>
  );
}
