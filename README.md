# VideoKit

> Branded video hosting for indie SaaS — Wistia but $9/mo.

## Monorepo Structure

```
videokit/
├── apps/
│   └── web/                 # Next.js 14 App Router
├── packages/
│   ├── db/                  # Drizzle ORM schema + client
│   ├── player/              # Vanilla JS embeddable player (IIFE)
│   └── config/              # Shared ESLint + TypeScript configs
├── turbo.json
└── pnpm-workspace.yaml
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy env file
cp apps/web/.env.example apps/web/.env.local

# Edit env vars
nano apps/web/.env.local

# Build all packages
pnpm build

# Start dev server
pnpm dev
```

## Database

This project uses Drizzle ORM with PostgreSQL.

### Tables
- `workspaces` — Tenant workspaces with plan/billing info
- `videos` — Video assets with settings, CTA, and gate configs
- `video_plays` — Play analytics (viewer, watch time, completion rate)
- `video_gates` — Email capture for gated videos
- `workspace_api_keys` — API key management
- `subscriptions` — Stripe subscription tracking
- `users`, `accounts`, `sessions`, `verificationTokens` — NextAuth tables

```bash
# Push schema to DB
cd packages/db && pnpm db:push

# Generate migrations
cd packages/db && pnpm db:generate
```

## Player Embed

```html
<script src="https://cdn.videokit.io/player.js"></script>
<div id="my-video"></div>
<script>
  VideoKit.init({
    videoId: "your-video-id",
    container: "#my-video",
    primaryColor: "#3b82f6",
  });
</script>
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL + Drizzle ORM
- **Storage:** Cloudflare R2
- **Auth:** NextAuth.js
- **Payments:** Stripe
- **Email:** Resend
- **Monorepo:** Turborepo + pnpm workspaces
