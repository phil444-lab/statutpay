import { useEffect, useState } from "react";
import { Navigate } from "react-router";

interface Props {
  children: React.ReactNode;
  requiredRole: "annonceur" | "diffuseur";
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const [status, setStatus] = useState<"loading" | "ok" | "unauthorized" | "forbidden">("loading");

  useEffect(() => {
    fetch("http://localhost:3000/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) { setStatus("unauthorized"); return; }
        const data = await res.json();
        setStatus(data.role === requiredRole ? "ok" : "forbidden");
      })
      .catch(() => setStatus("unauthorized"));
  }, [requiredRole]);

  if (status === "loading") return null;
  if (status === "unauthorized") return <Navigate to="/login" replace />;
  if (status === "forbidden") return <Navigate to="/login" replace />;
  return <>{children}</>;
}
