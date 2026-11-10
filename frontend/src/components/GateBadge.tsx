interface GateBadgeProps {
  label: string;
  size?: "sm" | "md";
  tone?: "cyan" | "green" | "neutral";
}

const tones = {
  cyan: { bg: "rgba(0,180,216,0.12)", color: "#0A1931" },
  green: { bg: "rgba(0,245,138,0.18)", color: "#0A1931" },
  neutral: { bg: "#F0F0F2", color: "#6E6E73" },
};

export default function GateBadge({ label, size = "md", tone = "cyan" }: GateBadgeProps) {
  const isSmall = size === "sm";
  const c = tones[tone];
  return (
    <span
      className="inline-flex items-center rounded-full"
      style={{
        background: c.bg,
        color: c.color,
        fontSize: isSmall ? 11.5 : 12.5,
        fontWeight: 600,
        padding: isSmall ? "3px 10px" : "4px 12px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      }}
    >
      {label}
    </span>
  );
}
