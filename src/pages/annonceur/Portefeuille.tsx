import { Megaphone, Flame, ArrowDownCircle, ArrowUpCircle, History, RefreshCw, PlusCircle, Wallet } from "lucide-react";

const KPIS = [
  { label: "Campagnes actives", value: "0", icon: Megaphone, color: "bg-purple-100 text-purple-600" },
  { label: "Budget engagé", value: "0 F", icon: Flame, color: "bg-orange-100 text-orange-600" },
  { label: "Dépôts ce mois", value: "0 F", icon: ArrowDownCircle, color: "bg-green-100 text-green-600" },
  { label: "Dépenses ce mois", value: "0 F", icon: ArrowUpCircle, color: "bg-rose-100 text-rose-600" },
];

export default function Portefeuille() {
  return (
    <div className="flex flex-col gap-6">

      {/* Bloc principal + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Carte solde */}
        <div className="lg:col-span-1 rounded-xl bg-gradient-to-br from-[#413204] to-[#c9a227] p-6 flex flex-col justify-between gap-6 text-white shadow-md">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-3">
              <Wallet size={18} className="opacity-70" />
              <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Solde disponible</p>
            </div>
            <p className="text-4xl font-black tracking-tight">0 F</p>
            <div className="flex flex-col gap-1 mt-3 text-sm opacity-80">
              <span>Engagé (actif) : <span className="font-semibold">0 F</span></span>
              <span>Total dépensé : <span className="font-semibold">0 F</span></span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/20 text-white text-sm font-semibold opacity-50 cursor-not-allowed"
            >
              <PlusCircle size={15} />
              Ajouter des fonds
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors border border-white/20">
              <History size={15} />
              Historique
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {KPIS.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{value}</p>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions récentes */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">Transactions récentes</p>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#4c075b] hover:text-[#4c075b] transition-colors bg-white">
            <RefreshCw size={12} />
            Actualiser
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <History size={32} className="text-gray-200" />
          <p className="text-sm text-gray-400">Aucune transaction pour le moment.</p>
        </div>
      </div>

    </div>
  );
}
