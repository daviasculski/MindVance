interface WeightedSliderProps {
  label: string;
  weight: number;
  /** null = ainda sem nota (o envio fica bloqueado até o avaliador mover o slider) */
  value: number | null;
  max?: number;
  description?: string;
  onChange: (v: number) => void;
}

export default function WeightedSlider({ label, weight, value, max = 10, description, onChange }: WeightedSliderProps) {
  const unscored = value === null;
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F" }}>{label}</span>
          {description && (
            <p style={{ fontSize: 11.5, color: "#AEAEB2", marginTop: 2 }}>{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="rounded-full"
            style={{
              background: "#F5F5F7",
              color: "#6E6E73",
              fontSize: 12,
              fontWeight: 500,
              padding: "3px 10px",
            }}
          >
            Peso {weight}%
          </span>
          <span style={{ fontSize: 17, fontWeight: 700, color: unscored ? "#D2D2D7" : "#F59E0B", minWidth: 36, textAlign: "right" }}>
            {unscored ? "—" : value}
            <span style={{ fontSize: 12, color: "#AEAEB2", fontWeight: 500 }}>/{max}</span>
          </span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        // Clicar no slider sem arrastar também conta como dar a nota
        onClick={(e) => onChange(Number((e.target as HTMLInputElement).value))}
        className="ios-slider w-full"
        style={{ opacity: unscored ? 0.45 : 1 }}
        aria-label={`Nota para ${label}`}
      />
    </div>
  );
}
