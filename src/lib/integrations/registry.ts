import "server-only";
import { billingStub } from "./stripe/billing.stub";
import { billingLive } from "./stripe/billing.live";
import { connectStub } from "./stripe/connect.stub";
import { connectLive } from "./stripe/connect.live";
import { identityStub } from "./stripe/identity.stub";
import { identityLive } from "./stripe/identity.live";
import { checkrStub } from "./checkr/checkr.stub";
import { checkrLive } from "./checkr/checkr.live";
import { smsStub } from "./notifications/sms.stub";
import { smsLive } from "./notifications/sms.live";
import { emailStub } from "./notifications/email.stub";
import { emailLive } from "./notifications/email.live";
import { storageStub } from "./storage/s3.stub";
import { storageLive } from "./storage/s3.live";

/**
 * Every third-party integration defaults to its stub implementation when
 * the corresponding *_MODE env var is unset, so a fresh clone runs with
 * zero credentials. Call sites import only from here — never reach into
 * a *.stub.ts / *.live.ts file directly — so flipping a service to real
 * credentials later is an env var change, not a code change.
 */
function pick<T>(mode: string | undefined, stub: T, live: T): T {
  return mode === "live" ? live : stub;
}

export const billingProvider = pick(process.env.STRIPE_MODE, billingStub, billingLive);
export const connectProvider = pick(process.env.STRIPE_MODE, connectStub, connectLive);
export const identityProvider = pick(process.env.STRIPE_MODE, identityStub, identityLive);
export const backgroundCheckProvider = pick(process.env.CHECKR_MODE, checkrStub, checkrLive);
export const smsProvider = pick(process.env.TWILIO_MODE, smsStub, smsLive);
export const emailProvider = pick(process.env.POSTMARK_MODE, emailStub, emailLive);
export const storageProvider = pick(process.env.S3_MODE, storageStub, storageLive);
