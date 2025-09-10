"use client";

import React, { useMemo, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  addDays,
  addHours,
  addMinutes,
  addMonths,
  addSeconds,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  format,
  getDay,
  intervalToDuration,
  isValid,
  parseISO,
} from "date-fns";
import {
  CalendarDays,
  CalendarClock,
  CalendarPlus,
  CalendarSearch,
  Clock,
  Clock3,
  Timer,
} from "lucide-react";

type ClassProp = {
  className?: string;
  layout?: "compact" | "full";
};

const tzList = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Australia/Sydney",
] as const;

type Tz = (typeof tzList)[number];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function parseDateOnly(value: string | undefined): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
}

function parseDateTimeLocal(value: string | undefined): Date | null {
  if (!value) return null;
  // HTML datetime-local returns "YYYY-MM-DDTHH:mm" or with seconds "YYYY-MM-DDTHH:mm:ss"
  const d = new Date(value);
  return isValid(d) ? d : null;
}

function parseTimeToHMS(value: string | undefined): { h: number; m: number; s: number } | null {
  if (!value) return null;
  const parts = value.split(":").map((v) => Number(v));
  if (parts.some((n) => Number.isNaN(n))) return null;
  const [h, m, s = 0] = parts;
  if (h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) return null;
  return { h, m, s };
}

function hmsToSeconds(h: number, m: number, s: number) {
  return h * 3600 + m * 60 + s;
}

function secondsToHMS(total: number) {
  const sign = total < 0 ? -1 : 1;
  total = Math.abs(total);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  return { sign, h, m, s };
}

