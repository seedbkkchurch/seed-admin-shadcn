import { AxiosError } from "axios";
import { toast } from "sonner";

// Unique index on lamb_info(normalize_phone(phone)) — grill-me 2026-11-24
// (sign in with phone): no two lambs may share a phone number, so phone
// sign-in always resolves to exactly one account. Supabase/PostgREST surfaces
// a violation as { code: "23505", message: '... "<index name>"' }.
const LAMB_PHONE_UNIQUE_INDEX = "lamb_info_phone_normalized_key";

function isDuplicateLambPhoneError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const { code, message } = error as { code?: unknown; message?: unknown };
  return (
    code === "23505" &&
    typeof message === "string" &&
    message.includes(LAMB_PHONE_UNIQUE_INDEX)
  );
}

export function handleServerError(error: unknown) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(error);
  }

  let errMsg = "Something went wrong!";

  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    Number(error.status) === 204
  ) {
    errMsg = "No content.";
  }

  if (isDuplicateLambPhoneError(error)) {
    errMsg = "เบอร์นี้มีสมาชิกคนอื่นใช้อยู่แล้ว";
  }

  if (error instanceof AxiosError) {
    const title = error.response?.data?.title;
    if (typeof title === "string" && title.length > 0) {
      errMsg = title;
    }
  }

  toast.error(errMsg);
}
