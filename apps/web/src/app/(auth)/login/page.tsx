import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-[var(--surface-base)] px-4 py-10">
      <LoginForm />
    </div>
  );
}
