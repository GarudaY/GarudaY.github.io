import { getRegistrationAvailability, createRegistration, OperationsError } from "@/server/operations-service";
import { guardPublicWrite } from "@/server/request-guard";
import { registrationRequestSchema } from "@/server/operations-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const eventSlug = new URL(request.url).searchParams.get("event") ?? "";
  if (!/^[a-z0-9-]{2,120}$/.test(eventSlug)) {
    return Response.json(
      { code: "invalid_event" },
      { status: 400, headers: noStoreHeaders },
    );
  }
  const availability = await getRegistrationAvailability(eventSlug);
  if (!availability) {
    return Response.json(
      { code: "event_unavailable" },
      { status: 404, headers: noStoreHeaders },
    );
  }
  return Response.json(availability, { headers: noStoreHeaders });
}

export async function POST(request: Request) {
  const guard = guardPublicWrite(request, "registration");
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
        { status: 202, headers: noStoreHeaders },
      );
    }

    const parsed = registrationRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { code: "invalid_registration" },
        { status: 400, headers: noStoreHeaders },
      );
    }

    const receipt = await createRegistration(parsed.data);
    return Response.json(receipt, { status: 201, headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof OperationsError) {
      return Response.json(
        { code: error.code },
        { status: error.status, headers: noStoreHeaders },
      );
    }
    console.error("Registration write failed", error);
    return Response.json(
      { code: "storage_unavailable" },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
