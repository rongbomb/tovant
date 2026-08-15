import { eq } from "drizzle-orm";
import { db } from "@/db";
import { providerProfiles, providerCategories } from "@/db/schema";
import { Gauge } from "@/components/ui/gauge";

export default async function DiscoverPage() {
  const providers = await db
    .select({
      id: providerProfiles.id,
      businessName: providerProfiles.businessName,
      serviceMode: providerProfiles.serviceMode,
      ratingAvg: providerProfiles.ratingAvg,
      shopCity: providerProfiles.shopCity,
      category: providerCategories.category,
    })
    .from(providerProfiles)
    .innerJoin(providerCategories, eq(providerCategories.providerId, providerProfiles.id))
    .where(eq(providerProfiles.isListable, true));

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl uppercase tracking-widest text-ash">
        Discover providers
      </h1>
      {providers.length === 0 ? (
        <p className="mt-4 text-steel">
          No verified providers are listable yet in this market.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {providers.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded border border-steel/40 bg-graphite p-4"
            >
              <div>
                <p className="font-semibold text-ash">
                  {p.businessName ?? "Unnamed provider"}
                </p>
                <p className="text-sm text-steel">
                  {p.category} · {p.serviceMode} · {p.shopCity ?? "mobile"}
                </p>
              </div>
              <Gauge value={p.ratingAvg ? Number(p.ratingAvg) / 5 : 0} size={64} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
