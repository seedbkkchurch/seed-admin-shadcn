import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeSwitch } from "@/components/theme-switch";
import { useMyLamb } from "@/hooks/use-my-lamb";
import {
  useGiftFromGod,
  useUpsertGiftFromGod,
} from "@/features/lamb-info/data/queries";
import {
  mergeGiftScores,
  type GiftScores,
} from "@/features/lamb-info/data/gifts";
import { SurveyQuestionPage } from "./components/survey-question-page";
import { SurveyResults } from "./components/survey-results";
import { surveyQuestions } from "./data/questions";
import {
  TOTAL_QUESTIONS,
  computeGiftScores,
  countAnswered,
  getMissingQuestionIndices,
  type SurveyAnswers,
} from "./data/scoring";
import {
  clearSurveyDraft,
  loadSurveyDraft,
  saveSurveyDraft,
} from "./lib/survey-draft-storage";

const QUESTIONS_PER_PAGE = 25;
const PAGE_COUNT = Math.ceil(TOTAL_QUESTIONS / QUESTIONS_PER_PAGE);

// โชว์เลขข้อที่ยังไม่ได้ตอบตรงๆ (ตกลงใน grill-me 2026-08-25 — เดิมบอกแค่
// จำนวน) ถ้าเยอะเกินไปตัดจบด้วย "และอีก N ข้อ" กันข้อความยาวเกิน
const MAX_MISSING_LISTED = 20;
function formatMissingIndices(indices: number[]): string {
  if (indices.length <= MAX_MISSING_LISTED) return indices.join(", ");
  const shown = indices.slice(0, MAX_MISSING_LISTED).join(", ");
  return `${shown} และอีก ${indices.length - MAX_MISSING_LISTED} ข้อ`;
}

// self-service เหมือน PrayerList — auto-detect lamb จาก auth (useMyLamb)
// ไม่มี dropdown เลือกคนอื่น (ตกลงใน grill-me 2026-08-25)
//
// แยก SurveyFlow ออกจากคอมโพเนนต์นี้ (mount ด้วย key={lambId} เมื่อรู้จัก
// lambId + คะแนนเดิม (ถ้ามี) แล้วเท่านั้น) เพื่อให้การ "โหลดร่างจาก
// localStorage แล้วตัดสินใจว่าจะเปิดหน้าไหนก่อน" ทำผ่าน lazy useState
// initializer ได้ตรงๆ (เหมือน devotion-editor.tsx) แทนที่จะ setState ใน
// useEffect ซึ่ง eslint (react-hooks/set-state-in-effect) ห้ามไว้ — ตอนที่
// SurveyFlow mount lambId/initialScores นิ่งแล้ว ไม่ใช่ค่าที่มา async อีก
// ต่อไป
export function SpiritualGiftsSurvey() {
  const {
    data: myLamb,
    isResolvingUser,
    isPending: isLambPending,
  } = useMyLamb();
  const lambId = myLamb?.id;
  const { data: existingRow, isPending: isExistingPending } =
    useGiftFromGod(lambId);

  const isLoadingContext =
    isResolvingUser || isLambPending || (!!lambId && isExistingPending);

  // คะแนนเดิม (ถ้าเคยทำแบบสำรวจ/เคยถูกกรอกให้แล้ว) แปลงเป็น GiftScores
  // ธรรมดา (column -> score) ด้วยตัวช่วยเดียวกับที่ GiftsCard ใช้ — ใช้เป็น
  // ค่าเริ่มต้นของหน้าสรุปผล ไม่ต้องรอให้ทำแบบสำรวจใหม่ก่อนถึงจะเห็น
  const initialScores = useMemo(() => {
    if (!existingRow) return null;
    const gifts = mergeGiftScores(existingRow);
    return Object.fromEntries(gifts.map((g) => [g.column, g.score]));
  }, [existingRow]);

  return (
    <>
      <Header fixed>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            แบบสำรวจของประทานฝ่ายวิญญาณ
          </h2>
          <p className="text-muted-foreground">
            ตอบตามความรู้สึกจริงของคุณในแต่ละข้อ — ทำค้างไว้ได้
            ระบบจะจำคำตอบให้อัตโนมัติ
          </p>
        </div>

        {isLoadingContext ? (
          <Skeleton className="h-96 w-full" />
        ) : !lambId ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            ไม่พบบัญชีลูกแกะที่ผูกกับผู้ใช้นี้ —
            ฟีเจอร์นี้ใช้ได้เฉพาะบัญชีที่ผูกกับลูกแกะแล้วเท่านั้น
          </p>
        ) : (
          <SurveyFlow
            key={lambId}
            lambId={lambId}
            initialScores={initialScores}
          />
        )}
      </Main>
    </>
  );
}

type SurveyFlowProps = {
  lambId: string;
  initialScores: GiftScores | null;
};

type Stage = "survey" | "results";

