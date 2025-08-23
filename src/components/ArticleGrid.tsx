import React, { useEffect, useRef, useState } from "react";

export type Article = {
  id: string;
  module: string;        // e.g., "AP", "GL", "Payments"
  title: string;
  rca?: string;          // Root Cause
  steps?: string;        // Resolution Steps
  validation?: string;   // Post-Validation
  tags?: string[];
  lastUpdated?: string;
  severity?: string;
};

type Props = { articles: Article[] };

export default function ArticleGrid({ articles }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Article | null>(null);

  const openModal = (a: Article) => {
    setActive(a);
    setOpen(true);
  };
  const closeModal = () => {
    setOpen(false);
    setActive(null);
  };

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeModal();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Compact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {articles.map((a) => (
          <button
            key={a.id}
            onClick={() => openModal(a)}
            className="group w-full text-left rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-haspopup="dialog"
          >
            <div className="p-3">
              {/* badges */}
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge text={a.module} />
                {a.severity ? <Badge text={`Severity: ${a.severity}`} tone="amber" /> : null}
                {a.tags?.slice(0, 3).map((t) => (
                  <Badge key={t} text={t} tone="indigo" />
                ))}
              </div>

              {/* compact title */}
              <h3 className="text-sm font-semibold leading-snug line-clamp-2">
                {a.title}
              </h3>

              {/* short preview */}
              {a.steps ? (
                <div className="mt-2">
                  <div className="text-[11px] font-medium text-gray-500">Steps</div>
                  <p className="text-xs text-gray-700 line-clamp-2">{a.steps}</p>
                </div>
              ) : null}

              <div className="mt-3 text-[11px] text-indigo-600 opacity-0 group-hover:opacity-100">
                Click to open
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Centered modal with full details */}
      {open && active ? (
        <Modal onClose={closeModal} title={active.title}>
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge text={active.module} />
              {active.severity ? <Badge text={`Severity: ${active.severity}`} tone="amber" /> : null}
              {active.tags?.map((t) => (
                <Badge key={t} text={t} tone="indigo" />
              ))}
              {active.lastUpdated ? (
                <span className="ml-auto text-xs text-gray-500">
                  Last updated: {active.lastUpdated}
                </span>
              ) : null}
            </div>

            <Section title="Issue Signature" content={active.title} />
            <Section title="Root Cause" content={active.rca} />
            <Section title="Resolution Steps" content={active.steps} />
            <Section title="Post-Validation" content={active.validation} />
          </div>
        </Modal>
      ) : null}
    </>
  );
}

/* ---------- UI bits ---------- */

function Badge({
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
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}
    >
      {text}
    </span>
  );
}

function Section({ title, content }: { title: string; content?: string }) {
  if (!content) return null;
  return (
    <section>
      <h4 className="text-sm font-semibold text-gray-900 mb-1">{title}</h4>
      <div className="prose prose-sm max-w-none">
        <p className="whitespace-pre-line">{content}</p>
      </div>
    </section>
  );
}

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
    return () => prev?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={ref}
        tabIndex={-1}
        className="relative w-full max-w-3xl max-h-[85vh] overflow-auto rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-5"
      >
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
