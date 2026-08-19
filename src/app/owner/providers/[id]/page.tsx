import { redirect } from "next/navigation";

// Superseded by the public /providers/[id] (viewing a profile doesn't
// require an account — only requesting a quote or messaging does).
export default async function OwnerProviderRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/providers/${id}`);
}
