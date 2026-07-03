import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./app/App.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import CGU from "./pages/CGU.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/cgu" element={<CGU />} />
    </Routes>
  </BrowserRouter>
  </GoogleOAuthProvider>
);
