import { useState } from "react";
import { useNavigate } from "react-router";
import { Megaphone, Users, BarChart3, Wallet, Eye, Target, TrendingUp, DollarSign, PlusCircle, History, Copy, Check, X, ArrowUpRight, Clock, CheckCircle, XCircle, Filter } from "lucide-react";

type Period = "today" | "7d" | "30d" | "90d";
type CampaignStatus = "actif" | "en_attente" | "cloture" | "rejete";
type ChartMetric = "impressions" | "budget";

interface Campaign {
  id: number;
  nom: string;
  statut: CampaignStatus;
  impressions: number;
  portee: number;
  budget: number;
}

const STATUS_LABELS: Record<CampaignStatus, string> = {
  actif: "Actif",
  en_attente: "En attente",
  cloture: "Clôturé",
  rejete: "Rejeté",
};

const STATUS_COLORS: Record<CampaignStatus, string> = {
  actif: "bg-green-100 text-green-700",
  en_attente: "bg-amber-100 text-amber-700",
  cloture: "bg-gray-100 text-gray-600",
  rejete: "bg-red-100 text-red-600",
};

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 1, nom: "Campagne Été 2026", statut: "actif", impressions: 45200, portee: 28900, budget: 150000 },
  { id: 2, nom: "Promo Rentrée", statut: "en_attente", impressions: 0, portee: 0, budget: 85000 },
  { id: 3, nom: "Black Friday", statut: "cloture", impressions: 120300, portee: 78400, budget: 450000 },
];

const CHART_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: `J${i + 1}`,
  impressions: Math.floor(3000 + Math.random() * 12000),
  budget: Math.floor(20000 + Math.random() * 80000),
}));

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

function formatCurrency(n: number): string {
  return n.toLocaleString("fr-FR") + " F";
}

