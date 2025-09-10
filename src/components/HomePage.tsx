"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { LayoutGrid, Grid3x3, Proportions, Columns3, TabletSmartphone } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Calculator = {
  id: string;
  name: string;
  description: string;
  category: string;
  slug?: string;
};

type HomePageProps = {
  calculators: Calculator[];
  categories?: string[];
  defaultCategory?: string;
  isLoading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onSelect?: (calculator: Calculator) => void;
  // Optional: if you have known routes, return a valid href for a slug; otherwise leave undefined.
  getHref?: (calculator: Calculator) => string | undefined;
};

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  "Date & Time": <Grid3x3 className="size-3.5" aria-hidden="true" />,
  "Housing/Building": <Columns3 className="size-3.5" aria-hidden="true" />,
  "Measurements/Units": <Proportions className="size-3.5" aria-hidden="true" />,
};

function getCategoryIcon(category: string) {
  return CATEGORY_ICON_MAP[category] ?? <LayoutGrid className="size-3.5" aria-hidden="true" />;
}

export default function HomePage({
  calculators,
  categories,
  defaultCategory = "All",
  isLoading = false,
  className,
  style,
  onSelect,
  getHref,
}: HomePageProps) {
  const derivedCategories = useMemo(() => {
    const set = new Set<string>(calculators.map((c) => c.category));
    const list = Array.from(set).sort((a, b) => a.localeCompare(b));
    return ["All", ...list];
  }, [calculators]);

  const availableCategories = categories && categories.length > 0 ? ["All", ...categories.filter(Boolean)] : derivedCategories;

  const [activeCategory, setActiveCategory] = useState<string>(
    availableCategories.includes(defaultCategory) ? defaultCategory : "All",
  );

  const filtered = useMemo(() => {
    if (activeCategory === "All") return calculators;
    return calculators.filter((c) => c.category === activeCategory);
  }, [calculators, activeCategory]);

  // Layout animation delay per-card for subtle cascade
  const getDelayMs = (index: number) => Math.min(index * 30, 180);

  return (
    <section
      className={["w-full max-w-full", className].filter(Boolean).join(" ")}
      style={style}
      aria-labelledby="home-hero-title"
    >
      {/* Hero */}
      <div className="w-full max-w-full rounded-[var(--radius)] bg-card shadow-sm ring-1 ring-border">
        <div className="flex flex-col gap-4 p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-accent text-accent-foreground p-2.5">
              <TabletSmartphone className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1
                id="home-hero-title"
                className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground"
              >
                Welcome to All-in-One Calculators
              </h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                A growing collection of precise, user-friendly calculators. Explore by category or dive right in.
              </p>
            </div>
          </div>
          {/* Filters */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {availableCategories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <Button
                  key={cat}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveCategory(cat)}
                  variant={active ? "default" : "secondary"}
                  className={[
                    "h-9 rounded-full transition-colors",
                    active
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  <span className="sr-only">Filter:</span>
                  <span className="inline-flex items-center gap-2">
                    {cat !== "All" ? getCategoryIcon(cat) : <LayoutGrid className="size-3.5" aria-hidden="true" />}
                    <span className="text-sm">{cat}</span>
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div
        className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
        role="list"
        aria-live="polite"
        aria-busy={isLoading}
      >
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card
                key={`skeleton-${i}`}
                className="bg-card ring-1 ring-border shadow-sm"
                aria-hidden="true"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-3/4 rounded" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-5/6 rounded" />
                </CardContent>
              </Card>
            ))
          : filtered.map((calc, idx) => {
              const href = getHref ? getHref(calc) : undefined;
              const content = (
                <Card
                  role="listitem"
                  key={calc.id}
                  className="group bg-card ring-1 ring-border shadow-sm hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-primary"
                  style={{ transitionDelay: `${getDelayMs(idx)}ms` }}
                >
                  <div className="flex h-full flex-col">
                    <CardHeader className="flex-0">
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant="secondary"
                          className="inline-flex items-center gap-1.5 rounded-full bg-accent text-accent-foreground"
                        >
                          {getCategoryIcon(calc.category)}
                          <span className="text-xs font-medium">{calc.category}</span>
                        </Badge>
                        <div className="text-muted-foreground">
                          <Grid3x3 className="size-4 opacity-70" aria-hidden="true" />
                        </div>
                      </div>
                      <CardTitle className="mt-2 text-base sm:text-lg leading-snug break-words">
                        {calc.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {calc.description}
                      </p>
                      <div className="mt-4">
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full justify-center bg-secondary hover:bg-muted transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            if (onSelect) onSelect(calc);
                          }}
                        >
                          Open calculator
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );

              // Provide click-to-navigate via Link only if a valid href is supplied
              if (href) {
                return (
                  <Link
                    href={href}
                    key={calc.id}
                    className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[var(--radius)]"
                  >
                    {content}
                  </Link>
                );
              }

              // Otherwise keep it as a focusable card with button action
              return (
                <div
                  key={calc.id}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[var(--radius)]"
                >
                  {content}
                </div>
              );
            })}
      </div>

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="mt-8 rounded-[var(--radius)] bg-card ring-1 ring-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No calculators found for this category.</p>
        </div>
      )}
    </section>
  );
}