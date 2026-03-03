import { vi } from "vitest";

// Mock environment variables before any module loads
process.env["DATABASE_URL"] = "postgresql://test:test@localhost:5432/test";
process.env["NEXTAUTH_SECRET"] = "a".repeat(32);
process.env["NEXTAUTH_URL"] = "http://localhost:3000";
process.env["R2_ACCOUNT_ID"] = "test-account";
process.env["R2_ACCESS_KEY_ID"] = "test-key";
process.env["R2_SECRET_ACCESS_KEY"] = "test-secret";
process.env["R2_BUCKET_NAME"] = "test-bucket";
process.env["STRIPE_SECRET_KEY"] = "sk_test_fake";
process.env["STRIPE_WEBHOOK_SECRET"] = "whsec_test_fake";
process.env["RESEND_API_KEY"] = "re_test_fake";
process.env["CRON_SECRET"] = "c".repeat(32);
process.env["ALLOWED_ORIGINS"] = "*";

// Mock the postgres client — no real DB connection
vi.mock("postgres", () => {
  return {
    default: () => {
      // Return a mock postgres client
      return Object.assign(
        () => Promise.resolve([]),
        { end: () => Promise.resolve() },
      );
    },
  };
});
