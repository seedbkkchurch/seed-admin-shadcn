import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  morning_enabled: z.boolean(),
  morning_time: z.string().min(1, "ระบุเวลา"),
  evening_enabled: z.boolean(),
  evening_time: z.string().min(1, "ระบุเวลา"),
});

type FormValues = z.infer<typeof formSchema>;

type SettingsRow = {
  morning_time: string;
  evening_time: string;
  morning_enabled: boolean;
  evening_enabled: boolean;
};

type SendResult = {
  missing: number;
  sent: number;
  failed: number;
  subscriptions: number;
};

const DEFAULT_VALUES: FormValues = {
  morning_enabled: true,
  morning_time: "07:00",
  evening_enabled: true,
  evening_time: "20:00",
};

// DB `time` comes back as "07:00:00" — <input type="time"> wants "HH:mm".
function toInputTime(dbTime: string) {
  return dbTime.slice(0, 5);
}

// Admin controls for the เฝ้าเดี่ยว push reminder (grill-me follow-up,
// 2026-08-12): configure the morning/evening send times, and a manual
// "ส่งเดี๋ยวนี้" button that invokes send-devotion-reminders directly —
// useful for testing and for one-off nudges outside the normal schedule.
export function DevotionReminderSettingsForm() {
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: ["devotion-reminder-settings"],
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from("devotion_reminder_settings")
        .select("morning_time, evening_time, morning_enabled, evening_enabled")
        .single();
      if (error) throw error;
      return row as SettingsRow;
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
    values: data
      ? {
          morning_enabled: data.morning_enabled,
          morning_time: toInputTime(data.morning_time),
          evening_enabled: data.evening_enabled,
          evening_time: toInputTime(data.evening_time),
        }
      : undefined,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { error } = await supabase
        .from("devotion_reminder_settings")
        .update({
          morning_enabled: values.morning_enabled,
          morning_time: values.morning_time,
          evening_enabled: values.evening_enabled,
          evening_time: values.evening_time,
          updated_at: new Date().toISOString(),
        })
        .eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("บันทึกเวลาแจ้งเตือนแล้ว");
      queryClient.invalidateQueries({
        queryKey: ["devotion-reminder-settings"],
      });
    },
    onError: () => toast.error("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง"),
  });

  const sendNowMutation = useMutation({
    mutationFn: async () => {
      const { data: result, error } = await supabase.functions.invoke(
        "send-devotion-reminders",
        { body: { mode: "manual" } },
      );
      if (error) throw error;
      return result as SendResult;
    },
    onSuccess: (result) => {
      toast.success(
        `ส่งแล้ว: ยังไม่ได้ส่งเฝ้าเดี่ยว ${result.missing} คน, แจ้งเตือนสำเร็จ ${result.sent} ครั้ง` +
          (result.failed ? `, ล้มเหลว ${result.failed} ครั้ง` : ""),
      );
    },
    onError: () => toast.error("ส่งแจ้งเตือนไม่สำเร็จ ลองใหม่อีกครั้ง"),
  });

  return (
    <div className="space-y-6 rounded-lg border p-4">
      <div className="space-y-0.5">
        <h3 className="text-base font-medium">แจ้งเตือนเฝ้าเดี่ยว</h3>
        <p className="text-muted-foreground text-sm">
          ส่งแจ้งเตือนอัตโนมัติหาลูกแกะที่ยังไม่ได้ส่งเฝ้าเดี่ยววันนั้น
          ตามเวลาที่ตั้งไว้ด้านล่าง (ต้องให้ลูกแกะสมัครรับที่หน้า /subscribe ก่อน)
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
          className="space-y-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <FormField
              control={form.control}
              name="morning_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-1 flex-row items-center justify-between rounded-lg border p-3">
                  <FormLabel className="text-sm font-normal">
                    เตือนตอนเช้า
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="morning_time"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input type="time" disabled={isPending} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <FormField
              control={form.control}
              name="evening_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-1 flex-row items-center justify-between rounded-lg border p-3">
                  <FormLabel className="text-sm font-normal">
                    เตือนตอนเย็น
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="evening_time"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input type="time" disabled={isPending} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saveMutation.isPending || isPending}>
              {saveMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              บันทึกเวลา
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => sendNowMutation.mutate()}
              disabled={sendNowMutation.isPending}
            >
              {sendNowMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              ส่งเดี๋ยวนี้
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
