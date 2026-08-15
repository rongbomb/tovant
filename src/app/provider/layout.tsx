import { requireRole } from "@/lib/auth/require-role";

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  await requireRole("provider");
  return <div className="flex flex-1 flex-col">{children}</div>;
}
