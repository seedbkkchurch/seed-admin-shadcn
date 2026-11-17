import { useMemo } from "react";
import { useMyLamb } from "@/hooks/use-my-lamb";
import { useBibleBooks } from "../data/queries";
import { useBibleReadingSummary } from "../data/reading-progress";
import { computeReadingProgress } from "../lib/reading-progress";

// ความคืบหน้าการอ่านของคนที่ล็อกอินอยู่ — ใช้ทั้งการ์ดสรุปใน /spiritual และ
// หน้าเต็ม /bible/progress
export function useMyReadingProgress() {
  const myLamb = useMyLamb();
  const lambId = myLamb.data?.id;
  const books = useBibleBooks();
  const summary = useBibleReadingSummary(lambId);

  const progress = useMemo(
    () =>
      books.data && summary.data
        ? computeReadingProgress(books.data, summary.data)
        : null,
    [books.data, summary.data],
  );

  return {
    lambId,
    progress,
    isLoading:
      myLamb.isResolvingUser ||
      myLamb.isLoading ||
      books.isPending ||
      (!!lambId && summary.isPending),
    error: myLamb.error ?? books.error ?? summary.error,
  };
}
