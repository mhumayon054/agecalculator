"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Menu, Search, SearchX } from "lucide-react";

type CalculatorItem = {
  id: string;
  name: string;
  category: string;
  slug?: string;
};

type HeaderProps = {
  calculators: CalculatorItem[];
  onSelectCalculator?: (item: CalculatorItem) => void;
  onToggleSidebar?: () => void;
  initialQuery?: string;
  className?: string;
  style?: React.CSSProperties;
};

export default function Header({
  calculators,
  onSelectCalculator,
  onToggleSidebar,
  initialQuery = "",
  className,
  style,
}: HeaderProps) {
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listboxId = "calculator-search-listbox";

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results = calculators
      .filter((c) => {
        const nameMatch = c.name.toLowerCase().includes(q);
        const catMatch = c.category.toLowerCase().includes(q);
        return nameMatch || catMatch;
      })
      .slice(0, 8);
    return results;
  }, [calculators, query]);

  useEffect(() => {
    if (!query) {
      setOpen(false);
      setActiveIndex(-1);
    } else {
      setOpen(true);
    }
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    const max = suggestions.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((idx) => (idx < max ? idx + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((idx) => (idx > 0 ? idx - 1 : max));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(max);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault();
        selectItem(suggestions[activeIndex]);
      }
    }
  }

  function selectItem(item: CalculatorItem) {
    setOpen(false);
    setActiveIndex(-1);
    setQuery("");
    if (onSelectCalculator) onSelectCalculator(item);
  }

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 bg-card border-b border-border",
        className || "",
      ].join(" ")}
      style={style}
      role="banner"
    >
      <div className="container w-full max-w-full px-4 md:px-6">
        <div className="h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 active:scale-[0.98] transition"
              aria-label="Toggle sidebar"
              onClick={onToggleSidebar}
            >
              <Menu className="h-5 w-5 text-foreground" aria-hidden="true" />
            </button>

            <Link
              href="/"
              className="shrink-0 text-base sm:text-lg md:text-xl font-semibold tracking-tight text-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 rounded-md"
              aria-label="Go to homepage"
            >
              All-in-One Calculators
            </Link>
          </div>

          <div className="w-full max-w-full md:max-w-none md:flex-1 min-w-0 flex justify-end">
            <div
              ref={containerRef}
              className="relative w-full max-w-[28rem] min-w-0"
            >
              <div
                role="combobox"
                aria-expanded={open}
                aria-owns={listboxId}
                aria-haspopup="listbox"
                aria-controls={listboxId}
                className="relative"
              >
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => query && setOpen(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search calculators..."
                  aria-label="Search calculators"
                  aria-autocomplete="list"
                  aria-controls={listboxId}
                  className="w-full h-10 rounded-md border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground pl-10 pr-10 outline-none focus-visible:ring-2 focus-visible:ring-ring transition"
                />
                {query.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setOpen(false);
                      setActiveIndex(-1);
                    }}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <SearchX className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {open && (
                <div
                  id={listboxId}
                  role="listbox"
                  aria-label="Search suggestions"
                  className="absolute left-0 right-0 top-full mt-2 rounded-md border border-border bg-popover shadow-sm overflow-hidden"
                >
                  {suggestions.length > 0 ? (
                    <ul className="max-h-80 overflow-y-auto py-1">
                      {suggestions.map((item, idx) => {
                        const isActive = idx === activeIndex;
                        return (
                          <li key={item.id} role="option" aria-selected={isActive}>
                            <button
                              type="button"
                              onMouseEnter={() => setActiveIndex(idx)}
                              onMouseLeave={() => setActiveIndex(-1)}
                              onClick={() => selectItem(item)}
                              className={[
                                "w-full text-left px-3 py-2 flex items-center justify-between gap-3",
                                "transition",
                                isActive
                                  ? "bg-muted"
                                  : "hover:bg-muted focus:bg-muted",
                              ].join(" ")}
                            >
                              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                                {item.name}
                              </span>
                              <span className="shrink-0 inline-flex items-center rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-[11px] font-medium">
                                {item.category}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="p-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <SearchX className="h-4 w-4" aria-hidden="true" />
                      <span className="min-w-0 break-words">
                        No results for "{query}"
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}