import { useState, useCallback } from "react";
import { Link } from "react-router";
import logo from "../assets/logo.png";
import PasswordInput from "../app/components/PasswordInput";
import { GoogleLogin } from "@react-oauth/google";
import { loginApi, googleAuthApi } from "../lib/api";
import { useNavigate } from "react-router";
import { Hand, ChevronDown } from "lucide-react";
import * as Select from "@radix-ui/react-select";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", profil: "" });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleGoogleLogin = useCallback(async (credentialResponse: any) => {
    try {
      const data = await googleAuthApi(credentialResponse.credential, form.profil || undefined);
      if (data.mustChangePassword && data.tempPassword) {
        sessionStorage.setItem("mustChangePassword", "true");
        sessionStorage.setItem("tempPassword", data.tempPassword);
      }
      navigate(data.role === "annonceur" ? "/dashboard/annonceur" : "/dashboard/diffuseur");
    } catch (e: any) { setError(e.message); }
  }, [form.profil, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginApi(form.email, form.password, form.profil);
      navigate(data.role === "annonceur" ? "/dashboard/annonceur" : "/dashboard/diffuseur");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

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
            Bon retour <Hand size={22} className="inline-block ml-1 text-[#c9a227]" />
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mb-5">Connecte-toi à ton compte StatutPay.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm text-center font-medium px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Profil</label>
              <Select.Root value={form.profil} onValueChange={(v) => setForm({ ...form, profil: v })}>
                <Select.Trigger className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#4c075b] transition-colors bg-white data-[placeholder]:text-gray-400">
                  <Select.Value placeholder="Indiquez votre profil" />
                  <Select.Icon><ChevronDown size={16} className="text-gray-400" /></Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)] bg-white rounded-lg border border-gray-200 shadow-md z-50 overflow-hidden">
                    <Select.Viewport>
                      {["annonceur", "diffuseur"].map((v) => (
                        <Select.Item key={v} value={v} className="px-4 py-2.5 text-sm text-gray-700 capitalize cursor-pointer hover:bg-[#f9f0fb] hover:text-[#4c075b] focus:outline-none focus:bg-[#f9f0fb] focus:text-[#4c075b]">
                          <Select.ItemText>{v.charAt(0).toUpperCase() + v.slice(1)}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <input
                type="email"
                required
                placeholder="ton@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Mot de passe</label>
              <PasswordInput
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="font-playfair italic text-sm text-[#4c075b] hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-[#4c075b] text-white font-semibold text-sm hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-60"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">ou</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className={`transition-opacity ${!form.profil ? "opacity-40 pointer-events-none" : ""}`}>
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => setError("Erreur de connexion Google")}
              text="signin_with"
              width={400}
            />
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{" "}
            <Link to="/register" className="text-[#4c075b] font-semibold hover:underline">
              Créer un compte
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
