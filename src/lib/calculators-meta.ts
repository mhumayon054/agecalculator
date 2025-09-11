import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export function GlobalHeader() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4">
        {/* Mobile Sidebar Toggle */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <PanelLeftOpen className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarContent pathname={pathname} />
          </SheetContent>
        </Sheet>

        {/* Desktop Sidebar Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="text-lg font-bold text-foreground">
            All-in-One Calculators
          </div>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="w-full max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search calculators..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Placeholder for user menu */}
        <div className="w-9" />
      </div>
    </header>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-4">
        <h2 className="text-lg font-semibold text-foreground">Categories</h2>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-4">
          {buildCategories().map((category) => (
            <div key={category.id} className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                {category.name}
              </h3>
              <ul className="space-y-1">
                {category.calculators.map((calc) => (
                  <li key={calc.id}>
                    <Link
                      href={`/${category.slug}/${calc.slug}`}
                      className={cn(
                        "block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        pathname === `/${category.slug}/${calc.slug}`
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground/80"
                      )}
                    >
                      {calc.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}