"use client"

import React, { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Ruler, PencilRuler, TestTube, Weight, SquareSigma, SquarePi, Radical, RulerDimensionLine } from "lucide-react"
import { create, all, MathJsStatic, MathJsChain, MathNumericType, MathType } from "mathjs"
import clsx from "clsx"

type Props = {
  className?: string
  initialTab?:
    | "height"
    | "conversion"
    | "gdp"
    | "density"
    | "mass"
    | "weight"
    | "speed"
    | "molarity"
    | "molecularWeight"
    | "roman"
  style?: React.CSSProperties
}

const math = create(all, {
  number: "BigNumber",
  precision: 64,
}) as unknown as MathJsStatic

// Utilities
function parseNumeric(input: string): MathNumericType | null {
  try {
    if (input === "" || input == null) return null
    const val = math.evaluate(input) as MathNumericType
    if (typeof val === "number" && !isFinite(val)) return null
    return val
  } catch {
    return null
  }
}

function formatAll(n: MathNumericType | null) {
  if (n == null) return { auto: "–", sci: "–", fixed: "–" }
  try {
    return {
      auto: math.format(n, { notation: "auto", precision: 14 }),
      sci: math.format(n, { notation: "exponential", precision: 14 }),
      fixed: math.format(n, { notation: "fixed", precision: 10 }),
    }
  } catch {
    return { auto: "–", sci: "–", fixed: "–" }
  }
}

function big(n: number | string) {
  return math.bignumber(n)
}

function toNumberSafe(n: MathNumericType): number {
  try {
    return Number(math.number(n as any))
  } catch {
    return Number(n as any)
  }
}

// Periodic table (subset) for molecular weight (g/mol)
const ATOMIC_WEIGHTS: Record<string, number> = {
  H: 1.00794,
  He: 4.002602,
  Li: 6.941,
  Be: 9.012182,
  B: 10.811,
  C: 12.0107,
  N: 14.0067,
  O: 15.9994,
  F: 18.9984032,
  Ne: 20.1797,
  Na: 22.98976928,
  Mg: 24.3050,
  Al: 26.9815386,
  Si: 28.0855,
  P: 30.973762,
  S: 32.065,
  Cl: 35.453,
  K: 39.0983,
  Ar: 39.948,
  Ca: 40.078,
  Sc: 44.955912,
  Ti: 47.867,
  V: 50.9415,
  Cr: 51.9961,
  Mn: 54.938045,
  Fe: 55.845,
  Co: 58.933195,
  Ni: 58.6934,
  Cu: 63.546,
  Zn: 65.38,
  Ga: 69.723,
  Ge: 72.64,
  As: 74.92160,
  Se: 78.96,
  Br: 79.904,
  Kr: 83.798,
  Rb: 85.4678,
  Sr: 87.62,
  Y: 88.90585,
  Zr: 91.224,
  Nb: 92.90638,
  Mo: 95.96,
  Ru: 101.07,
  Rh: 102.90550,
  Pd: 106.42,
  Ag: 107.8682,
  Cd: 112.411,
  In: 114.818,
  Sn: 118.710,
  Sb: 121.760,
  Te: 127.60,
  I: 126.90447,
  Xe: 131.293,
  Cs: 132.9054519,
  Ba: 137.327,
  La: 138.90547,
  Ce: 140.116,
}

// Formula parser supporting nested parentheses and multipliers
function parseFormula(formula: string): Record<string, number> {
  if (!/^[A-Za-z0-9()]+$/.test(formula)) {
    throw new Error("Invalid characters in formula.")
  }
  let i = 0
  function parseGroup(): Record<string, number> {
    const counts: Record<string, number> = {}
    while (i < formula.length) {
      const char = formula[i]
      if (char === "(") {
        i++
        const inner = parseGroup()
        if (formula[i] !== ")") throw new Error("Mismatched parentheses.")
        i++
        const mult = readNumber() ?? 1
        for (const el in inner) {
          counts[el] = (counts[el] ?? 0) + inner[el] * mult
        }
      } else if (char === ")") {
        break
      } else {
        const el = readElement()
        const qty = readNumber() ?? 1
        counts[el] = (counts[el] ?? 0) + qty
      }
    }
    return counts
  }
  function readElement(): string {
    if (i >= formula.length) throw new Error("Unexpected end of formula.")
    const first = formula[i]
    if (!/[A-Z]/.test(first)) throw new Error(`Expected element at position ${i + 1}.`)
    i++
    let symbol = first
    if (i < formula.length && /[a-z]/.test(formula[i])) {
      symbol += formula[i]
      i++
    }
    if (!ATOMIC_WEIGHTS[symbol]) {
      throw new Error(`Unknown element: ${symbol}`)
    }
    return symbol
  }
  function readNumber(): number | null {
    const start = i
    while (i < formula.length && /[0-9]/.test(formula[i])) i++
    if (i === start) return null
    const n = Number(formula.slice(start, i))
    if (!Number.isFinite(n) || n <= 0) throw new Error("Invalid quantity in formula.")
    return n
  }
  const result = parseGroup()
  if (i !== formula.length) throw new Error("Invalid formula.")
  return result
}

