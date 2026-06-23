import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn, Loader2, Eye, EyeOff, Zap } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const schema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ??
        (err as Error)?.message ??
        "Invalid email or password.";
      setServerError(msg);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--color-bg)",
      padding: "1rem",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        top: "-20%",
        left: "-10%",
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: "-20%",
        right: "-10%",
        width: 500,
        height: 500,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div className="card-glass animate-fadeIn" style={{
        width: "100%",
        maxWidth: 420,
        padding: "2.5rem",
        position: "relative",
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "2rem",
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "linear-gradient(135deg, var(--color-primary), #818cf8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 32px var(--color-primary-glow)",
            marginBottom: "1rem",
          }}>
            <Zap size={26} color="white" fill="white" />
          </div>
          <h1 style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--color-text)",
            letterSpacing: "-0.02em",
          }}>
            TicketHub
          </h1>
          <p style={{
            color: "var(--color-text-muted)",
            fontSize: "0.875rem",
            marginTop: "0.25rem",
          }}>
            Sign in to your workspace
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <div className="input" style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0 0.875rem",
              borderColor: errors.email ? "var(--color-danger)" : undefined,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                id="email"
                type="email"
                {...register("email")}
                placeholder="you@company.com"
                autoComplete="email"
                autoFocus
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "var(--color-text)",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                  padding: "0.5rem 0",
                }}
              />
            </div>
            {errors.email && (
              <p style={{ color: "var(--color-danger)", fontSize: "0.75rem", marginTop: "0.375rem" }}>
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="input" style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0 0.875rem",
              borderColor: errors.password ? "var(--color-danger)" : undefined,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "var(--color-text)",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                  padding: "0.5rem 0",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-subtle)",
                  padding: 0,
                  display: "flex",
                  flexShrink: 0,
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p style={{ color: "var(--color-danger)", fontSize: "0.75rem", marginTop: "0.375rem" }}>
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <div style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.15)",
              borderRadius: "var(--radius-sm)",
              padding: "0.75rem 1rem",
              color: "#dc2626",
              fontSize: "0.8125rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              animation: "fadeIn 0.2s ease",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              {serverError}
            </div>
          )}

          <button
            id="login-submit"
            type="submit"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              width: "100%",
              padding: "0.75rem 1.5rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              border: "none",
              background: isSubmitting
                ? "var(--color-primary)"
                : "linear-gradient(135deg, var(--color-primary), #818cf8)",
              color: "#fff",
              opacity: isSubmitting ? 0.7 : 1,
              transition: "all 0.2s ease",
              marginTop: "0.25rem",
              fontFamily: "inherit",
            }}
            disabled={isSubmitting}
            onMouseEnter={(e) => { if (!isSubmitting) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 0 24px var(--color-primary-glow)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <LogIn size={18} />
            )}
            {isSubmitting ? "Signing in\u2026" : "Sign in"}
          </button>
        </form>

        <div style={{
          marginTop: "1.5rem",
          padding: "0.875rem",
          background: "rgba(99,102,241,0.04)",
          border: "1px solid rgba(99,102,241,0.1)",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.75rem",
          color: "var(--color-text-muted)",
          lineHeight: 1.7,
        }}>
          <div style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: "0.25rem" }}>
            Dev credentials
          </div>
          Admin: admin@example.com / password123<br />
          Agent: agent@tickethub.com / agent123
        </div>
      </div>
    </div>
  );
}
