# Tovant — Design & Product Document

**Purpose of this document:** a complete, accurate snapshot of what Tovant is and what has actually been built, for use in an AI-assisted competitive comparison against established services in the same space (Angi, Thumbtack, TaskRabbit, and similar marketplace platforms). Every "Built" claim below reflects real, working code as of this writing — verified against the codebase, not aspirational. Every "Not built" claim is called out explicitly so a comparison doesn't have to guess. A dedicated **Competitive Gap Analysis** section near the end collects insight on where Tovant likely falls short of category leaders today.

---

## 1. What Tovant Is

A trust-first marketplace connecting car owners with verified independent mechanics, mobile technicians, and detailers. Pilot market: Minneapolis–St. Paul, MN. Ground-up rewrite (a prior SQLite/JWT prototype is superseded and not present in this repo).

**Core positioning bet:** unlike open marketplaces where anyone can list, Tovant requires full identity/license/insurance/background-check verification *before* a provider can appear in search at all. No self-attested tier exists.

### Roles

- **Car owner** — finds providers, requests quotes, manages jobs, leaves reviews, keeps a reusable "My Garage" vehicle list.
- **Provider** — unifies mechanic, detailer, and upgrades/fabrication under one account type (the difference is which `provider_categories` they hold, not a separate account type). Can be mobile, shop-based, or both.
- **Admin** — verifies providers, manages users, moderates content, configures site-wide taxonomy and business rules.

Fleet/business accounts are explicitly out of scope for v1 (individual owners only). Native mobile apps are explicitly Phase 2, not v1 — the product is responsive web first.

---

## 2. Non-Negotiable Product Decisions

These came out of an explicit requirements pass with the product owner and represent deliberate choices, not gaps — several directly diverge from how competitors operate, which matters for the gap analysis below:

| Decision | What it is | Note |
|---|---|---|
| Verification | Full identity + license + insurance + background check + category-specific credential, before any listing | No self-attested tier — stricter than most competitors' entry tier |
| Quote flow | Direct request to **one** provider | **Not** open bidding — an owner can't broadcast to multiple pros at once and compare, unlike Thumbtack/Angi's default flow |
| Scheduling | Request + manual confirm | **Not** a live-availability instant-book calendar |
| Monetization | Per-lead charge to the provider, the moment a quote is requested — regardless of outcome | Exact pricing not yet decided; supersedes an earlier flat-rate subscription model |
| Job payments | Provider's choice per job: in-app (Stripe Connect Express, manual-capture, functions as escrow) or off-platform (tracked for records, no funds movement) | |
| Escrow release | Hybrid — owner can manually release, or it auto-releases 72h after the provider marks complete if no dispute | The 72h number (and a 24h cancellation-window number) are now admin-configurable, not hardcoded |
| Cancellation | Free within a configurable window (default 24h), late fee after | |
| Platform guarantee | **None** at launch beyond verification + dispute mediation — providers carry their own liability insurance | Some competitors (e.g. Angi in some markets) offer a platform-backed guarantee |
| Auth | Email/password only, **no 2FA** | Mandatory TOTP was tried and explicitly reversed — most users don't have an authenticator app, and the product doesn't need Fort-Knox-level auth even with payments in play |
| Notifications | Email + SMS + in-app, shape reserved for push ahead of a native app | Real in-app notification delivery (badges/read state) is not yet built — see §7 |

---

## 3. User Flows

### 3.1 Car owner

1. **Discover** (`/discover`, public, no account needed) — filter by category/service-mode/minimum-rating, list/grid/map views (Leaflet/OpenStreetMap), each card shows a gauge-style rating.
2. **View a profile** (`/providers/[id]`, public) — bio, verification badges, recent-work photos, services, reviews, certifications, a live quote-request card.
3. **Request a quote** — requires login; picks a category (if the provider spans more than one), a saved vehicle from **My Garage** (or is prompted to add one), and describes the issue. Photo upload on the request itself is a stubbed placeholder, not wired up.
4. **Respond to a quote** (`/owner/jobs`) — accept (schedule a date/time, which creates the `jobs` row) or decline.
5. **Job lifecycle** — read-only from the owner's side as the provider advances it: scheduled → confirmed → in_progress → completed.
6. **Review** — eligible once a job reaches `completed` or `disputed`. One review per job, editable indefinitely by its author. Text + 1–5 rating; no photo attachment.
7. **Messaging** (`/owner/messages`) — real, threaded by quote or job, with a compose box; reachable via "Message" links throughout the app or by deep link.
8. **Settings** (`/owner/settings`) — profile (name/avatar/address/phone), My Garage (add/remove vehicles), a "Become a provider" entry point.
9. **Dashboard** (`/owner/dashboard`) — upcoming jobs, quotes awaiting the owner's response, quotes still awaiting the provider, saved-vehicle count, a "Find a pro" shortcut.

