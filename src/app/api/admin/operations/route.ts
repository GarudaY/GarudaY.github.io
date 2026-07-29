import {
  cancelRegistrationById,
  getAdminOperations,
  OperationsError,
  updateContactStatus,
} from "@/server/operations-service";
import { guardAdminRequest } from "@/server/admin-auth";
import { adminUpdateSchema } from "@/server/operations-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const guard = await guardAdminRequest(request);
  if (guard) return guard;
  return Response.json(await getAdminOperations(), { headers: noStoreHeaders });
}

export async function PATCH(request: Request) {
  const guard = await guardAdminRequest(request, { write: true });
  if (guard) return guard;

  try {
    const parsed = adminUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { code: "invalid_admin_update" },
        { status: 400, headers: noStoreHeaders },
      );
    }
    const result =
      parsed.data.kind === "contact"
        ? await updateContactStatus(parsed.data.id, parsed.data.status)
        : await cancelRegistrationById(parsed.data.id);
    return Response.json(result, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof OperationsError) {
      return Response.json(
        { code: error.code },
        { status: error.status, headers: noStoreHeaders },
      );
    }
    console.error("Admin operation failed", error);
    return Response.json(
      { code: "storage_unavailable" },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
