import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/** ---------- Types matching your solutions.json ---------- */
type Link = {
  label: string;
  url: string;
};

type Solution = {
  id: string | number;
  title: string;
  module: string;
  severity?: string;

  // New rich fields (optional but recommended)
  root_cause?: string;
  pre_checks?: string[];           // bullets
  steps?: string[];                // ordered steps
  post_validation?: string[];      // bullets
  tags?: string[];                 // extra tags/keywords
  links?: Link[];                  // oracle docs / MOS / YouTube etc.
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

const Box = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border bg-white p-4 shadow-sm">{children}</div>
);

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
    {children}
  </span>
);

const PageHeader = () => (
  <div className="mb-4 flex items-center justify-between">
    <h1 className="text-2xl font-bold">Fusion Finance Fixes</h1>
    <a
      className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
      href="https://github.com/"
      target="_blank"
      rel="noreferrer"
    >
      View Repo
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M12.293 2.293a1 1 0 011.414 0l4 4A1 1 0 0117 8h-3v6a1 1 0 11-2 0V8H9a1 1 0 110-2h3V3a1 1 0 01.293-.707z" />
        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 112 0v3a4 4 0 01-4 4H5a4 4 0 01-4-4V7a4 4 0 014-4h3a1 1 0 110 2H5z" />
      </svg>
    </a>
  </div>
);

/** ---------- Modal ---------- */
function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      {/* Panel */}
      <div className="relative z-10 max-h-[85vh] w-[min(900px,95vw)] overflow-auto rounded-xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** ---------- Main App ---------- */
export default function App() {
  const [solutions, setSolutions] = React.useState<Solution[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [moduleFilter, setModuleFilter] = React.useState<string>("All");
  const [active, setActive] = React.useState<Solution | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/solutions.json", { cache: "no-store" });
        const data = (await res.json()) as Solution[];
        setSolutions(data);
      } catch (e) {
        console.error("Failed to load solutions.json", e);
        setSolutions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Distinct modules
  const modules = React.useMemo(() => {
    const set = new Set<string>();
    for (const s of solutions) if (s.module) set.add(s.module);
    return ["All", ...Array.from(set).sort()];
  }, [solutions]);

  // Filtering
  const filteredSolutions = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return solutions.filter((s) => {
      if (moduleFilter !== "All" && s.module !== moduleFilter) return false;
      if (!q) return true;
      const haystack = [
        s.title,
        s.module,
        s.root_cause,
        ...(s.tags ?? []),
        ...(s.pre_checks ?? []),
        ...(s.steps ?? []),
        ...(s.post_validation ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [solutions, query, moduleFilter]);

  // Aggregations
  const byModuleMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const s of filteredSolutions) {
      const key = s.module || "Unspecified";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [filteredSolutions]);

  const total = filteredSolutions.length;

  const chartData = React.useMemo(
    () => Array.from(byModuleMap, ([name, count]) => ({ name, count })),
    [byModuleMap]
  );

  const tableRows = React.useMemo(
    () =>
      chartData
        .slice()
        .sort((a, b) => b.count - a.count)
        .map((r) => ({ ...r, percent: total ? r.count / total : 0 })),
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
          placeholder="Search title, root cause, module, tags..."
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
        {/* Pie */}
        <Box>
          <h3 className="mb-2 font-semibold">By Module</h3>
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
                      key={entry.name}
                      fill={COLORS[idx % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any, _n, { payload }) => {
                    const count = Number(v);
                    const p = total ? count / total : 0;
                    return [`${count} • ${pct(p)}`, payload?.name];
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value: string, entry: any) => {
                    const c = entry?.payload?.count ?? 0;
                    const p = total ? c / total : 0;
                    return `${value} — ${pct(p)} (${c})`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Box>

        {/* Table */}
        <Box>
          <h3 className="mb-2 font-semibold">Module-wise Totals</h3>
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

      {/* Articles list */}
      <Box>
        <h3 className="mb-2 font-semibold">{total} Articles</h3>
        <ul className="divide-y">
          {filteredSolutions.map((s) => (
            <li key={s.id} className="py-2">
              <button
                onClick={() => setActive(s)}
                className="flex w-full items-start gap-3 text-left hover:bg-slate-50 rounded-lg px-2 py-1"
                title="Open details"
              >
                <Chip>{s.module}</Chip>
                <span className="text-slate-800">{s.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </Box>

      {/* Details Modal */}
      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.title ?? ""}
      >
        {!!active && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Chip>Module: {active.module}</Chip>
              {active.severity && <Chip>Severity: {active.severity}</Chip>}
              {active.tags?.slice(0, 6).map((t) => <Chip key={t}>{t}</Chip>)}
            </div>

            {active.root_cause && (
              <section>
                <h4 className="mb-1 font-semibold">Root Cause</h4>
                <p className="text-slate-700">{active.root_cause}</p>
              </section>
            )}

            {active.pre_checks?.length ? (
              <section>
                <h4 className="mb-1 font-semibold">Pre-Checks</h4>
                <ul className="list-disc pl-5 text-slate-700">
                  {active.pre_checks.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {active.steps?.length ? (
              <section>
                <h4 className="mb-1 font-semibold">Resolution Steps</h4>
                <ol className="list-decimal pl-5 text-slate-700">
                  {active.steps.map((x, i) => (
                    <li key={i} className="mb-0.5">
                      {x}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {active.post_validation?.length ? (
              <section>
                <h4 className="mb-1 font-semibold">Post-Validation</h4>
                <ul className="list-disc pl-5 text-slate-700">
                  {active.post_validation.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {active.links?.length ? (
              <section>
                <h4 className="mb-1 font-semibold">References</h4>
                <ul className="list-disc pl-5">
                  {active.links.map((l, i) => (
                    <li key={i}>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  );
}
