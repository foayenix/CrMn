"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction, type LoginState } from "../auth-actions";
import { Suspense } from "react";
import { LogoLockup } from "@/components/logo";

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/admin";
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );
  // Controlled so the value survives the re-render after a failed submit.
  const [email, setEmail] = useState("");

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1 style={{ margin: "0 0 4px" }}>
          <LogoLockup className="login-logo" title="Crescent Moon" />
        </h1>
        <p
          style={{
            fontSize: 10.5,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--terracotta-text)",
            margin: "0 0 26px",
          }}
        >
          Admin
        </p>

        {state.error && <div className="alert error">{state.error}</div>}

        <form action={action}>
          <input type="hidden" name="next" value={next} />
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="btn" type="submit" disabled={pending} style={{ width: "100%", justifyContent: "center" }}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
