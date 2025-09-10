"use client";

import React from "react";
import { Wind, ThermometerSun, Thermometer, ThermometerSnowflake, CloudSun } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type ClassValue = string | undefined;
function cn(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(" ");
}

type TemperatureUnit = "F" | "C";
type WindUnit = "mph" | "kph";

interface WeatherCalculatorsProps {
  className?: string;
  defaultTab?: "windchill" | "heatindex" | "dewpoint";
}

function fToC(f: number) {
  return (f - 32) * (5 / 9);
}
function cToF(c: number) {
  return c * (9 / 5) + 32;
}
function mphToKph(mph: number) {
  return mph * 1.609344;
}
function kphToMph(kph: number) {
  return kph / 1.609344;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function getHeatIndexF(tempF: number, rh: number) {
  // NWS simplified for T < 80°F
  const hiSimple = 0.5 * (tempF + 61.0 + ((tempF - 68.0) * 1.2) + (rh * 0.094));
  const hiAvg = (hiSimple + tempF) / 2;
  if (hiAvg < 80) {
    return hiAvg;
  }

  // Rothfusz regression
  let hi =
    -42.379 +
    2.04901523 * tempF +
    10.14333127 * rh -
    0.22475541 * tempF * rh -
    0.00683783 * tempF * tempF -
    0.05481717 * rh * rh +
    0.00122874 * tempF * tempF * rh +
    0.00085282 * tempF * rh * rh -
    0.00000199 * tempF * tempF * rh * rh;

  // Adjustments
  if (rh < 13 && tempF >= 80 && tempF <= 112) {
    const adj = ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(tempF - 95)) / 17);
    hi -= adj;
  } else if (rh > 85 && tempF >= 80 && tempF <= 87) {
    const adj = ((rh - 85) / 10) * ((87 - tempF) / 5);
    hi += adj;
  }

  return hi;
}

function getWindChillF(tempF: number, windMph: number) {
  // NWS 2001 formula; valid for temp <= 50°F and wind >= 3 mph
  const v16 = Math.pow(windMph, 0.16);
  return 35.74 + 0.6215 * tempF - 35.75 * v16 + 0.4275 * tempF * v16;
}

function getDewPointC(tempC: number, rh: number) {
  // Magnus-Tetens approximation (Alduchov & Eskridge constants)
  const b = 17.62;
  const c = 243.12;
  const gamma = Math.log(Math.max(rh, 0.1) / 100) + (b * tempC) / (c + tempC);
  return (c * gamma) / (b - gamma);
}

type Severity =
  | "safe"
  | "caution"
  | "warning"
  | "danger"
  | "extreme";

function badgeBySeverity(sev: Severity) {
  switch (sev) {
    case "safe":
      return "bg-secondary text-secondary-foreground";
    case "caution":
      return "bg-accent text-accent-foreground";
    case "warning":
      return "bg-muted text-foreground";
    case "danger":
      return "bg-destructive text-destructive-foreground";
    case "extreme":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted text-foreground";
  }
}

function heatIndexCategory(hiF: number): { label: string; severity: Severity; note: string } {
  if (hiF < 80) return { label: "Comfortable", severity: "safe", note: "Minimal heat stress." };
  if (hiF < 90) return { label: "Caution", severity: "caution", note: "Fatigue possible with prolonged exposure." };
  if (hiF < 103) return { label: "Extreme Caution", severity: "warning", note: "Heat cramps and heat exhaustion possible." };
  if (hiF < 125) return { label: "Danger", severity: "danger", note: "Heat cramps/exhaustion likely; heat stroke possible." };
  return { label: "Extreme Danger", severity: "extreme", note: "Heat stroke highly likely." };
}

function windChillCategory(wcF: number): { label: string; severity: Severity; note: string } {
  if (wcF > 30) return { label: "Low Risk", severity: "safe", note: "Little risk for most people." };
  if (wcF > 0) return { label: "Caution", severity: "caution", note: "Risk of frostbite with prolonged exposure." };
  if (wcF > -20) return { label: "Moderate", severity: "warning", note: "Frostbite possible on exposed skin in ≤30 min." };
  if (wcF > -50) return { label: "High", severity: "danger", note: "Frostbite possible in 10–30 min." };
  return { label: "Extreme", severity: "extreme", note: "Frostbite possible in <10 min. Limit outdoor exposure." };
}

