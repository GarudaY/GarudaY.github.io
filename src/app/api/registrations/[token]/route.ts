import {
  cancelRegistrationByToken,
  getRegistrationByToken,
  OperationsError,
} from "@/server/operations-service";
import { publicCorsHeaders, publicCorsPreflight } from "@/server/public-cors";
import { guardPublicWrite } from "@/server/request-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreHeaders(request: Request) {
  return { "Cache-Control": "no-store", ...publicCorsHeaders(request) };
}

function validToken(token: string) {
  return /^[a-f0-9]{64}$/.test(token);
}

export function OPTIONS(request: Request) {
  return publicCorsPreflight(request);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!validToken(token)) {
    return Response.json(
      { code: "registration_not_found" },
      { status: 404, headers: noStoreHeaders(request) },
    );
  }
  const registration = await getRegistrationByToken(token);
  if (!registration) {
    return Response.json(
      { code: "registration_not_found" },
      { status: 404, headers: noStoreHeaders(request) },
    );
  }
  return Response.json(
    {
      reference: registration.reference,
      eventSlug: registration.eventSlug,
      eventTitle: registration.eventTitle,
      participants: registration.participants,
      status: registration.status,
      createdAt: registration.createdAt,
    },
    { headers: noStoreHeaders(request) },
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const guard = guardPublicWrite(request, "registration-cancel");
  if (guard) return guard;
  const { token } = await params;
  if (!validToken(token)) {
    return Response.json(
      { code: "registration_not_found" },
      { status: 404, headers: noStoreHeaders(request) },
    );
  }
  try {
    const result = await cancelRegistrationByToken(token);
    return Response.json(result, { headers: noStoreHeaders(request) });
  } catch (error) {
    if (error instanceof OperationsError) {
      return Response.json(
        { code: error.code },
        { status: error.status, headers: noStoreHeaders(request) },
      );
    }
    console.error("Registration cancellation failed", error);
    return Response.json(
      { code: "storage_unavailable" },
      { status: 500, headers: noStoreHeaders(request) },
    );
  }
}
