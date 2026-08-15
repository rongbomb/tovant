# Tovant

A trust-first marketplace connecting car owners with verified independent mechanics, mobile technicians, and detailers. Pilot market: Minneapolis–St. Paul, MN.

This is the v2 ground-up rewrite. See `CLAUDE.md` (repo root, once copied in) for the full set of locked product/security decisions and design tokens.

## Stack

Next.js (App Router) + TypeScript + Tailwind v4, PostgreSQL + Drizzle ORM, better-auth (email/password + mandatory TOTP 2FA), Stripe (Billing + Connect Express + Identity), Checkr, Postmark + Twilio, S3-compatible object storage. Third-party integrations run in stub mode by default until real credentials are provided.

## Setup

_Filled in as the scaffold lands — see the implementation plan for sequencing._

1. `pnpm install`
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (a free [Neon](https://neon.tech) Postgres project works well for local dev) plus a generated `BETTER_AUTH_SECRET`.
3. `pnpm db:migrate`
4. `pnpm dev`

## Scripts

- `pnpm dev` — start the dev server
- `pnpm build` / `pnpm start` — production build/run
- `pnpm test` — Vitest unit/integration tests
- `pnpm test:e2e` — Playwright end-to-end tests
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:studio` — Drizzle schema/migration tooling
