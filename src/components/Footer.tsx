"use client";

import * as React from "react";
import { Copyright, Facebook, Linkedin, Rss } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FooterProps {
  className?: string;
  description?: string;
  totalCalculators?: number;
  year?: number;
  links?: {
    privacy?: string;
    terms?: string;
    contact?: string;
  };
  social?: {
    facebook?: string;
    linkedin?: string;
    rss?: string;
  };
}

const Footer: React.FC<FooterProps> = ({
  className,
  description = "All-in-One Calculators helps you quickly compute everyday tasks across time, finance, measurements, and more — all in one place.",
  totalCalculators,
  year = new Date().getFullYear(),
  links = {
    privacy: "/privacy",
    terms: "/terms",
    contact: "/contact",
  },
  social = {
    facebook: undefined,
    linkedin: undefined,
    rss: "/rss.xml",
  },
}) => {
  return (
    <footer
      className={cn(
        "w-full bg-secondary text-foreground/90 border-t border-border",
        className
      )}
      aria-labelledby="site-footer-heading"
    >
      <div className="container w-full max-w-full py-10">
        <h2 id="site-footer-heading" className="sr-only">
          Site footer
        </h2>

        <div className="flex flex-col gap-8">
          {/* Top section: brand and description */}
          <div className="flex flex-col gap-4">
            <div className="min-w-0">
              <p className="text-base font-semibold tracking-tight break-words">
                All-in-One Calculators
              </p>
              <p className="text-sm text-muted-foreground mt-1 break-words">
                {description}
                {typeof totalCalculators === "number" && totalCalculators >= 0 ? (
                  <span className="ml-1">
                    Currently offering{" "}
                    <span className="font-medium text-foreground">
                      {totalCalculators}
                    </span>{" "}
                    calculators.
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          {/* Middle: essential links and socials */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <nav
              aria-label="Essential links"
              className="min-w-0"
            >
              <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                {links?.privacy ? (
                  <li className="min-w-0">
                    <a
                      href={links.privacy}
                      className="text-foreground/90 hover:text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </li>
                ) : null}
                {links?.terms ? (
                  <li className="min-w-0">
                    <a
                      href={links.terms}
                      className="text-foreground/90 hover:text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm transition-colors"
                    >
                      Terms of Service
                    </a>
                  </li>
                ) : null}
                {links?.contact ? (
                  <li className="min-w-0">
                    <a
                      href={links.contact}
                      className="text-foreground/90 hover:text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm transition-colors"
                    >
                      Contact
                    </a>
                  </li>
                ) : null}
              </ul>
            </nav>

            <div className="flex items-center gap-2">
              {social?.facebook ? (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit our Facebook"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-card text-foreground/80 hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                >
                  <Facebook className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
              {social?.linkedin ? (
                <a
                  href={social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit our LinkedIn"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-card text-foreground/80 hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                >
                  <Linkedin className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
              {social?.rss ? (
                <a
                  href={social.rss}
                  aria-label="RSS feed"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-card text-foreground/80 hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                >
                  <Rss className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>

          {/* Bottom: copyright */}
          <div className="flex flex-col-reverse items-start gap-2 pt-4 border-t border-border sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Copyright className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {year} All-in-One Calculators. All rights reserved.
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Built with a focus on clarity, accuracy, and accessibility.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;