interface WeightedSliderProps {
  label: string;
  weight: number;
  value: number;
  max?: number;
  onChange: (v: number) => void;
}

export default function WeightedSlider({ label, weight, value, max = 10, onChange }: WeightedSliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F" }}>{label}</span>
        <div className="flex items-center gap-2">
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
          <span style={{ fontSize: 17, fontWeight: 700, color: "#F59E0B", minWidth: 36, textAlign: "right" }}>
            {value}
            <span style={{ fontSize: 12, color: "#AEAEB2", fontWeight: 500 }}>/{max}</span>
          </span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ios-slider w-full"
      />
    </div>
  );
}
