"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { dashboardPathForRole } from "@/lib/auth/role-redirect";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // "intent" only picks where signup lands afterward — it never sets the
  // account's role. Role stays server-defaulted to "owner"; becoming a
  // provider is the one reviewed role-change path at /become-a-provider.
  const [intent, setIntent] = useState<"owner" | "provider">("owner");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error: signUpError } = await authClient.signUp.email({
        name,
        email,
        password,
      });
      if (signUpError) {
        setError(signUpError.message ?? "Could not create your account.");
        return;
      }
      router.push(intent === "provider" ? "/become-a-provider" : dashboardPathForRole("owner"));
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
          Create account
        </h1>
        {error ? <p style={{ color: "var(--home-danger)", fontSize: 14 }}>{error}</p> : null}

        <fieldset className="flex gap-2" style={{ border: "none", padding: 0, margin: 0 }}>
          <legend className="home-field-label" style={{ marginBottom: 6 }}>
            I&apos;m signing up as a...
          </legend>
          {(["owner", "provider"] as const).map((option) => (
            <label
              key={option}
              style={{
                flex: 1,
                cursor: "pointer",
                borderRadius: 12,
                border: `1px solid ${intent === option ? "var(--home-accent)" : "var(--home-line)"}`,
                padding: "10px 12px",
                textAlign: "center",
                fontSize: 14,
                color: intent === option ? "var(--home-accent)" : "var(--home-text-muted)",
                fontWeight: intent === option ? 600 : 400,
                transition: "border-color 0.15s ease, color 0.15s ease",
              }}
            >
              <input
                type="radio"
                name="intent"
                value={option}
                checked={intent === option}
                onChange={() => setIntent(option)}
                className="sr-only"
              />
              {option === "owner" ? "Car owner" : "Provider"}
            </label>
          ))}
        </fieldset>

        <Input label="Name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />
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
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={submitting} style={{ width: "100%", marginTop: 8 }}>
          {submitting ? "Creating account…" : "Continue"}
        </Button>
        <p className="text-center text-sm" style={{ color: "var(--home-text-muted)" }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "var(--home-accent)", fontWeight: 600 }}>
            Log in
          </a>
        </p>
      </form>
    </Card>
  );
}
