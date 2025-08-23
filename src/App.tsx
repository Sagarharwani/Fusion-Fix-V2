import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/** ---------- Types ---------- */
type Solution = {
  id: string | number;
  title: string;
  module: string; // e.g., "AP", "AR", "GL", "Payments", etc.
  // other fields can exist; we only need module/title for this page
};

/** ---------- Helpers ---------- */
const COLORS = [
  "#6366F1", // indigo
  "#22C55E", // green
  "#F59E0B", // amber
  "#EF4444", // rose
  "#06B6D4", // cyan
  "#A855F7", // violet
  "#84CC16", // lime
  "#F97316", // orange
];

const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

/** ---------- UI Chips / Small Components ---------- */
const Box = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border bg-white p-4 shadow-sm">{children}</div>
);

const PageHeader = () => (
  <div className="flex items-center justify-between mb-4">
    <h1 className="text-2xl font-bold">Fusion Finance Fixes</h1>
    <a
      className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
      href="https://github.com/"
      target="_blank"
      rel="noreferrer"
    >
      View Repo
      <svg
        className="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12.293 2.293a1 1 0 011.414 0l4 4A1 1 0 0117 8h-3v6a1 1 0 11-2 0V8H9a1 1 0 110-2h3V3a1 1 0 01.293-.707z" />
        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 112 0v3a4 4 0 01-4 4H5a4 4 0 01-4-4V7a4 4 0 014-4h3a1 1 0 110 2H5z" />
      </svg>
    </a>
  </div>
);

/** ---------- Main App ---------- */
export default function App() {
  const [solutions, setSolutions] = React.useState<Solution[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [moduleFilter, setModuleFilter] = React.useState<string>("All");

  React.useEffect(() => {
    (async () => {
      try {
        // solutions.json should be in /public, so this path works in Vite/Vercel
        const res = await fetch("/solutions.json", { cache: "no-store" });
        const data = (await res.json()) as Solution[];
        setSolutions(data);
      } catch (e) {
        console.error("Failed to load solutions.json", e);
        setSolutions([]); // safe fallback
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // All modules (for dropdown)
  const modules = React.useMemo(() => {
    const set = new Set<string>();
    for (const s of solutions) if (s.module) set.add(s.module);
    return ["All", ...Array.from(set).sort()];
  }, [solutions]);

  // Apply filters
  const filteredSolutions = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return solutions.filter((s) => {
      if (moduleFilter !== "All" && s.module !== moduleFilter) return false;
      if (!q) return true;
      return (
        (s.title || "").toLowerCase().includes(q) ||
        (s.module || "").toLowerCase().includes(q)
      );
    });
  }, [solutions, query, moduleFilter]);

  // Build module counts
  const byModuleMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const s of filteredSolutions) {
      const key = s.module || "Unspecified";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [filteredSolutions]);

  const total = React.useMemo(
    () => filteredSolutions.length,
    [filteredSolutions]
  );

  const chartData = React.useMemo(
    () =>
      Array.from(byModuleMap.entries()).map(([name, count]) => ({
        name,
        count,
      })),
    [byModuleMap]
  );

  // For the table: sort modules by count desc
  const tableRows = React.useMemo(
    () =>
      chartData
        .slice()
        .sort((a, b) => b.count - a.count)
        .map((row) => ({
          ...row,
          percent: total ? row.count / total : 0,
        })),
    [chartData, total]
  );

  return (
    <div className="mx-auto max-w-7xl p-4">
      <PageHeader />

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, root cause, module..."
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
        />
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
        >
          {modules.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-3">
          <div className="rounded-lg border px-3 py-2">
            <div className="text-xs text-slate-500">Total Articles</div>
            <div className="text-lg font-semibold">{loading ? "…" : total}</div>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <div className="text-xs text-slate-500">Modules in View</div>
            <div className="text-lg font-semibold">{byModuleMap.size}</div>
          </div>
        </div>
      </div>

      {/* Chart + Table */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Pie Chart */}
        <Box>
          <h3 className="font-semibold mb-2">By Module</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  labelLine={false}
                  label={({ name, value }) => {
                    const p = total ? Number(value) / total : 0;
                    return `${name} (${pct(p)})`;
                  }}
                >
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={COLORS[idx % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value: any, _n, { payload }) => {
                    const v = Number(value);
                    const p = total ? v / total : 0;
                    return [`${v} • ${pct(p)}`, payload?.name];
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value: string, entry: any) => {
                    const count = entry?.payload?.count ?? 0;
                    const p = total ? count / total : 0;
                    return `${value} — ${pct(p)} (${count})`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Box>

        {/* Stats Table */}
        <Box>
          <h3 className="font-semibold mb-2">Module-wise Totals</h3>

          <div className="mb-2 text-sm text-slate-600">
            Total Articles:{" "}
            <span className="font-semibold text-slate-900">{total}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left">
                  <th className="px-3 py-2">Module</th>
                  <th className="px-3 py-2">Count</th>
                  <th className="px-3 py-2">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.length === 0 && !loading && (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-slate-500">
                      No results for the current filters.
                    </td>
                  </tr>
                )}
                {tableRows.map((row, i) => (
                  <tr key={row.name} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: COLORS[i % COLORS.length],
                          }}
                        />
                        <span className="font-medium">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">{row.count}</td>
                    <td className="px-3 py-2">{pct(row.percent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Box>
      </div>

      {/* (Optional) simple list of titles underneath */}
      <Box>
        <h3 className="font-semibold mb-2">{total} Articles</h3>
        <ul className="space-y-1">
          {filteredSolutions.map((s) => (
            <li key={s.id} className="flex gap-2">
              <span className="inline-flex min-w-[64px] justify-center rounded-md bg-slate-100 px-2 text-xs font-medium text-slate-700">
                {s.module}
              </span>
              <span className="text-slate-800">{s.title}</span>
            </li>
          ))}
        </ul>
      </Box>
    </div>
  );
}
