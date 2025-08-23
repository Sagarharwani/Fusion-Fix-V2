// Recharts: custom label (module name + % inside each slice)
const RADIAN = Math.PI / 180;
const renderPieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  payload,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const pct = Math.round(percent * 100);

  return (
    <text
      x={x}
      y={y}
      fontSize={12}
      textAnchor="middle"
      dominantBaseline="central"
      fill="#111827"
      style={{ paintOrder: "stroke", stroke: "white", strokeWidth: 3 }}
    >
      {payload.name} {pct}%
    </text>
  );
};
