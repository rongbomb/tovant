"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { dashboardPathForRole } from "@/lib/auth/role-redirect";

export default function TwoFactorChallengePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: verifyError } = await authClient.twoFactor.verifyTotp({
      code,
    });
    setSubmitting(false);
    if (verifyError) {
      setError(verifyError.message ?? "That code didn't work. Try again.");
      return;
    }
    const { data: session } = await authClient.getSession();
    router.push(
      session?.user
        ? dashboardPathForRole((session.user as { role?: string }).role ?? "owner")
        : "/login",
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-ash">
        Enter your code
      </h1>
      <p className="text-sm text-steel">
        Open your authenticator app and enter the current 6-digit code.
      </p>
      {error ? <p className="text-sm text-ember">{error}</p> : null}
      <label className="flex flex-col gap-1 text-sm text-steel">
        6-digit code
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="rounded border border-steel/40 bg-graphite px-3 py-2 text-ash outline-none focus:border-ignition"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded bg-ignition px-4 py-2 font-semibold text-void transition-colors hover:bg-ember disabled:opacity-50"
      >
        {submitting ? "Verifying…" : "Verify"}
      </button>
    </form>
  );
}
