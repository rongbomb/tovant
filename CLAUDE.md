# Tovant

A trust-first marketplace connecting car owners with verified independent mechanics, mobile technicians, and detailers. Pilot market: Minneapolis–St. Paul, MN.

**Full design document:** [`design/DESIGN_DOCUMENT.md`](design/DESIGN_DOCUMENT.md) — read this before implementing anything, once it's added to this repo. It covers user flows, the full data model (ER diagram), system architecture, security design, payments/escrow architecture, and the design system in detail. This file is a condensed index of the decisions already made, not a replacement for it.

**Mockups:** `design/mockups/` (`home.html`, `provider-profile.html`, `provider-dashboard.html`) — reference implementations of the visual language below, once added to this repo.

## Status

This is a **ground-up rewrite**, scaffolded fresh in this repo starting 2026-08-15. A prior SQLite/JWT prototype (gray/yellow theme, direct-booking flow) exists elsewhere and is superseded — it is not present in this repo. Don't extend or match its conventions if it's ever brought in for reference.

## Non-negotiable product decisions

These came out of an explicit requirements pass with the user — don't silently change them without checking in:

- **Roles:** car owner, provider (unifies mechanic + detailer — difference is `provider_categories`, not account type), admin.
- **Service model:** hybrid — providers can be mobile, shop-based, or both.
- **Verification:** full verification required before a provider can list at all — identity (Stripe Identity), license, insurance, background check (Checkr), plus a separate category-specific credential for each specialty (EV, motorcycle/powersports, commercial/fleet). No self-attested tier.
- **Monetization:** flat-rate provider subscription (Stripe Billing), single tier at launch.
- **Job payments:** provider's choice per job — in-app via Stripe Connect Express (manual-capture, functions as escrow) or off-platform (tracked in-app for record-keeping, no funds movement).
- **Escrow release:** hybrid — owner can manually confirm to release immediately, or it auto-releases 72h after the provider marks a job complete if no dispute is opened.
- **Quote flow:** direct request to one provider, not open bidding.
- **Scheduling:** request + manual confirm, not a live-availability instant-book calendar.
- **Cancellation:** free within a configurable window (default 24h), late fee after.
- **No platform guarantee** at launch beyond verification + dispute mediation — providers carry their own liability insurance.
- **Auth:** email/password + **mandatory TOTP 2FA for every account** (not passwordless — this was explicitly corrected mid-project). No grace period: 2FA setup is hard-blocked immediately after signup, before any dashboard route is reachable.
- **Notifications:** email + SMS + in-app (Twilio + Postmark/SendGrid), reserve a shape for push ahead of the native app.
- **Fleet/business accounts:** out of scope for v1 — individual owners only.
- **Platform:** responsive web first (Next.js). Native apps are Phase 2, not v1.

## Design system

Dark, premium-automotive tone. Signature motif: an **instrument-cluster gauge** used everywhere a rating/score would normally be a star row (provider ratings, stat tiles, map pins) — this is the one recurring visual idea, don't dilute it by also introducing star ratings elsewhere.

| Token | Hex | Use |
|---|---|---|
| `void` | `#0B0C0E` | Primary background |
| `graphite` | `#1A1C20` | Card/surface background |
| `steel` | `#6E747C` | Secondary text, borders, dividers |
| `ash` | `#F2F1EE` | Primary text on dark (warm off-white, not `#FFF`) |
| `ignition` | `#FF6A1A` | Primary accent — CTAs, active states, gauge fills |
| `ember` | `#B8391A` | Hover/pressed states, gradient shading under `ignition` |

Type: heavy tracked uppercase grotesque for display/headlines, a clean humanist sans for body text, and a monospace face for prices/VINs/stats/ratings (the "digital readout" detail that reinforces the instrument-cluster idea). Currently system-font stacks only, defined as CSS variables in `src/app/globals.css` — real fonts will replace those values later, no component should ever reference a font name directly.

## Stack

Next.js (App Router) + TypeScript + Tailwind v4, PostgreSQL (Neon for local/dev) + **Drizzle ORM** (decided over Prisma), **better-auth** for auth (email/password + its TOTP/2FA plugin), S3-compatible object storage for verification docs/media, Stripe (Billing + Connect Express + Identity), Checkr, Postmark/SendGrid + Twilio, Leaflet/OpenStreetMap for maps, Vercel hosting. Package manager is **pnpm**; testing is **Vitest** (unit/integration) + **Playwright** (e2e). All third-party integrations (Stripe/Checkr/Twilio/Postmark/S3) are built behind stub-by-default adapters (`src/lib/integrations/`) since no real test-mode credentials exist yet — real ones slot in later via env vars with no call-site changes.

## Working conventions

- This is a security-sensitive app (payments, background checks, ID documents). Never log or store raw verification documents/PII beyond what's needed — object storage with signed URLs, DB holds references and status only.
- Every appointment/quote/message endpoint needs a row-level ownership check (requester is the owner, the provider, or an admin) — this is a repeated pattern across the whole API, not a one-off. Use the shared helper in `src/lib/security/ownership.ts`, don't reimplement per-route.
- Admin actions that touch money or verification status must write to an append-only audit log via `src/lib/security/audit-log.ts`, in the same DB transaction as the mutation.

## AI agent notes for this repo

`AGENTS.md` in this repo hosts Next.js 16's own managed agent-rules block (regenerated by `next dev` — see `node_modules/next/dist/server/lib/generate-agent-files.js`). Because that file already exists and hosts the block, `next dev` will never touch this `CLAUDE.md` — safe to keep this as the actual product/architecture doc.
