import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  size?: "default" | "wide" | "narrow";
};

export function Container({
  children,
  className,
  size = "default",
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        size === "default" && "max-w-7xl",
        size === "wide" && "max-w-[90rem]",
        size === "narrow" && "max-w-4xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
