/**
 * Seeds a full demo dataset into whatever DATABASE_URL points at — admin,
 * owners, and providers spanning every verification/listing state, plus
 * quotes/jobs/reviews so every dashboard has something real to show.
 *
 * Rerunnable: deletes any prior rows for @demo.tovant.local accounts
 * before reseeding, so running this twice doesn't duplicate data.
 *
 * Usage: pnpm db:seed:demo
 */
import { readFile } from "fs/promises";
import { join } from "path";
import { eq, inArray, like } from "drizzle-orm";
import { auth } from "../src/lib/auth/auth";
import { db } from "../src/db";
import {
  user,
  profiles,
  vehicles,
  providerProfiles,
  providerCategories,
  providerSpecialties,
  providerServiceOfferings,
  providerGalleryPhotos,
  verificationRecords,
  quotes,
  jobs,
  payments,
  reviews,
  auditLog,
} from "../src/db/schema";
// Import the stub directly rather than through the registry barrel — the
// barrel's `import "server-only"` guard throws when run outside Next.js's
// webpack context (a bare tsx script), and this seed only ever targets the
// dev DB where S3_MODE is unset anyway, so the stub is what would resolve.
import { storageStub as storageProvider } from "../src/lib/integrations/storage/s3.stub";

const DOMAIN = "demo.tovant.local";
const PASSWORD = "DemoPass123!";
const HOMEPAGE_IMAGES_DIR = join(process.cwd(), "public", "images", "homepage");

async function resetDemoData() {
  const existing = await db.select().from(user).where(like(user.email, `%@${DOMAIN}`));
  const ids = existing.map((u) => u.id);
  if (ids.length === 0) return;

  // jobs/payments reference providerProfiles.id directly (no cascade), so
  // they must go before providerProfiles is deleted. providerProfiles in
  // turn cascades to categories/specialties/offerings/verificationRecords/
  // galleryPhotos, and must go before the admin user delete below, since
  // verification_records.reviewed_by_admin_id has no cascade of its own
  // (an admin's review history shouldn't vanish just because someone
  // else's account is deleted). audit_log.actor_user_id has no cascade
  // either — any admin action taken on demo data (e.g. approving a demo
  // provider's verification) leaves a row referencing the demo admin.
  await db.delete(auditLog).where(inArray(auditLog.actorUserId, ids));
  await db.delete(reviews).where(inArray(reviews.ownerId, ids));
  await db.delete(payments).where(inArray(payments.ownerId, ids));
  await db.delete(jobs).where(inArray(jobs.ownerId, ids));
  await db.delete(quotes).where(inArray(quotes.ownerId, ids));
  await db.delete(providerProfiles).where(inArray(providerProfiles.userId, ids));
  await db.delete(user).where(inArray(user.id, ids));
  console.log(`Cleared ${ids.length} existing demo accounts.`);
}

async function signUp(name: string, email: string, role: "owner" | "provider" | "admin") {
  const result = await auth.api.signUpEmail({ body: { name, email, password: PASSWORD } });
  if (role !== "owner") {
    await db.update(user).set({ role }).where(eq(user.id, result.user.id));
  }
  return result.user.id;
}

async function uploadImage(sourceFile: string, key: string) {
  const buffer = await readFile(join(HOMEPAGE_IMAGES_DIR, sourceFile));
  await storageProvider.putObject(key, buffer, "image/jpeg");
}

