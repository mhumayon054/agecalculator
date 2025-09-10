"use client";

import React, { useMemo, useState } from "react";
import { CircuitBoard, Gauge, PlugZap, SquarePower } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type Props = {
  className?: string;
};

type PhaseType = "dc" | "single" | "three";

const ohmUnits = [
  { threshold: 1e9, suffix: "GΩ", factor: 1e9 },
  { threshold: 1e6, suffix: "MΩ", factor: 1e6 },
  { threshold: 1e3, suffix: "kΩ", factor: 1e3 },
  { threshold: 1, suffix: "Ω", factor: 1 },
  { threshold: 1e-3, suffix: "mΩ", factor: 1e-3 },
  { threshold: 1e-6, suffix: "µΩ", factor: 1e-6 },
];

const voltUnits = [
  { threshold: 1e9, suffix: "GV", factor: 1e9 },
  { threshold: 1e6, suffix: "MV", factor: 1e6 },
  { threshold: 1e3, suffix: "kV", factor: 1e3 },
  { threshold: 1, suffix: "V", factor: 1 },
  { threshold: 1e-3, suffix: "mV", factor: 1e-3 },
  { threshold: 1e-6, suffix: "µV", factor: 1e-6 },
];

const ampUnits = [
  { threshold: 1e6, suffix: "MA", factor: 1e6 },
  { threshold: 1e3, suffix: "kA", factor: 1e3 },
  { threshold: 1, suffix: "A", factor: 1 },
  { threshold: 1e-3, suffix: "mA", factor: 1e-3 },
  { threshold: 1e-6, suffix: "µA", factor: 1e-6 },
];

function formatEng(value: number, units: { threshold: number; suffix: string; factor: number }[], digits = 3) {
  if (!isFinite(value)) return "—";
  const abs = Math.abs(value);
  const unit = units.find((u) => abs >= u.threshold) ?? units[units.length - 1];
  return `${(value / unit.factor).toFixed(value / unit.factor >= 100 ? 0 : digits)} ${unit.suffix}`;
}

