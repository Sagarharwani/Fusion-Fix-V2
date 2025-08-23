// components/ArticleGrid.tsx
import React, { useEffect, useRef, useState } from "react";

type Article = {
  id: string;
  module: string;        // e.g., "AP", "GL", "Payments"
  title: string;
  rca?: string;
  steps?: string;
  validation?: string;
  tags?: string[];
};

type Props = {
  articles: Article[];
};

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

  // close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeModal();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Grid of square preview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((a) => (
          <button
            key={a.id}
            onClick={() => openModal(a)}
            className="group relative w-full rounded-2xl shadow-sm ring-1 ring-gray-200 hover:ring-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 bg-white text-left"
            aria-haspopup="dialog"
          >
            <div className="p-4 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                {a.module}
              </span>
              {a.tags?.length ? (
                <div className="flex flex-wrap gap-1">
                  {a.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Keep the card square */}
            <div className="px-4 pb-4">
              <div className="aspect-square rounded-xl border border-gray-100 p-4 bg-gradient-to-b from-white to-gray-50">
                <h3 className="text-sm font-semibold leading-snug line-clamp-2 mb-2">
                  {a.title}
                </h3>

                <InfoRow label="RCA" value={a.rca} />
                <InfoRow label="Steps" value={a.steps} />
                <InfoRow label="Validation" value={a.validation} />

                <div className="absolute bottom-3 right-3 text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition">
                  Click to view →
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Centered Modal */}
      {open && active ? (
        <Modal onClose={closeModal} title={active.title}>
          <div className="space-y-4">
            <BadgeRow module={active.module} tags={active.tags} />
            <Section title="Root Cause (RCA)" content={active.rca} />
            <Section title="Steps to Do" content={active.steps} />
            <Section title="Validation" content={active.validation} />
          </div>
        </Modal>
      ) : null}
    </>
  );
}

/* ---------- Small subcomponents ---------- */

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="mb-2">
      <div className="text-[11px] font-medium text-gray-500">{label}</div>
      {/* show a couple of lines in the card */}
      <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">
        {value}
      </p>
    </div>
  );
}

function BadgeRow({ module, tags }: { module: string; tags?: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-800">
        {module}
      </span>
      {tags?.map((t) => (
        <span
          key={t}
          className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium bg-indigo-50 text-indigo-700"
        >
          {t}
        </span>
      ))}
    </div>
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

  // simple focus trap to the dialog
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    return () => previouslyFocused?.focus();
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
        className="relative w-full max-w-2xl max-h-[85vh] overflow-auto rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-5"
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
