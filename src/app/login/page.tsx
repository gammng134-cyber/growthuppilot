import { AuthForm } from "@/components/auth-form";
import { googleSignInConfigured } from "@/lib/auth-google";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ google_error?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthForm
      mode="login"
      googleSignIn={googleSignInConfigured()}
      initialError={params.google_error}
    />
  );
}
