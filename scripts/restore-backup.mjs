// Връща каталога от резервно копие, направено с scripts/backup-db.mjs.
//
// Ползва се, ако пълен рестарт (full wipe) на каталога се обърка и трябва
// да върнем продуктите/марките/моделите такива, каквито са били.
//
// Употреба:
//   node scripts/restore-backup.mjs backups/caseking-backup-XXX.json
//       - DRY RUN: само показва какво би върнало, не пише нищо
//   LIVE=true node scripts/restore-backup.mjs backups/caseking-backup-XXX.json
//       - реално връщане в базата
//
// ВАЖНО: Convex дава нови вътрешни id-та при връщане. Продуктите, марките
// и моделите се възстановяват напълно, но ако някъде е записано конкретно
// id на продукт (напр. подарък в промоция или свързани продукти в блог
// статия), то трябва да се пренастрои ръчно след връщането.

import { ConvexHttpClient } from "convex/browser";
import fs from "fs";

const CONVEX_URL =
  process.env.CASEKING_CONVEX_URL ||
  "https://trustworthy-possum-230.eu-west-1.convex.cloud";

const LIVE = process.env.LIVE === "true";
const file = process.argv[2];

if (!file) {
  console.error("Липсва файл. Пример: node scripts/restore-backup.mjs backups/caseking-backup-XXX.json");
  process.exit(1);
}

// Полетата, които upsertBatch приема - всичко останало (_id, _creationTime,
// matchKey, slug, normalizedModel) се пресмята наново от сървъра.
function toUpsertRow(p) {
  return {
    id: null,
    name: p.name,
    brand: p.brand,
    model: p.model,
    category: p.category,
    image: p.image,
    images: p.images ?? undefined,
    rating: p.rating,
    tag: p.tag ?? null,
    description: p.description,
    specs: p.specs,
    priceB2C: p.priceB2C ?? p.price ?? 0,
    oldPriceB2C: p.oldPriceB2C ?? null,
    priceB2B: p.priceB2B ?? 0,
    oldPriceB2B: p.oldPriceB2B ?? null,
    source: p.source ?? undefined,
  };
}

async function main() {
  const backup = JSON.parse(fs.readFileSync(file, "utf-8"));
  console.log(`Резервно копие от: ${backup.takenAt}`);
  console.log(`Съдържа: ${JSON.stringify(backup.counts)}`);
  console.log(`Режим: ${LIVE ? "LIVE (ще пише в базата!)" : "DRY RUN (само преглед)"}\n`);

  if (!LIVE) {
    console.log("Примерен продукт, който би бил върнат:");
    console.log(JSON.stringify(toUpsertRow(backup.products[0]), null, 2));
    console.log("\nDRY RUN - нищо не е записано. Пусни с LIVE=true за реално връщане.");
    return;
  }

  const convex = new ConvexHttpClient(CONVEX_URL);

  console.log("Връщам марки...");
  let brandsDone = 0;
  for (const b of backup.brands) {
    await convex.mutation("meta:addBrand", {
      name: b.name,
      logo: b.logo,
      source: b.source ?? undefined,
    });
    brandsDone++;
  }
  console.log(`  върнати марки: ${brandsDone}`);

  console.log("Връщам модели...");
  let modelsDone = 0;
  for (const m of backup.models) {
    await convex.mutation("meta:addModel", {
      name: m.name,
      brand: m.brand,
      source: m.source ?? undefined,
    });
    modelsDone++;
  }
  console.log(`  върнати модели: ${modelsDone}`);

  console.log("Връщам продукти на партиди по 100...");
  const CHUNK = 100;
  let created = 0;
  let updated = 0;
  for (let i = 0; i < backup.products.length; i += CHUNK) {
    const chunk = backup.products.slice(i, i + CHUNK).map(toUpsertRow);
    const res = await convex.mutation("products:upsertBatch", { products: chunk });
    created += res.createdCount || 0;
    updated += res.updatedCount || 0;
    if ((i / CHUNK) % 20 === 0) {
      console.log(`  ${i + chunk.length} / ${backup.products.length}`);
    }
  }
  console.log(`  нови: ${created}, обновени: ${updated}`);

  console.log("\nОпреснявам броячите по категории...");
  let cursor = null;
  let counts = {};
  let isDone = false;
  while (!isDone) {
    const res = await convex.mutation("meta:countProductsByCategory", { cursor, countsSoFar: counts });
    counts = res.counts;
    isDone = res.isDone;
    cursor = res.continueCursor;
  }
  console.log("  готово:", JSON.stringify(counts));

  console.log("\nВръщането приключи. Провери сайта.");
  console.log("Напомняне: ако някъде е записано конкретно id на продукт (подарък в промоция, свързани продукти в блога), пренастрой го ръчно.");
}

main().catch((err) => {
  console.error("Връщането гръмна:", err);
  process.exit(1);
});
