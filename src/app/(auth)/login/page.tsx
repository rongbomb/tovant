"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { dashboardPathForRole } from "@/lib/auth/role-redirect";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

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
    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message ?? "Could not log in.");
        return;
      }
      const { data: session } = await authClient.getSession();
      router.push(dashboardPathForRole((session?.user as { role?: string } | undefined)?.role ?? "owner"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h1 className="home-serif" style={{ fontSize: 28 }}>
          Log in
        </h1>
        {error ? <p style={{ color: "var(--home-danger)", fontSize: 14 }}>{error}</p> : null}
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={submitting} style={{ width: "100%", marginTop: 8 }}>
          {submitting ? "Logging in…" : "Log in"}
        </Button>
        <p className="text-center text-sm" style={{ color: "var(--home-text-muted)" }}>
          Don&apos;t have an account?{" "}
          <a href="/signup" style={{ color: "var(--home-accent)", fontWeight: 600 }}>
            Sign up
          </a>
        </p>
      </form>
    </Card>
  );
}
