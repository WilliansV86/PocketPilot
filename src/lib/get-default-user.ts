// Compatibility name retained for existing actions; this resolves the signed-in
// user exclusively and has no shared/default user fallback.
export { getCurrentUser as getDefaultUser } from "@/lib/current-user";