function dewPointCategory(dpF: number): { label: string; severity: Severity; note: string } {
  if (dpF < 50) return { label: "Dry/Comfortable", severity: "safe", note: "Pleasant for most activities." };
  if (dpF < 60) return { label: "Pleasant", severity: "caution", note: "Comfortable for many people." };
  if (dpF < 65) return { label: "Slightly Humid", severity: "warning", note: "Noticeable humidity." };
  if (dpF < 70) return { label: "Humid", severity: "warning", note: "Sticky; may feel uncomfortable." };
  if (dpF < 75) return { label: "Oppressive", severity: "danger", note: "Discomfort likely; hydrate and rest." };
  return { label: "Miserable", severity: "extreme", note: "Very oppressive humidity; limit exertion." };
}

export default function WeatherCalculators({
  className,
  defaultTab = "heatindex",
}: WeatherCalculatorsProps) {
  // Shared units
  const [tUnit, setTUnit] = React.useState<TemperatureUnit>("F");
  const [wUnit, setWUnit] = React.useState<WindUnit>("mph");

  // Heat Index state
  const [hiTemp, setHiTemp] = React.useState<string>("90");
  const [hiRh, setHiRh] = React.useState<string>("60");

  // Wind Chill state
  const [wcTemp, setWcTemp] = React.useState<string>("30");
  const [wcWind, setWcWind] = React.useState<string>("10");

  // Dew Point state
  const [dpTemp, setDpTemp] = React.useState<string>("75");
  const [dpRh, setDpRh] = React.useState<string>("55");

  // Helpers to parse numeric
  const toNum = (v: string) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // Derived values
  const tempF_hi = tUnit === "F" ? toNum(hiTemp) : cToF(toNum(hiTemp));
  const tempF_wc = tUnit === "F" ? toNum(wcTemp) : cToF(toNum(wcTemp));
  const tempC_dp = tUnit === "C" ? toNum(dpTemp) : fToC(toNum(dpTemp));
  const windMph_wc = wUnit === "mph" ? toNum(wcWind) : kphToMph(toNum(wcWind));

  // Computations
  const hiF = getHeatIndexF(tempF_hi, Math.min(Math.max(toNum(hiRh), 0), 100));
  const hiOut = tUnit === "F" ? round1(hiF) : round1(fToC(hiF));
  const hiCat = heatIndexCategory(hiF);

  const wcValid = tempF_wc <= 50 && windMph_wc >= 3;
  const wcF = wcValid ? getWindChillF(tempF_wc, windMph_wc) : tempF_wc;
  const wcOut = tUnit === "F" ? round1(wcF) : round1(fToC(wcF));
  const wcCat = windChillCategory(wcF);

  const dpC = getDewPointC(tempC_dp, Math.min(Math.max(toNum(dpRh), 0), 100));
  const dpOut = tUnit === "C" ? round1(dpC) : round1(cToF(dpC));
  const dpCat = dewPointCategory(cToF(dpC));

  return (
    <section
      className={cn(
        "w-full max-w-full bg-card text-card-foreground rounded-lg border",
        className
      )}
      aria-label="Weather Calculators"
    >
      <Card className="bg-card border-0 shadow-none">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                <CloudSun className="h-5 w-5 text-primary" aria-hidden="true" />
                Weather Calculators
              </CardTitle>
              <CardDescription className="mt-1">
                Compute Heat Index, Wind Chill, and Dew Point with unit conversions and safety guidance.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="temp-unit" className="whitespace-nowrap">Temp</Label>
                <Select
                  value={tUnit}
                  onValueChange={(v: TemperatureUnit) => setTUnit(v)}
                >
                  <SelectTrigger id="temp-unit" className="w-[96px] bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F">Fahrenheit (°F)</SelectItem>
                    <SelectItem value="C">Celsius (°C)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="wind-unit" className="whitespace-nowrap">Wind</Label>
                <Select
                  value={wUnit}
                  onValueChange={(v: WindUnit) => setWUnit(v)}
                >
                  <SelectTrigger id="wind-unit" className="w-[96px] bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mph">mph</SelectItem>
                    <SelectItem value="kph">km/h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Separator />
        </CardHeader>

        <CardContent className="pt-2">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="bg-secondary">
              <TabsTrigger value="heatindex" className="min-w-0">
                <ThermometerSun className="h-4 w-4 mr-2" aria-hidden="true" />
                Heat Index
              </TabsTrigger>
              <TabsTrigger value="windchill" className="min-w-0">
                <Wind className="h-4 w-4 mr-2" aria-hidden="true" />
                Wind Chill
              </TabsTrigger>
              <TabsTrigger value="dewpoint" className="min-w-0">
                <Thermometer className="h-4 w-4 mr-2" aria-hidden="true" />
                Dew Point
              </TabsTrigger>
            </TabsList>

            {/* Heat Index */}
            <TabsContent value="heatindex" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="col-span-1 sm:col-span-2">
                  <Card className="bg-card">
                    <CardHeader>
                      <CardTitle className="text-lg">Inputs</CardTitle>
                      <CardDescription>
                        Based on NWS Rothfusz regression with low humidity adjustments.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="hi-temp">Air Temperature ({tUnit === "F" ? "°F" : "°C"})</Label>
                        <Input
                          id="hi-temp"
                          inputMode="decimal"
                          value={hiTemp}
                          onChange={(e) => setHiTemp(e.target.value)}
                          aria-describedby="hi-temp-help"
                          className="bg-secondary"
                        />
                        <small id="hi-temp-help" className="text-muted-foreground">
                          Typical range: 60–120 {tUnit === "F" ? "°F" : "°C"}.
                        </small>
                      </div>
                      <div>
                        <Label htmlFor="hi-rh">Relative Humidity (%)</Label>
                        <Input
                          id="hi-rh"
                          inputMode="decimal"
                          value={hiRh}
                          onChange={(e) => setHiRh(e.target.value)}
                          aria-describedby="hi-rh-help"
                          className="bg-secondary"
                        />
                        <small id="hi-rh-help" className="text-muted-foreground">
                          0–100%.
                        </small>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="col-span-1">
                  <Card className="bg-card">
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Result</CardTitle>
                        <Badge className={badgeBySeverity(hiCat.severity)} aria-label={`Severity: ${hiCat.label}`}>
                          {hiCat.label}
                        </Badge>
                      </div>
                      <CardDescription>Perceived temperature considering humidity.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-baseline gap-2">
                        <ThermometerSun className="h-5 w-5 text-primary" aria-hidden="true" />
                        <p className="text-3xl font-semibold leading-none">
                          {hiOut}°{tUnit}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground break-words">
                        {hiCat.note}
                      </p>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Heat Safety</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Hydrate frequently; avoid alcohol and caffeine.</li>
                          <li>Plan strenuous activity for morning or evening.</li>
                          <li>Seek shade or air conditioning during peak heat.</li>
                          <li>Check on children, older adults, and pets.</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Wind Chill */}
            <TabsContent value="windchill" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="col-span-1 sm:col-span-2">
                  <Card className="bg-card">
                    <CardHeader>
                      <CardTitle className="text-lg">Inputs</CardTitle>
                      <CardDescription>
                        NWS wind chill formula valid when T ≤ 50°F (10°C) and wind ≥ 3 mph (4.8 km/h).
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-1">
                        <Label htmlFor="wc-temp">Air Temperature ({tUnit === "F" ? "°F" : "°C"})</Label>
                        <Input
                          id="wc-temp"
                          inputMode="decimal"
                          value={wcTemp}
                          onChange={(e) => setWcTemp(e.target.value)}
                          aria-describedby="wc-temp-help"
                          className="bg-secondary"
                        />
                        <small id="wc-temp-help" className="text-muted-foreground">
                          Use values ≤ 50°F (10°C) for accuracy.
                        </small>
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="wc-wind">Wind Speed ({wUnit})</Label>
                        <Input
                          id="wc-wind"
                          inputMode="decimal"
                          value={wcWind}
                          onChange={(e) => setWcWind(e.target.value)}
                          aria-describedby="wc-wind-help"
                          className="bg-secondary"
                        />
                        <small id="wc-wind-help" className="text-muted-foreground">
                          Use values ≥ 3 mph (4.8 km/h) for accuracy.
                        </small>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="col-span-1">
                  <Card className="bg-card">
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Result</CardTitle>
                        <Badge className={badgeBySeverity(wcCat.severity)} aria-label={`Severity: ${wcCat.label}`}>
                          {wcCat.label}
                        </Badge>
                      </div>
                      <CardDescription>Perceived temperature considering wind.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-baseline gap-2">
                        <ThermometerSnowflake className="h-5 w-5 text-primary" aria-hidden="true" />
                        <p className="text-3xl font-semibold leading-none">
                          {wcOut}°{tUnit}
                        </p>
                      </div>
                      {!wcValid && (
                        <p className="text-sm text-muted-foreground">
                          Note: Conditions fall outside NWS wind chill validity; showing air temperature.
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground break-words">{wcCat.note}</p>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Cold Weather Safety</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Wear layers; cover exposed skin (hat, gloves, scarf).</li>
                          <li>Limit time outdoors; seek shelter from wind.</li>
                          <li>Keep dry—moisture increases heat loss.</li>
                          <li>Watch for signs of frostbite and hypothermia.</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Dew Point */}
            <TabsContent value="dewpoint" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="col-span-1 sm:col-span-2">
                  <Card className="bg-card">
                    <CardHeader>
                      <CardTitle className="text-lg">Inputs</CardTitle>
                      <CardDescription>
                        Uses the Magnus-Tetens approximation for dew point.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dp-temp">Air Temperature ({tUnit === "F" ? "°F" : "°C"})</Label>
                        <Input
                          id="dp-temp"
                          inputMode="decimal"
                          value={dpTemp}
                          onChange={(e) => setDpTemp(e.target.value)}
                          className="bg-secondary"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dp-rh">Relative Humidity (%)</Label>
                        <Input
                          id="dp-rh"
                          inputMode="decimal"
                          value={dpRh}
                          onChange={(e) => setDpRh(e.target.value)}
                          className="bg-secondary"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="col-span-1">
                  <Card className="bg-card">
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Result</CardTitle>
                        <Badge className={badgeBySeverity(dpCat.severity)} aria-label={`Severity: ${dpCat.label}`}>
                          {dpCat.label}
                        </Badge>
                      </div>
                      <CardDescription>Moisture content of the air.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-baseline gap-2">
                        <Thermometer className="h-5 w-5 text-primary" aria-hidden="true" />
                        <p className="text-3xl font-semibold leading-none">
                          {dpOut}°{tUnit}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground break-words">
                        {dpCat.note}
                      </p>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Humidity Tips</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>High dew points reduce sweat evaporation—pace activity.</li>
                          <li>Use fans/AC or seek shade to improve comfort.</li>
                          <li>Stay hydrated; take frequent cooling breaks.</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-secondary">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ThermometerSun className="h-4 w-4 text-primary" aria-hidden="true" />
                  <CardTitle className="text-base">About Heat Index</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                The Heat Index combines air temperature and relative humidity to estimate how hot it feels. Values are based on shaded, light-wind conditions; direct sun can increase the index by up to 15°F (8°C).
              </CardContent>
            </Card>
            <Card className="bg-secondary">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-primary" aria-hidden="true" />
                  <CardTitle className="text-base">About Wind Chill</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Wind Chill estimates heat loss from exposed skin due to wind. It is valid for cold temperatures (≤ 50°F / 10°C) and wind speeds ≥ 3 mph (4.8 km/h), and does not apply to indoor conditions.
              </CardContent>
            </Card>
            <Card className="bg-secondary">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CloudSun className="h-4 w-4 text-primary" aria-hidden="true" />
                  <CardTitle className="text-base">About Dew Point</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Dew Point represents the temperature at which air becomes saturated. Higher values indicate more moisture and a muggier feel, regardless of actual temperature.
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}