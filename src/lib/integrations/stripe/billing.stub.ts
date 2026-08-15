import type { PaymentsBillingProvider } from "../types";

let counter = 0;

export const billingStub: PaymentsBillingProvider = {
  async createSubscription({ providerId }) {
    counter += 1;
    console.log(`[stub:stripe-billing] createSubscription for ${providerId}`);
    return { subscriptionId: `stub_sub_${counter}`, status: "active" };
  },
  async cancelSubscription(subscriptionId) {
    console.log(`[stub:stripe-billing] cancelSubscription ${subscriptionId}`);
  },
};
