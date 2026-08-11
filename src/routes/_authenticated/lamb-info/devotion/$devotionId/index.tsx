import { createFileRoute } from "@tanstack/react-router";
import { DevotionDetail } from "@/features/lamb-info/devotion-detail";

export const Route = createFileRoute(
  "/_authenticated/lamb-info/devotion/$devotionId/",
)({
  component: DevotionDetail,
});
