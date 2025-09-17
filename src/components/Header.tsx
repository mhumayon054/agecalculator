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
  const [openMenu, setOpenMenu] = useState(false);
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
  className={`fixed inset-x-0 top-0 z-50 bg-card border-b border-border web-header ${className || ""}`}
  style={style}
  role="banner"
>
  <div className="container w-full max-w-full">
    {/* parent flex lg screens: row, sm/mobile: column */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rows-mobile-class">
      
      {/* Row 1 - Logo + Menu Button */}
      <div className="flex items-center justify-between w-full md:w-auto">
        <Link
          href="/"
          className="shrink-0 text-base sm:text-lg md:text-xl font-semibold tracking-tight text-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 rounded-md"
          aria-label="Go to homepage"
        >
          All-in-One Calculators
        </Link>

        <button
          type="button"
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 active:scale-[0.98] transition"
          aria-label="Toggle menu"
          onClick={() => setOpenMenu((prev) => !prev)}
        >
          <Menu className="h-5 w-5 text-foreground" aria-hidden="true" />
        </button>
      </div>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-6 text-sm justify-center flex-1">
        <Link href="/" className="hover:opacity-90">Home</Link>
        <Link href="/blog" className="hover:opacity-90">Blogs</Link>
        <Link href="/contact" className="hover:opacity-90">Contact</Link>
        <Link href="/about" className="hover:opacity-90">About</Link>
        <Link href="/terms" className="hover:opacity-90">Terms & Conditions</Link>
        <Link href="/privacy-policy" className="hover:opacity-90">Privacy Policy</Link>
      </nav>

      {/* Row 2 (on mobile) OR Right side (desktop) - Searchbar */}
      <div className="w-full md:w-auto md:flex-1">
        <div
  ref={containerRef}
  className="relative w-full min-w-0 md:max-w-[28rem]"
>
          <div className="relative">
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
              className="w-full h-10 rounded-md border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground pl-10 pr-10 outline-none focus-visible:ring-2 focus-visible:ring-ring transition"
            />
          </div>
        </div>
      </div>
    </div>

    {/* Mobile Dropdown Menu */}
    {openMenu && (
      <div className="md:hidden mt-2 mb-2 rounded-md border border-border bg-popover shadow-sm p-2">
        <nav className="flex flex-col text-sm">
          <Link href="/" className="px-2 py-1.5 rounded hover:bg-muted">Home</Link>
          <Link href="/blog" className="px-2 py-1.5 rounded hover:bg-muted">Blogs</Link>
          <Link href="/contact" className="px-2 py-1.5 rounded hover:bg-muted">Contact</Link>
          <Link href="/about" className="px-2 py-1.5 rounded hover:bg-muted">About</Link>
          <Link href="/terms" className="px-2 py-1.5 rounded hover:bg-muted">Terms & Conditions</Link>
          <Link href="/privacy-policy" className="px-2 py-1.5 rounded hover:bg-muted">Privacy Policy</Link>
        </nav>
      </div>
    )}
  </div>
</header>

  );
}