import { createFileRoute } from "@tanstack/react-router";
import { Subscribe } from "@/features/subscribe";

// Public route — deliberately outside `_authenticated` so lambs can reach
// it without staff/Clerk login (grill-me follow-up, 2026-08-12).
export const Route = createFileRoute("/subscribe")({
  component: Subscribe,
});
