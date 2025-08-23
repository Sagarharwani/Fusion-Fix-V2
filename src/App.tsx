import React, { useEffect, useMemo, useState } from "react";
import ArticleGrid, { type Article } from "./components/ArticleGrid";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/** ---------- Types matching your solutions.json ---------- */
type Solution = {
  id: string | number;
  title: string;
  module: string;
  severity?: string;
  rca?: string;
  steps?: string;
  validation?: string;
  tags?: string[];
  lastUpdated?: string;
};

type ModuleCount = { name: string; count: number };

/** -------- Recharts custom label (module + %) -------- */
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
  const pct = Math.round((percent || 0) * 100);

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
      {payload?.name} {pct}%
    </text>
  );
};

/** ----------------------- App --------------------------- */
export default function App() {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("All");

  // Load from /public/solutions.json
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/solutions.json");
        const data: Solution[] = await res.json();
        setSolutions(data);
      } catch (e) {
        console.error("Failed to load solutions.json", e);
      }
    })();
  }, []);

  // Distinct modules (for filter dropdown)
  const modules = useMemo(() => {
    const set = new Set(solutions.map((s) => s.module).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [solutions]);

  // Search + filter
  const solutionsInView = useMemo(() => {
    const q = query.trim().toLowerCase();
    return solutions.filter((s) => {
      const moduleOk = moduleFilter === "All" || s.module === moduleFilter;
      if (!moduleOk) return false;

      if (!q) return true;
      const hay =
        `${s.title} ${s.module} ${s.rca ?? ""} ${s.steps ?? ""} ${s.validation ?? ""} ${(s.tags ?? []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [solutions, query, moduleFilter]);

  // Module totals for donut + side table
  const moduleCounts: ModuleCount[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of solutionsInView) {
      map.set(s.module, (map.get(s.module) || 0) + 1);
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [solutionsInView]);

  const totalArticles = solutionsInView.length;

  // Map to ArticleGrid shape
  const articles: Article[] = useMemo(
    () =>
      solutionsInView.map((s) => ({
        id: String(s.id),
        module: s.module,
        title: s.title,
        rca: s.rca,
        steps: s.steps,
        validation: s.validation,
        tags: s.tags,
        lastUpdated: s.lastUpdated,
        severity: s.severity,
      })),
    [solutionsInView]
  );

  // Colors for donut
  const COLORS = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <h1 className="text-xl font-semibold">Fusion Finance Fixes</h1>

          <div className="flex-1" />

          {/* Search */}
          <input
            type="text"
            p
