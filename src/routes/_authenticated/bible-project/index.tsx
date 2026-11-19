import { createFileRoute } from "@tanstack/react-router";
import { BibleProject } from "@/features/bible-project";

export const Route = createFileRoute("/_authenticated/bible-project/")({
  component: BibleProject,
});
