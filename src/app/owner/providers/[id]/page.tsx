import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { providerProfiles } from "@/db/schema";
import { Gauge } from "@/components/ui/gauge";

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const provider = await db.query.providerProfiles.findFirst({
    where: eq(providerProfiles.id, id),
  });

  if (!provider || !provider.isListable) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-6">
        <Gauge value={provider.ratingAvg ? Number(provider.ratingAvg) / 5 : 0} />
        <div>
          <h1 className="font-display text-2xl uppercase tracking-widest text-ash">
            {provider.businessName ?? "Unnamed provider"}
          </h1>
          <p className="text-steel">{provider.bio}</p>
        </div>
      </div>
    </div>
  );
}
