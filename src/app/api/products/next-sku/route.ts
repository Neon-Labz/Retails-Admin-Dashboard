import { generateNextSku } from "@/lib/sku";
import { apiSuccess, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const sku = await generateNextSku();
    return apiSuccess({ sku });
  } catch (err) {
    return handleApiError(err);
  }
}
