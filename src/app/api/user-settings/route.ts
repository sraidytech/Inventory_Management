import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { userSettingsSchema } from "@/lib/validations";
import { withAuth, withValidation } from "@/lib/api-middleware";

// GET /api/user-settings
export const GET = withAuth(async (req: NextRequest, _, userId) => {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  // If no settings exist, create default settings
  if (!settings) {
    return await prisma.userSettings.create({
      data: {
        id: userId,
        userId,
        language: "en",
        theme: "light",
        notifications: true,
      },
    });
  }

  return settings;
});

// PUT /api/user-settings
export const PUT = withValidation(
  userSettingsSchema,
  async (req: NextRequest, _, userId) => {
    const data = await req.json();

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        id: userId,
        userId,
        language: data.language,
        theme: data.theme,
        notifications: data.notifications,
      },
      update: {
        language: data.language,
        theme: data.theme,
        notifications: data.notifications,
      },
    });

    return settings;
  }
);
