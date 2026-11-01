"use client";

import type { ReactNode } from "react";

type ListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  // Extra filter controls (selects, etc.) rendered beside the search box.
  children?: ReactNode;
  summary: string;
};

export default function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  children,
  summary
}: ListToolbarProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        className="input max-w-xs"
      />
      {children}
      <span className="ml-auto text-xs text-ink/45">{summary}</span>
    </div>
  );
}
