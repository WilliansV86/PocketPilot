import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const publicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
export default clerkMiddleware(async (auth, request) => {
  const path = request.nextUrl.pathname;
  // The scheduled route has independent CRON_SECRET bearer authorization.
  if (path === "/api/cron/debt-reminders") return NextResponse.next();
  if (path !== "/api/diagnostics/database" && path.startsWith("/api/") && !path.startsWith("/api/goals") && !path.startsWith("/api/stats")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!publicRoute(request)) {
    const session = await auth();
    if (!session.userId && path.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!session.userId) return session.redirectToSignIn();
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
});
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
