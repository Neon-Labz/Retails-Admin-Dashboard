import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Settings } from "@/models/Settings";
import { settingsSchema } from "@/lib/validators";
import { apiSuccess, handleApiError } from "@/lib/api-utils";
import { getStoreSettings } from "@/lib/notify";

export async function GET() {
  try {
    await connectDB();
    const settings = await getStoreSettings();
    return apiSuccess(settings);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const data = settingsSchema.parse(body);

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(data);
    } else {
      Object.assign(settings, data);
      await settings.save();
    }

    return apiSuccess(settings, "Settings updated successfully");
  } catch (err) {
    return handleApiError(err);
  }
}