function computeMolecularWeight(formula: string): MathNumericType {
  const counts = parseFormula(formula)
  let sum = big(0)
  for (const el in counts) {
    const w = ATOMIC_WEIGHTS[el]
    sum = math.add(sum, math.multiply(w, counts[el])) as MathNumericType
  }
  return sum
}

const lengthUnits = ["mm", "cm", "m", "km", "in", "ft", "yd", "mi"] as const
const massUnits = ["mg", "g", "kg", "lb", "oz", "ton"] as const
const volumeUnits = ["mL", "L", "cm^3", "m^3", "in^3", "ft^3", "gal"] as const
const areaUnits = ["mm^2", "cm^2", "m^2", "km^2", "in^2", "ft^2", "yd^2", "acre"] as const
const timeUnits = ["ns", "us", "ms", "s", "min", "h", "day"] as const
const speedUnits = ["m/s", "km/h", "mph", "ft/s", "kn"] as const
const densityUnits = ["kg/m^3", "g/cm^3", "g/mL", "lb/ft^3"] as const
const molarityUnits = ["mol/L", "mmol/L", "M"] as const // synonyms for molarity

function tryUnitConvert(value: MathNumericType, from: string, to: string): MathNumericType {
  try {
    const u = (math as any).unit(value as any, from)
    const converted = u.to(to)
    return converted.value as MathNumericType
  } catch (e) {
    throw new Error("Incompatible units.")
  }
}

