import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  visual?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  visual,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("page-header-wash py-12 sm:py-16", className)}>
      <Container>
        <div
          className={cn(
            "page-header-content relative z-10",
            visual
              ? "grid gap-9 lg:grid-cols-[minmax(0,0.9fr)_minmax(24rem,1.1fr)] lg:items-center"
              : false,
          )}
        >
          <div>
            {children ? <div>{children}</div> : null}
            <div className="max-w-3xl">
              {eyebrow ? (
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-blue">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="text-balance text-4xl font-bold leading-tight text-blue-strong sm:text-5xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-5 text-lg leading-8 text-ink-muted">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {visual ? <div className="min-w-0">{visual}</div> : null}
        </div>
      </Container>
    </div>
  );
}
