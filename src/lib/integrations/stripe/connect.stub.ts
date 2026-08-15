import type { ConnectPayoutsProvider } from "../types";

let counter = 0;

export const connectStub: ConnectPayoutsProvider = {
  async createConnectAccount(providerId) {
    counter += 1;
    console.log(`[stub:stripe-connect] createConnectAccount for ${providerId}`);
    return {
      accountId: `stub_acct_${counter}`,
      onboardingUrl: `https://stub.local/connect/onboarding/${counter}`,
    };
  },
  async authorizePayment({ jobId, amountCents }) {
    counter += 1;
    console.log(
      `[stub:stripe-connect] authorizePayment for job ${jobId}: $${(amountCents / 100).toFixed(2)}`,
    );
    return { paymentIntentId: `stub_pi_${counter}` };
  },
  async capturePayment(paymentIntentId) {
    console.log(`[stub:stripe-connect] capturePayment ${paymentIntentId}`);
  },
  async releaseToProvider(paymentIntentId) {
    counter += 1;
    console.log(`[stub:stripe-connect] releaseToProvider ${paymentIntentId}`);
    return { transferId: `stub_tr_${counter}` };
  },
  async refund(paymentIntentId) {
    console.log(`[stub:stripe-connect] refund ${paymentIntentId}`);
  },
};