async function main() {
  await resetDemoData();

  // --- Admin -----------------------------------------------------------
  const adminId = await signUp("Alex Morgan", `admin@${DOMAIN}`, "admin");

  // --- Owners ------------------------------------------------------------
  const owner1Id = await signUp("Jordan Reyes", `owner.jordan@${DOMAIN}`, "owner");
  const owner2Id = await signUp("Casey Kim", `owner.casey@${DOMAIN}`, "owner");

  await db.insert(profiles).values([
    { userId: owner1Id, displayName: "Jordan Reyes", city: "Minneapolis", state: "MN" },
    { userId: owner2Id, displayName: "Casey Kim", city: "St. Paul", state: "MN" },
  ]);

  const [vehicle1] = await db
    .insert(vehicles)
    .values({ ownerId: owner1Id, year: 2019, make: "Honda", model: "Civic", nickname: "Daily driver", mileage: 62000 })
    .returning();
  await db
    .insert(vehicles)
    .values({ ownerId: owner1Id, year: 2015, make: "Ford", model: "F-150", nickname: "Weekend truck", mileage: 88000 });
  const [vehicle2] = await db
    .insert(vehicles)
    .values({ ownerId: owner2Id, year: 2021, make: "Tesla", model: "Model 3", mileage: 21000 })
    .returning();

  // --- Providers (fully verified & listable) ------------------------------
  type ProviderSeed = {
    userId: string;
    businessName: string;
    bio: string;
    serviceMode: "mobile" | "shop" | "both";
    shopCity: string;
    shopState: string;
    serviceRadiusMiles: number;
    hourlyRateCents: number;
    categories: string[];
    specialties: string[];
    offerings: string[];
    galleryFiles: string[];
  };

  const providerSeeds: ProviderSeed[] = [
    {
      userId: await signUp("Marcus Webb", `provider.northside@${DOMAIN}`, "provider"),
      businessName: "Northside Auto Repair",
      bio: "Family-owned shop serving North Minneapolis for 12 years. ASE-certified, EV-capable.",
      serviceMode: "both",
      shopCity: "Minneapolis",
      shopState: "MN",
      serviceRadiusMiles: 20,
      hourlyRateCents: 9500,
      categories: ["mechanic"],
      specialties: ["ev"],
      offerings: ["oil_change", "brakes", "diagnostics", "engine_repair", "ev_service"],
      galleryFiles: ["mechanics.jpg", "gallery-1.jpg", "gallery-5.jpg"],
    },
    {
      userId: await signUp("Priya Nair", `provider.twincities@${DOMAIN}`, "provider"),
      businessName: "Twin Cities Mobile Mechanics",
      bio: "We come to you — driveway, office lot, or roadside. St. Paul based, metro-wide coverage.",
      serviceMode: "mobile",
      shopCity: "St. Paul",
      shopState: "MN",
      serviceRadiusMiles: 30,
      hourlyRateCents: 8500,
      categories: ["mechanic"],
      specialties: [],
      offerings: ["brakes", "suspension_steering", "tires_wheels", "electrical"],
      galleryFiles: ["gallery-8.jpg", "gallery-4.jpg"],
    },
    {
      userId: await signUp("Devon Ellis", `provider.lakeside@${DOMAIN}`, "provider"),
      businessName: "Lakeside Detailing Co",
      bio: "Hand-wash, ceramic coating, and full interior restoration near Lake Harriet.",
      serviceMode: "shop",
      shopCity: "Minneapolis",
      shopState: "MN",
      serviceRadiusMiles: 15,
      hourlyRateCents: 6500,
      categories: ["detailer"],
      specialties: [],
      offerings: ["interior_detailing", "exterior_detailing"],
      galleryFiles: ["detailing.jpg", "gallery-2.jpg"],
    },
    {
      userId: await signUp("Sam Ostrowski", `provider.precision@${DOMAIN}`, "provider"),
      businessName: "Precision Wrench & Wax",
      bio: "Full-service mechanic and detailing shop — one stop for repairs and a showroom finish.",
      serviceMode: "both",
      shopCity: "St. Paul",
      shopState: "MN",
      serviceRadiusMiles: 25,
      hourlyRateCents: 8000,
      categories: ["mechanic", "detailer"],
      specialties: ["motorcycle_powersports"],
      offerings: ["oil_change", "transmission", "ac_heating", "interior_detailing", "custom_fabrication"],
      galleryFiles: ["gallery-6.jpg", "gallery-7.jpg"],
    },
  ];

  const createdProviders: { id: string; userId: string; businessName: string }[] = [];

  for (const seed of providerSeeds) {
    const [profile] = await db
      .insert(providerProfiles)
      .values({
        userId: seed.userId,
        businessName: seed.businessName,
        bio: seed.bio,
        serviceMode: seed.serviceMode,
        shopCity: seed.shopCity,
        shopState: seed.shopState,
        serviceRadiusMiles: seed.serviceRadiusMiles,
        hourlyRateCents: seed.hourlyRateCents,
        isListable: true,
        overallVerificationStatus: "approved",
        acceptingLeads: true,
      })
      .returning();
    createdProviders.push({ id: profile.id, userId: seed.userId, businessName: seed.businessName });

    await db.insert(profiles).values({ userId: seed.userId, displayName: seed.businessName, city: seed.shopCity, state: seed.shopState });

    await db.insert(providerCategories).values(seed.categories.map((category) => ({ providerId: profile.id, category })));

    if (seed.specialties.length > 0) {
      for (const specialty of seed.specialties) {
        const [record] = await db
          .insert(verificationRecords)
          .values({
            providerId: profile.id,
            type: "specialty_credential",
            specialty,
            status: "approved",
            reviewedByAdminId: adminId,
            reviewedAt: new Date(),
            documentObjectKey: `verification/${profile.id}/specialty_credential-${specialty}/seed.jpg`,
          })
          .returning();
        await db.insert(providerSpecialties).values({ providerId: profile.id, specialty, verificationRecordId: record.id });
      }
    }

    await db.insert(providerServiceOfferings).values(seed.offerings.map((offering) => ({ providerId: profile.id, offering })));

    for (const type of ["identity", "license", "insurance", "background_check"] as const) {
      await db.insert(verificationRecords).values({
        providerId: profile.id,
        type,
        status: "approved",
        reviewedByAdminId: adminId,
        reviewedAt: new Date(),
        externalProvider: type === "background_check" ? "checkr" : null,
        documentObjectKey: type === "background_check" ? null : `verification/${profile.id}/${type}/seed.jpg`,
      });
    }

    for (const [i, file] of seed.galleryFiles.entries()) {
      const key = `gallery/${profile.id}/seed-${i}.jpg`;
      await uploadImage(file, key);
      await db.insert(providerGalleryPhotos).values({
        providerId: profile.id,
        objectKey: key,
        caption: null,
        status: "approved",
        reviewedByAdminId: adminId,
        reviewedAt: new Date(),
      });
    }
  }

  const [northside, twinCities, lakeside, precision] = createdProviders;

  // --- One pending provider (for the admin verification queue demo) -------
  const pendingProviderUserId = await signUp("Riley Chen", `provider.newwrench@${DOMAIN}`, "provider");
  const [pendingProvider] = await db
    .insert(providerProfiles)
    .values({
      userId: pendingProviderUserId,
      businessName: "New Wrench Auto",
      bio: "Just getting started on Tovant — verification in progress.",
      serviceMode: "shop",
      shopCity: "Minneapolis",
      shopState: "MN",
      isListable: false,
      overallVerificationStatus: "pending",
    })
    .returning();
  await db.insert(profiles).values({ userId: pendingProviderUserId, displayName: "New Wrench Auto", city: "Minneapolis", state: "MN" });
  await db.insert(providerCategories).values({ providerId: pendingProvider.id, category: "mechanic" });
  await db.insert(verificationRecords).values([
    {
      providerId: pendingProvider.id,
      type: "identity",
      status: "approved",
      reviewedByAdminId: adminId,
      reviewedAt: new Date(),
      documentObjectKey: `verification/${pendingProvider.id}/identity/seed.jpg`,
    },
    {
      providerId: pendingProvider.id,
      type: "license",
      status: "pending",
      documentObjectKey: `verification/${pendingProvider.id}/license/seed.jpg`,
    },
    {
      providerId: pendingProvider.id,
      type: "insurance",
      status: "pending",
      documentObjectKey: `verification/${pendingProvider.id}/insurance/seed.jpg`,
    },
    { providerId: pendingProvider.id, type: "background_check", status: "pending", externalProvider: "checkr" },
  ]);
  for (const type of ["identity", "license", "insurance"] as const) {
    await uploadImage("mechanics.jpg", `verification/${pendingProvider.id}/${type}/seed.jpg`);
  }

  // --- Quotes & jobs across every stage ------------------------------------

  // 1. owner1 <-> northside: completed job with a review.
  const [q1] = await db
    .insert(quotes)
    .values({
      ownerId: owner1Id,
      providerId: northside.id,
      providerUserId: northside.userId,
      category: "mechanic",
      description: "Squealing noise from the front brakes, needs a look before a road trip.",
      vehicleId: vehicle1.id,
      vehicleInfo: { year: vehicle1.year, make: vehicle1.make, model: vehicle1.model, vin: vehicle1.vin },
      serviceMode: "shop",
      status: "accepted",
      paymentMode: "off_platform",
      quotedAmountCents: 22000,
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000 - 35 * 60 * 1000),
      quotedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      respondedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
    })
    .returning();
  const [job1] = await db
    .insert(jobs)
    .values({
      quoteId: q1.id,
      ownerId: owner1Id,
      providerId: northside.id,
      providerUserId: northside.userId,
      status: "completed",
      scheduledAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      paymentMode: "off_platform",
      cancellationWindowHours: 24,
    })
    .returning();
  await db.insert(payments).values({
    jobId: job1.id,
    ownerId: owner1Id,
    providerId: northside.id,
    providerUserId: northside.userId,
    mode: "off_platform",
    amountCents: 22000,
    escrowStatus: "not_applicable",
    providerMarkedCompleteAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    releasedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  });
  await db.insert(reviews).values({
    jobId: job1.id,
    ownerId: owner1Id,
    providerId: northside.id,
    providerUserId: northside.userId,
    rating: 5,
    comment: "Fixed the brakes same day and the price matched the quote exactly. Would go back.",
  });

  // 2. owner1 <-> twinCities: job in progress.
  const [q2] = await db
    .insert(quotes)
    .values({
      ownerId: owner1Id,
      providerId: twinCities.id,
      providerUserId: twinCities.userId,
      category: "mechanic",
      description: "F-150 needs new tires and an alignment check before winter.",
      vehicleId: null,
      vehicleInfo: { year: 2015, make: "Ford", model: "F-150", vin: null },
      serviceMode: "mobile",
      status: "accepted",
      paymentMode: "in_app",
      quotedAmountCents: 68000,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 20 * 60 * 1000),
      quotedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    })
    .returning();
  const [job2] = await db
    .insert(jobs)
    .values({
      quoteId: q2.id,
      ownerId: owner1Id,
      providerId: twinCities.id,
      providerUserId: twinCities.userId,
      status: "in_progress",
      scheduledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      paymentMode: "in_app",
      cancellationWindowHours: 24,
    })
    .returning();
  await db.insert(payments).values({
    jobId: job2.id,
    ownerId: owner1Id,
    providerId: twinCities.id,
    providerUserId: twinCities.userId,
    mode: "in_app",
    amountCents: 68000,
    escrowStatus: "authorized",
  });

  // 3. owner2 <-> lakeside: a "quoted" request the owner still needs to accept.
  await db.insert(quotes).values({
    ownerId: owner2Id,
    providerId: lakeside.id,
    providerUserId: lakeside.userId,
    category: "detailer",
    description: "Full interior detail before I trade in the Model 3 — pet hair and some stains.",
    vehicleId: vehicle2.id,
    vehicleInfo: { year: vehicle2.year, make: vehicle2.make, model: vehicle2.model, vin: vehicle2.vin },
    serviceMode: "shop",
    status: "quoted",
    paymentMode: "off_platform",
    quotedAmountCents: 24000,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 50 * 60 * 1000),
    quotedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  });

  // 4. owner2 <-> precision: a fresh "requested" lead still awaiting a response.
  await db.insert(quotes).values({
    ownerId: owner2Id,
    providerId: precision.id,
    providerUserId: precision.userId,
    category: "mechanic",
    description: "Check engine light came on, might be the O2 sensor.",
    vehicleId: vehicle2.id,
    vehicleInfo: { year: vehicle2.year, make: vehicle2.make, model: vehicle2.model, vin: vehicle2.vin },
    serviceMode: "both",
    status: "requested",
  });

  // 5. owner1 <-> northside: an upcoming scheduled job.
  const [q3] = await db
    .insert(quotes)
    .values({
      ownerId: owner1Id,
      providerId: northside.id,
      providerUserId: northside.userId,
      category: "mechanic",
      description: "Annual inspection and oil change.",
      vehicleId: vehicle1.id,
      vehicleInfo: { year: vehicle1.year, make: vehicle1.make, model: vehicle1.model, vin: vehicle1.vin },
      serviceMode: "shop",
      status: "accepted",
      paymentMode: "off_platform",
      quotedAmountCents: 9000,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000),
      quotedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      respondedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    })
    .returning();
  const [job3] = await db
    .insert(jobs)
    .values({
      quoteId: q3.id,
      ownerId: owner1Id,
      providerId: northside.id,
      providerUserId: northside.userId,
      status: "scheduled",
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      paymentMode: "off_platform",
      cancellationWindowHours: 24,
    })
    .returning();
  await db.insert(payments).values({
    jobId: job3.id,
    ownerId: owner1Id,
    providerId: northside.id,
    providerUserId: northside.userId,
    mode: "off_platform",
    amountCents: 9000,
    escrowStatus: "not_applicable",
  });

  // A couple more reviews so ratings look real across providers.
  const extraReviewOwnerId = owner2Id;
  const [q4] = await db
    .insert(quotes)
    .values({
      ownerId: extraReviewOwnerId,
      providerId: lakeside.id,
      providerUserId: lakeside.userId,
      category: "detailer",
      description: "Exterior ceramic coat.",
      serviceMode: "shop",
      status: "accepted",
      paymentMode: "off_platform",
      quotedAmountCents: 35000,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000 - 25 * 60 * 1000),
      quotedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      respondedAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
    })
    .returning();
  const [job4] = await db
    .insert(jobs)
    .values({
      quoteId: q4.id,
      ownerId: extraReviewOwnerId,
      providerId: lakeside.id,
      providerUserId: lakeside.userId,
      status: "completed",
      scheduledAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
      paymentMode: "off_platform",
      cancellationWindowHours: 24,
    })
    .returning();
  await db.insert(payments).values({
    jobId: job4.id,
    ownerId: extraReviewOwnerId,
    providerId: lakeside.id,
    providerUserId: lakeside.userId,
    mode: "off_platform",
    amountCents: 35000,
    escrowStatus: "not_applicable",
    providerMarkedCompleteAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
    releasedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
  });
  await db.insert(reviews).values({
    jobId: job4.id,
    ownerId: extraReviewOwnerId,
    providerId: lakeside.id,
    providerUserId: lakeside.userId,
    rating: 5,
    comment: "Car looks brand new. Booking again before winter.",
  });

  // Recompute ratingAvg/ratingCount the same way the app does on review write.
  for (const p of [northside, twinCities, lakeside, precision]) {
    const providerReviews = await db.select().from(reviews).where(eq(reviews.providerId, p.id));
    if (providerReviews.length === 0) continue;
    const avg = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;
    await db
      .update(providerProfiles)
      .set({ ratingAvg: avg.toFixed(2), ratingCount: providerReviews.length })
      .where(eq(providerProfiles.id, p.id));
  }

  console.log("\nDemo data seeded. Log in at http://localhost:3000/login with any of:\n");
  console.log(`  Admin:     admin@${DOMAIN}`);
  console.log(`  Owner:     owner.jordan@${DOMAIN}  (has an in-progress job, a completed+reviewed job, and an upcoming scheduled job)`);
  console.log(`  Owner:     owner.casey@${DOMAIN}   (has a quote ready to accept, and a fresh lead awaiting a response)`);
  console.log(`  Provider:  provider.northside@${DOMAIN}  (Northside Auto Repair — mechanic, EV specialist, fully listable)`);
  console.log(`  Provider:  provider.twincities@${DOMAIN} (Twin Cities Mobile Mechanics — mobile mechanic, fully listable)`);
  console.log(`  Provider:  provider.lakeside@${DOMAIN}   (Lakeside Detailing Co — detailer, fully listable)`);
  console.log(`  Provider:  provider.precision@${DOMAIN}  (Precision Wrench & Wax — mechanic+detailer, fully listable)`);
  console.log(`  Provider:  provider.newwrench@${DOMAIN}  (New Wrench Auto — mid-verification, NOT listable yet — check /admin/providers as admin)`);
  console.log(`\n  Password for all accounts: ${PASSWORD}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
