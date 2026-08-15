"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { dashboardPathForRole } from "@/lib/auth/role-redirect";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { data, error: signInError } = await authClient.signIn.email({
      email,
      password,
    });
    setSubmitting(false);
    if (signInError) {
      setError(signInError.message ?? "Could not log in.");
      return;
    }
    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
      router.push("/verify-2fa/challenge");
      return;
    }
    // No 2FA challenge needed (shouldn't normally happen once enrollment
    // is enforced, but handle it defensively). Route-group layouts still
    // gate on twoFactorEnabled server-side regardless of this redirect.
    const { data: session } = await authClient.getSession();
    router.push(
      session?.user ? dashboardPathForRole((session.user as { role?: string }).role ?? "owner") : "/verify-2fa/setup",
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-ash">
        Log in
      </h1>
      {error ? <p className="text-sm text-ember">{error}</p> : null}
      <label className="flex flex-col gap-1 text-sm text-steel">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-steel/40 bg-graphite px-3 py-2 text-ash outline-none focus:border-ignition"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-steel">
        Password
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border border-steel/40 bg-graphite px-3 py-2 text-ash outline-none focus:border-ignition"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded bg-ignition px-4 py-2 font-semibold text-void transition-colors hover:bg-ember disabled:opacity-50"
      >
        {submitting ? "Logging in…" : "Log in"}
      </button>
      <p className="text-center text-sm text-steel">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="text-ignition">
          Sign up
        </a>
      </p>
    </form>
  );
}
