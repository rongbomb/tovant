"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Card>Loading…</Card>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("This reset link is missing or expired. Request a new one.");
      return;
    }
    setSubmitting(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (resetError) {
        setError(resetError.message ?? "Could not reset your password.");
        return;
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card>
        <h1 className="home-serif" style={{ fontSize: 24 }}>
          Password reset
        </h1>
        <p className="mt-3 text-sm" style={{ color: "var(--home-text-muted)" }}>
          Your password has been updated.
        </p>
        <Button onClick={() => router.push("/login")} style={{ width: "100%", marginTop: 16 }}>
          Log in
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h1 className="home-serif" style={{ fontSize: 24 }}>
          Set a new password
        </h1>
        {!token ? (
          <p style={{ color: "var(--home-danger)", fontSize: 14 }}>
            This reset link is missing or expired.{" "}
            <a href="/forgot-password" style={{ color: "var(--home-accent)" }}>
              Request a new one
            </a>
            .
          </p>
        ) : null}
        {error ? <p style={{ color: "var(--home-danger)", fontSize: 14 }}>{error}</p> : null}
        <Input
          label="New password"
          type="password"
          required
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={submitting || !token} style={{ width: "100%", marginTop: 8 }}>
          {submitting ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </Card>
  );
}
