"use client";
import { RadioGroup, Radio } from "@headlessui/react";
import { Check } from "lucide-react";

// Stage 1: warna kaos sebagai Headless RadioGroup. Value adalah objek
// warna dari config.colors (referensi yang sama), jadi checked bekerja
// dengan perbandingan referensi. Gaya .swatch/.swatch.active dari
// globals.css dipakai kembali, bukan gaya baru.
export default function ColourGroup({ value, onChange, colors, t }) {
  const tr = t || ((key) => key);
  return (
    <div className="color-section">
      <div className="section-label">
        {tr("colorLabel")} <strong>{value.name}</strong>
      </div>
      <RadioGroup
        value={value}
        onChange={onChange}
        aria-label={tr("colorLabel")}
        className="swatches"
      >
        {colors.map((c) => (
          <Radio
            key={c.name}
            value={c}
            style={{ "--swatch": c.hex }}
            aria-label={tr("colorPrefix") + c.name}
            className={({ checked }) =>
              checked ? "swatch active" : "swatch"
            }
          >
            {({ checked }) =>
              checked ? (
                <Check
                  size={16}
                  color={
                    c.name === "Putih" || c.name === "Kuning" ? "#333" : "#fff"
                  }
                />
              ) : null
            }
          </Radio>
        ))}
      </RadioGroup>
      <p className="small-note">{tr("colorNote")}</p>
    </div>
  );
}
