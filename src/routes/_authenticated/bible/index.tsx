import { createFileRoute, redirect } from "@tanstack/react-router";

// /bible เปล่าๆ → เด้งไปปฐมกาล 1 เป็นค่าเริ่มต้น
export const Route = createFileRoute("/_authenticated/bible/")({
  beforeLoad: () => {
    throw redirect({
      to: "/bible/$book/$chapter",
      params: { book: "1", chapter: "1" },
    });
  },
});
