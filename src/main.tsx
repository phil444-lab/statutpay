import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./app/App.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import DashboardLayoutAnnonceur from "./pages/DashboardLayoutAnnonceur.tsx";
import DashboardAnnonceur from "./pages/DashboardAnnonceur.tsx";
import Campagnes from "./pages/annonceur/Campagnes.tsx";
import CreerCampagne from "./pages/annonceur/CreerCampagne.tsx";
import DetCampagne from "./pages/annonceur/DetCampagne.tsx";
import Rapports from "./pages/annonceur/Rapports.tsx";
import Portefeuille from "./pages/annonceur/Portefeuille.tsx";
import ParametresAnnonceur from "./pages/annonceur/Parametres.tsx";
import DashboardLayoutDiffuseur from "./pages/DashboardLayoutDiffuseur.tsx";
import DashboardDiffuseur from "./pages/DashboardDiffuseur.tsx";
import Missions from "./pages/diffuseur/Missions.tsx";
import Gains from "./pages/diffuseur/Gains.tsx";
import Classement from "./pages/diffuseur/Classement.tsx";
import ParametresDiffuseur from "./pages/diffuseur/Parametres.tsx";
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
      <Route
        path="/dashboard/annonceur"
        element={<ProtectedRoute requiredRole="annonceur"><DashboardLayoutAnnonceur /></ProtectedRoute>}
      >
        <Route index element={<DashboardAnnonceur />} />
        <Route path="campagnes"        element={<Campagnes />} />
        <Route path="campagnes/create"   element={<CreerCampagne />} />
        <Route path="campagnes/:id/edit"  element={<CreerCampagne />} />
        <Route path="campagnes/:id"       element={<DetCampagne />} />
        <Route path="rapports"     element={<Rapports />} />
        <Route path="portefeuille" element={<Portefeuille />} />
        <Route path="parametres"   element={<ParametresAnnonceur />} />
      </Route>
      <Route
        path="/dashboard/diffuseur"
        element={<ProtectedRoute requiredRole="diffuseur"><DashboardLayoutDiffuseur /></ProtectedRoute>}
      >
        <Route index element={<DashboardDiffuseur />} />
        <Route path="missions"   element={<Missions />} />
        <Route path="gains"      element={<Gains />} />
        <Route path="classement" element={<Classement />} />
        <Route path="parametres" element={<ParametresDiffuseur />} />
      </Route>
      <Route path="/cgu" element={<CGU />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  </BrowserRouter>
  </GoogleOAuthProvider>
);
