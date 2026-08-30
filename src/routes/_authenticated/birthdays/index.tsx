import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";
import { Birthdays } from "@/features/birthdays";

// month = index 0-11 (Date.getMonth() convention), synced to the URL so a
// refresh or a shared link keeps the picked month — same pattern as
// attendance/index.tsx's group/week search params (grill-me 2026-08-30).
const birthdaysSearchSchema = z.object({
  month: z.number().min(0).max(11).optional().catch(undefined),
});

export const Route = createFileRoute("/_authenticated/birthdays/")({
  validateSearch: birthdaysSearchSchema,
  component: Birthdays,
});
