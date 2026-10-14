import { InvitacionClient } from "@/components/invitacion-client";

export default async function InvitacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <InvitacionClient invitationId={id} />
    </main>
  );
}
