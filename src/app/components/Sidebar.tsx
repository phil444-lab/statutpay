import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Menu, X, LogOut } from "lucide-react";
import logo from "../../assets/logo.png";
import { logoutApi } from "../../lib/api";

export type SidebarItem = {
  label: string;
  icon: React.ReactNode;
  path: string;
};

type SidebarProps = {
  items: SidebarItem[];
  role?: "Annonceur" | "Diffuseur";
};

export default function Sidebar({ items }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Ferme le drawer sur resize vers desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Bloque le scroll body quand drawer ouvert
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleLogout = async () => {
    await logoutApi();
    navigate("/login");
  };

  const ConfirmModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[100] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[28rem] flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <LogOut size={18} className="text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">Se déconnecter ?</p>
            <p className="text-md text-gray-500 mt-0.5">Vous serez automatiquement redirigé vers la page de connexion.</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setConfirmLogout(false)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-all"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-0.5 flex-1">
      {items.map((item) => {
        const active = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => { navigate(item.path); onNavigate?.(); }}
            className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 w-full text-left overflow-hidden
              ${active
                ? "bg-gradient-to-r from-[#4c075b]/10 to-[#4c075b]/5 text-[#4c075b] font-semibold"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
          >
            {/* Indicateur actif */}
            <span
              className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-[#4c075b] transition-all duration-200
                ${active ? "h-6 opacity-100" : "h-0 opacity-0"}`}
            />
            <span className={`transition-colors duration-150 ${active ? "text-[#4c075b]" : "text-gray-400 group-hover:text-gray-600"}`}>
              {item.icon}
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  const LogoutButton = () => (
    <button
      onClick={() => setConfirmLogout(true)}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-700 hover:text-red-500 hover:bg-red-50 transition-all duration-150 w-full"
    >
      <LogOut size={16} />
      Se déconnecter
    </button>
  );

  const Brand = () => (
    <div className="flex items-center gap-2">
      <img src={logo} alt="StatutPay" className="w-8 h-8 rounded-lg object-cover" />
      <span className="font-bold font-playfair italic text-xl text-[#4c075b]">
        Statut<span className="text-[#c9a227]">Pay</span>
      </span>
    </div>
  );

  return (
    <>
      {confirmLogout && <ConfirmModal />}
      {/* ── Mobile topbar ── */}
      <header className="md:hidden bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Brand />
        </div>
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-[#4c075b] hover:bg-[#f3e4f7] transition-all duration-150"
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* ── Overlay animé ── */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40 md:hidden transition-opacity duration-300
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* ── Mobile drawer ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white z-50 flex flex-col shadow-2xl md:hidden
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header drawer */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 shrink-0">
          <Brand />
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150"
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-100">
          <LogoutButton />
        </div>
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white border-r border-gray-100 sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-5 h-16 flex items-center border-b border-gray-100 shrink-0">
          <Brand />
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks />
        </div>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-100">
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