export default function MeasurementCalculators({
  className,
  initialTab = "conversion",
  style,
}: Props) {
  // Shared helpers
  const [tempKey, setTempKey] = useState(0) // to reset inputs on clear if needed

  // Height calculator state
  const [heightCm, setHeightCm] = useState<string>("")
  const [heightFeet, setHeightFeet] = useState<string>("")
  const [heightInches, setHeightInches] = useState<string>("")

  // Conversion calculator state
  const [convCategory, setConvCategory] = useState<"length" | "mass" | "volume" | "area" | "time" | "temperature">("length")
  const [convValue, setConvValue] = useState<string>("")
  const [convFrom, setConvFrom] = useState<string>("m")
  const [convTo, setConvTo] = useState<string>("ft")
  const convUnits = useMemo(() => {
    switch (convCategory) {
      case "length": return lengthUnits
      case "mass": return massUnits
      case "volume": return volumeUnits
      case "area": return areaUnits
      case "time": return timeUnits
      case "temperature": return ["degC", "degF", "K"] as const
    }
  }, [convCategory])

  // GDP
  const [c, setC] = useState<string>("")
  const [iInv, setIInv] = useState<string>("")
  const [g, setG] = useState<string>("")
  const [nx, setNX] = useState<string>("")
  const [population, setPopulation] = useState<string>("")

  // Density
  const [densityMass, setDensityMass] = useState<string>("")
  const [densityMassUnit, setDensityMassUnit] = useState<string>("kg")
  const [densityVol, setDensityVol] = useState<string>("")
  const [densityVolUnit, setDensityVolUnit] = useState<string>("m^3")
  const [densityOutUnit, setDensityOutUnit] = useState<string>("kg/m^3")

  // Mass calculator (from weight)
  const [weightValueForMass, setWeightValueForMass] = useState<string>("")
  const [weightUnitForMass, setWeightUnitForMass] = useState<string>("N")
  const [gravityMass, setGravityMass] = useState<string>("9.80665") // m/s^2
  const [massOutUnit, setMassOutUnit] = useState<string>("kg")

  // Weight calculator (from mass)
  const [massValueForWeight, setMassValueForWeight] = useState<string>("")
  const [massUnitForWeight, setMassUnitForWeight] = useState<string>("kg")
  const [gravityWeight, setGravityWeight] = useState<string>("9.80665") // m/s^2
  const [weightOutUnit, setWeightOutUnit] = useState<string>("N")

  // Speed
  const [distance, setDistance] = useState<string>("")
  const [distanceUnit, setDistanceUnit] = useState<string>("m")
  const [timeValue, setTimeValue] = useState<string>("")
  const [timeUnitSel, setTimeUnitSel] = useState<string>("s")
  const [speedOutUnit, setSpeedOutUnit] = useState<string>("m/s")

  // Molarity
  const [moles, setMoles] = useState<string>("")
  const [volume, setVolume] = useState<string>("")
  const [volumeUnitSel, setVolumeUnitSel] = useState<string>("L")
  const [molarityOut, setMolarityOut] = useState<string>("mol/L")

  // Molecular Weight
  const [formula, setFormula] = useState<string>("")
  const [mwMass, setMwMass] = useState<string>("") // optional: mass to compute moles
  const [mwMassUnit, setMwMassUnit] = useState<string>("g")

  // Roman numerals
  const [roman, setRoman] = useState<string>("")
  const [arabic, setArabic] = useState<string>("")

  // Height computations
  const cmVal = parseNumeric(heightCm)
  const ftVal = parseNumeric(heightFeet)
  const inVal = parseNumeric(heightInches)
  const heightResults = useMemo(() => {
    try {
      if (cmVal != null) {
        const cmNum = toNumberSafe(cmVal)
        if (cmNum < 0) throw new Error("Height cannot be negative.")
        const totalIn = cmNum / 2.54
        const feet = Math.floor(totalIn / 12)
        const inches = totalIn - feet * 12
        const meters = cmNum / 100
        return {
          meters: formatAll(meters),
          cm: formatAll(cmNum),
          feet,
          inches,
        }
      } else if (ftVal != null || inVal != null) {
        const ftNum = ftVal ? toNumberSafe(ftVal) : 0
        const inNum = inVal ? toNumberSafe(inVal) : 0
        if (ftNum < 0 || inNum < 0) throw new Error("Height cannot be negative.")
        const totalIn = ftNum * 12 + inNum
        const cmNum = totalIn * 2.54
        const meters = cmNum / 100
        return {
          meters: formatAll(meters),
          cm: formatAll(cmNum),
          feet: Math.floor(totalIn / 12),
          inches: totalIn - Math.floor(totalIn / 12) * 12,
        }
      }
      return null
    } catch (e: any) {
      toast.error(e.message || "Invalid height input.")
      return null
    }
  }, [cmVal, ftVal, inVal])

  // Conversion calculator computation
  const convResult = useMemo(() => {
    const v = parseNumeric(convValue)
    if (v == null) return null
    try {
      if (convCategory === "temperature") {
        // mathjs supports degC, degF, K
        const u = (math as any).unit(v as any, convFrom)
        const res = u.to(convTo).value as MathNumericType
        return formatAll(res)
      } else {
        const res = tryUnitConvert(v, convFrom, convTo)
        return formatAll(res)
      }
    } catch (e: any) {
      toast.error(e.message || "Conversion failed.")
      return null
    }
  }, [convValue, convFrom, convTo, convCategory])

  // GDP computation
  const gdpCalc = useMemo(() => {
    const Cv = parseNumeric(c) ?? big(0)
    const Iv = parseNumeric(iInv) ?? big(0)
    const Gv = parseNumeric(g) ?? big(0)
    const NXv = parseNumeric(nx) ?? big(0)
    try {
      const gdp = math.add(math.add(Cv, Iv), math.add(Gv, NXv)) as MathNumericType
      const perCapita = (() => {
        const pop = parseNumeric(population)
        if (pop == null) return null
        if (math.smallerEq(pop as any, 0 as any)) return null
        return math.divide(gdp as any, pop as any) as MathNumericType
      })()
      return {
        gdp: {
          ...formatAll(gdp),
        },
        perCapita: perCapita ? formatAll(perCapita) : null,
      }
    } catch {
      return null
    }
  }, [c, iInv, g, nx, population])

  // Density computation
  const densityResult = useMemo(() => {
    const m = parseNumeric(densityMass)
    const v = parseNumeric(densityVol)
    if (m == null || v == null) return null
    try {
      const massSI = tryUnitConvert(m, densityMassUnit, "kg")
      const volSI = tryUnitConvert(v, densityVolUnit, "m^3")
      if (math.equal(volSI as any, 0 as any)) throw new Error("Volume cannot be zero.")
      const rhoSI = math.divide(massSI as any, volSI as any) as MathNumericType // kg/m^3
      // Convert to selected unit
      const rhoOut = (() => {
        // Create a derived unit conversion by multiplying/dividing units
        const rhoUnit = densityOutUnit // e.g., "g/cm^3"
        // Represent rho as a unit to convert: (kg/m^3) to requested
        const rhoUnitObj = (math as any).unit(rhoSI as any, "kg/m^3").to(rhoUnit)
        return rhoUnitObj.value as MathNumericType
      })()
      return formatAll(rhoOut)
    } catch (e: any) {
      toast.error(e.message || "Density calculation failed.")
      return null
    }
  }, [densityMass, densityVol, densityMassUnit, densityVolUnit, densityOutUnit])

  // Mass from weight
  const massFromWeight = useMemo(() => {
    const w = parseNumeric(weightValueForMass)
    const gVal = parseNumeric(gravityMass)
    if (w == null || gVal == null) return null
    try {
      // Convert weight to Newtons
      let wN: MathNumericType
      if (weightUnitForMass === "N") {
        wN = w
      } else if (weightUnitForMass === "lbf") {
        // 1 lbf = 4.4482216152605 N
        wN = math.multiply(w as any, big("4.4482216152605")) as MathNumericType
      } else {
        throw new Error("Unsupported weight unit.")
      }
      if (math.equal(gVal as any, 0 as any)) throw new Error("Gravity cannot be zero.")
      const massKg = math.divide(wN as any, gVal as any) as MathNumericType
      const out = (() => {
        if (massOutUnit === "kg") return massKg
        if (massOutUnit === "g") return math.multiply(massKg as any, big(1000)) as MathNumericType
        if (massOutUnit === "lb") return math.multiply(massKg as any, big("2.2046226218487757")) as MathNumericType
        return massKg
      })()
      return formatAll(out)
    } catch (e: any) {
      toast.error(e.message || "Mass calculation failed.")
      return null
    }
  }, [weightValueForMass, gravityMass, weightUnitForMass, massOutUnit])

  // Weight from mass
  const weightFromMass = useMemo(() => {
    const m = parseNumeric(massValueForWeight)
    const gVal = parseNumeric(gravityWeight)
    if (m == null || gVal == null) return null
    try {
      const mKg = (() => {
        if (massUnitForWeight === "kg") return m
        if (massUnitForWeight === "g") return math.divide(m as any, big(1000)) as MathNumericType
        if (massUnitForWeight === "lb") return math.divide(m as any, big("2.2046226218487757")) as MathNumericType
        return m
      })()
      const wN = math.multiply(mKg as any, gVal as any) as MathNumericType
      const out = (() => {
        if (weightOutUnit === "N") return wN
        if (weightOutUnit === "lbf") return math.divide(wN as any, big("4.4482216152605")) as MathNumericType
        return wN
      })()
      return formatAll(out)
    } catch (e: any) {
      toast.error(e.message || "Weight calculation failed.")
      return null
    }
  }, [massValueForWeight, gravityWeight, massUnitForWeight, weightOutUnit])

  // Speed
  const speedResult = useMemo(() => {
    const d = parseNumeric(distance)
    const t = parseNumeric(timeValue)
    if (d == null || t == null) return null
    try {
      const dMeters = tryUnitConvert(d, distanceUnit, "m")
      const tSeconds = tryUnitConvert(t, timeUnitSel, "s")
      if (math.equal(tSeconds as any, 0 as any)) throw new Error("Time cannot be zero.")
      const vSI = math.divide(dMeters as any, tSeconds as any) as MathNumericType // m/s
      // Convert to output speed unit
      const vOut = (() => {
        const mapping: Record<string, string> = {
          "m/s": "m/s",
          "km/h": "km/h",
          "mph": "mile/hour",
          "ft/s": "ft/s",
          "kn": "kn",
        }
        const unitSym = mapping[speedOutUnit] ?? "m/s"
        const u = (math as any).unit(vSI as any, "m/s").to(unitSym)
        return u.value as MathNumericType
      })()
      return formatAll(vOut)
    } catch (e: any) {
      toast.error(e.message || "Speed calculation failed.")
      return null
    }
  }, [distance, timeValue, distanceUnit, timeUnitSel, speedOutUnit])

  // Molarity
  const molarityResult = useMemo(() => {
    const n = parseNumeric(moles)
    const V = parseNumeric(volume)
    if (n == null || V == null) return null
    try {
      const volL = tryUnitConvert(V, volumeUnitSel, "L")
      if (math.equal(volL as any, 0 as any)) throw new Error("Volume cannot be zero.")
      const M = math.divide(n as any, volL as any) as MathNumericType // mol/L
      let unit = molarityOut
      if (unit === "M") unit = "mol/L"
      // Convert if needed between mol/L and mmol/L
      const Mout = (() => {
        if (unit === "mol/L") return M
        if (unit === "mmol/L") return math.multiply(M as any, big(1000)) as MathNumericType
        return M
      })()
      return formatAll(Mout)
    } catch (e: any) {
      toast.error(e.message || "Molarity calculation failed.")
      return null
    }
  }, [moles, volume, volumeUnitSel, molarityOut])

  // Molecular weight
  const molecularWeightResult = useMemo(() => {
    if (!formula) return null
    try {
      const mw = computeMolecularWeight(formula)
      const extra = (() => {
        const massVal = parseNumeric(mwMass)
        if (massVal == null) return null
        // Convert mass to grams
        const massG = (() => {
          if (!mwMassUnit) return massVal
          if (mwMassUnit === "g") return massVal
          if (mwMassUnit === "mg") return math.divide(massVal as any, big(1000)) as MathNumericType
          if (mwMassUnit === "kg") return math.multiply(massVal as any, big(1000)) as MathNumericType
          return massVal
        })()
        if (math.smallerEq(mw as any, 0 as any)) return null
        const molesFromMass = math.divide(massG as any, mw as any) as MathNumericType
        return {
          moles: formatAll(molesFromMass),
        }
      })()
      return {
        mw: formatAll(mw),
        extra,
      }
    } catch (e: any) {
      toast.error(e.message || "Invalid chemical formula.")
      return null
    }
  }, [formula, mwMass, mwMassUnit])

  // Roman numerals converter
  const romanMap: [string, number][] = [
    ["M", 1000],
    ["CM", 900],
    ["D", 500],
    ["CD", 400],
    ["C", 100],
    ["XC", 90],
    ["L", 50],
    ["XL", 40],
    ["X", 10],
    ["IX", 9],
    ["V", 5],
    ["IV", 4],
    ["I", 1],
  ]
  function toRoman(num: number): string {
    if (num <= 0 || num >= 4000) throw new Error("Number must be 1..3999")
    let n = Math.floor(num)
    let r = ""
    for (const [sym, val] of romanMap) {
      while (n >= val) {
        r += sym
        n -= val
      }
    }
    return r
  }
  function fromRoman(str: string): number {
    const s = str.toUpperCase()
    let i = 0
    let total = 0
    while (i < s.length) {
      let matched = false
      for (const [sym, val] of romanMap) {
        if (s.startsWith(sym, i)) {
          total += val
          i += sym.length
          matched = true
          break
        }
      }
      if (!matched) throw new Error("Invalid Roman numeral.")
    }
    if (toRoman(total) !== s) throw new Error("Invalid or non-canonical Roman numeral.")
    return total
  }

  function handleArabicChange(v: string) {
    setArabic(v)
    const num = parseNumeric(v)
    if (num == null) return
    try {
      const asNum = toNumberSafe(num)
      const r = toRoman(asNum)
      setRoman(r)
    } catch (e: any) {
      // Don't toast on every keystroke; show only if user blurs/presses button ideally
    }
  }
  function handleRomanChange(v: string) {
    setRoman(v.toUpperCase())
    if (!v) {
      setArabic("")
      return
    }
    try {
      const n = fromRoman(v)
      setArabic(String(n))
    } catch {
      // silent until valid
    }
  }

  function clearAll() {
    setTempKey((k) => k + 1)
    // reset all states
    setHeightCm("")
    setHeightFeet("")
    setHeightInches("")
    setConvCategory("length")
    setConvValue("")
    setConvFrom("m")
    setConvTo("ft")
    setC("")
    setIInv("")
    setG("")
    setNX("")
    setPopulation("")
    setDensityMass("")
    setDensityMassUnit("kg")
    setDensityVol("")
    setDensityVolUnit("m^3")
    setDensityOutUnit("kg/m^3")
    setWeightValueForMass("")
    setWeightUnitForMass("N")
    setGravityMass("9.80665")
    setMassOutUnit("kg")
    setMassValueForWeight("")
    setMassUnitForWeight("kg")
    setGravityWeight("9.80665")
    setWeightOutUnit("N")
    setDistance("")
    setDistanceUnit("m")
    setTimeValue("")
    setTimeUnitSel("s")
    setSpeedOutUnit("m/s")
    setMoles("")
    setVolume("")
    setVolumeUnitSel("L")
    setMolarityOut("mol/L")
    setFormula("")
    setMwMass("")
    setMwMassUnit("g")
    setRoman("")
    setArabic("")
    toast.success("Cleared all inputs.")
  }

  return (
    <Card className={clsx("w-full bg-card text-card-foreground border border-border rounded-lg shadow-sm", className)} style={style}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl sm:text-2xl">Measurements & Units Calculators</CardTitle>
        <CardDescription className="text-muted-foreground">
          Precision scientific and unit conversions with high-accuracy math and scientific notation.
        </CardDescription>
      </CardHeader>
      <CardContent className="w-full">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Tabs defaultValue={initialTab} className="w-full">
            <TabsList className="flex w-full flex-wrap gap-1 bg-secondary">
              <TabsTrigger value="height" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <PencilRuler className="mr-2 h-4 w-4" aria-hidden="true" /> Height
              </TabsTrigger>
              <TabsTrigger value="conversion" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Ruler className="mr-2 h-4 w-4" aria-hidden="true" /> Conversion
              </TabsTrigger>
              <TabsTrigger value="gdp" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <SquareSigma className="mr-2 h-4 w-4" aria-hidden="true" /> GDP
              </TabsTrigger>
              <TabsTrigger value="density" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <RulerDimensionLine className="mr-2 h-4 w-4" aria-hidden="true" /> Density
              </TabsTrigger>
              <TabsTrigger value="mass" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Weight className="mr-2 h-4 w-4" aria-hidden="true" /> Mass
              </TabsTrigger>
              <TabsTrigger value="weight" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Weight className="mr-2 h-4 w-4" aria-hidden="true" /> Weight
              </TabsTrigger>
              <TabsTrigger value="speed" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Ruler className="mr-2 h-4 w-4" aria-hidden="true" /> Speed
              </TabsTrigger>
              <TabsTrigger value="molarity" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <TestTube className="mr-2 h-4 w-4" aria-hidden="true" /> Molarity
              </TabsTrigger>
              <TabsTrigger value="molecularWeight" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Radical className="mr-2 h-4 w-4" aria-hidden="true" /> Molecular Wt.
              </TabsTrigger>
              <TabsTrigger value="roman" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <SquarePi className="mr-2 h-4 w-4" aria-hidden="true" /> Roman
              </TabsTrigger>
            </TabsList>

            <div className="mt-4" key={tempKey}>
              {/* Height Calculator */}
              <TabsContent value="height" className="mt-0">
                <section aria-labelledby="height-title" className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="height-cm">Height (cm)</Label>
                      <Input
                        id="height-cm"
                        inputMode="decimal"
                        placeholder="e.g., 175 or 1.75e2"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        aria-describedby="height-cm-help"
                      />
                      <small id="height-cm-help" className="text-muted-foreground">Enter a value to auto-compute feet/inches and meters.</small>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="height-ft">Feet</Label>
                        <Input
                          id="height-ft"
                          inputMode="decimal"
                          placeholder="e.g., 5"
                          value={heightFeet}
                          onChange={(e) => setHeightFeet(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height-in">Inches</Label>
                        <Input
                          id="height-in"
                          inputMode="decimal"
                          placeholder="e.g., 9.5"
                          value={heightInches}
                          onChange={(e) => setHeightInches(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-md bg-secondary p-3">
                    <p className="text-sm text-muted-foreground">Results</p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-3">
                      <ResultBlock label="Meters" values={heightResults?.meters} />
                      <ResultBlock label="Centimeters" values={heightResults?.cm} />
                      <div className="rounded-md border border-border p-3">
                        <div className="text-sm font-medium">Feet/Inches</div>
                        <div className="mt-1 text-base">{heightResults ? `${heightResults.feet} ft ${heightResults.inches.toFixed(3)} in` : "–"}</div>
                      </div>
                    </div>
                  </div>
                </section>
              </TabsContent>

              {/* General Conversion */}
              <TabsContent value="conversion" className="mt-0">
                <section aria-labelledby="conversion-title" className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="conv-value">Value</Label>
                      <Input
                        id="conv-value"
                        inputMode="decimal"
                        placeholder="e.g., 3.5e2"
                        value={convValue}
                        onChange={(e) => setConvValue(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={convCategory}
                        onValueChange={(v: any) => {
                          setConvCategory(v)
                          // set sensible default units
                          if (v === "length") { setConvFrom("m"); setConvTo("ft") }
                          if (v === "mass") { setConvFrom("kg"); setConvTo("lb") }
                          if (v === "volume") { setConvFrom("L"); setConvTo("mL") }
                          if (v === "area") { setConvFrom("m^2"); setConvTo("ft^2") }
                          if (v === "time") { setConvFrom("s"); setConvTo("min") }
                          if (v === "temperature") { setConvFrom("degC"); setConvTo("degF") }
                        }}
                      >
                        <SelectTrigger aria-label="Select unit category">
                          <SelectValue placeholder="Choose category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="length">Length</SelectItem>
                          <SelectItem value="mass">Mass</SelectItem>
                          <SelectItem value="volume">Volume</SelectItem>
                          <SelectItem value="area">Area</SelectItem>
                          <SelectItem value="time">Time</SelectItem>
                          <SelectItem value="temperature">Temperature</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>From</Label>
                        <Select value={convFrom} onValueChange={setConvFrom}>
                          <SelectTrigger aria-label="From unit">
                            <SelectValue placeholder="From unit" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {convUnits.map((u) => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>To</Label>
                        <Select value={convTo} onValueChange={setConvTo}>
                          <SelectTrigger aria-label="To unit">
                            <SelectValue placeholder="To unit" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {convUnits.map((u) => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <ResultsRow results={convResult} />
                </section>
              </TabsContent>

              {/* GDP */}
              <TabsContent value="gdp" className="mt-0">
                <section className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Consumption (C)" value={c} onChange={setC} placeholder="e.g., 1.2e12" />
                    <Field label="Investment (I)" value={iInv} onChange={setIInv} placeholder="e.g., 3.4e11" />
                    <Field label="Government (G)" value={g} onChange={setG} placeholder="e.g., 5.6e11" />
                    <Field label="Net Exports (NX)" value={nx} onChange={setNX} placeholder="e.g., -2.1e10" />
                    <Field label="Population (optional)" value={population} onChange={setPopulation} placeholder="e.g., 3.3e8" />
                  </div>
                  <div className="rounded-md bg-secondary p-3">
                    <p className="text-sm text-muted-foreground">GDP Results</p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-3">
                      <ResultBlock label="GDP (C + I + G + NX)" values={gdpCalc?.gdp} />
                      <ResultBlock label="GDP (scientific)" values={gdpCalc?.gdp ? { auto: gdpCalc.gdp.sci, sci: gdpCalc.gdp.sci, fixed: gdpCalc.gdp.fixed } : undefined} />
                      <div className="rounded-md border border-border p-3">
                        <div className="text-sm font-medium">GDP per Capita</div>
                        <div className="mt-1 text-base">{gdpCalc?.perCapita?.auto ?? "–"}</div>
                        <small className="text-muted-foreground">If population provided</small>
                      </div>
                    </div>
                  </div>
                </section>
              </TabsContent>

              {/* Density */}
              <TabsContent value="density" className="mt-0">
                <section className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="dens-mass">Mass</Label>
                      <Input id="dens-mass" inputMode="decimal" placeholder="e.g., 12.5" value={densityMass} onChange={(e) => setDensityMass(e.target.value)} />
                      <Select value={densityMassUnit} onValueChange={setDensityMassUnit}>
                        <SelectTrigger aria-label="Mass unit">
                          <SelectValue placeholder="Select mass unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {["mg", "g", "kg", "lb", "oz"].map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dens-vol">Volume</Label>
                      <Input id="dens-vol" inputMode="decimal" placeholder="e.g., 2.5e-3" value={densityVol} onChange={(e) => setDensityVol(e.target.value)} />
                      <Select value={densityVolUnit} onValueChange={setDensityVolUnit}>
                        <SelectTrigger aria-label="Volume unit">
                          <SelectValue placeholder="Select volume unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {volumeUnits.concat(["mm^3"]).map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Output Density Unit</Label>
                      <Select value={densityOutUnit} onValueChange={setDensityOutUnit}>
                        <SelectTrigger aria-label="Density output">
                          <SelectValue placeholder="Select density unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {densityUnits.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <small className="text-muted-foreground">e.g., g/cm^3 is same as g/mL</small>
                    </div>
                  </div>
                  <ResultsRow results={densityResult} />
                </section>
              </TabsContent>

              {/* Mass from Weight */}
              <TabsContent value="mass" className="mt-0">
                <section className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="w-val">Weight</Label>
                      <Input id="w-val" inputMode="decimal" placeholder="e.g., 100" value={weightValueForMass} onChange={(e) => setWeightValueForMass(e.target.value)} />
                      <Select value={weightUnitForMass} onValueChange={setWeightUnitForMass}>
                        <SelectTrigger aria-label="Weight unit">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="N">N</SelectItem>
                          <SelectItem value="lbf">lbf</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="g-mass">Gravity (m/s^2)</Label>
                      <Input id="g-mass" inputMode="decimal" placeholder="9.80665" value={gravityMass} onChange={(e) => setGravityMass(e.target.value)} />
                      <small className="text-muted-foreground">Adjust for other celestial bodies</small>
                    </div>
                    <div className="space-y-2">
                      <Label>Output Mass Unit</Label>
                      <Select value={massOutUnit} onValueChange={setMassOutUnit}>
                        <SelectTrigger aria-label="Mass output unit">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="lb">lb</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <ResultsRow results={massFromWeight} />
                </section>
              </TabsContent>

              {/* Weight from Mass */}
              <TabsContent value="weight" className="mt-0">
                <section className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="m-val">Mass</Label>
                      <Input id="m-val" inputMode="decimal" placeholder="e.g., 70" value={massValueForWeight} onChange={(e) => setMassValueForWeight(e.target.value)} />
                      <Select value={massUnitForWeight} onValueChange={setMassUnitForWeight}>
                        <SelectTrigger aria-label="Mass unit">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="lb">lb</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="g-weight">Gravity (m/s^2)</Label>
                      <Input id="g-weight" inputMode="decimal" placeholder="9.80665" value={gravityWeight} onChange={(e) => setGravityWeight(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Output Weight Unit</Label>
                      <Select value={weightOutUnit} onValueChange={setWeightOutUnit}>
                        <SelectTrigger aria-label="Weight output unit">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="N">N</SelectItem>
                          <SelectItem value="lbf">lbf</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <ResultsRow results={weightFromMass} />
                </section>
              </TabsContent>

              {/* Speed */}
              <TabsContent value="speed" className="mt-0">
                <section className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="distance">Distance</Label>
                      <Input id="distance" inputMode="decimal" placeholder="e.g., 1000" value={distance} onChange={(e) => setDistance(e.target.value)} />
                      <Select value={distanceUnit} onValueChange={setDistanceUnit}>
                        <SelectTrigger aria-label="Distance unit">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {lengthUnits.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input id="time" inputMode="decimal" placeholder="e.g., 120" value={timeValue} onChange={(e) => setTimeValue(e.target.value)} />
                      <Select value={timeUnitSel} onValueChange={setTimeUnitSel}>
                        <SelectTrigger aria-label="Time unit">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeUnits.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Output Speed Unit</Label>
                      <Select value={speedOutUnit} onValueChange={setSpeedOutUnit}>
                        <SelectTrigger aria-label="Speed output unit">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {speedUnits.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <ResultsRow results={speedResult} />
                </section>
              </TabsContent>

              {/* Molarity */}
              <TabsContent value="molarity" className="mt-0">
                <section className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-4">
                    <Field label="Moles of solute (mol)" value={moles} onChange={setMoles} placeholder="e.g., 0.25" />
                    <div className="space-y-2">
                      <Label htmlFor="vol">Solution volume</Label>
                      <Input id="vol" inputMode="decimal" placeholder="e.g., 0.5" value={volume} onChange={(e) => setVolume(e.target.value)} />
                      <Select value={volumeUnitSel} onValueChange={setVolumeUnitSel}>
                        <SelectTrigger aria-label="Volume unit">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {["L", "mL", "uL", "m^3"].map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Output unit</Label>
                      <Select value={molarityOut} onValueChange={setMolarityOut}>
                        <SelectTrigger aria-label="Molarity output unit">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {molarityUnits.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <ResultsRow results={molarityResult} />
                </section>
              </TabsContent>

              {/* Molecular Weight */}
              <TabsContent value="molecularWeight" className="mt-0">
                <section className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="formula">Chemical Formula</Label>
                      <Input id="formula" placeholder="e.g., C6H12O6, Fe2(SO4)3" value={formula} onChange={(e) => setFormula(e.target.value.trim())} />
                      <small className="text-muted-foreground">Supports nested parentheses and element counts.</small>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mw-mass">Sample Mass (optional)</Label>
                      <Input id="mw-mass" inputMode="decimal" placeholder="e.g., 18" value={mwMass} onChange={(e) => setMwMass(e.target.value)} />
                      <Select value={mwMassUnit} onValueChange={setMwMassUnit}>
                        <SelectTrigger aria-label="Mass unit">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {["mg", "g", "kg"].map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="rounded-md bg-secondary p-3">
                    <p className="text-sm text-muted-foreground">Results</p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-3">
                      <ResultBlock label="Molecular Weight (g/mol)" values={molecularWeightResult?.mw} />
                      <div className="rounded-md border border-border p-3">
                        <div className="text-sm font-medium">Moles from Mass</div>
                        <div className="mt-1 text-base">{molecularWeightResult?.extra?.moles.auto ?? "–"}</div>
                        <small className="text-muted-foreground">If mass provided</small>
                      </div>
                    </div>
                  </div>
                </section>
              </TabsContent>

              {/* Roman Numeral Converter */}
              <TabsContent value="roman" className="mt-0">
                <section className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="arabic">Arabic (1..3999)</Label>
                      <Input id="arabic" inputMode="numeric" placeholder="e.g., 2024" value={arabic} onChange={(e) => handleArabicChange(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roman">Roman</Label>
                      <Input id="roman" placeholder="e.g., MMXXIV" value={roman} onChange={(e) => handleRomanChange(e.target.value)} />
                    </div>
                  </div>
                  <div className="rounded-md bg-secondary p-3">
                    <p className="text-sm text-muted-foreground">Bidirectional conversion with validity checks.</p>
                  </div>
                </section>
              </TabsContent>
            </div>
          </Tabs>

          <div className="shrink-0">
            <Button variant="secondary" onClick={clearAll} className="bg-secondary hover:bg-muted">
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  id,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  id?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputMode="decimal" />
    </div>
  )
}

function ResultBlock({
  label,
  values,
}: {
  label: string
  values?: { auto: string; sci: string; fixed: string }
}) {
  return (
    <div className="rounded-md border border-border p-3 break-words">
      <div className="text-sm font-medium">{label}</div>
      <div className="mt-1 grid gap-1">
        <div className="text-base">{values?.auto ?? "–"}</div>
        <div className="text-xs text-muted-foreground">Scientific: {values?.sci ?? "–"}</div>
        <div className="text-xs text-muted-foreground">Fixed: {values?.fixed ?? "–"}</div>
      </div>
    </div>
  )
}

function ResultsRow({ results }: { results: { auto: string; sci: string; fixed: string } | null }) {
  return (
    <div className="rounded-md bg-secondary p-3">
      <p className="text-sm text-muted-foreground">Results</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        <ResultBlock label="Auto" values={results ?? undefined} />
        <ResultBlock label="Scientific Notation" values={results ? { auto: results.sci, sci: results.sci, fixed: results.fixed } : undefined} />
        <ResultBlock label="Fixed" values={results ? { auto: results.fixed, sci: results.sci, fixed: results.fixed } : undefined} />
      </div>
    </div>
  )
}