import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileSetupForm from "@/components/ProfileSetupForm";

export default async function ProfileSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.name) {
    redirect(next || "/my-listings");
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="mb-1 text-2xl font-semibold">Welcome!</h1>
      <p className="mb-6 text-sm text-green-900/60 dark:text-green-100/60">
        Tell us your name so listing owners and claimants know who
        they&apos;re talking to.
      </p>
      <ProfileSetupForm next={next} />
    </div>
  );
}
