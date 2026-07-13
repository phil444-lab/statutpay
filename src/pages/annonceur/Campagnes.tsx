import { useState } from "react";
import { useNavigate } from "react-router";
import { Megaphone, PlusCircle, Download, ChevronDown, ChevronUp, Search, Eye, Edit2, Trash2, Clock, CheckCircle, XCircle, Filter, X, Calendar } from "lucide-react";
import * as Select from "@radix-ui/react-select";

type CampaignStatus = "actif" | "en_attente" | "cloture" | "rejete";
type Categorie = "promotion" | "evenement" | "information" | "fidelisation";

interface Campaign {
  id: number;
  nom: string;
  budget: number;
  debut: string;
  fin: string;
  diffuseurs: number;
  statut: CampaignStatus;
  categorie: Categorie;
}

const STATUS_LABELS: Record<CampaignStatus, string> = {
  actif: "Actif",
  en_attente: "En attente",
  cloture: "Clôturé",
  rejete: "Rejeté",
};

const CATEGORIE_LABELS: Record<Categorie, string> = {
  promotion: "Promotion",
  evenement: "Événement",
  information: "Information",
  fidelisation: "Fidélisation",
};

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 1, nom: "Campagne Été 2026", budget: 150000, debut: "01/06/2026", fin: "30/08/2026", diffuseurs: 12, statut: "actif", categorie: "promotion" },
  { id: 2, nom: "Promo Rentrée", budget: 85000, debut: "15/09/2026", fin: "15/10/2026", diffuseurs: 0, statut: "en_attente", categorie: "promotion" },
  { id: 3, nom: "Black Friday", budget: 450000, debut: "01/11/2026", fin: "30/11/2026", diffuseurs: 24, statut: "cloture", categorie: "evenement" },
  { id: 4, nom: "Newsletter Juillet", budget: 30000, debut: "01/07/2026", fin: "31/07/2026", diffuseurs: 8, statut: "actif", categorie: "information" },
  { id: 5, nom: "Programme Fidélité", budget: 200000, debut: "01/01/2026", fin: "31/12/2026", diffuseurs: 45, statut: "actif", categorie: "fidelisation" },
];

function formatCurrency(n: number): string {
  return n.toLocaleString("fr-FR") + " F";
}

