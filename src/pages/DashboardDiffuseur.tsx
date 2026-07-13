import { useState } from "react";
import { HandCoins, Trophy, Clock, Search, X, Copy, Check } from "lucide-react";

export default function DashboardDiffuseur() {
  const mustChange = sessionStorage.getItem("mustChangePassword") === "true";
  const tempPassword = sessionStorage.getItem("tempPassword") ?? "";
  const [show, setShow] = useState(mustChange);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.removeItem("mustChangePassword");
    sessionStorage.removeItem("tempPassword");
  };

  return (
    <>
      {show && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6 relative">
          <button onClick={handleDismiss} className="absolute top-3 right-3 text-amber-400 hover:text-amber-600">
            <X size={16} />
          </button>
          <p className="text-sm font-semibold text-amber-800 mb-1">🔐 Modifie ton mot de passe</p>
          <p className="text-xs text-amber-700 mb-3">
            Un mot de passe temporaire a été généré pour ton compte. Pense à le modifier dès que possible.
          </p>
          <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2">
            <code className="flex-1 text-sm text-gray-800 font-mono">{tempPassword}</code>
            <button onClick={handleCopy} className="text-amber-500 hover:text-amber-700 transition-colors">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: <HandCoins size={20} />, label: "Gains totaux",        value: "0 XOF" },
          { icon: <Trophy size={20} />,    label: "Missions complétées", value: "0" },
          { icon: <Clock size={20} />,     label: "Missions en cours",   value: "0" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#f3e4f7] flex items-center justify-center text-[#4c075b]">
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-black text-[#4c075b]">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA missions */}
      <div className="bg-white rounded-xl border border-dashed border-[#c9a227] p-8 flex flex-col items-center justify-center text-center gap-3">
        <Search size={36} className="text-[#c9a227]" />
        <p className="font-bold text-gray-800">Aucune mission en cours</p>
        <p className="text-sm text-gray-500">Parcours les missions disponibles et commence à gagner de l'argent dès aujourd'hui.</p>
        <button className="mt-2 px-6 py-2.5 rounded-lg bg-[#4c075b] text-white text-sm font-semibold hover:-translate-y-0.5 transition-all duration-150">
          Voir les missions
        </button>
      </div>
    </>
  );
}
