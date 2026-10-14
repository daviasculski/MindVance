import { departments } from "../data";

export default function DeptTag({ name }: { name: string }) {
  const dept = departments.find((d) => d.name === name);
  const dot = dept?.color ?? "#AEAEB2";
  const text = dept?.textColor ?? "#6E6E73";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full text-xs font-medium"
      style={{
        background: "#F5F5F7",
        color: text,
        padding: "3px 10px 3px 8px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      }}
    >
      <span className="rounded-full" style={{ width: 6, height: 6, background: dot, flexShrink: 0 }} />
      {name}
    </span>
  );
}
