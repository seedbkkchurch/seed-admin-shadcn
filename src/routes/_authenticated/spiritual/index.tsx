import { createFileRoute } from "@tanstack/react-router";
import { Spiritual } from "@/features/spiritual";

export const Route = createFileRoute("/_authenticated/spiritual/")({
  component: Spiritual,
});
