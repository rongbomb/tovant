import type { ConnectPayoutsProvider } from "../types";
import { getStripeClient } from "./client";

export const connectLive: ConnectPayoutsProvider = {
  async createConnectAccount(providerId) {
    const stripe = getStripeClient();
    const account = await stripe.accounts.create({
      type: "express",
      metadata: { providerId },
    });
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/provider/settings`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/provider/settings`,
      type: "account_onboarding",
    });
    return { accountId: account.id, onboardingUrl: accountLink.url };
  },
  async authorizePayment({ jobId, amountCents }) {
    const stripe = getStripeClient();
    // Manual capture: authorizes now, funds sit in escrow until
    // captured + released per CLAUDE.md's escrow release rules.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      capture_method: "manual",
      metadata: { jobId },
    });
    return { paymentIntentId: paymentIntent.id };
  },
  async capturePayment(paymentIntentId, amountCents) {
    const stripe = getStripeClient();
    // Capturing less than the authorized amount auto-releases the
    // remainder of the hold back to the customer's card — this is how a
    // late-cancellation fee (capture only the fee) works without a
    // separate "void the rest" call.
    await stripe.paymentIntents.capture(
      paymentIntentId,
      amountCents ? { amount_to_capture: amountCents } : undefined,
    );
  },
  async releaseToProvider(paymentIntentId, amountCents) {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const transfer = await stripe.transfers.create({
      amount: amountCents ?? paymentIntent.amount_received,
      currency: paymentIntent.currency,
      destination: paymentIntent.transfer_data?.destination as string,
      source_transaction: (paymentIntent.latest_charge as string) ?? undefined,
    });
    return { transferId: transfer.id };
  },
  async refund(paymentIntentId, amountCents) {
    const stripe = getStripeClient();
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amountCents ? { amount: amountCents } : {}),
    });
  },
};
