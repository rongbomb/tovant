"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { dashboardPathForRole } from "@/lib/auth/role-redirect";

type Stage = "password" | "verify";

export default function TwoFactorSetupPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("password");
  const [password, setPassword] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const manualKey = totpUri
    ? new URL(totpUri.replace("otpauth://", "https://")).searchParams.get("secret")
    : null;

  async function handleEnable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { data, error: enableError } = await authClient.twoFactor.enable({
        password,
      });
      if (enableError) {
        setError(enableError.message ?? "Could not start 2FA setup.");
        return;
      }
      if (data) {
        setTotpUri(data.totpURI);
        setBackupCodes(data.backupCodes);
        setStage("verify");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error: verifyError } = await authClient.twoFactor.verifyTotp({
        code,
      });
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (stage === "password") {
    return (
      <form onSubmit={handleEnable} className="flex flex-col gap-4">
        <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-ash">
          Set up 2FA
        </h1>
        <p className="text-sm text-steel">
          Two-factor authentication is required for every Tovant account.
          Confirm your password to generate a TOTP secret.
        </p>
        {error ? <p className="text-sm text-ember">{error}</p> : null}
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
          {submitting ? "Generating…" : "Generate secret"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-ash">
        Scan &amp; verify
      </h1>
      <p className="text-sm text-steel">
        Add this to your authenticator app, then enter the 6-digit code it
        generates.
      </p>
      <div className="break-all rounded border border-steel/40 bg-graphite p-3 font-mono text-xs text-ash">
        {manualKey ?? totpUri}
      </div>
      {backupCodes.length > 0 ? (
        <div className="rounded border border-steel/40 bg-graphite p-3">
          <p className="mb-2 text-xs uppercase tracking-widest text-steel">
            Backup codes — save these, each works once
          </p>
          <div className="grid grid-cols-2 gap-1 font-mono text-xs text-ash">
            {backupCodes.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
        </div>
      ) : null}
      {error ? <p className="text-sm text-ember">{error}</p> : null}
      <label className="flex flex-col gap-1 text-sm text-steel">
        6-digit code
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          required
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
        {submitting ? "Verifying…" : "Verify & continue"}
      </button>
    </form>
  );
}
