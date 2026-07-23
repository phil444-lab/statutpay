import { useState } from "react";
import { Link } from "react-router";
import logo from "../assets/logo.png";
import { HandCoins, Megaphone, Upload } from "lucide-react";
import PasswordInput from "../app/components/PasswordInput";
import PhoneInput from "../app/components/PhoneInput";
import { GoogleLogin } from "@react-oauth/google";
import { registerApi, googleAuthApi } from "../lib/api";
import { useNavigate } from "react-router";

type Role = "diffuseur" | "annonceur" | "";

interface DiffuseurForm {
  nom: string;
  prenoms: string;
  telephone: string;
  email: string;
  pieceIdentite: File | null;
  password: string;
  confirmPassword: string;
}

interface AnnonceurForm {
  nomEntreprise: string;
  nom: string;
  prenoms: string;
  telephone: string;
  email: string;
  pieceIdentite: File | null;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const [role, setRole] = useState<Role>("");
  const [loading, setLoading] = useState(false);

  const [diffuseur, setDiffuseur] = useState<DiffuseurForm>({
    nom: "", prenoms: "", telephone: "", email: "",
    pieceIdentite: null, password: "", confirmPassword: "",
  });

  const [annonceur, setAnnonceur] = useState<AnnonceurForm>({
    nomEntreprise: "", nom: "", prenoms: "",
    telephone: "", email: "", pieceIdentite: null, password: "", confirmPassword: "",
  });

  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [cguAccepted, setCguAccepted] = useState(false);

