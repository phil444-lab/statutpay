import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ChevronRight, ChevronLeft, Clock, AlertCircle, Check, Upload, FileText, FolderOpen, ArrowRight } from "lucide-react";
import * as Select from "@radix-ui/react-select";
import { getReferentielsApi, createCampagneApi, updateCampagneApi, getCampagneApi, type Referentiels } from "../../lib/api";
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
  1: "Informations",
  2: "Ciblage",
  3: "Budget",
  4: "Contenu",
};

const STEP_TITLES: Record<Step, string> = {
  1: "Informations générales — Définissez les informations de base de votre campagne",
  2: "Segmentation & Ciblage — Définissez votre audience cible pour maximiser l'impact de votre campagne",
  3: "Budget — Définissez le budget et consultez vos estimations de vues",
  4: "Contenu — Ajoutez le contenu de votre campagne",
};

function RadixSelect({ value, onValueChange, placeholder, options }: {
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select.Root value={value || undefined} onValueChange={onValueChange}>
      <Select.Trigger className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#4c075b] transition-colors bg-white data-[placeholder]:text-gray-400">
        <Select.Value placeholder={placeholder} />
        <Select.Icon><ChevronRight size={14} className="text-gray-400" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)] bg-white rounded-lg border border-gray-200 shadow-md z-50 overflow-hidden">
          <Select.Viewport>
            {options.map((opt) => (
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
  );
}

export default function CreerCampagne() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datesLocked, setDatesLocked] = useState(false);
  
  // Référentiels
  const [referentiels, setReferentiels] = useState<Referentiels | null>(null);
  
  // Formulaire
  const [form, setForm] = useState({
    nom: "",
    description: "",
    typeMediaId: "",
    categorieId: "",
    dateDebut: "",
    dateFin: "",
    heureDiffusion: "08:00",
    budget: "",
    ageMin: 18,
    ageMax: 99,
    legende: "",
  });

  // Ciblage
  const [ciblage, setCiblage] = useState({
    paysId: "",
    localiteIds: [] as number[],
    professionIds: [] as number[],
    categorieCiblageIds: [] as number[],
  });

  // Média
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [existingMedia, setExistingMedia] = useState<{ path: string; mimetype: string } | null>(null);
  const BASE_BACKEND = import.meta.env.VITE_API_BASE_URL;

  // UI State
  const [paysOpen, setPaysOpen] = useState(false);
  const [localiteSearch, setLocaliteSearch] = useState("");
  const [professionSearch, setProfessionSearch] = useState("");

  // Charger les référentiels + données campagne si mode édition
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getReferentielsApi();
        setReferentiels(data);

        if (isEdit) {
          const c = await getCampagneApi(Number(id)) as any;
          const dateDebutAtteinte = new Date(c.dateDebut) <= new Date();
          setDatesLocked(dateDebutAtteinte);
          setForm({
            nom: c.nom ?? "",
            description: c.description ?? "",
            typeMediaId: c.typeMediaId ? String(c.typeMediaId) : "",
            categorieId: c.categorieId ? String(c.categorieId) : "",
            dateDebut: c.dateDebut ? c.dateDebut.split("T")[0] : "",
            dateFin: c.dateFin ? c.dateFin.split("T")[0] : "",
            heureDiffusion: c.heureDiffusion ?? "08:00",
            budget: String(c.budget ?? ""),
            ageMin: c.ageMin ?? 18,
            ageMax: c.ageMax ?? 99,
            legende: c.legende ?? "",
          });
          setCiblage({
            paysId: c.paysId ? String(c.paysId) : "",
            localiteIds: c.localites?.map((l: any) => l.localiteId) ?? [],
            professionIds: c.professions?.map((p: any) => p.professionId) ?? [],
            categorieCiblageIds: c.categoriesCiblage?.map((cc: any) => cc.categorieCiblageId) ?? [],
          });
          // Conserver le média existant
          if (c.medias?.length > 0) {
            setExistingMedia(c.medias[0]);
          }
        } else {
          if (data.pays.length > 0)
            setCiblage(prev => ({ ...prev, paysId: String(data.pays[0].id) }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const toggleItem = (key: "localiteIds" | "professionIds" | "categorieCiblageIds", val: number) =>
    setCiblage((prev) => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key].filter((v) => v !== val) : [...prev[key], val],
    }));

  const selectAll = (key: "localiteIds" | "professionIds", list: number[]) =>
    setCiblage((prev) => ({ ...prev, [key]: prev[key].length === list.length ? [] : list }));

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setExistingMedia(null); // Nouveau fichier sélectionné, on retire l'ancien
      if (file.type.startsWith("image/")) {
        setMediaPreview(URL.createObjectURL(file));
      } else {
        setMediaPreview(null);
      }
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (!isEdit) setExistingMedia(null);
  };

  const handleSubmit = async () => {
    if (!form.nom || !form.dateDebut || !form.dateFin || (!isEdit && !form.budget)) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append("nom", form.nom);
      formData.append("description", form.description);
      formData.append("dateDebut", form.dateDebut);
      formData.append("dateFin", form.dateFin);
      formData.append("heureDiffusion", form.heureDiffusion);
      if (!isEdit) formData.append("budget", form.budget);
      formData.append("ageMin", String(form.ageMin));
      formData.append("ageMax", String(form.ageMax));
      formData.append("legende", form.legende);

      if (form.typeMediaId) formData.append("typeMediaId", form.typeMediaId);
      if (form.categorieId) formData.append("categorieId", form.categorieId);
      if (ciblage.paysId) formData.append("paysId", ciblage.paysId);

      ciblage.localiteIds.forEach(i => formData.append("localiteIds", String(i)));
      ciblage.professionIds.forEach(i => formData.append("professionIds", String(i)));
      ciblage.categorieCiblageIds.forEach(i => formData.append("categorieCiblageIds", String(i)));

      if (mediaFile) formData.append("media", mediaFile);

      if (isEdit) {
        await updateCampagneApi(Number(id), formData);
        toast.success("Campagne mise à jour avec succès");
      } else {
        await createCampagneApi(formData);
      }
      navigate("/dashboard/annonceur/campagnes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la sauvegarde de la campagne");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!form.nom) { toast.error("Le nom de la campagne est obligatoire"); return; }
      if (!form.categorieId) { toast.error("Veuillez sélectionner une catégorie"); return; }
      if (!form.dateDebut) { toast.error("La date de début est obligatoire"); return; }
      if (!form.dateFin) { toast.error("La date de fin est obligatoire"); return; }
      if (!form.heureDiffusion) { toast.error("L'heure de diffusion est obligatoire"); return; }
    }
    if (step === 2) {
      if (!ciblage.paysId) { toast.error("Veuillez sélectionner un pays cible"); return; }
      if (ciblage.localiteIds.length === 0) { toast.error("Veuillez sélectionner au moins une localité"); return; }
      if (ciblage.professionIds.length === 0) { toast.error("Veuillez sélectionner au moins une profession"); return; }
      if (ciblage.categorieCiblageIds.length === 0) { toast.error("Veuillez sélectionner au moins une catégorie d'intérêt"); return; }
    }
    if (step === 3 && !isEdit) {
      if (!form.budget || Number(form.budget) < 10000) { toast.error("Le budget minimum est de 10 000 F CFA"); return; }
    }
    setError(null);
    const nextStep = (isEdit && step === 2) ? 4 : step + 1;
    if (nextStep <= 4) setStep(nextStep as Step);
  };

  const handlePrev = () => {
    const prevStep = (isEdit && step === 4) ? 2 : step - 1;
    if (prevStep >= 1) setStep(prevStep as Step);
  };

  // Filtrer les localités selon la recherche
  const filteredLocalites = referentiels?.pays
    .find(p => String(p.id) === ciblage.paysId)
    ?.localites.filter(l => l.label.toLowerCase().includes(localiteSearch.toLowerCase())) || [];

  // Filtrer les professions selon la recherche
  const filteredProfessions = referentiels?.professions.filter(
    p => p.label.toLowerCase().includes(professionSearch.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Fil d'Ariane + Bouton retour */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-2 text-sm">
          <a href="/dashboard/annonceur" className="text-gray-400 hover:text-[#4c075b] transition-colors">
            Dashboard
          </a>
          <span className="text-gray-300">/</span>
          <a href="/dashboard/annonceur/campagnes" className="text-gray-400 hover:text-[#4c075b] transition-colors">
            Campagnes
          </a>
          <span className="text-gray-300">/</span>
          <span className="text-gray-800 font-semibold">{isEdit ? "Modifier la campagne" : "Nouvelle Campagne"}</span>
        </nav>

        <button
          onClick={() => navigate("/dashboard/annonceur/campagnes")}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#4c075b] transition-colors"
        >
          <ArrowLeft size={15} />
          Retour
        </button>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between relative">
          {/* Ligne de fond entre les étapes */}
          <div className="absolute top-4 left-[40px] right-[40px] h-0.5 bg-gray-200 -translate-y-1/2" />
          {/* Ligne de progression */}
          <div
            className="absolute top-4 left-[40px] h-0.5 bg-[#c9a227] -translate-y-1/2 transition-all duration-500"
            style={{ width: `calc((100% - 80px) * ${(step - 1) / 3})` }}
          />

          {([1, 2, 3, 4] as Step[]).map((s) => (
            <div key={s} className="flex flex-col items-center z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  s === step
                    ? "bg-[#4c075b] text-white shadow-md scale-110"
                    : s < step
                    ? "bg-[#c9a227] text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {s < step ? <Check size={18} strokeWidth={3} /> : s}
              </div>
              <span
                className={`text-sm mt-1.5 font-medium whitespace-nowrap ${
                  s === step ? "text-[#4c075b]" : s < step ? "text-[#c9a227]" : "text-gray-400"
                }`}
              >
                {STEP_LABELS[s]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Contenu du formulaire */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        {step !== 3 && <p className="text-sm text-gray-500 mb-6 italic">{STEP_TITLES[step]}</p>}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-5">
            {/* Nom de la campagne */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Nom de la campagne <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ex : Promotion été 2024"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors bg-white pr-8"
                />
                {!form.nom && (
                  <AlertCircle size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Description
              </label>
              <textarea
                placeholder="Décrivez l'objectif de votre campagne..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors bg-white resize-none"
              />
            </div>

            {/* Catégorie */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <RadixSelect
                value={form.categorieId}
                onValueChange={(v) => setForm({ ...form, categorieId: v })}
                placeholder="Sélectionner une catégorie"
                options={referentiels?.categoriesCampagne.map(cat => ({ value: String(cat.id), label: cat.label })) || []}
              />
            </div>

            {/* Dates + Heure */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Date de début <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  disabled={datesLocked}
                  min={!datesLocked ? new Date().toISOString().split("T")[0] : undefined}
                  value={form.dateDebut}
                  onChange={(e) => setForm({ ...form, dateDebut: e.target.value, dateFin: form.dateFin < e.target.value ? "" : form.dateFin })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors bg-white text-gray-700 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Date de fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  disabled={datesLocked}
                  min={!datesLocked ? (form.dateDebut || new Date().toISOString().split("T")[0]) : undefined}
                  value={form.dateFin}
                  onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors bg-white text-gray-700 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Heure de diffusion <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="time"
                    required
                    disabled={datesLocked}
                    value={form.heureDiffusion}
                    onChange={(e) => setForm({ ...form, heureDiffusion: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors bg-white text-gray-700 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  />
                </div>
                {datesLocked && <p className="text-xs text-amber-500 mt-1">Campagne déjà démarrée</p>}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            {/* Ligne 1 : Pays cible + Tranche d'âge */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

              {/* Pays cible */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Pays cible <span className="text-red-500">*</span></label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setPaysOpen(!paysOpen)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-[#4c075b] transition-colors bg-white"
                  >
                    {referentiels?.pays.find(p => String(p.id) === ciblage.paysId) && (
                      <>
                        <img
                          src={`https://flagcdn.com/20x15/${referentiels.pays.find(p => String(p.id) === ciblage.paysId)?.code}.png`}
                          alt={ciblage.paysId}
                          className="w-5 h-auto rounded-sm flex-shrink-0"
                        />
                        <span className="flex-1 text-left">
                          {referentiels.pays.find(p => String(p.id) === ciblage.paysId)?.label}
                        </span>
                      </>
                    )}
                    {!ciblage.paysId && <span className="flex-1 text-left text-gray-400">Sélectionner un pays</span>}
                    <ChevronRight size={14} className={`text-gray-400 transition-transform duration-150 ${paysOpen ? "rotate-90" : ""}`} />
                  </button>
                  {paysOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                      {referentiels?.pays.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { setCiblage({ ...ciblage, paysId: String(p.id) }); setPaysOpen(false); }}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#f9f0fb] transition-colors text-left ${
                            ciblage.paysId === String(p.id) ? "bg-[#f9f0fb] text-[#4c075b] font-semibold" : "text-gray-700"
                          }`}
                        >
                          <img src={`https://flagcdn.com/20x15/${p.code}.png`} alt={p.code} className="w-5 h-auto rounded-sm flex-shrink-0" />
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tranche d'âge */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Tranche d'âge cible (optionnel)</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">De</span>
                  <input
                    type="number"
                    min={0} max={form.ageMax}
                    value={form.ageMin}
                    onChange={(e) => setForm({ ...form, ageMin: Number(e.target.value) })}
                    className="w-16 px-3 py-2 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:border-[#4c075b] bg-white"
                  />
                  <span className="text-sm text-gray-500">à</span>
                  <input
                    type="number"
                    min={form.ageMin} max={120}
                    value={form.ageMax}
                    onChange={(e) => setForm({ ...form, ageMax: Number(e.target.value) })}
                    className="w-16 px-3 py-2 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:border-[#4c075b] bg-white"
                  />
                  <span className="text-sm text-gray-500">ans</span>
                </div>
              </div>
            </div>

            {/* Ligne 2 : Localités + Professions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

              {/* Localités */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Localités cibles <span className="text-red-500">*</span></label>
                  <button
                    type="button"
                    onClick={() => selectAll("localiteIds", filteredLocalites.map(l => l.id))}
                    className="text-xs text-[#4c075b] font-medium hover:underline"
                  >
                    {ciblage.localiteIds.length === filteredLocalites.length ? "Tout désélectionner" : "Tout sélectionner"}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Rechercher une localité..."
                  value={localiteSearch}
                  onChange={(e) => setLocaliteSearch(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] mb-2 bg-white"
                />
                <div className="flex flex-wrap gap-2">
                  {filteredLocalites.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => toggleItem("localiteIds", loc.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        ciblage.localiteIds.includes(loc.id)
                          ? "bg-[#4c075b] text-white border-[#4c075b]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#4c075b]"
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Professions */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Professions cibles <span className="text-red-500">*</span></label>
                  <button
                    type="button"
                    onClick={() => selectAll("professionIds", filteredProfessions.map(p => p.id))}
                    className="text-xs text-[#4c075b] font-medium hover:underline"
                  >
                    {ciblage.professionIds.length === filteredProfessions.length ? "Tout désélectionner" : "Tout sélectionner"}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Rechercher une profession..."
                  value={professionSearch}
                  onChange={(e) => setProfessionSearch(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] mb-2 bg-white"
                />
                <div className="flex flex-wrap gap-2">
                  {filteredProfessions.map((prof) => (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() => toggleItem("professionIds", prof.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        ciblage.professionIds.includes(prof.id)
                          ? "bg-[#4c075b] text-white border-[#4c075b]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#4c075b]"
                      }`}
                    >
                      {prof.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Catégories d'intérêt */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Catégories d'intérêt <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {referentiels?.categoriesCiblage.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={ciblage.categorieCiblageIds.includes(cat.id)}
                      onChange={() => toggleItem("categorieCiblageIds", cat.id)}
                      className="w-4 h-4 accent-[#4c075b] cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-[#4c075b] transition-colors">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <p className="text-sm text-gray-500 italic mb-6">{STEP_TITLES[3]}</p>

            {/* Carte Budget total */}
            <div className="rounded-xl border border-gray-200 p-5 flex flex-col gap-3 max-w-2xl">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Budget total (F CFA) <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden focus-within:border-[#4c075b] transition-colors">
                  <input
                    type="number"
                    min={10000}
                    placeholder="Ex : 100 000"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    className="flex-1 px-4 py-2.5 text-sm focus:outline-none bg-white"
                  />
                  <span className="px-4 py-2.5 text-sm font-medium text-gray-500 bg-gray-50 border-l border-gray-200 whitespace-nowrap">
                    F CFA
                  </span>
                </div>
                {form.budget && Number(form.budget) < 10000 ? (
                  <p className="text-xs text-amber-500 mt-1.5">Le budget minimum est de 10 000 F CFA</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1.5">Minimum 10 000 F CFA | Votre solde : <span className="font-semibold text-gray-600">0 F CFA</span></p>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-5">

            {/* Type de média */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Type de média <span className="text-red-500">*</span>
              </label>
              <RadixSelect
                value={form.typeMediaId}
                onValueChange={(v) => setForm({ ...form, typeMediaId: v })}
                placeholder="Sélectionnez le type de média"
                options={referentiels?.typesMedia.map(t => ({ value: String(t.id), label: t.label })) || []}
              />
            </div>

            {/* Légende */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Légende <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Rédigez le texte qui accompagnera votre média..."
                value={form.legende}
                onChange={(e) => setForm({ ...form, legende: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors bg-white resize-none"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-400">Texte affiché sous le média sur le statut WhatsApp.</p>
                <p className="text-xs text-gray-400">{form.legende.length} caractères</p>
              </div>
            </div>

            {/* Média upload drag & drop */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Média <span className="text-red-500">*</span>
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) { setMediaFile(file); setExistingMedia(null); setMediaPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : null); }
                }}
                className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 transition-colors border-gray-200 bg-gray-50 hover:border-[#4c075b]"
              >
                {mediaPreview ? (
                  <img src={mediaPreview} alt="Preview" className="max-h-40 rounded-lg" />
                ) : mediaFile ? (
                  <FileText size={36} className="text-gray-300" />
                ) : existingMedia && existingMedia.mimetype.startsWith("image/") ? (
                  <img src={`${BASE_BACKEND}/${existingMedia.path}`} alt="Média existant" className="max-h-40 rounded-lg" />
                ) : existingMedia ? (
                  <FileText size={36} className="text-gray-300" />
                ) : (
                  <Upload size={36} className="text-gray-300" />
                )}
                <p className="text-sm text-gray-500 text-center">
                  {mediaFile ? mediaFile.name : existingMedia ? "Média existant — glissez-déposez ou choisissez un nouveau fichier pour le remplacer" : "Glissez-déposez vos fichiers ici (Images, vidéos selon le type choisi)"}
                </p>
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-[#4c075b] hover:text-[#4c075b] transition-colors bg-white cursor-pointer">
                  <FolderOpen size={14} /> {existingMedia ? "Changer le fichier" : "Parcourir"}
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaChange} />
                </label>
                {(mediaFile || existingMedia) && (
                  <button type="button" onClick={handleRemoveMedia} className="text-xs text-red-500 hover:underline">
                    Supprimer
                  </button>
                )}
              </div>
            </div>

            {/* Résumé */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Résumé de la campagne</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Nom :</span><p className="font-medium text-gray-800">{form.nom || "-"}</p></div>
                <div><span className="text-gray-500">Budget :</span><p className="font-medium text-gray-800">{form.budget ? `${Number(form.budget).toLocaleString()} F CFA` : "-"}</p></div>
                <div><span className="text-gray-500">Dates :</span><p className="font-medium text-gray-800 flex items-center gap-1">{form.dateDebut && form.dateFin ? <>{form.dateDebut} <ArrowRight size={13} className="text-gray-400" /> {form.dateFin}</> : "-"}</p></div>
                <div><span className="text-gray-500">Média :</span><p className="font-medium text-gray-800">{mediaFile ? mediaFile.name : "Non uploadé"}</p></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Boutons de navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={step === 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={15} />
          Précédent
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4c075b] text-white text-sm font-semibold hover:-translate-y-0.5 transition-all duration-150 shadow-sm"
          >
            Suivant
            <ChevronRight size={15} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || (!mediaFile && !existingMedia)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4c075b] text-white text-sm font-semibold hover:-translate-y-0.5 transition-all duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Sauvegarde..." : isEdit ? "Enregistrer les modifications" : "Créer la campagne"}
            <ChevronRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}