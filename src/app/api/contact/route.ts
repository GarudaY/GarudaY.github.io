import {
  createContactSubmission,
  OperationsError,
} from "@/server/operations-service";
import { guardPublicWrite } from "@/server/request-guard";
import { publicCorsHeaders, publicCorsPreflight } from "@/server/public-cors";
import { contactRequestSchema } from "@/server/operations-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreHeaders(request: Request) {
  return { "Cache-Control": "no-store", ...publicCorsHeaders(request) };
}

export function OPTIONS(request: Request) {
  return publicCorsPreflight(request);
}

export async function POST(request: Request) {
  const guard = guardPublicWrite(request, "contact");
  if (guard) return guard;

  try {
    const body: unknown = await request.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "company" in body &&
      Boolean(body.company)
    ) {
      return Response.json(
        { accepted: true },
        { status: 202, headers: noStoreHeaders(request) },
      );
    }

    const parsed = contactRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { code: "invalid_contact" },
        { status: 400, headers: noStoreHeaders(request) },
      );
    }
    const receipt = await createContactSubmission(parsed.data);
    return Response.json(receipt, {
      status: 201,
      headers: noStoreHeaders(request),
    });
  } catch (error) {
    if (error instanceof OperationsError) {
      return Response.json(
        { code: error.code },
        { status: error.status, headers: noStoreHeaders(request) },
      );
    }
    console.error("Contact write failed", error);
    return Response.json(
      { code: "storage_unavailable" },
      { status: 500, headers: noStoreHeaders(request) },
    );
  }
}