function clampNumber(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

const AWG_TABLE: { awg: string; cu_ohm_per_1000ft: number; al_ohm_per_1000ft: number }[] = [
  { awg: "14", cu_ohm_per_1000ft: 2.525, al_ohm_per_1000ft: 4.016 },
  { awg: "12", cu_ohm_per_1000ft: 1.588, al_ohm_per_1000ft: 2.533 },
  { awg: "10", cu_ohm_per_1000ft: 0.999, al_ohm_per_1000ft: 1.588 },
  { awg: "8", cu_ohm_per_1000ft: 0.6282, al_ohm_per_1000ft: 0.999 },
  { awg: "6", cu_ohm_per_1000ft: 0.3951, al_ohm_per_1000ft: 0.6282 },
  { awg: "4", cu_ohm_per_1000ft: 0.2485, al_ohm_per_1000ft: 0.3951 },
  { awg: "2", cu_ohm_per_1000ft: 0.1563, al_ohm_per_1000ft: 0.2485 },
  { awg: "1", cu_ohm_per_1000ft: 0.1239, al_ohm_per_1000ft: 0.197 },
  { awg: "1/0", cu_ohm_per_1000ft: 0.0983, al_ohm_per_1000ft: 0.1563 },
  { awg: "2/0", cu_ohm_per_1000ft: 0.0779, al_ohm_per_1000ft: 0.1239 },
  { awg: "3/0", cu_ohm_per_1000ft: 0.0618, al_ohm_per_1000ft: 0.0983 },
  { awg: "4/0", cu_ohm_per_1000ft: 0.049, al_ohm_per_1000ft: 0.0779 },
];

const resistorColors = [
  { name: "black", label: "Black", value: 0, multiplier: 1, tolerance: undefined, hex: "#000000" },
  { name: "brown", label: "Brown", value: 1, multiplier: 10, tolerance: 1, hex: "#8B4513" },
  { name: "red", label: "Red", value: 2, multiplier: 100, tolerance: 2, hex: "#D32F2F" },
  { name: "orange", label: "Orange", value: 3, multiplier: 1_000, tolerance: undefined, hex: "#F57C00" },
  { name: "yellow", label: "Yellow", value: 4, multiplier: 10_000, tolerance: undefined, hex: "#FBC02D" },
  { name: "green", label: "Green", value: 5, multiplier: 100_000, tolerance: 0.5, hex: "#388E3C" },
  { name: "blue", label: "Blue", value: 6, multiplier: 1_000_000, tolerance: 0.25, hex: "#1976D2" },
  { name: "violet", label: "Violet", value: 7, multiplier: 10_000_000, tolerance: 0.1, hex: "#7B1FA2" },
  { name: "gray", label: "Gray", value: 8, multiplier: 100_000_000, tolerance: 0.05, hex: "#757575" },
  { name: "white", label: "White", value: 9, multiplier: 1_000_000_000, tolerance: undefined, hex: "#FFFFFF" },
  { name: "gold", label: "Gold", value: undefined, multiplier: 0.1, tolerance: 5, hex: "#D4AF37" },
  { name: "silver", label: "Silver", value: undefined, multiplier: 0.01, tolerance: 10, hex: "#C0C0C0" },
];

function toNumber(val: string): number | undefined {
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
}

function parseResistanceInput(value: string): number | undefined {
  // Accept suffixes like 10k, 4.7M, 220, 0.5R, 5e3
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  const m = v.match(/^([\d.+-eE]+)\s*([kmgrµu]?)(?:\s*(?:ohm|Ω|r))?$/i);
  if (m) {
    const num = Number(m[1]);
    if (!isFinite(num)) return undefined;
    const unit = m[2];
    let factor = 1;
    if (unit === "k") factor = 1e3;
    else if (unit === "m") factor = 1e6;
    else if (unit === "g") factor = 1e9;
    else if (unit === "r") factor = 1;
    else if (unit === "u" || unit === "µ") factor = 1e-6;
    return num * factor;
  }
  // Also support 4k7 style
  const alt = v.match(/^(\d+)\s*[kKmM]\s*(\d+)$/);
  if (alt) {
    const a = Number(alt[1]);
    const b = Number(alt[2]);
    return a * 1e3 + b;
  }
  return Number(v);
}

function resistanceToColorBands(ohms: number, bands: 4 | 5): { digits: number[]; multiplier: number; tolerance?: number } | undefined {
  if (!isFinite(ohms) || ohms <= 0) return undefined;
  // Normalize to significant digits
  let exp = 0;
  let norm = ohms;
  while (norm >= 100 && exp < 12) {
    norm /= 10;
    exp++;
  }
  while (norm < (bands === 5 ? 100 : 10) && exp > -2) {
    norm *= 10;
    exp--;
  }
  const sigCount = bands === 5 ? 3 : 2;
  const rounded = Math.round(norm);
  const str = String(rounded).padStart(sigCount, "0").slice(0, sigCount);
  const digits = str.split("").map((d) => Number(d));
  const multiplier = Math.pow(10, exp - (sigCount - 1));
  // Clamp to available multipliers
  const multColor = resistorColors.find((c) => Math.abs(c.multiplier - multiplier) < 1e-12);
  if (!multColor) return undefined;
  return { digits, multiplier, tolerance: 5 };
}

function findColorByValueDigit(d: number) {
  return resistorColors.find((c) => c.value === d);
}

function findColorByMultiplier(m: number) {
  return resistorColors.find((c) => c.multiplier === m);
}

export default function ElectronicsCalculators({ className }: Props) {
  // Ohm's Law
  const [v, setV] = useState<string>("");
  const [i, setI] = useState<string>("");
  const [r, setR] = useState<string>("");
  const [p, setP] = useState<string>("");

  const ohmsLawResult = useMemo(() => {
    const V = toNumber(v);
    const I = toNumber(i);
    const R = toNumber(r);
    const P = toNumber(p);

    let calcV = V;
    let calcI = I;
    let calcR = R;
    let calcP = P;

    const provided = [V, I, R, P].filter((x) => typeof x === "number").length;

    if (provided < 2) return null;

    // Compute based on combinations
    if (calcV == null && calcI != null && calcR != null) calcV = calcI * calcR;
    if (calcV == null && calcP != null && calcI != null && calcI !== 0) calcV = calcP / calcI;
    if (calcV == null && calcP != null && calcR != null) calcV = Math.sqrt(calcP * calcR);

    if (calcI == null && calcV != null && calcR != null && calcR !== 0) calcI = calcV / calcR;
    if (calcI == null && calcP != null && calcV != null && calcV !== 0) calcI = calcP / calcV;
    if (calcI == null && calcP != null && calcR != null && calcR !== 0) calcI = Math.sqrt(calcP / calcR);

    if (calcR == null && calcV != null && calcI != null && calcI !== 0) calcR = calcV / calcI;
    if (calcR == null && calcV != null && calcP != null && calcP !== 0) calcR = (calcV * calcV) / calcP;
    if (calcR == null && calcP != null && calcI != null && calcI !== 0) calcR = calcP / (calcI * calcI);

    if (calcP == null && calcV != null && calcI != null) calcP = calcV * calcI;
    if (calcP == null && calcV != null && calcR != null && calcR !== 0) calcP = (calcV * calcV) / calcR;
    if (calcP == null && calcI != null && calcR != null) calcP = (calcI * calcI) * calcR;

    if ([calcV, calcI, calcR, calcP].some((x) => x == null || !isFinite(x as number))) return null;

    return { V: calcV as number, I: calcI as number, R: calcR as number, P: calcP as number };
  }, [v, i, r, p]);

  // Voltage Drop
  const [phase, setPhase] = useState<PhaseType>("single");
  const [material, setMaterial] = useState<"cu" | "al">("cu");
  const [awg, setAwg] = useState<string>("12");
  const [distance, setDistance] = useState<string>("100"); // one-way length
  const [distUnit, setDistUnit] = useState<"ft" | "m">("ft");
  const [current, setCurrent] = useState<string>("15");
  const [sourceVoltage, setSourceVoltage] = useState<string>("120");

  const vdropResult = useMemo(() => {
    const table = AWG_TABLE.find((t) => t.awg === awg);
    const I = toNumber(current);
    const Lraw = toNumber(distance);
    const Vs = toNumber(sourceVoltage);
    if (!table || I == null || Lraw == null || Vs == null || I < 0 || Lraw < 0 || Vs <= 0) return null;

    const Lft = distUnit === "ft" ? Lraw : Lraw * 3.2808399;
    const ohmPerFt = (material === "cu" ? table.cu_ohm_per_1000ft : table.al_ohm_per_1000ft) / 1000;

    let Vdrop = 0;
    if (phase === "dc" || phase === "single") {
      // round-trip length (out and back)
      const Rt = ohmPerFt * (2 * Lft);
      Vdrop = I * Rt;
    } else {
      // three-phase line-to-line: sqrt(3) * I * R * L
      Vdrop = Math.sqrt(3) * I * (ohmPerFt * Lft);
    }

    const percent = (Vdrop / Vs) * 100;
    const Vload = Vs - Vdrop;

    return {
      Vdrop,
      percent,
      Vload,
      ohmPerFt,
      Lft,
    };
  }, [phase, material, awg, distance, distUnit, current, sourceVoltage]);

  // Electricity (Power/Energy)
  const [ePhase, setEPhase] = useState<"single" | "three">("single");
  const [pf, setPf] = useState<string>("1");
  const [eVoltage, setEVoltage] = useState<string>("120");
  const [eCurrent, setECurrent] = useState<string>("10");
  const [hours, setHours] = useState<string>("1");
  const [rate, setRate] = useState<string>("0.15"); // $/kWh

  const electricity = useMemo(() => {
    const V = toNumber(eVoltage);
    const I = toNumber(eCurrent);
    const PF = clampNumber(toNumber(pf) ?? 1, 0, 1);
    const H = toNumber(hours);
    const R = toNumber(rate);
    if (V == null || I == null) return null;

    const S = (ePhase === "single" ? V * I : Math.sqrt(3) * V * I); // VA
    const P = S * PF; // W
    const Q = Math.sqrt(Math.max(S * S - P * P, 0)); // VAR
    const kWh = P / 1000 * (H ?? 0);
    const cost = (R ?? 0) * kWh;

    return { S, P, Q, PF, kWh, cost };
  }, [ePhase, eVoltage, eCurrent, pf, hours, rate]);

  // Resistor color code
  const [bandCount, setBandCount] = useState<"4" | "5">("4");
  const [band1, setBand1] = useState<string>("brown");
  const [band2, setBand2] = useState<string>("black");
  const [band3, setBand3] = useState<string>("red"); // used only for 5-band digits
  const [multBand, setMultBand] = useState<string>("brown");
  const [tolBand, setTolBand] = useState<string>("gold");

  const colorToValue = useMemo(() => {
    const b1 = resistorColors.find((c) => c.name === band1)?.value;
    const b2 = resistorColors.find((c) => c.name === band2)?.value;
    const b3 = resistorColors.find((c) => c.name === band3)?.value;
    const mult = resistorColors.find((c) => c.name === multBand)?.multiplier;
    const tol = resistorColors.find((c) => c.name === tolBand)?.tolerance;

    if (mult == null) return null;
    if (bandCount === "4") {
      if (b1 == null || b2 == null) return null;
      const base = b1 * 10 + b2;
      const ohms = base * mult;
      return { ohms, tolerance: tol ?? 20 };
    } else {
      if (b1 == null || b2 == null || b3 == null) return null;
      const base = b1 * 100 + b2 * 10 + b3;
      const ohms = base * mult;
      return { ohms, tolerance: tol ?? 20 };
    }
  }, [bandCount, band1, band2, band3, multBand, tolBand]);

  const [valueInput, setValueInput] = useState<string>("1000"); // ohms value to encode
  const encodeResult = useMemo(() => {
    const ohms = parseResistanceInput(valueInput);
    if (ohms == null || ohms <= 0) return null;
    const bands = bandCount === "4" ? 4 : 5;
    const mapping = resistanceToColorBands(ohms, bands as 4 | 5);
    if (!mapping) return null;
    const dColors = mapping.digits.map((d) => findColorByValueDigit(d)?.name ?? "black");
    const multColor = findColorByMultiplier(mapping.multiplier)?.name ?? "black";
    return { dColors, multColor, tolerance: 5, ohms };
  }, [valueInput, bandCount]);

  return (
    <section className={cn("w-full max-w-full", className)}>
      <Card className="w-full bg-card border border-border rounded-[var(--radius)] shadow-sm">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <CircuitBoard className="h-6 w-6 text-primary" aria-hidden />
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold">Electronics & Circuits Calculators</h2>
              <p className="text-sm text-muted-foreground">Voltage drop, resistors, Ohm&apos;s law, and power/energy</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-accent text-accent-foreground border-accent">
            EE Tools
          </Badge>
        </div>
        <Separator />
        <div className="p-4 sm:p-6">
          <Tabs defaultValue="ohm" className="w-full">
            <TabsList className="w-full flex flex-wrap gap-2 bg-muted/60 p-1 rounded-md">
              <TabsTrigger value="ohm" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Gauge className="mr-2 h-4 w-4" aria-hidden /> Ohm&apos;s Law
              </TabsTrigger>
              <TabsTrigger value="vdrop" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <PlugZap className="mr-2 h-4 w-4" aria-hidden /> Voltage Drop
              </TabsTrigger>
              <TabsTrigger value="resistor" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <SquarePower className="mr-2 h-4 w-4" aria-hidden /> Resistors
              </TabsTrigger>
              <TabsTrigger value="electricity" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <SquarePower className="mr-2 h-4 w-4" aria-hidden /> Electricity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ohm" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="v-input">Voltage (V)</Label>
                  <Input
                    id="v-input"
                    inputMode="decimal"
                    placeholder="e.g., 12"
                    value={v}
                    onChange={(e) => setV(e.target.value)}
                    aria-label="Voltage in volts"
                    className="bg-card"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="i-input">Current (A)</Label>
                  <Input
                    id="i-input"
                    inputMode="decimal"
                    placeholder="e.g., 2"
                    value={i}
                    onChange={(e) => setI(e.target.value)}
                    aria-label="Current in amperes"
                    className="bg-card"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-input">Resistance (Ω)</Label>
                  <Input
                    id="r-input"
                    inputMode="decimal"
                    placeholder="e.g., 6"
                    value={r}
                    onChange={(e) => setR(e.target.value)}
                    aria-label="Resistance in ohms"
                    className="bg-card"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-input">Power (W)</Label>
                  <Input
                    id="p-input"
                    inputMode="decimal"
                    placeholder="e.g., 24"
                    value={p}
                    onChange={(e) => setP(e.target.value)}
                    aria-label="Power in watts"
                    className="bg-card"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setV("");
                    setI("");
                    setR("");
                    setP("");
                  }}
                >
                  Clear
                </Button>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3">Results</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <ResultCard label="Voltage" value={ohmsLawResult ? formatEng(ohmsLawResult.V, voltUnits) : "—"} />
                  <ResultCard label="Current" value={ohmsLawResult ? formatEng(ohmsLawResult.I, ampUnits) : "—"} />
                  <ResultCard label="Resistance" value={ohmsLawResult ? formatEng(ohmsLawResult.R, ohmUnits) : "—"} />
                  <ResultCard label="Power" value={ohmsLawResult ? `${ohmsLawResult.P.toFixed(3)} W` : "—"} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vdrop" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>System</Label>
                  <Select value={phase} onValueChange={(v) => setPhase(v as PhaseType)}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Select system" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dc">DC</SelectItem>
                      <SelectItem value="single">Single-phase AC</SelectItem>
                      <SelectItem value="three">Three-phase AC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Material</Label>
                  <Select value={material} onValueChange={(v) => setMaterial(v as "cu" | "al")}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cu">Copper (Cu)</SelectItem>
                      <SelectItem value="al">Aluminum (Al)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Wire Gauge (AWG)</Label>
                  <Select value={awg} onValueChange={setAwg}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Select AWG" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {AWG_TABLE.map((a) => (
                        <SelectItem key={a.awg} value={a.awg}>
                          {a.awg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Current (A)</Label>
                  <Input
                    inputMode="decimal"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    placeholder="e.g., 15"
                    aria-label="Current in amperes"
                    className="bg-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Source Voltage (V)</Label>
                  <Input
                    inputMode="decimal"
                    value={sourceVoltage}
                    onChange={(e) => setSourceVoltage(e.target.value)}
                    placeholder="e.g., 120"
                    aria-label="Source voltage"
                    className="bg-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label>One-way Distance</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      inputMode="decimal"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      placeholder="e.g., 100"
                      aria-label="Distance"
                      className="bg-card"
                    />
                    <Select value={distUnit} onValueChange={(v) => setDistUnit(v as "ft" | "m")}>
                      <SelectTrigger className="w-28 bg-card">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ft">ft</SelectItem>
                        <SelectItem value="m">m</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">Note: One-way run length. Calculator accounts for return path.</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3">Results</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <ResultCard
                    label="Voltage Drop"
                    value={vdropResult ? formatEng(vdropResult.Vdrop, voltUnits) : "—"}
                  />
                  <ResultCard
                    label="% Drop"
                    value={vdropResult ? `${vdropResult.percent.toFixed(2)} %` : "—"}
                    intent={
                      vdropResult
                        ? vdropResult.percent <= 3
                          ? "good"
                          : vdropResult.percent <= 5
                          ? "warn"
                          : "bad"
                        : undefined
                    }
                  />
                  <ResultCard
                    label="Load Voltage"
                    value={vdropResult ? formatEng(vdropResult.Vload, voltUnits) : "—"}
                  />
                  <ResultCard
                    label="Line Resistance"
                    value={
                      vdropResult
                        ? `${(vdropResult.ohmPerFt * (phase === "three" ? vdropResult.Lft : 2 * vdropResult.Lft)).toFixed(4)} Ω`
                        : "—"
                    }
                    hint={phase === "three" ? "per line √3·I·R·L" : "round trip 2·L"}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Guidance: Keep voltage drop under 3% for branch circuits and under 5% overall (feeders + branches).
                </p>
              </div>
            </TabsContent>

            <TabsContent value="resistor" className="mt-6">
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="space-y-2">
                    <Label>Band Count</Label>
                    <Select value={bandCount} onValueChange={(v) => setBandCount(v as "4" | "5")}>
                      <SelectTrigger className="bg-card w-36">
                        <SelectValue placeholder="Bands" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4-band</SelectItem>
                        <SelectItem value="5">5-band</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <span className="text-xs text-muted-foreground">Show example tolerance</span>
                    <Switch checked disabled aria-label="Example tolerance is shown in results" />
                  
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-4 sm:p-5 bg-secondary">
                    <h4 className="font-semibold mb-3">Color ➜ Value</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <ColorBandSelect label="1st Digit" value={band1} onValueChange={setBand1} allowDigits />
                      <ColorBandSelect label="2nd Digit" value={band2} onValueChange={setBand2} allowDigits />
                      {bandCount === "5" && (
                        <ColorBandSelect label="3rd Digit" value={band3} onValueChange={setBand3} allowDigits />
                      )}
                      <ColorBandSelect label="Multiplier" value={multBand} onValueChange={setMultBand} allowMultiplier />
                      <ColorBandSelect label="Tolerance" value={tolBand} onValueChange={setTolBand} allowTolerance />
                    </div>
                    <div className="mt-4">
                      <ResistorVisual
                        bands={
                          bandCount === "4"
                            ? [band1, band2, multBand, tolBand]
                            : [band1, band2, band3, multBand, tolBand]
                        }
                      />
                      <div className="mt-4">
                        <ResultCard
                          label="Resistance"
                          value={
                            colorToValue ? `${formatEng(colorToValue.ohms, ohmUnits)} ±${colorToValue.tolerance}%` : "—"
                          }
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 sm:p-5 bg-secondary">
                    <h4 className="font-semibold mb-3">Value ➜ Colors</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Resistance</Label>
                        <Input
                          value={valueInput}
                          onChange={(e) => setValueInput(e.target.value)}
                          inputMode="decimal"
                          placeholder="e.g., 4.7k"
                          aria-label="Resistance to encode"
                          className="bg-card"
                        />
                        <p className="text-xs text-muted-foreground">Accepts 220, 4.7k, 1M, 10e3, 4k7, etc.</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Band Count</Label>
                        <Select value={bandCount} onValueChange={(v) => setBandCount(v as "4" | "5")}>
                          <SelectTrigger className="bg-card">
                            <SelectValue placeholder="Bands" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4">4-band</SelectItem>
                            <SelectItem value="5">5-band</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-4">
                      {encodeResult ? (
                        <>
                          <ResistorVisual
                            bands={
                              bandCount === "4"
                                ? [encodeResult.dColors[0], encodeResult.dColors[1], encodeResult.multColor, "gold"]
                                : [
                                    encodeResult.dColors[0],
                                    encodeResult.dColors[1],
                                    encodeResult.dColors[2] ?? "black",
                                    encodeResult.multColor,
                                    "gold",
                                  ]
                            }
                          />
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <ResultCard label="Ohms" value={`${formatEng(encodeResult.ohms, ohmUnits)}`} />
                            <ResultCard label="Tolerance" value="±5%" />
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Enter a valid resistance to see color bands.</p>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="electricity" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>System</Label>
                  <Select value={ePhase} onValueChange={(v) => setEPhase(v as "single" | "three")}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Select system" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single-phase</SelectItem>
                      <SelectItem value="three">Three-phase</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Voltage (V)</Label>
                  <Input
                    inputMode="decimal"
                    value={eVoltage}
                    onChange={(e) => setEVoltage(e.target.value)}
                    placeholder="e.g., 230"
                    className="bg-card"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current (A)</Label>
                  <Input
                    inputMode="decimal"
                    value={eCurrent}
                    onChange={(e) => setECurrent(e.target.value)}
                    placeholder="e.g., 10"
                    className="bg-card"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Power Factor</Label>
                  <Input
                    inputMode="decimal"
                    value={pf}
                    onChange={(e) => setPf(e.target.value)}
                    placeholder="0 to 1"
                    className="bg-card"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Usage Hours</Label>
                  <Input
                    inputMode="decimal"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="e.g., 5"
                    className="bg-card"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Energy Rate ($/kWh)</Label>
                  <Input
                    inputMode="decimal"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="e.g., 0.15"
                    className="bg-card"
                  />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3">Results</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <ResultCard label="Apparent Power" value={electricity ? `${(electricity.S).toFixed(2)} VA` : "—"} />
                  <ResultCard label="Real Power" value={electricity ? `${(electricity.P).toFixed(2)} W` : "—"} />
                  <ResultCard label="Reactive Power" value={electricity ? `${(electricity.Q).toFixed(2)} var` : "—"} />
                  <ResultCard label="PF" value={electricity ? electricity.PF.toFixed(3) : "—"} />
                  <ResultCard label="Energy" value={electricity ? `${electricity.kWh.toFixed(3)} kWh` : "—"} />
                  <ResultCard label="Estimated Cost" value={electricity ? `$${electricity.cost.toFixed(2)}` : "—"} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </section>
  );
}

function ResultCard({
  label,
  value,
  hint,
  intent,
}: {
  label: string;
  value: string;
  hint?: string;
  intent?: "good" | "warn" | "bad";
}) {
  const intentClass =
    intent === "good"
      ? "border-emerald-300 bg-emerald-50"
      : intent === "warn"
      ? "border-amber-300 bg-amber-50"
      : intent === "bad"
      ? "border-red-300 bg-red-50"
      : "border-border bg-card";
  return (
    <div
      className={cn(
        "min-w-0 rounded-md border p-3 transition-colors",
        intentClass
      )}
      aria-live="polite"
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-semibold break-words">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

function ColorBandSelect({
  label,
  value,
  onValueChange,
  allowDigits,
  allowMultiplier,
  allowTolerance,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  allowDigits?: boolean;
  allowMultiplier?: boolean;
  allowTolerance?: boolean;
}) {
  const options = resistorColors.filter((c) => {
    if (allowDigits) return typeof c.value === "number";
    if (allowMultiplier) return typeof c.multiplier === "number";
    if (allowTolerance) return typeof c.tolerance === "number";
    return false;
  });
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="bg-card">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-4 w-4 rounded-sm border"
              style={{ backgroundColor: resistorColors.find((c) => c.name === value)?.hex ?? "#000" }}
            />
            <SelectValue placeholder="Select" />
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((c) => (
            <SelectItem key={c.name} value={c.name}>
              <div className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 rounded-sm border" style={{ background: c.hex }} />
                <span className="min-w-0">{c.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ResistorVisual({ bands }: { bands: string[] }) {
  // Simple visual: body with colored bands
  return (
    <div className="w-full max-w-full">
      <div className="relative mx-auto h-16 sm:h-20 w-full max-w-xl rounded-md bg-neutral-soft/80 flex items-center justify-center overflow-hidden">
        <div className="absolute left-0 top-1/2 h-2 sm:h-3 w-6 sm:w-8 -translate-y-1/2 bg-gray-400" aria-hidden />
        <div className="absolute right-0 top-1/2 h-2 sm:h-3 w-6 sm:w-8 -translate-y-1/2 bg-gray-400" aria-hidden />
        <div className="relative h-10 sm:h-12 w-64 sm:w-80 rounded-md bg-[#e8d5b5] border border-border shadow-inner flex items-center justify-between px-5">
          {bands.map((b, idx) => {
            const color = resistorColors.find((c) => c.name === b)?.hex ?? "#000";
            return (
              <div
                key={idx}
                className="h-full w-2 sm:w-2.5 rounded-sm"
                style={{ background: color, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)" }}
                aria-label={`Band ${idx + 1}`}
                role="img"
              />
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        {bands.map((b, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            <span
              className="inline-block h-3 w-3 rounded-sm border"
              style={{ backgroundColor: resistorColors.find((c) => c.name === b)?.hex ?? "#000" }}
              aria-hidden
            />
            Band {i + 1}: {resistorColors.find((c) => c.name === b)?.label ?? "Unknown"}
          </span>
        ))}
      </div>
    </div>
  );
}