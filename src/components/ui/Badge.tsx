import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeProps = {
  children: ReactNode;
  tone?: "blue" | "yellow" | "green" | "neutral" | "danger";
  className?: string;
};

const tones = {
  blue: "bg-blue/10 text-blue-strong",
  yellow: "bg-yellow/25 text-blue-strong",
  green: "bg-green/18 text-[#315427]",
  neutral: "bg-surface-muted text-ink-muted",
  danger: "bg-danger/10 text-danger",
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