function SurveyFlow({ lambId, initialScores }: SurveyFlowProps) {
  const upsertGiftFromGod = useUpsertGiftFromGod();

  // อ่านร่างที่ค้างไว้ (ถ้ามี) แบบ lazy — รันครั้งเดียวตอน mount เท่านั้น
  const [initial] = useState(() => {
    const draft = loadSurveyDraft(lambId);
    return { answers: draft ?? {}, hadDraft: draft !== null };
  });

  const [answers, setAnswers] = useState<SurveyAnswers>(initial.answers);
  const [page, setPage] = useState(0);
  // ทำแบบสำรวจค้างไว้ (มีร่าง) -> ทำต่อจากที่ค้าง
  // เคยส่งไปแล้วและไม่มีร่างค้าง -> เห็นหน้าสรุปผล/คะแนนล่าสุดของตัวเองทันที
  //   (ไม่ต้องเตือน/ยืนยันอะไรก่อน — เห็นผลแล้วค่อยกด "ทำแบบสำรวจใหม่" เอง
  //   ถ้าต้องการ ตกลงใน grill-me 2026-08-25 แทนที่ dialog เตือนก่อนทับแบบ
  //   เดิม)
  // ไม่เคยทำมาก่อนเลย -> เริ่มทำใหม่
  const [stage, setStage] = useState<Stage>(
    !initial.hadDraft && initialScores ? "results" : "survey",
  );
  const [resultScores, setResultScores] = useState<GiftScores | null>(
    !initial.hadDraft ? initialScores : null,
  );

  const answeredCount = countAnswered(answers);
  const progressPercent = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);
  const missingIndices = getMissingQuestionIndices(answers);

  const pageQuestions = useMemo(() => {
    const start = page * QUESTIONS_PER_PAGE;
    return surveyQuestions.slice(start, start + QUESTIONS_PER_PAGE);
  }, [page]);

  // autosave ทุกครั้งที่คำตอบเปลี่ยน — เขียน localStorage เท่านั้น ไม่ได้
  // setState ต่อ จึงไม่ชนกฎ react-hooks/set-state-in-effect
  useEffect(() => {
    if (stage !== "survey") return;
    saveSurveyDraft(lambId, answers);
  }, [answers, stage, lambId]);

  const handleAnswer = (index: number, score: number) => {
    setAnswers((prev) => ({ ...prev, [index]: score }));
  };

  // ปุ่มลัดสำหรับตอนเทส (ตกลงใน grill-me 2026-08-25) — เติมทุกข้อที่ยังไม่
  // ได้ตอบด้วยคะแนนเต็ม (3) ทีเดียว ไม่ต้องไล่คลิกทีละ 125 ข้อ โชว์เฉพาะ
  // dev build (import.meta.env.DEV, pattern เดียวกับ main.tsx/__root.tsx) —
  // ไม่ควรมีให้กดในโปรดักชันเพราะจะทำให้ผลสำรวจไม่สะท้อนของประทานจริง
  const handleFillMaxForTesting = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
        if (next[i] === undefined) next[i] = 3;
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (missingIndices.length > 0) {
      toast.error(
        `ตอบยังไม่ครบ ${missingIndices.length} ข้อ — ข้อที่ยังไม่ได้ตอบ: ${formatMissingIndices(missingIndices)}`,
      );
      // พาไปหน้าที่มีข้อแรกที่ยังไม่ได้ตอบ กันต้องไล่หาเองทีละหน้า
      setPage(Math.floor((missingIndices[0] - 1) / QUESTIONS_PER_PAGE));
      return;
    }

    const scores = computeGiftScores(answers);
    upsertGiftFromGod.mutate(
      { lambId, values: scores },
      {
        onSuccess: () => {
          clearSurveyDraft(lambId);
          setResultScores(scores);
          setStage("results");
          toast.success("บันทึกผลแบบสำรวจของประทานแล้ว");
        },
        onError: () => {
          toast.error("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
        },
      },
    );
  };

  const handleRetakeFromResults = () => {
    setAnswers({});
    setResultScores(null);
    setPage(0);
    setStage("survey");
  };

  if (stage === "results" && resultScores) {
    return (
      <SurveyResults
        lambId={lambId}
        scores={resultScores}
        onRetake={handleRetakeFromResults}
      />
    );
  }

  return (
    <>
      {import.meta.env.DEV && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleFillMaxForTesting}
          >
            กรอกคำตอบที่เหลือเป็น "มาก" ทั้งหมด (สำหรับทดสอบ)
          </Button>
        </div>
      )}

      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            ตอบแล้ว {answeredCount} / {TOTAL_QUESTIONS} ข้อ
          </span>
          <span>
            หน้า {page + 1} / {PAGE_COUNT}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <SurveyQuestionPage
        questions={pageQuestions}
        answers={answers}
        onAnswer={handleAnswer}
      />

      <div className="flex items-center justify-between gap-2 pb-8">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          ย้อนกลับ
        </Button>
        {page < PAGE_COUNT - 1 ? (
          <Button
            onClick={() => setPage((p) => Math.min(PAGE_COUNT - 1, p + 1))}
          >
            หน้าถัดไป
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={upsertGiftFromGod.isPending}>
            {upsertGiftFromGod.isPending ? "กำลังบันทึก..." : "ส่งแบบสำรวจ"}
          </Button>
        )}
      </div>
      {missingIndices.length > 0 && (
        <p className="-mt-4 text-sm text-muted-foreground">
          ยังไม่ได้ตอบ {missingIndices.length} ข้อ — ข้อ:{" "}
          {formatMissingIndices(missingIndices)}
        </p>
      )}
    </>
  );
}
