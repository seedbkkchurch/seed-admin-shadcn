import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import type { GiftScores } from "@/features/lamb-info/data/gifts";
import { SurveyQuestionPage } from "./components/survey-question-page";
import { SurveyResults } from "./components/survey-results";
import { surveyQuestions } from "./data/questions";
import {
  TOTAL_QUESTIONS,
  computeGiftScores,
  countAnswered,
  isSurveyComplete,
  type SurveyAnswers,
} from "./data/scoring";
import {
  clearSurveyDraft,
  loadSurveyDraft,
  saveSurveyDraft,
} from "./lib/survey-draft-storage";

const QUESTIONS_PER_PAGE = 25;
const PAGE_COUNT = Math.ceil(TOTAL_QUESTIONS / QUESTIONS_PER_PAGE);

// self-service เหมือน PrayerList — auto-detect lamb จาก auth (useMyLamb)
// ไม่มี dropdown เลือกคนอื่น (ตกลงใน grill-me 2026-08-25)
//
// แยก SurveyFlow ออกจากคอมโพเนนต์นี้ (mount ด้วย key={lambId} เมื่อรู้จัก
// lambId + สถานะคะแนนเดิมแล้วเท่านั้น) เพื่อให้การ "โหลดร่างจาก
// localStorage แล้วตัดสินใจว่าจะเปิดหน้าไหนก่อน" ทำผ่าน lazy useState
// initializer ได้ตรงๆ (เหมือน devotion-editor.tsx) แทนที่จะ setState ใน
// useEffect ซึ่ง eslint (react-hooks/set-state-in-effect) ห้ามไว้ — ตอนที่
// SurveyFlow mount lambId/hasExistingScores นิ่งแล้ว ไม่ใช่ค่าที่มา async
// อีกต่อไป
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
            hasExistingScores={!!existingRow}
          />
        )}
      </Main>
    </>
  );
}

type SurveyFlowProps = {
  lambId: string;
  hasExistingScores: boolean;
};

type Stage = "confirm-retake" | "survey" | "results";

function SurveyFlow({ lambId, hasExistingScores }: SurveyFlowProps) {
  const upsertGiftFromGod = useUpsertGiftFromGod();
  const navigate = useNavigate();

  // อ่านร่างที่ค้างไว้ (ถ้ามี) แบบ lazy — รันครั้งเดียวตอน mount เท่านั้น
  const [initial] = useState(() => {
    const draft = loadSurveyDraft(lambId);
    return { answers: draft ?? {}, hadDraft: draft !== null };
  });

  const [answers, setAnswers] = useState<SurveyAnswers>(initial.answers);
  const [page, setPage] = useState(0);
  const [stage, setStage] = useState<Stage>(
    hasExistingScores && !initial.hadDraft ? "confirm-retake" : "survey",
  );
  const [resultScores, setResultScores] = useState<GiftScores | null>(null);

  const answeredCount = countAnswered(answers);
  const progressPercent = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);

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

  const handleSubmit = () => {
    if (!isSurveyComplete(answers)) {
      const remaining = TOTAL_QUESTIONS - answeredCount;
      toast.error(`ตอบยังไม่ครบ — เหลืออีก ${remaining} ข้อ`);
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
      <SurveyResults scores={resultScores} onRetake={handleRetakeFromResults} />
    );
  }

  return (
    <>
      {stage === "survey" && (
        <>
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
              <Button
                onClick={handleSubmit}
                disabled={upsertGiftFromGod.isPending}
              >
                {upsertGiftFromGod.isPending ? "กำลังบันทึก..." : "ส่งแบบสำรวจ"}
              </Button>
            )}
          </div>
          {page === PAGE_COUNT - 1 && !isSurveyComplete(answers) && (
            <p className="-mt-6 text-end text-sm text-muted-foreground">
              เหลืออีก {TOTAL_QUESTIONS - answeredCount} ข้อที่ยังไม่ได้ตอบ
            </p>
          )}
        </>
      )}

      <AlertDialog
        open={stage === "confirm-retake"}
        onOpenChange={(open) => {
          if (!open) setStage("survey");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>คุณเคยทำแบบสำรวจนี้แล้ว</AlertDialogTitle>
            <AlertDialogDescription>
              ถ้าทำใหม่และส่งอีกครั้ง
              คะแนนของประทานเดิมจะถูกเขียนทับด้วยผลรอบนี้ทันที
              ต้องการทำใหม่หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                navigate({ to: "/lamb-info/$lambId", params: { lambId } })
              }
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => setStage("survey")}>
              ทำใหม่
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
