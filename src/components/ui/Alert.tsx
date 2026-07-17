import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Alert({
  children,
  tone = "info",
  role = "note",
  className,
}: {
  children: ReactNode;
  tone?: "info" | "warning";
  role?: "note" | "status" | "alert";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[8px] border p-4 text-sm leading-6",
        tone === "info" && "border-blue/20 bg-blue/10 text-blue-strong",
        tone === "warning" && "border-yellow/50 bg-yellow/20 text-blue-strong",
        className,
      )}
      role={role}
    >
      {children}
    </div>
  );
}
