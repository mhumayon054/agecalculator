"use client";

import React, { useCallback, useMemo, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import HomePage from "@/components/HomePage";
import DateTimeCalculators from "@/components/calculators/DateTimeCalculators";
import HousingCalculators from "@/components/calculators/HousingCalculators";
import MeasurementCalculators from "@/components/calculators/MeasurementCalculators";
import ElectronicsCalculators from "@/components/calculators/ElectronicsCalculators";
import InternetCalculators from "@/components/calculators/InternetCalculators";
import UtilityCalculators from "@/components/calculators/UtilityCalculators";
import WeatherCalculators from "@/components/calculators/WeatherCalculators";
import TransportationCalculators from "@/components/calculators/TransportationCalculators";
import EntertainmentCalculators from "@/components/calculators/EntertainmentCalculators";
import Footer from "@/components/Footer";

type CalcCard = {
  id: string;
  name: string;
  description: string;
  category: string;
  slug: string;
};

type Category = {
  id: string;
  name: string;
  calculators: { id: string; name: string; slug: string }[];
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Page() {
  // Catalog of calculator suites (each card opens a suite component)
  const calculators: CalcCard[] = useMemo(
    () => [
      {
        id: "dt",
        name: "Date & Time Suite",
        description:
          "Age, date math, time differences, time cards, time zones, and more.",
        category: "Date & Time",
        slug: "date-time",
      },
      {
        id: "housing",
        name: "Housing & Building",
        description:
          "Concrete, roofing, square footage, stairs, tile, mulch, gravel, and BTU.",
        category: "Housing/Building",
        slug: "housing",
      },
      {
        id: "measure",
        name: "Measurements & Units",
        description:
          "Unit conversions, height, GDP, density, mass/weight, speed, molarity, molecular weight, and Roman numerals.",
        category: "Measurements/Units",
        slug: "measurements",
      },
      {
        id: "electronics",
        name: "Electronics & Circuits",
        description:
          "Ohm's law, voltage drop, resistor color codes, power and energy.",
        category: "Engineering",
        slug: "electronics",
      },
      {
        id: "internet",
        name: "Internet & Networking",
        description:
          "IP subnet calculator, secure password generator, and bandwidth transfer time.",
        category: "Technology",
        slug: "internet",
      },
      {
        id: "utilities",
        name: "Everyday Utilities",
        description:
          "GPA, grade planning, bra size, shoe size, tip split, golf handicap, and sleep cycles.",
        category: "Everyday",
        slug: "utilities",
      },
      {
        id: "weather",
        name: "Weather",
        description:
          "Heat index, wind chill, and dew point with safety guidance and unit selection.",
        category: "Environment",
        slug: "weather",
      },
      {
        id: "transport",
        name: "Transportation",
        description:
          "Fuel cost, gas mileage, horsepower, engine HP, mileage reimbursement, and tire size.",
        category: "Transportation",
        slug: "transport",
      },
      {
        id: "entertainment",
        name: "Entertainment",
        description:
          "Dice roller with stats and a lighthearted love calculator.",
        category: "Fun",
        slug: "entertainment",
      },
    ],
    []
  );

  const categories: Category[] = useMemo(() => {
    const map = new Map<string, { id: string; name: string; calculators: Category["calculators"] }>();
    for (const c of calculators) {
      if (!map.has(c.category)) {
        map.set(c.category, { id: c.category.toLowerCase().replace(/\s+/g, "-"), name: c.category, calculators: [] });
      }
      map.get(c.category)!.calculators.push({ id: c.id, name: c.name, slug: c.slug });
    }
    // Sort calculators within categories alphabetically
    for (const entry of map.values()) {
      entry.calculators.sort((a, b) => a.name.localeCompare(b.name));
    }
    // Sort categories alphabetically
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [calculators]);

  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSelectBySlug = useCallback((slug: string | null) => {
    setActiveSlug(slug);
    // Optionally scroll to top of content when switching
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleSidebarSelect = useCallback(
    (calc: { id: string; name: string; slug: string }) => {
      handleSelectBySlug(calc.slug);
      setSidebarOpen(false); // Close sidebar after selection on mobile
    },
    [handleSelectBySlug]
  );

  const handleHeaderSelect = useCallback(
    (item: { id: string; name: string; category: string; slug?: string }) => {
      handleSelectBySlug(item.slug ?? null);
    },
    [handleSelectBySlug]
  );

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const selectedCard = useMemo(
    () => calculators.find((c) => c.slug === activeSlug) || null,
    [calculators, activeSlug]
  );

  function renderActiveCalculator() {
    switch (activeSlug) {
      case "date-time":
        return <DateTimeCalculators />;
      case "housing":
        return <HousingCalculators />;
      case "measurements":
        return <MeasurementCalculators />;
      case "electronics":
        return <ElectronicsCalculators />;
      case "internet":
        return <InternetCalculators />;
      case "utilities":
        return <UtilityCalculators />;
      case "weather":
        return <WeatherCalculators />;
      case "transport":
        return <TransportationCalculators />;
      case "entertainment":
        return <EntertainmentCalculators />;
      default:
        return (
          <HomePage
            calculators={calculators}
            onSelect={(calc) => handleSelectBySlug(calc.slug ?? null)}
          />
        );
    }
  }

  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <Header
        calculators={calculators.map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category,
          slug: c.slug,
        }))}
        onSelectCalculator={handleHeaderSelect}
        onToggleSidebar={handleToggleSidebar}
      />

      <main className="pt-16">
        <section className="w-full max-w-full px-4 sm:px-4 md:px-6 py-0 sm:py-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-3">
              <Sidebar
                categories={categories}
                activeSlug={activeSlug ?? undefined}
                onSelect={handleSidebarSelect}
                defaultOpenCategories={categories.map((c) => c.id)}
                mobileTitle="Browse calculators"
                showMobileToggle={false} // This hides the mobile toggle button
                open={sidebarOpen} // Control sidebar open state
                onOpenChange={setSidebarOpen} // Control sidebar open state
              />
            </div>

            <div className="md:col-span-9 min-w-0">
              {/* Page-level card header for selected suite */}
              {selectedCard ? (
                <div className="mb-4 rounded-lg border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h1 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight">
                        {selectedCard.name}
                      </h1>
                      <p className="mt-1 text-sm text-muted-foreground break-words">
                        {selectedCard.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 h-9 rounded-md border px-3 text-sm bg-secondary hover:bg-muted transition"
                      onClick={() => handleSelectBySlug(null)}
                      aria-label="Back to all calculators"
                    >
                      All calculators
                    </button>
                  </div>
                </div>
              ) : null}

              {renderActiveCalculator()}
            </div>
          </div>
        </section>
      </main>

      <Footer
        totalCalculators={calculators.length}
        className="mt-8"
      />
    </div>
  );
}