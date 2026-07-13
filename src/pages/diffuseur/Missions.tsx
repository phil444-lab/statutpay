import { Search } from "lucide-react";

export default function Missions() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <Search size={36} className="text-[#c9a227]" />
      <p className="font-bold text-gray-800">Aucune mission disponible</p>
      <p className="text-sm text-gray-500">Les missions disponibles apparaîtront ici. Reviens bientôt !</p>
    </div>
  );
}
