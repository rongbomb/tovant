"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
    });
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message ?? "Could not create your account.");
      return;
    }
    // 2FA is mandatory and not yet enrolled at this point — the
    // (owner)/(provider)/(admin) layout guards would redirect here anyway,
    // but we send the user straight there to avoid an extra bounce.
    router.push("/verify-2fa/setup");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-ash">
        Create account
      </h1>
      {error ? <p className="text-sm text-ember">{error}</p> : null}
      <label className="flex flex-col gap-1 text-sm text-steel">
        Name
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-steel/40 bg-graphite px-3 py-2 text-ash outline-none focus:border-ignition"
        />
      </label>
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
          minLength={10}
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
        {submitting ? "Creating account…" : "Continue"}
      </button>
      <p className="text-center text-sm text-steel">
        Already have an account?{" "}
        <a href="/login" className="text-ignition">
          Log in
        </a>
      </p>
    </form>
  );
}
