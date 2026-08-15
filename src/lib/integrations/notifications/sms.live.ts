import twilio from "twilio";
import type { SmsProvider } from "../types";

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!client) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error("TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN are not set (TWILIO_MODE=live requires them)");
    }
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

export const smsLive: SmsProvider = {
  async send(to, body) {
    if (!process.env.TWILIO_FROM_NUMBER) {
      throw new Error("TWILIO_FROM_NUMBER is not set");
    }
    const message = await getClient().messages.create({
      to,
      from: process.env.TWILIO_FROM_NUMBER,
      body,
    });
    return { id: message.sid };
  },
};
