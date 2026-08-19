import "server-only";
import { db } from "@/db";
import { homepageImages } from "@/db/schema";

const HERO_SLOTS = [
  { slot: "hero_1", label: "Hero photo 1", defaultPath: "/images/homepage/hero.jpg", defaultAlt: "A car up on a two-post lift in a dimly lit shop." },
  { slot: "hero_2", label: "Hero photo 2", defaultPath: "/images/homepage/mechanics.jpg", defaultAlt: "Two mechanics working on a car raised on a lift." },
  { slot: "hero_3", label: "Hero photo 3", defaultPath: "/images/homepage/detailing.jpg", defaultAlt: "A freshly detailed car parked in a driveway at dusk." },
  { slot: "hero_4", label: "Hero photo 4", defaultPath: "/images/homepage/upgrades.jpg", defaultAlt: "A technician installing aftermarket suspension parts." },
] as const;

const GALLERY_CAPTIONS = [
  { title: "Alternator swap", location: "Uptown, Minneapolis" },
  { title: "Ceramic coat finish", location: "St. Paul" },
  { title: "Brake pad replacement", location: "Northeast Minneapolis" },
  { title: "Full interior detail", location: "Como, St. Paul" },
  { title: "EV battery diagnostic", location: "Linden Hills" },
  { title: "Timing belt service", location: "Powderhorn" },
  { title: "Custom exhaust fabrication", location: "Uptown, Minneapolis" },
  { title: "Suspension work", location: "Southwest Minneapolis" },
] as const;

const GALLERY_SLOTS = GALLERY_CAPTIONS.map((caption, i) => ({
  slot: `gallery_${i + 1}` as const,
  label: `Community gallery photo ${i + 1}: ${caption.title}`,
  defaultPath: `/images/homepage/gallery-${i + 1}.jpg`,
  defaultAlt: `${caption.title} in ${caption.location}.`,
}));

export const HOMEPAGE_IMAGE_SLOTS = [...HERO_SLOTS, ...GALLERY_SLOTS] as const;

export type HomepageImageSlot = (typeof HOMEPAGE_IMAGE_SLOTS)[number]["slot"];

export type HomepageImage = {
  slot: HomepageImageSlot;
  path: string;
  alt: string;
};

/**
 * Every slot always resolves to something renderable: a slot with no DB
 * row (or one that's never been touched) falls back to the committed
 * default in public/images/homepage/, so the homepage never 404s an
 * image just because an admin hasn't uploaded a replacement yet.
 */
export async function getHomepageImages(): Promise<Record<HomepageImageSlot, HomepageImage>> {
  const rows = await db.select().from(homepageImages);
  const bySlot = new Map(rows.map((row) => [row.slot, row]));

  return Object.fromEntries(
    HOMEPAGE_IMAGE_SLOTS.map(({ slot, defaultPath, defaultAlt }) => {
      const row = bySlot.get(slot);
      return [
        slot,
        {
          slot,
          path: row?.imagePath ?? defaultPath,
          alt: row?.altText ?? defaultAlt,
        },
      ];
    }),
  ) as Record<HomepageImageSlot, HomepageImage>;
}

export function getHeroSlides(images: Record<HomepageImageSlot, HomepageImage>) {
  return HERO_SLOTS.map(({ slot }) => images[slot]);
}

export function getGalleryPhotos(images: Record<HomepageImageSlot, HomepageImage>) {
  return GALLERY_SLOTS.map(({ slot }, i) => ({
    path: images[slot].path,
    alt: images[slot].alt,
    title: GALLERY_CAPTIONS[i].title,
    location: GALLERY_CAPTIONS[i].location,
  }));
}
