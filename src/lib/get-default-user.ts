import { prisma } from "@/lib/db";

const DEFAULT_USER_EMAIL = "dev@pocketpilot.local";

export async function getDefaultUser() {
  // Try to find any user first
  let user = await prisma.user.findFirst();

  // If no users exist, create the default user
  if (!user) {
    console.log("No users found, creating default user for production...");
    user = await prisma.user.create({
      data: {
        name: "PocketPilot User",
        email: DEFAULT_USER_EMAIL,
      },
    });
    console.log("Default user created:", user.email);
  }

  return user;
}
