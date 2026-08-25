import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ANSWER_SCALE, type SurveyAnswers } from "../data/scoring";
import type { SurveyQuestion } from "../data/questions";

type SurveyQuestionPageProps = {
  questions: SurveyQuestion[];
  answers: SurveyAnswers;
  onAnswer: (index: number, score: number) => void;
};

// หน้าย่อยหนึ่งหน้าของแบบสำรวจ (25 ข้อ/หน้า, ดู index.tsx) — แต่ละข้อเป็น
// radio 4 ตัวเลือก มาก(3)/บ้าง(2)/น้อย(1)/ไม่มี(0) ตามต้นฉบับ Google Form
// ที่ผู้ใช้ส่งภาพมา
export function SurveyQuestionPage({
  questions,
  answers,
  onAnswer,
}: SurveyQuestionPageProps) {
  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <div key={q.index} className="rounded-lg border p-4">
          <p className="mb-3 text-sm leading-relaxed">
            <span className="text-muted-foreground me-2">{q.index}.</span>
            {q.question}
          </p>
          <RadioGroup
            className="flex flex-wrap gap-x-6 gap-y-2"
            value={
              answers[q.index] !== undefined ? String(answers[q.index]) : ""
            }
            onValueChange={(value) => onAnswer(q.index, Number(value))}
          >
            {ANSWER_SCALE.map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <RadioGroupItem
                  value={String(opt.value)}
                  id={`q${q.index}-${opt.value}`}
                />
                <Label
                  htmlFor={`q${q.index}-${opt.value}`}
                  className="font-normal"
                >
                  {opt.label} ({opt.value})
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}
    </div>
  );
}
