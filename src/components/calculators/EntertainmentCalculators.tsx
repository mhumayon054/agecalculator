"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dices, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, MessageSquareHeart, ChartSpline, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type DiceConfig = {
  id: string;
  sides: number;
  count: number;
};

type RollEntry = {
  id: string;
  timestamp: number;
  configs: DiceConfig[];
  results: { sides: number; values: number[] }[];
  total: number;
};

type EntertainmentCalculatorsProps = {
  className?: string;
  style?: React.CSSProperties;
  defaultTab?: "dice" | "love";
};

const DICE_SIDES = [4, 6, 8, 10, 12, 20] as const;

const PRESETS: { label: string; icon?: React.ReactNode; configs: DiceConfig[] }[] = [
  { label: "Quick d20", icon: <Gamepad2 className="h-3.5 w-3.5" />, configs: [{ id: cryptoId(), sides: 20, count: 1 }] },
  { label: "2d6 Damage", configs: [{ id: cryptoId(), sides: 6, count: 2 }] },
  { label: "4d6 (drop lowest)", configs: [{ id: cryptoId(), sides: 6, count: 4 }] },
  { label: "3d8", configs: [{ id: cryptoId(), sides: 8, count: 3 }] },
  { label: "1d12 + 1d6", configs: [{ id: cryptoId(), sides: 12, count: 1 }, { id: cryptoId(), sides: 6, count: 1 }] },
];

function cryptoId() {
  return Math.random().toString(36).slice(2, 10);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}

function rollSingleDie(sides: number) {
  return Math.floor(Math.random() * sides) + 1;
}

function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
}

function diceIconFor(value: number) {
  const v = ((value - 1) % 6) + 1;
  const commonProps = "h-4 w-4";
  switch (v) {
    case 1:
      return <Dice1 className={commonProps} aria-hidden="true" />;
    case 2:
      return <Dice2 className={commonProps} aria-hidden="true" />;
    case 3:
      return <Dice3 className={commonProps} aria-hidden="true" />;
    case 4:
      return <Dice4 className={commonProps} aria-hidden="true" />;
    case 5:
      return <Dice5 className={commonProps} aria-hidden="true" />;
    default:
      return <Dice6 className={commonProps} aria-hidden="true" />;
  }
}

function progressColor(pct: number) {
  if (pct >= 80) return "bg-chart-2";
  if (pct >= 60) return "bg-chart-1";
  if (pct >= 40) return "bg-chart-3";
  if (pct >= 20) return "bg-chart-4";
  return "bg-chart-5";
}

function hashPercent(a: string, b: string) {
  const s = `${a.trim().toLowerCase()}|${b.trim().toLowerCase()}`;
  if (!s.trim()) return 0;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  // stable 0..100
  const pct = Math.abs(h % 101);
  return pct;
}

const funBlurb = (pct: number) => {
  if (pct >= 90) return "Cosmic connection! A legendary duo in the making.";
  if (pct >= 75) return "Sparkling synergy. Adventures await!";
  if (pct >= 60) return "Great match with room to grow.";
  if (pct >= 40) return "A curious pair—quirky but promising.";
  if (pct >= 20) return "Opposites attract? Give it a chance.";
  if (pct > 0) return "An unexpected combo—surprises ahead!";
  return "Enter names to discover your vibe!";
};

