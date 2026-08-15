import type { IdentityVerificationProvider } from "../types";
import { getStripeClient } from "./client";

export const identityLive: IdentityVerificationProvider = {
  async createVerificationSession(userId) {
    const stripe = getStripeClient();
    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: { userId },
    });
    return { sessionId: session.id, url: session.url ?? "" };
  },
  async getVerificationStatus(sessionId) {
    const stripe = getStripeClient();
    const session = await stripe.identity.verificationSessions.retrieve(sessionId);
    if (session.status === "verified") return "verified";
    if (session.status === "requires_input") return "failed";
    return "pending";
  },
};
