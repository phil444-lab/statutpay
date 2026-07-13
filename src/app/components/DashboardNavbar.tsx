import { useUser } from "./UserContext";

export default function DashboardNavbar({ title }: { title: string }) {
  const { user } = useUser();

  const initials = user
    ? `${user.prenoms[0] ?? ""}${user.nom[0] ?? ""}`.toUpperCase()
    : "";

  const roleLabel = user
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : null;

  return (
    <header className="hidden md:flex items-center justify-between bg-white border-b border-gray-100 px-8 h-16 shrink-0 sticky top-0 z-20">
      {/* User info — gauche */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4c075b] to-[#7a0e8f] flex items-center justify-center text-white text-xs font-bold shrink-0">
          {initials}
        </div>
        <div className="flex flex-col leading-tight">
          {user ? (
            <>
              <span className="text-sm font-semibold text-gray-800">
                {user.prenoms} {user.nom}
              </span>
              <span className="text-sm text-[#4c075b] bg-[#4c075b]/10 font-semibold px-1.5 py-0.5 rounded-md text-center">{roleLabel}</span>
            </>
          ) : (
            <span className="text-sm text-gray-400">Chargement…</span>
          )}
        </div>
      </div>

      {/* Titre page — droite */}
      <h1 className="text-base font-bold text-[#c9a227] tracking-tight">{title}</h1>
    </header>
  );
}