  const googleRegister = async (credentialResponse: any) => {
    try {
      const data = await googleAuthApi(credentialResponse.credential, role);
      if (data.mustChangePassword && data.tempPassword) {
        sessionStorage.setItem("mustChangePassword", "true");
        sessionStorage.setItem("tempPassword", data.tempPassword);
      }
      const dashboardPath = role === "annonceur" ? "/dashboard/annonceur" : "/dashboard/diffuseur";
      navigate(dashboardPath);
    } catch (e: any) { setError(e.message); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    const pwd = role === "diffuseur" ? diffuseur.password : annonceur.password;
    const confirm = role === "diffuseur" ? diffuseur.confirmPassword : annonceur.confirmPassword;
    if (pwd !== confirm) return setError("Les mots de passe ne correspondent pas.");
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      if (role === "diffuseur") {
        fd.append("nom", diffuseur.nom);
        fd.append("prenoms", diffuseur.prenoms);
        fd.append("telephone", diffuseur.telephone);
        fd.append("email", diffuseur.email);
        fd.append("password", diffuseur.password);
        if (diffuseur.pieceIdentite) fd.append("pieceIdentite", diffuseur.pieceIdentite);
      } else {
        fd.append("nom", annonceur.nom);
        fd.append("prenoms", annonceur.prenoms);
        fd.append("telephone", annonceur.telephone);
        fd.append("email", annonceur.email);
        fd.append("password", annonceur.password);
        fd.append("nomEntreprise", annonceur.nomEntreprise);
        if (annonceur.pieceIdentite) fd.append("pieceIdentite", annonceur.pieceIdentite);
      }
      fd.append("role", role);
      await registerApi(fd);
      const dashboardPath = role === "annonceur" ? "/dashboard/annonceur" : "/dashboard/diffuseur";
      navigate(dashboardPath);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors";
  const labelClass = "text-sm font-medium text-gray-700 mb-1 block";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 relative"
      style={{ backgroundImage: "url('/5930878.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-[#4c075b]/60 backdrop-blur-sm" />
      <div className="w-full max-w-md relative z-10">

        <div className="flex items-center justify-center gap-2 mb-6">
          <img src={logo} alt="StatutPay" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-bold font-playfair italic text-xl text-white">
            Statut<span className="text-[#c9a227]">Pay</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-black text-[#4c075b] font-playfair italic mb-1">
            Créer un compte
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mb-5">Rejoins des milliers d'utilisateurs StatutPay.</p>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          {/* Choix du rôle */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5">
            {([
              { value: "diffuseur", label: "Diffuseur", sub: "Je veux gagner", icon: <HandCoins size={20} /> },
              { value: "annonceur", label: "Annonceur", sub: "Je veux faire de la pub", icon: <Megaphone size={20} /> },
            ] as const).map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`flex flex-col items-center gap-1 p-2 sm:p-3 rounded-xl border-2 text-xs sm:text-sm font-semibold transition-all duration-150 ${
                  role === r.value
                    ? "border-[#4c075b] bg-[#f9f0fb] text-[#4c075b]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {r.icon}
                <span>{r.label}</span>
                <span className="text-xs font-normal text-gray-400">{r.sub}</span>
              </button>
            ))}
          </div>

          {/* Formulaire Diffuseur */}
          {role === "diffuseur" && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Nom</label>
                  <input type="text" required placeholder="Doe" value={diffuseur.nom}
                    onChange={(e) => setDiffuseur({ ...diffuseur, nom: e.target.value })}
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Prénoms</label>
                  <input type="text" required placeholder="John" value={diffuseur.prenoms}
                    onChange={(e) => setDiffuseur({ ...diffuseur, prenoms: e.target.value })}
                    className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Numéro de téléphone</label>
                <PhoneInput required value={diffuseur.telephone}
                  onChange={(v) => setDiffuseur({ ...diffuseur, telephone: v })} />
              </div>

              <div>
                <label className={labelClass}>Adresse email</label>
                <input type="email" required placeholder="ton@email.com" value={diffuseur.email}
                  onChange={(e) => setDiffuseur({ ...diffuseur, email: e.target.value })}
                  className={inputClass} />
                {diffuseur.email.length > 0 && !EMAIL_REGEX.test(diffuseur.email) && (
                  <p className="text-xs mt-1 text-red-400">○ Adresse email invalide</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Pièce d'identité</label>
                <label className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm cursor-pointer hover:border-[#4c075b] transition-colors">
                  <span className="text-gray-500 truncate">
                    {diffuseur.pieceIdentite ? diffuseur.pieceIdentite.name : "Choisir un fichier..."}
                  </span>
                  <Upload size={16} className="text-gray-400 flex-shrink-0" />
                  <input type="file" required accept="image/*,.pdf" className="hidden"
                    onChange={(e) => setDiffuseur({ ...diffuseur, pieceIdentite: e.target.files?.[0] ?? null })} />
                </label>
              </div>

              <div>
                <label className={labelClass}>Mot de passe</label>
                <PasswordInput required showStrength value={diffuseur.password}
                  onChange={(e) => setDiffuseur({ ...diffuseur, password: e.target.value })} />
              </div>

              <div>
                <label className={labelClass}>Confirmer le mot de passe</label>
                <PasswordInput required value={diffuseur.confirmPassword}
                  onChange={(e) => setDiffuseur({ ...diffuseur, confirmPassword: e.target.value })} />
                {diffuseur.confirmPassword.length > 0 && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${diffuseur.password === diffuseur.confirmPassword ? "text-green-500" : "text-red-400"}`}>
                    {diffuseur.password === diffuseur.confirmPassword ? "✓ Les mots de passe correspondent" : "○ Les mots de passe ne correspondent pas"}
                  </p>
                )}
              </div>

              {/* CGU */}
              <div className="flex items-start gap-2 mt-2">
                <input
                  type="checkbox"
                  id="cgu-diffuseur"
                  checked={cguAccepted}
                  onChange={(e) => setCguAccepted(e.target.checked)}
                  className="mt-0.5 accent-[#4c075b] cursor-pointer"
                />
                <label htmlFor="cgu-diffuseur" className="text-sm text-gray-600 cursor-pointer">
                  J'ai lu et j'accepte les{" "}
                  <a href="/cgu" target="_blank" rel="noopener noreferrer" className="text-[#4c075b] font-semibold hover:underline">
                    Conditions générales
                  </a>.
                </label>
              </div>

              <button type="submit" disabled={loading || !cguAccepted}
                className="w-full py-3 rounded-lg bg-[#4c075b] text-white font-semibold text-sm hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-60 mt-2">
                {loading ? "Création..." : "Créer mon compte"}
              </button>
            </form>
          )}

          {/* Formulaire Annonceur */}
          {role === "annonceur" && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
              <div>
                <label className={labelClass}>
                  Nom de l'entreprise <span className="text-gray-400 font-normal">(facultatif)</span>
                </label>
                <input type="text" placeholder="Ex: MonEntreprise SARL" value={annonceur.nomEntreprise}
                  onChange={(e) => setAnnonceur({ ...annonceur, nomEntreprise: e.target.value })}
                  className={inputClass} />
              </div>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide -mb-1">
                Responsable de la structure
              </p>

              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Nom</label>
                  <input type="text" required placeholder="Doe" value={annonceur.nom}
                    onChange={(e) => setAnnonceur({ ...annonceur, nom: e.target.value })}
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Prénoms</label>
                  <input type="text" required placeholder="John" value={annonceur.prenoms}
                    onChange={(e) => setAnnonceur({ ...annonceur, prenoms: e.target.value })}
                    className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Numéro de téléphone</label>
                <PhoneInput required value={annonceur.telephone}
                  onChange={(v) => setAnnonceur({ ...annonceur, telephone: v })} />
              </div>

              <div>
                <label className={labelClass}>Adresse email</label>
                <input type="email" required placeholder="ton@email.com" value={annonceur.email}
                  onChange={(e) => setAnnonceur({ ...annonceur, email: e.target.value })}
                  className={inputClass} />
                {annonceur.email.length > 0 && !EMAIL_REGEX.test(annonceur.email) && (
                  <p className="text-xs mt-1 text-red-400">○ Adresse email invalide</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Pièce d'identité</label>
                <label className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm cursor-pointer hover:border-[#4c075b] transition-colors">
                  <span className="text-gray-500 truncate">
                    {annonceur.pieceIdentite ? annonceur.pieceIdentite.name : "Choisir un fichier..."}
                  </span>
                  <Upload size={16} className="text-gray-400 flex-shrink-0" />
                  <input type="file" required accept="image/*,.pdf" className="hidden"
                    onChange={(e) => setAnnonceur({ ...annonceur, pieceIdentite: e.target.files?.[0] ?? null })} />
                </label>
              </div>

              <div>
                <label className={labelClass}>Mot de passe</label>
                <PasswordInput required showStrength value={annonceur.password}
                  onChange={(e) => setAnnonceur({ ...annonceur, password: e.target.value })} />
              </div>

              <div>
                <label className={labelClass}>Confirmer le mot de passe</label>
                <PasswordInput required value={annonceur.confirmPassword}
                  onChange={(e) => setAnnonceur({ ...annonceur, confirmPassword: e.target.value })} />
                {annonceur.confirmPassword.length > 0 && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${annonceur.password === annonceur.confirmPassword ? "text-green-500" : "text-red-400"}`}>
                    {annonceur.password === annonceur.confirmPassword ? "✓ Les mots de passe correspondent" : "○ Les mots de passe ne correspondent pas"}
                  </p>
                )}
              </div>

              {/* CGU */}
              <div className="flex items-start gap-2 mt-2">
                <input
                  type="checkbox"
                  id="cgu-annonceur"
                  checked={cguAccepted}
                  onChange={(e) => setCguAccepted(e.target.checked)}
                  className="mt-0.5 accent-[#4c075b] cursor-pointer"
                />
                <label htmlFor="cgu-annonceur" className="text-sm text-gray-600 cursor-pointer">
                  J'ai lu et j'accepte les{" "}
                  <a href="/cgu" target="_blank" rel="noopener noreferrer" className="text-[#4c075b] font-semibold hover:underline">
                    Conditions générales
                  </a>.
                </label>
              </div>

              <button type="submit" disabled={loading || !cguAccepted}
                className="w-full py-3 rounded-lg bg-[#4c075b] text-white font-semibold text-sm hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-60 mt-2">
                {loading ? "Création..." : "Créer mon compte"}
              </button>
            </form>
          )}

          {/* Google — visible si un rôle est sélectionné */}
          {role && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className={`transition-opacity ${!cguAccepted ? "opacity-40 pointer-events-none" : ""}`}>
                <GoogleLogin
                  onSuccess={googleRegister}
                  onError={() => setError("Erreur de connexion Google")}
                  text="signup_with"
                  width={400}
                />
              </div>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{" "}
            <Link to="/login" className="text-[#4c075b] font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>

        <p className="text-center text-md text-gray-400 mt-6">
          <Link to="/" className="inline-block text-gray-200 animate-pulse hover:text-white hover:underline transition-colors duration-200">
            Retour à l'accueil
          </Link>
        </p>
      </div>
    </div>
  );
}
