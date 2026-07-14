import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, Tag, Wallet,
  FileText, CheckCircle, XCircle, Image, Film,
} from "lucide-react";
import { getCampagneApi, type Campagne } from "../../lib/api";

const BASE_BACKEND = import.meta.env.VITE_API_BASE_URL;

const STATUS_CONFIG = {
  actif:      { label: "Actif",       className: "bg-green-100 text-green-700",  Icon: CheckCircle },
  en_attente: { label: "En attente",  className: "bg-amber-100 text-amber-700",  Icon: Clock },
  cloture:    { label: "Clôturé",     className: "bg-gray-100 text-gray-600",    Icon: CheckCircle },
  rejete:     { label: "Rejeté",      className: "bg-red-100 text-red-600",      Icon: XCircle },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[#4c075b]">{icon}</span>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#f9f0fb] text-[#4c075b] border border-[#e8c8f0]">
      {label}
    </span>
  );
}

export default function DetCampagne() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campagne, setCampagne] = useState<Campagne | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCampagneApi(Number(id))
      .then(setCampagne)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center py-16 text-sm text-gray-400">Chargement...</div>;
  if (error || !campagne) return <div className="flex items-center justify-center py-16 text-sm text-red-500">{error ?? "Campagne introuvable"}</div>;

  const status = STATUS_CONFIG[campagne.statut];
  const media = (campagne as any).medias?.[0];
  const localites: { localite: { label: string } }[] = (campagne as any).localites ?? [];
  const professions: { profession: { label: string } }[] = (campagne as any).professions ?? [];
  const categoriesCiblage: { categorieCiblage: { label: string } }[] = (campagne as any).categoriesCiblage ?? [];

  return (
    <div className="flex flex-col gap-6">

      {/* Fil d'Ariane + Retour */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-2 text-sm">
          <a href="/dashboard/annonceur" className="text-gray-400 hover:text-[#4c075b] transition-colors">Dashboard</a>
          <span className="text-gray-300">/</span>
          <a href="/dashboard/annonceur/campagnes" className="text-gray-400 hover:text-[#4c075b] transition-colors">Campagnes</a>
          <span className="text-gray-300">/</span>
          <span className="text-gray-800 font-semibold truncate max-w-[180px]">{campagne.nom}</span>
        </nav>
        <button
          onClick={() => navigate("/dashboard/annonceur/campagnes")}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#4c075b] transition-colors"
        >
          <ArrowLeft size={15} /> Retour
        </button>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-black text-gray-900 font-playfair italic">{campagne.nom}</h1>
          {campagne.categorie && <p className="text-xs text-gray-400">{campagne.categorie.label}</p>}
          {(campagne as any).description && <p className="text-sm text-gray-600 mt-1 max-w-xl">{(campagne as any).description}</p>}
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${status.className}`}>
          <status.Icon size={13} />
          {status.label}
        </span>
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Dates & Heure */}
        <Section title="Planification" icon={<Calendar size={16} />}>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Date de début</span>
              <span className="font-medium text-gray-800">{fmt(campagne.dateDebut)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Date de fin</span>
              <span className="font-medium text-gray-800">{fmt(campagne.dateFin)}</span>
            </div>
            {(campagne as any).heureDiffusion && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1"><Clock size={13} /> Heure de diffusion</span>
                <span className="font-medium text-gray-800">{(campagne as any).heureDiffusion}</span>
              </div>
            )}
          </div>
        </Section>

        {/* Budget */}
        <Section title="Budget" icon={<Wallet size={16} />}>
          <p className="text-3xl font-black text-[#c9a227] text-center mt-6">
            {campagne.budget.toLocaleString("fr-FR")} <span className="text-base font-semibold text-gray-400">F CFA</span>
          </p>
        </Section>

        {/* Ciblage géographique */}
        <Section title="Ciblage géographique" icon={<MapPin size={16} />}>
          <div className="flex flex-col gap-3 text-sm">
            {campagne.pays && (
              <div className="flex items-center gap-2">
                <img src={`https://flagcdn.com/20x15/${campagne.pays.code}.png`} alt={campagne.pays.label} className="w-5 h-auto rounded-sm" />
                <span className="font-medium text-gray-800">{campagne.pays.label}</span>
              </div>
            )}
            {localites.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Localités</p>
                <div className="flex flex-wrap gap-1.5">
                  {localites.map((l, i) => <Chip key={i} label={l.localite.label} />)}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Audience */}
        <Section title="Audience cible" icon={<Users size={16} />}>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Tranche d'âge</span>
              <span className="font-medium text-gray-800">{(campagne as any).ageMin ?? 18} – {(campagne as any).ageMax ?? 99} ans</span>
            </div>
            {professions.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Professions</p>
                <div className="flex flex-wrap gap-1.5">
                  {professions.map((p, i) => <Chip key={i} label={p.profession.label} />)}
                </div>
              </div>
            )}
            {categoriesCiblage.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Catégories d'intérêt</p>
                <div className="flex flex-wrap gap-1.5">
                  {categoriesCiblage.map((c, i) => <Chip key={i} label={c.categorieCiblage.label} />)}
                </div>
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Contenu média */}
      <Section title="Contenu" icon={<FileText size={16} />}>
        <div className="flex flex-col gap-4">
          {campagne.typeMedia && (
            <div className="flex items-center gap-2 text-sm">
              {campagne.typeMedia.code === "video" ? <Film size={15} className="text-gray-400" /> : <Image size={15} className="text-gray-400" />}
              <span className="text-gray-500">Type :</span>
              <span className="font-medium text-gray-800">{campagne.typeMedia.label}</span>
            </div>
          )}
          {(campagne as any).legende && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Légende</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100">{(campagne as any).legende}</p>
            </div>
          )}
          {media && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Fichier média</p>
              {media.mimetype.startsWith("image/") ? (
                <img
                  src={`${BASE_BACKEND}/${media.path}`}
                  alt="Média campagne"
                  className="max-h-64 rounded-xl border border-gray-200 object-contain"
                />
              ) : (
                <video
                  src={`${BASE_BACKEND}/${media.path}`}
                  controls
                  className="max-h-64 rounded-xl border border-gray-200 w-full"
                />
              )}
            </div>
          )}
        </div>
      </Section>

      {/* Catégorie campagne */}
      {campagne.categorie && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Tag size={13} />
          Catégorie campagne : <span className="font-medium text-gray-600">{campagne.categorie.label}</span>
        </div>
      )}
    </div>
  );
}
