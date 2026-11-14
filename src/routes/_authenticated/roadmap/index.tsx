import { createFileRoute } from "@tanstack/react-router";
import { Roadmap } from "@/features/roadmap";

export const Route = createFileRoute("/_authenticated/roadmap/")({
  component: Roadmap,
});
