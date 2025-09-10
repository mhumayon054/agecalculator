"use client"

import * as React from "react"
import { Fuel, Gauge, CircleGauge, CarFront, Ruler, RulerDimensionLine, Diameter } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

type DistanceUnit = "mi" | "km"
type VolumeUnit = "gal" | "L"
type EconomyMode = "mpg" | "l_per_100km"
type TorqueUnit = "lbft" | "nm"
type PowerUnit = "hp" | "kw"
type OdoUnit = "mi" | "km"

const MI_TO_KM = 1.60934
const GAL_TO_L = 3.78541
const L100KM_PER_MPG = 235.215 // L/100km = 235.215 / MPG
const KW_PER_HP = 0.745699872
const REV_CONSTANT = 63360 // inches per mile

function toNumber(v: string | number): number {
  const n = typeof v === "number" ? v : parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function round(n: number, d = 2) {
  const p = Math.pow(10, d)
  return Math.round(n * p) / p
}

// Fuel-related conversions
function milesToKm(mi: number) { return mi * MI_TO_KM }
function kmToMiles(km: number) { return km / MI_TO_KM }
function galToL(gal: number) { return gal * GAL_TO_L }
function lToGal(L: number) { return L / GAL_TO_L }
function mpgToL100km(mpg: number) { return mpg <= 0 ? 0 : L100KM_PER_MPG / mpg }
function l100kmToMpg(l100: number) { return l100 <= 0 ? 0 : L100KM_PER_MPG / l100 }

// Torque/Power conversions
function hpFromTorqueRpm(torque: number, rpm: number, unit: TorqueUnit): { hp: number; kW: number } {
  const hp = unit === "lbft"
    ? (torque * rpm) / 5252
    : (torque * rpm) / 7127 // since 1 hp ≈ 745.7 W; hp = (Nm * rpm) / 7127
  const kW = hp * KW_PER_HP
  return { hp, kW }
}

// Tire parsing and geometry
type TireSpec = {
  widthMM: number
  aspect: number
  rimIn: number
  diameterIn: number
  diameterMM: number
  sidewallMM: number
  sectionWidthIn: number
  circumferenceIn: number
  circumferenceMM: number
  revsPerMile: number
}

const tirePattern = /^\s*(\d{3})\s*\/\s*(\d{2})\s*R\s*(\d{2})\s*$/i

function parseTireSize(input: string): TireSpec | null {
  const m = input.match(tirePattern)
  if (!m) return null
  const width = parseInt(m[1], 10) // mm
  const aspect = parseInt(m[2], 10) // %
  const rim = parseInt(m[3], 10) // inches
  const sidewallMM = (width * aspect) / 100
  const rimMM = rim * 25.4
  const diameterMM = rimMM + 2 * sidewallMM
  const diameterIn = diameterMM / 25.4
  const circumferenceMM = Math.PI * diameterMM
  const circumferenceIn = Math.PI * diameterIn
  const revsPerMile = REV_CONSTANT / circumferenceIn
  const sectionWidthIn = width / 25.4
  return {
    widthMM: width,
    aspect,
    rimIn: rim,
    diameterIn,
    diameterMM,
    sidewallMM,
    sectionWidthIn,
    circumferenceIn,
    circumferenceMM,
    revsPerMile,
  }
}

function suggestEquivalentSizes(base: TireSpec): string[] {
  // Generate simple near-equivalents varying aspect and rim to keep diameter within ±3%
  const suggestions: string[] = []
  const baseDia = base.diameterMM
  const widths = [base.widthMM - 10, base.widthMM, base.widthMM + 10, base.widthMM + 20].filter(w => w >= 155 && w <= 355)
  const aspects = [base.aspect - 5, base.aspect, base.aspect + 5, base.aspect + 10].filter(a => a >= 25 && a <= 85)
  const rims = [base.rimIn - 1, base.rimIn, base.rimIn + 1].filter(r => r >= 13 && r <= 24)

  for (const w of widths) {
    for (const a of aspects) {
      for (const r of rims) {
        const candidate = parseTireSize(`${w}/${a}R${r}`)
        if (!candidate) continue
        const delta = Math.abs((candidate.diameterMM - baseDia) / baseDia)
        if (delta <= 0.03) {
          const str = `${w}/${a}R${r}`
          if (!suggestions.includes(str) && str !== `${base.widthMM}/${base.aspect}R${base.rimIn}`) {
            suggestions.push(str)
          }
        }
      }
    }
  }
  return suggestions.slice(0, 8)
}

export interface TransportationCalculatorsProps {
  className?: string
  defaultTab?: "fuel-cost" | "gas-mileage" | "horsepower" | "engine-hp" | "mileage" | "tire-size"
}

export default function TransportationCalculators({
  className,
  defaultTab = "fuel-cost",
}: TransportationCalculatorsProps) {
  // Shared units state where helpful
  const [distanceUnitFC, setDistanceUnitFC] = React.useState<DistanceUnit>("mi")
  const [economyMode, setEconomyMode] = React.useState<EconomyMode>("mpg")
  const [priceUnit, setPriceUnit] = React.useState<VolumeUnit>("gal")
  const [torqueUnit, setTorqueUnit] = React.useState<TorqueUnit>("lbft")
  const [odoUnit, setOdoUnit] = React.useState<OdoUnit>("mi")
  const [powerPref, setPowerPref] = React.useState<PowerUnit>("hp")

  // Fuel Cost Calculator state
  const [distanceFC, setDistanceFC] = React.useState<string>("100")
  const [economy, setEconomy] = React.useState<string>("30") // mpg or L/100km
  const [price, setPrice] = React.useState<string>("3.85") // per gal or per L

  // Gas Mileage Calculator state
  const [distanceGM, setDistanceGM] = React.useState<string>("200")
  const [distanceUnitGM, setDistanceUnitGM] = React.useState<DistanceUnit>("mi")
  const [fuelUsedGM, setFuelUsedGM] = React.useState<string>("6")
  const [fuelUnitGM, setFuelUnitGM] = React.useState<VolumeUnit>("gal")

  // Horsepower (Torque & RPM)
  const [torque, setTorque] = React.useState<string>("300")
  const [rpm, setRpm] = React.useState<string>("6000")

  // Engine Horsepower (Drivetrain loss)
  const [drivetrainMode, setDrivetrainMode] = React.useState<"toEngine" | "toWheel">("toEngine")
  const [inputPower, setInputPower] = React.useState<string>("250")
  const [lossPercent, setLossPercent] = React.useState<string>("15")

  // Mileage (Odometer)
  const [odoStart, setOdoStart] = React.useState<string>("12345")
  const [odoEnd, setOdoEnd] = React.useState<string>("12595")
  const [reimbRate, setReimbRate] = React.useState<string>("0.67")

  // Tire Size
  const [tireA, setTireA] = React.useState<string>("205/55R16")
  const [tireB, setTireB] = React.useState<string>("225/45R17")

  // Fuel Cost Calculations
  const fcDistance = toNumber(distanceFC)
  const fcEconomy = toNumber(economy)
  const fcPrice = toNumber(price)

  // Normalize to miles and gallons for internal calc
  const distanceMi = distanceUnitFC === "mi" ? fcDistance : kmToMiles(fcDistance)
  const pricePerGal = priceUnit === "gal" ? fcPrice : lToGal(fcPrice)
  const mpg = economyMode === "mpg" ? fcEconomy : l100kmToMpg(fcEconomy)

  const fuelNeededGal = mpg > 0 ? distanceMi / mpg : 0
  const totalCost = fuelNeededGal * pricePerGal
  const costPerMi = distanceMi > 0 ? totalCost / distanceMi : 0
  const costPerKm = costPerMi / MI_TO_KM
  const fuelNeededL = galToL(fuelNeededGal)
  const lPer100km = mpgToL100km(mpg)

  // Gas Mileage Calculations
  const gmDistanceMi = distanceUnitGM === "mi" ? toNumber(distanceGM) : kmToMiles(toNumber(distanceGM))
  const gmFuelGal = fuelUnitGM === "gal" ? toNumber(fuelUsedGM) : lToGal(toNumber(fuelUsedGM))
  const gmMpg = gmFuelGal > 0 ? gmDistanceMi / gmFuelGal : 0
  const gmL100 = mpgToL100km(gmMpg)
  const gmKm = milesToKm(gmDistanceMi)
  const gmL = galToL(gmFuelGal)

  // Horsepower Calculations
  const tq = toNumber(torque)
  const r = toNumber(rpm)
  const hpRes = hpFromTorqueRpm(tq, r, torqueUnit)
  const hpValue = hpRes.hp
  const kWValue = hpRes.kW

  // Engine HP (drivetrain loss)
  const loss = Math.min(Math.max(toNumber(lossPercent), 0), 100) / 100
  const inPower = toNumber(inputPower)
  const engineHP = drivetrainMode === "toEngine" ? (inPower / (1 - loss)) : inPower
  const wheelHP = drivetrainMode === "toEngine" ? inPower : (inPower * (1 - loss))
  const engineKW = engineHP * KW_PER_HP
  const wheelKW = wheelHP * KW_PER_HP

  // Mileage Calculator
  const startO = toNumber(odoStart)
  const endO = toNumber(odoEnd)
  const distanceOdoBase = Math.max(endO - startO, 0)
  const reimbTotal = distanceOdoBase * toNumber(reimbRate)

  // Tire calculations
  const specA = React.useMemo(() => parseTireSize(tireA), [tireA])
  const specB = React.useMemo(() => parseTireSize(tireB), [tireB])
  const suggestions = React.useMemo(() => (specA ? suggestEquivalentSizes(specA) : []), [specA])

  return (
    <section className={cn("w-full max-w-full bg-card rounded-2xl shadow-sm border border-border", className)}>
      <Card className="bg-card border-0">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-xl sm:text-2xl tracking-tight">Transportation Calculators</CardTitle>
              <CardDescription className="mt-1">
                Fuel, mileage, performance, and tire size tools with unit conversions.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="flex flex-wrap gap-2 bg-muted p-1 rounded-lg">
              <TabsTrigger value="fuel-cost" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Fuel className="size-4 mr-2" aria-hidden />
                Fuel Cost
              </TabsTrigger>
              <TabsTrigger value="gas-mileage" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Gauge className="size-4 mr-2" aria-hidden />
                Gas Mileage
              </TabsTrigger>
              <TabsTrigger value="horsepower" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <CircleGauge className="size-4 mr-2" aria-hidden />
                Horsepower
              </TabsTrigger>
              <TabsTrigger value="engine-hp" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <CarFront className="size-4 mr-2" aria-hidden />
                Engine HP
              </TabsTrigger>
              <TabsTrigger value="mileage" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Ruler className="size-4 mr-2" aria-hidden />
                Mileage
              </TabsTrigger>
              <TabsTrigger value="tire-size" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <RulerDimensionLine className="size-4 mr-2" aria-hidden />
                Tire Size
              </TabsTrigger>
            </TabsList>

            {/* Fuel Cost Calculator */}
            <TabsContent value="fuel-cost" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="fc-distance">Trip distance</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="fc-distance"
                      type="number"
                      inputMode="decimal"
                      value={distanceFC}
                      onChange={(e) => setDistanceFC(e.target.value)}
                      className="bg-card"
                      aria-label="Trip distance"
                    />
                    <Select value={distanceUnitFC} onValueChange={(v: DistanceUnit) => setDistanceUnitFC(v)}>
                      <SelectTrigger className="w-[110px] bg-card">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mi">miles</SelectItem>
                        <SelectItem value="km">kilometers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fc-economy">Fuel economy</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="fc-economy"
                      type="number"
                      inputMode="decimal"
                      value={economy}
                      onChange={(e) => setEconomy(e.target.value)}
                      className="bg-card"
                      aria-label="Fuel economy value"
                    />
                    <Select value={economyMode} onValueChange={(v: EconomyMode) => setEconomyMode(v)}>
                      <SelectTrigger className="w-[140px] bg-card">
                        <SelectValue placeholder="Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mpg">MPG (US)</SelectItem>
                        <SelectItem value="l_per_100km">L/100km</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {economyMode === "mpg"
                      ? `= ${round(mpgToL100km(toNumber(economy) || 0), 2)} L/100km`
                      : `= ${round(l100kmToMpg(toNumber(economy) || 0), 2)} MPG`}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fc-price">Fuel price</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="fc-price"
                      type="number"
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="bg-card"
                      aria-label="Fuel price"
                    />
                    <Select value={priceUnit} onValueChange={(v: VolumeUnit) => setPriceUnit(v)}>
                      <SelectTrigger className="w-[110px] bg-card">
                        <SelectValue placeholder="Per" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gal">per gallon</SelectItem>
                        <SelectItem value="L">per liter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ResultStat label="Fuel needed" value={`${round(fuelNeededGal, 3)} gal • ${round(fuelNeededL, 2)} L`} icon={<Fuel className="size-4" aria-hidden />} />
                <ResultStat label="Total cost" value={`$${round(totalCost, 2).toLocaleString()}`} icon={<Gauge className="size-4" aria-hidden />} />
                <ResultStat label="Cost per distance" value={`$${round(costPerMi, 3)}/mi • $${round(costPerKm, 3)}/km`} icon={<CarFront className="size-4" aria-hidden />} />
                <ResultStat label="Efficiency" value={`${round(mpg, 2)} MPG • ${round(lPer100km, 2)} L/100km`} icon={<CircleGauge className="size-4" aria-hidden />} />
              </div>
            </TabsContent>

            {/* Gas Mileage Calculator */}
            <TabsContent value="gas-mileage" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="gm-distance">Distance</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="gm-distance"
                      type="number"
                      inputMode="decimal"
                      value={distanceGM}
                      onChange={(e) => setDistanceGM(e.target.value)}
                      className="bg-card"
                    />
                    <Select value={distanceUnitGM} onValueChange={(v: DistanceUnit) => setDistanceUnitGM(v)}>
                      <SelectTrigger className="w-[110px] bg-card">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mi">miles</SelectItem>
                        <SelectItem value="km">kilometers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    = {round(gmDistanceMi, 2)} mi • {round(gmKm, 2)} km
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gm-fuel">Fuel used</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="gm-fuel"
                      type="number"
                      inputMode="decimal"
                      value={fuelUsedGM}
                      onChange={(e) => setFuelUsedGM(e.target.value)}
                      className="bg-card"
                    />
                    <Select value={fuelUnitGM} onValueChange={(v: VolumeUnit) => setFuelUnitGM(v)}>
                      <SelectTrigger className="w-[110px] bg-card">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gal">gallons</SelectItem>
                        <SelectItem value="L">liters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    = {round(gmFuelGal, 3)} gal • {round(gmL, 2)} L
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ResultStat label="Fuel efficiency" value={`${round(gmMpg, 2)} MPG • ${round(gmL100, 2)} L/100km`} icon={<CircleGauge className="size-4" aria-hidden />} />
                <ResultStat label="Fuel used (std.)" value={`${round(gmFuelGal, 3)} gal • ${round(gmL, 2)} L`} icon={<Fuel className="size-4" aria-hidden />} />
              </div>
            </TabsContent>

            {/* Horsepower (Torque & RPM) */}
            <TabsContent value="horsepower" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="hp-torque">Torque</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="hp-torque"
                      type="number"
                      inputMode="decimal"
                      value={torque}
                      onChange={(e) => setTorque(e.target.value)}
                      className="bg-card"
                    />
                    <Select value={torqueUnit} onValueChange={(v: TorqueUnit) => setTorqueUnit(v)}>
                      <SelectTrigger className="w-[140px] bg-card">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lbft">lb·ft</SelectItem>
                        <SelectItem value="nm">N·m</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hp-rpm">Engine speed (RPM)</Label>
                  <Input
                    id="hp-rpm"
                    type="number"
                    inputMode="numeric"
                    value={rpm}
                    onChange={(e) => setRpm(e.target.value)}
                    className="bg-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="power-pref">Preferred power unit</Label>
                  <Select value={powerPref} onValueChange={(v: PowerUnit) => setPowerPref(v)}>
                    <SelectTrigger id="power-pref" className="bg-card">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hp">Horsepower (hp)</SelectItem>
                      <SelectItem value="kw">Kilowatt (kW)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ResultStat
                  label="Calculated power"
                  value={powerPref === "hp" ? `${round(hpValue, 2)} hp` : `${round(kWValue, 2)} kW`}
                  icon={<CircleGauge className="size-4" aria-hidden />}
                />
                <ResultStat
                  label="Also equals"
                  value={powerPref === "hp" ? `${round(kWValue, 2)} kW` : `${round(hpValue, 2)} hp`}
                  icon={<Gauge className="size-4" aria-hidden />}
                />
              </div>
            </TabsContent>

            {/* Engine HP (drivetrain loss) */}
            <TabsContent value="engine-hp" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="drivetrain-mode">Direction</Label>
                  <Select value={drivetrainMode} onValueChange={(v: "toEngine" | "toWheel") => setDrivetrainMode(v)}>
                    <SelectTrigger id="drivetrain-mode" className="bg-card">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="toEngine">Wheel ➜ Engine</SelectItem>
                      <SelectItem value="toWheel">Engine ➜ Wheel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="input-power">{drivetrainMode === "toEngine" ? "Wheel power" : "Engine power"}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="input-power"
                      type="number"
                      inputMode="decimal"
                      value={inputPower}
                      onChange={(e) => setInputPower(e.target.value)}
                      className="bg-card"
                    />
                    <Select value={powerPref} onValueChange={(v: PowerUnit) => setPowerPref(v)}>
                      <SelectTrigger className="w-[110px] bg-card">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hp">hp</SelectItem>
                        <SelectItem value="kw">kW</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {powerPref === "hp"
                      ? `= ${round(toNumber(inputPower) * KW_PER_HP, 2)} kW`
                      : `= ${round(toNumber(inputPower) / KW_PER_HP, 2)} hp`}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loss">Drivetrain loss (%)</Label>
                  <Input
                    id="loss"
                    type="number"
                    inputMode="decimal"
                    value={lossPercent}
                    onChange={(e) => setLossPercent(e.target.value)}
                    className="bg-card"
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ResultStat
                  label="Engine output"
                  value={`${round(engineHP, 1)} hp • ${round(engineKW, 1)} kW`}
                  icon={<CarFront className="size-4" aria-hidden />}
                />
                <ResultStat
                  label="Wheel output"
                  value={`${round(wheelHP, 1)} hp • ${round(wheelKW, 1)} kW`}
                  icon={<Gauge className="size-4" aria-hidden />}
                />
              </div>
            </TabsContent>

            {/* Mileage (Odometer/Reimbursement) */}
            <TabsContent value="mileage" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="odo-start">Odometer start</Label>
                  <Input
                    id="odo-start"
                    type="number"
                    inputMode="decimal"
                    value={odoStart}
                    onChange={(e) => setOdoStart(e.target.value)}
                    className="bg-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="odo-end">Odometer end</Label>
                  <Input
                    id="odo-end"
                    type="number"
                    inputMode="decimal"
                    value={odoEnd}
                    onChange={(e) => setOdoEnd(e.target.value)}
                    className="bg-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="odo-unit">Distance unit</Label>
                  <Select value={odoUnit} onValueChange={(v: OdoUnit) => setOdoUnit(v)}>
                    <SelectTrigger id="odo-unit" className="bg-card">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mi">miles</SelectItem>
                      <SelectItem value="km">kilometers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="rate">Reimbursement rate</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="rate"
                      type="number"
                      inputMode="decimal"
                      value={reimbRate}
                      onChange={(e) => setReimbRate(e.target.value)}
                      className="bg-card"
                    />
                    <div className="px-3 py-2 rounded-md border bg-muted text-sm text-muted-foreground">
                      per {odoUnit}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ResultStat
                  label="Distance traveled"
                  value={`${round(distanceOdoBase, 2)} ${odoUnit}`}
                  icon={<Ruler className="size-4" aria-hidden />}
                />
                <ResultStat
                  label="Reimbursement total"
                  value={`$${round(reimbTotal, 2).toLocaleString()}`}
                  icon={<Gauge className="size-4" aria-hidden />}
                />
              </div>
            </TabsContent>

            {/* Tire Size Calculator */}
            <TabsContent value="tire-size" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tire-a">Tire A (e.g., 205/55R16)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tire-a"
                      value={tireA}
                      onChange={(e) => setTireA(e.target.value)}
                      placeholder="205/55R16"
                      className="bg-card"
                      aria-invalid={specA ? undefined : true}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="shrink-0"
                      onClick={() => specA && setTireB(`${specA.widthMM + 20}/${Math.max(25, specA.aspect - 10)}R${specA.rimIn + 1}`)}
                    >
                      <Diameter className="size-4 mr-2" aria-hidden />
                      Suggest
                    </Button>
                  </div>
                  {!specA && <p className="text-sm text-destructive">Enter size like 205/55R16</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tire-b">Tire B (compare)</Label>
                  <Input
                    id="tire-b"
                    value={tireB}
                    onChange={(e) => setTireB(e.target.value)}
                    placeholder="225/45R17"
                    className="bg-card"
                    aria-invalid={specB ? undefined : true}
                  />
                  {!specB && <p className="text-sm text-destructive">Enter size like 225/45R17</p>}
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <SpecCard title="Tire A Specs" spec={specA} />
                <SpecCard title="Tire B Specs" spec={specB} />
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <Card className="bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <RulerDimensionLine className="size-4" aria-hidden />
                      Comparison
                    </CardTitle>
                    <CardDescription>Differences between Tire A and Tire B</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    {specA && specB ? (
                      <>
                        <CompareRow label="Overall diameter" a={`${round(specA.diameterIn, 2)} in`} b={`${round(specB.diameterIn, 2)} in`} />
                        <CompareRow label="Circumference" a={`${round(specA.circumferenceIn, 2)} in`} b={`${round(specB.circumferenceIn, 2)} in`} />
                        <CompareRow label="Sidewall height" a={`${round(specA.sidewallMM / 25.4, 2)} in`} b={`${round(specB.sidewallMM / 25.4, 2)} in`} />
                        <CompareRow label="Section width" a={`${round(specA.sectionWidthIn, 2)} in`} b={`${round(specB.sectionWidthIn, 2)} in`} />
                        <CompareRow label="Revs per mile" a={`${round(specA.revsPerMile, 1)}`} b={`${round(specB.revsPerMile, 1)}`} />
                        <div className="text-sm text-muted-foreground mt-2">
                          Speedometer impact: If calibrated for A, at 60 mph, actual speed on B ≈ {round(60 * (specB.diameterIn / specA.diameterIn), 2)} mph.
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Enter valid sizes to compare.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Diameter className="size-4" aria-hidden />
                      Equivalent Sizes (±3% diameter)
                    </CardTitle>
                    <CardDescription>Common alternatives close to Tire A</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {specA && suggestions.length > 0 ? (
                      suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="px-3 py-1.5 rounded-md bg-muted hover:bg-secondary text-sm transition-colors"
                          onClick={() => setTireB(s)}
                          aria-label={`Use ${s} as Tire B`}
                        >
                          {s}
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Enter Tire A to see suggestions.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  )
}

function ResultStat({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-secondary/50 p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium break-words">{value}</div>
      </div>
    </div>
  )
}

function SpecCard({ title, spec }: { title: string; spec: TireSpec | null }) {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <RulerDimensionLine className="size-4" aria-hidden />
          {title}
        </CardTitle>
        <CardDescription>Decoded tire dimensions and performance metrics</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {spec ? (
          <>
            <SpecRow label="Section width" value={`${spec.widthMM} mm • ${round(spec.sectionWidthIn, 2)} in`} />
            <SpecRow label="Aspect ratio" value={`${spec.aspect} %`} />
            <SpecRow label="Rim diameter" value={`${spec.rimIn} in`} />
            <SpecRow label="Sidewall height" value={`${round(spec.sidewallMM, 1)} mm • ${round(spec.sidewallMM / 25.4, 2)} in`} />
            <SpecRow label="Overall diameter" value={`${round(spec.diameterMM, 1)} mm • ${round(spec.diameterIn, 2)} in`} />
            <SpecRow label="Circumference" value={`${round(spec.circumferenceMM, 0)} mm • ${round(spec.circumferenceIn, 2)} in`} />
            <SpecRow label="Revs per mile" value={`${round(spec.revsPerMile, 1)}`} />
          </>
        ) : (
          <p className="text-sm text-destructive">Invalid size. Use format 205/55R16.</p>
        )}
      </CardContent>
    </Card>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 min-w-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium min-w-0 text-right truncate">{value}</span>
    </div>
  )
}

function CompareRow({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{a}</span>
      <span className="text-muted-foreground">→</span>
      <span className="font-medium">{b}</span>
    </div>
  )
}