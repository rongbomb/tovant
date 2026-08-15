import type { EmailProvider } from "../types";

let counter = 0;

export const emailStub: EmailProvider = {
  async send({ to, subject }) {
    counter += 1;
    console.log(`[stub:email] to=${to} subject="${subject}"`);
    return { id: `stub_email_${counter}` };
  },
};
