import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  children,
}: FormFieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="text-sm font-semibold text-blue-strong"
      >
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {hint ? (
        <p id={hintId} className="mt-2 text-sm leading-6 text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-2 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const fieldClassName =
  "focus-ring min-h-12 w-full rounded-[8px] border border-border bg-white px-4 py-3 text-base text-blue-strong placeholder:text-ink-muted/70";
