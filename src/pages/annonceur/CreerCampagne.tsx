import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ChevronRight, ChevronLeft, Clock, AlertCircle, Megaphone, Target, Check, UploadCloud, FolderOpen } from "lucide-react";
import * as Select from "@radix-ui/react-select";

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
  4: "Contenu — Créez le contenu qui sera diffusé sur les statuts WhatsApp",
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
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({
    nom: "",
    description: "",
    type: "notoriete",
    dateDebut: "",
    dateFin: "",
    heure: "08:00",
  });

  const PAYS_OPTIONS = [
    { value: "bj", label: "Bénin" },
    { value: "sn", label: "Sénégal" },
    { value: "ci", label: "Côte d'Ivoire" },
    { value: "ml", label: "Mali" },
    { value: "bf", label: "Burkina Faso" },
    { value: "tg", label: "Togo" },
    { value: "ne", label: "Niger" },
    { value: "cm", label: "Cameroun" },
  ];
  const [paysOpen, setPaysOpen] = useState(false);

  const LOCALITES = ["Cotonou", "Porto-Novo", "Parakou", "Abomey-Calavi", "Bohicon", "Natitingou", "Ouidah", "Lokossa", "Djougou", "Kandi"];
  const PROFESSIONS = ["Agriculteur", "Commerçant", "Enseignant", "Médecin", "Ingénieur", "Artisan", "Fonctionnaire", "Étudiant", "Entrepreneur", "Journaliste"];
  const CATEGORIES = ["Actualité", "Agriculture", "Alimentation", "Automobile", "Beauté", "Culture", "Éducation", "Emploi", "Environnement", "Finance", "Immobilier", "Informatique", "Loisirs", "Mode", "Musique", "Religion", "Santé", "Sport", "Technologie", "Tourisme", "Voyage"];

  const [ciblage, setCiblage] = useState({
    pays: "bj",
    localites: [] as string[],
    professions: [] as string[],
    ageMin: 18,
    ageMax: 99,
    categories: [] as string[],
  });
  const [localiteSearch, setLocaliteSearch] = useState("");
  const [professionSearch, setProfessionSearch] = useState("");
  const [contenu, setContenu] = useState({ typeMedia: "", legende: "", fichier: null as File | null });
  const [dragOver, setDragOver] = useState(false);

  const MEDIA_OPTIONS = [
    { value: "image", label: "Image" },
    { value: "video", label: "Vidéo" },
    { value: "image_texte", label: "Image + Texte" },
  ];

  const toggleItem = (key: "localites" | "professions" | "categories", val: string) =>
    setCiblage((prev) => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key].filter((v) => v !== val) : [...prev[key], val],
    }));

  const selectAll = (key: "localites" | "professions", list: string[]) =>
    setCiblage((prev) => ({ ...prev, [key]: prev[key].length === list.length ? [] : list }));

  const handleNext = () => {
    if (step < 4) setStep((step + 1) as Step);
  };

  const handlePrev = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const progressPercent = ((step - 1) / 3) * 100;

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
          <span className="text-gray-800 font-semibold">Nouvelle</span>
        </nav>

        <button
          onClick={() => navigate("/dashboard/annonceur/campagnes")}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#4c075b] transition-colors"
        >
          <ArrowLeft size={15} />
          Retour
        </button>
      </div>

      {/* Titre */}
      <h1 className="text-xl font-black text-gray-900 font-playfair italic">Nouvelle Campagne</h1>

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

            {/* Date Range Picker */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Date de début <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.dateDebut}
                  onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors bg-white text-gray-700"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Date de fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.dateFin}
                  onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors bg-white text-gray-700"
                />
              </div>
            </div>

            {/* Heure de diffusion */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Heure de diffusion <span className="text-red-500">*</span>
              </label>
              <div className="relative max-w-[200px]">
                <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="time"
                  required
                  value={form.heure}
                  onChange={(e) => setForm({ ...form, heure: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors bg-white text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">

            {/* Pays + Localités + Professions — 3 colonnes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">

              {/* Pays cible + Tranche d'âge */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Pays cible</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPaysOpen(!paysOpen)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-[#4c075b] transition-colors bg-white"
                    >
                      <img src={`https://flagcdn.com/20x15/${ciblage.pays}.png`} alt={ciblage.pays} className="w-5 h-auto rounded-sm flex-shrink-0" />
                      <span className="flex-1 text-left">{PAYS_OPTIONS.find((p) => p.value === ciblage.pays)?.label}</span>
                      <ChevronRight size={14} className={`text-gray-400 transition-transform duration-150 ${paysOpen ? "rotate-90" : ""}`} />
                    </button>
                    {paysOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                        {PAYS_OPTIONS.map((p) => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => { setCiblage({ ...ciblage, pays: p.value }); setPaysOpen(false); }}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#f9f0fb] transition-colors text-left ${
                              ciblage.pays === p.value ? "bg-[#f9f0fb] text-[#4c075b] font-semibold" : "text-gray-700"
                            }`}
                          >
                            <img src={`https://flagcdn.com/20x15/${p.value}.png`} alt={p.value} className="w-5 h-auto rounded-sm flex-shrink-0" />
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
                      min={0} max={ciblage.ageMax}
                      value={ciblage.ageMin}
                      onChange={(e) => setCiblage({ ...ciblage, ageMin: Number(e.target.value) })}
                      className="w-16 px-3 py-2 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:border-[#4c075b] bg-white"
                    />
                    <span className="text-sm text-gray-500">à</span>
                    <input
                      type="number"
                      min={ciblage.ageMin} max={120}
                      value={ciblage.ageMax}
                      onChange={(e) => setCiblage({ ...ciblage, ageMax: Number(e.target.value) })}
                      className="w-16 px-3 py-2 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:border-[#4c075b] bg-white"
                    />
                    <span className="text-sm text-gray-500">ans</span>
                  </div>
                </div>
              </div>

              {/* Localités */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Localités cibles <span className="text-red-500">*</span></label>
                  <button type="button" onClick={() => selectAll("localites", LOCALITES)} className="text-xs text-[#4c075b] font-medium hover:underline">
                    {ciblage.localites.length === LOCALITES.length ? "Tout désélectionner" : "Tout sélectionner"}
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
                  {LOCALITES.filter((l) => l.toLowerCase().includes(localiteSearch.toLowerCase())).map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => toggleItem("localites", loc)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        ciblage.localites.includes(loc)
                          ? "bg-[#4c075b] text-white border-[#4c075b]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#4c075b]"
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Professions */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Professions cibles <span className="text-red-500">*</span></label>
                  <button type="button" onClick={() => selectAll("professions", PROFESSIONS)} className="text-xs text-[#4c075b] font-medium hover:underline">
                    {ciblage.professions.length === PROFESSIONS.length ? "Tout désélectionner" : "Tout sélectionner"}
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
                  {PROFESSIONS.filter((p) => p.toLowerCase().includes(professionSearch.toLowerCase())).map((prof) => (
                    <button
                      key={prof}
                      type="button"
                      onClick={() => toggleItem("professions", prof)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        ciblage.professions.includes(prof)
                          ? "bg-[#4c075b] text-white border-[#4c075b]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#4c075b]"
                      }`}
                    >
                      {prof}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Catégories d'intérêt */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Catégories</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={ciblage.categories.includes(cat)}
                      onChange={() => toggleItem("categories", cat)}
                      className="w-4 h-4 accent-[#4c075b] cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-[#4c075b] transition-colors">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">

            <p className="text-sm text-gray-500 italic">{STEP_TITLES[3]}</p>

            {/* Carte Budget total */}
            <div className="rounded-xl border border-gray-200 p-5 flex flex-col gap-3 max-w-2xl">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Budget total (F CFA) <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden focus-within:border-[#4c075b] transition-colors">
                  <input
                    type="number"
                    min={50000}
                    placeholder="Ex : 100 000"
                    className="flex-1 px-4 py-2.5 text-sm focus:outline-none bg-white"
                  />
                  <span className="px-4 py-2.5 text-sm font-medium text-gray-500 bg-gray-50 border-l border-gray-200 whitespace-nowrap">
                    F CFA
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Minimum 10000 F CFA | Votre solde : <span className="font-semibold text-gray-600">0 F CFA</span>
                </p>
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
                value={contenu.typeMedia}
                onValueChange={(v) => setContenu({ ...contenu, typeMedia: v })}
                placeholder="Sélectionnez le type de média"
                options={MEDIA_OPTIONS}
              />
            </div>

            {/* Légende */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Légende <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Rédigez le texte qui accompagnera votre média..."
                value={contenu.legende}
                onChange={(e) => setContenu({ ...contenu, legende: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors bg-white resize-none"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-400">Texte affiché sous le média sur le statut WhatsApp.</p>
                <p className="text-xs text-gray-400">{contenu.legende.length} caractères</p>
              </div>
            </div>

            {/* Média upload */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Média <span className="text-red-500">*</span>
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) setContenu({ ...contenu, fichier: file });
                }}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 transition-colors ${
                  dragOver ? "border-[#4c075b] bg-[#f9f0fb]" : "border-gray-200 bg-gray-50"
                }`}
              >
                <UploadCloud size={36} className={dragOver ? "text-[#4c075b]" : "text-gray-300"} />
                <p className="text-sm text-gray-500 text-center">
                  {contenu.fichier
                    ? contenu.fichier.name
                    : "Glissez-déposez vos fichiers ici (Images, vidéos selon le type choisi)"}
                </p>
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-[#4c075b] hover:text-[#4c075b] transition-colors bg-white cursor-pointer">
                  <FolderOpen size={18} /> Parcourir
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setContenu({ ...contenu, fichier: file });
                    }}
                  />
                </label>
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

        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4c075b] text-white text-sm font-semibold hover:-translate-y-0.5 transition-all duration-150 shadow-sm"
        >
          {step === 4 ? "Terminer" : "Suivant"}
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}