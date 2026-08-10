import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="mb-1 text-2xl font-semibold">Login</h1>
      <p className="mb-6 text-sm text-green-900/60 dark:text-green-100/60">
        Enter your email and we&apos;ll send you a magic link to sign in.
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
