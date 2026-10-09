import { authMessages } from "@/features/auth/messages";
import { firstUnmetPasswordMessage } from "@/features/auth/password-policy";

export { PASSWORD_MIN_LENGTH } from "@/features/auth/password-policy";
export const FULL_NAME_MAX_LENGTH = 80;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthFieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export type AuthFormState = {
  fieldErrors?: AuthFieldErrors;
  formError?: string;
  message?: string;
};

export function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function readPassword(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function validateEmail(email: string): string | undefined {
  if (!email) {
    return "Email is required.";
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address.";
  }

  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) {
    return "Password is required.";
  }

  // Do not echo the password value in the returned message.
  return firstUnmetPasswordMessage(password);
}

export function validateFullName(fullName: string): string | undefined {
  if (!fullName) {
    return "Full name is required.";
  }

  if (fullName.length > FULL_NAME_MAX_LENGTH) {
    return `Full name must be ${FULL_NAME_MAX_LENGTH} characters or fewer.`;
  }

  return undefined;
}

export function validateLogin(email: string, password: string): AuthFieldErrors {
  return omitEmpty({
    email: validateEmail(email),
    password: password ? undefined : "Password is required.",
  });
}

export function validateSignup(
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string,
): AuthFieldErrors {
  return omitEmpty({
    fullName: validateFullName(fullName),
    email: validateEmail(email),
    password: validatePassword(password),
    confirmPassword: confirmPassword
      ? password === confirmPassword
        ? undefined
        : authMessages.passwordMismatch
      : "Confirm password is required.",
  });
}

function omitEmpty(errors: AuthFieldErrors): AuthFieldErrors {
  return Object.fromEntries(
    Object.entries(errors).filter((entry) => entry[1]),
  ) as AuthFieldErrors;
}
