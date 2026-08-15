import type { SmsProvider } from "../types";

let counter = 0;

export const smsStub: SmsProvider = {
  async send(to, body) {
    counter += 1;
    console.log(`[stub:sms] to=${to} body="${body}"`);
    return { id: `stub_sms_${counter}` };
  },
};
