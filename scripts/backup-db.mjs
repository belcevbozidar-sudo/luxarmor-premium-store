// Прави пълно резервно копие на каталога (продукти, марки, модели,
// категории, промоции) в локален JSON файл в backups/.
//
// Пуска се ПРЕДИ всяка рискована операция върху базата - напр. пълен
// рестарт на каталога (full wipe) или голям импорт.
//
// Употреба:
//   node scripts/backup-db.mjs
//
// Връщане от копие: виж scripts/restore-backup.mjs

import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import path from "path";

const CONVEX_URL =
  process.env.CASEKING_CONVEX_URL ||
  "https://trustworthy-possum-230.eu-west-1.convex.cloud";

async function main() {
  const convex = new ConvexHttpClient(CONVEX_URL);
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

  console.log("Тегля продукти...");
  const products = [];
  let cursor = null;
  let isDone = false;
  while (!isDone) {
    const page = await convex.query("products:getPage", { cursor });
    products.push(...page.page);
    isDone = page.isDone;
    cursor = page.continueCursor;
    if (products.length % 5000 < 500) console.log(`  ${products.length}`);
  }

  console.log("Тегля марки / модели / категории / промоции...");
  const [brands, models, categories, promotions] = await Promise.all([
    convex.query("meta:getBrands"),
    convex.query("meta:getModels"),
    convex.query("meta:getCategories"),
    convex.query("promotions:getActive"),
  ]);

  const backup = {
    takenAt: new Date().toISOString(),
    deployment: CONVEX_URL,
    counts: {
      products: products.length,
      brands: brands.length,
      models: models.length,
      categories: categories.length,
      promotions: promotions.length,
    },
    products,
    brands,
    models,
    categories,
    promotions,
  };

  fs.mkdirSync("backups", { recursive: true });
  const file = path.join("backups", `caseking-backup-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(backup));

  const sizeMb = (fs.statSync(file).size / 1024 / 1024).toFixed(1);
  console.log(`\nЗаписано: ${file} (${sizeMb} MB)`);
  console.log(`Брой: ${JSON.stringify(backup.counts)}`);
}

main().catch((err) => {
  console.error("Резервното копие гръмна:", err);
  process.exit(1);
});
