"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string; // If not provided, rendered as text (non-interactive)
};

type FieldType = "number" | "text" | "email";

export type CalculatorField = {
  id: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number | "any";
  pattern?: RegExp;
  unit?: string; // e.g., "kg", "%"
  ariaDescription?: string;
};

export type CalculatorLayoutProps<ResultT = unknown> = {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  fields: CalculatorField[];
  initialValues?: Record<string, string | number>;
  onCalculate: (
    values: Record<string, string | number>
  ) => Promise<ResultT> | ResultT;
  renderResults: (
    result: ResultT | null,
    values: Record<string, string | number>
  ) => React.ReactNode;
  adsenseSlotId?: string;
  className?: string;
  style?: React.CSSProperties;
};

export default function CalculatorLayout<ResultT = unknown>({
  title,
  description,
  breadcrumbs,
  fields,
  initialValues,
  onCalculate,
  renderResults,
  adsenseSlotId,
  className,
  style,
}: CalculatorLayoutProps<ResultT>) {
  const [values, setValues] = React.useState<Record<string, string | number>>(
    () => {
      const base: Record<string, string | number> = {};
      for (const f of fields) {
        const initial =
          initialValues && f.id in initialValues ? initialValues[f.id] : "";
        base[f.id] = initial;
      }
      return base;
    }
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasCalculated, setHasCalculated] = React.useState(false);
  const [result, setResult] = React.useState<ResultT | null>(null);

  const crumbItems: BreadcrumbItem[] = React.useMemo(() => {
    if (breadcrumbs && breadcrumbs.length > 0) return breadcrumbs;
    // Fallback breadcrumb: Home > {title}
    return [{ label: "Home", href: "/" }, { label: title }];
  }, [breadcrumbs, title]);

  function validateField(field: CalculatorField, val: string | number) {
    const v = typeof val === "number" ? String(val) : val;
    const trimmed = typeof v === "string" ? v.trim() : "";
    // Required
    if (field.required && trimmed === "") {
      return "This field is required.";
    }
    // Type-specific validations
    const type = field.type ?? "text";
    if (type === "number") {
      if (trimmed === "") return null; // already handled required above
      const num = Number(trimmed);
      if (!Number.isFinite(num)) {
        return "Please enter a valid number.";
      }
      if (typeof field.min === "number" && num < field.min) {
        return `Must be at least ${field.min}.`;
      }
      if (typeof field.max === "number" && num > field.max) {
        return `Must be at most ${field.max}.`;
      }
    }
    if (type === "email" && trimmed !== "") {
      // Simple email pattern
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return "Please enter a valid email address.";
      }
    }
    if (field.pattern && trimmed !== "") {
      if (!field.pattern.test(trimmed)) {
        return "Invalid format.";
      }
    }
    return null;
  }

  function validateAll(
    draftValues: Record<string, string | number>
  ): Record<string, string> {
    const nextErrors: Record<string, string> = {};
    for (const f of fields) {
      const err = validateField(f, draftValues[f.id]);
      if (err) nextErrors[f.id] = err;
    }
    return nextErrors;
  }

  function handleChange(
    id: string,
    nextVal: string,
    type?: FieldType
  ): void {
    setValues((prev) => {
      const casted: string | number =
        type === "number" && nextVal !== "" ? nextVal : nextVal;
      const draft = { ...prev, [id]: casted };
      // Live-validate just this field for immediate feedback
      setErrors((prevErrs) => {
        const field = fields.find((f) => f.id === id)!;
        const err = validateField(field, casted);
        const next = { ...prevErrs };
        if (err) next[id] = err;
        else delete next[id];
        return next;
      });
      return draft;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const allErrors = validateAll(values);
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      setHasCalculated(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await onCalculate(values);
      setResult(res as ResultT);
      setHasCalculated(true);
    } catch (err: any) {
      setFormError(
        err?.message || "Something went wrong while calculating. Please try again."
      );
      setHasCalculated(false);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section
      className={cn(
        "w-full max-w-full",
        "bg-transparent",
        className
      )}
      style={style}
    >
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-4 md:mb-6"
      >
        <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {crumbItems.map((item, idx) => {
            const isLast = idx === crumbItems.length - 1;
            return (
              <li key={`${item.label}-${idx}`} className="flex items-center gap-2 min-w-0">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="truncate hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "truncate",
                      isLast ? "text-foreground" : "text-muted-foreground"
                    )}
                    aria-current={isLast ? "page" : undefined}
                    title={item.label}
                  >
                    {item.label}
                  </span>
                )}
                {!isLast ? (
                  <span aria-hidden="true" className="select-none">›</span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Main Calculator Card */}
      <Card className="bg-card border border-border shadow-sm rounded-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl sm:text-2xl">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-sm sm:text-base leading-relaxed">
              {description}
            </CardDescription>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Inputs */}
          <form
            onSubmit={handleSubmit}
            aria-busy={isLoading}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {fields.map((field) => {
                const type = field.type ?? "text";
                const valRaw = values[field.id];
                const val =
                  typeof valRaw === "number" ? String(valRaw) : (valRaw as string);
                const hasErr = !!errors[field.id];
                const inputId = `input-${field.id}`;
                const descId = field.ariaDescription
                  ? `desc-${field.id}`
                  : field.helperText
                  ? `help-${field.id}`
                  : undefined;

                return (
                  <div key={field.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={inputId} className="text-sm sm:text-[0.95rem]">
                        {field.label}
                        {field.required ? (
                          <span className="ml-1 text-destructive" aria-hidden="true">
                            *
                          </span>
                        ) : null}
                      </Label>
                      {field.unit ? (
                        <span className="text-xs text-muted-foreground">{field.unit}</span>
                      ) : null}
                    </div>

                    <div className="relative">
                      <Input
                        id={inputId}
                        name={field.id}
                        value={val}
                        type={type === "number" ? "text" : type}
                        inputMode={type === "number" ? "decimal" : undefined}
                        placeholder={field.placeholder}
                        onChange={(e) => {
                          const next = e.target.value;
                          // For number inputs, allow "-" and "." while typing, full validation occurs on submit/change above
                          handleChange(field.id, next, type);
                        }}
                        disabled={isLoading}
                        aria-invalid={hasErr || undefined}
                        aria-describedby={descId}
                        className={cn(
                          "bg-card",
                          hasErr
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        )}
                      />
                      {/* Optional inline unit inside input (right aligned), only if unit provided and not already shown above */}
                      {/* Commented out: keeping external unit for clarity */}
                    </div>

                    {hasErr ? (
                      <div
                        role="alert"
                        className="text-sm text-destructive"
                        aria-live="polite"
                      >
                        {errors[field.id]}
                      </div>
                    ) : null}

                    {field.helperText || field.ariaDescription ? (
                      <p
                        id={descId}
                        className="text-xs text-muted-foreground"
                      >
                        {field.ariaDescription || field.helperText}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {formError ? (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                aria-live="assertive"
              >
                {formError}
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span
                      className="inline-block h-4 w-4 rounded-full border-2 border-primary-foreground/60 border-t-transparent animate-spin"
                      aria-hidden="true"
                    />
                    Calculating…
                  </>
                ) : (
                  "Calculate"
                )}
              </Button>
            </div>
          </form>

          <Separator />

          {/* Results */}
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-semibold">
              Results
            </h3>

            <div
              className={cn(
                "w-full max-w-full rounded-lg border border-border bg-secondary/40"
              )}
            >
              <div className="p-4 sm:p-5">
                {/* Loading skeleton or content */}
                {isLoading ? (
                  <div className="space-y-3" aria-live="polite">
                    <div className="h-4 w-40 rounded bg-muted" />
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-5/6 rounded bg-muted" />
                    <div className="h-3 w-2/3 rounded bg-muted" />
                  </div>
                ) : hasCalculated ? (
                  <div
                    className="space-y-2 break-words"
                    aria-live="polite"
                  >
                    {renderResults(result, values)}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Enter values above and select Calculate to see results here.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* AdSense Placeholder */}
          <div
            role="complementary"
            aria-label="Advertisement"
            className="rounded-lg border border-border bg-muted/40 px-4 py-6 text-center"
            data-ad-slot={adsenseSlotId}
          >
            <div className="mx-auto max-w-full">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Advertisement
              </p>
              <div className="mt-3 h-24 w-full rounded-md bg-neutral-200 dark:bg-neutral-800" />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}