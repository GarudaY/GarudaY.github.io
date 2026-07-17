import { Inbox } from "lucide-react";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { Card } from "@/components/ui/Card";

export function EmptyState({
  locale,
  title,
  body,
}: {
  locale: Locale;
  title?: string;
  body?: string;
}) {
  const dict = getDictionary(locale);
  return (
    <Card className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
      <Inbox aria-hidden="true" className="h-10 w-10 text-blue" />
      <h2 className="text-xl font-semibold text-blue-strong">
        {title ?? dict.common.emptyTitle}
      </h2>
      <p className="max-w-xl text-sm leading-6 text-ink-muted">
        {body ?? dict.common.emptyBody}
      </p>
    </Card>
  );
}
