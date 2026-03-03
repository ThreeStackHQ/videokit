import NextAuth, { type NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, workspaces } from "@videokit/db";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendMagicLinkEmail } from "./email";

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

async function ensureWorkspace(userId: string, userEmail: string, userName: string | null): Promise<void> {
  const existing = await db.query.workspaces.findFirst({
    where: eq(workspaces.userId, userId),
  });
  if (existing) return;

  let slug = generateSlug(userEmail);
  for (let i = 0; i < 5; i++) {
    const conflict = await db.query.workspaces.findFirst({
      where: eq(workspaces.slug, slug),
    });
    if (!conflict) break;
    slug = generateSlug(userEmail);
  }

  const unsubscribeToken = randomBytes(32).toString("hex");
  await db.insert(workspaces).values({
    userId,
    name: userName ?? userEmail.split("@")[0] ?? "My Workspace",
    slug,
    plan: "free",
    unsubscribeToken,
  });
}

export const authOptions: NextAuthOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: DrizzleAdapter(db) as any,
  providers: [
    GithubProvider({
      clientId: process.env["GITHUB_CLIENT_ID"] ?? "",
      clientSecret: process.env["GITHUB_CLIENT_SECRET"] ?? "",
    }),
    EmailProvider({
      from: process.env["EMAIL_FROM"] ?? "noreply@videokit.io",
      sendVerificationRequest: async ({ identifier, url }) => {
        await sendMagicLinkEmail({ to: identifier, url });
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        (session.user as typeof session.user & { id: string }).id = user.id;
      }
      return session;
    },
    async signIn({ user }) {
      if (user.id && user.email) {
        try {
          await ensureWorkspace(user.id, user.email, user.name ?? null);
        } catch {
          // Non-fatal: workspace creation is best-effort
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

const handler = NextAuth(authOptions);
export { handler };
