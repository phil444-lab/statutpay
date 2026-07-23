import { useUser } from "./UserContext";
import { AlertTriangle, Phone, IdCard, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router";

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const navigate = useNavigate();

  // Si les infos ne sont pas encore chargées, on affiche le contenu normal
  if (!user) return <>{children}</>;

  const manqueTelephone = !user.telephone;
  const manquePieceIdentite = !user.pieceIdentitePath;
  const estBloque = manqueTelephone || manquePieceIdentite;

  // Si tout est ok, on affiche le contenu normal
  if (!estBloque) return <>{children}</>;

  const etapes = [
    {
      id: "telephone",
      label: "Ajouter un numéro de téléphone",
      description: "Requis pour les retraits Mobile Money et la validation de votre compte",
      fait: !manqueTelephone,
      icon: <Phone size={20} />,
    },
    {
      id: "pieceIdentite",
      label: "Télécharger une pièce d'identité",
      description: "Requis pour la vérification de votre identité (Carte d'identité, Passeport ou Permis)",
      fait: !manquePieceIdentite,
      icon: <IdCard size={20} />,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12">
      {/* Icône d'alerte */}
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
        <AlertTriangle size={32} className="text-amber-600" />
      </div>

      {/* Titre */}
      <h1 className="text-2xl font-black text-gray-900 font-playfair italic text-center mb-2">
        Profil incomplet
      </h1>
      <p className="text-gray-500 text-sm text-center max-w-md mb-8">
        Pour accéder à l'ensemble des fonctionnalités du tableau de bord, vous devez d'abord compléter les informations ci-dessous dans vos <strong>paramètres</strong>.
      </p>

      {/* Liste des étapes */}
      <div className="w-full max-w-lg flex flex-col gap-4 mb-8">
        {etapes.map((etape) => (
          <div
            key={etape.id}
            className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${
              etape.fait
                ? "bg-green-50 border-green-200"
                : "bg-white border-gray-200 shadow-sm"
            }`}
          >
            {/* Icône */}
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                etape.fait
                  ? "bg-green-100 text-green-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {etape.fait ? <CheckCircle2 size={22} /> : etape.icon}
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${etape.fait ? "text-green-700" : "text-gray-800"}`}>
                {etape.label}
                {etape.fait && (
                  <span className="ml-2 text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                    Fait
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">{etape.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bouton vers paramètres */}
      <button
        onClick={() => navigate("/dashboard/annonceur/parametres")}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#4c075b] to-[#6b1d7a] text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
      >
        Compléter mes informations
        <ArrowRight size={16} />
      </button>

      <p className="text-xs text-gray-400 mt-4 text-center max-w-xs">
        Une fois ces étapes complétées, vous aurez accès à toutes les fonctionnalités du tableau de bord.
      </p>
    </div>
  );
}