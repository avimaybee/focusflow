import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Fragment, ReactNode } from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface MyContentDetailShellProps {
  breadcrumbs: BreadcrumbItem[];
  backHref: string;
  backLabel: string;
  children: ReactNode;
}

// Provides a consistent scaffold for my-content detail pages with shared breadcrumbs and navigation affordance.
export function MyContentDetailShell({
  breadcrumbs,
  backHref,
  backLabel,
  children,
}: MyContentDetailShellProps) {
  return (
    <div className="w-full bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
        >
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 && <span aria-hidden="true">/</span>}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </Fragment>
          ))}
        </nav>
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
        <div className="mt-4 rounded-2xl border border-border bg-card/70 p-4 shadow-sm sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
