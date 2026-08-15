import type { IdentityVerificationProvider } from "../types";

let counter = 0;
// Dev-ergonomic: auto-resolves to verified so the full provider
// onboarding flow can be exercised locally with no human in the loop.
const statuses = new Map<string, "pending" | "verified" | "failed">();

export const identityStub: IdentityVerificationProvider = {
  async createVerificationSession(userId) {
    counter += 1;
    const sessionId = `stub_vs_${counter}`;
    statuses.set(sessionId, "verified");
    console.log(`[stub:stripe-identity] createVerificationSession for ${userId} -> ${sessionId}`);
    return { sessionId, url: `https://stub.local/identity/${sessionId}` };
  },
  async getVerificationStatus(sessionId) {
    return statuses.get(sessionId) ?? "pending";
  },
};
