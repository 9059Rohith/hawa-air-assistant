"use client";
import { useState } from "react";
import { fuelCarbon } from "@/domain/emissions";
import factors from "@/data/emission-factors.json";
export function FuelCalculator({ hi }: { hi: boolean }) {
  const [fuel, setFuel] = useState<Parameters<typeof fuelCarbon>[0]>("lpg");
  const [energy, setEnergy] = useState(2);
  const valid = Number.isFinite(energy) && energy >= 0 && energy <= 1000;
  return (
    <section className="panel">
      <h2>{hi ? "ईंधन के प्रभाव को समझें" : "Compare fuel input energy"}</h2>
      <label>
        {hi ? "ईंधन" : "Fuel"}
        <select
          value={fuel}
          onChange={(e) => setFuel(e.target.value as typeof fuel)}
        >
          {["lpg", "png", "kerosene", "coal", "wood", "electric"].map((f) => (
            <option key={f} value={f}>
              {f.toUpperCase()}
            </option>
          ))}
        </select>
      </label>
      <label>
        {hi
          ? "प्रति दिन इस्तेमाल की गई ऊर्जा (kWh)"
          : "Input energy per day (kWh)"}
        <input
          type="number"
          min={0}
          max={1000}
          step="0.1"
          value={energy}
          onChange={(e) => setEnergy(Number(e.target.value))}
        />
      </label>
      <p role="status">
        {valid
          ? `${fuelCarbon(fuel, energy).toFixed(3)} kg CO₂ / ${hi ? "दिन" : "day"}`
          : hi
            ? "0 से 1000 kWh दर्ज करें।"
            : "Enter 0–1000 kWh."}
      </p>
      <p>
        {hi
          ? "यह समान उपयोगी गर्मी की तुलना नहीं है। उपकरण की दक्षता और ईंधन की मात्रा अलग होती है। लकड़ी का CO₂ कुल जैविक उत्सर्जन है, शुद्ध जलवायु प्रभाव नहीं। समय से ऊर्जा का अनुमान नहीं लगाया जाता।"
          : "This is not an equal-useful-heat comparison. Appliance efficiency and fuel quantities differ. Wood reports gross biogenic CO₂, not net climate impact. Hours alone do not determine energy use."}
      </p>
      <p>
        {hi
          ? "कण प्रदूषण श्रेणी (संख्या या स्वास्थ्य की भविष्यवाणी नहीं)"
          : "Particle source category (qualitative, not a health prediction)"}
        :{" "}
        {fuel === "electric"
          ? hi
            ? "उपकरण पर दहन नहीं; खाना पकाने से फिर भी कण निकल सकते हैं।"
            : "No appliance combustion; cooking can still emit particles."
          : factors.fuel[fuel].pmCategory}
      </p>
      <p className="fine">
        <a href={factors.fuelSource}>IPCC 2006 fuel coefficients</a> ·{" "}
        <a href={factors.grid.source}>CEA {factors.grid.year} grid factor</a>.{" "}
        {hi
          ? "परिवहन, जीवनचक्र और व्यक्तिगत संपर्क शामिल नहीं।"
          : "Excludes upstream, lifecycle and personal exposure effects."}
      </p>
    </section>
  );
}