function StatutBadge({ statut }: { statut: CampaignStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[statut]}`}>
      {statut === "actif" && <CheckCircle size={12} />}
      {statut === "en_attente" && <Clock size={12} />}
      {statut === "cloture" && <CheckCircle size={12} />}
      {statut === "rejete" && <XCircle size={12} />}
      {STATUS_LABELS[statut]}
    </span>
  );
}

function MiniChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const h = 40;
  const w = 120;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardAnnonceur() {
  const navigate = useNavigate();
  const mustChange = sessionStorage.getItem("mustChangePassword") === "true";
  const tempPassword = sessionStorage.getItem("tempPassword") ?? "";
  const [show, setShow] = useState(mustChange);
  const [copied, setCopied] = useState(false);
  const [period, setPeriod] = useState<Period>("30d");
  const [chartMetric, setChartMetric] = useState<ChartMetric>("impressions");
  const [campaigns] = useState(MOCK_CAMPAIGNS);

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

  const statsCount = {
    actif: campaigns.filter((c) => c.statut === "actif").length,
    en_attente: campaigns.filter((c) => c.statut === "en_attente").length,
    cloture: campaigns.filter((c) => c.statut === "cloture").length,
    rejete: campaigns.filter((c) => c.statut === "rejete").length,
  };

  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalPortee = campaigns.reduce((s, c) => s + c.portee, 0);
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const freq = totalImpressions > 0 ? (totalImpressions / (totalPortee || 1)).toFixed(1) : "0";
  const solde = 500000;

  const periods: { key: Period; label: string }[] = [
    { key: "today", label: "Auj." },
    { key: "7d", label: "7j" },
    { key: "30d", label: "30j" },
    { key: "90d", label: "90j" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Bannière mot de passe temporaire */}
      {show && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 relative">
          <button onClick={handleDismiss} className="absolute top-3 right-3 text-amber-400 hover:text-amber-600">
            <X size={16} />
          </button>
          <p className="text-sm font-semibold text-amber-800 mb-1">🔐 Modifie ton mot de passe</p>
          <p className="text-xs text-amber-700 mb-3">
            Un mot de passe temporaire a été généré pour ton compte. Pense à le modifier dès que possible.
          </p>
          <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2 max-w-xs">
            <code className="flex-1 text-sm text-gray-800 font-mono">{tempPassword}</code>
            <button onClick={handleCopy} className="text-amber-500 hover:text-amber-700 transition-colors">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* En-tête : Filtres, bouton action, compteurs de statuts */}
      <div className="flex flex-col gap-4">
        {/* Ligne supérieure : Filtres temps + bouton */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  period === p.key
                    ? "bg-[#4c075b] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate("/dashboard/annonceur/campagnes/create")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4c075b] text-white text-sm font-semibold hover:-translate-y-0.5 transition-all duration-150 shadow-sm"
          >
            <PlusCircle size={16} />
            Nouvelle campagne
          </button>
        </div>

        {/* Ligne de compteurs de statuts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { key: "actif" as CampaignStatus, icon: <CheckCircle size={14} />, color: "text-green-600 bg-green-50 border-green-200" },
            { key: "en_attente" as CampaignStatus, icon: <Clock size={14} />, color: "text-amber-600 bg-amber-50 border-amber-200" },
            { key: "cloture" as CampaignStatus, icon: <CheckCircle size={14} />, color: "text-gray-600 bg-gray-50 border-gray-200" },
            { key: "rejete" as CampaignStatus, icon: <XCircle size={14} />, color: "text-red-600 bg-red-50 border-red-200" },
          ]).map((s) => (
            <div key={s.key} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${s.color}`}>
              {s.icon}
              <span className="text-xs font-medium">{STATUS_LABELS[s.key]}</span>
              <span className="text-sm font-bold ml-auto">{statsCount[s.key]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grille principale : 2 colonnes sur écran large */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Colonne de gauche (contenu principal) */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">

          {/* Grille de 5 KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
            {[
              { icon: <Eye size={18} />, label: "Impressions", value: formatNumber(totalImpressions), sub: "+12% vs période préc.", color: "text-blue-600 bg-blue-50" },
              { icon: <Target size={18} />, label: "Portée", value: formatNumber(totalPortee), sub: `${freq} aff. unique`, color: "text-indigo-600 bg-indigo-50" },
              { icon: <TrendingUp size={18} />, label: "Fréquence", value: freq, sub: "moy. par utilisateur", color: "text-purple-600 bg-purple-50" },
              { icon: <DollarSign size={18} />, label: "Budget engagé", value: formatCurrency(totalBudget), sub: "total campagnes", color: "text-emerald-600 bg-emerald-50" },
              { icon: <Wallet size={18} />, label: "Solde", value: formatCurrency(solde), sub: "disponible", color: "text-[#4c075b] bg-[#f3e4f7]" },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
                <div className={`w-8 h-8 rounded-lg ${kpi.color} flex items-center justify-center`}>
                  {kpi.icon}
                </div>
                <p className="text-lg font-black text-gray-900">{kpi.value}</p>
                <p className="text-xs text-gray-500">{kpi.label}</p>
                <p className="text-[10px] text-gray-400">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Graphique central */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 text-sm">Évolution sur 30 jours</h3>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                {(["impressions", "budget"] as ChartMetric[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setChartMetric(m)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                      chartMetric === m
                        ? "bg-white text-[#4c075b] shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {m === "impressions" ? "Impressions" : "Budget"}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative h-48 sm:h-56">
              <svg viewBox="0 0 600 200" className="w-full h-full" preserveAspectRatio="none">
                {/* Grille */}
                {[0, 1, 2, 3].map((i) => (
                  <line key={i} x1="0" y1={50 * i} x2="600" y2={50 * i} stroke="#f0f0f0" strokeWidth="1" />
                ))}
                {/* Ligne du graphique */}
                <polyline
                  points={CHART_DATA.map((d, i) => {
                    const maxVal = chartMetric === "impressions"
                      ? Math.max(...CHART_DATA.map((x) => x.impressions))
                      : Math.max(...CHART_DATA.map((x) => x.budget));
                    const val = chartMetric === "impressions" ? d.impressions : d.budget;
                    return `${(i / (CHART_DATA.length - 1)) * 600},${200 - (val / maxVal) * 180}`;
                  }).join(" ")}
                  fill="none"
                  stroke="#4c075b"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Zone remplie */}
                <polygon
                  points={`0,200 ${CHART_DATA.map((d, i) => {
                    const maxVal = chartMetric === "impressions"
                      ? Math.max(...CHART_DATA.map((x) => x.impressions))
                      : Math.max(...CHART_DATA.map((x) => x.budget));
                    const val = chartMetric === "impressions" ? d.impressions : d.budget;
                    return `${(i / (CHART_DATA.length - 1)) * 600},${200 - (val / maxVal) * 180}`;
                  }).join(" ")} 600,200`}
                  fill="url(#grad)"
                />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4c075b" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#4c075b" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Tableau des campagnes */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">Campagnes récentes</h3>
              {campaigns.length > 0 && (
                <button className="text-xs font-medium text-[#4c075b] hover:underline flex items-center gap-1">
                  Voir tout
                  <ArrowUpRight size={12} />
                </button>
              )}
            </div>

            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <Megaphone size={24} />
                </div>
                <p className="text-sm font-medium text-gray-600">Aucune campagne</p>
                <p className="text-xs text-gray-400 max-w-xs">
                  Lancez votre première campagne pour commencer à toucher votre audience.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Impressions</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Portée</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-gray-800">{c.nom}</td>
                        <td className="px-5 py-3.5"><StatutBadge statut={c.statut} /></td>
                        <td className="px-5 py-3.5 text-right text-gray-700 font-medium">{formatNumber(c.impressions)}</td>
                        <td className="px-5 py-3.5 text-right text-gray-700 font-medium">{formatNumber(c.portee)}</td>
                        <td className="px-5 py-3.5 text-right text-gray-700 font-medium">{formatCurrency(c.budget)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Colonne de droite : Widget financier latéral */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:sticky lg:top-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#f3e4f7] flex items-center justify-center text-[#4c075b]">
                <Wallet size={16} />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">Portefeuille</h3>
            </div>

            <div className="bg-gradient-to-br from-[#c9a227] to-[#413204] rounded-xl p-4 mb-4 text-white">
              <p className="text-xs text-white/70 mb-1">Solde disponible</p>
              <p className="text-2xl font-black">{formatCurrency(solde)}</p>
            </div>

            <div className="flex flex-col gap-2">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#c9a227] text-white text-sm font-semibold hover:-translate-y-0.5 transition-all duration-150">
                <PlusCircle size={15} />
                Recharger
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
                <History size={15} />
                Historique
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}