function RadixSelect({ value, onValueChange, placeholder, options }: {
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select.Root value={value || undefined} onValueChange={onValueChange}>
      <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#4c075b] transition-colors bg-white data-[placeholder]:text-gray-400">
        <Select.Value placeholder={placeholder} />
        <Select.Icon><ChevronDown size={14} className="text-gray-400" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)] bg-white rounded-lg border border-gray-200 shadow-md z-50 overflow-hidden">
          <Select.Viewport>
            {options.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className="px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-[#f9f0fb] hover:text-[#4c075b] focus:outline-none focus:bg-[#f9f0fb] focus:text-[#4c075b]"
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

function StatutBadge({ statut }: { statut: CampaignStatus }) {
  const colors: Record<CampaignStatus, string> = {
    actif: "bg-green-100 text-green-700",
    en_attente: "bg-amber-100 text-amber-700",
    cloture: "bg-gray-100 text-gray-600",
    rejete: "bg-red-100 text-red-600",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colors[statut]}`}>
      {statut === "actif" && <CheckCircle size={12} />}
      {statut === "en_attente" && <Clock size={12} />}
      {statut === "cloture" && <CheckCircle size={12} />}
      {statut === "rejete" && <XCircle size={12} />}
      {STATUS_LABELS[statut]}
    </span>
  );
}

export default function Campagnes() {
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    statut: CampaignStatus | "";
    categorie: Categorie | "";
    dateDebut: string;
    dateFin: string;
  }>({
    statut: "",
    categorie: "",
    dateDebut: "",
    dateFin: "",
  });
  const [campaigns] = useState(MOCK_CAMPAIGNS);

  const filtered = campaigns.filter((c) => {
    if (search && !c.nom.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.statut && c.statut !== filters.statut) return false;
    if (filters.categorie && c.categorie !== filters.categorie) return false;
    if (filters.dateDebut || filters.dateFin) {
      const [d, m, y] = c.debut.split("/");
      const debutCampagne = new Date(`${y}-${m}-${d}`);
      const [df, mf, yf] = c.fin.split("/");
      const finCampagne = new Date(`${yf}-${mf}-${df}`);
      if (filters.dateDebut && finCampagne < new Date(filters.dateDebut)) return false;
      if (filters.dateFin && debutCampagne > new Date(filters.dateFin)) return false;
    }
    return true;
  });

  const clearFilters = () => {
    setFilters({ statut: "", categorie: "", dateDebut: "", dateFin: "" });
    setSearch("");
  };

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Fil d'Ariane + Bouton d'action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-2 text-sm">
          <a href="/dashboard/annonceur" className="text-gray-400 hover:text-[#4c075b] transition-colors">
            Dashboard
          </a>
          <span className="text-gray-300">/</span>
          <span className="text-gray-800 font-semibold">Campagnes</span>
        </nav>

        <button
          onClick={() => navigate("/dashboard/annonceur/campagnes/create")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4c075b] text-white text-sm font-semibold hover:-translate-y-0.5 transition-all duration-150 shadow-sm"
        >
          <PlusCircle size={16} />
          Nouvelle Campagne
        </button>
      </div>

      {/* Accordéon Filtre */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[#4c075b]" />
            <span className="font-semibold text-gray-800 text-sm">Filtrer Vos Campagnes</span>
          </div>
          {filterOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>

        {filterOpen && (
          <div className="px-5 pb-4 border-t border-gray-100 pt-4 flex flex-col gap-3">
            {/* Barre de recherche (pleine largeur) */}
            <div className="relative max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors bg-white"
              />
            </div>

            {/* Filtres sur une même ligne */}
            <div className="flex flex-wrap items-end gap-3">
              {/* Filtre Statut */}
              <div className="flex flex-col gap-1 min-w-[150px]">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Statut</label>
                <RadixSelect
                  value={filters.statut}
                  onValueChange={(v) => setFilters({ ...filters, statut: v === "__all" ? "" : v as CampaignStatus })}
                  placeholder="Tous les statuts"
                  options={[
                    { value: "__all", label: "Tous les statuts" },
                    ...(["actif", "en_attente", "cloture", "rejete"] as CampaignStatus[]).map((s) => ({
                      value: s,
                      label: STATUS_LABELS[s],
                    })),
                  ]}
                />
              </div>

              {/* Filtre Catégorie */}
              <div className="flex flex-col gap-1 min-w-[150px]">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Catégorie</label>
                <RadixSelect
                  value={filters.categorie}
                  onValueChange={(v) => setFilters({ ...filters, categorie: v === "__all" ? "" : v as Categorie })}
                  placeholder="Toutes les catégories"
                  options={[
                    { value: "__all", label: "Toutes les catégories" },
                    ...(["promotion", "evenement", "information", "fidelisation"] as Categorie[]).map((c) => ({
                      value: c,
                      label: CATEGORIE_LABELS[c],
                    })),
                  ]}
                />
              </div>

              {/* Date Range Picker (côte à côte) */}
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Du</label>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={filters.dateDebut}
                      onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors bg-white text-gray-700"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Au</label>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={filters.dateFin}
                      onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors bg-white text-gray-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tableau des campagnes */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">Vos Campagnes</h3>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <Megaphone size={28} />
            </div>
            <p className="text-sm font-medium text-gray-600">Aucune campagne trouvée</p>
            <p className="text-xs text-gray-400 max-w-xs">
              Aucune campagne ne correspond à votre recherche. Créez-en une nouvelle ou modifiez vos filtres.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Campagne</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Budget</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Période</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Diffuseurs</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{c.nom}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium">{formatCurrency(c.budget)}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-gray-700 text-xs">
                        {c.debut} — {c.fin}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#f3e4f7] text-[#4c075b] text-xs font-bold">
                        {c.diffuseurs}
                      </span>
                    </td>
                    <td className="px-5 py-3.5"><StatutBadge statut={c.statut} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded-lg text-gray-400 hover:text-[#4c075b] hover:bg-[#f9f0fb] transition-colors" title="Voir">
                          <Eye size={15} />
                        </button>
                        <button className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Modifier">
                          <Edit2 size={15} />
                        </button>
                        <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Supprimer">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bouton d'export */}
      {filtered.length > 0 && (
        <div className="flex justify-end">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-all duration-150 shadow-sm hover:-translate-y-0.5">
            <Download size={16} />
            Exporter
          </button>
        </div>
      )}
    </div>
  );
}