"use client";

import React, { useMemo, useState } from "react";
import { AlarmClock, CircleGauge, Clock3, Ruler, Scaling, SquareEqual, SquarePi } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type ClassNameProps = {
  className?: string;
  style?: React.CSSProperties;
  layout?: "compact" | "full";
};

type GpaCourse = { id: string; letter: string; credits: number };
type GradeItem = { id: string; name: string; weightOrPoints: number; score: number; maxPoints?: number };
type Round = { id: string; score: number; rating: number; slope: number };
type ShoeRow = { us: number; uk: number; eu: number; cm: number };

const letterMaps: Record<string, Record<string, number>> = {
  "4.0": {
    A: 4.0,
    "A-": 3.7,
    "B+": 3.3,
    B: 3.0,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    "C-": 1.7,
    "D+": 1.3,
    D: 1.0,
    "D-": 0.7,
    F: 0.0,
  },
  "4.3": {
    "A+": 4.3,
    A: 4.0,
    "A-": 3.7,
    "B+": 3.3,
    B: 3.0,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    "C-": 1.7,
    "D+": 1.3,
    D: 1.0,
    "D-": 0.7,
    F: 0.0,
  },
  "5.0": {
    "A+": 5.0,
    A: 4.7,
    "A-": 4.3,
    "B+": 4.0,
    B: 3.7,
    "B-": 3.3,
    "C+": 3.0,
    C: 2.7,
    "C-": 2.3,
    "D+": 2.0,
    D: 1.7,
    "D-": 1.3,
    F: 0.0,
  },
};

