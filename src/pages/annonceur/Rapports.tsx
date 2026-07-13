import { useState } from "react";
import { Eye, Users, RefreshCw, TrendingUp, Wallet, Download, ChevronDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import * as Select from "@radix-ui/react-select";

const PERIODS = ["Auj.", "7j", "30j", "Ce mois", "3 mois", "Tout"];

const EMPTY_DATA = [
  { date: "01/06" }, { date: "05/06" }, { date: "10/06" },
  { date: "15/06" }, { date: "20/06" }, { date: "25/06" }, { date: "30/06" },
].map((d) => ({ ...d, impressions: 0, portee: 0 }));

const KPIS = [
  { key: "impressions", label: "Impressions", value: "0", icon: Eye, color: "bg-purple-100 text-purple-600" },
  { key: "portee", label: "Portée", value: "0", icon: Users, color: "bg-blue-100 text-blue-600" },
  { key: "frequence", label: "Fréquence", value: "0.00", icon: RefreshCw, color: "bg-amber-100 text-amber-600" },
  { key: "cpm", label: "CPM", value: "0 F", icon: TrendingUp, color: "bg-green-100 text-green-600" },
  { key: "budget", label: "Budget engagé", value: "0 F", icon: Wallet, color: "bg-rose-100 text-rose-600" },
];

export default function Rapports() {
  const [period, setPeriod] = useState("7j");
  const [statut, setStatut] = useState("tous");
  const [metric, setMetric] = useState<"impressions" | "portee">("impressions");

  return (
    <div className="flex flex-col gap-6">

      {/* Barre de filtres */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filtres de temps */}
        <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                period === p
                  ? "bg-[#4c075b] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p}
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
                  { value: "active", label: "Active" },
                  { value: "pause", label: "En pause" },
                  { value: "terminee", label: "Terminée" },
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

        {/* Exporter CSV */}
        <button className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-[#4c075b] hover:text-[#4c075b] transition-colors bg-white">
          <Download size={14} />
          Exporter CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {KPIS.map(({ key, label, value, icon: Icon, color }) => (
          <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
              <Icon size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-black text-gray-900 mt-0.5">{value}</p>
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

        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={EMPTY_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke="#4c075b"
              strokeWidth={2}
              dot={{ r: 4, fill: "#4c075b" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
