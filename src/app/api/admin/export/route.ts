import { getAdminOperations } from "@/server/operations-service";
import { guardLocalAdmin } from "@/server/request-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const guard = guardLocalAdmin(request);
  if (guard) return guard;
  const kind = new URL(request.url).searchParams.get("kind");
  const data = await getAdminOperations();
  let rows: unknown[][];
  let filename: string;

  if (kind === "registrations") {
    filename = "event-registrations.csv";
    rows = [
      [
        "reference",
        "status",
        "event",
        "name",
        "email",
        "participants",
        "group",
        "note",
        "createdAt",
      ],
      ...data.registrations.map((item) => [
        item.reference,
        item.status,
        item.eventTitle,
        item.name,
        item.email,
        item.participants,
        item.group,
        item.note,
        item.createdAt,
      ]),
    ];
  } else if (kind === "contacts") {
    filename = "contact-requests.csv";
    rows = [
      [
        "reference",
        "status",
        "topic",
        "name",
        "email",
        "message",
        "context",
        "createdAt",
      ],
      ...data.contacts.map((item) => [
        item.reference,
        item.status,
        item.topic,
        item.name,
        item.email,
        item.message,
        item.context,
        item.createdAt,
      ]),
    ];
  } else {
    return Response.json({ code: "invalid_export" }, { status: 400 });
  }

  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  return new Response(csv, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
