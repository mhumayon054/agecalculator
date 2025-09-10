"use client";

import * as React from "react";
import { Construction, Ruler, Cuboid, Square, Radical, Building2, RulerDimensionLine, SquareEqual } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type LengthUnit = "ft" | "m";
type AreaUnit = "sqft" | "sqm";
type DepthUnit = "in" | "cm";
type VolumeUnit = "cuyd" | "cum";
type MassUnit = "ton" | "kg";

interface HousingCalculatorsProps {
  className?: string;
  defaultTab?:
    | "concrete"
    | "btu"
    | "square-footage"
    | "stair"
    | "roofing"
    | "tile"
    | "mulch"
    | "gravel";
}

const FT_PER_M = 3.280839895;
const M_PER_FT = 1 / FT_PER_M;
const IN_PER_FT = 12;
const CM_PER_M = 100;
const IN_PER_CM = 0.3937007874;
const FT_PER_IN = 1 / IN_PER_FT;
const M_PER_CM = 0.01;
const SQFT_PER_SQM = 10.7639104167;
const SQM_PER_SQFT = 1 / SQFT_PER_SQM;
const CUFT_PER_CUYD = 27;
const CUYD_PER_CUFT = 1 / CUFT_PER_CUYD;
const CUM_PER_CUFT = 0.0283168466;
const CUFT_PER_CUM = 1 / CUM_PER_CUFT;
const BTU_PER_WATT = 3.4121416331;
const WATT_PER_BTU = 1 / BTU_PER_WATT;
const LB_PER_TON_US = 2000;
const KG_PER_TON_US = 907.18474;

