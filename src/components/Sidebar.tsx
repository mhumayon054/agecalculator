"use client"

import * as React from "react"
import {
  PanelLeftOpen,
  PanelLeftClose,
  ChevronsDownUp,
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

type CalculatorItem = {
  id: string
  name: string
  slug: string
}

type Category = {
  id: string
  name: string
  calculators: CalculatorItem[]
}

type SidebarProps = {
  categories: Category[]
  activeSlug?: string
  onSelect?: (calculator: CalculatorItem, category: Category) => void
  className?: string
  style?: React.CSSProperties
  defaultOpenCategories?: string[]
  mobileTitle?: string
  showMobileToggle?: boolean
  open?: boolean // New prop to control open state
  onOpenChange?: (open: boolean) => void // New prop to control open state
}

function classNames(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ")
}

function CategoryList({
  categories,
  activeSlug,
  onSelect,
  defaultOpenCategories,
}: {
  categories: Category[]
  activeSlug?: string
  onSelect?: (calculator: CalculatorItem, category: Category) => void
  defaultOpenCategories?: string[]
}) {
  const [openItems, setOpenItems] = React.useState<string[] | undefined>(defaultOpenCategories)

  React.useEffect(() => {
    if (defaultOpenCategories && defaultOpenCategories.length > 0) {
      setOpenItems(defaultOpenCategories)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="w-full max-w-full">
      <Accordion
        type="multiple"
        value={openItems}
        onValueChange={(v) => setOpenItems(v as string[])}
        className="w-full"
      >
        {categories.map((cat) => {
          const count = cat.calculators.length
          return (
            <AccordionItem
              key={cat.id}
              value={cat.id}
              className="border-b border-[var(--sidebar-border)]"
            >
              <AccordionTrigger
                className="group w-full px-3 py-2 sm:px-3 sm:py-2.5 hover:no-underline"
              >
                <div className="flex w-full items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-semibold text-[var(--sidebar-foreground)] truncate">
                        {cat.name}
                      </span>
                      <span className="ml-auto inline-flex items-center rounded-full bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] text-[10px] sm:text-xs px-2 py-0.5">
                        {count}
                      </span>
                    </div>
                  </div>
                  <ChevronsDownUp
                    className="h-4 w-4 text-[var(--muted-foreground)] transition-transform duration-200 group-data-[state=open]:rotate-180"
                    aria-hidden="true"
                  />
                </div>
              </AccordionTrigger>
              <AccordionContent
                className="data-[state=open]:animate-[var(--animate-accordion-down)] data-[state=closed]:animate-[var(--animate-accordion-up)]"
              >
                <ul className="pb-2">
                  {cat.calculators.map((calc) => {
                    const isActive = activeSlug === calc.slug
                    return (
                      <li key={calc.id}>
                        <button
                          type="button"
                          onClick={() => onSelect?.(calc, cat)}
                          className={classNames(
                            "group flex w-full items-center gap-2 rounded-md px-3 py-2 text-left",
                            "transition-colors duration-150",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-background)]",
                            isActive
                              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                              : "text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
                          )}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <span className="min-w-0 truncate text-sm sm:text-[0.95rem]">
                            {calc.name}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}

export default function Sidebar({
  categories,
  activeSlug,
  onSelect,
  className,
  style,
  defaultOpenCategories,
  mobileTitle = "Browse calculators",
  showMobileToggle = true,
  open, // New prop
  onOpenChange, // New prop
}: SidebarProps) {
  return (
    <div className={classNames("w-full max-w-full", className)} style={style}>
      {/* Mobile trigger - removed since we're controlling from header */}

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-full flex-col rounded-lg border border-[var(--sidebar-border)] bg-[var(--sidebar-background)]"
        role="complementary"
        aria-label="Sidebar"
      >
        <div className="px-4 py-3 border-b border-[var(--sidebar-border)]">
          <h2 className="text-sm sm:text-base font-semibold text-[var(--sidebar-foreground)]">
            Categories
          </h2>
        </div>
        <div className="min-h-0">
          <ScrollArea className="h-[480px]">
            <nav aria-label="Calculator categories" className="p-2 sm:p-3">
              <CategoryList
                categories={categories}
                activeSlug={activeSlug}
                onSelect={onSelect}
                defaultOpenCategories={defaultOpenCategories}
              />
            </nav>
          </ScrollArea>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side="left"
            className="w-[88vw] sm:w-96 p-0 bg-[var(--sidebar-background)] border-r border-[var(--sidebar-border)]"
          >
            <SheetHeader className="px-4 py-3 border-b border-[var(--sidebar-border)] bg-[var(--card)]">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-base font-semibold text-[var(--foreground)]">
                  {mobileTitle}
                </SheetTitle>
                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    aria-label="Close sidebar"
                  >
                    <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </SheetClose>
              </div>
            </SheetHeader>
            <div className="h-full">
              <ScrollArea className="h-full">
                <nav
                  aria-label="Calculator categories"
                  className="p-2 sm:p-3"
                >
                  <CategoryList
                    categories={categories}
                    activeSlug={activeSlug}
                    onSelect={(calc, cat) => {
                      onSelect?.(calc, cat)
                      onOpenChange?.(false)
                    }}
                    defaultOpenCategories={defaultOpenCategories}
                  />
                </nav>
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}