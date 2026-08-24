import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { emailProvider } from "@/lib/integrations/registry";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    sendResetPassword: async ({ user, url }) => {
      await emailProvider.send({
        to: user.email,
        subject: "Reset your Tovant password",
        html: `<p>Reset your password: <a href="${url}">${url}</a></p><p>If you didn't request this, ignore this email.</p>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    // Verification is informational, not an access gate — matches
    // CLAUDE.md's low-friction auth stance (no mandatory 2FA either).
    // A user can use the app before verifying; this just gives them a
    // clear way to confirm their address if they want to.
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await emailProvider.send({
        to: user.email,
        subject: "Verify your Tovant email",
        html: `<p>Verify your email: <a href="${url}">${url}</a></p>`,
      });
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "owner",
        // Role is never client-writable through the auth API. Role changes
        // (e.g. an owner applying to become a provider) go through an
        // explicit server action instead.
        input: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      phoneVerified: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"],
  plugins: [
    admin({
      // The plugin's create-user hook defaults role to "user" if this isn't
      // set explicitly — "user" isn't a role dashboardPathForRole/requireRole
      // understand, so every signup would redirect-loop without this.
      defaultRole: "owner",
      adminRoles: ["admin"],
    }),
  ],
});