function clampPositive(n: number) {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function roundUp(n: number, precision = 0) {
  const p = Math.pow(10, precision);
  return Math.ceil(n * p) / p;
}

function pitchFactor(risePer12: number) {
  // Roof area multiplier for a given pitch (rise over 12)
  const run = 12;
  return Math.sqrt(run * run + risePer12 * risePer12) / run;
}

function lengthToFeet(value: number, unit: LengthUnit) {
  return unit === "ft" ? value : value * FT_PER_M;
}

function feetToLength(valueFt: number, unit: LengthUnit) {
  return unit === "ft" ? valueFt : valueFt * M_PER_FT;
}

function areaToSqft(value: number, unit: AreaUnit) {
  return unit === "sqft" ? value : value * SQFT_PER_SQM;
}

function sqftToArea(valueSqft: number, unit: AreaUnit) {
  return unit === "sqft" ? valueSqft : valueSqft * SQM_PER_SQFT;
}

function depthToFeet(value: number, unit: DepthUnit) {
  // inches or cm to feet
  if (unit === "in") return value * FT_PER_IN;
  // cm -> m -> ft
  return value * M_PER_CM * FT_PER_M;
}

function feetToDepth(valueFt: number, unit: DepthUnit) {
  if (unit === "in") return valueFt * IN_PER_FT;
  // feet -> meters -> cm
  return valueFt * M_PER_FT * CM_PER_M;
}

export default function HousingCalculators({
  className,
  defaultTab = "concrete",
}: HousingCalculatorsProps) {
  return (
    <section className={cn("w-full", className)} aria-label="Housing and Building Calculators">
      <Card className="bg-card text-card-foreground shadow-sm border border-border">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Construction className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-lg sm:text-xl">Housing & Building Calculators</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Switch between calculators and input your dimensions with units. Results update instantly with accurate conversions.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">Construction</Badge>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">Materials</Badge>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">Dimensions</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue={defaultTab} className="w-full">
            <div className="overflow-x-auto -mx-2 px-2">
              <TabsList className="min-w-max">
                <TabsTrigger value="concrete" className="gap-2">
                  <Cuboid className="size-4" aria-hidden /> Concrete
                </TabsTrigger>
                <TabsTrigger value="btu" className="gap-2">
                  <Radical className="size-4" aria-hidden /> BTU
                </TabsTrigger>
                <TabsTrigger value="square-footage" className="gap-2">
                  <Square className="size-4" aria-hidden /> Square Footage
                </TabsTrigger>
                <TabsTrigger value="stair" className="gap-2">
                  <Ruler className="size-4" aria-hidden /> Stair
                </TabsTrigger>
                <TabsTrigger value="roofing" className="gap-2">
                  <Building2 className="size-4" aria-hidden /> Roofing
                </TabsTrigger>
                <TabsTrigger value="tile" className="gap-2">
                  <SquareEqual className="size-4" aria-hidden /> Tile
                </TabsTrigger>
                <TabsTrigger value="mulch" className="gap-2">
                  <RulerDimensionLine className="size-4" aria-hidden /> Mulch
                </TabsTrigger>
                <TabsTrigger value="gravel" className="gap-2">
                  <Construction className="size-4" aria-hidden /> Gravel
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="concrete" className="mt-6">
              <ConcreteCalculator />
            </TabsContent>

            <TabsContent value="btu" className="mt-6">
              <BTUCalculator />
            </TabsContent>

            <TabsContent value="square-footage" className="mt-6">
              <SquareFootageCalculator />
            </TabsContent>

            <TabsContent value="stair" className="mt-6">
              <StairCalculator />
            </TabsContent>

            <TabsContent value="roofing" className="mt-6">
              <RoofingCalculator />
            </TabsContent>

            <TabsContent value="tile" className="mt-6">
              <TileCalculator />
            </TabsContent>

            <TabsContent value="mulch" className="mt-6">
              <MulchCalculator />
            </TabsContent>

            <TabsContent value="gravel" className="mt-6">
              <GravelCalculator />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}

/* ========================= Concrete Calculator ========================= */

type ConcreteShape = "rectangle" | "circle";
type ThicknessUnit = "in" | "cm";

function ConcreteCalculator() {
  const [shape, setShape] = React.useState<ConcreteShape>("rectangle");
  const [lengthUnit, setLengthUnit] = React.useState<LengthUnit>("ft");
  const [thicknessUnit, setThicknessUnit] = React.useState<ThicknessUnit>("in");

  const [length, setLength] = React.useState<number>(20);
  const [width, setWidth] = React.useState<number>(10);
  const [diameter, setDiameter] = React.useState<number>(10);
  const [thickness, setThickness] = React.useState<number>(4);

  const [wastePct, setWastePct] = React.useState<number>(10);
  const [bagSize, setBagSize] = React.useState<"40" | "60" | "80">("60");

  // Bag yields in cubic feet (approximate industry values)
  const bagCuFt = React.useMemo(() => {
    switch (bagSize) {
      case "40":
        return 0.45;
      case "60":
        return 0.60;
      case "80":
        return 0.80;
    }
  }, [bagSize]);

  const results = React.useMemo(() => {
    const t_ft = thicknessUnit === "in" ? thickness * FT_PER_IN : thickness * M_PER_CM * FT_PER_M;
    let baseAreaSqft = 0;

    if (shape === "rectangle") {
      const L = lengthToFeet(length, lengthUnit);
      const W = lengthToFeet(width, lengthUnit);
      baseAreaSqft = clampPositive(L) * clampPositive(W);
    } else {
      const D = lengthToFeet(diameter, lengthUnit);
      baseAreaSqft = Math.PI * Math.pow(clampPositive(D) / 2, 2);
    }

    const volumeCuFt = baseAreaSqft * clampPositive(t_ft);
    const volumeWithWasteCuFt = volumeCuFt * (1 + clampPositive(wastePct) / 100);

    const cuYd = volumeWithWasteCuFt * CUYD_PER_CUFT;
    const cuM = volumeWithWasteCuFt * CUM_PER_CUFT;

    const bags = bagCuFt > 0 ? Math.ceil(volumeWithWasteCuFt / bagCuFt) : 0;

    return {
      areaSqft: baseAreaSqft,
      volumeCuFt: volumeCuFt,
      volumeWithWasteCuFt,
      cuYd,
      cuM,
      bags,
    };
  }, [shape, length, width, diameter, thickness, thicknessUnit, lengthUnit, wastePct, bagCuFt]);

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Cuboid className="size-5 text-primary" aria-hidden />
          <CardTitle className="text-base sm:text-lg">Concrete Calculator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="concrete-shape">Shape</Label>
            <Select value={shape} onValueChange={(v) => setShape(v as ConcreteShape)}>
              <SelectTrigger id="concrete-shape" className="bg-secondary">
                <SelectValue placeholder="Select shape" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangle">Rectangle slab</SelectItem>
                <SelectItem value="circle">Circle slab</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="concrete-length-unit">Length unit</Label>
            <Select value={lengthUnit} onValueChange={(v) => setLengthUnit(v as LengthUnit)}>
              <SelectTrigger id="concrete-length-unit" className="bg-secondary">
                <SelectValue placeholder="Choose unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ft">Feet (ft)</SelectItem>
                <SelectItem value="m">Meters (m)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="concrete-thickness-unit">Thickness unit</Label>
            <Select value={thicknessUnit} onValueChange={(v) => setThicknessUnit(v as ThicknessUnit)}>
              <SelectTrigger id="concrete-thickness-unit" className="bg-secondary">
                <SelectValue placeholder="Choose unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Inches (in)</SelectItem>
                <SelectItem value="cm">Centimeters (cm)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {shape === "rectangle" && (
            <>
              <NumberField id="concrete-length" label={`Length (${lengthUnit})`} value={length} onChange={setLength} min={0} />
              <NumberField id="concrete-width" label={`Width (${lengthUnit})`} value={width} onChange={setWidth} min={0} />
            </>
          )}

          {shape === "circle" && (
            <NumberField id="concrete-diameter" label={`Diameter (${lengthUnit})`} value={diameter} onChange={setDiameter} min={0} />
          )}

          <NumberField id="concrete-thickness" label={`Thickness (${thicknessUnit})`} value={thickness} onChange={setThickness} min={0} />
          <NumberField id="concrete-waste" label="Waste (%)" value={wastePct} onChange={setWastePct} min={0} max={50} step={1} />

          <div className="space-y-2">
            <Label htmlFor="concrete-bag">Bag size</Label>
            <Select value={bagSize} onValueChange={(v) => setBagSize(v as "40" | "60" | "80")}>
              <SelectTrigger id="concrete-bag" className="bg-secondary">
                <SelectValue placeholder="Select bag size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="40">40 lb (~0.45 cu ft)</SelectItem>
                <SelectItem value="60">60 lb (~0.60 cu ft)</SelectItem>
                <SelectItem value="80">80 lb (~0.80 cu ft)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <ResultsList
          items={[
            { label: "Area", value: `${formatNumber(results.areaSqft)} sq ft (${formatNumber(sqftToArea(results.areaSqft, "sqm"))} m²)` },
            {
              label: "Volume (no waste)",
              value: `${formatNumber(results.volumeCuFt)} cu ft (${formatNumber(results.volumeCuFt * CUYD_PER_CUFT)} yd³, ${formatNumber(results.volumeCuFt * CUM_PER_CUFT)} m³)`,
            },
            {
              label: "Volume (with waste)",
              value: `${formatNumber(results.volumeWithWasteCuFt)} cu ft (${formatNumber(results.cuYd)} yd³, ${formatNumber(results.cuM)} m³)`,
            },
            { label: "Bags needed", value: `${results.bags} bags (${bagSize} lb)` },
          ]}
        />
      </CardContent>
    </Card>
  );
}

/* ========================= BTU Calculator ========================= */

function BTUCalculator() {
  const [areaUnit, setAreaUnit] = React.useState<AreaUnit>("sqft");
  const [lengthUnit, setLengthUnit] = React.useState<LengthUnit>("ft");

  const [length, setLength] = React.useState<number>(20);
  const [width, setWidth] = React.useState<number>(15);
  const [ceilingHeight, setCeilingHeight] = React.useState<number>(8); // feet/meters, via lengthUnit
  const [occupants, setOccupants] = React.useState<number>(2);
  const [sunExposure, setSunExposure] = React.useState<"low" | "medium" | "high">("medium");
  const [climate, setClimate] = React.useState<"cool" | "moderate" | "hot">("moderate");

  const areaSqft = React.useMemo(() => {
    const Lft = lengthToFeet(length, lengthUnit);
    const Wft = lengthToFeet(width, lengthUnit);
    return clampPositive(Lft * Wft);
  }, [length, width, lengthUnit]);

  const heightFt = React.useMemo(() => lengthToFeet(ceilingHeight, lengthUnit), [ceilingHeight, lengthUnit]);

  const btu = React.useMemo(() => {
    // Baseline 20 BTU/hr per sq ft for cooling, adjusted by ceiling height and factors.
    // Volumetric adjustment relative to 8 ft ceiling.
    const base = areaSqft * 20;
    const volumeFactor = Math.max(0.75, Math.min(1.5, heightFt / 8));
    let factor = volumeFactor;

    // Sun exposure adjustment
    if (sunExposure === "low") factor *= 0.9;
    if (sunExposure === "high") factor *= 1.1;

    // Climate adjustment
    if (climate === "cool") factor *= 0.95;
    if (climate === "hot") factor *= 1.1;

    // Occupant adjustment: +600 BTU per person over 2
    const occExtra = Math.max(0, occupants - 2) * 600;

    const totalBTU = base * factor + occExtra;
    return clampPositive(totalBTU);
  }, [areaSqft, heightFt, sunExposure, climate, occupants]);

  const kw = btu * WATT_PER_BTU / 1000;

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Radical className="size-5 text-primary" aria-hidden />
          <CardTitle className="text-base sm:text-lg">BTU Calculator (Cooling Load)</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="btu-area-unit">Length unit</Label>
            <Select value={lengthUnit} onValueChange={(v) => setLengthUnit(v as LengthUnit)}>
              <SelectTrigger id="btu-area-unit" className="bg-secondary">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ft">Feet (ft)</SelectItem>
                <SelectItem value="m">Meters (m)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <NumberField id="btu-length" label={`Room length (${lengthUnit})`} value={length} onChange={setLength} min={0} />
          <NumberField id="btu-width" label={`Room width (${lengthUnit})`} value={width} onChange={setWidth} min={0} />
          <NumberField id="btu-height" label={`Ceiling height (${lengthUnit})`} value={ceilingHeight} onChange={setCeilingHeight} min={0} />

          <div className="space-y-2">
            <Label htmlFor="btu-sun">Sun exposure</Label>
            <Select value={sunExposure} onValueChange={(v) => setSunExposure(v as "low" | "medium" | "high")}>
              <SelectTrigger id="btu-sun" className="bg-secondary">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (shaded)</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High (direct sun)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="btu-climate">Climate</Label>
            <Select value={climate} onValueChange={(v) => setClimate(v as "cool" | "moderate" | "hot")}>
              <SelectTrigger id="btu-climate" className="bg-secondary">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cool">Cool</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <NumberField id="btu-occupants" label="Occupants" value={occupants} onChange={setOccupants} min={1} step={1} />
        </div>

        <Separator />

        <ResultsList
          items={[
            { label: "Area", value: `${formatNumber(areaSqft)} sq ft (${formatNumber(sqftToArea(areaSqft, "sqm"))} m²)` },
            { label: "Estimated cooling load", value: `${formatNumber(btu)} BTU/hr (${formatNumber(kw)} kW)` },
          ]}
        />
      </CardContent>
    </Card>
  );
}

