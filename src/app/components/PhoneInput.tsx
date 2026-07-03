import { useState } from "react";
import { ChevronDown } from "lucide-react";

const COUNTRIES = [
  { code: "+229", iso: "bj", name: "Bénin" },
  { code: "+228", iso: "tg", name: "Togo" },
  { code: "+225", iso: "ci", name: "Côte d'Ivoire" },
  { code: "+221", iso: "sn", name: "Sénégal" },
  { code: "+226", iso: "bf", name: "Burkina Faso" },
  { code: "+223", iso: "ml", name: "Mali" },
  { code: "+227", iso: "ne", name: "Niger" },
  { code: "+237", iso: "cm", name: "Cameroun" },
  { code: "+33",  iso: "fr", name: "France" },
  { code: "+1",   iso: "us", name: "États-Unis" },
];

function Flag({ iso }: { iso: string }) {
  return (
    <img
      src={`https://flagcdn.com/20x15/${iso}.png`}
      alt={iso}
      className="w-5 h-auto rounded-sm flex-shrink-0"
    />
  );
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function PhoneInput({ value, onChange, required }: PhoneInputProps) {
  const [selected, setSelected] = useState(COUNTRIES[0]);
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");

  const handleCountryChange = (c: typeof COUNTRIES[0]) => {
    setSelected(c);
    setOpen(false);
    onChange(`${c.code}${number}`);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumber(e.target.value);
    onChange(`${selected.code}${e.target.value}`);
  };

  return (
    <div className="flex gap-2 relative w-full min-w-0">
      {/* Sélecteur indicatif */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-gray-200 text-sm hover:border-[#4c075b] transition-colors whitespace-nowrap"
        >
          <Flag iso={selected.iso} />
          <span className="text-gray-700">{selected.code}</span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            {COUNTRIES.map((c) => (
              <button
                key={c.code + c.name}
                type="button"
                onClick={() => { handleCountryChange(c); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#f9f0fb] transition-colors text-left ${
                  selected.code === c.code && selected.name === c.name ? "bg-[#f9f0fb] text-[#4c075b] font-semibold" : "text-gray-700"
                }`}
              >
                <Flag iso={c.iso} />
                <span className="flex-1">{c.name}</span>
                <span className="text-gray-400">{c.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Numéro */}
      <input
        type="tel"
        required={required}
        placeholder="01 XX XX XX XX"
        value={number}
        onChange={handleNumberChange}
        className="flex-1 min-w-0 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors"
      />
    </div>
  );
}
