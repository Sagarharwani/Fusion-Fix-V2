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
            placeholder="Search title, root cause, module, tags…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-[360px] rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          />

          {/* Module filter */}
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="ml-2 rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Chips */}
          <div className="ml-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs">
              Total Articles
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-white px-1 ring-1 ring-gray-200">
                {totalArticles}
              </span>
            </span>
            <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs">
              Modules in View
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-white px-1 ring-1 ring-gray-200">
                {moduleCounts.length}
              </span>
            </span>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Chart + module table */}
        <section className="rounded-xl bg-white ring-1 ring-gray-200">
          <div className="p-4 border-b">
            <h2 className="text-sm font-semibold">By Module</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moduleCounts.map((d) => ({ name: d.name, value: d.count }))}
                    dataKey="value"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {moduleCounts.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="p-4">
              <h3 className="text-xs text-gray-500 mb-2">Module-wise Totals</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-1.5 font-medium">Module</th>
                    <th className="py-1.5 font-medium">Count</th>
                    <th className="py-1.5 font-medium">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {moduleCounts.map((m) => (
                    <tr key={m.name} className="border-b last:border-0">
                      <td className="py-2">{m.name}</td>
                      <td className="py-2">{m.count}</td>
                      <td className="py-2">
                        {totalArticles ? Math.round((m.count / totalArticles) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Right: Compact cards with modal */}
        <section className="rounded-xl bg-white ring-1 ring-gray-200">
          <div className="px-4 py-3 border-b">
            <h2 className="text-sm font-semibold">{totalArticles} Articles</h2>
          </div>
          <div className="p-4">
            <ArticleGrid articles={articles} />
          </div>
        </section>
      </main>
    </div>
  );
}
