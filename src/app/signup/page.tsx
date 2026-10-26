import { AuthForm } from "@/components/auth-form";
import { googleSignInConfigured } from "@/lib/auth-google";

export const metadata = { title: "Create your workspace" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ google_error?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthForm
      mode="signup"
      googleSignIn={googleSignInConfigured()}
      initialError={params.google_error}
    />
  );
}
