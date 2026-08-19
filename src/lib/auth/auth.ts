import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
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
