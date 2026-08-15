import type { PaymentsBillingProvider } from "../types";
import { getStripeClient } from "./client";

export const billingLive: PaymentsBillingProvider = {
  async createSubscription({ providerId, customerEmail }) {
    const stripe = getStripeClient();
    if (!process.env.STRIPE_PRICE_ID) {
      throw new Error("STRIPE_PRICE_ID is not set");
    }
    const customer = await stripe.customers.create({
      email: customerEmail,
      metadata: { providerId },
    });
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      metadata: { providerId },
    });
    return { subscriptionId: subscription.id, status: subscription.status };
  },
  async cancelSubscription(subscriptionId) {
    const stripe = getStripeClient();
    await stripe.subscriptions.cancel(subscriptionId);
  },
};
