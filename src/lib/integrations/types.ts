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
  capturePayment(paymentIntentId: string): Promise<void>;
  releaseToProvider(
    paymentIntentId: string,
  ): Promise<{ transferId: string }>;
  refund(paymentIntentId: string): Promise<void>;
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
