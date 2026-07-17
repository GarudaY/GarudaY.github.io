import type { ReactNode } from "react";
import { HeartHandshake } from "lucide-react";
import { cn } from "@/lib/cn";

export function CTASection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "cta-panel relative grid overflow-hidden rounded-[24px] border border-border p-5 text-blue-strong sm:grid-cols-[auto_1fr] sm:items-center sm:gap-6 sm:p-7 lg:p-8",
        className,
      )}
    >
      <span className="relative z-10 mb-5 grid h-14 w-14 place-items-center rounded-[18px] bg-blue-strong text-yellow shadow-soft sm:mb-0 sm:h-16 sm:w-16">
        <HeartHandshake aria-hidden="true" className="h-7 w-7" />
      </span>
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
