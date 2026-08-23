# Tovant — Build Process (Sequenced by User Type)

**Status:** Draft v1 — companion to [`DESIGN_DOCUMENT.md`](DESIGN_DOCUMENT.md).
**What this document is:** the *order* things get built in and the definition of done at each step. `DESIGN_DOCUMENT.md` is the what/why (data model, architecture, security, payments); this document is the how/when. Read the design doc first — this one assumes it.

**Sequencing decision:** build one user type at a time — **car owner discovery/search → provider dashboard/job flow → admin** — on top of a small shared foundation built once, up front. See the rationale in [§0.3](#03-why-this-order).

---

## Table of contents

0. [Shared foundation (Phase 0 — build once, before any role)](#0-shared-foundation-phase-0--build-once-before-any-role)
1. [Phase 1 — Car owner: discovery & search](#1-phase-1--car-owner-discovery--search)
2. [Phase 2 — Provider: dashboard & job flow](#2-phase-2--provider-dashboard--job-flow)
3. [Phase 3 — Admin console](#3-phase-3--admin-console)
4. [Cross-cutting concerns (applied at every phase, not saved for the end)](#4-cross-cutting-concerns-applied-at-every-phase-not-saved-for-the-end)
5. [Milestone checklist](#5-milestone-checklist)

---

## 0. Shared foundation (Phase 0 — build once, before any role)

Everything below is needed by all three user types, so it gets built once rather than re-derived per phase. Keep this phase small — it's infrastructure, not features.

### 0.1 Scope

- **Auth:** email/password + mandatory TOTP 2FA, httpOnly session cookies, role field (`owner | provider | admin`) — [design doc §6.3](DESIGN_DOCUMENT.md#63-auth--session-design).
- **Database baseline:** `users`, `vehicles`, and a **`service_categories` table** (not a hardcoded enum — see [§0.2](#02-categories-as-data-not-code) below), plus an empty `provider_profiles` skeleton row created at signup so Phase 2 doesn't need a migration to attach to.
- **Design system as code:** color tokens, type scale, the gauge-rating component, the verification badge component, the card surface — built once as shared components so Phase 1's search results and Phase 2's dashboard don't reimplement them differently. Reference: [`design/mockups/*.html`](mockups/) and [design doc §11](DESIGN_DOCUMENT.md#11-design-system).
- **App shell:** base layout, nav (logged-out vs. owner vs. provider vs. admin variants), routing skeleton matching [design doc §3](DESIGN_DOCUMENT.md#3-information-architecture).
- **Audit log table**, wired to nothing yet — created now so Phase 3 (and any Phase 2 money-touching action) writes to it from day one instead of retrofitting.

### 0.2 Categories as data, not code

The current data model sketch in [design doc §5](DESIGN_DOCUMENT.md#5-data-model) writes `provider_categories.category` as a hardcoded enum (`repair | detailing | ev | motorcycle | commercial`). Since the intent is to add categories over time — mobile detailing, tint, wraps, ceramic coating, and whatever comes after — that should be a real table instead:

```
service_categories
  id            uuid PK
  slug          string UK   -- "repair", "detailing", "tint", "wraps", ...
  name          string      -- display name
  icon          string      -- icon reference for category browse UI
  parent_id     uuid FK nullable  -- optional grouping (e.g. "wraps" under "cosmetic")
  requires_specialty_cert  bool   -- default false; true for EV/motorcycle/commercial-style categories
  active        bool default true
```

`provider_categories.category_id` becomes a foreign key into this table instead of a string enum. Adding "window tint" later is an insert, not a schema migration touching the provider model, search filters, and onboarding forms simultaneously. Category-browse chips on the home page and search filters in Phase 1 should read from this table dynamically, not from a hardcoded list in the frontend.

Seed the table at launch with `repair`, `detailing`, `ev`, `motorcycle`, `commercial` (matching the current design doc) so Phase 1 has real filters to build against. This is the one deviation from the current §5 sketch worth carrying into the design doc itself — flagged here rather than silently changed.

### 0.3 Why this order

Owner-side discovery is the top of the funnel and the cheapest flow to build and usability-test in isolation — it doesn't need a working provider dashboard behind it, just seeded provider profiles. Provider tooling comes second because it depends on knowing what a completed quote/appointment object looks like from the owner side, so building it after avoids reworking it once that shape is proven out. Admin comes last because it's the lowest-frequency surface and easiest to bolt on once the core data model has been exercised by real owner + provider flows.

The trade-off: providers and admins see nothing functional until their phase starts. That's acceptable because Phase 0 is small and shared — nobody is blocked on a full parallel build, just on the previous phase's screens.

### 0.4 Definition of done for Phase 0

- [ ] Signup/login/2FA enrollment works for a single test account.
- [ ] `service_categories` table exists, seeded, and has an admin-free way to add a row (a script or raw SQL is fine at this stage — an admin UI for it is Phase 3 work, not Phase 0).
- [ ] Shared component library (gauge, badge, card, nav) renders the three mockup screens' visual language correctly in light of actual Tailwind tokens, not just static HTML.
- [ ] `audit_log` table exists and is write-tested with a dummy event.

---

## 1. Phase 1 — Car owner: discovery & search

### 1.1 Goal

An owner can land on the site, narrow down to the specific kind of service they need, find a qualified provider, and get a quote request sent — without needing a real provider on the other end to respond yet (seed data covers that).

### 1.2 Screens (see [design doc §3](DESIGN_DOCUMENT.md#3-information-architecture) and [§4.1](DESIGN_DOCUMENT.md#41-car-owner-discover--quote--book--pay--review))

| Screen | Route | Notes |
|---|---|---|
| Home | `/` | Hero, category browse (driven by `service_categories`), trust signals. Reference: [`home.html`](mockups/home.html). |
| Search | `/search` | Map + list, filters: category, specialty, service model (mobile/shop/both), distance, rating. This is the screen most worth investing usability effort in — it's the whole "narrow down to what kind of provider I need" ask. |
| Provider profile | `/providers/:id` | Public, no login required. Gauge rating, verification badge with hover/tap detail, service catalog scoped to that provider's categories. Reference: [`provider-profile.html`](mockups/provider-profile.html). |
| Quote request | Modal/flow off the profile | Requires login (creates an owner account if none exists). Photos + description + vehicle selection. |
| Garage | `/garage` | Vehicle profiles — needed before quote request can attach a vehicle. |
| Requests | `/requests` | Status list for quotes sent (sent/quoted/accepted/declined/expired) — even though nothing on the provider side can respond yet in this phase, the owner needs to see "sent, awaiting response" as a real state. |

### 1.3 What's deliberately deferred

- Real provider responses to quote requests (Phase 2 builds the inbox that answers them). Seed the database with a handful of realistic provider profiles across multiple categories so search/filter/profile screens have real variety to test against.
- Booking confirmation, payment, and review screens — depend on a provider being able to send a quote back and mark a job complete.
- Messaging UI beyond a stub — full chat is exercised meaningfully once both sides of a job exist (Phase 2).

### 1.4 Definition of done

- [ ] An owner can go home → browse or search by category/specialty/distance → open a provider profile → send a quote request with a vehicle and photos attached, entirely through the UI.
- [ ] Search filters are driven by the `service_categories` table, not hardcoded chips — confirms the Phase 0 decision actually pays off.
- [ ] Usability pass: watch someone unfamiliar with the product try to find "a mobile mechanic for an EV" and "a detailer for a wrap" and confirm the category/specialty filtering gets them there without confusion.
- [ ] Mobile-responsive — most owners will hit this from a phone.

---

## 2. Phase 2 — Provider: dashboard & job flow

### 2.1 Goal

Close the loop opened in Phase 1: a provider can apply, get verified, appear in search, receive and respond to the quote requests Phase 1 generates, get scheduled, do the job, and get paid.

### 2.2 Screens (see [§4.2](DESIGN_DOCUMENT.md#42-provider-apply--verify--subscribe--work--get-paid))

| Screen | Route | Notes |
|---|---|---|
| Onboarding wizard | `/provider/onboarding` | Identity (Stripe Identity) → license/insurance upload → background check (Checkr) → specialty cert upload if applicable → admin review queue → subscription checkout. This is the longest flow in the product — worth its own sub-sequence (identity first, since everything else gates on it). |
| Leads | `/provider/leads` | Incoming quote requests from Phase 1's owner flow — this is where the two phases actually connect. |
| Calendar | `/provider/calendar` | Request + manual confirm scheduling, not live-availability instant-book — [§4.1](DESIGN_DOCUMENT.md#41-car-owner-discover--quote--book--pay--review). |
| Jobs | `/provider/jobs` | Active/past jobs — messages, before/after media, parts log. |
| Earnings | `/provider/earnings` | Payouts, escrow status, subscription state. Reference: [`provider-dashboard.html`](mockups/provider-dashboard.html). |
| Provider profile editor | `/provider/profile` | Public profile + certs — feeds directly into the Phase 1 profile screen, so this is a good regression check that Phase 1 wasn't overfit to seed data. |

### 2.3 Build order within the phase

Verification pipeline first (nothing else works without an approved provider), then leads/quote-response (closes the Phase 1 loop), then calendar/scheduling, then the in-job workspace (messages/media/parts), then payments (subscription billing, then Connect escrow), then earnings/payout visibility last.

### 2.4 Definition of done

- [ ] A seeded test provider can complete onboarding through to "profile live in search" — including at least one specialty category to confirm the specialty-cert branch works, not just the base path.
- [ ] A quote request sent in Phase 1 shows up in `/provider/leads`, can be responded to with a price/scope, and the resulting accepted quote produces a real appointment the owner sees in `/requests` and `/bookings`.
- [ ] Full round trip works end to end at least once: quote → accept → schedule → in-app payment authorized (manual capture) → job marked complete → 72h auto-release *or* manual owner confirmation → funds released → review left.
- [ ] Off-platform payment mode also works end to end (marked paid outside Tovant, no Stripe hold created) — this is a first-class path, not a fallback.
- [ ] Cancellation/no-show fee logic ([§4.3](DESIGN_DOCUMENT.md#43-cancellation--no-show)) is exercised at least once.

---

## 3. Phase 3 — Admin console

### 3.1 Goal

Give Tovant staff the tools to approve providers, mediate disputes, and see the operational vitals — built last because it depends on there being real verification submissions and real appointments to act on.

### 3.2 Screens (see [design doc §10.4](DESIGN_DOCUMENT.md#104-admin-console-scope))

| Screen | Route | Notes |
|---|---|---|
| Verification queue | `/admin/verification` | Approve/reject with reason, request re-submission. First thing built in this phase — Phase 2's onboarding wizard has been dead-ending into a queue with no reviewer until now. |
| Disputes | `/admin/disputes` | Chat transcript, quote terms, before/after photos, payment/hold status, both parties' history, binding resolution actions — [§4.4](DESIGN_DOCUMENT.md#44-dispute--escrow-release). |
| Billing | `/admin/billing` | Provider subscription status, failed payments, manual comp/refund tools. |
| Analytics | `/admin/analytics` | GMV, active providers, subscription MRR/churn, dispute rate, time-to-quote. |
| Moderation | `/admin/moderation` | Review/chat reports, redact/remove with `audit_log` entry. |
| Category management | `/admin/categories` | Add/deactivate rows in `service_categories` through a UI instead of a script — this is where the Phase 0 category-extensibility decision pays off for real: adding "window tint" post-launch becomes a form, not a deploy. |

### 3.3 Definition of done

- [ ] A pending provider from Phase 2's seed data can be approved or rejected through the UI, and the decision reflects immediately in provider search visibility.
- [ ] A disputed appointment can be resolved (release/refund/split) and the resolution correctly moves money via Stripe and writes to `audit_log`.
- [ ] Adding a new category through `/admin/categories` makes it appear in Phase 1's search filters and category browse without a code change.

---

## 4. Cross-cutting concerns (applied at every phase, not saved for the end)

These aren't a phase of their own — they get built incrementally as each phase touches the relevant surface, per [CLAUDE.md](../CLAUDE.md)'s working conventions:

- **Row-level ownership checks** on every appointment/quote/message endpoint, added as each endpoint is built in Phases 1–2, not retrofitted after.
- **Audit log writes** for every admin action that touches money or verification status, added when Phase 3 builds that action — the table exists from Phase 0, but the writes land with the feature.
- **Notifications** (email + SMS + in-app) get wired incrementally per event as the triggering flow is built — e.g., "quote received" ships with Phase 2's leads screen, not as a separate notifications phase.
- **Accessibility (WCAG 2.1 AA)** checked per screen as it's built, especially icon-only controls (map pins, gauge ratings) — cheaper to catch at build time than in an audit pass at the end.

---

## 5. Milestone checklist

- [ ] **Phase 0 complete:** auth + 2FA, `service_categories` table, shared component library, app shell, empty audit log.
- [ ] **Phase 1 complete:** owner can discover and send a quote request end to end against seeded providers.
- [ ] **Phase 2 complete:** full owner ↔ provider loop closes for both in-app and off-platform payment modes.
- [ ] **Phase 3 complete:** admin can approve providers, resolve disputes, and manage categories without a deploy.

At that point the product matches Phase 1 ("MVP — Minneapolis pilot") in [design doc §13](DESIGN_DOCUMENT.md#13-phasing--roadmap).
