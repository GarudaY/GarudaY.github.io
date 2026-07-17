import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "card-surface rounded-[18px] border border-border bg-surface",
        className,
      )}
    >
      {children}
    </div>
  );
}
