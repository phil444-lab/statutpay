import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  showStrength?: boolean;
}

const rules = [
  { label: "8 caractères minimum", test: (v: string) => v.length >= 8 },
  { label: "Une majuscule", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Une minuscule", test: (v: string) => /[a-z]/.test(v) },
  { label: "Un chiffre", test: (v: string) => /\d/.test(v) },
  { label: "Un caractère spécial", test: (v: string) => /[^a-zA-Z\d]/.test(v) },
];

export default function PasswordInput({ value, onChange, placeholder = "••••••••", required, showStrength }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#4c075b] transition-colors"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#4c075b] transition-colors"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {rules.map((r) => (
            <li key={r.label} className={`flex items-center gap-1.5 text-xs ${r.test(value) ? "text-green-500" : "text-gray-400"}`}>
              <span>{r.test(value) ? "✓" : "○"}</span>
              {r.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
