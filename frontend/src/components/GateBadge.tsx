interface GateBadgeProps {
  label: string;
  size?: "sm" | "md";
  tone?: "amber" | "green" | "neutral";
}

const tones = {
  amber: { bg: "rgba(245,158,11,0.12)", color: "#B6790A" },
  green: { bg: "rgba(52,199,89,0.12)", color: "#1F8A3B" },
  neutral: { bg: "#F0F0F2", color: "#6E6E73" },
};

export default function GateBadge({ label, size = "md", tone = "amber" }: GateBadgeProps) {
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
