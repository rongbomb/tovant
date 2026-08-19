import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { providerCategoryTypes } from "@/db/schema";
import { getHomepageImages, getHeroSlides, getGalleryPhotos } from "@/lib/homepage-images";
import { LocationProvider } from "@/components/home/location-context";
import { ThemeFab } from "@/components/home/theme-toggle";
import { SiteNav } from "@/components/home/site-nav";
import { MobileTabBar } from "@/components/home/mobile-tab-bar";
import { Hero } from "@/components/home/hero";
import { CategoryGrid } from "@/components/home/category-grid";
import { NearYou } from "@/components/home/near-you";
import { FeatureStrip } from "@/components/home/feature-strip";
import { CommunityGallery } from "@/components/home/community-gallery";
import { ProviderCta } from "@/components/home/provider-cta";
import { SiteFooter } from "@/components/home/site-footer";

export default async function Home() {
  const [images, categories] = await Promise.all([
    getHomepageImages(),
    db
      .select({ id: providerCategoryTypes.id, label: providerCategoryTypes.label })
      .from(providerCategoryTypes)
      .where(and(eq(providerCategoryTypes.active, true), eq(providerCategoryTypes.comingSoon, false)))
      .orderBy(asc(providerCategoryTypes.sortOrder)),
  ]);
  const heroSlides = getHeroSlides(images);
  const galleryPhotos = getGalleryPhotos(images);

  return (
    <LocationProvider>
      <div className="home-page">
        <ThemeFab />
        <SiteNav />
        <main>
          <Hero slides={heroSlides} categories={categories} />
          <CategoryGrid />
          <NearYou />
          <FeatureStrip />
          <CommunityGallery photos={galleryPhotos} />
          <ProviderCta />
        </main>
        <SiteFooter />
        <MobileTabBar />
      </div>
    </LocationProvider>
  );
}
