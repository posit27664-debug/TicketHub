import * as Sentry from "@sentry/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TicketsPage } from "./pages/TicketsPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { NewTicketPage } from "./pages/NewTicketPage";
import { UsersPage } from "./pages/UsersPage";
import axios from "axios";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

type HealthStatus = { status: string; timestamp: string } | null;

function HealthBanner() {
  const { data: health, error } = useQuery<HealthStatus>({
    queryKey: ["health"],
    queryFn: async () => {
      const { data } = await axios.get("http://localhost:3001/health");
      return data as HealthStatus;
    },
    refetchInterval: 15_000,
  });

  if (!health && !error) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.25rem",
        right: "1.25rem",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        padding: "0.625rem 1rem",
        borderRadius: "999px",
        fontSize: "0.8125rem",
        fontWeight: 500,
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
        border: error
          ? "1px solid rgba(239,68,68,0.35)"
          : "1px solid rgba(16,185,129,0.35)",
        background: error
          ? "rgba(239,68,68,0.12)"
          : "rgba(16,185,129,0.12)",
        color: error ? "#fca5a5" : "#6ee7b7",
        animation: "fadeIn 0.4s ease forwards",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: error ? "#ef4444" : "#10b981",
          boxShadow: error
            ? "0 0 6px #ef4444"
            : "0 0 6px #10b981",
          flexShrink: 0,
        }}
      />
      {error ? (
        "Server unreachable"
      ) : (
        <>
          Server&nbsp;<strong>{health?.status}</strong>
          &nbsp;·&nbsp;
          {health?.timestamp
            ? new Date(health.timestamp).toLocaleTimeString()
            : ""}
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "1rem",
            fontFamily: "system-ui, sans-serif",
            background: "#0f1117",
            color: "#e2e8f0",
          }}
        >
          <h2 style={{ color: "#fc8181" }}>Something went wrong</h2>
          <p style={{ color: "#a0aec0", maxWidth: 400, textAlign: "center" }}>
            {(error as Error)?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={resetError}
            style={{
              padding: "0.5rem 1.5rem",
              borderRadius: "0.375rem",
              background: "#6366f1",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      )}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <HealthBanner />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/tickets" element={<TicketsPage />} />
                  <Route path="/tickets/new" element={<NewTicketPage />} />
                  <Route path="/tickets/:id" element={<TicketDetailPage />} />
                  <Route element={<AdminRoute />}>
                    <Route path="/users" element={<UsersPage />} />
                  </Route>
                </Route>
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
}

export default App;
