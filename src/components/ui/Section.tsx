import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";

type SectionProps = {
  children: ReactNode;
  id?: string;
  className?: string;
  containerClassName?: string;
  size?: "default" | "wide" | "narrow";
};

export function Section({
  children,
  id,
  className,
  containerClassName,
  size = "default",
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn("section-reveal py-12 sm:py-16 lg:py-20", className)}
    >
      <Container size={size} className={containerClassName}>
        {children}
      </Container>
    </section>
  );
}
