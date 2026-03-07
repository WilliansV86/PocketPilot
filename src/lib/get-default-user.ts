import { prisma } from "@/lib/db";

const DEFAULT_USER_EMAIL = "dev@pocketpilot.local";

export async function getDefaultUser() {
  // Try the hardcoded email first
  let user = await prisma.user.findUnique({
    where: { email: DEFAULT_USER_EMAIL },
  });

  // If not found, get the first available user
  if (!user) {
    user = await prisma.user.findFirst();
  }

  // PRODUCTION SAFE FALLBACK: Create default user if no users exist
  if (!user) {
    console.log("No users found, creating default user for production...");
    user = await prisma.user.create({
      data: {
        name: "Dev User",
        email: DEFAULT_USER_EMAIL,
      },
    });
    console.log("Default user created:", user.email);
  }

  return user;
}
