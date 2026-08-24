import type { LeadBillingProvider } from "../types";

let counter = 0;

export const leadBillingStub: LeadBillingProvider = {
  async chargeLead({ providerId, quoteId, amountCents }) {
    counter += 1;
    console.log(
      `[stub:lead-billing] charge provider ${providerId} $${(amountCents / 100).toFixed(2)} for lead (quote ${quoteId})`,
    );
    return { chargeId: `stub_lead_charge_${counter}`, status: "charged" };
  },
};
