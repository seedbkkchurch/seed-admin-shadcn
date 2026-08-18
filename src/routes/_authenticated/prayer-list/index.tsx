import { createFileRoute } from "@tanstack/react-router";
import { PrayerList } from "@/features/prayer-list";

export const Route = createFileRoute("/_authenticated/prayer-list/")({
  component: PrayerList,
});
