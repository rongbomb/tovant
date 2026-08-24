# Tovant — Post-Launch Roadmap

**Purpose of this document:** a record of what the product owner decided after reviewing `design/DESIGN_DOCUMENT.md`'s competitive gap analysis, and an accurate, continuously-updated snapshot of what's actually been built against that plan versus what's still ahead. Where `DESIGN_DOCUMENT.md` is a point-in-time comparison snapshot, this document tracks a specific body of work to completion — update the **Status** column here as each phase ships, rather than treating this as another static snapshot.

---

## 1. How this roadmap came about

`DESIGN_DOCUMENT.md`'s §9 Competitive Gap Analysis flagged everything Tovant doesn't yet do relative to Angi/Thumbtack/TaskRabbit-style platforms. The product owner reviewed it and responded with three things at once:

1. A question about letting technicians without formal insurance/credentials — but with real experience and positive reviews — join the platform, which the existing "no self-attested tier" rule doesn't accommodate.
2. Confirmation that the gap-analysis list should get built.
3. A decision to narrow the pilot to mechanics/mobile mechanics only, with other categories hidden or marked "coming soon" rather than fully live.

Three research passes across the schema, integrations layer, and admin/auth code confirmed the actual starting point before any of this was planned — notably that `disputes` and `subscriptions` tables already exist fully modeled but unused, and that Stripe Connect/Billing/Identity, Checkr, Twilio, and Postmark all have complete `*.live.ts` implementations that simply have no call sites yet (only the S3 storage adapter is wired into the app today). That research is folded into the phase descriptions below rather than repeated separately.

---

## 2. Decisions made

| Question | Decision |
|---|---|
| Let uninsured/uncredentialed-but-experienced technicians join? | **Yes** — as a second "Community Pro" tier, not a lowered bar for everyone. Identity verification and background checks stay mandatory for both tiers (those are safety controls, not skill controls); insurance/license become optional. Community Pro providers are off-platform-payment-only until they cross a review threshold, and get a visibly distinct badge — never silently mixed with fully-Verified Pros. |
| Open bidding (multi-quote comparison)? | **Declined.** Replaced with a smaller quote-info-reuse flow: if a provider doesn't respond or declines, the owner can re-send the same request to a different provider without retyping it. |
| Live-availability instant booking? | **Dropped entirely.** |
| Fleet/business accounts? | **Deferred** — flagged as needing further scoping (multi-seat org model, billing consolidation, role-based access), not approved to build yet. |
| Pilot category scope | **Mechanics + mobile mechanics only.** Other categories (detailing, upgrades/fabrication) marked "coming soon" rather than removed — publicly visible as not-yet-available rather than hidden outright, and still open for providers to pre-register interest in. |
| Financing/BNPL, loyalty perks, content/SEO surface | **Deferred** — each needs a decision only the product owner can make (a financing partner and sandbox keys, a reward mechanic, a content plan) before there's anything concrete to build. |

---

## 3. Phases

Each phase is independently shippable: implemented, then `pnpm typecheck && pnpm lint && pnpm build`, then live-verified against `pnpm db:seed:demo`'s seeded accounts, then documented in CLAUDE.md. Nothing here ships as one giant change.