export default function EntertainmentCalculators({
  className,
  style,
  defaultTab = "dice",
}: EntertainmentCalculatorsProps) {
  const isClient = useIsClient();

  // Dice Roller State
  const [configs, setConfigs] = useState<DiceConfig[]>([{ id: cryptoId(), sides: 6, count: 1 }]);
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState<RollEntry[]>([]);
  const [recentTotals, setRecentTotals] = useState<number[]>([]); // sparkline
  const [dropLowest, setDropLowest] = useState(false); // for 4d6 drop lowest preset awareness

  const totalDiceCount = useMemo(() => configs.reduce((acc, c) => acc + c.count, 0), [configs]);

  const stats = useMemo(() => {
    const totals = history.map((h) => h.total);
    const totalRolls = totals.length;
    const average = totalRolls ? Math.round((sum(totals) / totalRolls) * 100) / 100 : 0;
    const best = totals.length ? Math.max(...totals) : 0;
    return { totalRolls, average, best };
  }, [history]);

  const setPreset = (preset: typeof PRESETS[number]) => {
    setConfigs(
      preset.configs.map((c) => ({
        id: cryptoId(),
        sides: c.sides,
        count: c.count,
      })),
    );
    setDropLowest(preset.label.includes("drop lowest"));
  };

  const addRow = () => {
    setConfigs((prev) => [...prev, { id: cryptoId(), sides: 6, count: 1 }]);
  };

  const updateRow = (id: string, patch: Partial<DiceConfig>) => {
    setConfigs((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch, count: clamp(patch.count ?? r.count, 1, 99) } : r)),
    );
  };

  const removeRow = (id: string) => {
    setConfigs((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const rollDice = async () => {
    if (isRolling) return;
    if (!configs.length) return;

    setIsRolling(true);
    // Small animation delay to feel responsive
    await new Promise((r) => setTimeout(r, 350));

    const results: { sides: number; values: number[] }[] = configs.map((c) => {
      const vals = Array.from({ length: c.count }, () => rollSingleDie(c.sides));
      return { sides: c.sides, values: vals };
    });

    let total = results.reduce((acc, r) => acc + sum(r.values), 0);

    let droppedInfo: number | null = null;
    if (dropLowest) {
      // Only meaningful when at least one config has count >= 2
      const flat: { sides: number; value: number }[] = [];
      results.forEach((r) => r.values.forEach((v) => flat.push({ sides: r.sides, value: v })));
      if (flat.length >= 2) {
        const minVal = Math.min(...flat.map((f) => f.value));
        droppedInfo = minVal;
        total -= minVal;
      }
    }

    const entry: RollEntry = {
      id: cryptoId(),
      timestamp: Date.now(),
      configs: JSON.parse(JSON.stringify(configs)),
      results,
      total,
    };

    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 20);
      return next;
    });

    setRecentTotals((prev) => {
      const next = [...prev, total].slice(-24);
      return next;
    });

    setIsRolling(false);

    const detail = results
      .map((r) => `${r.values.length}d${r.sides} [${r.values.join(", ")}]`)
      .join(" + ");
    toast.success(`Roll total: ${total}`, {
      description: `${detail}${dropLowest && droppedInfo !== null ? ` (dropped lowest ${droppedInfo})` : ""}`,
    });
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const shareText = async (text: string) => {
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ text });
      } else {
        await copyText(text);
      }
    } catch {
      // user cancelled share
    }
  };

  // Love Calculator State
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const lovePct = useMemo(() => clamp(hashPercent(nameA, nameB), 0, 100), [nameA, nameB]);
  const loveText = useMemo(() => funBlurb(lovePct), [lovePct]);

  const swapNames = () => {
    setNameA(nameB);
    setNameB(nameA);
  };

  const shareLove = () => {
    const text = `❤️ Love Calculator: ${nameA || "Person A"} + ${nameB || "Person B"} = ${lovePct}% compatibility. ${loveText}`;
    shareText(text);
  };

  const copyLove = () => {
    const text = `Love Calculator Result\n${nameA || "Person A"} + ${nameB || "Person B"}\nCompatibility: ${lovePct}%\n${loveText}`;
    copyText(text);
  };

  const copyLastRoll = () => {
    const last = history[0];
    if (!last) return;
    const detail = last.results
      .map((r) => `${r.values.length}d${r.sides} [${r.values.join(", ")}]`)
      .join(" + ");
    const text = `🎲 Dice Roll\n${detail}\nTotal: ${last.total}${dropLowest ? " (drop lowest applied)" : ""}`;
    copyText(text);
  };

  const shareLastRoll = () => {
    const last = history[0];
    if (!last) return;
    const detail = last.results
      .map((r) => `${r.values.length}d${r.sides} [${r.values.join(", ")}]`)
      .join(" + ");
    const text = `🎲 Dice Roll: ${detail} = ${last.total}${dropLowest ? " (drop lowest applied)" : ""}`;
    shareText(text);
  };

  // Sparkline canvas drawing for recent totals
  const sparkRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = sparkRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    // axes baseline
    ctx.lineWidth = 1;
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--chart-2").trim() || "#6366f1";

    const data = recentTotals;
    if (data.length < 2) return;

    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    const pad = 4;
    const range = Math.max(1, maxVal - minVal);

    ctx.beginPath();
    data.forEach((v, i) => {
      const x = pad + (i * (w - pad * 2)) / (data.length - 1);
      const y = h - pad - ((v - minVal) * (h - pad * 2)) / range;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [recentTotals]);

  return (
    <section
      className={["w-full max-w-full", className].filter(Boolean).join(" ")}
      style={style}
      aria-label="Entertainment Calculators"
    >
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="dice" aria-label="Dice Roller">
            <Dices className="mr-2 h-4 w-4" aria-hidden="true" />
            Dice Roller
          </TabsTrigger>
          <TabsTrigger value="love" aria-label="Love Calculator">
            <MessageSquareHeart className=" h-4 w-4" aria-hidden="true" />
            Love Calculator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dice" className="pt-4">
          <Card className="bg-card">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">Dice Roller</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Roll multiple dice types with presets and track your stats.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="whitespace-nowrap">
                  <ChartSpline className="mr-1.5 h-3.5 w-3.5" />
                  {stats.totalRolls} rolls
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map((p) => (
                  <Button
                    key={p.label}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPreset(p)}
                    aria-label={`Use preset: ${p.label}`}
                    className="bg-secondary hover:bg-accent"
                  >
                    {p.icon ? <span className="mr-1.5">{p.icon}</span> : null}
                    {p.label}
                  </Button>
                ))}
                <Separator orientation="vertical" className="hidden sm:block h-6" />
                <Button
                  type="button"
                  size="sm"
                  variant={dropLowest ? "default" : "outline"}
                  onClick={() => setDropLowest((v) => !v)}
                  aria-pressed={dropLowest}
                  aria-label="Toggle drop lowest"
                  className={dropLowest ? "bg-primary text-primary-foreground" : "bg-secondary"}
                >
                  Drop lowest
                </Button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-3">
                  {configs.map((row, idx) => (
                    <div
                      key={row.id}
                      className="col-span-12 sm:col-span-6 lg:col-span-4 bg-muted/60 rounded-lg p-3 border border-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-secondary">
                            Set {idx + 1}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeRow(row.id)}
                          aria-label="Remove dice set"
                          className="h-8 w-8"
                        >
                          ×
                        </Button>
                      </div>

                      <div className="flex items-end gap-3">
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={`sides-${row.id}`} className="text-xs text-muted-foreground">
                            Dice type
                          </Label>
                          <div className="flex items-center gap-2">
                            <select
                              id={`sides-${row.id}`}
                              value={row.sides}
                              onChange={(e) => updateRow(row.id, { sides: parseInt(e.target.value, 10) || 6 })}
                              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              aria-label="Select dice sides"
                            >
                              {DICE_SIDES.map((s) => (
                                <option key={s} value={s}>
                                  d{s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="w-28">
                          <Label htmlFor={`count-${row.id}`} className="text-xs text-muted-foreground">
                            Count
                          </Label>
                          <Input
                            id={`count-${row.id}`}
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={99}
                            value={row.count}
                            onChange={(e) => updateRow(row.id, { count: clamp(parseInt(e.target.value || "1", 10), 1, 99) })}
                            className="bg-card"
                            aria-label="Number of dice"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addRow}
                    aria-label="Add dice set"
                    className="bg-secondary"
                  >
                    + Add dice set
                  </Button>

                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground hidden sm:block" aria-live="polite">
                      Total dice: {totalDiceCount}
                    </div>
                    <Button
                      type="button"
                      onClick={rollDice}
                      disabled={isRolling}
                      aria-busy={isRolling}
                      className="bg-primary text-primary-foreground hover:opacity-90"
                    >
                      <Dices className={["mr-2 h-4 w-4", isRolling ? "animate-spin" : ""].join(" ")} aria-hidden="true" />
                      {isRolling ? "Rolling..." : "Roll"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-5">
                <div className="md:col-span-3 bg-secondary rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Roll history</h3>
                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={copyLastRoll} disabled={!history.length}>
                        Copy last
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={shareLastRoll} disabled={!history.length}>
                        Share
                      </Button>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-2 max-h-64 overflow-auto pr-1">
                    {!history.length ? (
                      <div className="text-sm text-muted-foreground">No rolls yet. Try a preset and roll!</div>
                    ) : (
                      history.map((h, i) => (
                        <div
                          key={h.id}
                          className="flex items-start gap-3 rounded-md border border-border bg-card p-3"
                          aria-label={`Roll ${i + 1}`}
                        >
                          <div className="mt-0.5 text-muted-foreground">{diceIconFor(h.total)}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-medium break-words">
                                {h.results
                                  .map((r) => `${r.values.length}d${r.sides} [${r.values.join(", ")}]`)
                                  .join(" + ")}
                              </div>
                              <div className="shrink-0">
                                <Badge className="bg-primary text-primary-foreground">Total {h.total}</Badge>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(h.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 bg-secondary rounded-lg p-4">
                  <h3 className="font-semibold text-sm">Session stats</h3>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-md border border-border bg-card p-3">
                      <div className="text-xs text-muted-foreground">Rolls</div>
                      <div className="text-lg font-semibold mt-1">{stats.totalRolls}</div>
                    </div>
                    <div className="rounded-md border border-border bg-card p-3">
                      <div className="text-xs text-muted-foreground">Average</div>
                      <div className="text-lg font-semibold mt-1">{stats.average}</div>
                    </div>
                    <div className="rounded-md border border-border bg-card p-3">
                      <div className="text-xs text-muted-foreground">Best</div>
                      <div className="text-lg font-semibold mt-1">{stats.best}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">Recent totals</div>
                      <ChartSpline className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="mt-2 rounded-md border border-border bg-card p-2">
                      <canvas
                        ref={sparkRef}
                        width={320}
                        height={64}
                        className="w-full h-16"
                        aria-label="Recent totals sparkline"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                Tip: Use presets for common rolls. Toggle “Drop lowest” for ability scores.
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setHistory([]);
                    setRecentTotals([]);
                    toast.message("History cleared");
                  }}
                >
                  Clear history
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="love" className="pt-4">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl md:text-2xl">Love Calculator</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter two names to see your playful compatibility score.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name-a">Name A</Label>
                  <Input
                    id="name-a"
                    value={nameA}
                    onChange={(e) => setNameA(e.target.value)}
                    placeholder="Alex"
                    className="bg-card"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name-b">Name B</Label>
                  <Input
                    id="name-b"
                    value={nameB}
                    onChange={(e) => setNameB(e.target.value)}
                    placeholder="Taylor"
                    className="bg-card"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button type="button" variant="secondary" onClick={swapNames} className="bg-secondary">
                  Swap
                </Button>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={copyLove}>
                    Copy
                  </Button>
                  <Button type="button" variant="outline" onClick={shareLove}>
                    Share
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-secondary p-5">
                <div className="flex items-center gap-2">
                  <MessageSquareHeart className="h-5 w-5 text-primary animate-bounce" aria-hidden="true" />
                  <div className="font-semibold">
                    {nameA || "Person A"} <span className="text-muted-foreground">&</span> {nameB || "Person B"}
                  </div>
                </div>

                <div className="mt-4">
                  <div
                    className="h-3 w-full rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={lovePct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={[
                        "h-3 rounded-full transition-all duration-500 ease-out",
                        progressColor(lovePct),
                      ].join(" ")}
                      style={{ width: `${lovePct}%` }}
                    />
                  </div>
                  <div className="mt-2 text-sm">
                    Compatibility: <span className="font-semibold">{lovePct}%</span>
                  </div>
                </div>

                <p className="mt-3 text-sm text-muted-foreground break-words">{loveText}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[20, 40, 60, 80, 100].map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // playful nudge: tweak names to approach target
                      if (!nameA && !nameB) {
                        setNameA("Alex");
                        setNameB("Jamie");
                      }
                      toast.message("Try different names to explore more combos!");
                    }}
                    className="bg-secondary"
                  >
                    Explore ~{t}%
                  </Button>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Just for fun — results are playful and not scientific.
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}