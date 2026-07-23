import { useState } from "react";
import { useNavigate } from "react-router";
import logo from "../assets/logo.png";
import { X, Copy, Check } from "lucide-react";
import { logoutApi } from "../lib/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const mustChange = sessionStorage.getItem("mustChangePassword") === "true";
  const tempPassword = sessionStorage.getItem("tempPassword") ?? "";
  const [show, setShow] = useState(mustChange);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.removeItem("mustChangePassword");
    sessionStorage.removeItem("tempPassword");
  };

  const handleLogout = async () => {
    await logoutApi();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="StatutPay" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-bold font-playfair italic text-xl text-[#4c075b]">
            Statut<span className="text-[#c9a227]">Pay</span>
          </span>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-[#4c075b] transition-colors">
          Se déconnecter
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start pt-10 px-4">
        {show && (
          <div className="w-full max-w-xl bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6 relative">
            <button onClick={handleDismiss} className="absolute top-3 right-3 text-amber-400 hover:text-amber-600">
              <X size={16} />
            </button>
            <p className="text-sm font-semibold text-amber-800 mb-1">🔐 Modifie ton mot de passe</p>
            <p className="text-xs text-amber-700 mb-3">
              Un mot de passe temporaire a été généré pour ton compte. Pense à le modifier dès que possible.
            </p>
            <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2">
              <code className="flex-1 text-sm text-gray-800 font-mono">{tempPassword}</code>
              <button onClick={handleCopy} className="text-amber-500 hover:text-amber-700 transition-colors">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}
        <p className="text-gray-400 text-sm">Dashboard en construction...</p>
      </main>
    </div>
  );
}
