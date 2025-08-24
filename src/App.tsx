import React, { useEffect, useMemo, useRef, useState, Suspense, useDeferredValue } from "react";
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

// Lazy-load the heavy grid (code-splitting)
const ArticleGrid = React.lazy(() => import("./components/ArticleGrid"));
export type Article = {
  id: string;
  module: string;
  title: string;
  rca?: string | string[];
  prechecks?: string | string[];
  steps?: string | string[];
  validation?: string | string[];
  tags?: string[];
  lastUpdated?: string;
  severity?: string;
  links?: { label: string; url: string }[];
};

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

// ---------- search helpers (wildcards) ----------
function normalize(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}
function sqlLikeToRegex(pattern: string): RegExp {
  const esc = pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const withWildcards = esc.replace(/%/g, ".*").replace(/_/g, ".");
  return new RegExp(withWildcards, "i");
}
function matchesQuery(haystack: string, compiled: RegExp | null, plain: string): boolean {
  if (!plain) return true;
  const h = normalize(haystack);
  return compiled ? compiled.test(h) : h.includes(normalize(plain));
}
function toText(v?: string | string[]) {
  if (!v) return "";
  return Array.isArray(v) ? v.join(" ") : v;
}
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const nowISO = () => new Date().toISOString();

// simple debounce
function useDebounced<T>(value: T, ms = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

// --- paging per module: show N initially, then "show more"
const PAGE_SIZE = 24;

export default function App() {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("All");

  // collapsed by default for speed
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // per-module page count
  const [pages, setPages] = useState<Record<string, number>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // load data
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

  // modules list
  const modules = useMemo(() => {
    const set = new Set(solutions.map((s) => s.module).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [solutions]);

  // debounce + defer query so typing stays responsive
  const debouncedQuery = useDebounced(query, 220);
  const deferredQuery = useDeferredValue(debouncedQuery);

  // compile regex once per query if it contains wildcards
  const compiledQuery = useMemo<RegExp | null>(() => {
    const q = deferredQuery.trim();
    if (!q) return null;
    return /[%_]/.test(q) ? sqlLikeToRegex(normalize(q)) : null;
  }, [deferredQuery]);

  // filter + search
  const solutionsInView = useMemo(() => {
    const q = deferredQuery;
    return solutions.filter((s) => {
      if (!(moduleFilter === "All" || s.module === moduleFilter)) return false;
      if (!q) return true;
      const hay =
        `${s.title} ${s.module} ${toText(s.rca)} ${toText(s.prechecks)} ${toText(s.steps)} ${toText(s.validation)} ${(s.tags ?? []).join(" ")}`;
      return matchesQuery(hay, compiledQuery, q);
    });
  }, [solutions, deferredQuery, moduleFilter, compiledQuery]);

  // counts
  const moduleCounts: ModuleCount[] = useMemo(() => {
    const map = solutionsInView.reduce((m, s) => m.set(s.module, (m.get(s.module) || 0) + 1), new Map<string, number>());
    return Array.from(map, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [solutionsInView]);

  const totalArticles = solutionsInView.length;

  // transform for grid
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

  // group by module
  const grouped = useMemo(() => {
    const m = new Map<string, Article[]>();
    for (const a of flatArticles) {
      if (!m.has(a.module)) m.set(a.module, []);
      m.get(a.module)!.push(a);
    }
    const arr = Array.from(m, ([module, items]) => ({ module, items }));
    arr.sort((a, b) => a.module.localeCompare(b.module));
    return arr;
  }, [flatArticles]);

  // initialize collapse + pages when modules change
  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      for (const { module } of grouped) if (!(module in next)) next[module] = false; // collapsed by default
      return next;
    });
    setPages((prev) => {
      const next = { ...prev };
      for (const { module } of grouped) if (!(module in next)) next[module] = 1;
      return next;
    });
  }, [grouped]);

  // --- import/export/add ---
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(solutions, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solutions-export-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const triggerImport = () => fileInputRef.current?.click();
  const handleImport: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error("JSON must be an array");
      const incoming: Solution[] = arr.map((r: any) => ({
        id: r.id ?? uid(),
        title: r.title ?? r.issueSignature ?? "Untitled",
        module: r.module ?? "General",
        severity: r.severity,
        rca: r.rca ?? r.rootCause,
        prechecks: r.prechecks ?? r.preChecks,
        steps: r.steps ?? r.resolutionSteps,
        validation: r.validation ?? r.postValidation,
        tags: Array.isArray(r.tags) ? r.tags : typeof r.tags === "string" ? r.tags.split(",").map((x: string) => x.trim()).filter(Boolean) : [],
        lastUpdated: r.lastUpdated ?? r.updatedAt ?? nowISO(),
        links: r.links ?? r.references ?? [],
      }));
      const canon = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
      const seen = new Set(solutions.map((s) => canon(`${s.title} ${s.module}`)));
      const merged = [...solutions, ...incoming.filter((s) => !seen.has(canon(`${s.title} ${s.module}`)))];
      setSolutions(merged);
      e.currentTarget.value = "";
    } catch (err) {
      console.error("Import failed:", err);
      alert("Import failed: " + (err as Error).message);
    }
  };

  // add article modal state (strings only)
  type AddForm = {
    module: string; title: string; severity: string; tagsInput: string;
    rca: string; prechecks: string; steps: string; validation: string;
  };
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddForm>({
    module: "", title: "", severity: "", tagsInput: "", rca: "", prechecks: "", steps: "", validation: "",
  });
  const openAdd = () => setShowAdd(true);
  const closeAdd = () => setShowAdd(false);
  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.module.trim()) { alert("Title and Module are required."); return; }
    const toLines = (v: string) => v.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    const item: Solution = {
      id: uid(),
      title: form.title.trim(),
      module: form.module.trim(),
      severity: form.severity.trim() || undefined,
      tags: form.tagsInput ? form.tagsInput.split(",").map(t => t.trim()).filter(Boolean) : [],
      rca: form.rca.trim() || undefined,
      prechecks: toLines(form.prechecks),
      steps: toLines(form.steps),
      validation: toLines(form.validation),
      lastUpdated: nowISO(),
      links: [],
    };
    const canon = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
    const exists = solutions.some(s => canon(`${s.title} ${s.module}`) === canon(`${item.title} ${item.module}`));
    if (exists && !confirm("Similar article exists. Add anyway?")) return;
    setSolutions(prev => [item, ...prev]);
    setShowAdd(false);
    setForm({ module: "", title: "", severity: "", tagsInput: "", rca: "", prechecks: "", steps: "", validation: "" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* header */}
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <h1 className="text-xl font-semibold">Fusion Finance Fixes</h1>
          <div className="flex-1" />
          <input
            type="text"
            placeholder="Search (supports % and _ wildcards)…  e.g.,  %invoi%error%"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-[360px] rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="ml-2 rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            {modules.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </header>

      {/* content */}
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-5">
        {/* stats + controls */}
        <section className="rounded-xl bg-white ring-1 ring-gray-200">
          <div className="p-4 border-b">
            <h2 className="text-sm font-semibold">By Module</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* bar chart */}
            <div className="md:col-span-2 h-80 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleCounts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#6366F1" name="count" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* right panel */}
            <div className="p-4 space-y-4">
              <div>
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
                  {moduleCounts.map(m => (
                    <tr key={m.name} className="border-b last:border-0">
                      <td className="py-2">{m.name}</td>
                      <td className="py-2">{m.count}</td>
                      <td className="py-2">{totalArticles ? Math.round((m.count / totalArticles) * 100) : 0}%</td>
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

              <div className="space-y-2">
                <button onClick={openAdd} className="w-full rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-700">+ Add Article</button>
                <div className="flex items-center gap-2">
                  <button onClick={triggerImport} className="flex-1 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">Import JSON</button>
                  <button onClick={handleExport} className="flex-1 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">Export JSON</button>
                </div>
                <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport}/>
              </div>
            </div>
          </div>
        </section>

        {/* grouped sections (collapsed by default, paged) */}
        <div className="space-y-5">
          {grouped.map(({ module, items }) => {
            const isOpen = !!expanded[module];
            const page = pages[module] || 1;
            const visible = isOpen ? items.slice(0, PAGE_SIZE * page) : [];
            const remaining = Math.max(0, items.length - visible.length);
            return (
              <section key={module} className="rounded-xl bg-white ring-1 ring-gray-200">
                <button
                  onClick={() => setExpanded(prev => ({ ...prev, [module]: !prev[module] }))}
                  className="w-full px-4 py-3 border-b flex items-center gap-3 text-left hover:bg-gray-50"
                  aria-expanded={isOpen}
                >
                  <span className={`inline-block transition-transform ${isOpen ? "rotate-90" : "rotate-0"}`} aria-hidden>▶</span>
                  <h2 className="text-sm font-semibold">{module}</h2>
                  <span className="text-xs text-gray-500">({items.length})</span>
                </button>

                {isOpen && (
                  <div className="p-4">
                    <Suspense fallback={<div className="text-sm text-gray-500">Loading…</div>}>
                      <ArticleGrid articles={visible}/>
                    </Suspense>

                    {remaining > 0 && (
                      <div className="mt-3 flex justify-center">
                        <button
                          onClick={() => setPages(prev => ({ ...prev, [module]: (prev[module] || 1) + 1 }))}
                          className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          Show {Math.min(PAGE_SIZE, remaining)} more ({remaining} left)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}

          {!grouped.length && (
            <div className="rounded-xl bg-white ring-1 ring-gray-200 p-6 text-sm text-gray-500">
              No articles found.
            </div>
          )}
        </div>
      </main>

      {/* add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeAdd}/>
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-auto rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-5">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">Add Article</h3>
              <button onClick={closeAdd} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Close">✕</button>
            </div>

            <form onSubmit={submitAdd} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Module *</label>
                <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={form.module}
                       onChange={(e)=>setForm(f=>({...f,module:e.target.value}))} required/>
              </div>
              <div>
                <label className="block text-sm font-medium">Severity</label>
                <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={form.severity}
                       onChange={(e)=>setForm(f=>({...f,severity:e.target.value}))}/>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Title *</label>
                <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={form.title}
                       onChange={(e)=>setForm(f=>({...f,title:e.target.value}))} required/>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Tags (comma-separated)</label>
                <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={form.tagsInput}
                       onChange={(e)=>setForm(f=>({...f,tagsInput:e.target.value}))}/>
              </div>

              <div>
                <label className="block text-sm font-medium">Root Cause</label>
                <textarea className="mt-1 w-full h-24 rounded-lg border px-3 py-2 text-sm" value={form.rca}
                          onChange={(e)=>setForm(f=>({...f,rca:e.target.value}))}/>
              </div>
              <div>
                <label className="block text-sm font-medium">Pre-checks (one per line)</label>
                <textarea className="mt-1 w-full h-24 rounded-lg border px-3 py-2 text-sm" value={form.prechecks}
                          onChange={(e)=>setForm(f=>({...f,prechecks:e.target.value}))}/>
              </div>

              <div>
                <label className="block text-sm font-medium">Resolution Steps (one per line)</label>
                <textarea className="mt-1 w-full h-28 rounded-lg border px-3 py-2 text-sm" value={form.steps}
                          onChange={(e)=>setForm(f=>({...f,steps:e.target.value}))}/>
              </div>
              <div>
                <label className="block text-sm font-medium">Post-Validation (one per line)</label>
                <textarea className="mt-1 w-full h-28 rounded-lg border px-3 py-2 text-sm" value={form.validation}
                          onChange={(e)=>setForm(f=>({...f,validation:e.target.value}))}/>
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={closeAdd} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
