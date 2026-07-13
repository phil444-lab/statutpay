import { Trophy } from "lucide-react";

export default function Classement() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <Trophy size={36} className="text-[#c9a227]" />
      <p className="font-bold text-gray-800">Classement indisponible</p>
      <p className="text-sm text-gray-500">Le classement des diffuseurs sera affiché ici.</p>
    </div>
  );
}
