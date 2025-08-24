import React, { useEffect, useRef, useState } from "react";

export type LinkItem = { label: string; url: string };

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
  links?: LinkItem[];
};

type Props = { articles: Article[] };

function firstLine(s: string) {
  return (s || "").split(/\r?\n/)[0] ?? "";
}
function toLines(value?: string | string[]) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map((x) => x.trim());
  return value
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => x.replace(/^[-*•]\s+/, "").replace(/^\d+\.\s+/, ""));
}

const Badge = React.memo(function Badge({
  text,
  tone = "gray",
}: {
  text: string;
  tone?: "gray" | "indigo" | "amber";
}) {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-800",
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}>
      {text}
    </span>
  );
});

const ArticleSection = React.memo(function ArticleSection({
  title,
  content,
  listType,
  children,
}: {
  title: string;
  content?: string | string[];
  listType?: "bulleted" | "numbered";
  children?: React.ReactNode;
}) {
  const lines = toLines(content);
  return (
    <section className="mt-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-1">{title}</h4>
      {children ? (
        <div className="prose prose-sm max-w-none">{children}</div>
      ) : lines.length ? (
        listType === "bulleted" ? (
          <ul className="list-disc pl-5 text-sm space-y-1">
            {lines.map((li, i) => (
              <li key={i}>{li}</li>
            ))}
          </ul>
        ) : listType === "numbered" ? (
          <ol className="list-decimal pl-5 text-sm space-y-1">
            {lines.map((li, i) => (
              <li key={i}>{li}</li>
            ))}
          </ol>
        ) : (
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-line">{Array.isArray(content) ? content.join("\n") : content}</p>
          </div>
        )
      ) : null}
    </section>
  );
});

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      prev?.focus();
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div ref={ref} tabIndex={-1} className="relative w-full max-w-3xl max-h-[85vh] overflow-auto rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold leading-tight">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function GridInner({ articles }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Article | null>(null);
  const openModal = (a: Article) => { setActive(a); setOpen(true); };
  const closeModal = () => { setOpen(false); setActive(null); };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {articles.map((a) => (
          <button
            key={a.id}
            onClick={() => openModal(a)}
            className="group w-full text-left rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-haspopup="dialog"
          >
            <div className="p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge text={a.module} />
                {a.severity ? <Badge text={`Severity: ${a.severity}`} tone="amber" /> : null}
                {a.tags?.slice(0, 4).map((t) => (
                  <Badge key={t} text={t} tone="indigo" />
                ))}
              </div>

              <h3 className="text-sm font-semibold leading-snug line-clamp-2">{a.title}</h3>

              {a.steps ? (
                <div className="mt-2">
                  <div className="text-[11px] font-medium text-gray-500">Steps</div>
                  <p className="text-xs text-gray-700 line-clamp-2">
                    {Array.isArray(a.steps) ? a.steps[0] : firstLine(a.steps)}
                  </p>
                </div>
              ) : null}

              <div className="mt-3 text-[11px] text-indigo-600 opacity-0 group-hover:opacity-100">Click to open</div>
            </div>
          </button>
        ))}
      </div>

      {open && active ? (
        <Modal onClose={closeModal} title={active.title}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge text={active.module} />
            {active.severity ? <Badge text={`Severity: ${active.severity}`} tone="amber" /> : null}
            {active.tags?.map((t) => <Badge key={t} text={t} tone="indigo" />)}
          </div>

          <ArticleSection title="Issue Signature">
            <p className="whitespace-pre-line">{active.title}</p>
          </ArticleSection>

          <ArticleSection title="Root Cause" content={active.rca} />
          <ArticleSection title="Pre-checks" content={active.prechecks} listType="bulleted" />
          <ArticleSection title="Resolution Steps" content={active.steps} listType="numbered" />
          <ArticleSection title="Post-Validation" content={active.validation} />

          {active.links?.length ? (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Links</h4>
              <ul className="list-disc pl-5 text-sm">
                {active.links.map((l, i) => (
                  <li key={i}>
                    <a href={l.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {active.lastUpdated ? (
            <div className="mt-5 text-xs text-gray-500">Last updated {active.lastUpdated}</div>
          ) : null}
        </Modal>
      ) : null}
    </>
  );
}

// memoize to avoid re-rendering unless the list identity changes
export default React.memo(GridInner);