### 3.2 Provider

1. **Apply** (`/become-a-provider`) — business info, category/specialty checkboxes (pulled from admin-editable taxonomy, not hardcoded), service mode, shop address, service radius, background-check consent. Submitting flips the account's role from owner→provider immediately (the one reviewed role-mutation path in the app) and creates a `not_started`/`pending` verification record set.
2. **Get verified** (`/provider/onboarding`) — upload identity/license/insurance documents (image or PDF) and any specialty credential; background check itself has no document (Checkr integration is stub-by-default) but still shows a status. Nothing is listable until an admin approves every required record.
3. **Dashboard** (`/provider/dashboard`) — greeting, four gauge stat cards (rating, quote win rate, avg. response time, this-month earnings), incoming leads with inline "send quote"/"message"/"decline" actions, a mini calendar, an earnings table with a pending-escrow total, a leads-per-week bar chart, a review-star breakdown, verification status — the most feature-dense page in the app.
4. **Calendar** (`/provider/calendar`) — month grid, per-day job list, a self-service "mark unavailable" toggle (informational only — there's no live-availability booking engine to enforce it against).
5. **Jobs** (`/provider/jobs`, `/provider/jobs/[id]`) — kanban board (scheduled → confirmed → in_progress → completed) with one-click stage advancement; marking complete sets the escrow auto-release timestamp.
6. **Earnings** (`/provider/earnings`) — payment history, CSV export, subscription status (always "No active subscription" today — see §7).
7. **Reviews** (`/provider/reviews`) — rating breakdown + full review list.
8. **Settings** (`/provider/settings`) — profile, service offerings (checkboxes from admin taxonomy), typical hourly rate, "recent work" gallery photo upload (admin-moderated before going public).
9. **Messages** (`/provider/messages`) — same threaded system as the owner side.

### 3.3 Admin

1. **Dashboard** (`/admin/dashboard`) — currently a placeholder heading only.
2. **Verification queue** (`/admin/providers`, `/admin/providers/[id]`) — every provider with at least one pending/in-review record; per-record approve/reject with a reason; the only code path that ever writes `isListable`/`overallVerificationStatus`, computed transactionally from every required record's state.
3. **Users** (`/admin/users`, `/admin/users/[id]`) — search, view, ban/unban (better-auth's built-in admin plugin — revokes sessions immediately on ban).
4. **Gallery** (`/admin/gallery`) — approve/reject provider "recent work" photo submissions.
5. **Settings** (`/admin/settings`) — three sub-sections: **Taxonomy** (add/deactivate provider categories, specialties, service offerings — no code deploy needed to add a new one), **Business rules** (escrow auto-release hours, default cancellation window hours), **Homepage images** (replace the marketing site's hero/gallery photos).
6. **Audit log** (`/admin/audit-log`) — placeholder heading only; the underlying `audit_log` table and `writeAuditLog()` helper are real and actively written to by verification approve/reject actions, but there is no UI to browse it yet.
7. **Disputes** (`/admin/disputes`) — placeholder heading only. The `disputes` table exists in the schema with a full status lifecycle, but **no code path anywhere lets an owner or provider open one**, and there is no admin resolution UI. This is a real, user-facing gap, not just an unbuilt view.

---

## 4. Data Model (Postgres via Drizzle ORM)

| Table | Purpose |
|---|---|
| `user`, `session`, `account`, `verification` | better-auth's own tables, plus `role`, `phone`/`phoneVerified`, `banned`/`banReason`/`banExpires` as additional fields |
| `profiles` | Display name, avatar, address/lat-lng — one per user, any role |
| `vehicles` | Owner's "My Garage" — year/make/model/nickname/VIN/mileage |
| `provider_profiles` | Business info, service mode, `isListable`/`overallVerificationStatus` (system-computed only), `acceptingLeads` (provider's own pause switch — deliberately separate from `isListable`), rating aggregate, hourly rate, profile view count, Stripe Connect fields |
| `provider_categories`, `provider_specialties` | Which taxonomy entries a provider holds |
| `provider_category_types`, `provider_specialty_types`, `service_offering_types` | Admin-editable taxonomy lookup tables — replaced what used to be hardcoded Postgres enums, specifically so adding a category/specialty/offering is an admin action, not a migration |
| `verification_records` | One row per document type (+ specialty credential), status, reviewer, object-storage key reference (never the raw document itself) |
| `provider_service_offerings` | What a provider offers, from the admin taxonomy |
| `provider_gallery_photos` | "Recent work" photos, admin-moderated |
| `provider_unavailable_dates` | Provider's informational self-blocked dates |
| `quotes` | Owner→provider direct request; category, vehicle snapshot, status, quoted amount, payment mode |
| `jobs` | 1:1 with an accepted quote; status lifecycle, scheduled time, cancellation window |
| `payments` | Per-job; mode (in-app/off-platform), escrow status, auto-release timestamp, released-by |
| `subscriptions` | Stripe subscription status per provider — **schema exists, nothing ever writes to it**; a leftover from the superseded flat-rate model |
| `disputes` | Full lifecycle schema — **nothing ever writes to it**; no owner/provider-facing entry point exists |
| `reviews` | One per job, 1–5 rating + comment, editable |
| `messages` | Threaded by `quoteId`/`jobId` (not a generic user-to-user conversation concept) |
| `audit_log` | Append-only; written by admin actions that touch money or verification status (ban/unban and gallery moderation are documented exceptions, tracked via per-row reviewer fields instead) |
| `homepage_images` | Admin-replaceable marketing homepage photos, with committed defaults as fallback |
| `site_settings` | Small key-value table — currently exactly two keys (escrow hours, cancellation hours) |

---

## 5. System Architecture

**Stack:** Next.js App Router + TypeScript + Tailwind v4, PostgreSQL (Neon) + Drizzle ORM, better-auth, S3-compatible object storage, Stripe (Billing + Connect Express + Identity), Checkr, Postmark/SendGrid + Twilio, Leaflet/OpenStreetMap, Vercel hosting. Package manager pnpm; testing Vitest + Playwright.

**Integration posture:** every third-party service (Stripe, Checkr, Twilio, Postmark, S3) is built behind a stub-by-default adapter (`src/lib/integrations/`) — the app is fully exercisable end-to-end with zero real credentials, and flipping to production is an env-var change, not a code change. **This means no real payment has ever been charged, no real background check has ever run, and no real SMS/email has ever been sent** — all of that is simulated.

**Security conventions:**
- Every quote/job/message/payment route enforces a row-level ownership check (requester must be the owner, the provider, or an admin) via one shared helper, not reimplemented per-route. Audited this session across every dynamic-id route and form action with no gaps found.
- Admin actions touching money or verification status write to an append-only audit log in the same transaction as the mutation.
- Verification documents are stored in object storage by reference only (signed URLs); the database never holds raw document content.
- No password-reset or email-verification flow exists yet — email/password signup is immediate, no confirmation step.

---

## 6. Payments & Escrow — Current Reality

This is worth stating plainly since it's easy to overstate from the UI alone: **the payments system is fully modeled and UI-complete, but no money has ever actually moved.**

- Per-lead charging (the core monetization model) has no charge-firing code at all yet — pricing itself isn't even decided (flat vs. variable by category).
- Accepting a quote creates a real `payments` row and simulates a Stripe manual-capture authorization succeeding, but Stripe itself is stubbed.
- Marking a job complete correctly sets `autoReleaseAt` to now + the configured window, but **nothing sweeps that column to actually release funds** — there's no cron/scheduled job doing the release yet, in-app or off.
- The owner's manual "release now" action has no code anywhere — `payments.releasedByUserId` exists in the schema (nullable, specifically to distinguish manual vs. auto-release) but nothing in the app ever sets it. Confirmed via a repo-wide search: zero references outside the schema definition itself.
- Provider subscription billing (the superseded monetization model) has dead schema (`subscriptions`) that nothing writes to.

---

## 7. Explicitly Deferred / Known Gaps (already identified internally)

- **Real in-app notification system** — new lead, quote response, payment released, review received, with read/unread state and badges. Messaging itself is real; notification of new messages is not.
- **Escrow auto-release sweep job** — the timestamp is computed correctly; nothing acts on it.
- **Real payment charging** — see §6.
- **Dispute flow** — schema-only, no entry point for owners/providers, no admin resolution UI.
- **Admin audit log viewer** — the log is written; there's no page to read it.
- **Admin dashboard content** — placeholder heading only.
- **Password reset / email verification** — doesn't exist.
- **Native mobile app** — explicitly Phase 2.

---

## 8. Design System (as of the most recent pass)

One unified design language across the entire product — sage-green, light-by-default with a persisted dark-mode toggle, serif display headlines, pill-shaped nav and active states, an instrument-cluster gauge motif used everywhere a rating/score appears (never star icons). This was a genuine architectural migration this session: the app previously ran two incompatible visual languages (a marketing-site sage palette vs. a dark "premium automotive" dashboard palette); the dark palette has now been fully retired from every page, with the old tokens kept defined-but-unreferenced in `globals.css` pending a final cleanup deletion.

Shared primitives (`Button`, `Card`, `Input`/`Select`/`Textarea`, `Badge`, `Table`, `EmptyState`) back every form and list in the product instead of one-off hand-rolled markup. Navigation is consistent everywhere: a desktop sidebar + mobile bottom tab bar inside each portal (owner/provider/admin), and a floating pill nav with a hover-activated account menu (mirroring that portal's own sidebar, so dashboard actions are reachable from any public page) everywhere else.

Typography is currently system-font stacks standing in for a real type system — no custom fonts have been selected yet.

---

## 9. Competitive Gap Analysis (insights for the AI comparison pass)

Framed against what's typically table-stakes or differentiating for Angi, Thumbtack, TaskRabbit, and similar services. These are analytical observations from having built the system, not additional product decisions — several map directly to the deliberate choices in §2, which is worth flagging explicitly wherever a "gap" is actually a considered tradeoff rather than an oversight.

**Matching & booking**
- No open-bidding / multi-quote comparison flow — Tovant is single-provider-at-a-time by deliberate choice (§2), while Thumbtack/Angi's default experience lets a customer compare several bids side by side. Worth testing whether pilot-market owners feel underserved without it.
- No live-availability instant booking — also a deliberate choice, but it's a meaningfully different user experience than category leaders default to for simple, low-risk jobs (e.g. an oil change) where instant-book reduces friction significantly.
- No upfront price transparency — there's no fixed-price menu or typical-price-range display before an owner requests a quote; hourly rate is optional and only shown once you're already on a provider's page.
- No "best match" or ranked search — `/discover` is filter + flat list, no relevance ranking, no sponsored/boosted placement (a real revenue lever for competitors), no "top pro"-style tiering beyond the binary verified badge.

**Trust & safety**
- No platform-backed guarantee — explicit, deliberate (§2), but it's a headline trust signal for Angi in particular and worth knowing is absent.
- Reviews have no photo attachments and no provider-response capability — both are near-universal on competitor platforms.
- No dispute flow reachable by users at all (§7) — this is more of a real gap than a positioning choice, since trust-first platforms generally need a visible resolution path, not just a mediation policy in the abstract.

**Communication & engagement**
- No push notifications or native app (deliberate, Phase 2), and no in-app notification system yet either (§7) — so right now a user has to manually check the dashboard/messages to know anything happened, which is a real gap versus any competitor.
- No SMS/email actually sends yet (stub-by-default) — meaning even the "you have a new lead" moment is currently silent outside the app.

**Growth & retention**
- No referral program.
- No loyalty/repeat-customer mechanics (e.g. saved payment methods beyond My Garage vehicles, membership perks).
- No content/SEO surface — footer "About/Careers/Blog/Contact" links are inert placeholders; there's no organic-acquisition surface at all beyond the marketing homepage itself.
- No fleet/business accounts (deliberate, §2) — this is a meaningful revenue segment Angi and others do serve, worth revisiting post-pilot.

**Financial**
- No financing/buy-now-pay-later option for larger repair jobs — several competitors partner with financing providers for this, which can matter a lot for a category (auto repair) where job sizes vary widely.
- No real payments processing yet at all (§6) — this is pre-launch reality, not a competitive gap per se, but it means the monetization model itself is entirely unvalidated against real usage.

**If I had to prioritize for a pilot-market launch, in rough order:** (1) a real in-app notification system, since right now the product is silent between page visits; (2) the auto-release sweep job, since escrow otherwise never actually resolves; (3) some visible dispute path, even a minimal one, given the whole positioning is trust-first; (4) real Stripe/Twilio/Postmark credentials flipped on for at least one full payment+notification loop before any real pilot user touches the product.