function formatHMS(totalSeconds: number) {
  const { sign, h, m, s } = secondsToHMS(totalSeconds);
  const prefix = sign < 0 ? "-" : "";
  return `${prefix}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function safeFormat(d: Date | null, fmt: string) {
  if (!d || !isValid(d)) return "—";
  try {
    return format(d, fmt);
  } catch {
    return "—";
  }
}

function DurationBreakdown({ duration }: { duration: ReturnType<typeof intervalToDuration> }) {
  const { years = 0, months = 0, days = 0, hours = 0, minutes = 0, seconds = 0 } = duration;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <div className="rounded-md bg-muted px-3 py-2"><div className="text-xs text-muted-foreground">Years</div><div className="text-sm font-semibold">{years}</div></div>
      <div className="rounded-md bg-muted px-3 py-2"><div className="text-xs text-muted-foreground">Months</div><div className="text-sm font-semibold">{months}</div></div>
      <div className="rounded-md bg-muted px-3 py-2"><div className="text-xs text-muted-foreground">Days</div><div className="text-sm font-semibold">{days}</div></div>
      <div className="rounded-md bg-muted px-3 py-2"><div className="text-xs text-muted-foreground">Hours</div><div className="text-sm font-semibold">{hours}</div></div>
      <div className="rounded-md bg-muted px-3 py-2"><div className="text-xs text-muted-foreground">Minutes</div><div className="text-sm font-semibold">{minutes}</div></div>
      <div className="rounded-md bg-muted px-3 py-2"><div className="text-xs text-muted-foreground">Seconds</div><div className="text-sm font-semibold">{seconds}</div></div>
    </div>
  );
}

// Time zone helpers (without date-fns-tz)
function getTzOffsetMs(utcMs: number, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value || "0");
  const y = get("year");
  const m = get("month");
  const d = get("day");
  const h = get("hour");
  const mi = get("minute");
  const s = get("second");
  const asUTC = Date.UTC(y, m - 1, d, h, mi, s);
  return asUTC - utcMs;
}

function zonedDateTimeToUtc(date: Date, timeZone: string): Date {
  // Treat the given Date's Y-M-D H:M:S as wall time in timeZone
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const h = date.getHours();
  const mi = date.getMinutes();
  const s = date.getSeconds();
  const localEpoch = Date.UTC(y, m, d, h, mi, s);
  // Iterative refinement to account for DST
  let utc = localEpoch - getTzOffsetMs(localEpoch, timeZone);
  utc = localEpoch - getTzOffsetMs(utc, timeZone);
  return new Date(utc);
}

function formatInTimeZone(utcDate: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short",
  });
  return fmt.format(utcDate);
}

function partsInTimeZone(utcDate: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "long",
  });
  const parts = dtf.formatToParts(utcDate);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
    weekday: get("weekday"),
  };
}

/* ========== Individual Calculators ========== */

function AgeCalculator() {
  const [birth, setBirth] = useState<string>("");
  const [asOf, setAsOf] = useState<string>("");

  const birthDate = useMemo(() => parseDateOnly(birth), [birth]);
  const asOfDate = useMemo(() => (asOf ? parseDateOnly(asOf) : new Date()), [asOf]);

  const valid = birthDate && asOfDate && isValid(birthDate) && isValid(asOfDate) && birthDate <= asOfDate;

  const duration = useMemo(() => {
    if (!valid || !birthDate || !asOfDate) return null;
    return intervalToDuration({ start: birthDate, end: asOfDate });
  }, [valid, birthDate, asOfDate]);

  return (
    <Card className="bg-card">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" aria-hidden />
          <CardTitle className="text-lg">Age Calculator</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Calculate exact age with years, months, and days. Leap years supported.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="birth-date">Birth date</Label>
            <Input
              id="birth-date"
              type="date"
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
              aria-invalid={!!birth && !birthDate}
              className="bg-background"
            />
            {!!birth && !birthDate && (
              <div className="text-xs text-destructive">Enter a valid date.</div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="as-of-date">As of</Label>
            <Input
              id="as-of-date"
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">Result</div>
          {valid && duration ? (
            <div className="space-y-3">
              <DurationBreakdown duration={duration} />
              <div className="rounded-md bg-muted px-3 py-2">
                <div className="text-xs text-muted-foreground">Total days</div>
                <div className="text-sm font-semibold">
                  {differenceInDays(asOfDate!, birthDate!)} days
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Enter valid dates to see the result.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DateCalculator() {
  const [start, setStart] = useState<string>("");
  const [mode, setMode] = useState<"add" | "sub">("add");
  const [amount, setAmount] = useState<string>("1");
  const [unit, setUnit] = useState<"days" | "weeks" | "months" | "years">("days");

  const startDate = useMemo(() => parseDateOnly(start), [start]);
  const amt = Number(amount);
  const validAmt = Number.isFinite(amt) && Math.abs(amt) < 100000;

  const result = useMemo(() => {
    if (!startDate || !isValid(startDate) || !validAmt) return null;
    const n = Math.trunc(Math.abs(amt));
    const sign = mode === "add" ? 1 : -1;
    switch (unit) {
      case "days":
        return (mode === "add" ? addDays : (d: Date, v: number) => addDays(d, -v))(startDate, sign * n);
      case "weeks":
        return (mode === "add" ? addWeeks : (d: Date, v: number) => addWeeks(d, -v))(startDate, sign * n);
      case "months":
        return (mode === "add" ? addMonths : (d: Date, v: number) => addMonths(d, -v))(startDate, sign * n);
      case "years":
        return (mode === "add" ? addYears : (d: Date, v: number) => addYears(d, -v))(startDate, sign * n);
      default:
        return null;
    }
  }, [startDate, unit, amt, validAmt, mode]);

  return (
    <Card className="bg-card">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-primary" aria-hidden />
          <CardTitle className="text-lg">Date Calculator</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Add or subtract days, weeks, months, or years from a date.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="date-start">Start date</Label>
            <Input
              id="date-start"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label>Operation</Label>
            <Select value={mode} onValueChange={(v: "add" | "sub") => setMode(v)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add</SelectItem>
                <SelectItem value="sub">Subtract</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d-]/g, ""))}
                className="bg-background"
              />
              {!validAmt && <div className="text-xs text-destructive">Enter a valid number.</div>}
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={(v: any) => setUnit(v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                  <SelectItem value="years">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">Result date</div>
          {result ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-md bg-muted px-3 py-2">
                <div className="text-xs text-muted-foreground">Long</div>
                <div className="text-sm font-semibold">{safeFormat(result, "PPP")}</div>
              </div>
              <div className="rounded-md bg-muted px-3 py-2">
                <div className="text-xs text-muted-foreground">ISO</div>
                <div className="text-sm font-semibold break-words">{safeFormat(result, "yyyy-MM-dd")}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Provide a start date and valid amount.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TimeCalculator() {
  const [time, setTime] = useState<string>("");
  const [mode, setMode] = useState<"add" | "sub">("add");
  const [hh, setHh] = useState<string>("0");
  const [mm, setMm] = useState<string>("0");
  const [ss, setSs] = useState<string>("0");

  const baseParsed = parseTimeToHMS(time);
  const validBase = !!baseParsed;

  const result = useMemo(() => {
    if (!validBase || !baseParsed) return null;
    const today = new Date();
    const base = new Date(today.getFullYear(), today.getMonth(), today.getDate(), baseParsed.h, baseParsed.m, baseParsed.s);
    const H = Math.trunc(Number(hh) || 0);
    const M = Math.trunc(Number(mm) || 0);
    const S = Math.trunc(Number(ss) || 0);
    const delta = (mode === "add" ? 1 : -1);
    let out = base;
    if (H) out = addHours(out, delta * H);
    if (M) out = addMinutes(out, delta * M);
    if (S) out = addSeconds(out, delta * S);
    return out;
  }, [validBase, baseParsed, mode, hh, mm, ss]);

  return (
    <Card className="bg-card">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" aria-hidden />
          <CardTitle className="text-lg">Time Calculator</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Add or subtract hours, minutes, and seconds to a time.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="base-time">Base time</Label>
            <Input
              id="base-time"
              type="time"
              step={1}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-invalid={!!time && !validBase}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label>Operation</Label>
            <Select value={mode} onValueChange={(v: "add" | "sub") => setMode(v)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add</SelectItem>
                <SelectItem value="sub">Subtract</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hh">Hours</Label>
            <Input id="hh" value={hh} onChange={(e) => setHh(e.target.value.replace(/[^\d-]/g, ""))} className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mm">Minutes</Label>
            <Input id="mm" value={mm} onChange={(e) => setMm(e.target.value.replace(/[^\d-]/g, ""))} className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ss">Seconds</Label>
            <Input id="ss" value={ss} onChange={(e) => setSs(e.target.value.replace(/[^\d-]/g, ""))} className="bg-background" />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">Result</div>
          {result ? (
            <div className="rounded-md bg-muted px-3 py-2 text-sm font-semibold">
              {safeFormat(result, "HH:mm:ss")}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Enter a base time to calculate.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HoursCalculator() {
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [breakMin, setBreakMin] = useState<string>("0");

  const startDt = useMemo(() => parseDateTimeLocal(start), [start]);
  const endDt = useMemo(() => parseDateTimeLocal(end), [end]);
  const breakM = Math.max(0, Math.trunc(Number(breakMin) || 0));

  const valid = startDt && endDt && isValid(startDt) && isValid(endDt) && endDt > startDt;

  const diffSeconds = useMemo(() => {
    if (!valid || !startDt || !endDt) return null;
    const seconds = Math.max(0, differenceInSeconds(endDt, startDt) - breakM * 60);
    return seconds;
  }, [valid, startDt, endDt, breakM]);

  return (
    <Card className="bg-card">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-primary" aria-hidden />
          <CardTitle className="text-lg">Hours Calculator</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">Compute total working hours between two datetimes with breaks.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="hours-start">Start</Label>
            <Input id="hours-start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hours-end">End</Label>
            <Input id="hours-end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="break">Break (minutes)</Label>
            <Input id="break" inputMode="numeric" value={breakMin} onChange={(e) => setBreakMin(e.target.value.replace(/[^\d]/g, ""))} className="bg-background" />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">Total</div>
          {diffSeconds != null ? (
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-md bg-muted px-3 py-2">
                <div className="text-xs text-muted-foreground">Hours (decimal)</div>
                <div className="text-sm font-semibold">{(diffSeconds / 3600).toFixed(2)} h</div>
              </div>
              <div className="rounded-md bg-muted px-3 py-2">
                <div className="text-xs text-muted-foreground">HH:MM:SS</div>
                <div className="text-sm font-semibold">{formatHMS(diffSeconds)}</div>
              </div>
              <div className="rounded-md bg-muted px-3 py-2">
                <div className="text-xs text-muted-foreground">Minutes</div>
                <div className="text-sm font-semibold">{Math.floor(diffSeconds / 60)} min</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-destructive">Ensure start is before end.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type TimeCardRow = { id: number; in: string; out: string; breakMin: string };

function TimeCardCalculator() {
  const [rows, setRows] = useState<TimeCardRow[]>([
    { id: 1, in: "", out: "", breakMin: "0" },
  ]);

  function addRow() {
    setRows((r) => [...r, { id: r.length ? r[r.length - 1].id + 1 : 1, in: "", out: "", breakMin: "0" }]);
  }
  function removeRow(id: number) {
    setRows((r) => r.length > 1 ? r.filter((x) => x.id !== id) : r);
  }
  function updateRow(id: number, patch: Partial<TimeCardRow>) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  const totals = useMemo(() => {
    let seconds = 0;
    for (const r of rows) {
      const start = parseDateTimeLocal(r.in);
      const end = parseDateTimeLocal(r.out);
      const b = Math.max(0, Math.trunc(Number(r.breakMin) || 0)) * 60;
      if (start && end && isValid(start) && isValid(end) && end > start) {
        seconds += Math.max(0, differenceInSeconds(end, start) - b);
      }
    }
    return {
      seconds,
      hoursDecimal: seconds / 3600,
      rowsCounted: rows.length,
    };
  }, [rows]);

  return (
    <Card className="bg-card">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary" aria-hidden />
          <CardTitle className="text-lg">Time Card Calculator</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">Sum hours across multiple shifts with optional breaks.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {rows.map((r, idx) => (
            <div key={r.id} className="grid gap-3 sm:grid-cols-5 p-3 rounded-md border border-border">
              <div className="space-y-1">
                <Label htmlFor={`in-${r.id}`}>In</Label>
                <Input id={`in-${r.id}`} type="datetime-local" value={r.in} onChange={(e) => updateRow(r.id, { in: e.target.value })} className="bg-background" />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`out-${r.id}`}>Out</Label>
                <Input id={`out-${r.id}`} type="datetime-local" value={r.out} onChange={(e) => updateRow(r.id, { out: e.target.value })} className="bg-background" />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`break-${r.id}`}>Break (min)</Label>
                <Input id={`break-${r.id}`} inputMode="numeric" value={r.breakMin} onChange={(e) => updateRow(r.id, { breakMin: e.target.value.replace(/[^\d]/g, "") })} className="bg-background" />
              </div>
              <div className="flex items-end">
                <Button type="button" variant="secondary" className="w-full" onClick={() => addRow()}>Add Row</Button>
              </div>
              <div className="flex items-end">
                <Button type="button" variant="ghost" className="w-full" onClick={() => removeRow(r.id)} disabled={rows.length <= 1}>
                  Remove
                </Button>
              </div>
              <div className="sm:col-span-5 text-xs text-muted-foreground">
                Row {idx + 1} {parseDateTimeLocal(r.in) && parseDateTimeLocal(r.out) ? "" : "(incomplete)"}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-md bg-muted px-3 py-2">
            <div className="text-xs text-muted-foreground">Total hours</div>
            <div className="text-sm font-semibold">{totals.hoursDecimal.toFixed(2)} h</div>
          </div>
          <div className="rounded-md bg-muted px-3 py-2">
            <div className="text-xs text-muted-foreground">HH:MM:SS</div>
            <div className="text-sm font-semibold">{formatHMS(totals.seconds)}</div>
          </div>
          <div className="rounded-md bg-muted px-3 py-2">
            <div className="text-xs text-muted-foreground">Shifts counted</div>
            <div className="text-sm font-semibold">{rows.length}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TimeZoneCalculator() {
  const [srcTz, setSrcTz] = useState<Tz>("UTC");
  const [dstTz, setDstTz] = useState<Tz>("America/New_York");
  const [dt, setDt] = useState<string>(""); // datetime-local treated as wall time in srcTz

  const local = useMemo(() => parseDateTimeLocal(dt), [dt]);

  const result = useMemo(() => {
    if (!local || !isValid(local)) return null;
    try {
      const utc = zonedDateTimeToUtc(local, srcTz);
      const target = partsInTimeZone(utc, dstTz);
      return { utc, target };
    } catch (e) {
      toast.error("Failed to convert time zone.");
      return null;
    }
  }, [local, srcTz, dstTz]);

  return (
    <Card className="bg-card">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" aria-hidden />
          <CardTitle className="text-lg">Time Zone Converter</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">Convert a date and time between time zones accurately (DST-aware).</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="tz-dt">Date & time</Label>
            <Input id="tz-dt" type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label>From</Label>
            <Select value={srcTz} onValueChange={(v: Tz) => setSrcTz(v)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Source time zone" />
              </SelectTrigger>
              <SelectContent>
                {tzList.map((z) => (
                  <SelectItem key={z} value={z}>{z}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Select value={dstTz} onValueChange={(v: Tz) => setDstTz(v)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Target time zone" />
              </SelectTrigger>
              <SelectContent>
                {tzList.map((z) => (
                  <SelectItem key={z} value={z}>{z}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {result ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-muted px-3 py-2">
              <div className="text-xs text-muted-foreground">UTC</div>
              <div className="text-sm font-semibold break-words">
                {format(result.utc, "yyyy-MM-dd HH:mm:ss")} UTC
              </div>
            </div>
            <div className="rounded-md bg-muted px-3 py-2">
              <div className="text-xs text-muted-foreground">In {dstTz}</div>
              <div className="text-sm font-semibold break-words">
                {formatInTimeZone(result.utc, dstTz)}
              </div>
            </div>
            <div className="sm:col-span-2 rounded-md bg-muted px-3 py-2">
              <div className="text-xs text-muted-foreground">Details</div>
              <div className="text-sm">
                {result.target.weekday}, {result.target.year}-{result.target.month}-{result.target.day} {result.target.hour}:{result.target.minute}:{result.target.second} ({dstTz})
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Enter a date & time to convert.</div>
        )}
      </CardContent>
    </Card>
  );
}

function TimeDurationCalculator() {
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [absolute, setAbsolute] = useState<boolean>(true);

  const startDt = useMemo(() => parseDateTimeLocal(start), [start]);
  const endDt = useMemo(() => parseDateTimeLocal(end), [end]);

  const valid = startDt && endDt && isValid(startDt) && isValid(endDt);

  const diff = useMemo(() => {
    if (!valid || !startDt || !endDt) return null;
    const sign = endDt >= startDt ? 1 : -1;
    const startRef = absolute && sign < 0 ? endDt : startDt;
    const endRef = absolute && sign < 0 ? startDt : endDt;
    const seconds = differenceInSeconds(endRef, startRef);
    const duration = intervalToDuration({ start: startRef, end: endRef });
    return { seconds: sign * seconds, duration };
  }, [valid, startDt, endDt, absolute]);

  return (
    <Card className="bg-card">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary" aria-hidden />
          <CardTitle className="text-lg">Time Duration Calculator</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">Find the duration between two datetimes with detailed breakdown.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="dur-start">Start</Label>
            <Input id="dur-start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dur-end">End</Label>
            <Input id="dur-end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="bg-background" />
          </div>
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="abs">Absolute</Label>
              <div className="flex items-center gap-2">
                <Switch id="abs" checked={absolute} onCheckedChange={setAbsolute} />
                <span className="text-sm text-muted-foreground">Ignore negative sign</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {diff ? (
          <div className="space-y-3">
            {!absolute && diff.seconds < 0 && (
              <div className="text-xs text-muted-foreground">End is before start, result is negative.</div>
            )}
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-md bg-muted px-3 py-2">
                <div className="text-xs text-muted-foreground">Total seconds</div>
                <div className="text-sm font-semibold break-words">{diff.seconds}</div>
              </div>
              <div className="rounded-md bg-muted px-3 py-2">
                <div className="text-xs text-muted-foreground">Total minutes</div>
                <div className="text-sm font-semibold break-words">{(diff.seconds / 60).toFixed(2)}</div>
              </div>
              <div className="rounded-md bg-muted px-3 py-2">
                <div className="text-xs text-muted-foreground">Total hours</div>
                <div className="text-sm font-semibold break-words">{(diff.seconds / 3600).toFixed(2)}</div>
              </div>
            </div>
            <DurationBreakdown duration={diff.duration} />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Enter valid start and end datetimes.</div>
        )}
      </CardContent>
    </Card>
  );
}

function DayCounter() {
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [inclusive, setInclusive] = useState<boolean>(false);

  const startDate = useMemo(() => parseDateOnly(start), [start]);
  const endDate = useMemo(() => parseDateOnly(end), [end]);

  const valid = startDate && endDate && isValid(startDate) && isValid(endDate);

  const days = useMemo(() => {
    if (!valid || !startDate || !endDate) return null;
    const diff = differenceInCalendarDays(endDate, startDate) + (inclusive ? 1 : 0);
    return diff;
  }, [valid, startDate, endDate, inclusive]);

  return (
    <Card className="bg-card">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <CalendarSearch className="h-5 w-5 text-primary" aria-hidden />
          <CardTitle className="text-lg">Day Counter</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">Count days between two dates (inclusive or exclusive).</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="dc-start">Start date</Label>
            <Input id="dc-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dc-end">End date</Label>
            <Input id="dc-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="bg-background" />
          </div>
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="incl">Inclusive</Label>
              <div className="flex items-center gap-2">
                <Switch id="incl" checked={inclusive} onCheckedChange={setInclusive} />
                <span className="text-sm text-muted-foreground">Include both start and end dates</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {days != null ? (
          <div className="rounded-md bg-muted px-3 py-2 text-sm font-semibold">
            {days} day{Math.abs(days) === 1 ? "" : "s"}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Enter valid dates.</div>
        )}
      </CardContent>
    </Card>
  );
}

function DayOfWeekCalculator() {
  const [date, setDate] = useState<string>("");

  const d = useMemo(() => parseDateOnly(date), [date]);

  const weekday = useMemo(() => {
    if (!d || !isValid(d)) return null;
    const idx = getDay(d); // 0=Sun
    const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return names[idx];
  }, [d]);

  return (
    <Card className="bg-card">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" aria-hidden />
          <CardTitle className="text-lg">Day of the Week</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">Find the weekday for any date.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-w-sm">
          <Label htmlFor="dow">Date</Label>
          <Input id="dow" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-background" />
        </div>

        <Separator />

        {weekday ? (
          <div className="rounded-md bg-muted px-3 py-2 text-sm font-semibold">{weekday}</div>
        ) : (
          <div className="text-sm text-muted-foreground">Pick a date to see the weekday.</div>
        )}
      </CardContent>
    </Card>
  );
}

/* ========== Main Aggregated Component ========== */

export default function DateTimeCalculators({ className, layout = "full" }: ClassProp) {
  const items = [
    { key: "age", label: "Age Calculator" },
    { key: "date", label: "Date Calculator" },
    { key: "time", label: "Time Calculator" },
    { key: "hours", label: "Hours Calculator" },
    { key: "timecard", label: "Time Card Calculator" },
    { key: "timezone", label: "Time Zone Calculator" },
    { key: "duration", label: "Time Duration Calculator" },
    { key: "daycounter", label: "Day Counter" },
    { key: "weekday", label: "Day of the Week Calculator" },
  ] as const;

  const [tab, setTab] = useState<(typeof items)[number]["key"]>("age");

  return (
    <section className={cx("w-full", className)}>
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
        <TabsList className="flex w-full overflow-x-auto rounded-lg bg-secondary p-1">
          <TabsTrigger value="age" className="data-[state=active]:bg-card">
            <CalendarDays className="mr-2 h-4 w-4" aria-hidden /> Age
          </TabsTrigger>
          <TabsTrigger value="date" className="data-[state=active]:bg-card">
            <CalendarPlus className="mr-2 h-4 w-4" aria-hidden /> Date
          </TabsTrigger>
          <TabsTrigger value="time" className="data-[state=active]:bg-card">
            <Clock className="mr-2 h-4 w-4" aria-hidden /> Time
          </TabsTrigger>
          <TabsTrigger value="hours" className="data-[state=active]:bg-card">
            <Clock3 className="mr-2 h-4 w-4" aria-hidden /> Hours
          </TabsTrigger>
          <TabsTrigger value="timecard" className="data-[state=active]:bg-card">
            <Timer className="mr-2 h-4 w-4" aria-hidden /> Time Card
          </TabsTrigger>
          <TabsTrigger value="timezone" className="data-[state=active]:bg-card">
            <CalendarClock className="mr-2 h-4 w-4" aria-hidden /> Time Zone
          </TabsTrigger>
          <TabsTrigger value="duration" className="data-[state=active]:bg-card">
            <Timer className="mr-2 h-4 w-4" aria-hidden /> Duration
          </TabsTrigger>
          <TabsTrigger value="daycounter" className="data-[state=active]:bg-card">
            <CalendarSearch className="mr-2 h-4 w-4" aria-hidden /> Day Counter
          </TabsTrigger>
          <TabsTrigger value="weekday" className="data-[state=active]:bg-card">
            <CalendarDays className="mr-2 h-4 w-4" aria-hidden /> Weekday
          </TabsTrigger>
        </TabsList>

        {/* Quick-access sub links */}
        <div className="mt-3">
          <div className="text-xs font-medium text-muted-foreground">Date & Time</div>
          <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {items.map((it) => (
              <li key={it.key}>
                <button
                  type="button"
                  className={cx(
                    "w-full text-left rounded-md px-2 py-1.5 text-sm",
                    "hover:bg-muted transition",
                    tab === it.key ? "bg-card shadow-sm" : ""
                  )}
                  onClick={() => setTab(it.key)}
                >
                  {it.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={cx("mt-4", layout === "compact" ? "space-y-4" : "space-y-6")}>
          <TabsContent value="age">
            <AgeCalculator />
          </TabsContent>
          <TabsContent value="date">
            <DateCalculator />
          </TabsContent>
          <TabsContent value="time">
            <TimeCalculator />
          </TabsContent>
          <TabsContent value="hours">
            <HoursCalculator />
          </TabsContent>
          <TabsContent value="timecard">
            <TimeCardCalculator />
          </TabsContent>
          <TabsContent value="timezone">
            <TimeZoneCalculator />
          </TabsContent>
          <TabsContent value="duration">
            <TimeDurationCalculator />
          </TabsContent>
          <TabsContent value="daycounter">
            <DayCounter />
          </TabsContent>
          <TabsContent value="weekday">
            <DayOfWeekCalculator />
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}