
import { I18nText } from "@/components/language-provider";
import { auth, currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuthCheckPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  await getCurrentUser();
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const email = user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId)?.emailAddress;

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold">{""}<I18nText text={"PocketPilot"}/>{""}</h1>
          <UserButton />
        </header>
        <h2 className="mt-6 text-lg font-semibold">{""}<I18nText text={"You’re signed in"}/>{""}</h2>
        <p className="mt-2 break-words text-sm text-muted-foreground">{email}</p>
        <p className="mt-4 text-sm leading-6">{""}<I18nText text={"Your login is connected to your individual PocketPilot account."}/>{""}</p>
        <Link className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" href="/">{""}<I18nText text={"Open PocketPilot"}/>{""}</Link>
      </section>
    </main>
  );
}
