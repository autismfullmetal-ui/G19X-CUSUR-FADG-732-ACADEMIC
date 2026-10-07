import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import LoginBackgroundSlideshow from "@/components/LoginBackgroundSlideshow";
import LoginFormCard from "@/components/LoginFormCard";

async function loginAction(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest: string }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    redirect("/login?error=1");
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <LoginBackgroundSlideshow>
      <LoginFormCard error={error} action={loginAction} />
    </LoginBackgroundSlideshow>
  );
}
