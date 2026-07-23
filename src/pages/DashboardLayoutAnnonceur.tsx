import { Outlet, useLocation } from "react-router";
import { LayoutDashboard, Megaphone, BarChart2, Wallet, Settings } from "lucide-react";
import Sidebar from "../app/components/Sidebar";
import type { SidebarItem } from "../app/components/Sidebar";
import DashboardNavbar from "../app/components/DashboardNavbar";
import PageTransition from "../app/components/PageTransition";
import { UserProvider } from "../app/components/UserContext";
import OnboardingGuard from "../app/components/OnboardingGuard";
import { Toaster } from "../app/components/ui/sonner";

const annonceurItems: SidebarItem[] = [
  { label: "Tableau de bord", icon: <LayoutDashboard size={18} />, path: "/dashboard/annonceur" },
  { label: "Campagnes",       icon: <Megaphone size={18} />,       path: "/dashboard/annonceur/campagnes" },
  { label: "Rapports & Analyses", icon: <BarChart2 size={18} />,   path: "/dashboard/annonceur/rapports" },
  { label: "Portefeuille",    icon: <Wallet size={18} />,          path: "/dashboard/annonceur/portefeuille" },
  { label: "Paramètres",      icon: <Settings size={18} />,        path: "/dashboard/annonceur/parametres" },
];

const titles: Record<string, string> = {
  "/dashboard/annonceur":             "Tableau de bord",
  "/dashboard/annonceur/campagnes":   "Campagnes",
  "/dashboard/annonceur/campagnes/create": "Nouvelle Campagne",
  "/dashboard/annonceur/rapports":    "Rapports & Analyses",
  "/dashboard/annonceur/portefeuille":"Portefeuille",
  "/dashboard/annonceur/parametres":  "Paramètres",
};

export default function DashboardLayoutAnnonceur() {
  const { pathname } = useLocation();
  const title = titles[pathname] ??
    (/^\/dashboard\/annonceur\/campagnes\/\d+$/.test(pathname) ? "Détail de la campagne" :
    /^\/dashboard\/annonceur\/campagnes\/\d+\/edit$/.test(pathname) ? "Modification Campagne" : "Dashboard");

  // La page paramètres ne doit PAS être bloquée pour permettre à l'utilisateur de compléter son profil
  const isParametresPage = pathname === "/dashboard/annonceur/parametres";

  return (
    <UserProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        <Sidebar items={annonceurItems} role="Annonceur" />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardNavbar title={title} />
          <main className="flex-1 w-full px-4 md:px-8 py-8 max-w-5xl mx-auto">
            <PageTransition>
              {isParametresPage ? <Outlet /> : <OnboardingGuard><Outlet /></OnboardingGuard>}
            </PageTransition>
          </main>
          <Toaster position="top-right" richColors />
        </div>
      </div>
    </UserProvider>
  );
}
