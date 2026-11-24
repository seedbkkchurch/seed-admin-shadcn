import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, type RenderResult } from "vitest-browser-react";
import { type Locator, userEvent } from "vitest/browser";
import { UserAuthForm } from "./user-auth-form";

const FORM_MESSAGES = {
  identifierEmpty: "กรุณากรอกอีเมลหรือเบอร์โทรศัพท์",
  passwordEmpty: "Please enter your password.",
} as const;

const navigate = vi.fn();

const supabaseMock = vi.hoisted(() => ({
  auth: {
    signInWithPassword: vi.fn(),
    setSession: vi.fn(),
    signInWithOAuth: vi.fn(),
  },
  functions: {
    invoke: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/client", () => ({ supabase: supabaseMock }));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => navigate,
    Link: ({
      children,
      to,
      className,
      ...rest
    }: {
      children?: React.ReactNode;
      to: string;
      className?: string;
    }) => (
      <a href={to} className={className} {...rest}>
        {children}
      </a>
    ),
  };
});

const IDENTIFIER_LABEL = /อีเมล หรือ เบอร์โทรศัพท์/;

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  supabaseMock.auth.signInWithPassword.mockResolvedValue({ error: null });
  supabaseMock.auth.setSession.mockResolvedValue({ error: null });
});

describe("UserAuthForm", () => {
  describe("Rendering without redirectTo", () => {
    let screen: RenderResult;
    let identifierInput: Locator;
    let passwordInput: Locator;
    let signInButton: Locator;

    beforeEach(async () => {
      screen = await render(<UserAuthForm />);
      identifierInput = screen.getByRole("textbox", { name: IDENTIFIER_LABEL });
      passwordInput = screen.getByLabelText(/^Password$/i);
      signInButton = screen.getByRole("button", { name: /^Sign in$/i });
    });

    it("renders fields, submit button, and forgot password link", async () => {
      await expect.element(identifierInput).toBeInTheDocument();
      await expect.element(passwordInput).toBeInTheDocument();
      await expect.element(signInButton).toBeInTheDocument();
      await expect
        .element(screen.getByText(/^Forgot password\?$/i))
        .toBeInTheDocument();
    });

    it("shows validation messages when submitting empty form", async () => {
      await userEvent.click(signInButton);

      await expect
        .element(screen.getByText(FORM_MESSAGES.identifierEmpty))
        .toBeInTheDocument();
      await expect
        .element(screen.getByText(FORM_MESSAGES.passwordEmpty))
        .toBeInTheDocument();
    });

    it("signs in with email directly when the identifier has an @", async () => {
      await userEvent.fill(identifierInput, "a@b.com");
      await userEvent.fill(passwordInput, "1234567");
      await userEvent.click(signInButton);

      await vi.waitFor(() =>
        expect(supabaseMock.auth.signInWithPassword).toHaveBeenCalledWith({
          email: "a@b.com",
          password: "1234567",
        }),
      );
      expect(supabaseMock.functions.invoke).not.toHaveBeenCalled();
      await vi.waitFor(() =>
        expect(navigate).toHaveBeenCalledWith({ to: "/", replace: true }),
      );
    });

    it("signs in with a phone number through the phone-sign-in function", async () => {
      supabaseMock.functions.invoke.mockResolvedValue({
        data: {
          ok: true,
          session: { access_token: "at", refresh_token: "rt" },
        },
        error: null,
      });

      await userEvent.fill(identifierInput, "081-234-5678");
      await userEvent.fill(passwordInput, "my-password");
      await userEvent.click(signInButton);

      await vi.waitFor(() =>
        expect(supabaseMock.functions.invoke).toHaveBeenCalledWith(
          "phone-sign-in",
          {
            body: {
              phone: "081-234-5678",
              password: "my-password",
              birthday: undefined,
            },
          },
        ),
      );
      expect(supabaseMock.auth.signInWithPassword).not.toHaveBeenCalled();
      await vi.waitFor(() =>
        expect(supabaseMock.auth.setSession).toHaveBeenCalledWith({
          access_token: "at",
          refresh_token: "rt",
        }),
      );
      await vi.waitFor(() =>
        expect(navigate).toHaveBeenCalledWith({ to: "/", replace: true }),
      );
    });

    it("asks for the birthday when the account still uses the default password", async () => {
      supabaseMock.functions.invoke.mockResolvedValue({
        data: { ok: false, code: "needs_birthday" },
        error: null,
      });

      await userEvent.fill(identifierInput, "0812345678");
      await userEvent.fill(passwordInput, "1234567");
      await userEvent.click(signInButton);

      await expect
        .element(screen.getByText("เข้าด้วยเบอร์ครั้งแรก กรุณายืนยันวันเกิด"))
        .toBeInTheDocument();
      expect(supabaseMock.auth.setSession).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  it("navigates to redirectTo when provided", async () => {
    const { getByRole, getByLabelText } = await render(
      <UserAuthForm redirectTo="/settings" />,
    );

    await userEvent.fill(
      getByRole("textbox", { name: IDENTIFIER_LABEL }),
      "a@b.com",
    );
    await userEvent.fill(getByLabelText("Password"), "1234567");

    await userEvent.click(getByRole("button", { name: /^Sign in$/i }));

    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: "/settings",
        replace: true,
      }),
    );
  });
});
