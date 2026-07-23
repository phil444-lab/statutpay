import { useState, useEffect, useCallback, useRef } from "react";
import { Eye, Users, RefreshCw, TrendingUp, Wallet, Download, ChevronDown, Loader2, FileText } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import * as Select from "@radix-ui/react-select";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getRapportsApi, type RapportsData } from "../../lib/api";

const PERIOD_KEYS = ["today", "7d", "30d", "month", "3m", "all"] as const;
const PERIOD_LABELS: Record<string, string> = {
  today: "Auj.", "7d": "7j", "30d": "30j", month: "Ce mois", "3m": "3 mois", all: "Tout",
};

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

function formatCurrency(n: number): string {
  return n.toLocaleString("fr-FR") + " F";
}

export default function Rapports() {
  const [period, setPeriod] = useState("7d");
  const [statut, setStatut] = useState("tous");
  const [metric, setMetric] = useState<"impressions" | "portee">("impressions");
  const [data, setData] = useState<RapportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (p: string, s: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getRapportsApi(p, s === "tous" ? undefined : s);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(period, statut);
  }, [period, statut, loadData]);

  const kpis = data?.kpis;
  const evolution = data?.evolution ?? [];
  const chartRef = useRef<HTMLDivElement>(null);

  const exporterCSV = () => {
    if (!data) return;
    const lignes = [
      ["Métrique", "Valeur"],
      ["Budget engagé", String(kpis?.budgetEngage ?? 0)],
      ["Solde", String(kpis?.solde ?? 0)],
      ["Dépenses", String(kpis?.depenses ?? 0)],
      ["Impressions", String(kpis?.impressions ?? 0)],
      ["Portée", String(kpis?.portee ?? 0)],
      ["Fréquence", String(kpis?.frequence ?? 0)],
      ["CPM", String(kpis?.cpm ?? 0)],
      [],
      ["Date", "Dépenses (F)", "Transactions"],
      ...evolution.map((e) => [e.date, String(e.depenses), String(e.count)]),
    ];

    const csv = lignes.map((l) => l.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapports-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exporterPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Titre
    doc.setFontSize(18);
    doc.setTextColor(76, 7, 91);
    doc.text("Rapport d'analyse", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Période : ${PERIOD_LABELS[period] || period}`, 14, 30);
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 14, 36);

    // KPIs
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text("Indicateurs clés", 14, 48);

    const kpiData = [
      ["Budget engagé", formatCurrency(kpis?.budgetEngage ?? 0)],
      ["Solde", formatCurrency(kpis?.solde ?? 0)],
      ["Dépenses", formatCurrency(kpis?.depenses ?? 0)],
      ["Impressions", formatNumber(kpis?.impressions ?? 0)],
      ["Portée", formatNumber(kpis?.portee ?? 0)],
      ["Fréquence", kpis?.frequence ? kpis.frequence.toFixed(2) : "—"],
      ["CPM", kpis?.cpm ? formatCurrency(kpis.cpm) : "—"],
    ];

    autoTable(doc, {
      startY: 52,
      head: [["Métrique", "Valeur"]],
      body: kpiData,
      theme: "grid",
      headStyles: { fillColor: [76, 7, 91], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 60, halign: "right" } },
    });

    // Évolution
    const lastY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text("Évolution quotidienne", 14, lastY);

    const evoData = evolution.map((e) => [
      e.date,
      formatCurrency(e.depenses),
      String(e.count),
    ]);

    if (evoData.length > 0) {
      autoTable(doc, {
        startY: lastY + 4,
        head: [["Date", "Dépenses", "Transactions"]],
        body: evoData,
        theme: "grid",
        headStyles: { fillColor: [76, 7, 91], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 50, halign: "right" }, 2: { cellWidth: 40, halign: "right" } },
      });
    }

    doc.save(`rapport-${period}.pdf`);
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Barre de filtres */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filtres de temps */}
        <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
          {PERIOD_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                period === key
                  ? "bg-[#4c075b] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {PERIOD_LABELS[key]}
            </button>
          ))}
        </div>

        {/* Dropdown statut */}
        <Select.Root value={statut} onValueChange={setStatut}>
          <Select.Trigger className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 bg-white focus:outline-none focus:border-[#4c075b] transition-colors data-[placeholder]:text-gray-400">
            <Select.Value />
            <Select.Icon><ChevronDown size={13} className="text-gray-400" /></Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content position="popper" sideOffset={4} className="bg-white rounded-lg border border-gray-200 shadow-md z-50 overflow-hidden min-w-[140px]">
              <Select.Viewport>
                {[
                  { value: "tous", label: "Tous statuts" },
                  { value: "actif", label: "Actif" },
                  { value: "en_attente", label: "En attente" },
                  { value: "cloture", label: "Clôturé" },
                  { value: "rejete", label: "Rejeté" },
                ].map((opt) => (
                  <Select.Item
                    key={opt.value}
                    value={opt.value}
                    className="px-4 py-2.5 text-sm text-gray-700 cursor-pointer hover:bg-[#f9f0fb] hover:text-[#4c075b] focus:outline-none focus:bg-[#f9f0fb] focus:text-[#4c075b]"
                  >
                    <Select.ItemText>{opt.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        {/* Exports */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={exporterCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-[#4c075b] hover:text-[#4c075b] transition-colors bg-white"
          >
            <Download size={14} />
            CSV
          </button>
          <button
            onClick={exporterPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-[#4c075b] hover:text-[#4c075b] transition-colors bg-white"
          >
            <FileText size={14} />
            PDF
          </button>
        </div>
      </div>

      {/* État de chargement */}
      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-gray-400" />
        </div>
      )}

      {/* Erreur */}
      {error && !data && (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
        </div>
      )}

      {kpis && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { key: "impressions", label: "Impressions", value: kpis.impressions > 0 ? formatNumber(kpis.impressions) : "—", sub: kpis.impressions === 0 ? "Bientôt disponible" : undefined, icon: Eye, color: "bg-purple-100 text-purple-600" },
              { key: "portee", label: "Portée", value: kpis.portee > 0 ? formatNumber(kpis.portee) : "—", sub: kpis.portee === 0 ? "Bientôt disponible" : undefined, icon: Users, color: "bg-blue-100 text-blue-600" },
              { key: "frequence", label: "Fréquence", value: kpis.frequence > 0 ? kpis.frequence.toFixed(2) : "—", sub: kpis.frequence === 0 ? "Bientôt disponible" : undefined, icon: RefreshCw, color: "bg-amber-100 text-amber-600" },
              { key: "cpm", label: "CPM", value: kpis.cpm > 0 ? formatCurrency(kpis.cpm) : "—", sub: kpis.cpm === 0 ? "Bientôt disponible" : undefined, icon: TrendingUp, color: "bg-green-100 text-green-600" },
              { key: "budget", label: "Budget engagé", value: formatCurrency(kpis.budgetEngage), icon: Wallet, color: "bg-rose-100 text-rose-600" },
            ].map(({ key, label, value, sub, icon: Icon, color }) => (
              <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="text-2xl font-black text-gray-900 mt-0.5">{value}</p>
                  {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Graphique */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-semibold text-gray-800">Performance dans le temps</p>
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                {(["impressions", "portee"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                      metric === m ? "bg-white text-[#4c075b] shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {m === "impressions" ? "Impressions" : "Portée"}
                  </button>
                ))}
              </div>
            </div>

            {evolution.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={evolution} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={metric === "impressions" ? "depenses" : "count"}
                    stroke="#4c075b"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#4c075b" }}
                    activeDot={{ r: 6 }}
                    name={metric === "impressions" ? "Dépenses (F)" : "Transactions"}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                Aucune donnée pour cette période
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}