"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/auth-client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error: requestError } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      if (requestError) {
        setError(requestError.message ?? "Could not send reset email.");
        return;
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Card>
        <h1 className="home-serif" style={{ fontSize: 24 }}>
          Check your email
        </h1>
        <p className="mt-3 text-sm" style={{ color: "var(--home-text-muted)" }}>
          If an account exists for {email}, we sent a link to reset your password.
        </p>
        <p className="mt-6 text-center text-sm" style={{ color: "var(--home-text-muted)" }}>
          <a href="/login" style={{ color: "var(--home-accent)", fontWeight: 600 }}>
            Back to log in
          </a>
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h1 className="home-serif" style={{ fontSize: 24 }}>
          Reset your password
        </h1>
        <p className="text-sm" style={{ color: "var(--home-text-muted)" }}>
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
        {error ? <p style={{ color: "var(--home-danger)", fontSize: 14 }}>{error}</p> : null}
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" disabled={submitting} style={{ width: "100%", marginTop: 8 }}>
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
        <p className="text-center text-sm" style={{ color: "var(--home-text-muted)" }}>
          <a href="/login" style={{ color: "var(--home-accent)", fontWeight: 600 }}>
            Back to log in
          </a>
        </p>
      </form>
    </Card>
  );
}
