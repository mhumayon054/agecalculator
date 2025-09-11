import Link from "next/link";

interface Props {
  items: { label: string; href?: string }[];
  className?: string;
}

export const Breadcrumbs = ({ items, className }: Props) => {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-2">
              {isLast ? (
                <span className="text-muted-foreground">{item.label}</span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground">{item.label}</span>
              )}
              {!isLast && (
                <span className="text-muted-foreground" aria-hidden="true">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};