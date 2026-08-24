import type { LeadBillingProvider } from "../types";
import { getStripeClient } from "./client";

export const leadBillingLive: LeadBillingProvider = {
  async chargeLead({ quoteId, amountCents, stripeCustomerId }) {
    if (!stripeCustomerId) {
      // No payment method on file yet — there's currently no UI flow that
      // collects one (per-lead billing's card-on-file setup is out of
      // scope for now, same as CLAUDE.md's "no payment has ever actually
      // been charged"). Fails loudly rather than silently no-op-ing so a
      // real deployment surfaces the gap instead of losing revenue quietly.
      return { chargeId: "", status: "failed" };
    }

    const stripe = getStripeClient();
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "usd",
        customer: stripeCustomerId,
        off_session: true,
        confirm: true,
        metadata: { quoteId, kind: "lead_fee" },
      });
      return { chargeId: paymentIntent.id, status: "charged" };
    } catch {
      return { chargeId: "", status: "failed" };
    }
  },
};
