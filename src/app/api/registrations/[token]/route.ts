import {
  cancelRegistrationByToken,
  getRegistrationByToken,
  OperationsError,
} from "@/server/operations-service";
import { guardPublicWrite } from "@/server/request-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store" };

function validToken(token: string) {
  return /^[a-f0-9]{64}$/.test(token);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!validToken(token)) {
    return Response.json(
      { code: "registration_not_found" },
      { status: 404, headers: noStoreHeaders },
    );
  }
  const registration = await getRegistrationByToken(token);
  if (!registration) {
    return Response.json(
      { code: "registration_not_found" },
      { status: 404, headers: noStoreHeaders },
    );
  }
  return Response.json(registration, { headers: noStoreHeaders });
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
      { status: 404, headers: noStoreHeaders },
    );
  }
  try {
    const result = await cancelRegistrationByToken(token);
    return Response.json(result, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof OperationsError) {
      return Response.json(
        { code: error.code },
        { status: error.status, headers: noStoreHeaders },
      );
    }
    console.error("Registration cancellation failed", error);
    return Response.json(
      { code: "storage_unavailable" },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
