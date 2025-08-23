import { useEffect, useMemo, useState } from "react";
import { Search, Filter, ListFilter, BarChart3, Link as LinkIcon, Play } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Bar, BarChart, XAxis, YAxis, Tooltip } from "recharts";

type Solution = {
  id: string;
  title: string;
  module?: string;          // AP, AR, GL, Payments, SLA, Approvals, etc.
  severity?: "Low" | "Medium" | "High" | "Critical";
  rootCause?: string;
  preChecks?: string[];
  steps?: string[];
  validation?: string[];
  oracleDocs?: string[];    // Oracle doc links
  videos?: string[];        // YouTube links
};

const TAGS = ["AP","AR","GL","Payments","SLA","Approvals","Tax","Supplier","Invoices","UAT","DEV","PROD"];
const COLORS = ["#6366f1","#22c55e","#f59e0b","#ef4444","#06b6d4","#a855f7","#10b981","#f97316"];

export default function App() {
  const [all, setAll] = useState<Solution[]>([]);
  const [q, setQ] = useState("");
  const [module, setModule] = useState<string>("All");
  const [severity, setSeverity] = useState<string>("All");

  useEffect(() => {
    // public/solutions.json is served at /solutions.json in Vite/Vercel
    fetch("/solutions.json")
      .then(r => r.json())
      .then((data: Solution[]) => setAll(data))
      .catch(() => setAll([]));
  }, []);

  const modules = useMemo(() => {
    const m = new Set<string>();
    all.forEach(x => x.module && m.add(x.module));
    return ["All", ...Array.from(m).sort()];
  }, [all]);

  const severities = ["All","Low","Medium","High","Critical"];

  const filtered = useMemo(() => {
    return all.filter(s => {
      const hitQ =
        !q ||
        s.title?.toLowerCase().includes(q.toLowerCase()) ||
        s.rootCause?.toLowerCase().includes(q.toLowerCase());
      const hitM = module === "All" || s.module === module;
      const hitS = severity === "All" || s.severity === severity;
      return hitQ && hitM && hitS;
    });
  }, [all, q, module, severity]);

  const byModule = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(s => {
      const key = s.module ?? "Unknown";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const bySeverity = useMemo(() => {
    const order = ["Low","Medium","High","Critical","Unknown"];
    const map: Record<string, number> = {};
    filtered.forEach(s => {
      const key = s.severity ?? "Unknown";
      map[key] = (map[key] || 0) + 1;
    });
    return order
      .filter(k => map[k])
      .map(k => ({ name: k, value: map[k] }));
  }, [filtered]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Fusion Finance Fixes</h1>
        <a
          className="text-sm text-indigo-600 hover:underline"
          href="https://github.com/Sagarharwani/Fusion-Fix-V2"
          target="_blank"
          rel="noreferrer"
        >
          View Repo
        </a>
      </header>

      {/* Filters */}
      <section className="grid md:grid-cols-4 gap-3">
        <div className="col-span-2 flex items-center gap-2 bg-white rounded-xl border px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            className="w-full outline-none"
            placeholder="Search title, root cause…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl border px-3 py-2">
          <ListFilter className="w-4 h-4 text-slate-400" />
          <select className="w-full outline-none" value={module} onChange={e => setModule(e.target.value)}>
            {modules.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl border px-3 py-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select className="w-full outline-none" value={severity} onChange={e => setSeverity(e.target.value)}>
            {severities.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </section>

      {/* Stats */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-medium mb-2">By Module</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="value" data={byModule} innerRadius={40} outerRadius={70}>
                  {byModule.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4 col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4" /><h3 className="font-medium">By Severity</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySeverity}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="text-sm text-slate-600">{filtered.length} solutions</div>
          <div className="text-xs text-slate-400">Tip: extend <code>public/solutions.json</code> with more fields.</div>
        </div>

        <ul className="divide-y">
          {filtered.map(s => (
            <li key={s.id} className="px-4 py-4 hover:bg-slate-50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-medium">{s.title}</h4>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    {s.module && <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">Module: {s.module}</span>}
                    {s.severity && <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">Severity: {s.severity}</span>}
                  </div>
                  {s.rootCause && <p className="mt-2 text-sm text-slate-600"><b>Root cause:</b> {s.rootCause}</p>}
                  {s.preChecks?.length ? (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Pre-checks</p>
                      <ul className="list-disc ml-5 text-sm text-slate-700">
                        {s.preChecks.map((x,i)=><li key={i}>{x}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  {s.steps?.length ? (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Resolution steps</p>
                      <ol className="list-decimal ml-5 text-sm text-slate-700">
                        {s.steps.map((x,i)=><li key={i}>{x}</li>)}
                      </ol>
                    </div>
                  ) : null}
                  {(s.oracleDocs?.length || s.videos?.length) ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {s.oracleDocs?.map((u,i)=>(
                        <a key={i} href={u} target="_blank" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                          <LinkIcon className="w-3 h-3"/> Oracle Doc
                        </a>
                      ))}
                      {s.videos?.map((u,i)=>(
                        <a key={i} href={u} target="_blank" className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline">
                          <Play className="w-3 h-3"/> Video
                        </a>
                      ))}
                    </div>
                  ):null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="py-6 text-center text-xs text-slate-400">
        Data file: <code>/public/solutions.json</code> — add as many records as you like (5,000+ works fine).
      </footer>
    </div>
  );
}
