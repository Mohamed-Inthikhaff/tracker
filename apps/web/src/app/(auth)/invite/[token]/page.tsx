import { InviteAcceptForm } from "@/features/auth/components/InviteAcceptForm";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="min-h-screen grid place-items-center bg-[var(--surface-base)] px-4 py-10">
      <InviteAcceptForm token={token} />
    </div>
  );
}
