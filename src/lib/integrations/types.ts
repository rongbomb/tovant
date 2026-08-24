/**
 * One interface per third-party dependency. Every call site imports from
 * registry.ts, never from a *.stub.ts / *.live.ts file directly — that's
 * what lets real credentials replace stubs later via env vars alone.
 */

export interface PaymentsBillingProvider {
  createSubscription(input: {
    providerId: string;
    customerEmail: string;
  }): Promise<{ subscriptionId: string; status: string }>;
  cancelSubscription(subscriptionId: string): Promise<void>;
}

export interface ConnectPayoutsProvider {
  createConnectAccount(
    providerId: string,
  ): Promise<{ accountId: string; onboardingUrl: string }>;
  authorizePayment(input: {
    jobId: string;
    amountCents: number;
  }): Promise<{ paymentIntentId: string }>;
  // amountCents omitted = full authorized amount (Stripe's own default for
  // capture/refund). Passing less is how a late-cancellation fee or a
  // split dispute resolution moves only part of the held funds.
  capturePayment(paymentIntentId: string, amountCents?: number): Promise<void>;
  releaseToProvider(
    paymentIntentId: string,
    amountCents?: number,
  ): Promise<{ transferId: string }>;
  refund(paymentIntentId: string, amountCents?: number): Promise<void>;
}

/**
 * Per-lead charging (CLAUDE.md monetization) — a provider is charged as
 * soon as an owner sends a quote request, independent of the escrow/payout
 * flow above (that's owner money held for a job; this is the provider
 * paying Tovant for the lead itself).
 */
export interface LeadBillingProvider {
  chargeLead(input: {
    providerId: string;
    quoteId: string;
    amountCents: number;
    /** The provider's Stripe Customer id (providerProfiles.stripeCustomerId) — required in live mode, has nothing to charge without one on file. */
    stripeCustomerId: string | null;
  }): Promise<{ chargeId: string; status: "charged" | "failed" }>;
}

export interface IdentityVerificationProvider {
  createVerificationSession(
    userId: string,
  ): Promise<{ sessionId: string; url: string }>;
  getVerificationStatus(
    sessionId: string,
  ): Promise<"pending" | "verified" | "failed">;
}

export interface BackgroundCheckProvider {
  createCandidate(input: { userId: string }): Promise<{ candidateId: string }>;
  requestReport(candidateId: string): Promise<{ reportId: string }>;
  getReportStatus(
    reportId: string,
  ): Promise<"pending" | "clear" | "consider" | "suspended">;
}

export interface SmsProvider {
  send(to: string, body: string): Promise<{ id: string }>;
}

export interface EmailProvider {
  send(input: { to: string; subject: string; html: string }): Promise<{ id: string }>;
}

export interface ObjectStorageProvider {
  putObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<{ key: string }>;
  getSignedReadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
}
