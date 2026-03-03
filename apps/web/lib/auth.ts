import type { NextAuthOptions, Session, User } from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import GithubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@videokit/db";
import { workspaces } from "@videokit/db";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendMagicLinkEmail } from "./email";

// ── Auth DB ───────────────────────────────────────────────────────────────────
// Uses a REAL drizzle instance (not a Proxy) so DrizzleAdapter can correctly
// detect the database type via `is(db, PgDatabase)`.
type AuthDb = ReturnType<typeof drizzle<typeof schema>>;
let _authDb: AuthDb | undefined;

function getAuthDb(): AuthDb {
  if (_authDb) return _authDb;
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL is not set");
  // postgres() is lazy — it doesn't connect until the first query.
  _authDb = drizzle(postgres(url, { max: 5 }), { schema });
  return _authDb;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateSlug(email: string): string {
  const base = email
    .split("@")[0]!
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

async function ensureWorkspace(
  userId: string,
  userEmail: string,
  userName: string | null
): Promise<void> {
  const authDb = getAuthDb();
  const existing = await authDb.query.workspaces.findFirst({
    where: eq(workspaces.userId, userId),
  });
  if (existing) return;

  let slug = generateSlug(userEmail);
  for (let i = 0; i < 5; i++) {
    const conflict = await authDb.query.workspaces.findFirst({
      where: eq(workspaces.slug, slug),
    });
    if (!conflict) break;
    slug = generateSlug(userEmail);
  }

  const unsubscribeToken = randomBytes(32).toString("hex");
  await authDb.insert(workspaces).values({
    userId,
    name: userName ?? userEmail.split("@")[0] ?? "My Workspace",
    slug,
    plan: "free",
    unsubscribeToken,
  });
}

// ── Auth Options ──────────────────────────────────────────────────────────────

let _adapter: Adapter | undefined;

function getAdapter(): Adapter {
  if (!_adapter) {
    // DrizzleAdapter receives a REAL PgDatabase instance (not a Proxy),
    // so `is(db, PgDatabase)` passes correctly.
    _adapter = DrizzleAdapter(getAuthDb()) as Adapter;
  }
  return _adapter;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authOptions = {
  get adapter() {
    return getAdapter();
  },
  providers: [
    GithubProvider({
      clientId: process.env["GITHUB_CLIENT_ID"] ?? "",
      clientSecret: process.env["GITHUB_CLIENT_SECRET"] ?? "",
    }),
    EmailProvider({
      from: process.env["EMAIL_FROM"] ?? "noreply@videokit.io",
      sendVerificationRequest: async ({
        identifier,
        url,
      }: {
        identifier: string;
        url: string;
      }) => {
        await sendMagicLinkEmail({ to: identifier, url });
      },
    }),
  ],
  session: {
    strategy: "database" as const,
  },
  callbacks: {
    async session({ session, user }: { session: Session; user: AdapterUser }) {
      if (session.user && user) {
        (session.user as typeof session.user & { id: string }).id = user.id;
      }
      return session;
    },
    async signIn({ user }: { user: User | AdapterUser }) {
      if (user.id && user.email) {
        try {
          await ensureWorkspace(user.id, user.email, user.name ?? null);
        } catch {
          // Non-fatal: workspace creation is best-effort on first sign-in.
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

export function getAuthOptions(): NextAuthOptions {
  return authOptions as NextAuthOptions;
}
