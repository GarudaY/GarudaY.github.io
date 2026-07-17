import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";

type SectionProps = {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  size?: "default" | "wide" | "narrow";
};

export function Section({
  children,
  className,
  containerClassName,
  size = "default",
}: SectionProps) {
  return (
    <section
      className={cn("section-reveal py-12 sm:py-16 lg:py-20", className)}
    >
      <Container size={size} className={containerClassName}>
        {children}
      </Container>
    </section>
  );
}
