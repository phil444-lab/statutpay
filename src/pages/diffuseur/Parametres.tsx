import { Settings } from "lucide-react";

export default function Parametres() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <Settings size={36} className="text-[#c9a227]" />
      <p className="font-bold text-gray-800">Paramètres</p>
      <p className="text-sm text-gray-500">La configuration de ton compte sera disponible ici.</p>
    </div>
  );
}
