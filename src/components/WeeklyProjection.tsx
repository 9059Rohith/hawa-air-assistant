"use client";
export function WeeklyProjection({ kg, hi }: { kg: number; hi: boolean }) {
  return (
    <section className="panel">
      <h2>{hi ? "सात दिन का परिदृश्य" : "Seven-day scenario"}</h2>
      <p>
        {hi
          ? "हर दिन वही कदम और परिस्थितियाँ। यह भविष्यवाणी नहीं है।"
          : "The same actions and conditions repeated daily. This is not a forecast."}
      </p>
      <svg
        className="forecast-chart"
        viewBox="0 0 600 160"
        role="img"
        aria-label={
          hi
            ? `सात दिन में ${Math.max(0, kg * 7).toFixed(2)} kg CO₂ का अनुमानित बदलाव`
            : `Illustrative seven-day change ${Math.max(0, kg * 7).toFixed(2)} kg CO2`
        }
      >
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i}>
            <rect
              x={20 + i * 82}
              y={130 - (kg ? (110 * (i + 1)) / 7 : 0)}
              width={50}
              height={kg ? (110 * (i + 1)) / 7 : 1}
              fill="currentColor"
            />
            <text
              x={45 + i * 82}
              y={153}
              textAnchor="middle"
              fill="currentColor"
            >
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
      <details>
        <summary>
          {hi ? "सात दिन की तालिका" : "Seven-day projection table"}
        </summary>
        <table>
          <caption>
            {hi
              ? "चुने गए यात्रियों के लिए संचयी CO₂ बदलाव"
              : "Cumulative CO₂ change for the selected commuters"}
          </caption>
          <thead>
            <tr>
              <th>{hi ? "दिन" : "Day"}</th>
              <th>kg CO₂</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 7 }, (_, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{(kg * (i + 1)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