/* ========================= Square Footage Calculator ========================= */

type ShapeKind = "rectangle" | "circle" | "triangle";

interface Segment {
  id: string;
  shape: ShapeKind;
  a: number; // length or diameter/base
  b: number; // width or height (unused for circle)
}

function SquareFootageCalculator() {
  const [lengthUnit, setLengthUnit] = React.useState<LengthUnit>("ft");
  const [segments, setSegments] = React.useState<Segment[]>([
    { id: cryptoId(), shape: "rectangle", a: 10, b: 12 },
  ]);

  const addSegment = () =>
    setSegments((s) => [...s, { id: cryptoId(), shape: "rectangle", a: 10, b: 10 }]);

  const removeSegment = (id: string) => setSegments((s) => (s.length > 1 ? s.filter((x) => x.id !== id) : s));

  const updateSegment = (id: string, patch: Partial<Segment>) =>
    setSegments((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const totalSqft = React.useMemo(() => {
    return segments.reduce((sum, seg) => {
      if (seg.shape === "rectangle") {
        const L = lengthToFeet(seg.a, lengthUnit);
        const W = lengthToFeet(seg.b, lengthUnit);
        return sum + Math.max(0, L * W);
      }
      if (seg.shape === "circle") {
        const D = lengthToFeet(seg.a, lengthUnit);
        return sum + Math.PI * Math.pow(Math.max(0, D) / 2, 2);
      }
      // triangle: a=base, b=height
      const B = lengthToFeet(seg.a, lengthUnit);
      const H = lengthToFeet(seg.b, lengthUnit);
      return sum + 0.5 * Math.max(0, B * H);
    }, 0);
  }, [segments, lengthUnit]);

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Square className="size-5 text-primary" aria-hidden />
          <CardTitle className="text-base sm:text-lg">Square Footage Calculator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sf-length-unit">Length unit</Label>
            <Select value={lengthUnit} onValueChange={(v) => setLengthUnit(v as LengthUnit)}>
              <SelectTrigger id="sf-length-unit" className="bg-secondary">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ft">Feet (ft)</SelectItem>
                <SelectItem value="m">Meters (m)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {segments.map((seg, idx) => (
            <div key={seg.id} className="rounded-lg border border-border p-4 bg-muted/30">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Square className="size-4 text-muted-foreground" aria-hidden />
                  <span className="text-sm font-medium">Segment {idx + 1}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSegment(seg.id)}
                  className="text-sm text-destructive hover:underline disabled:opacity-50"
                  disabled={segments.length === 1}
                  aria-disabled={segments.length === 1}
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Shape</Label>
                  <Select value={seg.shape} onValueChange={(v) => updateSegment(seg.id, { shape: v as ShapeKind })}>
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="Select shape" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rectangle">Rectangle</SelectItem>
                      <SelectItem value="circle">Circle</SelectItem>
                      <SelectItem value="triangle">Triangle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <NumberField
                  id={`seg-a-${seg.id}`}
                  label={
                    seg.shape === "circle"
                      ? `Diameter (${lengthUnit})`
                      : seg.shape === "triangle"
                      ? `Base (${lengthUnit})`
                      : `Length (${lengthUnit})`
                  }
                  value={seg.a}
                  onChange={(v) => updateSegment(seg.id, { a: v })}
                  min={0}
                />

                {seg.shape !== "circle" && (
                  <NumberField
                    id={`seg-b-${seg.id}`}
                    label={seg.shape === "triangle" ? `Height (${lengthUnit})` : `Width (${lengthUnit})`}
                    value={seg.b}
                    onChange={(v) => updateSegment(seg.id, { b: v })}
                    min={0}
                  />
                )}

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addSegment}
                    className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-95 transition"
                    aria-label="Add segment"
                  >
                    Add segment
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <ResultsList
          items={[
            { label: "Total area", value: `${formatNumber(totalSqft)} sq ft (${formatNumber(sqftToArea(totalSqft, "sqm"))} m²)` },
          ]}
        />
      </CardContent>
    </Card>
  );
}

/* ========================= Stair Calculator ========================= */

function StairCalculator() {
  const [riseUnit, setRiseUnit] = React.useState<DepthUnit>("in");
  const [runUnit, setRunUnit] = React.useState<DepthUnit>("in");

  const [totalRise, setTotalRise] = React.useState<number>(112); // inches default (9ft 4in)
  const [desiredRiser, setDesiredRiser] = React.useState<number>(7.5); // inches
  const [treadDepth, setTreadDepth] = React.useState<number>(10.5); // inches
  const [nosing, setNosing] = React.useState<number>(1); // inches overhang

  const calc = React.useMemo(() => {
    const totalRiseFt = depthToFeet(totalRise, riseUnit);
    const desiredRiserFt = depthToFeet(desiredRiser, riseUnit);

    let risers = Math.max(1, Math.round(totalRiseFt / Math.max(0.001, desiredRiserFt)));
    const actualRiserFt = totalRiseFt / risers;

    // Number of treads equals number of risers - 1 for typical stair (top landing is final rise)
    const treads = Math.max(1, risers - 1);
    const treadDepthFt = depthToFeet(treadDepth, runUnit);
    const nosingFt = depthToFeet(nosing, runUnit);

    const totalRunFt = treads * (treadDepthFt - nosingFt);
    const stringerLengthFt = Math.sqrt(totalRunFt * totalRunFt + totalRiseFt * totalRiseFt);

    // Slope angle in degrees
    const angleDeg = (Math.atan2(totalRiseFt, totalRunFt) * 180) / Math.PI;

    return {
      risers,
      treads,
      actualRiser: { in: feetToDepth(actualRiserFt, "in"), cm: feetToDepth(actualRiserFt, "cm") },
      totalRun: { ft: totalRunFt, m: feetToLength(totalRunFt, "m") },
      stringer: { ft: stringerLengthFt, m: feetToLength(stringerLengthFt, "m") },
      angleDeg,
    };
  }, [totalRise, desiredRiser, treadDepth, nosing, riseUnit, runUnit]);

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Ruler className="size-5 text-primary" aria-hidden />
          <CardTitle className="text-base sm:text-lg">Stair Calculator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="st-rise-unit">Rise unit</Label>
            <Select value={riseUnit} onValueChange={(v) => setRiseUnit(v as DepthUnit)}>
              <SelectTrigger id="st-rise-unit" className="bg-secondary">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Inches (in)</SelectItem>
                <SelectItem value="cm">Centimeters (cm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <NumberField id="st-total-rise" label={`Total rise (${riseUnit})`} value={totalRise} onChange={setTotalRise} min={1} />

          <NumberField id="st-desired-riser" label={`Desired riser (${riseUnit})`} value={desiredRiser} onChange={setDesiredRiser} min={1} />
          <div className="space-y-2">
            <Label htmlFor="st-run-unit">Run unit</Label>
            <Select value={runUnit} onValueChange={(v) => setRunUnit(v as DepthUnit)}>
              <SelectTrigger id="st-run-unit" className="bg-secondary">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Inches (in)</SelectItem>
                <SelectItem value="cm">Centimeters (cm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <NumberField id="st-tread" label={`Tread depth (${runUnit})`} value={treadDepth} onChange={setTreadDepth} min={1} />
          <NumberField id="st-nosing" label={`Nosing (${runUnit})`} value={nosing} onChange={setNosing} min={0} />
        </div>

        <Separator />

        <ResultsList
          items={[
            { label: "Risers", value: `${calc.risers}` },
            { label: "Treads", value: `${calc.treads}` },
            { label: "Actual riser height", value: `${formatNumber(calc.actualRiser.in)} in (${formatNumber(calc.actualRiser.cm)} cm)` },
            { label: "Total run", value: `${formatNumber(calc.totalRun.ft)} ft (${formatNumber(calc.totalRun.m)} m)` },
            { label: "Stringer length", value: `${formatNumber(calc.stringer.ft)} ft (${formatNumber(calc.stringer.m)} m)` },
            { label: "Stair angle", value: `${formatNumber(calc.angleDeg)}°` },
          ]}
        />
      </CardContent>
    </Card>
  );
}

/* ========================= Roofing Calculator ========================= */

function RoofingCalculator() {
  const [lengthUnit, setLengthUnit] = React.useState<LengthUnit>("ft");
  const [length, setLength] = React.useState<number>(40);
  const [width, setWidth] = React.useState<number>(30);
  const [pitch, setPitch] = React.useState<number>(6); // rise per 12
  const [wastePct, setWastePct] = React.useState<number>(10);
  const [bundleCost, setBundleCost] = React.useState<number>(0);

  const factor = React.useMemo(() => pitchFactor(Math.max(0, pitch)), [pitch]);

  const areaSqft = React.useMemo(() => {
    const L = lengthToFeet(length, lengthUnit);
    const W = lengthToFeet(width, lengthUnit);
    // Simple gable: total area = footprint * pitch factor
    return Math.max(0, L * W * factor);
  }, [length, width, lengthUnit, factor]);

  const withWasteSqft = areaSqft * (1 + Math.max(0, wastePct) / 100);
  const bundles = Math.ceil(withWasteSqft / 33.3333333);
  const squares = withWasteSqft / 100;
  const estimatedCost = bundleCost > 0 ? bundles * bundleCost : 0;

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-primary" aria-hidden />
          <CardTitle className="text-base sm:text-lg">Roofing Calculator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="roof-length-unit">Length unit</Label>
            <Select value={lengthUnit} onValueChange={(v) => setLengthUnit(v as LengthUnit)}>
              <SelectTrigger id="roof-length-unit" className="bg-secondary">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ft">Feet (ft)</SelectItem>
                <SelectItem value="m">Meters (m)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <NumberField id="roof-length" label={`Building length (${lengthUnit})`} value={length} onChange={setLength} min={0} />
          <NumberField id="roof-width" label={`Building width (${lengthUnit})`} value={width} onChange={setWidth} min={0} />
          <NumberField id="roof-pitch" label="Pitch (rise per 12)" value={pitch} onChange={setPitch} min={0} step={0.5} />
          <NumberField id="roof-waste" label="Waste (%)" value={wastePct} onChange={setWastePct} min={0} max={30} />
          <NumberField id="roof-bundle-cost" label="Bundle cost ($)" value={bundleCost} onChange={setBundleCost} min={0} step={0.01} />
        </div>

        <Separator />

        <ResultsList
          items={[
            { label: "Roof pitch factor", value: formatNumber(factor) },
            { label: "Surface area", value: `${formatNumber(areaSqft)} sq ft (${formatNumber(sqftToArea(areaSqft, "sqm"))} m²)` },
            { label: "With waste", value: `${formatNumber(withWasteSqft)} sq ft` },
            { label: "Squares", value: `${formatNumber(squares)} squares (100 sq ft each)` },
            { label: "Shingle bundles", value: `${bundles} bundles (~33.3 sq ft/bundle)` },
            ...(bundleCost > 0 ? [{ label: "Estimated material cost", value: `$${formatNumber(estimatedCost, 2)}` }] : []),
          ]}
        />
      </CardContent>
    </Card>
  );
}

/* ========================= Tile Calculator ========================= */

function TileCalculator() {
  const [lengthUnit, setLengthUnit] = React.useState<LengthUnit>("ft");
  const [roomLength, setRoomLength] = React.useState<number>(12);
  const [roomWidth, setRoomWidth] = React.useState<number>(10);

  const [tileUnit, setTileUnit] = React.useState<DepthUnit>("in"); // tile size units (edge lengths)
  const [tileW, setTileW] = React.useState<number>(12);
  const [tileH, setTileH] = React.useState<number>(24);
  const [grout, setGrout] = React.useState<number>(0.125); // 1/8"

  const [wastePct, setWastePct] = React.useState<number>(10);
  const [perBox, setPerBox] = React.useState<number>(8);
  const [boxCost, setBoxCost] = React.useState<number>(0);

  const areaSqft = React.useMemo(() => {
    const L = lengthToFeet(roomLength, lengthUnit);
    const W = lengthToFeet(roomWidth, lengthUnit);
    return Math.max(0, L * W);
  }, [roomLength, roomWidth, lengthUnit]);

  const moduleSqft = React.useMemo(() => {
    // Effective module = (tile + grout) including grout joint
    const w_ft = depthToFeet(tileW, tileUnit);
    const h_ft = depthToFeet(tileH, tileUnit);
    const g_ft = depthToFeet(grout, tileUnit);
    const effW = Math.max(0, w_ft + g_ft);
    const effH = Math.max(0, h_ft + g_ft);
    return Math.max(0.0001, effW * effH);
  }, [tileW, tileH, grout, tileUnit]);

  const tilesNeededRaw = areaSqft / moduleSqft;
  const tilesWithWaste = Math.ceil(tilesNeededRaw * (1 + Math.max(0, wastePct) / 100));
  const boxes = perBox > 0 ? Math.ceil(tilesWithWaste / perBox) : 0;
  const estimatedCost = boxCost > 0 ? boxes * boxCost : 0;

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <SquareEqual className="size-5 text-primary" aria-hidden />
          <CardTitle className="text-base sm:text-lg">Tile Calculator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tile-room-unit">Room unit</Label>
            <Select value={lengthUnit} onValueChange={(v) => setLengthUnit(v as LengthUnit)}>
              <SelectTrigger id="tile-room-unit" className="bg-secondary">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ft">Feet (ft)</SelectItem>
                <SelectItem value="m">Meters (m)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <NumberField id="tile-room-length" label={`Room length (${lengthUnit})`} value={roomLength} onChange={setRoomLength} min={0} />
          <NumberField id="tile-room-width" label={`Room width (${lengthUnit})`} value={roomWidth} onChange={setRoomWidth} min={0} />

          <div className="space-y-2">
            <Label htmlFor="tile-size-unit">Tile size unit</Label>
            <Select value={tileUnit} onValueChange={(v) => setTileUnit(v as DepthUnit)}>
              <SelectTrigger id="tile-size-unit" className="bg-secondary">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Inches (in)</SelectItem>
                <SelectItem value="cm">Centimeters (cm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <NumberField id="tile-w" label={`Tile width (${tileUnit})`} value={tileW} onChange={setTileW} min={0.1} step={0.1} />
          <NumberField id="tile-h" label={`Tile height (${tileUnit})`} value={tileH} onChange={setTileH} min={0.1} step={0.1} />
          <NumberField id="tile-grout" label={`Grout width (${tileUnit})`} value={grout} onChange={setGrout} min={0} step={0.01} />
          <NumberField id="tile-waste" label="Waste (%)" value={wastePct} onChange={setWastePct} min={0} max={30} />
          <NumberField id="tile-perbox" label="Tiles per box" value={perBox} onChange={setPerBox} min={1} step={1} />
          <NumberField id="tile-boxcost" label="Box cost ($)" value={boxCost} onChange={setBoxCost} min={0} step={0.01} />
        </div>

        <Separator />

        <ResultsList
          items={[
            { label: "Room area", value: `${formatNumber(areaSqft)} sq ft (${formatNumber(sqftToArea(areaSqft, "sqm"))} m²)` },
            { label: "Effective tile module", value: `${formatNumber(moduleSqft)} sq ft/module` },
            { label: "Tiles (with waste)", value: `${tilesWithWaste} tiles` },
            ...(perBox > 0 ? [{ label: "Boxes", value: `${boxes} boxes` }] : []),
            ...(boxCost > 0 ? [{ label: "Estimated cost", value: `$${formatNumber(estimatedCost, 2)}` }] : []),
          ]}
        />
      </CardContent>
    </Card>
  );
}

/* ========================= Mulch Calculator ========================= */

function MulchCalculator() {
  const [areaUnit, setAreaUnit] = React.useState<AreaUnit>("sqft");
  const [lengthUnit, setLengthUnit] = React.useState<LengthUnit>("ft");
  const [length, setLength] = React.useState<number>(20);
  const [width, setWidth] = React.useState<number>(10);
  const [depthUnit, setDepthUnit] = React.useState<DepthUnit>("in");
  const [depth, setDepth] = React.useState<number>(3);
  const [bagSize, setBagSize] = React.useState<"2" | "3">("2"); // cu ft
  const [bagCost, setBagCost] = React.useState<number>(0);

  const areaSqft = React.useMemo(() => {
    const L = lengthToFeet(length, lengthUnit);
    const W = lengthToFeet(width, lengthUnit);
    return Math.max(0, L * W);
  }, [length, width, lengthUnit]);

  const depthFt = depthToFeet(depth, depthUnit);
  const volumeCuFt = areaSqft * depthFt;
  const cuYd = volumeCuFt * CUYD_PER_CUFT;
  const cuM = volumeCuFt * CUM_PER_CUFT;
  const bagSizeCuFt = bagSize === "2" ? 2 : 3;
  const bags = Math.ceil(volumeCuFt / bagSizeCuFt);
  const estimatedCost = bagCost > 0 ? bags * bagCost : 0;

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <RulerDimensionLine className="size-5 text-primary" aria-hidden />
          <CardTitle className="text-base sm:text-lg">Mulch Calculator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mulch-length-unit">Length unit</Label>
            <Select value={lengthUnit} onValueChange={(v) => setLengthUnit(v as LengthUnit)}>
              <SelectTrigger id="mulch-length-unit" className="bg-secondary">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ft">Feet (ft)</SelectItem>
                <SelectItem value="m">Meters (m)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <NumberField id="mulch-length" label={`Length (${lengthUnit})`} value={length} onChange={setLength} min={0} />
          <NumberField id="mulch-width" label={`Width (${lengthUnit})`} value={width} onChange={setWidth} min={0} />

          <div className="space-y-2">
            <Label htmlFor="mulch-depth-unit">Depth unit</Label>
            <Select value={depthUnit} onValueChange={(v) => setDepthUnit(v as DepthUnit)}>
              <SelectTrigger id="mulch-depth-unit" className="bg-secondary">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Inches (in)</SelectItem>
                <SelectItem value="cm">Centimeters (cm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <NumberField id="mulch-depth" label={`Depth (${depthUnit})`} value={depth} onChange={setDepth} min={0} step={0.25} />

          <div className="space-y-2">
            <Label htmlFor="mulch-bag">Bag size</Label>
            <Select value={bagSize} onValueChange={(v) => setBagSize(v as "2" | "3")}>
              <SelectTrigger id="mulch-bag" className="bg-secondary">
                <SelectValue placeholder="Select bag size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 cu ft</SelectItem>
                <SelectItem value="3">3 cu ft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <NumberField id="mulch-bag-cost" label="Bag cost ($)" value={bagCost} onChange={setBagCost} min={0} step={0.01} />
        </div>

        <Separator />

        <ResultsList
          items={[
            { label: "Area", value: `${formatNumber(areaSqft)} sq ft (${formatNumber(sqftToArea(areaSqft, "sqm"))} m²)` },
            { label: "Volume", value: `${formatNumber(volumeCuFt)} cu ft (${formatNumber(cuYd)} yd³, ${formatNumber(cuM)} m³)` },
            { label: "Bags needed", value: `${bags} bags (${bagSize} cu ft each)` },
            ...(bagCost > 0 ? [{ label: "Estimated cost", value: `$${formatNumber(estimatedCost, 2)}` }] : []),
          ]}
        />
      </CardContent>
    </Card>
  );
}

/* ========================= Gravel Calculator ========================= */

function GravelCalculator() {
  const [areaUnit, setAreaUnit] = React.useState<AreaUnit>("sqft");
  const [lengthUnit, setLengthUnit] = React.useState<LengthUnit>("ft");
  const [length, setLength] = React.useState<number>(30);
  const [width, setWidth] = React.useState<number>(12);
  const [depthUnit, setDepthUnit] = React.useState<DepthUnit>("in");
  const [depth, setDepth] = React.useState<number>(2);

  const [material, setMaterial] = React.useState<"pea" | "crushed" | "river">("crushed");
  const [costPerTon, setCostPerTon] = React.useState<number>(0);

  // Typical densities in US tons per cubic yard
  const densityTonPerYd = material === "pea" ? 1.4 : material === "crushed" ? 1.6 : 1.5;

  const areaSqft = React.useMemo(() => {
    const L = lengthToFeet(length, lengthUnit);
    const W = lengthToFeet(width, lengthUnit);
    return Math.max(0, L * W);
  }, [length, width, lengthUnit]);

  const depthFt = depthToFeet(depth, depthUnit);
  const volumeCuFt = areaSqft * depthFt;
  const cuYd = volumeCuFt * CUYD_PER_CUFT;
  const tons = Math.max(0, cuYd * densityTonPerYd);
  const kg = tons * KG_PER_TON_US * 1; // short ton to kg
  const estimatedCost = costPerTon > 0 ? tons * costPerTon : 0;

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Construction className="size-5 text-primary" aria-hidden />
          <CardTitle className="text-base sm:text-lg">Gravel Calculator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="grav-length-unit">Length unit</Label>
            <Select value={lengthUnit} onValueChange={(v) => setLengthUnit(v as LengthUnit)}>
              <SelectTrigger id="grav-length-unit" className="bg-secondary">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ft">Feet (ft)</SelectItem>
                <SelectItem value="m">Meters (m)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <NumberField id="grav-length" label={`Length (${lengthUnit})`} value={length} onChange={setLength} min={0} />
          <NumberField id="grav-width" label={`Width (${lengthUnit})`} value={width} onChange={setWidth} min={0} />

          <div className="space-y-2">
            <Label htmlFor="grav-depth-unit">Depth unit</Label>
            <Select value={depthUnit} onValueChange={(v) => setDepthUnit(v as DepthUnit)}>
              <SelectTrigger id="grav-depth-unit" className="bg-secondary">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Inches (in)</SelectItem>
                <SelectItem value="cm">Centimeters (cm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <NumberField id="grav-depth" label={`Depth (${depthUnit})`} value={depth} onChange={setDepth} min={0} step={0.25} />

          <div className="space-y-2">
            <Label htmlFor="grav-material">Material</Label>
            <Select value={material} onValueChange={(v) => setMaterial(v as "pea" | "crushed" | "river")}>
              <SelectTrigger id="grav-material" className="bg-secondary">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pea">Pea gravel (~1.4 t/yd³)</SelectItem>
                <SelectItem value="crushed">Crushed stone (~1.6 t/yd³)</SelectItem>
                <SelectItem value="river">River rock (~1.5 t/yd³)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <NumberField id="grav-cost" label="Cost per ton ($)" value={costPerTon} onChange={setCostPerTon} min={0} step={0.01} />
        </div>

        <Separator />

        <ResultsList
          items={[
            { label: "Area", value: `${formatNumber(areaSqft)} sq ft (${formatNumber(sqftToArea(areaSqft, "sqm"))} m²)` },
            { label: "Volume", value: `${formatNumber(volumeCuFt)} cu ft (${formatNumber(cuYd)} yd³, ${formatNumber(volumeCuFt * CUM_PER_CUFT)} m³)` },
            { label: "Estimated weight", value: `${formatNumber(tons, 3)} tons (${formatNumber(kg)} kg)` },
            ...(costPerTon > 0 ? [{ label: "Estimated cost", value: `$${formatNumber(estimatedCost, 2)}` }] : []),
          ]}
        />
      </CardContent>
    </Card>
  );
}

/* ========================= Helper UI ========================= */

function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 0.5,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="bg-secondary"
      />
    </div>
  );
}

function ResultsList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="grid gap-3">
      {items.map((it, i) => (
        <div key={i} className="flex items-center justify-between gap-4 min-w-0">
          <span className="text-sm text-muted-foreground">{it.label}</span>
          <span className="font-medium text-right break-words">{it.value}</span>
        </div>
      ))}
    </div>
  );
}

function formatNumber(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "0";
  return Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(n);
}

function cryptoId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}