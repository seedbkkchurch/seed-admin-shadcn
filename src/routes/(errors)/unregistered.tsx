import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";
import { UnregisteredError } from "@/features/errors/unregistered-error";

const unregisteredSearchSchema = z.object({
  // email ที่พยายาม login เข้ามาแล้วไม่มี lamb_info ผูกอยู่ — ส่งมาจาก
  // _authenticated/route.tsx ก่อน signOut() (grill-me 2026-08-18) ใช้
  // .catch(undefined) เผื่อมีคนเข้าหน้านี้ตรงๆ โดยไม่มี query param
  email: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/(errors)/unregistered")({
  validateSearch: unregisteredSearchSchema,
  component: UnregisteredError,
});
