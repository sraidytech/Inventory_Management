import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { userSettingsFormSchema } from "@/lib/validations";
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
  userSettingsFormSchema,
  async (req: NextRequest, _, userId) => {
    const data = await req.json();
    
    // Add userId to the data
    const settingsData = {
      ...data,
      userId
    };

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        id: userId,
        userId,
        language: settingsData.language,
        theme: settingsData.theme,
        notifications: settingsData.notifications,
      },
      update: {
        language: settingsData.language,
        theme: settingsData.theme,
        notifications: settingsData.notifications,
      },
    });

    return settings;
  }
);
