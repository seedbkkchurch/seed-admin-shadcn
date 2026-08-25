import { createFileRoute } from "@tanstack/react-router";
import { SpiritualGiftsSurvey } from "@/features/spiritual-gifts-survey";

export const Route = createFileRoute("/_authenticated/spiritual-gifts-survey/")(
  {
    component: SpiritualGiftsSurvey,
  },
);
