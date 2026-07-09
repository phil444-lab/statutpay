import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./app/App.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import DashboardAnnonceur from "./pages/DashboardAnnonceur.tsx";
import DashboardDiffuseur from "./pages/DashboardDiffuseur.tsx";
import CGU from "./pages/CGU.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import ProtectedRoute from "./app/components/ProtectedRoute.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard/annonceur" element={<ProtectedRoute requiredRole="annonceur"><DashboardAnnonceur /></ProtectedRoute>} />
      <Route path="/dashboard/diffuseur" element={<ProtectedRoute requiredRole="diffuseur"><DashboardDiffuseur /></ProtectedRoute>} />
      <Route path="/cgu" element={<CGU />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  </BrowserRouter>
  </GoogleOAuthProvider>
);
