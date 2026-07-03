import { useState } from "react";
import logo from "../assets/logo.png";
import { X, Copy, Check } from "lucide-react";

export default function Dashboard() {
  const mustChange = localStorage.getItem("mustChangePassword") === "true";
  const tempPassword = localStorage.getItem("tempPassword") ?? "";
  const [show, setShow] = useState(mustChange);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.removeItem("mustChangePassword");
    localStorage.removeItem("tempPassword");
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
        <button
          onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}
          className="text-sm text-gray-500 hover:text-[#4c075b] transition-colors"
        >
          Se déconnecter
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Dashboard en construction...</p>
      </main>
    </div>
  );
}