| # | Phase | Status | Notes |
|---|---|---|---|
| 0 | Pilot category scoping | **Done** | `provider_category_types.comingSoon` (new, independent of `active`) hides detailing/upgrades-fabrication from the homepage category cards, the hero search bar, and `/discover`'s filter — all three were found to be separate hardcoded/DB call sites that needed touching individually. They stay selectable (labeled "Coming soon") at `/become-a-provider`, and already-listed providers under those categories (e.g. seeded Lakeside Detailing Co) keep working normally on their own profile page and in `/discover`'s unfiltered view. |
| 1 | Password reset + email verification | **Done** | Both via better-auth's built-in core (`emailAndPassword.sendResetPassword`, `emailVerification.sendVerificationEmail`), sent through the existing stub-by-default `emailProvider`. `/forgot-password` → `/reset-password?token=...`. Verification is deliberately not an access gate — no `requireEmailVerification` — consistent with the no-mandatory-2FA stance. |
| 2 | Two-tier verification ("Community Pro") | Not started | New `providerProfiles.verificationTier`; `recomputeProviderListability` branches its required-record set by tier; payment mode forced to off-platform for Community Pro until a review-count threshold (admin-editable via `site_settings`, not hardcoded). |
| 3 | Quote-info reuse | Not started | `?reuseFrom=<quoteId>` pre-fills a new quote request from a declined/expired one, ownership-checked the same way the existing `?quoteId=`/`?jobId=` messaging deep-links are. |
| 4 | In-app notifications | **Done** | `notifications` table + `NotificationBell` (polls every 30s — no websocket/SSE infra) in every portal's nav. `notifyUser` is wired into every event this phase named plus dispute open/resolve, job complete/cancel from Phases 6–8. |
| 5 | Admin audit-log UI + real admin dashboard | **Done** | `/admin/dashboard` now shows live stats (listable providers, pending verification, open disputes, active/completed/cancelled jobs, escrow currently held, 30-day lead revenue) plus a recent-activity feed; `/admin/audit-log` is a full paginated table over the same `auditLog` rows. |
| 6 | Real per-lead payment charging | **Done** | `lead-billing.{stub,live}.ts` charges the provider at `requestQuote` time for `site_settings.per_lead_fee_cents` (admin-editable, default $15.00), recorded in the new `lead_charges` table regardless of stub/live mode. Live mode charges `providerProfiles.stripeCustomerId` off-session; there's still no UI to collect that payment method, so live charges fail loudly rather than silently no-op. |
| 7 | Real escrow | **Done** | `acceptQuote` calls `connectProvider.authorizePayment` for real; job completion captures; `src/lib/payments/escrow.ts::releaseEscrow` (shared by the owner's manual "release now" and the new `POST /api/cron/release-escrow`, bearer-token-authenticated via `CRON_SECRET`) does the transfer. Both paths refuse to run while a dispute is open. |
| 8 | Visible dispute path | **Done** | Owner-facing `openDispute` (`/owner/jobs/[id]`) freezes the job without touching the payment's captured/authorized state; `/admin/disputes`'s resolution queue (`resolveDispute`) supports release / refund / split / close, each audit-logged and notifying both parties. `ConnectPayoutsProvider.capturePayment`/`.releaseToProvider`/`.refund` all gained an optional `amountCents` to support split's partial transfer + partial refund. |
| 9 | Review photos + provider responses | Not started | New `reviewPhotos` table + `providerResponse`/`providerRespondedAt` columns on `reviews`. Neither exists today. |
| 10 | Price transparency | Not started | Optional typical-price ranges per service offering, shown only when a provider has actually set one — never a fabricated number. |
| 11 | Referral program (v1) | Not started | Tracking only (`referralCode`, `referrals` table) — the actual reward mechanic is deliberately left unwired until Phase 6/7's billing is live and a reward is chosen. |

Late-cancellation fee logic (`cancelJob`, `/owner/jobs/[id]`) shipped alongside Phase 7 even though it was never its own numbered phase here — it's the other hardcoded-then-audited business rule from `CLAUDE.md`'s cancellation policy, and it reuses the same `ConnectPayoutsProvider` partial-amount plumbing Phase 8's split resolution needed anyway. Free inside `job.cancellationWindowHours`; past it, charges `site_settings.late_cancellation_fee_percent` (default 20%) of the quoted amount, captured from the existing authorization for `in_app` jobs or informational-only for `off_platform` ones. Owner-initiated only — no provider-side no-show path yet.

---

## 4. Explicitly out of scope for now

- **Open bidding** — declined in favor of Phase 3.
- **Instant booking** — dropped entirely.
- **Fleet/business accounts** — needs a scoping conversation before it's plannable.
- **Financing/BNPL** — needs a partner (Affirm, Klarna, Wisetack, etc.) and sandbox keys first.
- **Loyalty perks** and **content/SEO surface** — need a product-strategy decision (what perks, what content) before there's anything to engineer.

---

## 5. Keeping this in sync with `DESIGN_DOCUMENT.md`

`DESIGN_DOCUMENT.md` was written before this roadmap was scoped, so a few of its claims are already one phase out of date — most notably §2's "No self-attested tier exists" (about to change in Phase 2) and its category framing (Phase 0 already narrowed the pilot to mechanics). Its §7/§9 gap lists will shrink phase by phase as this roadmap executes. Rather than editing it incrementally alongside every phase, the plan is to do a single reconciliation pass once a meaningful chunk of this roadmap has shipped, so it doesn't fall permanently behind — flagging this here so it isn't forgotten, per this repo's existing convention of keeping the two documents in sync.
