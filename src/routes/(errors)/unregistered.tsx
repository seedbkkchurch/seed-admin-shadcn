import { createFileRoute } from "@tanstack/react-router";
import { UnregisteredError } from "@/features/errors/unregistered-error";

export const Route = createFileRoute("/(errors)/unregistered")({
  component: UnregisteredError,
});
