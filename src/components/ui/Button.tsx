import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "quiet";

const variants: Record<Variant, string> = {
  primary:
    "bg-blue-strong text-white hover:bg-blue focus-visible:outline-yellow",
  secondary:
    "bg-yellow text-blue-strong hover:bg-[#eebf37] focus-visible:outline-blue",
  ghost:
    "border border-border bg-surface text-blue-strong hover:border-blue hover:bg-surface-muted",
  quiet: "text-blue-strong hover:bg-surface-muted",
};

const base =
  "button-motion focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold";

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

export function LinkButton({
  href,
  children,
  variant = "primary",
  className,
  ...props
}: LinkButtonProps) {
  if (href.startsWith("#")) {
    return (
      <a
        href={href}
        className={cn(base, variants[variant], className)}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={cn(base, variants[variant], className)}
      {...props}
    >
      {children}
    </Link>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
};

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
