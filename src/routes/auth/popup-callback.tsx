import { createFileRoute } from "@tanstack/react-router";
import { PopupCallback } from "@/features/auth/popup-callback";

export const Route = createFileRoute("/auth/popup-callback")({
  component: PopupCallback,
});
