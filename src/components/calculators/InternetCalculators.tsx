"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Network, Binary, Gauge } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

type Props = {
  className?: string
}

function ipToInt(ip: string): number | null {
  const parts = ip.trim().split(".")
  if (parts.length !== 4) return null
  let int = 0
  for (let i = 0; i < 4; i++) {
    const n = Number(parts[i])
    if (!/^\d+$/.test(parts[i] ?? "")) return null
    if (Number.isNaN(n) || n < 0 || n > 255) return null
    int = (int << 8) + n
  }
  // ensure unsigned
  return int >>> 0
}

function intToIp(int: number): string {
  return [
    (int >>> 24) & 0xff,
    (int >>> 16) & 0xff,
    (int >>> 8) & 0xff,
    int & 0xff,
  ].join(".")
}

function cidrToMask(cidr: number): number {
  if (cidr <= 0) return 0
  if (cidr >= 32) return 0xffffffff >>> 0
  const mask = (0xffffffff << (32 - cidr)) >>> 0
  return mask
}

function maskToDotted(mask: number): string {
  return intToIp(mask)
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function copy(text: string, label: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${label} copied`))
      .catch(() => toast.error("Copy failed"))
  } else {
    toast.error("Clipboard not available")
  }
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "—"
  const s = Math.round(seconds)
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const mins = Math.floor((s % 3600) / 60)
  const secs = s % 60
  const parts: string[] = []
  if (days) parts.push(`${days}d`)
  if (hours || days) parts.push(`${hours}h`)
  if (mins || hours || days) parts.push(`${mins}m`)
  parts.push(`${secs}s`)
  return parts.join(" ")
}

function entropyBits(length: number, poolSize: number) {
  if (length <= 0 || poolSize <= 0) return 0
  return length * Math.log2(poolSize)
}

function strengthLabel(bits: number) {
  if (bits < 28) return { label: "Very Weak", color: "bg-destructive" }
  if (bits < 36) return { label: "Weak", color: "bg-destructive" }
  if (bits < 60) return { label: "Moderate", color: "bg-accent-foreground" }
  if (bits < 128) return { label: "Strong", color: "bg-primary" }
  return { label: "Very Strong", color: "bg-primary" }
}

export default function InternetCalculators({ className }: Props) {
  // Subnet state
  const [ip, setIp] = useState("192.168.1.10")
  const [cidr, setCidr] = useState<number>(24)
  const subnet = useMemo(() => {
    const ipInt = ipToInt(ip)
    const c = clamp(Math.floor(Number(cidr)), 0, 32)
    if (ipInt === null) {
      return { error: "Invalid IPv4 address", valid: false } as const
    }
    const mask = cidrToMask(c)
    const network = (ipInt & mask) >>> 0
    const broadcast = (network | (~mask >>> 0)) >>> 0
    const total = c === 32 ? 1 : 2 ** (32 - c)
    const usable =
      c >= 31 ? 0 : Math.max(0, total - 2) // standard usable hosts
    const firstHost =
      c >= 31 ? null : ((network + 1) >>> 0)
    const lastHost =
      c >= 31 ? null : ((broadcast - 1) >>> 0)

    return {
      valid: true,
      ip: intToIp(ipInt),
      cidr: c,
      subnetMask: maskToDotted(mask),
      network: intToIp(network),
      broadcast: intToIp(broadcast),
      firstHost: firstHost !== null ? intToIp(firstHost) : "—",
      lastHost: lastHost !== null ? intToIp(lastHost) : "—",
      usableHosts: usable,
      totalAddresses: total,
      ipClass: ipClassOf(ipInt),
    }
  }, [ip, cidr])

  function ipClassOf(ipInt: number): string {
    const firstOctet = (ipInt >>> 24) & 0xff
    if (firstOctet <= 127) return "Class A"
    if (firstOctet <= 191) return "Class B"
    if (firstOctet <= 223) return "Class C"
    if (firstOctet <= 239) return "Class D (Multicast)"
    return "Class E (Experimental)"
  }

  // Password generator state
  const [length, setLength] = useState(16)
  const [useLower, setUseLower] = useState(true)
  const [useUpper, setUseUpper] = useState(true)
  const [useNumbers, setUseNumbers] = useState(true)
  const [useSymbols, setUseSymbols] = useState(false)
  const [password, setPassword] = useState("")

  useEffect(() => {
    generatePassword()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function generatePassword() {
    const lowers = "abcdefghijklmnopqrstuvwxyz"
    const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const numbers = "0123456789"
    const symbols = "!@#$%^&*()-_=+[]{};:,.<>/?"
    let pool = ""
    if (useLower) pool += lowers
    if (useUpper) pool += uppers
    if (useNumbers) pool += numbers
    if (useSymbols) pool += symbols
    if (!pool) {
      toast.error("Select at least one character set")
      return
    }
    const arr = new Uint32Array(length)
    if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(arr)
    } else {
      for (let i = 0; i < length; i++) arr[i] = Math.floor(Math.random() * 0xffffffff)
    }
    let out = ""
    for (let i = 0; i < length; i++) {
      out += pool[arr[i] % pool.length]
    }
    setPassword(out)
  }

  const poolSize = (useLower ? 26 : 0) + (useUpper ? 26 : 0) + (useNumbers ? 10 : 0) + (useSymbols ? 30 : 0)
  const bits = entropyBits(length, poolSize)
  const sMeta = strengthLabel(bits)
  const strengthPct = Math.max(6, Math.min(100, Math.round((bits / 128) * 100)))

  // Bandwidth calculator state
  const [sizeValue, setSizeValue] = useState(1024) // default 1 GB if unit MB
  const [sizeUnit, setSizeUnit] = useState<"KB" | "MB" | "GB" | "TB">("MB")
  const [bwValue, setBwValue] = useState(100)
  const [bwUnit, setBwUnit] = useState<"bps" | "Kbps" | "Mbps" | "Gbps">("Mbps")
  const [overhead, setOverhead] = useState(10)

  const transfer = useMemo(() => {
    const sizeUnitMap = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 }
    const bwUnitMap = { bps: 1, Kbps: 1e3, Mbps: 1e6, Gbps: 1e9 }
    const bytes = Math.max(0, Number(sizeValue)) * sizeUnitMap[sizeUnit]
    const bits = bytes * 8
    const bw = Math.max(0.000001, Number(bwValue)) * bwUnitMap[bwUnit]
    const eff = bw * (1 - clamp(Number(overhead), 0, 99.9) / 100) // effective bps
    const seconds = bits / eff
    return {
      seconds,
      human: formatDuration(seconds),
      effMbps: eff / 1e6,
    }
  }, [sizeValue, sizeUnit, bwValue, bwUnit, overhead])

  return (
    <div className={["w-full max-w-full", className].filter(Boolean).join(" ")}>
      <Card className="bg-card">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-3">
            <Network className="h-5 w-5 text-primary" aria-hidden />
            <CardTitle className="text-lg sm:text-xl">Internet Calculators</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            IP subnetting, secure password generation, and bandwidth transfer time.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="subnet" className="w-full">
            <TabsList className="grid grid-cols-1 sm:grid-cols-3 w-full">
              <TabsTrigger value="subnet" className="gap-2">
                <Network className="h-4 w-4" aria-hidden /> IP Subnet
              </TabsTrigger>
              <TabsTrigger value="password" className="gap-2">
                <Binary className="h-4 w-4" aria-hidden /> Password
              </TabsTrigger>
              <TabsTrigger value="bandwidth" className="gap-2">
                <Gauge className="h-4 w-4" aria-hidden /> Bandwidth
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subnet" className="mt-6">
              <div className="grid gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="ip">IPv4 address</Label>
                    <Input
                      id="ip"
                      inputMode="numeric"
                      placeholder="e.g. 10.0.0.1"
                      className="mt-1"
                      value={ip}
                      onChange={(e) => setIp(e.target.value)}
                      aria-invalid={subnet.valid ? undefined : true}
                      aria-describedby="ip-help"
                    />
                    <small id="ip-help" className="text-muted-foreground">Format: x.x.x.x (0–255)</small>
                  </div>
                  <div>
                    <Label htmlFor="cidr">CIDR</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="shrink-0 rounded-md bg-secondary px-2 py-2 text-sm text-foreground">/</div>
                      <Input
                        id="cidr"
                        type="number"
                        min={0}
                        max={32}
                        value={cidr}
                        onChange={(e) => setCidr(clamp(Number(e.target.value), 0, 32))}
                        aria-label="CIDR prefix length"
                      />
                    </div>
                    <small className="text-muted-foreground">0–32</small>
                  </div>
                </div>

                <div
                  className="rounded-lg border bg-muted/60 p-4"
                  role="region"
                  aria-live="polite"
                >
                  {subnet.valid ? (
                    <div className="grid gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FieldRow
                          label="Network address"
                          value={`${subnet.network}/${subnet.cidr}`}
                          onCopy={() => copy(`${subnet.network}/${subnet.cidr}`, "Network")}
                        />
                        <FieldRow
                          label="Broadcast address"
                          value={subnet.broadcast}
                          onCopy={() => copy(subnet.broadcast, "Broadcast")}
                        />
                        <FieldRow
                          label="Subnet mask"
                          value={subnet.subnetMask}
                          onCopy={() => copy(subnet.subnetMask, "Subnet mask")}
                        />
                        <FieldRow
                          label="IP class"
                          value={subnet.ipClass}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FieldRow
                          label="Usable host range"
                          value={`${subnet.firstHost} – ${subnet.lastHost}`}
                          onCopy={() =>
                            copy(
                              `${subnet.firstHost} - ${subnet.lastHost}`,
                              "Host range"
                            )
                          }
                        />
                        <FieldRow
                          label="Usable hosts"
                          value={`${subnet.usableHosts.toLocaleString()}`}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FieldRow
                          label="Total addresses"
                          value={`${subnet.totalAddresses.toLocaleString()}`}
                        />
                        <FieldRow
                          label="Input IP (normalized)"
                          value={subnet.ip}
                          onCopy={() => copy(subnet.ip, "IP")}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-destructive text-sm">{(subnet as any).error}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="password" className="mt-6">
              <div className="grid gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="generated">Generated password</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        id="generated"
                        value={password}
                        readOnly
                        className="font-mono"
                        aria-describedby="pw-help"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          if (!password) {
                            toast.error("No password to copy")
                            return
                          }
                          copy(password, "Password")
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <small id="pw-help" className="text-muted-foreground">Copy and store securely.</small>
                  </div>
                  <div className="flex flex-col justify-end">
                    <Button
                      type="button"
                      className="w-full"
                      onClick={generatePassword}
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="length">Length: {length}</Label>
                    <input
                      id="length"
                      type="range"
                      min={4}
                      max={64}
                      value={length}
                      onChange={(e) => setLength(Number(e.target.value))}
                      className="w-full accent-primary"
                      aria-valuemin={4}
                      aria-valuemax={64}
                      aria-valuenow={length}
                    />
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          id="lower"
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={useLower}
                          onChange={(e) => setUseLower(e.target.checked)}
                        />
                        <Label htmlFor="lower" className="font-normal">Lowercase</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          id="upper"
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={useUpper}
                          onChange={(e) => setUseUpper(e.target.checked)}
                        />
                        <Label htmlFor="upper" className="font-normal">Uppercase</Label>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          id="numbers"
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={useNumbers}
                          onChange={(e) => setUseNumbers(e.target.checked)}
                        />
                        <Label htmlFor="numbers" className="font-normal">Numbers</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          id="symbols"
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={useSymbols}
                          onChange={(e) => setUseSymbols(e.target.checked)}
                        />
                        <Label htmlFor="symbols" className="font-normal">Symbols</Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <Label>Strength</Label>
                    <div className="rounded-lg border p-4 bg-muted/60">
                      <div
                        className="w-full h-2 rounded bg-muted overflow-hidden"
                        aria-label="Password strength"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={128}
                        aria-valuenow={Math.round(bits)}
                      >
                        <div
                          className={`h-full ${sMeta.color} transition-all`}
                          style={{ width: `${strengthPct}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{sMeta.label}</span>
                        <span className="text-muted-foreground">{Math.round(bits)} bits</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground break-words">
                        Entropy estimates assume independent uniformly random characters from the selected pool size ({poolSize}).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bandwidth" className="mt-6">
              <div className="grid gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="size">Data size</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        id="size"
                        type="number"
                        min={0}
                        inputMode="decimal"
                        value={sizeValue}
                        onChange={(e) => setSizeValue(Number(e.target.value))}
                      />
                      <select
                        aria-label="Size unit"
                        className="h-10 rounded-md border bg-background px-2 text-sm"
                        value={sizeUnit}
                        onChange={(e) => setSizeUnit(e.target.value as any)}
                      >
                        <option value="KB">KB</option>
                        <option value="MB">MB</option>
                        <option value="GB">GB</option>
                        <option value="TB">TB</option>
                      </select>
                    </div>
                    <small className="text-muted-foreground">Binary units (1 MB = 1024² bytes)</small>
                  </div>

                  <div>
                    <Label htmlFor="bandwidth">Bandwidth</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        id="bandwidth"
                        type="number"
                        min={0}
                        inputMode="decimal"
                        value={bwValue}
                        onChange={(e) => setBwValue(Number(e.target.value))}
                      />
                      <select
                        aria-label="Bandwidth unit"
                        className="h-10 rounded-md border bg-background px-2 text-sm"
                        value={bwUnit}
                        onChange={(e) => setBwUnit(e.target.value as any)}
                      >
                        <option value="bps">bps</option>
                        <option value="Kbps">Kbps</option>
                        <option value="Mbps">Mbps</option>
                        <option value="Gbps">Gbps</option>
                      </select>
                    </div>
                    <small className="text-muted-foreground">Nominal line rate</small>
                  </div>

                  <div>
                    <Label htmlFor="overhead">Protocol overhead</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        id="overhead"
                        type="number"
                        min={0}
                        max={99.9}
                        step={0.1}
                        inputMode="decimal"
                        value={overhead}
                        onChange={(e) => setOverhead(Number(e.target.value))}
                      />
                      <div className="shrink-0 rounded-md bg-secondary px-2 py-2 text-sm text-foreground">%</div>
                    </div>
                    <small className="text-muted-foreground">Estimated aggregate overhead</small>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/60 p-4" role="region" aria-live="polite">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FieldRow
                      label="Effective throughput"
                      value={`${transfer.effMbps.toFixed(2)} Mbps`}
                    />
                    <FieldRow
                      label="Estimated transfer time"
                      value={transfer.human}
                    />
                    <FieldRow
                      label="Seconds"
                      value={Number.isFinite(transfer.seconds) ? transfer.seconds.toFixed(2) : "—"}
                    />
                    <FieldRow
                      label="Minutes"
                      value={Number.isFinite(transfer.seconds) ? (transfer.seconds / 60).toFixed(2) : "—"}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function FieldRow({
  label,
  value,
  onCopy,
}: {
  label: string
  value: string
  onCopy?: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium break-words">{value || "—"}</div>
      </div>
      {onCopy ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCopy}
          className="shrink-0"
          aria-label={`Copy ${label}`}
        >
          Copy
        </Button>
      ) : null}
    </div>
  )
}