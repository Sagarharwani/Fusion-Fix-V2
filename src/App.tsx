import React, { useEffect, useMemo, useState } from "react";
import ArticleGrid, { type Article } from "./components/ArticleGrid";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

type Solution = {
  id: string | number;
  title: string;
  module: string;
  severity?: string;
  rca?: string | string[];
  prechecks?: string | string[];
  steps?: string | string[];
  validation?: string | string[];
  tags?: string[];
  lastUpdated?: string;
  links?: { label: string; url: string }[];
};

type ModuleCount = { name: string; count: number };

export default function App() {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("All");

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

  const modules = useMemo(() => {
    const set = new Set(solutions.map((s) => s.module).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [solutions]);

  const solutionsInView = useMemo(() => {
    const q = query.trim().toLowerCase();
    return solutions.filter((s) => {
      const moduleOk = moduleFilter === "All" || s.module === moduleFilter;
      if (!moduleOk) return false;
      if (!q) return true;
      const hay =
        `${s.title} ${s.module} ${s.rca} ${s.prechecks} ${s.steps} ${s.validation} ${(s.tags ?? []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [solutions, query, moduleFilter]);

  const moduleCounts: ModuleCount[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of solutionsInView) {
      map.set(s.module, (map.get(s.module) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [solutionsInView]);

  const totalArticles = solutionsInView.length;

  const flatArticles: Article[] = useMemo(
    () =>
      solutionsInView.map((s) => ({
        id: String(s.id),
        module: s.module,
        title: s.title,
        rca: s.rca,
        prechecks: s.prechecks,
        steps: s.steps,
        validation: s.validation,
        tags: s.tags,
        lastUpdated: s.lastUpdated,
        severity: s.severity,
        links: s.links,
      })),
    [solutionsInView]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <h1 className="text-xl font-semibold">Fusion Finance Fixes</h1>
          <div className="flex-1" />
          <input
            type="text"
            placeholder="Search title, root cause, module, tags…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-[360px] rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          />
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
        </div>
      </header>

      {/* Stats */}
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-5">
        <section className="rounded-xl bg-white ring-1 ring-gray-200">
          <div className="p-4 border-b">
            <h2 className="text-sm font-semibold">By Module</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* Bar Chart */}
            <div className="md:col-span-2 h-80 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleCounts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#6366F1" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="p-4">
              <h3 className="text-xs text-gray-500 mb-2">Totals</h3>
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
                        {totalArticles
                          ? Math.round((m.count / totalArticles) * 100)
                          : 0}
                        %
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-2 font-medium">Total</td>
                    <td className="py-2">{totalArticles}</td>
                    <td className="py-2">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Articles */}
        <section className="rounded-xl bg-white ring-1 ring-gray-200">
          <div className="px-4 py-3 border-b">
            <h2 className="text-sm font-semibold">
              {totalArticles} Articles
            </h2>
          </div>
          <div className="p-4">
            <ArticleGrid articles={flatArticles} />
          </div>
        </section>
      </main>
    </div>
  );
}
