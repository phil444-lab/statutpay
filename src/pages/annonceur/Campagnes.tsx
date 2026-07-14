import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Megaphone, PlusCircle, ChevronDown, ChevronUp, Search, Eye, Edit2, Clock, CheckCircle, XCircle, Filter, Calendar, RefreshCw } from "lucide-react";
import * as Select from "@radix-ui/react-select";
import {
  getCampagnesApi, getReferentielsApi,
  type Campagne, type CampagneFilters, type CategorieCampagne,
} from "../../lib/api";

type StatutCampagne = Campagne["statut"];

const STATUS_LABELS: Record<StatutCampagne, string> = {
  actif: "Actif",
  en_attente: "En attente",
  cloture: "Clôturé",
  rejete: "Rejeté",
};

function formatCurrency(n: number) {
  return n.toLocaleString("fr-FR") + " F";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
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

function StatutBadge({ statut }: { statut: StatutCampagne }) {
  const colors: Record<StatutCampagne, string> = {
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
  const [filters, setFilters] = useState<{ statut: string; categorieId: string; dateDebut: string; dateFin: string }>({
    statut: "", categorieId: "", dateDebut: "", dateFin: "",
  });

  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [categories, setCategories] = useState<CategorieCampagne[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const loadCampagnes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const apiFilters: CampagneFilters = {
        ...(filters.statut ? { statut: filters.statut } : {}),
        ...(filters.categorieId ? { categorieId: Number(filters.categorieId) } : {}),
        ...(filters.dateDebut ? { dateDebut: filters.dateDebut } : {}),
        ...(filters.dateFin ? { dateFin: filters.dateFin } : {}),
        ...(search ? { search } : {}),
      };
      const data = await getCampagnesApi(apiFilters);
      setCampagnes(data);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [filters, search]);

  // Charger les référentiels (catégories) une seule fois
  useEffect(() => {
    getReferentielsApi()
      .then((ref) => setCategories(ref.categoriesCampagne))
      .catch(() => {});
  }, []);

  // Recharger les campagnes à chaque changement de filtre
  useEffect(() => {
    const timeout = setTimeout(loadCampagnes, 300);
    return () => clearTimeout(timeout);
  }, [loadCampagnes]);


  return (
    <div className="flex flex-col gap-6">

      {/* Fil d'Ariane + Bouton d'action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-2 text-sm">
          <a href="/dashboard/annonceur" className="text-gray-400 hover:text-[#4c075b] transition-colors">Dashboard</a>
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

            <div className="flex flex-wrap items-end gap-3">
              {/* Filtre Statut */}
              <div className="flex flex-col gap-1 min-w-[150px]">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Statut</label>
                <RadixSelect
                  value={filters.statut}
                  onValueChange={(v) => setFilters({ ...filters, statut: v === "__all" ? "" : v })}
                  placeholder="Tous les statuts"
                  options={[
                    { value: "__all", label: "Tous les statuts" },
                    { value: "actif", label: "Actif" },
                    { value: "en_attente", label: "En attente" },
                    { value: "cloture", label: "Clôturé" },
                    { value: "rejete", label: "Rejeté" },
                  ]}
                />
              </div>

              {/* Filtre Catégorie — depuis l'API */}
              <div className="flex flex-col gap-1 min-w-[160px]">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Catégorie</label>
                <RadixSelect
                  value={filters.categorieId}
                  onValueChange={(v) => setFilters({ ...filters, categorieId: v === "__all" ? "" : v })}
                  placeholder="Toutes les catégories"
                  options={[
                    { value: "__all", label: "Toutes les catégories" },
                    ...categories.map((c) => ({ value: String(c.id), label: c.label })),
                  ]}
                />
              </div>

              {/* Date Range */}
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Du</label>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={filters.dateDebut}
                      onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
                      className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors bg-white text-gray-700"
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
                      className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors bg-white text-gray-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">Vos Campagnes</h3>
          <button onClick={loadCampagnes} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#4c075b] transition-colors">
            <RefreshCw size={13} />
            Actualiser
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">Chargement...</div>
        ) : campagnes.length === 0 ? (
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
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Campagne</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégorie</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Budget</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Période</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campagnes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{c.nom}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{c.categorie?.label ?? "—"}</td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium">{formatCurrency(c.budget)}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-gray-700 text-xs">Du {formatDate(c.dateDebut)} au {formatDate(c.dateFin)}</span>
                    </td>
                    <td className="px-5 py-3.5"><StatutBadge statut={c.statut} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/dashboard/annonceur/campagnes/${c.id}`)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#4c075b] hover:bg-[#f9f0fb] transition-colors" title="Voir">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => navigate(`/dashboard/annonceur/campagnes/${c.id}/edit`)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Modifier">
                          <Edit2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {campagnes.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, campagnes.length)} sur {campagnes.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#4c075b] hover:text-[#4c075b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Préc.
                </button>
                {Array.from({ length: Math.ceil(campagnes.length / PAGE_SIZE) }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      p === page ? "bg-[#4c075b] text-white" : "border border-gray-200 text-gray-600 hover:border-[#4c075b] hover:text-[#4c075b]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === Math.ceil(campagnes.length / PAGE_SIZE)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#4c075b] hover:text-[#4c075b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Suiv.
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>

    </div>
  );
}
