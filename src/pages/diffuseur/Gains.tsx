import { HandCoins } from "lucide-react";

export default function Gains() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <HandCoins size={36} className="text-[#c9a227]" />
      <p className="font-bold text-gray-800">Aucun gain pour l'instant</p>
      <p className="text-sm text-gray-500">Complète des missions pour commencer à accumuler des gains.</p>
    </div>
  );
}
