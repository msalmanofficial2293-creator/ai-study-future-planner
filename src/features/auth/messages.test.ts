import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  authErrorOffersResend,
  authMessages,
  classifyAuthError,
  mapAuthError,
  sanitizeAuthDiagnosticMessage,
} from "./messages.ts";

describe("classifyAuthError", () => {
  it("maps email send rate limits", () => {
    assert.equal(
      classifyAuthError({
        code: "over_email_send_rate_limit",
        message: "email rate limit exceeded",
      }),
      "email-rate-limit",
    );
  });

  it("maps request rate limits separately from email send limits", () => {
    assert.equal(
      classifyAuthError({
        code: "over_request_rate_limit",
        message: "Too many requests",
      }),
      "request-rate-limit",
    );
  });

  it("maps unauthorized recipient addresses", () => {
    assert.equal(
      classifyAuthError({
        code: "email_address_not_authorized",
        message: "Email address not authorized",
      }),
      "email-not-authorized",
    );
  });

  it("maps SMTP / send failures as email delivery", () => {
    assert.equal(
      classifyAuthError({
        code: "unexpected_failure",
        message: "Error sending confirmation email via SMTP",
      }),
      "email-delivery",
    );
  });

  it("maps duplicate accounts", () => {
    assert.equal(
      classifyAuthError({
        code: "user_already_exists",
        message: "User already registered",
      }),
      "already-registered",
    );
  });

  it("maps invalid login credentials", () => {
    assert.equal(
      classifyAuthError({
        message: "Invalid login credentials",
      }),
      "invalid-credentials",
    );
  });
});

describe("mapAuthError", () => {
  it("does not claim an email was sent on rate limit", () => {
    const message = mapAuthError({
      code: "over_email_send_rate_limit",
      message: "email rate limit exceeded",
    });
    assert.equal(message, authMessages.emailRateLimited);
    assert.match(message, /No confirmation email was sent/i);
    assert.match(message, /Resend verification/i);
  });

  it("distinguishes delivery failure from duplicate signup", () => {
    assert.equal(
      mapAuthError({
        code: "unexpected_failure",
        message: "Unable to send confirmation email",
      }),
      authMessages.emailDeliveryFailed,
    );
    assert.equal(
      mapAuthError({
        code: "email_exists",
        message: "Email address already exists",
      }),
      authMessages.alreadyRegistered,
    );
  });
});

describe("authErrorOffersResend", () => {
  it("offers resend for delivery and rate-limit email failures", () => {
    assert.equal(authErrorOffersResend("email-rate-limit"), true);
    assert.equal(authErrorOffersResend("email-delivery"), true);
    assert.equal(authErrorOffersResend("email-not-authorized"), true);
    assert.equal(authErrorOffersResend("already-registered"), false);
    assert.equal(authErrorOffersResend("request-rate-limit"), false);
  });
});

describe("sanitizeAuthDiagnosticMessage", () => {
  it("redacts URLs and token query params", () => {
    const sanitized = sanitizeAuthDiagnosticMessage(
      "Failed https://example.com/auth/callback?token_hash=secretvalue&type=signup extra",
    );
    assert.match(sanitized, /\[url\]/);
    assert.doesNotMatch(sanitized, /secretvalue/);
    assert.doesNotMatch(sanitized, /https?:\/\//);
  });
});
