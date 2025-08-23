import React, { useEffect, useRef, useState } from "react";

export type Article = {
  id: string;
  module: string;        // e.g., "AP", "GL", "Payments"
  title: string;

  // Optional rich fields (use what you have in solutions.json)
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
            className="group w-full te
