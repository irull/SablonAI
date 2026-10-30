"use client";
import { RadioGroup, Radio } from "@headlessui/react";
import { Check } from "lucide-react";

// Pemilih ala kartu kuis (bahasa desain referensi Ronas IT): kartu putih
// berbingkai tipis; yang terpilih berbingkai biru, latar tint pucat, dan
// lingkaran centang terisi di kanan. Dipakai PricingPanel.
export default function OptionGroup({
  label,
  value,
  onChange,
  options,
  renderLabel,
}) {
  return (
    <div>
      {label && <div className="field-label">{label}</div>}
      <RadioGroup
        value={value}
        onChange={onChange}
        aria-label={label || "Pilihan"}
        className="flex flex-wrap gap-2"
      >
        {options.map((opt) => (
          <Radio
            key={opt.key || opt.label || String(opt.value)}
            value={opt.value}
            className={({ checked }) =>
              `flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                checked
                  ? "border-olive bg-soft text-ink shadow-sm"
                  : "border-line bg-paper text-ink hover:border-accent-mid"
              }`
            }
          >
            {({ checked }) => (
              <>
                <span className="flex-1">
                  {renderLabel ? renderLabel(opt) : opt.label}
                </span>
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                    checked
                      ? "border-olive bg-olive text-white"
                      : "border-line bg-paper text-transparent"
                  }`}
                >
                  <Check size={12} strokeWidth={3.5} />
                </span>
              </>
            )}
          </Radio>
        ))}
      </RadioGroup>
    </div>
  );
}
