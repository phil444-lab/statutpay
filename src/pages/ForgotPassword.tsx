import { useState } from "react";
import { Link } from "react-router";
import logo from "../assets/logo.png";
import { forgotPasswordApi } from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await forgotPasswordApi(email);
      setMessage(data.message);
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
            Mot de passe oublié ?
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mb-5">
            Saisis ton adresse email, on t'envoie un lien de réinitialisation.
          </p>

          {message ? (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
              {message}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                <input
                  type="email"
                  required
                  placeholder="ton@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-[#4c075b] text-white font-semibold text-sm hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-60"
              >
                {loading ? "Envoi..." : "Envoyer le lien"}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link to="/login" className="text-[#4c075b] font-semibold hover:underline">
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
