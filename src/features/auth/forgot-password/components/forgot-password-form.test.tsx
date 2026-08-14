import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, type RenderResult } from "vitest-browser-react";
import { userEvent, type Locator } from "vitest/browser";
import { ForgotPasswordForm } from "./forgot-password-form";

const resetPasswordForEmailMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...args: unknown[]) =>
        resetPasswordForEmailMock(...args),
    },
  },
}));

describe("ForgotPasswordForm", () => {
  let screen: RenderResult;
  let emailInput: Locator;
  let submitButton: Locator;

  beforeEach(async () => {
    vi.clearAllMocks();
    resetPasswordForEmailMock.mockResolvedValue({ error: null });

    screen = await render(<ForgotPasswordForm />);
    emailInput = screen.getByRole("textbox", { name: /^Email$/i });
    submitButton = screen.getByRole("button", {
      name: /ส่งลิงก์รีเซ็ตรหัสผ่าน/i,
    });
  });

  it("renders email field and submit button", async () => {
    await expect.element(emailInput).toBeInTheDocument();
    await expect.element(submitButton).toBeInTheDocument();
  });

  it("shows validation when submitting empty form", async () => {
    await userEvent.click(submitButton);
    await expect
      .element(screen.getByText(/^Please enter your email\.$/i))
      .toBeInTheDocument();
  });

  it("shows a success message after requesting a reset link", async () => {
    await userEvent.fill(emailInput, "a@b.com");
    await userEvent.click(submitButton);

    await vi.waitFor(() =>
      expect(resetPasswordForEmailMock).toHaveBeenCalledWith(
        "a@b.com",
        expect.objectContaining({
          redirectTo: expect.stringContaining("/reset-password"),
        }),
      ),
    );

    await expect
      .element(screen.getByText(/ส่งลิงก์รีเซ็ตรหัสผ่านไปที่ a@b\.com แล้ว/i))
      .toBeInTheDocument();
  });

  it("shows an error message when the request truly fails", async () => {
    resetPasswordForEmailMock.mockResolvedValue({
      error: { status: 429, message: "Rate limit exceeded" },
    });

    await userEvent.fill(emailInput, "a@b.com");
    await userEvent.click(submitButton);

    await vi.waitFor(() =>
      expect(
        screen.getByText(/Rate limit exceeded/i),
      ).toBeInTheDocument(),
    );
  });
});
