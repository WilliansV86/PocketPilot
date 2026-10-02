import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold">PocketPilot</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your personal finance companion</p>
      </div>
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/" />
    </main>
  );
}
