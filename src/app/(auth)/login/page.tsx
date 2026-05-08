import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back to Pitstop.
          </p>
        </div>
        <LoginForm />
        <p className="text-muted-foreground text-center text-sm">
          New here?{" "}
          <Link href="/register" className="text-foreground underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
