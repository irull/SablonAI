"use client";
import { RadioGroup, Radio } from "@headlessui/react";

// Stage 1: pemilih Headless UI RadioGroup. Value/onChange dipegang
// parent, Radio memakai className sebagai fungsi ({checked}) => string.
// Dipakai PricingPanel (produk, ukuran, sablon depan/belakang).
// Radio dirender sebagai elemen yang bisa diklik sendiri, jadi gaya
// .size-picker lama yang menargetkan button tidak dipakai di sini;
// gaya baru memakai token Tailwind dari tailwind.config.cjs.
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
              `cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition ${
                checked
                  ? "border-olive bg-olive text-white"
                  : "border-line bg-paper text-ink hover:border-olive"
              }`
            }
          >
            {renderLabel ? renderLabel(opt) : opt.label}
          </Radio>
        ))}
      </RadioGroup>
    </div>
  );
}
