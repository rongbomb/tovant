import * as postmark from "postmark";
import type { EmailProvider } from "../types";

let client: postmark.ServerClient | null = null;

function getClient() {
  if (!client) {
    if (!process.env.POSTMARK_SERVER_TOKEN) {
      throw new Error("POSTMARK_SERVER_TOKEN is not set (POSTMARK_MODE=live requires it)");
    }
    client = new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN);
  }
  return client;
}

export const emailLive: EmailProvider = {
  async send({ to, subject, html }) {
    if (!process.env.POSTMARK_FROM_EMAIL) {
      throw new Error("POSTMARK_FROM_EMAIL is not set");
    }
    const result = await getClient().sendEmail({
      From: process.env.POSTMARK_FROM_EMAIL,
      To: to,
      Subject: subject,
      HtmlBody: html,
    });
    return { id: result.MessageID };
  },
};
