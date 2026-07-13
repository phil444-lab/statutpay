import { Outlet, useLocation } from "react-router";
import { LayoutDashboard, Search, HandCoins, Trophy, Settings } from "lucide-react";
import Sidebar from "../app/components/Sidebar";
import type { SidebarItem } from "../app/components/Sidebar";
import DashboardNavbar from "../app/components/DashboardNavbar";
import PageTransition from "../app/components/PageTransition";

const diffuseurItems: SidebarItem[] = [
  { label: "Tableau de bord", icon: <LayoutDashboard size={18} />, path: "/dashboard/diffuseur" },
  { label: "Missions",        icon: <Search size={18} />,          path: "/dashboard/diffuseur/missions" },
  { label: "Gains",           icon: <HandCoins size={18} />,       path: "/dashboard/diffuseur/gains" },
  { label: "Classement",      icon: <Trophy size={18} />,          path: "/dashboard/diffuseur/classement" },
  { label: "Paramètres",      icon: <Settings size={18} />,        path: "/dashboard/diffuseur/parametres" },
];

const titles: Record<string, string> = {
  "/dashboard/diffuseur":                "Tableau de bord",
  "/dashboard/diffuseur/missions":       "Missions",
  "/dashboard/diffuseur/gains":          "Gains",
  "/dashboard/diffuseur/classement":     "Classement",
  "/dashboard/diffuseur/parametres":     "Paramètres",
};

export default function DashboardLayoutDiffuseur() {
  const { pathname } = useLocation();
  const title = titles[pathname] ?? "Dashboard";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <Sidebar items={diffuseurItems} role="Diffuseur" />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardNavbar title={title} />
        <main className="flex-1 w-full px-4 md:px-8 py-8 max-w-5xl mx-auto">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
