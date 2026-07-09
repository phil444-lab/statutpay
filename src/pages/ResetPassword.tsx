import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import logo from "../assets/logo.png";
import PasswordInput from "../app/components/PasswordInput";
import { ShieldX } from "lucide-react";
import { resetPasswordApi, verifyResetTokenApi } from "../lib/api";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) { setTokenValid(false); return; }
    verifyResetTokenApi(token).then(({ valid }) => setTokenValid(valid));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!PASSWORD_REGEX.test(password)) {
      setError("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      await resetPasswordApi(token, password);
      navigate("/login", { state: { resetSuccess: true } });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === null) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Vérification du lien...
    </div>
  );

  if (!tokenValid) return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ backgroundImage: "url('/5930878.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0 bg-[#4c075b]/60 backdrop-blur-sm" />
      <div className="relative z-10 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
        <p className="text-red-500 font-bold text-lg mb-2">Lien invalide ou expiré</p>
        <p className="text-gray-500 text-sm mb-5">Ce lien de réinitialisation a déjà été utilisé ou a expiré.</p>
        <div className="flex justify-center mb-5">
          <ShieldX className="w-20 h-20 text-red-500" strokeWidth={1.5} />
        </div>
        <button onClick={() => navigate("/forgot-password")} className="py-2 px-6 rounded-lg bg-[#4c075b] text-white text-sm font-semibold">
          Demander un nouveau lien
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ backgroundImage: "url('/5930878.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0 bg-[#4c075b]/60 backdrop-blur-sm" />
      <div className="w-full max-w-md relative z-10 py-8">

        <div className="flex items-center justify-center gap-2 mb-6">
          <img src={logo} alt="StatutPay" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-bold font-playfair italic text-xl text-white">
            Statut<span className="text-[#c9a227]">Pay</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-black text-[#4c075b] font-playfair italic mb-1">
            Nouveau mot de passe
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mb-5">
            Choisis un nouveau mot de passe sécurisé.
          </p>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Nouveau mot de passe</label>
              <PasswordInput
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                showStrength
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Confirmer le mot de passe</label>
              <PasswordInput
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {confirm && password !== confirm && (
                <p className="text-red-400 text-xs mt-1">Les mots de passe ne correspondent pas.</p>
              )}
              {confirm && password === confirm && (
                <p className="text-green-500 text-xs mt-1">Les mots de passe correspondent ✓</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-[#4c075b] text-white font-semibold text-sm hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-60"
            >
              {loading ? "Enregistrement..." : "Réinitialiser le mot de passe"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