const shoeTable: ShoeRow[] = [
  { us: 6, uk: 5.5, eu: 38.5, cm: 24.0 },
  { us: 7, uk: 6.5, eu: 40, cm: 25.0 },
  { us: 8, uk: 7.5, eu: 41, cm: 26.0 },
  { us: 9, uk: 8.5, eu: 42.5, cm: 27.0 },
  { us: 10, uk: 9.5, eu: 44, cm: 28.0 },
  { us: 11, uk: 10.5, eu: 45, cm: 28.6 },
  { us: 12, uk: 11.5, eu: 46.5, cm: 29.4 },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function UtilityCalculators({ className, style, layout = "full" }: ClassNameProps) {
  // GPA Calculator
  const [gpaScale, setGpaScale] = useState<"4.0" | "4.3" | "5.0">("4.0");
  const [gpaCourses, setGpaCourses] = useState<GpaCourse[]>([
    { id: uid(), letter: "A", credits: 3 },
  ]);

  const gpaLetters = useMemo(() => Object.keys(letterMaps[gpaScale]), [gpaScale]);

  const gpaResult = useMemo(() => {
    const map = letterMaps[gpaScale];
    let totalPts = 0;
    let totalCred = 0;
    for (const c of gpaCourses) {
      const pts = map[c.letter] ?? 0;
      if (c.credits > 0) {
        totalPts += pts * c.credits;
        totalCred += c.credits;
      }
    }
    const gpa = totalCred > 0 ? totalPts / totalCred : 0;
    return { gpa: Number.isFinite(gpa) ? gpa : 0, totalCred };
  }, [gpaScale, gpaCourses]);

  function updateCourse(id: string, patch: Partial<GpaCourse>) {
    setGpaCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  // Grade Calculator
  const [gradeMode, setGradeMode] = useState<"weighted" | "points">("weighted");
  const [gradeItems, setGradeItems] = useState<GradeItem[]>([
    { id: uid(), name: "Homework", weightOrPoints: 20, score: 92 },
    { id: uid(), name: "Quizzes", weightOrPoints: 30, score: 88 },
  ]);
  const [targetGrade, setTargetGrade] = useState<number>(90);
  const [finalWeight, setFinalWeight] = useState<number>(30); // percent of final in weighted mode

  const currentGrade = useMemo(() => {
    if (gradeMode === "weighted") {
      const totalWeights = gradeItems.reduce((s, it) => s + Math.max(0, it.weightOrPoints), 0);
      if (totalWeights <= 0) return 0;
      const weighted = gradeItems.reduce((s, it) => s + (Math.max(0, it.weightOrPoints) / totalWeights) * Math.max(0, Math.min(100, it.score)), 0);
      return weighted;
    } else {
      // points mode
      const totalEarned = gradeItems.reduce((s, it) => s + Math.max(0, it.score), 0);
      const totalPossible = gradeItems.reduce((s, it) => s + Math.max(0, it.maxPoints ?? 0), 0);
      return totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
    }
  }, [gradeMode, gradeItems]);

  const requiredFinal = useMemo(() => {
    if (gradeMode !== "weighted") return null;
    const wFinal = Math.max(0, Math.min(100, finalWeight));
    const wCurrent = 100 - wFinal;
    const needed = wCurrent > 0 ? (targetGrade - (currentGrade * wCurrent) / 100) / (wFinal / 100) : targetGrade;
    return Math.max(0, Math.min(100, Number.isFinite(needed) ? needed : 0));
  }, [gradeMode, finalWeight, currentGrade, targetGrade]);

  function updateGradeItem(id: string, patch: Partial<GradeItem>) {
    setGradeItems((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  // Bra Size Calculator
  const [unitBra, setUnitBra] = useState<"in" | "cm">("in");
  const [underbust, setUnderbust] = useState<number>(32);
  const [bust, setBust] = useState<number>(36);

  const braResult = useMemo(() => {
    if (underbust <= 0 || bust <= 0) return null;
    if (unitBra === "in") {
      const band = Math.round(underbust / 2) * 2; // even band size rounding
      const diff = Math.max(0, bust - underbust);
      const cupIndex = Math.round(diff / 1); // 1" per cup step
      const cups = ["AA", "A", "B", "C", "D", "DD", "DDD/F", "G", "H", "I", "J"];
      const cup = cups[Math.min(cups.length - 1, Math.max(0, cupIndex))];
      return { band, cup, label: `${band}${cup}` };
    } else {
      const band = Math.round(underbust); // EU band is underbust cm rounded
      const diff = Math.max(0, bust - underbust);
      // Approx: each 2.54 cm ~ 1 cup step
      const cupIndex = Math.round(diff / 2.54);
      const cups = ["AA", "A", "B", "C", "D", "E", "F", "G", "H"];
      const cup = cups[Math.min(cups.length - 1, Math.max(0, cupIndex))];
      return { band, cup, label: `${band}${cup}` };
    }
  }, [unitBra, underbust, bust]);

  // Shoe Size Conversion
  const [shoeInput, setShoeInput] = useState<number>(9);
  const [shoeSystem, setShoeSystem] = useState<"US" | "UK" | "EU" | "CM">("US");
  const shoeMatch = useMemo(() => {
    if (!Number.isFinite(shoeInput)) return null;
    // find nearest by selected system
    let best = shoeTable[0];
    let bestDelta = Infinity;
    for (const row of shoeTable) {
      const val =
        shoeSystem === "US" ? row.us : shoeSystem === "UK" ? row.uk : shoeSystem === "EU" ? row.eu : row.cm;
      const d = Math.abs(val - shoeInput);
      if (d < bestDelta) {
        best = row;
        bestDelta = d;
      }
    }
    return best;
  }, [shoeInput, shoeSystem]);

  // Tip Calculator
  const [bill, setBill] = useState<number>(64.5);
  const [tipPct, setTipPct] = useState<number>(18);
  const [people, setPeople] = useState<number>(2);
  const tipCalc = useMemo(() => {
    const amt = Math.max(0, bill);
    const pct = Math.max(0, Math.min(100, tipPct));
    const split = Math.max(1, Math.floor(people));
    const tip = (amt * pct) / 100;
    const total = amt + tip;
    return {
      tip,
      total,
      perPerson: total / split,
      tipPerPerson: tip / split,
    };
  }, [bill, tipPct, people]);

  // Golf Handicap (USGA/WHS)
  const [rounds, setRounds] = useState<Round[]>([
    { id: uid(), score: 88, rating: 71.2, slope: 125 },
  ]);

  const handicapIndex = useMemo(() => {
    // Differential = (Score - Rating) * 113 / Slope
    const diffs = rounds
      .map((r) => ((r.score - r.rating) * 113) / r.slope)
      .filter((d) => Number.isFinite(d))
      .sort((a, b) => a - b);

    const n = diffs.length;
    if (n < 3) return null;

    // WHS selection table (simplified; includes initial adjustments per USGA)
    // 3: lowest 1 -2.0; 4: lowest 1 -1.0; 5: lowest 1; 6: lowest 2; 7-8: lowest 2;
    // 9-11: lowest 3; 12-14: lowest 4; 15-16: lowest 5; 17-18: lowest 6; 19: lowest 7; 20: lowest 8
    let count = 1;
    let adjustment = 0;
    if (n === 3) {
      count = 1;
      adjustment = -2;
    } else if (n === 4) {
      count = 1;
      adjustment = -1;
    } else if (n === 5) count = 1;
    else if (n === 6) count = 2;
    else if (n <= 8) count = 2;
    else if (n <= 11) count = 3;
    else if (n <= 14) count = 4;
    else if (n <= 16) count = 5;
    else if (n <= 18) count = 6;
    else if (n === 19) count = 7;
    else count = 8;

    const selected = diffs.slice(0, count);
    const avg = selected.reduce((s, d) => s + d, 0) / selected.length;
    // USGA legacy used 0.96 multiplier; WHS does not. We'll follow WHS (no 0.96).
    let index = avg + adjustment;
    if (!Number.isFinite(index)) return null;
    return Math.max(-5.0, parseFloat(index.toFixed(1)));
  }, [rounds]);

  function updateRound(id: string, patch: Partial<Round>) {
    setRounds((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  // Sleep Calculator
  const [sleepMode, setSleepMode] = useState<"wake" | "sleep">("wake");
  const [timeInput, setTimeInput] = useState<string>("07:00");
  const cycles = [6, 5, 4]; // show top recommended 6,5,4 cycles
  const fallAsleepBufferMin = 15;
  function parseTimeToMinutes(t: string) {
    const [hh, mm] = t.split(":").map((x) => parseInt(x, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    return hh * 60 + mm;
  }
  function minutesToTime(min: number) {
    const m = ((min % (24 * 60)) + 24 * 60) % (24 * 60);
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }
  const sleepResults = useMemo(() => {
    const base = parseTimeToMinutes(timeInput);
    if (base == null) return [];
    const list: { label: string; time: string }[] = [];
    for (const c of cycles) {
      const mins = 90 * c;
      if (sleepMode === "wake") {
        const bedtime = base - mins - fallAsleepBufferMin;
        list.push({ label: `${c} cycles`, time: minutesToTime(bedtime) });
      } else {
        const wake = base + mins + fallAsleepBufferMin;
        list.push({ label: `${c} cycles`, time: minutesToTime(wake) });
      }
    }
    return list;
  }, [timeInput, sleepMode]);

  const sectionGap = layout === "compact" ? "gap-4" : "gap-6";
  const cardPad = layout === "compact" ? "p-4" : "p-6";

  return (
    <div className={["w-full max-w-full", className].filter(Boolean).join(" ")} style={style}>
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <SquareEqual className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-lg sm:text-xl md:text-2xl">Everyday Utility Calculators</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Quick, accurate tools for school, sizing, dining, golf, and better sleep.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="gpa" className="w-full">
            <div className="overflow-x-auto">
              <TabsList className="min-w-max">
                <TabsTrigger value="gpa" aria-label="GPA Calculator">
                  <SquarePi className="mr-2 h-4 w-4" aria-hidden="true" />
                  GPA
                </TabsTrigger>
                <TabsTrigger value="grade" aria-label="Grade Calculator">
                  <SquareEqual className="mr-2 h-4 w-4" aria-hidden="true" />
                  Grade
                </TabsTrigger>
                <TabsTrigger value="bra" aria-label="Bra Size Calculator">
                  <Ruler className="mr-2 h-4 w-4" aria-hidden="true" />
                  Bra Size
                </TabsTrigger>
                <TabsTrigger value="shoe" aria-label="Shoe Size Conversion">
                  <Scaling className="mr-2 h-4 w-4" aria-hidden="true" />
                  Shoe Size
                </TabsTrigger>
                <TabsTrigger value="tip" aria-label="Tip Calculator">
                  <SquareEqual className="mr-2 h-4 w-4" aria-hidden="true" />
                  Tip
                </TabsTrigger>
                <TabsTrigger value="golf" aria-label="Golf Handicap Calculator">
                  <CircleGauge className="mr-2 h-4 w-4" aria-hidden="true" />
                  Handicap
                </TabsTrigger>
                <TabsTrigger value="sleep" aria-label="Sleep Calculator">
                  <AlarmClock className="mr-2 h-4 w-4" aria-hidden="true" />
                  Sleep
                </TabsTrigger>
              </TabsList>
            </div>

            {/* GPA Calculator */}
            <TabsContent value="gpa" className="mt-6">
              <div className={["w-full", sectionGap].join(" ")}>
                <div className={["grid grid-cols-1 sm:grid-cols-2 gap-4", cardPad].join(" ") + " rounded-lg bg-secondary"}>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="gpa-scale">Grading Scale</Label>
                    <Select
                      onValueChange={(v) => setGpaScale(v as "4.0" | "4.3" | "5.0")}
                      value={gpaScale}
                    >
                      <SelectTrigger id="gpa-scale" className="bg-card">
                        <SelectValue placeholder="Select scale" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4.0">4.0</SelectItem>
                        <SelectItem value="4.3">4.3</SelectItem>
                        <SelectItem value="5.0">5.0</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="default"
                      className="ml-auto"
                      onClick={() =>
                        setGpaCourses((p) => [
                          ...p,
                          { id: uid(), letter: gpaLetters[0] ?? "A", credits: 3 },
                        ])
                      }
                    >
                      Add Course
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {gpaCourses.map((c, idx) => (
                    <div
                      key={c.id}
                      className="w-full bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row gap-3"
                    >
                      <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex flex-col gap-2">
                          <Label>Course {idx + 1} Grade</Label>
                          <Select
                            onValueChange={(v) => updateCourse(c.id, { letter: v })}
                            value={c.letter}
                          >
                            <SelectTrigger className="bg-secondary">
                              <SelectValue placeholder="Letter grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {gpaLetters.map((l) => (
                                <SelectItem key={l} value={l}>
                                  {l}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`credits-${c.id}`}>Credit Hours</Label>
                          <Input
                            id={`credits-${c.id}`}
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.5"
                            className="bg-secondary"
                            value={c.credits}
                            onChange={(e) =>
                              updateCourse(c.id, { credits: Number(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="destructive"
                            onClick={() => setGpaCourses((p) => p.filter((x) => x.id !== c.id))}
                            disabled={gpaCourses.length <= 1}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="rounded-lg bg-secondary p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Credits</p>
                    <p className="text-xl font-semibold">{gpaResult.totalCred}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Computed GPA ({gpaScale})</p>
                    <p className="text-2xl font-bold text-primary">{gpaResult.gpa.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Grade Calculator */}
            <TabsContent value="grade" className="mt-6">
              <div className={["w-full", sectionGap].join(" ")}>
                <div className={["grid grid-cols-1 sm:grid-cols-3 gap-4", cardPad].join(" ") + " rounded-lg bg-secondary"}>
                  <div className="flex flex-col gap-2">
                    <Label>Mode</Label>
                    <Select
                      value={gradeMode}
                      onValueChange={(v) => setGradeMode(v as "weighted" | "points")}
                    >
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Select grade mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weighted">Percent Weighted</SelectItem>
                        <SelectItem value="points">Points</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {gradeMode === "weighted" && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="final-weight">Final Exam Weight (%)</Label>
                        <Input
                          id="final-weight"
                          className="bg-card"
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={100}
                          step="1"
                          value={finalWeight}
                          onChange={(e) => setFinalWeight(Number(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="target-grade">Target Final Grade (%)</Label>
                        <Input
                          id="target-grade"
                          className="bg-card"
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={100}
                          step="1"
                          value={targetGrade}
                          onChange={(e) => setTargetGrade(Number(e.target.value) || 0)}
                        />
                      </div>
                    </>
                  )}
                  <div className="flex items-end">
                    <Button
                      className="ml-auto"
                      onClick={() =>
                        setGradeItems((p) => [
                          ...p,
                          gradeMode === "weighted"
                            ? { id: uid(), name: "Item", weightOrPoints: 10, score: 90 }
                            : { id: uid(), name: "Item", weightOrPoints: 0, score: 8, maxPoints: 10 },
                        ])
                      }
                    >
                      Add Item
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {gradeItems.map((it, idx) => (
                    <div key={it.id} className="bg-card border border-border rounded-lg p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`gname-${it.id}`}>Name</Label>
                          <Input
                            id={`gname-${it.id}`}
                            className="bg-secondary"
                            value={it.name}
                            onChange={(e) => updateGradeItem(it.id, { name: e.target.value })}
                          />
                        </div>
                        {gradeMode === "weighted" ? (
                          <div className="flex flex-col gap-2">
                            <Label htmlFor={`gweight-${it.id}`}>Weight (%)</Label>
                            <Input
                              id={`gweight-${it.id}`}
                              type="number"
                              inputMode="decimal"
                              min={0}
                              max={100}
                              step="0.5"
                              className="bg-secondary"
                              value={it.weightOrPoints}
                              onChange={(e) =>
                                updateGradeItem(it.id, { weightOrPoints: Number(e.target.value) || 0 })
                              }
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col gap-2">
                              <Label htmlFor={`gpoints-${it.id}`}>Points Earned</Label>
                              <Input
                                id={`gpoints-${it.id}`}
                                type="number"
                                inputMode="decimal"
                                min={0}
                                step="0.5"
                                className="bg-secondary"
                                value={it.score}
                                onChange={(e) =>
                                  updateGradeItem(it.id, { score: Number(e.target.value) || 0 })
                                }
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label htmlFor={`gmax-${it.id}`}>Points Possible</Label>
                              <Input
                                id={`gmax-${it.id}`}
                                type="number"
                                inputMode="decimal"
                                min={0}
                                step="0.5"
                                className="bg-secondary"
                                value={it.maxPoints ?? 0}
                                onChange={(e) =>
                                  updateGradeItem(it.id, { maxPoints: Number(e.target.value) || 0 })
                                }
                              />
                            </div>
                          </>
                        )}
                        {gradeMode === "weighted" && (
                          <div className="flex flex-col gap-2">
                            <Label htmlFor={`gscore-${it.id}`}>Score (%)</Label>
                            <Input
                              id={`gscore-${it.id}`}
                              type="number"
                              inputMode="decimal"
                              min={0}
                              max={100}
                              step="0.5"
                              className="bg-secondary"
                              value={it.score}
                              onChange={(e) =>
                                updateGradeItem(it.id, { score: Number(e.target.value) || 0 })
                              }
                            />
                          </div>
                        )}
                        <div className="flex items-end">
                          <Button
                            variant="destructive"
                            onClick={() => setGradeItems((p) => p.filter((x) => x.id !== it.id))}
                            disabled={gradeItems.length <= 1}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-secondary p-4">
                    <p className="text-sm text-muted-foreground">Current Grade</p>
                    <p className="text-2xl font-bold text-primary">{currentGrade.toFixed(2)}%</p>
                  </div>
                  {gradeMode === "weighted" && (
                    <div className="rounded-lg bg-secondary p-4">
                      <p className="text-sm text-muted-foreground">Required on Final</p>
                      <p className="text-2xl font-bold">
                        {requiredFinal !== null ? `${requiredFinal.toFixed(2)}%` : "—"}
                      </p>
                    </div>
                  )}
                  <div className="rounded-lg bg-secondary p-4">
                    <p className="text-sm text-muted-foreground">System</p>
                    <p className="text-lg">{
                      gradeMode === "weighted" ? "Weighted Percentages" : "Total Points"
                    }</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Bra Size Calculator */}
            <TabsContent value="bra" className="mt-6">
              <div className={["w-full", sectionGap].join(" ")}>
                <div className={["grid grid-cols-1 sm:grid-cols-3 gap-4", cardPad].join(" ") + " rounded-lg bg-secondary"}>
                  <div className="flex flex-col gap-2">
                    <Label>Unit</Label>
                    <Select value={unitBra} onValueChange={(v) => setUnitBra(v as "in" | "cm")}>
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">Inches</SelectItem>
                        <SelectItem value="cm">Centimeters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="underbust">Underbust ({unitBra})</Label>
                    <Input
                      id="underbust"
                      className="bg-card"
                      type="number"
                      inputMode="decimal"
                      min={20}
                      step="0.5"
                      value={underbust}
                      onChange={(e) => setUnderbust(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="bust">Bust ({unitBra})</Label>
                    <Input
                      id="bust"
                      className="bg-card"
                      type="number"
                      inputMode="decimal"
                      min={20}
                      step="0.5"
                      value={bust}
                      onChange={(e) => setBust(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-secondary p-4">
                  <p className="text-sm text-muted-foreground">Estimated Size</p>
                  <p className="text-2xl font-bold text-primary">{braResult ? braResult.label : "—"}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Guide: Measure underbust snugly for band size. Measure bust at fullest point.
                    For inches, each 1" difference approximates one cup. Sizes vary by brand.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="font-semibold mb-2">Conversion Reference</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div className="p-2 rounded bg-secondary">
                      <p className="text-muted-foreground">US</p>
                      <p>Band (in): even number near underbust</p>
                    </div>
                    <div className="p-2 rounded bg-secondary">
                      <p className="text-muted-foreground">UK</p>
                      <p>Cups: AA, A, B, C, D, DD, E, F...</p>
                    </div>
                    <div className="p-2 rounded bg-secondary">
                      <p className="text-muted-foreground">EU</p>
                      <p>Band equals underbust in cm</p>
                    </div>
                    <div className="p-2 rounded bg-secondary">
                      <p className="text-muted-foreground">General Tip</p>
                      <p>Try sister sizes if fit is tight/loose</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Shoe Size Conversion */}
            <TabsContent value="shoe" className="mt-6">
              <div className={["w-full", sectionGap].join(" ")}>
                <div className={["grid grid-cols-1 sm:grid-cols-3 gap-4", cardPad].join(" ") + " rounded-lg bg-secondary"}>
                  <div className="flex flex-col gap-2">
                    <Label>Input System</Label>
                    <Select
                      value={shoeSystem}
                      onValueChange={(v) => setShoeSystem(v as "US" | "UK" | "EU" | "CM")}
                    >
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Select system" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">US</SelectItem>
                        <SelectItem value="UK">UK</SelectItem>
                        <SelectItem value="EU">EU</SelectItem>
                        <SelectItem value="CM">CM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="shoeVal">Value</Label>
                    <Input
                      id="shoeVal"
                      className="bg-card"
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      value={shoeInput}
                      onChange={(e) => setShoeInput(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="ml-auto rounded bg-card border border-border px-3 py-2">
                      <p className="text-sm text-muted-foreground">Nearest Match</p>
                      <p className="font-semibold">
                        {shoeMatch
                          ? `US ${shoeMatch.us} • UK ${shoeMatch.uk} • EU ${shoeMatch.eu} • ${shoeMatch.cm} cm`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4 overflow-x-auto">
                  <p className="font-semibold mb-3">Common Conversions</p>
                  <div className="min-w-[560px] grid grid-cols-8 gap-2 text-sm">
                    <div className="font-semibold p-2 bg-secondary rounded">US</div>
                    {shoeTable.map((r, i) => (
                      <div key={`us-${i}`} className="p-2 bg-secondary rounded">
                        {r.us}
                      </div>
                    ))}
                    <div className="font-semibold p-2 bg-secondary rounded">UK</div>
                    {shoeTable.map((r, i) => (
                      <div key={`uk-${i}`} className="p-2 bg-secondary rounded">
                        {r.uk}
                      </div>
                    ))}
                    <div className="font-semibold p-2 bg-secondary rounded">EU</div>
                    {shoeTable.map((r, i) => (
                      <div key={`eu-${i}`} className="p-2 bg-secondary rounded">
                        {r.eu}
                      </div>
                    ))}
                    <div className="font-semibold p-2 bg-secondary rounded">CM</div>
                    {shoeTable.map((r, i) => (
                      <div key={`cm-${i}`} className="p-2 bg-secondary rounded">
                        {r.cm}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Note: Sizing varies by brand and last. Measure foot length (heel to longest toe) in cm for best match.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Tip Calculator */}
            <TabsContent value="tip" className="mt-6">
              <div className={["w-full", sectionGap].join(" ")}>
                <div className={["grid grid-cols-1 sm:grid-cols-4 gap-4", cardPad].join(" ") + " rounded-lg bg-secondary"}>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="bill">Bill Amount</Label>
                    <Input
                      id="bill"
                      className="bg-card"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={bill}
                      onChange={(e) => setBill(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tipPct">Tip (%)</Label>
                    <Input
                      id="tipPct"
                      className="bg-card"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={100}
                      step="1"
                      value={tipPct}
                      onChange={(e) => setTipPct(Number(e.target.value) || 0)}
                    />
                    <div className="flex flex-wrap gap-2">
                      {[10, 15, 18, 20].map((p) => (
                        <Button key={p} variant="secondary" type="button" onClick={() => setTipPct(p)}>
                          {p}%
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="people">People</Label>
                    <Input
                      id="people"
                      className="bg-card"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step="1"
                      value={people}
                      onChange={(e) => setPeople(Number(e.target.value) || 1)}
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="ml-auto rounded bg-card border border-border px-3 py-2">
                      <p className="text-sm text-muted-foreground">Quick Split</p>
                      <div className="flex gap-2 mt-1">
                        {[2, 3, 4, 5, 6].map((n) => (
                          <Button
                            key={n}
                            size="sm"
                            variant={people === n ? "default" : "secondary"}
                            onClick={() => setPeople(n)}
                          >
                            {n}x
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="rounded-lg bg-secondary p-4">
                    <p className="text-sm text-muted-foreground">Tip</p>
                    <p className="text-2xl font-bold text-primary">${tipCalc.tip.toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-4">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">${tipCalc.total.toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-4">
                    <p className="text-sm text-muted-foreground">Per Person</p>
                    <p className="text-2xl font-bold">${tipCalc.perPerson.toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-4">
                    <p className="text-sm text-muted-foreground">Tip / Person</p>
                    <p className="text-2xl font-bold">${tipCalc.tipPerPerson.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Golf Handicap Calculator */}
            <TabsContent value="golf" className="mt-6">
              <div className={["w-full", sectionGap].join(" ")}>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Enter recent rounds (Score, Course Rating, Slope). Uses WHS selection of best differentials.
                  </p>
                  <Button
                    onClick={() =>
                      setRounds((p) => [...p, { id: uid(), score: 90, rating: 72, slope: 113 }])
                    }
                  >
                    Add Round
                  </Button>
                </div>

                <div className="flex flex-col gap-3">
                  {rounds.map((r, idx) => (
                    <div key={r.id} className="bg-card border border-border rounded-lg p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
                        <div className="sm:col-span-1 flex items-center">
                          <span className="text-sm text-muted-foreground">Round {idx + 1}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`score-${r.id}`}>Score</Label>
                          <Input
                            id={`score-${r.id}`}
                            className="bg-secondary"
                            type="number"
                            inputMode="numeric"
                            min={40}
                            max={200}
                            step="1"
                            value={r.score}
                            onChange={(e) => updateRound(r.id, { score: Number(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`rating-${r.id}`}>Course Rating</Label>
                          <Input
                            id={`rating-${r.id}`}
                            className="bg-secondary"
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            value={r.rating}
                            onChange={(e) => updateRound(r.id, { rating: Number(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`slope-${r.id}`}>Slope</Label>
                          <Input
                            id={`slope-${r.id}`}
                            className="bg-secondary"
                            type="number"
                            inputMode="numeric"
                            min={55}
                            max={155}
                            step="1"
                            value={r.slope}
                            onChange={(e) => updateRound(r.id, { slope: Number(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="sm:col-span-2 self-end">
                          <p className="text-sm text-muted-foreground leading-none mb-1">
                            Differential
                          </p>
                          <p className="font-semibold">
                            {Number.isFinite(((r.score - r.rating) * 113) / r.slope)
                              ? (((r.score - r.rating) * 113) / r.slope).toFixed(1)
                              : "—"}
                          </p>
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="destructive"
                            onClick={() => setRounds((p) => p.filter((x) => x.id !== r.id))}
                            disabled={rounds.length <= 1}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-secondary p-4">
                  <p className="text-sm text-muted-foreground">Handicap Index</p>
                  <p className="text-2xl font-bold text-primary">
                    {handicapIndex !== null ? handicapIndex.toFixed(1) : "Need ≥ 3 rounds"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Selection: 3→best 1 (−2), 4→best 1 (−1), 5→1, 6→2, 7–8→2, 9–11→3, 12–14→4, 15–16→5, 17–18→6, 19→7, 20→8.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Sleep Calculator */}
            <TabsContent value="sleep" className="mt-6">
              <div className={["w-full", sectionGap].join(" ")}>
                <div className={["grid grid-cols-1 sm:grid-cols-3 gap-4", cardPad].join(" ") + " rounded-lg bg-secondary"}>
                  <div className="flex flex-col gap-2">
                    <Label>Mode</Label>
                    <Select value={sleepMode} onValueChange={(v) => setSleepMode(v as "wake" | "sleep")}>
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wake">I need to wake up at...</SelectItem>
                        <SelectItem value="sleep">I plan to fall asleep at...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="time">Time (24h)</Label>
                    <Input
                      id="time"
                      className="bg-card"
                      type="time"
                      step={60}
                      value={timeInput}
                      onChange={(e) => setTimeInput(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="ml-auto rounded bg-card border border-border px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
                        <p className="text-sm">90-min cycles + 15m to fall asleep</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {sleepResults.map((r, i) => (
                    <div key={i} className="rounded-lg bg-secondary p-4">
                      <p className="text-sm text-muted-foreground">{r.label}</p>
                      <p className="text-2xl font-bold text-primary">{r.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}