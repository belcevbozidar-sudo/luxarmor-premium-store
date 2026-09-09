import { ConvexHttpClient } from "https://cdn.jsdelivr.net/npm/convex@1.38.0/browser/+esm";
import { resolveBrandLogo } from "./brand-logos.js?v=1.0.0";

const convex = new ConvexHttpClient("https://aware-toucan-771.eu-west-1.convex.cloud");

// Global image error fallback for proxy URL failure
window.addEventListener('error', function(e) {
  if (e.target && e.target.tagName === 'IMG') {
    const src = e.target.src;
    if (src && src.includes('/api/image') && src.includes('url=')) {
      try {
        const urlObj = new URL(src, window.location.href);
        const originalUrl = urlObj.searchParams.get('url');
        if (originalUrl) {
          console.warn('Proxy image failed to load, falling back to original URL:', originalUrl);
          e.target.src = originalUrl;
        }
      } catch (err) {
        console.error('Failed to parse fallback URL:', err);
      }
    }
  }
}, true);

// Price converter helper (EUR to BGN)
const BGN_RATE = 1.95583;
function formatPrice(val) {
  const eurVal = parseFloat(val);
  if (isNaN(eurVal)) return "";
  if (eurVal === 0) return "0.00 € (0.00 лв.)";
  const bgnVal = eurVal * BGN_RATE;
  return `${eurVal.toFixed(2)} € (${bgnVal.toFixed(2)} лв.)`;
}

// --- STATIC FALLBACK DATASETS ---
const STATIC_PRODUCTS = [
  {
    _id: "prod_1",
    name: "Премиум кожен кейс MagSafe Case",
    brand: "Apple",
    model: "iPhone 15 Pro Max",
    category: "keysove-i-kalufi",
    priceB2C: 69.00,
    oldPriceB2C: 99.00,
    priceB2B: 55.00,
    oldPriceB2B: 79.00,
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "БЕСТСЕЛЪР",
    description: "Луксозен калъф от естествена селектирана телешка кожа с вградена MagSafe технология. Изключително фино усещане и защита.",
    specs: { material: "Естествена кожа", weight: "30г", origin: "Румъния", delivery: "Доставка 3-4 работни дни с преглед" }
  },
  {
    _id: "prod_2",
    name: "Карбонов кейс UltraSlim Kevlar",
    brand: "Apple",
    model: "iPhone 15 Pro",
    category: "keysove-i-kalufi",
    priceB2C: 79.00,
    oldPriceB2C: null,
    priceB2B: 63.00,
    oldPriceB2B: null,
    image: "https://images.unsplash.com/photo-1586953983027-d7508a64f4bb?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "ХИТ",
    description: "Ултратънък и изключително здрав кейс от 100% арамидни влакна (Kevlar). Военен клас на защита, дебелина само 0.6 мм.",
    specs: { material: "Карбонов кевлар", weight: "12г", origin: "Румъния", delivery: "Доставка 3-4 работни дни с преглед" }
  },
  {
    _id: "prod_3",
    name: "Удароустойчив силиконов кейс Liquid Armor",
    brand: "Samsung",
    model: "Galaxy S24 Ultra",
    category: "keysove-i-kalufi",
    priceB2C: 39.00,
    oldPriceB2C: 49.00,
    priceB2B: 31.20,
    oldPriceB2B: 39.00,
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "НОВО",
    description: "Мек и удобен силиконов кейс с микрофибърна подплата отвътре за максимална защита от надраскване и падане.",
    specs: { material: "Премиум течен силикон", weight: "25г", origin: "Румъния", delivery: "Доставка 3-4 работни дни с преглед" }
  },
  {
    _id: "prod_4",
    name: "Хибриден кейс с подсилени ръбове Crystal Clear",
    brand: "Samsung",
    model: "Galaxy S23 Ultra",
    category: "keysove-i-kalufi",
    priceB2C: 29.00,
    oldPriceB2C: null,
    priceB2B: 23.20,
    oldPriceB2B: null,
    image: "https://images.unsplash.com/photo-1586953983027-d7508a64f4bb?auto=format&fit=crop&q=80&w=800",
    rating: 4,
    tag: null,
    description: "Напълно прозрачен кейс, който не пожълтява. Разкрива оригиналния дизайн на вашия телефон, защитавайки го перфектно.",
    specs: { material: "Поликарбонат и TPU", weight: "22г", origin: "Румъния", delivery: "Доставка 3-4 работни дни с преглед" }
  },
  {
    _id: "prod_5",
    name: "Външна батерия MagSafe Power Bank 10000mAh",
    brand: "Apple",
    model: "Всички модели",
    category: "vanshni-baterii",
    priceB2C: 59.00,
    oldPriceB2C: 89.00,
    priceB2B: 47.00,
    oldPriceB2B: 71.00,
    image: "assets/cat_power_bank.webp",
    rating: 5,
    tag: "БЕСТСЕЛЪР",
    description: "Ултратънък магнитен външен акумулатор. Бързо безжично зареждане и перфектно сцепление с MagSafe.",
    specs: { material: "Поликарбонат & Алуминий", weight: "190г", origin: "Румъния", delivery: "Доставка 3-4 работни дни с преглед" }
  }
];

const STATIC_CATEGORIES = [
  { id: "keysove-i-kalufi", name: "Кейсове / Калъфи", image: "assets/cat_cases.webp" },
  { id: "protektori-za-ekran", name: "Протектори за екран", image: "assets/cat_protectors.webp" },
  { id: "aksesoari-za-avtomobili", name: "Аксесоари за автомобил", image: "assets/cat_car_holder.webp" },
  { id: "bezzhichni-zaryadni", name: "Безжични зарядни", image: "assets/cat_wireless_charger.webp" },
  { id: "zaryadni-ustroystva", name: "Зарядни устройства", image: "assets/cat_car_charger.webp" },
  { id: "kabeli-za-zaryadane", name: "Кабели за зареждане", image: "assets/cat_cables.webp" },
  { id: "postavki-za-byuro", name: "Поставки за бюро", image: "assets/cat_desk_stand.webp" },
  { id: "selfi-stikove", name: "Селфи стикове", image: "assets/cat_selfie_stick.webp" },
  { id: "popsoket-i-vrazki", name: "Попсокет / Връзки", image: "assets/cat_pop_socket.webp" },
  { id: "vanshni-baterii", name: "Външни батерии", image: "assets/cat_power_bank.webp" }
];

// Frontend override for category imagery (DB images are stale/base64; we do NOT
// change the Convex backend). Keyed by category id — falls back to a premium
// generic image so no old/base64 image is ever shown.
const CATEGORY_IMAGE_OVERRIDES = {
  "keysove-i-kalufi": "assets/ck_cat_cases.webp",
  "protektori-za-ekran": "assets/ck_cat_protectors.webp",
  "aksesoari-za-avtomobili": "assets/ck_cat_car.webp",
  "bezzhichni-zaryadni": "assets/ck_cat_wireless.webp",
  "zaryadni-ustroystva": "assets/ck_cat_chargers.webp",
  "kabeli-za-zaryadane": "assets/ck_cat_cables.webp",
  "postavki-za-byuro": "assets/ck_cat_deskstand.webp",
  "selfi-stikove": "assets/ck_cat_selfie.webp",
  "popsoket-i-vrazki": "assets/ck_cat_popsocket.webp",
  "vanshni-baterii": "assets/ck_cat_powerbank.webp",
  "headphones": "assets/ck_cat_headphones.webp",
  "memory_cards": "assets/ck_cat_memory.webp",
  "audio_cables": "assets/ck_cat_audiocables.webp",
  "aksesoari_chasovnici": "assets/ck_cat_smartwatch.webp"
};
function getCategoryImage(cat) {
  if (!cat) return "assets/ck_cat_accessories.webp";
  return CATEGORY_IMAGE_OVERRIDES[cat.id] || "assets/ck_cat_accessories.webp";
}

// --- ANNOUNCEMENT BAR (admin-editable via pageMetadata pageKey="announcement") ---
function renderAnnouncementBar() {
  try {
    const entry = (typeof pageSeoMetadata !== "undefined" && Array.isArray(pageSeoMetadata))
      ? pageSeoMetadata.find(m => m.pageKey === "announcement")
      : null;
    const text = entry && entry.title && entry.title.trim();
    if (!text) return; // keep the default text already in the HTML
    document.querySelectorAll(".announcement-bar span").forEach(el => {
      el.textContent = text;
    });
  } catch (e) {
    console.warn("Could not render announcement bar:", e);
  }
}

const STATIC_BRANDS = [
  { name: "Apple", logo: "logo_apple.webp" },
  { name: "Samsung", logo: "logo_samsung.webp" },
  { name: "Xiaomi", logo: "logo_xiaomi.webp" },
  { name: "Huawei", logo: "logo_huawei.webp" },
  { name: "Google", logo: "logo_google.webp" },
  { name: "MOTO", logo: "logo_moto.webp" }
];

const STATIC_MODELS = [
  { name: "iPhone 15 Pro Max", brand: "Apple" },
  { name: "iPhone 15 Pro", brand: "Apple" },
  { name: "iPhone 14 Pro Max", brand: "Apple" },
  { name: "Galaxy S24 Ultra", brand: "Samsung" },
  { name: "Galaxy S23 Ultra", brand: "Samsung" },
  { name: "Redmi Note 13 Pro+", brand: "Xiaomi" }
];

// --- APP STATE ---
let PRODUCTS = [...STATIC_PRODUCTS];
let CATEGORIES = [...STATIC_CATEGORIES];
let BRANDS = [...STATIC_BRANDS];
let MODELS = [...STATIC_MODELS];
let PROMOTIONS = [];
let isDataLoaded = false;
let pageSeoMetadata = [];
let heroTitleText = `Вашият телефон. Вашият стил. <span>Нашата грижа.</span>`;
let heroSubtitleText = "Премиум кейсове, протектори и аксесоари за всички популярни марки и модели.";

function renderHeroSettings() {
  const tEl = document.getElementById("homepage-hero-title");
  const sEl = document.getElementById("homepage-hero-subtitle");
  if (tEl) tEl.innerHTML = heroTitleText;
  if (sEl) sEl.textContent = heroSubtitleText;
}

try {
  const cachedProducts = localStorage.getItem("caseking_cached_products");
  const cachedCategories = localStorage.getItem("caseking_cached_categories");
  const cachedBrands = localStorage.getItem("caseking_cached_brands");
  const cachedModels = localStorage.getItem("caseking_cached_models");
  const cachedPromotions = localStorage.getItem("caseking_cached_promotions");
  
  if (cachedProducts) PRODUCTS = JSON.parse(cachedProducts);
  if (cachedCategories) CATEGORIES = JSON.parse(cachedCategories);
  if (cachedBrands) BRANDS = JSON.parse(cachedBrands);
  if (cachedModels) MODELS = JSON.parse(cachedModels);
  if (cachedPromotions) PROMOTIONS = JSON.parse(cachedPromotions);
} catch (e) {
  console.warn("Could not load cached data from localStorage:", e);
}

let cart = JSON.parse(localStorage.getItem('caseking_cart')) || [];
let freeShippingThresholdReached = false;
let giftThresholdReached = false;
let isInitialLoad = true;
let selectedBrand = null;
let selectedModel = null;
let selectedCategory = null;
let categoryDetailSelectedBrand = null;
let categoryDetailSelectedModel = null;
let searchQuery = "";

// Странирано ("Зареди още") състояние за renderCatalog() и
// renderCategoryDetailPage() - продуктите се теглят от Convex на порции
// вместо целия каталог наведнъж (виж fetchAllProducts / loadData по-долу).
let catalogAccumulated = [];
let catalogCursor = null;
let catalogIsDone = true;
let catalogLoading = false;

let categoryDetailAccumulated = [];
let categoryDetailCursor = null;
let categoryDetailIsDone = true;
let categoryDetailLoading = false;
let currentUser = null;
let googleRegisterTemp = null;
let activeRegType = "B2C";
let activeCheckoutType = "B2C";
let appliedPromo = null;
let activeProductPageQty = 1;
let currentProductImageIndex = 0;
let currentProductImagesList = [];
let currentProductImageName = "";
let currentProductImageModel = "";

// --- MODEL NORMALIZATION UTILITIES ---
function normalizeModel(name) {
  if (!name) return "";
  return name.toString()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/rt-\d+/gi, "") // remove RT-21, RT-22 etc.
    .replace(/4g/gi, "")
    .replace(/5g/gi, "")
    .replace(/galaxy/gi, "")
    .replace(/samsung/gi, "")
    .replace(/[-_]/g, "")
    .trim();
}

function getCleanModelName(name) {
  if (!name) return "";
  let clean = name.toString()
    .replace(/\s+RT-\d+/gi, "")
    .trim();
  
  if (clean.toUpperCase().startsWith("SAMSUNG ")) {
    clean = "Samsung " + clean.substring(8);
  }
  return clean;
}

function transliterateBulgarian(text) {
  const map = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
    'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sht', 'ъ': 'a', 'ь': 'y',
    'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ж': 'Zh',
    'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
    'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F',
    'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sht', 'Ъ': 'A', 'Ь': 'Y',
    'Ю': 'Yu', 'Я': 'Ya'
  };
  return text.split('').map(char => map[char] || char).join('');
}

// Slugify helper for SEO-friendly product URLs
function getProductSlug(name) {
  if (!name) return "";
  const transliterated = transliterateBulgarian(name.toString().toLowerCase());
  return transliterated
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Keep only letters, digits, spaces, and hyphens
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Image URL helper.
// NOTE: External product images (e.g. koff.ro CDN) are served DIRECTLY.
// A Vercel serverless proxy (/api/image via sharp) was tried previously but is
// unreliable on Vercel (sharp binary / cold-start / timeout failures), which
// caused product images to disappear. The koff.ro CDN already serves fast,
// cache-friendly images with no hotlink protection, so we load them directly.
function getProductImageUrl(url, name, model) {
  if (!url) return "";
  // Local assets and already-proxied URLs — serve as-is
  if (url.startsWith("/assets") || url.startsWith("assets/")) return url;
  // If some legacy data already stored a proxied URL, unwrap it to the original
  if (url.includes("/api/image") && url.includes("url=")) {
    try {
      const original = new URLSearchParams(url.split("?")[1]).get("url");
      if (original) return original;
    } catch (e) { /* fall through */ }
  }
  // External images — load directly (most reliable)
  return url;
}

// --- PASS HASH UTILITY ---
async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// --- CONVEX DATA ACTIONS ---

// Кеш на продукти, които вече сме видели (от каталог/категория/търсене/
// продуктова страница) - за да могат "добави в количката" и подобни
// еднократни справки по id да работят мигновено, без мрежова заявка,
// без да се налага да пазим ВСИЧКИ продукти в паметта. При пропуск в
// кеша (рядко - напр. стар bookmark) пада обратно на products:getById.
const productLookupCache = new Map();
function cacheProducts(list) {
  if (!list) return;
  for (const p of list) {
    if (p && p._id) productLookupCache.set(p._id, p);
  }
}
async function getProductById(id) {
  if (productLookupCache.has(id)) return productLookupCache.get(id);
  try {
    const p = await convex.query("products:getById", { id });
    if (p) productLookupCache.set(id, p);
    return p;
  } catch (err) {
    console.error("Could not fetch product by id:", err);
    return null;
  }
}

async function loadData() {
  try {
    // Само една малка "порция" продукти при начално зареждане - достатъчна
    // за препоръчаните продукти на началния изглед. Конкретна марка/модел/
    // категория/търсене си теглят точно нужните продукти при избор (виж
    // renderCatalog, renderCategoryDetailPage, fetchSearchResults) - не се
    // сваля целият каталог наведнъж, за да не се бави сайтът.
    // Забележка: винаги вярваме на УСПЕШЕН отговор от Convex, дори да е
    // празен масив (напр. каталогът е нарочно изчистен по средата на
    // внос) - "празно" не е "грешка". Ако заявката наистина е гръмнала,
    // изпълнението скача в catch по-долу и там пази старите/статични
    // данни вместо да ги трие. По-рано тук имаше проверка "> 0", която
    // третираше легитимно празен резултат като провал и оставяше стари
    // кеширани марки/модели да висят завинаги на екрана.
    const firstPage = await convex.query("products:getPage", { cursor: null });
    const dbProducts = firstPage.page;
    if (Array.isArray(dbProducts)) {
      PRODUCTS = dbProducts;
      cacheProducts(dbProducts);
      try {
        localStorage.setItem("caseking_cached_products", JSON.stringify(dbProducts));
      } catch (cacheErr) {
        console.warn("Could not cache products locally.", cacheErr);
      }
    }

    const dbCats = await convex.query("meta:getCategories");
    if (Array.isArray(dbCats)) {
      CATEGORIES = dbCats;
      localStorage.setItem("caseking_cached_categories", JSON.stringify(dbCats));
    }

    const dbBrands = await convex.query("meta:getBrands");
    if (Array.isArray(dbBrands)) {
      BRANDS = dbBrands;
      localStorage.setItem("caseking_cached_brands", JSON.stringify(dbBrands));
    }

    const dbModels = await convex.query("meta:getModels");
    if (Array.isArray(dbModels)) {
      MODELS = dbModels;
      localStorage.setItem("caseking_cached_models", JSON.stringify(dbModels));
    }
    
    const dbPromos = await convex.query("promotions:getActive");
    if (dbPromos) {
      PROMOTIONS = dbPromos;
      localStorage.setItem("caseking_cached_promotions", JSON.stringify(dbPromos));
    }
    
    try {
      const heroSettings = await convex.query("settings:getHero");
      if (heroSettings) {
        heroTitleText = heroSettings.heroTitle;
        heroSubtitleText = heroSettings.heroSubtitle;
        renderHeroSettings();
      }
    } catch (heroErr) {
      console.warn("Could not load hero settings from db:", heroErr);
    }

    try {
      const dbSeo = await convex.query("settings:getAllPageMetadata");
      if (dbSeo) {
        pageSeoMetadata = dbSeo;
        renderAnnouncementBar();
        handleRouting();
      }
    } catch (seoErr) {
      console.warn("Could not load SEO page settings from db:", seoErr);
    }
    
    console.log("Storefront data successfully loaded dynamically from Convex.");
  } catch (err) {
    console.warn("Could not load dynamic data from Convex, falling back to static dataset.", err);
    if (!PRODUCTS || PRODUCTS.length === 0) PRODUCTS = [...STATIC_PRODUCTS];
    if (!CATEGORIES || CATEGORIES.length === 0) CATEGORIES = [...STATIC_CATEGORIES];
    if (!BRANDS || BRANDS.length === 0) BRANDS = [...STATIC_BRANDS];
    if (!MODELS || MODELS.length === 0) MODELS = [...STATIC_MODELS];
  } finally {
    isDataLoaded = true;
  }
}

async function verifySession() {
  const token = localStorage.getItem("caseking_session_token");
  if (token) {
    try {
      const profile = await convex.query("users:getProfile", { sessionToken: token });
      if (profile) {
        currentUser = profile;
        updateUserUIState();
      } else {
        currentUser = null;
        localStorage.removeItem("caseking_session_token");
      }
    } catch (err) {
      console.error("Session verification failed", err);
    }
  }
}

// --- DYNAMIC RENDERING ---

// Слъг на категорията с часовникови аксесоари - там се показват
// ЧАСОВНИКОВИТЕ марки/модели, а не телефонните.
const WATCH_CATEGORY_ID = "aksesoari_chasovnici";

// Категории, в които филтърът е по марка на САМИЯ аксесоар (Mcdodo,
// Baseus, Anker...), а не по модел телефон. Списъкът съвпада с
// ACCESSORY_CATEGORY_SLUGS в скрейпъра (sync-caseking.mjs).
const ACCESSORY_CATEGORY_IDS = new Set([
  "zaryadni-ustroystva",
  "kabeli-za-zaryadane",
  "bezzhichni-zaryadni",
  "vanshni-baterii",
  "headphones",
  "memory_cards",
  "audio_cables",
  "postavki-za-byuro",
  "selfi-stikove",
  "popsoket-i-vrazki",
  "aksesoari-za-avtomobili"
]);

function isAccessoryCategory(catId) {
  return ACCESSORY_CATEGORY_IDS.has(catId);
}

// Марките без изрично зададен type се третират като телефонни, за да
// продължат съществуващите записи да работят непроменени.
function isWatchBrand(brand) {
  return brand.type === "watch";
}

function isAccessoryBrand(brand) {
  return brand.type === "accessory";
}

// ВАЖНО: телефонните марки трябва да изключват И часовниковите, И
// аксесоарните - иначе Mcdodo/Baseus изскачат на началната страница
// между Apple и Samsung.
function phoneBrands() {
  return BRANDS.filter(b => !isWatchBrand(b) && !isAccessoryBrand(b));
}

function watchBrands() {
  return BRANDS.filter(b => isWatchBrand(b));
}

function accessoryBrands() {
  return BRANDS.filter(b => isAccessoryBrand(b));
}

// Кеш: слъг на категория -> Set с имената на марките, които РЕАЛНО имат
// продукти там. Без него всяка аксесоарна категория би показала всички
// аксесоарни марки, включително такива без нито един продукт в нея
// (напр. SanDisk в "Слушалки").
const accessoryBrandsByCategory = new Map();

async function loadAccessoryBrandsForCategory(catId) {
  if (accessoryBrandsByCategory.has(catId)) {
    return accessoryBrandsByCategory.get(catId);
  }
  const found = new Set();
  try {
    let cursor = null;
    let isDone = false;
    let guard = 0;
    while (!isDone && guard < 40) {
      const page = await convex.query("products:getByCategory", {
        category: catId,
        cursor
      });
      page.page.forEach(p => {
        if (p.isDeleted) return;
        if (!p.brand || p.brand === "Всички марки") return;
        found.add(p.brand);
      });
      isDone = page.isDone;
      cursor = page.continueCursor;
      guard++;
    }
  } catch (err) {
    console.warn("Could not load accessory brands for", catId, err);
  }
  accessoryBrandsByCategory.set(catId, found);
  return found;
}

function renderBrands() {
  const container = document.getElementById("brands-list");
  const mobileContainer = document.getElementById("menu-brands-list");
  if (!container) return;
  
  container.innerHTML = "";
  if (mobileContainer) mobileContainer.innerHTML = "";
  
  // Началната страница е телефонният поток - часовниковите марки се
  // показват само в категорията "Аксесоари за часовници".
  phoneBrands().forEach(brand => {
    // Desktop Card
    const btn = document.createElement("button");
    btn.className = "brand-pill-btn";
    if (selectedBrand === brand.name) btn.classList.add("active");
    btn.onclick = () => selectBrand(brand.name);
    
    const logoSrc = resolveBrandLogo(brand, 'assets/');
    btn.innerHTML = `
      <img src="${logoSrc}" alt="${brand.name}" class="brand-card-img" onerror="this.onerror=null;this.src='assets/logo.webp'">
      <span class="brand-card-text">${brand.name}</span>
    `;
    container.appendChild(btn);

    // Mobile menu drawer card
    if (mobileContainer) {
      const mBtn = document.createElement("button");
      mBtn.className = "menu-brand-item";
      mBtn.onclick = () => selectMobileBrand(brand.name, mBtn);
      const mLogoSrc = resolveBrandLogo(brand, 'assets/');
      mBtn.innerHTML = `
        <img src="${mLogoSrc}" class="menu-brand-img" onerror="this.onerror=null;this.src='assets/logo.webp'">
        <span>${brand.name}</span>
      `;
      mobileContainer.appendChild(mBtn);
    }
  });
}

function selectBrand(brandName) {
  selectedBrand = brandName;
  selectedModel = null;
  selectedCategory = null;
  
  const input = document.getElementById("smart-search-input");
  if (input) {
    input.value = "";
  }
  searchQuery = "";
  const clearBtn = document.getElementById("search-clear-btn");
  if (clearBtn) {
    clearBtn.style.display = "none";
  }
  
  document.querySelectorAll(".category-card").forEach(card => card.classList.remove("active"));
  document.querySelectorAll(".brand-pill-btn").forEach(pill => {
    const textSpan = pill.querySelector(".brand-card-text");
    if (textSpan && textSpan.textContent === brandName) {
      pill.classList.add("active");
    } else {
      pill.classList.remove("active");
    }
  });

  const step2Title = document.getElementById("step2-title");
  const modelList = document.getElementById("models-list");
  
  if (step2Title && modelList) {
    step2Title.style.display = "block";
    step2Title.textContent = `СТЪПКА 2 - ИЗБЕРИ МОДЕЛ ЗА ${brandName.toUpperCase()}:`;
    modelList.style.display = "grid";
    modelList.innerHTML = "";
    
    const brandModels = MODELS.filter(m => m.brand === brandName);
    const seen = new Set();
    const uniqueModels = [];
    
    brandModels.forEach(model => {
      const cleanName = getCleanModelName(model.name);
      const norm = normalizeModel(cleanName);
      if (!seen.has(norm)) {
        seen.add(norm);
        uniqueModels.push({
          displayName: cleanName,
          original: model
        });
      }
    });

    uniqueModels.sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { numeric: true, sensitivity: 'base' }));

    uniqueModels.forEach(model => {
      const btn = document.createElement("button");
      btn.className = "model-pill-btn";
      btn.onclick = () => selectModel(model.displayName);
      btn.innerHTML = `
        <div class="model-icon-box"><i class="fas fa-mobile-alt"></i></div>
        <span class="model-card-text">${model.displayName}</span>
      `;
      modelList.appendChild(btn);
    });
    
    step2Title.scrollIntoView({ behavior: "smooth" });
  }
  
  renderCatalog();
}

function selectModel(modelName) {
  selectedModel = modelName;
  
  const input = document.getElementById("smart-search-input");
  if (input) {
    input.value = "";
  }
  searchQuery = "";
  const clearBtn = document.getElementById("search-clear-btn");
  if (clearBtn) {
    clearBtn.style.display = "none";
  }
  
  document.querySelectorAll(".model-pill-btn").forEach(pill => {
    const textSpan = pill.querySelector(".model-card-text");
    if (textSpan && textSpan.textContent === modelName) {
      pill.classList.add("active");
    } else {
      pill.classList.remove("active");
    }
  });
  
  renderCatalog();
  
  const catalogSection = document.getElementById("catalog");
  if (catalogSection) {
    catalogSection.scrollIntoView({ behavior: "smooth" });
  }
}

// --- PHONE FINDER DROPDOWNS (Brand + Model) ---
function finderToast(msg) {
  let wrap = document.getElementById("ck-toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "ck-toast-wrap";
    document.body.appendChild(wrap);
  }
  const t = document.createElement("div");
  t.className = "ck-toast error";
  t.innerHTML = `<i class="fas fa-circle-exclamation"></i><span>${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 400); }, 2600);
}

function populateFinderBrands() {
  const brandSelect = document.getElementById("finder-brand-select");
  if (!brandSelect) return;
  const brands = phoneBrands();
  brandSelect.innerHTML = '<option value="">Избери марка</option>';
  brands.forEach(brand => {
    const opt = document.createElement("option");
    opt.value = brand.name;
    opt.textContent = brand.name;
    brandSelect.appendChild(opt);
  });
}

// Returns the unique, cleaned, sorted list of models for a brand (same logic
// used by the old step grid) so the dropdown matches what getByBrand expects.
function getUniqueModelsForBrand(brandName) {
  const brandModels = MODELS.filter(m => m.brand === brandName);
  const seen = new Set();
  const uniqueModels = [];
  brandModels.forEach(model => {
    const cleanName = getCleanModelName(model.name);
    const norm = normalizeModel(cleanName);
    if (!seen.has(norm)) {
      seen.add(norm);
      uniqueModels.push(cleanName);
    }
  });
  uniqueModels.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  return uniqueModels;
}

function onFinderBrandChange() {
  const brandSelect = document.getElementById("finder-brand-select");
  const modelSelect = document.getElementById("finder-model-select");
  if (!brandSelect || !modelSelect) return;
  const brandName = brandSelect.value;

  modelSelect.innerHTML = '<option value="">Избери модел</option>';
  if (!brandName) {
    modelSelect.disabled = true;
    return;
  }

  const models = getUniqueModelsForBrand(brandName);
  models.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    modelSelect.appendChild(opt);
  });
  modelSelect.disabled = models.length === 0;
}

function finderSearch() {
  const brandSelect = document.getElementById("finder-brand-select");
  const modelSelect = document.getElementById("finder-model-select");
  if (!brandSelect) return;
  const brandName = brandSelect.value;
  const modelName = modelSelect ? modelSelect.value : "";

  if (!brandName) {
    finderToast("Моля, изберете марка телефон.");
    brandSelect.focus();
    return;
  }

  // Reset search state and apply the brand/model filter, then show the catalog.
  const input = document.getElementById("smart-search-input");
  if (input) input.value = "";
  searchQuery = "";
  const clearBtn = document.getElementById("search-clear-btn");
  if (clearBtn) clearBtn.style.display = "none";

  selectedBrand = brandName;
  selectedModel = modelName || null;
  selectedCategory = null;

  document.querySelectorAll(".category-card").forEach(card => card.classList.remove("active"));

  renderCatalog();

  const catalogSection = document.getElementById("catalog");
  if (catalogSection) {
    catalogSection.scrollIntoView({ behavior: "smooth" });
  }
}

// --- SMART SEARCH BAR LOGIC ---
const PHONETIC_MAP = {
  "айфон": "iphone",
  "ифон": "iphone",
  "самсунг": "samsung",
  "шаоми": "xiaomi",
  "ксиаоми": "xiaomi",
  "редми": "redmi",
  "хуавей": "huawei",
  "хуауей": "huawei",
  "гугъл": "google",
  "пиксел": "pixel",
  "мото": "moto",
  "моторола": "motorola",
  "хонор": "honor",
  "нокия": "nokia",
  "уанплюс": "oneplus",
  "опо": "oppo",
  "виво": "vivo",
  "риалми": "realme",
  "риълми": "realme",
  "трианю": "tranyoo",
  "кейс": "keysove-i-kalufi",
  "кейсове": "keysove-i-kalufi",
  "калъф": "keysove-i-kalufi",
  "калъфи": "keysove-i-kalufi",
  "протектор": "protektori-za-ekran",
  "протектори": "protektori-za-ekran",
  "батерия": "vanshni-baterii",
  "батерии": "vanshni-baterii",
  "кабел": "kabeli-za-zaryadane",
  "кабели": "kabeli-za-zaryadane",
  "зарядно": "zaryadni-ustroystva",
  "зарядни": "zaryadni-ustroystva",
  "поставка": "postavki-za-byuro",
  "поставки": "postavki-za-byuro"
};

function cyrillicToLatin(text) {
  const map = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh', 'з': 'z',
    'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
    'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'sht', 'ъ': 'a', 'ь': 'y', 'ю': 'yu', 'я': 'ya'
  };
  return text.split('').map(char => map[char] || char).join('');
}

function getSearchQueries(q) {
  const original = q.toLowerCase().trim();
  const words = original.split(/\s+/);
  
  const mappedWords = words.map(w => {
    if (PHONETIC_MAP[w]) return PHONETIC_MAP[w];
    for (const [bulgarian, english] of Object.entries(PHONETIC_MAP)) {
      if (w.startsWith(bulgarian) || bulgarian.startsWith(w)) {
        return english;
      }
    }
    return w;
  });
  
  const mapped = mappedWords.join(" ");
  const queries = [original];
  if (mapped !== original) {
    queries.push(mapped);
  }
  
  const latinTranslit = cyrillicToLatin(original);
  if (!queries.includes(latinTranslit)) {
    queries.push(latinTranslit);
  }
  
  return queries;
}

window.handleSearchInput = function(val) {
  searchQuery = val.trim();
  const clearBtn = document.getElementById("search-clear-btn");
  if (clearBtn) {
    clearBtn.style.display = searchQuery ? "block" : "none";
  }
  
  renderSearchSuggestions();
  
  // If we are on homepage, update catalog instantly
  const path = window.location.pathname;
  if (path === "/" || path === "/index.html") {
    if (searchQuery) {
      selectedBrand = null;
      selectedModel = null;
      selectedCategory = null;
      
      // Clear active classes in filters
      document.querySelectorAll(".brand-pill-btn").forEach(c => c.classList.remove("active"));
      document.querySelectorAll(".model-pill-btn").forEach(c => c.classList.remove("active"));
      
      // Reset Step 2 model list
      const modelsContainer = document.getElementById("models-list");
      if (modelsContainer) {
        modelsContainer.innerHTML = "";
        modelsContainer.style.display = "none";
      }
      const step2Title = document.getElementById("step2-title");
      if (step2Title) step2Title.style.display = "none";
    }
    renderCatalog();
  }
};

window.handleSearchKeyDown = function(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    hideSearchSuggestions();
    
    // Redirect to home if not on it
    const path = window.location.pathname;
    if (path !== "/" && path !== "/index.html") {
      history.pushState(null, "", "/");
      handleRouting();
    }
    
    const catalogSection = document.getElementById("catalog");
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: "smooth" });
    }
  }
};

window.clearSearch = function() {
  const input = document.getElementById("smart-search-input");
  if (input) {
    input.value = "";
  }
  searchQuery = "";
  const clearBtn = document.getElementById("search-clear-btn");
  if (clearBtn) {
    clearBtn.style.display = "none";
  }
  hideSearchSuggestions();
  
  const path = window.location.pathname;
  if (path === "/" || path === "/index.html") {
    renderCatalog();
  }
};

function hideSearchSuggestions() {
  const box = document.getElementById("search-suggestions");
  if (box) {
    box.style.display = "none";
  }
}

let searchSuggestionsDebounceTimer = null;

function renderSearchSuggestions() {
  const box = document.getElementById("search-suggestions");
  if (!box) return;

  if (!searchQuery || searchQuery.length < 2) {
    box.style.display = "none";
    clearTimeout(searchSuggestionsDebounceTimer);
    return;
  }

  const queries = getSearchQueries(searchQuery);
  let matchesHtml = "";
  let matchCount = 0;

  // 1. Matches in Categories (малък локален масив - без мрежа)
  const matchedCats = CATEGORIES.filter(c => {
    const catName = c.name.toLowerCase();
    return queries.some(q => catName.includes(q));
  });

  matchedCats.forEach(cat => {
    if (matchCount >= 4) return;
    matchCount++;
    matchesHtml += `
      <div class="search-suggestion-item" onclick="selectSuggestion('category', '${cat.id}')" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1.2rem; cursor: pointer; transition: background 0.2s;">
        <i class="fas fa-th-large" style="color: var(--gold); width: 16px;"></i>
        <div>
          <span style="font-weight: 600; font-size: 0.9rem; color: var(--primary);">Категория: ${cat.name}</span>
        </div>
      </div>
    `;
  });

  // 2. Matches in Models (малък локален масив - без мрежа)
  const matchedModels = MODELS.filter(m => {
    const modelName = getCleanModelName(m.name).toLowerCase();
    return queries.some(q => modelName.includes(q));
  });

  const seenModels = new Set();
  matchedModels.forEach(m => {
    const cleanName = getCleanModelName(m.name);
    if (seenModels.has(cleanName) || matchCount >= 8) return;
    seenModels.add(cleanName);
    matchCount++;
    matchesHtml += `
      <div class="search-suggestion-item" onclick="selectSuggestion('model', '${cleanName}')" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1.2rem; cursor: pointer; transition: background 0.2s;">
        <i class="fas fa-mobile-alt" style="color: var(--gold); width: 16px;"></i>
        <div>
          <span style="font-weight: 600; font-size: 0.9rem; color: var(--primary);">Модел: ${cleanName}</span>
        </div>
      </div>
    `;
  });

  // Покажи веднага каквото имаме (категории/модели), докато продуктовото
  // търсене (мрежова заявка) приключи с малко закъснение по-долу.
  box.innerHTML = matchesHtml || `<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">Търсене...</div>`;
  box.style.display = "block";

  // 3. Matches in Products - през Convex, изчакано (debounce), за да не
  // праща заявка на всеки натиснат клавиш.
  clearTimeout(searchSuggestionsDebounceTimer);
  searchSuggestionsDebounceTimer = setTimeout(async () => {
    const queryAtRequestTime = searchQuery;
    let matchedProducts = [];
    try {
      matchedProducts = await fetchSearchResults(queryAtRequestTime);
      cacheProducts(matchedProducts);
    } catch (err) {
      console.error("Search suggestions fetch failed:", err);
    }
    // Ако потребителят е продължил да пише междувременно, изхвърляме
    // остарелия резултат.
    if (searchQuery !== queryAtRequestTime) return;

    const isB2B = currentUser && currentUser.clientType === "B2B";
    matchedProducts.sort((a, b) => {
      const priceA = isB2B ? (a.priceB2B ?? a.price ?? 0) : (a.priceB2C ?? a.price ?? 0);
      const priceB = isB2B ? (b.priceB2B ?? b.price ?? 0) : (b.priceB2C ?? b.price ?? 0);
      return priceA - priceB;
    });

    matchedProducts.slice(0, 5).forEach(product => {
      if (matchCount >= 12) return;
      matchCount++;
      const slug = getProductSlug(product.name + " " + (product.model || ""));
      const price = currentUser && currentUser.clientType === "B2B" ? (product.priceB2B ?? product.price) : (product.priceB2C ?? product.price);

      matchesHtml += `
        <div class="search-suggestion-item" onclick="selectSuggestion('product', '${slug}')" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1.2rem; cursor: pointer; transition: background 0.2s; border-top: 1px solid rgba(15,23,42,0.04);">
          <img src="${getProductImageUrl(product.image, product.name, product.model)}" style="width: 35px; height: 35px; object-fit: contain; border-radius: 4px; background: var(--bg-light);" onerror="this.src='/assets/logo.webp'">
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 0.85rem; color: var(--primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${product.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${product.brand} ${product.model || ""}</div>
          </div>
          <div style="font-weight: 700; font-size: 0.85rem; color: var(--gold);">${formatPrice(price)}</div>
        </div>
      `;
    });

    if (matchCount === 0) {
      box.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">Няма намерени резултати</div>`;
    } else {
      matchesHtml += `
        <div class="search-suggestion-item see-all-results" onclick="selectSuggestion('see_all', '')" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.2rem; cursor: pointer; transition: background 0.2s; border-top: 1px solid rgba(15,23,42,0.08); background: var(--bg-light); text-align: center;">
          <span style="font-weight: 700; font-size: 0.9rem; color: var(--gold);">Виж всички резултати за "${searchQuery}"</span>
          <i class="fas fa-arrow-right" style="color: var(--gold); font-size: 0.85rem;"></i>
        </div>
      `;
      box.innerHTML = matchesHtml;
    }
    box.style.display = "block";
  }, 250);
}

window.selectSuggestion = function(type, id) {
  hideSearchSuggestions();
  if (type === "category") {
    history.pushState(null, "", "/" + id);
    handleRouting();
  } else if (type === "model") {
    history.pushState(null, "", "/");
    handleRouting();
    const modelObj = MODELS.find(m => getCleanModelName(m.name) === id);
    if (modelObj) {
      selectBrand(modelObj.brand);
      selectModel(id);
    }
  } else if (type === "product") {
    history.pushState(null, "", "/produkt/" + id);
    handleRouting();
  } else if (type === "see_all") {
    const path = window.location.pathname;
    if (path !== "/" && path !== "/index.html") {
      history.pushState(null, "", "/");
      handleRouting();
    }
    renderCatalog();
    setTimeout(() => {
      const catalogSection = document.getElementById("catalog");
      if (catalogSection) {
        catalogSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  }
};

// Close suggestions on outside click
document.addEventListener("click", (e) => {
  const wrapper = document.querySelector(".search-bar-section");
  if (wrapper && !wrapper.contains(e.target)) {
    hideSearchSuggestions();
  }
});

// Short editorial subtitles for the homepage category cards (by id)
const CATEGORY_SUBTITLES = {
  "keysove-i-kalufi": "Стил и защита в едно",
  "protektori-za-ekran": "Максимална защита за дисплея",
  "zaryadni-ustroystva": "Бързо и сигурно зареждане",
  "bezzhichni-zaryadni": "Безжична технология",
  "kabeli-za-zaryadane": "Надеждни връзки всеки ден",
  "aksesoari-za-avtomobili": "Комфорт зад волана",
  "vanshni-baterii": "Енергия в движение",
  "postavki-za-byuro": "Ред на бюрото",
  "selfi-stikove": "Перфектният кадър",
  "popsoket-i-vrazki": "Малки детайли, голямо удобство"
};

function buildCategoryCard(cat, extraClass) {
  const card = document.createElement("div");
  card.className = "category-card ck-cat-card" + (extraClass ? " " + extraClass : "");
  card.style.cursor = "pointer";
  card.onclick = () => {
    history.pushState(null, "", "/" + cat.id);
    handleRouting();
  };
  const sub = CATEGORY_SUBTITLES[cat.id] || "Разгледай продуктите";
  card.innerHTML = `
    <img src="${getCategoryImage(cat)}" alt="${cat.name}" class="category-card-img" loading="lazy">
    <div class="ck-cat-overlay">
      <div class="ck-cat-text">
        <span class="ck-cat-title">${cat.name}</span>
        <span class="ck-cat-sub">${sub}</span>
      </div>
      <span class="ck-cat-arrow"><i class="fas fa-arrow-right"></i></span>
    </div>
  `;
  return card;
}

function renderCategories() {
  const container = document.getElementById("categories-grid");
  if (!container) return;
  container.className = "categories-grid ck-cat-uniform";
  container.innerHTML = "";

  // Homepage shows a clean, uniform grid of equal-sized category cards.
  const list = CATEGORIES.slice(0, 6);
  list.forEach((cat) => {
    container.appendChild(buildCategoryCard(cat, ""));
  });
}

// Търси в неколко варианта на заявката (оригинал, фонетично map-нат,
// транслитериран на латиница) успоредно през Convex search индекса и
// обединява резултатите - за да продължи да работи търсене на кирилица
// за латински имена на продукти (напр. "самсунг" -> "samsung"), както
// правеше старото търсене в целия локален масив с продукти.
async function fetchSearchResults(query) {
  const variants = [...new Set(getSearchQueries(query))].filter(Boolean);
  const resultsByVariant = await Promise.all(
    variants.map((v) => convex.query("products:searchProducts", { query: v }).catch(() => []))
  );
  const merged = new Map();
  for (const list of resultsByVariant) {
    for (const p of list) merged.set(p._id, p);
  }
  return Array.from(merged.values()).slice(0, 60);
}

async function renderCatalog(loadMore = false) {
  const grid = document.getElementById("product-grid");
  const catalogTitle = document.getElementById("catalog-main-title");
  if (!grid) return;

  const isFiltered = !!(selectedBrand || searchQuery);

  if (!loadMore) {
    catalogAccumulated = [];
    catalogCursor = null;
    catalogIsDone = true;
    grid.innerHTML = `<div class="no-products-message">Зареждане...</div>`;
  }
  if (catalogLoading) return;
  catalogLoading = true;

  try {
    if (selectedBrand) {
      if (catalogTitle) {
        catalogTitle.textContent = selectedModel ? `Аксесоари за ${selectedModel}` : `Аксесоари за ${selectedBrand}`;
      }
      const page = await convex.query("products:getByBrand", {
        brand: selectedBrand,
        model: selectedModel || undefined,
        cursor: loadMore ? catalogCursor : null,
      });
      catalogAccumulated = loadMore ? catalogAccumulated.concat(page.page) : page.page;
      catalogIsDone = page.isDone;
      catalogCursor = page.continueCursor;
      cacheProducts(page.page);
    } else if (searchQuery) {
      if (catalogTitle) catalogTitle.textContent = `Резултати от търсенето за: "${searchQuery}"`;
      catalogAccumulated = await fetchSearchResults(searchQuery);
      catalogIsDone = true;
      catalogCursor = null;
      cacheProducts(catalogAccumulated);
    } else {
      if (catalogTitle) catalogTitle.textContent = "Препоръчани продукти";
      // Малка първоначална извадка от каталога (виж loadData), достатъчна
      // за препоръчаните 8 най-евтини продукта на началния изглед.
      catalogAccumulated = PRODUCTS.filter((p) => !p.isDeleted);
      catalogIsDone = true;
      catalogCursor = null;
    }
  } catch (err) {
    console.error("Could not load catalog products:", err);
    grid.innerHTML = `<div class="no-products-message">Грешка при зареждане на продуктите. Опитайте отново.</div>`;
    catalogLoading = false;
    return;
  }
  catalogLoading = false;

  let filteredProducts = catalogAccumulated.filter((p) => !p.isDeleted);

  // Always sort by price (from cheapest to most expensive)
  const isB2B = currentUser && currentUser.clientType === "B2B";
  filteredProducts.sort((a, b) => {
    const priceA = isB2B ? (a.priceB2B ?? a.price ?? 0) : (a.priceB2C ?? a.price ?? 0);
    const priceB = isB2B ? (b.priceB2B ?? b.price ?? 0) : (b.priceB2C ?? b.price ?? 0);
    return priceA - priceB;
  });

  // If not filtered (recommended view), show only the 8 cheapest products
  if (!isFiltered) {
    filteredProducts = filteredProducts.slice(0, 8);
  }

  // Update section subtitle dynamically
  const subtitle = document.querySelector(".catalog .section-subtitle");
  if (subtitle) {
    if (isFiltered) {
      subtitle.textContent = "CaseKing Premium Selection";
    } else {
      subtitle.textContent = "Изберете марка и модел от филтрите по-горе, за да видите пълния каталог";
    }
  }

  grid.innerHTML = "";

  if (filteredProducts.length === 0) {
    grid.innerHTML = `<div class="no-products-message">Няма намерени продукти за избрания филтър.</div>`;
    return;
  }

  filteredProducts.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.style.cursor = "pointer";
    
    // Clicking anywhere on the card opens its product page
    card.onclick = (e) => {
      // Exclude add to cart button click
      if (e.target.classList.contains("btn-card-buy") || e.target.closest(".btn-card-buy")) {
        return;
      }
      const slug = getProductSlug(product.name + " " + (product.model || ""));
      history.pushState(null, "", "/produkt/" + slug);
      handleRouting();
    };
    
    const tagHtml = product.tag ? `<span class="badge-tag sale">${product.tag}</span>` : "";
    
    // Choose active price (B2B vs B2C)
    const isB2B = currentUser && currentUser.clientType === "B2B";
    const price = isB2B ? (product.priceB2B ?? product.price) : (product.priceB2C ?? product.price);
    const oldPrice = isB2B ? product.oldPriceB2B : (product.oldPriceB2C ?? product.oldPrice);
    
    const priceHtml = oldPrice 
      ? `<span class="product-price old-price">${formatPrice(oldPrice)}</span>
         <span class="product-price" style="color: var(--accent);">${formatPrice(price)} ${isB2B ? '<span style="font-size:0.65rem; font-weight:600; color:var(--gold);">B2B</span>' : ''}</span>`
      : `<span class="product-price">${formatPrice(price)} ${isB2B ? '<span style="font-size:0.65rem; font-weight:600; color:var(--gold);">B2B</span>' : ''}</span>`;

    card.innerHTML = `
      ${tagHtml}
      <div class="product-image-container">
        <img class="product-img" src="${getProductImageUrl(product.image, product.name, product.model)}" alt="${product.name}" loading="lazy" onerror="this.src='/assets/logo.webp'">
      </div>
      <div class="product-info">
        <span class="product-category">${product.brand}</span>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-price-box">
          ${priceHtml}
        </div>
        <button class="btn-card-buy" onclick="addToCart('${product._id}', 1, event)">Добави в количката</button>
      </div>
    `;
    grid.appendChild(card);
  });

  if (!catalogIsDone) {
    const loadMoreBtn = document.createElement("button");
    loadMoreBtn.className = "btn-card-buy";
    loadMoreBtn.style.cssText = "grid-column: 1/-1; max-width: 280px; margin: 1.5rem auto 0; display: block;";
    loadMoreBtn.textContent = "Зареди още продукти";
    loadMoreBtn.onclick = () => renderCatalog(true);
    grid.appendChild(loadMoreBtn);
  }
}

// Helper to update active image in details page gallery
function updateProductPageImage(index) {
  if (index < 0 || index >= currentProductImagesList.length) return;
  currentProductImageIndex = index;
  
  const mainImgUrl = currentProductImagesList[index];
  const mainImgEl = document.getElementById("product-page-image");
  mainImgEl.onerror = function() { this.onerror = null; this.src = "/assets/logo.webp"; };
  mainImgEl.src = getProductImageUrl(mainImgUrl, currentProductImageName, currentProductImageModel);
  mainImgEl.alt = currentProductImageName;
  
  // Update thumbnail borders
  const thumbnailsContainer = document.getElementById("product-page-thumbnails");
  if (thumbnailsContainer) {
    const thumbs = thumbnailsContainer.querySelectorAll("img");
    thumbs.forEach((thumb, idx) => {
      if (idx === index) {
        thumb.style.borderColor = "var(--gold)";
      } else {
        thumb.style.borderColor = "rgba(255,255,255,0.1)";
      }
    });
  }
}

// --- PRODUCT PAGE ROUTE HANDLER ---
function renderProductPage(p) {
  if (!p) {
    history.replaceState("", document.title, window.location.pathname + window.location.search);
    handleRouting();
    return;
  }
  
  activeProductPageQty = 1;
  document.getElementById("product-page-qty-val").textContent = "1";
  
  // Set textual properties
  document.getElementById("product-page-cat").textContent = p.brand;
  document.getElementById("product-page-title").textContent = p.name;
  document.getElementById("product-page-desc").textContent = p.description;
  
  // Initialize gallery state
  currentProductImagesList = p.images && p.images.length > 0 ? p.images : [p.image];
  currentProductImageIndex = currentProductImagesList.indexOf(p.image);
  if (currentProductImageIndex === -1) currentProductImageIndex = 0;
  currentProductImageName = p.name;
  currentProductImageModel = p.model;
  
  // Render multiple images thumbnails
  const thumbnailsContainer = document.getElementById("product-page-thumbnails");
  if (thumbnailsContainer) {
    thumbnailsContainer.innerHTML = "";
    if (currentProductImagesList.length > 1) {
      currentProductImagesList.forEach((imgUrl, imgIdx) => {
        const thumb = document.createElement("img");
        thumb.onerror = function() { this.onerror = null; this.src = "/assets/logo.webp"; };
        thumb.src = getProductImageUrl(imgUrl, p.name, p.model);
        thumb.alt = `${p.name} - ${imgIdx + 1}`;
        thumb.style.cssText = "width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 2px solid rgba(255,255,255,0.1); cursor: pointer; transition: border-color 0.2s; flex-shrink: 0;";
        thumb.addEventListener("click", () => {
          updateProductPageImage(imgIdx);
        });
        thumbnailsContainer.appendChild(thumb);
      });
      thumbnailsContainer.style.display = "flex";
    } else {
      thumbnailsContainer.style.display = "none";
    }
  }
  
  // Set initial image and show/hide arrows
  updateProductPageImage(currentProductImageIndex);
  
  const prevBtn = document.getElementById("product-page-prev-btn");
  const nextBtn = document.getElementById("product-page-next-btn");
  if (prevBtn && nextBtn) {
    if (currentProductImagesList.length > 1) {
      prevBtn.style.display = "flex";
      nextBtn.style.display = "flex";
    } else {
      prevBtn.style.display = "none";
      nextBtn.style.display = "none";
    }
  }
  
  document.getElementById("product-page-spec-material").textContent = p.specs.material;
  document.getElementById("product-page-spec-weight").textContent = p.specs.weight;
  document.getElementById("product-page-spec-origin").textContent = p.specs.origin;
  // Sanitize delivery text: strip any unwanted "(без тест)" note that may exist in stored data
  document.getElementById("product-page-spec-delivery").textContent =
    (p.specs.delivery || "").replace(/\s*\(без тест\)\s*/gi, " ").trim();
  
  // Stars
  let ratingStars = "";
  for (let i = 1; i <= 5; i++) {
    ratingStars += `<i class="${i <= p.rating ? 'fas' : 'far'} fa-star"></i>`;
  }
  document.getElementById("product-page-stars").innerHTML = ratingStars;
  
  // Prices (B2B / B2C)
  const isB2B = currentUser && currentUser.clientType === "B2B";
  const price = isB2B ? (p.priceB2B ?? p.price) : (p.priceB2C ?? p.price);
  const oldPrice = isB2B ? p.oldPriceB2B : (p.oldPriceB2C ?? p.oldPrice);
  
  const priceEl = document.getElementById("product-page-price");
  const oldPriceEl = document.getElementById("product-page-old-price");
  const badgeEl = document.getElementById("product-page-client-badge");
  
  priceEl.textContent = formatPrice(price);
  if (oldPrice) {
    oldPriceEl.textContent = formatPrice(oldPrice);
    oldPriceEl.style.display = "inline";
  } else {
    oldPriceEl.style.display = "none";
  }
  
  if (isB2B) {
    badgeEl.textContent = "B2B ПАРТНЬОРСКА ЦЕНА";
    badgeEl.style.display = "inline-block";
  } else {
    badgeEl.style.display = "none";
  }
  
  // Event listeners
  document.getElementById("product-page-qty-dec").onclick = () => {
    if (activeProductPageQty > 1) {
      activeProductPageQty--;
      document.getElementById("product-page-qty-val").textContent = activeProductPageQty;
    }
  };
  document.getElementById("product-page-qty-inc").onclick = () => {
    activeProductPageQty++;
    document.getElementById("product-page-qty-val").textContent = activeProductPageQty;
  };
  document.getElementById("product-page-add-to-cart").onclick = (e) => {
    addToCart(p._id, activeProductPageQty, e);
  };

  // Update or create product structured data (SEO JSON-LD)
  let ldScript = document.getElementById("product-ld-json");
  if (!ldScript) {
    ldScript = document.createElement("script");
    ldScript.type = "application/ld+json";
    ldScript.id = "product-ld-json";
    document.head.appendChild(ldScript);
  }
  ldScript.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": p.name,
    "description": p.description,
    "brand": { "@type": "Brand", "name": p.brand },
    "offers": {
      "@type": "Offer",
      "price": p.priceB2C || p.price,
      "priceCurrency": "BGN",
      "availability": "https://schema.org/InStock"
    }
  });

  // === Populate product detail tabs + related products ===
  populateProductTabs(p);
  renderRelatedProducts(p);
  switchProductTab("desc");
}

// Populate the 6 product-detail tabs with REAL product data only (no fabricated reviews/counts).
function populateProductTabs(p) {
  const esc = (s) => (s == null ? "" : String(s));
  const imgs = (p.images && p.images.length ? p.images : [p.image]).slice(0, 3);

  // --- Описание ---
  const descEl = document.getElementById("ck-tab-desc");
  if (descEl) {
    const featureImgs = imgs.map((u, i) =>
      `<div class="ck-tab-feat-img"><img src="${getProductImageUrl(u, p.name, p.model)}" alt="${esc(p.name)}" loading="lazy" onerror="this.src='/assets/logo.webp'"></div>`
    ).join("");
    descEl.innerHTML = `
      <div class="ck-tab-desc-grid">
        <div class="ck-tab-desc-text">
          <h3>Създаден за твоя ${esc(p.model || p.brand)}.</h3>
          <p>${esc(p.description)}</p>
          <ul class="ck-tab-checks">
            <li><i class="fas fa-check"></i> Оригинален продукт от ${esc(p.brand)}</li>
            <li><i class="fas fa-check"></i> Прецизно изработен за ${esc(p.model || "твоя модел")}</li>
            <li><i class="fas fa-check"></i> Материал: ${esc(p.specs && p.specs.material)}</li>
            <li><i class="fas fa-check"></i> Гаранция за автентичност</li>
          </ul>
          <button class="hero-cta-secondary" onclick="switchProductTab('specs')">Виж всички характеристики <i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="ck-tab-feat-grid">${featureImgs}</div>
      </div>`;
  }

  // --- Характеристики ---
  const specsEl = document.getElementById("ck-tab-specs");
  if (specsEl) {
    const s = p.specs || {};
    const rows = [
      ["Марка", p.brand],
      ["Модел", p.model],
      ["Материал", s.material],
      ["Тегло", s.weight],
      ["Произход", s.origin],
      ["Категория", p.category],
    ].filter(r => r[1]);
    specsEl.innerHTML = `
      <table class="ck-tab-spec-table">
        ${rows.map(r => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join("")}
      </table>`;
  }

  // --- Съвместимост ---
  const compatEl = document.getElementById("ck-tab-compat");
  if (compatEl) {
    compatEl.innerHTML = `
      <div class="ck-tab-info">
        <p><i class="fas fa-mobile-screen"></i> Този продукт е съвместим с <strong>${esc(p.brand)} ${esc(p.model || "")}</strong>.</p>
        <p class="ck-tab-note">Преди покупка проверете точния модел на вашето устройство, за да гарантирате перфектно прилягане.</p>
      </div>`;
  }

  // --- Доставка ---
  const delEl = document.getElementById("ck-tab-delivery");
  if (delEl) {
    const dtxt = ((p.specs && p.specs.delivery) || "").replace(/\s*\(без тест\)\s*/gi, " ").trim();
    delEl.innerHTML = `
      <div class="ck-tab-info">
        ${dtxt ? `<p><i class="fas fa-truck-fast"></i> ${esc(dtxt)}</p>` : `<p><i class="fas fa-truck-fast"></i> Доставка до 3–4 работни дни в цялата страна.</p>`}
        <p><i class="fas fa-box-open"></i> Доставка с куриер до адрес или до офис на куриерска фирма.</p>
        <p><i class="fas fa-money-bill-wave"></i> Плащане с карта или наложен платеж при доставка.</p>
      </div>`;
  }

  // --- Гаранция ---
  const warEl = document.getElementById("ck-tab-warranty");
  if (warEl) {
    warEl.innerHTML = `
      <div class="ck-tab-info">
        <p><i class="fas fa-shield-halved"></i> Всички продукти в CaseKing са <strong>100% оригинални</strong> и с гаранция за автентичност.</p>
        <p><i class="fas fa-rotate-left"></i> 14 дни право на връщане съгласно Закона за защита на потребителите.</p>
        <p><i class="fas fa-headset"></i> Поддръжка и съдействие при въпроси относно продукта.</p>
      </div>`;
  }

  // --- Отзиви (real rating only, no fabricated reviews) ---
  const revEl = document.getElementById("ck-tab-reviews");
  if (revEl) {
    let stars = "";
    for (let i = 1; i <= 5; i++) stars += `<i class="${i <= p.rating ? 'fas' : 'far'} fa-star"></i>`;
    revEl.innerHTML = `
      <div class="ck-tab-reviews">
        <div class="ck-tab-rating-big">
          <span class="ck-rating-num">${(p.rating || 0).toFixed(1)}</span>
          <div class="ck-rating-stars">${stars}</div>
        </div>
        <p class="ck-tab-note">Все още няма писани отзиви за този продукт. Бъдете първите, които ще споделят мнение след покупка.</p>
      </div>`;
  }
}

// Switch active tab in the product detail page
window.switchProductTab = function(name) {
  document.querySelectorAll(".ck-pdp-tab").forEach(t => {
    t.classList.toggle("active", t.getAttribute("data-tab") === name);
  });
  document.querySelectorAll(".ck-pdp-panel").forEach(p => {
    p.classList.toggle("active", p.getAttribute("data-panel") === name);
  });
};

// Render related products (same category, real products only)
function renderRelatedProducts(p) {
  const wrap = document.getElementById("ck-pdp-related");
  const grid = document.getElementById("ck-pdp-related-grid");
  if (!wrap || !grid) return;

  const pool = Array.isArray(catalogAccumulated) ? catalogAccumulated : [];
  let related = pool.filter(x => x._id !== p._id && x.category === p.category);
  if (related.length < 4) {
    // Fill with other real products if the same category is small
    const extra = pool.filter(x => x._id !== p._id && !related.includes(x));
    related = related.concat(extra);
  }
  related = related.slice(0, 5);

  if (related.length === 0) {
    wrap.style.display = "none";
    return;
  }

  grid.innerHTML = "";
  related.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.style.cursor = "pointer";
    card.onclick = (e) => {
      if (e.target.classList.contains("btn-card-buy") || e.target.closest(".btn-card-buy")) return;
      const slug = getProductSlug(product.name + " " + (product.model || ""));
      history.pushState(null, "", "/produkt/" + slug);
      handleRouting();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const tagHtml = product.tag ? `<span class="badge-tag sale">${product.tag}</span>` : "";
    const isB2B = currentUser && currentUser.clientType === "B2B";
    const price = isB2B ? (product.priceB2B ?? product.price) : (product.priceB2C ?? product.price);
    const oldPrice = isB2B ? product.oldPriceB2B : (product.oldPriceB2C ?? product.oldPrice);
    const priceHtml = oldPrice
      ? `<span class="product-price old-price">${formatPrice(oldPrice)}</span>
         <span class="product-price" style="color: var(--accent);">${formatPrice(price)}</span>`
      : `<span class="product-price">${formatPrice(price)}</span>`;
    card.innerHTML = `
      ${tagHtml}
      <div class="product-image-container">
        <img class="product-img" src="${getProductImageUrl(product.image, product.name, product.model)}" alt="${product.name}" loading="lazy" onerror="this.src='/assets/logo.webp'">
      </div>
      <div class="product-info">
        <span class="product-category">${product.brand}</span>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-price-box">${priceHtml}</div>
        <button class="btn-card-buy" onclick="addToCart('${product._id}', 1, event)">Добави в количката</button>
      </div>`;
    grid.appendChild(card);
  });
  wrap.style.display = "block";
}

// --- CART CALCULATIONS & RENDERING ---
function updateCartCount() {
  const countElements = document.querySelectorAll(".cart-count");
  const uniqueCount = cart.length;
  countElements.forEach(el => {
    el.textContent = uniqueCount;
    el.style.display = uniqueCount > 0 ? "flex" : "none";
  });
}

function saveCart() {
  localStorage.setItem('caseking_cart', JSON.stringify(cart));
  updateCartCount();
  renderCartItems();
}

function animateFlyToCart(imgEl) {
  const imgRect = imgEl.getBoundingClientRect();
  const cartCountEl = document.querySelector('.cart-count');
  if (!cartCountEl) return;
  const cartIcon = cartCountEl.parentElement;
  const cartRect = cartIcon.getBoundingClientRect();
  
  const clone = imgEl.cloneNode(true);
  clone.style.position = 'fixed';
  clone.style.left = `${imgRect.left}px`;
  clone.style.top = `${imgRect.top}px`;
  clone.style.width = `${imgRect.width}px`;
  clone.style.height = `${imgRect.height}px`;
  clone.style.zIndex = '99999';
  clone.style.transition = 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
  clone.style.pointerEvents = 'none';
  clone.style.transformOrigin = 'center center';
  
  document.body.appendChild(clone);
  
  // Trigger layout/reflow
  clone.getBoundingClientRect();
  
  requestAnimationFrame(() => {
    clone.style.left = `${cartRect.left + cartRect.width / 2 - 15}px`;
    clone.style.top = `${cartRect.top + cartRect.height / 2 - 15}px`;
    clone.style.width = '30px';
    clone.style.height = '30px';
    clone.style.opacity = '0.2';
    clone.style.transform = 'scale(0.1) rotate(360deg)';
  });
  
  clone.addEventListener('transitionend', () => {
    clone.remove();
    cartIcon.classList.add('cart-pulse');
    cartIcon.addEventListener('animationend', () => {
      cartIcon.classList.remove('cart-pulse');
    }, { once: true });
  });
}

window.addToCart = async function(productId, quantity = 1, event = null) {
  // Find product details (instant if it was just rendered on screen,
  // otherwise falls back to a direct lookup - see getProductById above)
  const product = await getProductById(productId);
  if (!product) return;
  
  // Determine pricing to store in cart (to lock B2B/B2C state)
  const isB2B = currentUser && currentUser.clientType === "B2B";
  const activePrice = isB2B ? (product.priceB2B ?? product.price) : (product.priceB2C ?? product.price);
  const productSlug = getProductSlug(product.name + " " + (product.model || ""));
  const productUrl = productSlug ? `/produkt/${productSlug}` : "";
  
  const existingItemIndex = cart.findIndex(item => (item.id || item._id) === productId && !item.isGift);
  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
    cart[existingItemIndex].price = activePrice; // update to latest login type rate
    cart[existingItemIndex].image = product.image || cart[existingItemIndex].image || "";
    cart[existingItemIndex].productSlug = productSlug;
    cart[existingItemIndex].productUrl = productUrl;
  } else {
    cart.push({
      id: product._id,
      name: product.name,
      image: product.image,
      price: activePrice,
      brand: product.brand,
      category: product.category,
      productSlug,
      productUrl,
      quantity
    });
  }
  
  saveCart();
  
  if (event) {
    let imgToClone = null;
    const targetEl = event.target || event.currentTarget;
    if (targetEl) {
      const card = targetEl.closest('.product-card');
      if (card) {
        imgToClone = card.querySelector('.product-img');
      } else {
        const detailImg = document.getElementById("product-page-image");
        if (detailImg && (targetEl.id === "product-page-add-to-cart" || targetEl.closest("#product-page-add-to-cart"))) {
          imgToClone = detailImg;
        }
      }
    }
    
    if (imgToClone) {
      animateFlyToCart(imgToClone);
    }
  }
};

window.updateCartItemQty = function(indexOrId, newQty) {
  let index = -1;
  const parsedIndex = parseInt(indexOrId);
  if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < cart.length) {
    index = parsedIndex;
  } else {
    index = cart.findIndex(item => (item.id || item._id) === indexOrId && !item.isGift);
  }
  
  if (index === -1) return;
  
  if (newQty <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index].quantity = newQty;
  }
  saveCart();
};

window.removeFromCart = function(indexOrId) {
  let index = -1;
  const parsedIndex = parseInt(indexOrId);
  if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < cart.length) {
    index = parsedIndex;
  } else {
    index = cart.findIndex(item => (item.id || item._id) === indexOrId && !item.isGift);
  }
  
  if (index > -1) {
    cart.splice(index, 1);
    saveCart();
  }
};

function triggerCartConfetti(colors = ['#167aff', '#0f172a', '#ffffff', '#e8f1ff'], particleCount = 100) {
  setTimeout(() => {
    const canvas = document.getElementById("cart-confetti-canvas");
    const overlay = document.getElementById("cart-overlay");
    if (canvas && overlay && overlay.classList.contains("active")) {
      // Set canvas size dynamically to match sidebar dimensions
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const localConfetti = confetti.create(canvas, { resize: true });
      localConfetti({
        particleCount: particleCount,
        spread: 60,
        origin: { y: 0.4 },
        colors: colors
      });
    }
  }, 400);
}

async function renderCartItems() {
  const itemsContainer = document.getElementById("cart-items");
  const subtotalEl = document.getElementById("cart-subtotal");
  const promoBanner = document.getElementById("cart-promo-banner");
  
  if (!itemsContainer || !subtotalEl) return;
  
  // Filter out any previous gift items to recalculate subtotal cleanly
  cart = cart.filter(item => !item.isGift);
  
  let subtotal = 0;
  cart.forEach(item => {
    subtotal += item.price * item.quantity;
  });
  
  // Calculate promotions dynamically
  const clientType = currentUser ? currentUser.clientType : "B2C";
  const activePromos = PROMOTIONS.filter(p => p.clientType === clientType && p.active);
  
  // 1. Free shipping check
  const shippingPromo = activePromos.find(p => p.type === "free_shipping");
  let shippingCost = 2.50;
  let shippingPromoText = "";
  
  if (shippingPromo) {
    if (subtotal >= shippingPromo.threshold) {
      shippingCost = 0.00;
      shippingPromoText = "Честито! Получавате БЕЗПЛАТНА доставка! 🚚";
      if (!freeShippingThresholdReached && subtotal > 0) {
        freeShippingThresholdReached = true;
        if (!isInitialLoad && typeof confetti === "function") {
          triggerCartConfetti(['#167aff', '#0f172a', '#ffffff', '#e8f1ff'], 100);
        }
      }
    } else {
      freeShippingThresholdReached = false;
      const diff = shippingPromo.threshold - subtotal;
      shippingPromoText = `Добавете още ${formatPrice(diff)} за БЕЗПЛАТНА доставка!`;
    }
  }

  // 2. Gift check
  const giftPromo = activePromos.find(p => p.type === "gift");
  let giftPromoText = "";
  
  if (giftPromo && giftPromo.giftProductId) {
    if (subtotal >= giftPromo.threshold) {
      const giftProduct = await getProductById(giftPromo.giftProductId);
      if (giftProduct) {
        // Inject gift product to cart
        cart.push({
          id: giftProduct._id,
          name: giftProduct.name + " (ПОДАРЪК)",
          image: giftProduct.image,
          price: 0.00,
          quantity: 1,
          isGift: true
        });
        giftPromoText = `Вземате безплатен подарък: ${giftProduct.name}! 🎁`;
        
        // Trigger confetti for gift!
        if (!giftThresholdReached && subtotal > 0) {
          giftThresholdReached = true;
          if (!isInitialLoad && typeof confetti === "function") {
            triggerCartConfetti(['#167aff', '#0f172a', '#2ecc71', '#ffffff'], 120);
          }
        }
      }
    } else {
      giftThresholdReached = false;
      const diff = giftPromo.threshold - subtotal;
      const giftProduct = await getProductById(giftPromo.giftProductId);
      const giftName = giftProduct ? giftProduct.name : "подарък";
      giftPromoText = `Добавете още ${formatPrice(diff)} за ПОДАРЪК: ${giftName}!`;
    }
  }
  
  // Render Cart Item Rows
  if (cart.length === 0) {
    itemsContainer.innerHTML = `<div class="cart-empty-message">Вашата количка е празна.</div>`;
    subtotalEl.textContent = formatPrice(0);
    if (promoBanner) promoBanner.style.display = "none";
    return;
  }
  
  itemsContainer.innerHTML = "";
  cart.forEach((item, idx) => {
    const itemRow = document.createElement("div");
    itemRow.className = "cart-item";
    
    const qtySelectHtml = item.isGift 
      ? `<span class="cart-qty-val" style="color:var(--success); font-weight:600;">Подарък</span>`
      : `<div class="cart-item-qty-row">
          <button class="cart-qty-btn" onclick="updateCartItemQty(${idx}, ${item.quantity - 1})">-</button>
          <span class="cart-qty-val">${item.quantity}</span>
          <button class="cart-qty-btn" onclick="updateCartItemQty(${idx}, ${item.quantity + 1})">+</button>
        </div>`;

    const removeBtnHtml = item.isGift
      ? ""
      : `<button class="cart-item-remove-btn" onclick="removeFromCart(${idx})" title="Премахни">
          <svg style="width: 18px; height: 18px; pointer-events: none;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>`;

    itemRow.innerHTML = `
      <img class="cart-item-img" src="${getProductImageUrl(item.image, item.name)}" alt="${item.name}" onerror="this.src='/assets/logo.webp'">
      <div class="cart-item-details">
        <h4 class="cart-item-name">${item.name}</h4>
        <span class="cart-item-price">${item.price === 0 ? "0.00 € (0.00 лв.)" : formatPrice(item.price)}</span>
        ${qtySelectHtml}
      </div>
      ${removeBtnHtml}
    `;
    itemsContainer.appendChild(itemRow);
  });
  
  subtotalEl.textContent = formatPrice(subtotal);
  
  // Update banner text
  if (promoBanner) {
    const totalPromoText = [shippingPromoText, giftPromoText].filter(t => t !== "").join("<br>");
    if (totalPromoText) {
      promoBanner.innerHTML = totalPromoText;
      promoBanner.style.display = "block";
    } else {
      promoBanner.style.display = "none";
    }
  }

  // Minimum order value validation
  const minThreshold = clientType === "B2B" ? 29.99 : 9.99;
  const minOrderWarning = document.getElementById("cart-min-order-warning");
  const checkoutBtn = document.querySelector("#cart-overlay .btn-premium");
  if (minOrderWarning) {
    if (subtotal > 0 && subtotal < minThreshold) {
      minOrderWarning.innerHTML = `Стойността на поръчката Ви е под минималните €${minThreshold.toFixed(2)}. Работим с минимални маржове, за да Ви осигурим възможно най-ниските цени на пазара. За да можем да обработим и доставим пратката Ви, е необходимо общата сума да бъде поне €${minThreshold.toFixed(2)}. Ценим Вашия избор!`;
      minOrderWarning.style.display = "block";
      if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.style.opacity = "0.5";
        checkoutBtn.style.cursor = "not-allowed";
      }
    } else {
      minOrderWarning.style.display = "none";
      if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.style.opacity = "1";
        checkoutBtn.style.cursor = "pointer";
      }
    }
  }
}

window.openCartSidebar = function() {
  document.getElementById("cart-overlay").classList.add("active");
};

window.closeCartSidebar = function() {
  document.getElementById("cart-overlay").classList.remove("active");
};

// --- FULL-PAGE CART VIEW ---
window.openCartPage = function() {
  if (window.location.hash !== "#cart") {
    history.pushState(null, "", window.location.pathname + "#cart");
  }
  handleRouting();
};

window.clearCartPage = function() {
  cart = cart.filter(item => item.isGift); // remove all non-gift items
  cart = [];
  saveCart();
  renderCartPage();
};

window.updateCartPageQty = function(id, newQty) {
  window.updateCartItemQty(id, newQty);
  renderCartPage();
};

window.removeFromCartPage = function(id) {
  window.removeFromCart(id);
  renderCartPage();
};

async function renderCartPage() {
  const rowsEl = document.getElementById("ck-cart-rows");
  const tableEl = document.getElementById("ck-cart-table");
  const emptyEl = document.getElementById("ck-cart-empty");
  const asideEl = document.getElementById("ck-cart-aside");
  if (!rowsEl) return;

  // Work only with real (non-gift) items on this overview page
  const items = cart.filter(item => !item.isGift);

  let subtotal = 0;
  items.forEach(item => { subtotal += item.price * item.quantity; });

  const pool = Array.isArray(catalogAccumulated) ? catalogAccumulated : [];

  // Empty state
  if (items.length === 0) {
    if (tableEl) tableEl.style.display = "none";
    if (asideEl) asideEl.style.display = "none";
    if (emptyEl) emptyEl.style.display = "flex";
  } else {
    if (tableEl) tableEl.style.display = "block";
    if (asideEl) asideEl.style.display = "flex";
    if (emptyEl) emptyEl.style.display = "none";
  }

  // Rows
  rowsEl.innerHTML = "";
  items.forEach(item => {
    const id = item.id || item._id;
    const full = pool.find(x => x._id === id);
    const isB2B = currentUser && currentUser.clientType === "B2B";
    const oldPrice = full ? (isB2B ? full.oldPriceB2B : (full.oldPriceB2C ?? full.oldPrice)) : null;
    const model = (full && full.model) ? full.model : "";
    const brand = item.brand || (full && full.brand) || "";
    const tag = full && full.tag ? full.tag : (oldPrice ? "ПРОМО" : "");

    const lineTotal = item.price * item.quantity;
    const priceCell = oldPrice
      ? `<span class="ck-cart-oldp">${formatPrice(oldPrice)}</span><span class="ck-cart-newp">${formatPrice(item.price)}</span>`
      : `<span class="ck-cart-newp">${formatPrice(item.price)}</span>`;

    const row = document.createElement("div");
    row.className = "ck-cart-row";
    row.innerHTML = `
      <div class="ck-cart-prod">
        <div class="ck-cart-thumb"><img src="${getProductImageUrl(item.image, item.name, model)}" alt="${item.name}" onerror="this.src='/assets/logo.webp'"></div>
        <div class="ck-cart-prod-info">
          <span class="ck-cart-avail"><i class="fas fa-circle-check"></i> Наличен</span>
          <h4>${item.name}</h4>
          ${model ? `<span class="ck-cart-prod-sub">${model}</span>` : ""}
          ${brand ? `<span class="ck-cart-prod-meta">Марка: ${brand}</span>` : ""}
        </div>
      </div>
      <div class="ck-cart-price" data-label="Цена">${priceCell}</div>
      <div class="ck-cart-qty" data-label="Количество">
        <div class="ck-cart-qty-box">
          <button onclick="updateCartPageQty('${id}', ${item.quantity - 1})" aria-label="Намали">−</button>
          <span>${item.quantity}</span>
          <button onclick="updateCartPageQty('${id}', ${item.quantity + 1})" aria-label="Увеличи">+</button>
        </div>
      </div>
      <div class="ck-cart-line" data-label="Общо">${formatPrice(lineTotal)}</div>
      <div class="ck-cart-del">
        <button onclick="removeFromCartPage('${id}')" title="Премахни" aria-label="Премахни">
          <i class="fas fa-trash-can"></i>
        </button>
      </div>`;
    rowsEl.appendChild(row);
  });

  // Foot count/total
  const cntEl = document.getElementById("ck-cart-count");
  const footTotalEl = document.getElementById("ck-cart-foot-total");
  const totalUnits = items.reduce((n, it) => n + it.quantity, 0);
  if (cntEl) cntEl.textContent = `${items.length} ${items.length === 1 ? "продукт" : "продукта"}`;
  if (footTotalEl) footTotalEl.textContent = formatPrice(subtotal);

  // Shipping calc (reuse promo logic, NO VAT)
  const clientType = currentUser ? currentUser.clientType : "B2C";
  const activePromos = PROMOTIONS.filter(p => p.clientType === clientType && p.active);
  const shippingPromo = activePromos.find(p => p.type === "free_shipping");
  let shippingCost = 2.50;
  let isFreeShip = false;
  if (shippingPromo && subtotal >= shippingPromo.threshold) { shippingCost = 0.00; isFreeShip = true; }
  if (items.length === 0) shippingCost = 0.00;

  const sumProductsEl = document.getElementById("ck-cart-sum-products");
  const sumShippingEl = document.getElementById("ck-cart-sum-shipping");
  const sumTotalEl = document.getElementById("ck-cart-sum-total");
  if (sumProductsEl) sumProductsEl.textContent = formatPrice(subtotal);
  if (sumShippingEl) {
    if (isFreeShip) {
      sumShippingEl.innerHTML = `<span style="color: var(--success, #2ecc71); font-weight:700;">Безплатна</span>`;
    } else {
      sumShippingEl.textContent = formatPrice(shippingCost);
    }
  }
  if (sumTotalEl) sumTotalEl.textContent = formatPrice(subtotal + shippingCost);

  // Free-shipping progress card
  const shipCard = document.getElementById("ck-cart-ship-card");
  if (shipCard && shippingPromo && items.length > 0) {
    const threshold = shippingPromo.threshold;
    const textEl = document.getElementById("ck-cart-ship-text");
    const fillEl = document.getElementById("ck-cart-ship-fill");
    const numsEl = document.getElementById("ck-cart-ship-nums");
    const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
    if (fillEl) fillEl.style.width = pct + "%";
    if (isFreeShip) {
      if (textEl) textEl.textContent = "Имате безплатна доставка! 🎉";
    } else {
      const diff = threshold - subtotal;
      if (textEl) textEl.textContent = `Още ${formatPrice(diff)} до безплатна доставка!`;
    }
    if (numsEl) numsEl.textContent = `${formatPrice(subtotal)} / ${formatPrice(threshold)}`;
    shipCard.style.display = "block";
  } else if (shipCard) {
    shipCard.style.display = "none";
  }

  // Recommended products (real products, exclude items already in cart)
  const reco = document.getElementById("ck-cart-reco");
  const recoGrid = document.getElementById("ck-cart-reco-grid");
  if (reco && recoGrid) {
    const inCart = new Set(items.map(it => it.id || it._id));
    const recs = pool.filter(x => !inCart.has(x._id)).slice(0, 5);
    if (recs.length === 0) {
      reco.style.display = "none";
    } else {
      recoGrid.innerHTML = "";
      recs.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.style.cursor = "pointer";
        card.onclick = (e) => {
          if (e.target.classList.contains("btn-card-buy") || e.target.closest(".btn-card-buy")) return;
          const slug = getProductSlug(product.name + " " + (product.model || ""));
          history.pushState(null, "", "/produkt/" + slug);
          handleRouting();
          window.scrollTo({ top: 0, behavior: "smooth" });
        };
        const tagHtml = product.tag ? `<span class="badge-tag sale">${product.tag}</span>` : "";
        const isB2B = currentUser && currentUser.clientType === "B2B";
        const price = isB2B ? (product.priceB2B ?? product.price) : (product.priceB2C ?? product.price);
        const oldPrice = isB2B ? product.oldPriceB2B : (product.oldPriceB2C ?? product.oldPrice);
        const priceHtml = oldPrice
          ? `<span class="product-price old-price">${formatPrice(oldPrice)}</span>
             <span class="product-price" style="color: var(--accent);">${formatPrice(price)}</span>`
          : `<span class="product-price">${formatPrice(price)}</span>`;
        card.innerHTML = `
          ${tagHtml}
          <div class="product-image-container">
            <img class="product-img" src="${getProductImageUrl(product.image, product.name, product.model)}" alt="${product.name}" loading="lazy" onerror="this.src='/assets/logo.webp'">
          </div>
          <div class="product-info">
            <span class="product-category">${product.brand}</span>
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price-box">${priceHtml}</div>
            <button class="btn-card-buy" onclick="addToCart('${product._id}', 1, event)">Добави в количката</button>
          </div>`;
        recoGrid.appendChild(card);
      });
      reco.style.display = "block";
    }
  }
}

// --- CHECKOUT FUNNEL ---
window.proceedToCheckout = function() {
  const regularItems = cart.filter(item => !item.isGift);
  let subtotal = 0;
  regularItems.forEach(item => {
    subtotal += item.price * item.quantity;
  });
  
  const clientType = currentUser ? currentUser.clientType : "B2C";
  const minThreshold = clientType === "B2B" ? 29.99 : 9.99;
  if (subtotal < minThreshold) {
    alert(`Минималната сума за поръчка е €${minThreshold.toFixed(2)}.`);
    return;
  }
  
  const activePromos = PROMOTIONS.filter(p => p.clientType === clientType && p.active);
  const shippingPromo = activePromos.find(p => p.type === "free_shipping");
  
  if (shippingPromo && subtotal < shippingPromo.threshold && subtotal > 0) {
    const diff = shippingPromo.threshold - subtotal;
    const upsellMsg = document.getElementById("shipping-upsell-message");
    if (upsellMsg) {
      upsellMsg.innerHTML = `Остават ви още само **${formatPrice(diff)}** за безплатна доставка!`;
    }
    const upsellModal = document.getElementById("shipping-upsell-modal");
    if (upsellModal) {
      upsellModal.style.display = "flex";
      setTimeout(() => {
        upsellModal.classList.add("active");
      }, 10);
    }
  } else {
    closeCartSidebar();
    window.location.hash = "#checkout";
  }
};

window.closeShippingUpsell = function(addMore) {
  const upsellModal = document.getElementById("shipping-upsell-modal");
  if (upsellModal) {
    upsellModal.classList.remove("active");
    setTimeout(() => {
      upsellModal.style.display = "none";
    }, 300);
  }
  
  if (!addMore) {
    closeCartSidebar();
    window.location.hash = "#checkout";
  }
};

window.switchCheckoutType = function(type) {
  activeCheckoutType = type;
  const btnB2C = document.getElementById("btn-checkout-b2c");
  const btnB2B = document.getElementById("btn-checkout-b2b");
  const b2bFields = document.getElementById("checkout-b2b-fields");
  
  if (type === "B2B") {
    btnB2B.classList.add("active");
    btnB2C.classList.remove("active");
    b2bFields.style.display = "block";
    
    // Mark B2B inputs required
    document.getElementById("checkout-comp-name").required = true;
    document.getElementById("checkout-comp-bulstat").required = true;
    document.getElementById("checkout-comp-address").required = true;
    document.getElementById("checkout-comp-mol").required = true;
  } else {
    btnB2C.classList.add("active");
    btnB2B.classList.remove("active");
    b2bFields.style.display = "none";
    
    // Remove B2B required state
    document.getElementById("checkout-comp-name").required = false;
    document.getElementById("checkout-comp-bulstat").required = false;
    document.getElementById("checkout-comp-address").required = false;
    document.getElementById("checkout-comp-mol").required = false;
  }
  
  renderCheckoutSummary();
};

window.toggleCheckoutVatCheckbox = function() {
  const cb = document.getElementById("checkout-comp-vat");
  cb.checked = !cb.checked;
};

async function renderCheckoutSummary() {
  const container = document.getElementById("checkout-summary-items");
  const subtotalEl = document.getElementById("checkout-sum-subtotal");
  const shippingEl = document.getElementById("checkout-sum-shipping");
  const totalEl = document.getElementById("checkout-sum-total");
  
  if (!container) return;
  container.innerHTML = "";
  
  // Recalculate subtotal using non-gift items
  let subtotal = 0;
  cart.forEach(item => {
    if (!item.isGift) subtotal += item.price * item.quantity;
  });
  
  // Calculate promotions
  const clientType = activeCheckoutType;
  const activePromos = PROMOTIONS.filter(p => p.clientType === clientType && p.active);
  
  // Shipping cost promo calculation
  const shippingPromo = activePromos.find(p => p.type === "free_shipping");
  let shippingCost = 2.50;
  if (shippingPromo && subtotal >= shippingPromo.threshold) {
    shippingCost = 0.00;
  }
  
  // Filter cart to inject the correct gift if thresholds differ
  cart = cart.filter(item => !item.isGift);
  const giftPromo = activePromos.find(p => p.type === "gift");
  if (giftPromo && giftPromo.giftProductId && subtotal >= giftPromo.threshold) {
    const giftProduct = await getProductById(giftPromo.giftProductId);
    if (giftProduct) {
      cart.push({
        id: giftProduct._id,
        name: giftProduct.name + " (ПОДАРЪК)",
        image: giftProduct.image,
        price: 0.00,
        quantity: 1,
        isGift: true
      });
    }
  }

  cart.forEach(item => {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.justifyContent = "space-between";
    div.style.marginBottom = "0.5rem";
    div.style.fontSize = "0.9rem";
    div.innerHTML = `
      <span style="color: var(--text-muted);">${item.name} x ${item.quantity}</span>
      <span style="color: #fff; font-weight:500;">${item.price === 0 ? "Подарък" : formatPrice(item.price * item.quantity)}</span>
    `;
    container.appendChild(div);
  });
  
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === "percent") {
      discountAmount = subtotal * (appliedPromo.discountValue / 100);
    } else {
      discountAmount = Math.min(subtotal, appliedPromo.discountValue);
    }
  }

  const discountRow = document.getElementById("checkout-sum-discount-row");
  const discountEl = document.getElementById("checkout-sum-discount");
  if (discountRow && discountEl) {
    if (discountAmount > 0) {
      discountEl.textContent = `-${formatPrice(discountAmount)}`;
      discountRow.style.display = "flex";
    } else {
      discountRow.style.display = "none";
    }
  }
  
  // ДДС не се начислява – цените са крайни. (VAT removed per request)
  const total = subtotal + shippingCost - discountAmount;
  
  subtotalEl.textContent = formatPrice(subtotal);
  shippingEl.textContent = shippingCost === 0 ? "Безплатна" : formatPrice(shippingCost);
  
  totalEl.textContent = formatPrice(total);

  // Minimum order value validation for checkout page
  const minThreshold = activeCheckoutType === "B2B" ? 29.99 : 9.99;
  const minOrderWarning = document.getElementById("checkout-min-order-warning");
  const submitBtn = document.getElementById("checkout-submit-btn");
  if (minOrderWarning) {
    if (subtotal > 0 && subtotal < minThreshold) {
      minOrderWarning.innerHTML = `Стойността на поръчката Ви е под минималните €${minThreshold.toFixed(2)}. Работим с минимални маржове, за да Ви осигурим възможно най-ниските цени на пазара. За да можем да обработим и доставим пратката Ви, е необходимо общата сума да бъде поне €${minThreshold.toFixed(2)}. Ценим Вашия избор!`;
      minOrderWarning.style.display = "block";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.5";
        submitBtn.style.cursor = "not-allowed";
      }
    } else {
      minOrderWarning.style.display = "none";
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
        submitBtn.style.cursor = "pointer";
      }
    }
  }
}

window.submitCheckout = async function(event) {
  event.preventDefault();
  
  const name = document.getElementById("checkout-main-name").value.trim();
  const phone = document.getElementById("checkout-main-phone").value.trim();
  const address = document.getElementById("checkout-main-address").value.trim();
  
  if (!name || !phone || !address) {
    alert("Моля попълнете всички задължителни полета!");
    return;
  }

  const gdprConsent = document.getElementById("checkout-gdpr-consent");
  if (gdprConsent && !gdprConsent.checked) {
    alert("Моля, съгласете се с Условията за ползване и Политиката за поверителност, за да завършите поръчката!");
    return;
  }
  
  // Calculate subtotal and validate minimum order value
  let subtotal = 0;
  cart.forEach(item => {
    if (!item.isGift) subtotal += item.price * item.quantity;
  });

  const clientType = activeCheckoutType;
  const minThreshold = clientType === "B2B" ? 29.99 : 9.99;
  if (subtotal < minThreshold) {
    alert(`Стойността на поръчката Ви е под минималните €${minThreshold.toFixed(2)}. Работим с минимални маржове, за да Ви осигурим възможно най-ниските цени на пазара. За да можем да обработим и доставим пратката Ви, е необходимо общата сума да бъде поне €${minThreshold.toFixed(2)}.`);
    return;
  }
  
  // Prepare items payload
  const orderItems = cart.map(item => ({
    id: item.id || item._id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    isGift: item.isGift || false,
    image: item.image || "",
    productSlug: item.productSlug || "",
    productUrl: item.productUrl || (item.productSlug ? `/produkt/${item.productSlug}` : "")
  }));
  
  // Calculate total (reusing subtotal and clientType from above)
  const activePromos = PROMOTIONS.filter(p => p.clientType === clientType && p.active);
  const shippingPromo = activePromos.find(p => p.type === "free_shipping");
  let shippingCost = 2.50;
  if (shippingPromo && subtotal >= shippingPromo.threshold) {
    shippingCost = 0.00;
  }
  
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === "percent") {
      discountAmount = subtotal * (appliedPromo.discountValue / 100);
    } else {
      discountAmount = Math.min(subtotal, appliedPromo.discountValue);
    }
  }
  
  // ДДС не се начислява – цените са крайни. (VAT removed per request)
  const vatAmount = 0;
  const totalWithoutVat = subtotal + shippingCost - discountAmount;
  const total = totalWithoutVat;
  const orderNum = "CK-" + Math.floor(100000 + Math.random() * 900000);
  
  const orderPayload = {
    orderNumber: orderNum,
    name,
    phone,
    address,
    items: orderItems,
    subtotal,
    shippingCost,
    totalWithoutVat,
    vatAmount,
    total,
    clientType,
  };
  
  if (appliedPromo) {
    orderPayload.promoCode = appliedPromo.code;
    orderPayload.discountAmount = discountAmount;
  }
  
  if (clientType === "B2B") {
    orderPayload.companyName = document.getElementById("checkout-comp-name").value.trim();
    orderPayload.companyBulstat = document.getElementById("checkout-comp-bulstat").value.trim();
  }
  
  try {
    await convex.mutation("orders:create", orderPayload);
    
    // Show success details
    document.getElementById("order-tracking-id").textContent = orderNum;
    document.getElementById("success-screen").classList.add("active");
    
    // Reset cart & applied promo code
    cart = [];
    saveCart();
    appliedPromo = null;
    const promoInput = document.getElementById("checkout-promo-input");
    const promoMsg = document.getElementById("checkout-promo-msg");
    if (promoInput) promoInput.value = "";
    if (promoMsg) {
      promoMsg.textContent = "";
      promoMsg.style.display = "none";
    }
    
    // Redirect to home
    history.pushState("", document.title, window.location.pathname + window.location.search);
    handleRouting();
  } catch (err) {
    alert("Грешка при изпращане на поръчката: " + err.message);
  }
};

window.closeSuccessScreen = function() {
  document.getElementById("success-screen").classList.remove("active");
  document.getElementById("checkout-form-main").reset();
  history.pushState("", document.title, window.location.pathname + window.location.search);
  handleRouting();
};

// --- AUTH / PROFILE PORTAL ---
window.openAuthModal = function() {
  const modal = document.getElementById("auth-modal");
  modal.style.display = "flex";
  setTimeout(() => {
    modal.classList.add("active");
  }, 10);
  
  if (currentUser) {
    toggleAuthPanel("profile");
    
    document.getElementById("profile-display-name").textContent = currentUser.name;
    document.getElementById("profile-display-email").textContent = currentUser.email;
    document.getElementById("profile-display-type").textContent = currentUser.clientType === "B2B" ? "Фирмен (B2B)" : "Физически (B2C)";
    
    const compBox = document.getElementById("profile-display-comp-box");
    if (currentUser.clientType === "B2B" && currentUser.companyDetails) {
      document.getElementById("profile-display-comp-name").textContent = currentUser.companyDetails.name;
      document.getElementById("profile-display-comp-bulstat").textContent = currentUser.companyDetails.bulstat;
      compBox.style.display = "block";
    } else {
      compBox.style.display = "none";
    }
  } else {
    toggleAuthPanel("login");
    initGoogleLoginButton();
  }
};

window.closeAuthModal = function() {
  const modal = document.getElementById("auth-modal");
  modal.classList.remove("active");
  setTimeout(() => {
    modal.style.display = "none";
  }, 400);
  
  // Reset Google login temporary state and form inputs
  googleRegisterTemp = null;
  const regEmail = document.getElementById("reg-email");
  if (regEmail) regEmail.disabled = false;
  const regPassGroup = document.getElementById("reg-pass-group");
  if (regPassGroup) regPassGroup.style.display = "block";
  const regPass = document.getElementById("reg-pass");
  if (regPass) regPass.required = true;
  
  const regForm = document.getElementById("reg-form");
  if (regForm) regForm.reset();
};

window.toggleAuthPanel = function(panel) {
  document.getElementById("auth-login-panel").style.display = panel === "login" ? "block" : "none";
  document.getElementById("auth-register-panel").style.display = panel === "register" ? "block" : "none";
  document.getElementById("auth-profile-panel").style.display = panel === "profile" ? "block" : "none";
  
  if (panel === "login" || (panel === "register" && !googleRegisterTemp)) {
    // Reset Google registration state
    googleRegisterTemp = null;
    const regEmail = document.getElementById("reg-email");
    if (regEmail) {
      regEmail.disabled = false;
      regEmail.value = "";
    }
    const regPassGroup = document.getElementById("reg-pass-group");
    if (regPassGroup) regPassGroup.style.display = "block";
    const regPass = document.getElementById("reg-pass");
    if (regPass) {
      regPass.required = true;
      regPass.value = "";
    }
  }
};

window.switchRegType = function(type) {
  activeRegType = type;
  const btnB2C = document.getElementById("btn-reg-b2c");
  const btnB2B = document.getElementById("btn-reg-b2b");
  const b2bFields = document.getElementById("reg-b2b-fields");
  
  if (type === "B2B") {
    btnB2B.classList.add("active");
    btnB2C.classList.remove("active");
    b2bFields.style.display = "block";
    
    document.getElementById("reg-comp-name").required = true;
    document.getElementById("reg-comp-bulstat").required = true;
    document.getElementById("reg-comp-address").required = true;
    document.getElementById("reg-comp-mol").required = true;
  } else {
    btnB2C.classList.add("active");
    btnB2B.classList.remove("active");
    b2bFields.style.display = "none";
    
    document.getElementById("reg-comp-name").required = false;
    document.getElementById("reg-comp-bulstat").required = false;
    document.getElementById("reg-comp-address").required = false;
    document.getElementById("reg-comp-mol").required = false;
  }
};

window.toggleRegVatCheckbox = function() {
  const cb = document.getElementById("reg-comp-vat");
  cb.checked = !cb.checked;
};

// --- CUSTOM REGISTER & LOGIN HANDLERS ---
window.handleUserRegister = async function(event) {
  event.preventDefault();
  
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-pass").value;
  const name = document.getElementById("reg-name").value.trim();
  const phone = document.getElementById("reg-phone").value.trim();
  const address = document.getElementById("reg-address").value.trim();
  
  if (!googleRegisterTemp && !password) {
    alert("Моля, въведете парола!");
    return;
  }
  
  const regPayload = {
    email,
    password: password || null,
    clientType: activeRegType,
    name,
    phone,
    address,
  };
  
  if (activeRegType === "B2B") {
    regPayload.companyDetails = {
      name: document.getElementById("reg-comp-name").value.trim(),
      bulstat: document.getElementById("reg-comp-bulstat").value.trim(),
      address: document.getElementById("reg-comp-address").value.trim(),
      mol: document.getElementById("reg-comp-mol").value.trim(),
      vatRegistered: document.getElementById("reg-comp-vat").checked
    };
  }
  
  try {
    const { password: submittedPassword, email: submittedEmail, ...registration } = regPayload;
    const res = googleRegisterTemp
      ? await convex.action("authActions:googleLogin", { credential: googleRegisterTemp.credential, registration })
      : await convex.action("authActions:register", { ...registration, email: submittedEmail, password: submittedPassword });
    if (res.success) {
      localStorage.setItem("caseking_session_token", res.sessionToken);
      await verifySession();
      
      googleRegisterTemp = null;
      updateUserUIState();
      closeAuthModal();
      alert("Успешна регистрация!");
    }
  } catch (err) {
    alert("Грешка при регистрация: " + err.message);
  }
};

window.handleUserLogin = async function(event) {
  event.preventDefault();
  
  const email = document.getElementById("auth-login-email").value.trim();
  const password = document.getElementById("auth-login-pass").value;
  
  try {
    const res = await convex.action("authActions:login", { email, password });
    if (res.success) {
      localStorage.setItem("caseking_session_token", res.sessionToken);
      await verifySession();
      closeAuthModal();
    }
  } catch (err) {
    alert("Грешка при вход: " + err.message);
  }
};

window.handleUserLogout = async function() {
  const token = localStorage.getItem("caseking_session_token");
  if (token) {
    try {
      await convex.mutation("users:logout", { sessionToken: token });
    } catch (err) {
      console.error(err);
    }
  }
  
  currentUser = null;
  localStorage.removeItem("caseking_session_token");
  
  // Clear profile inputs
  document.getElementById("reg-form").reset();
  
  updateUserUIState();
  closeAuthModal();
  alert("Успешно излязохте от профила си!");
};

function updateUserUIState() {
  const pBtn = document.getElementById("header-profile-btn");
  const nameSpan = document.getElementById("header-user-name");
  
  if (currentUser) {
    pBtn.innerHTML = `<i class="fas fa-user-check" style="color:var(--gold);"></i>`;
    nameSpan.textContent = currentUser.name.split(" ")[0];
    nameSpan.style.display = "inline";
    
    // Auto-populate checkout details
    document.getElementById("checkout-main-name").value = currentUser.name;
    document.getElementById("checkout-main-phone").value = currentUser.phone;
    document.getElementById("checkout-main-address").value = currentUser.address;
    
    if (currentUser.clientType === "B2B") {
      switchCheckoutType("B2B");
      if (currentUser.companyDetails) {
        document.getElementById("checkout-comp-name").value = currentUser.companyDetails.name;
        document.getElementById("checkout-comp-bulstat").value = currentUser.companyDetails.bulstat;
        document.getElementById("checkout-comp-address").value = currentUser.companyDetails.address;
        document.getElementById("checkout-comp-mol").value = currentUser.companyDetails.mol;
        document.getElementById("checkout-comp-vat").checked = currentUser.companyDetails.vatRegistered;
      }
    } else {
      switchCheckoutType("B2C");
    }
  } else {
    pBtn.innerHTML = `<i class="fas fa-user"></i>`;
    nameSpan.style.display = "none";
    
    // Reset checkout form fields
    document.getElementById("checkout-form-main").reset();
    switchCheckoutType("B2C");
  }
  
  // Redraw catalog to update prices (B2B vs B2C)
  renderCatalog();
  saveCart(); // triggers cart items re-render with updated promo limits
}

// --- GOOGLE SIGN-IN HANDLER ---
function initGoogleLoginButton() {
  if (typeof google === "undefined" || !google.accounts) {
    // Retry in 500ms if SDK not loaded
    setTimeout(initGoogleLoginButton, 500);
    return;
  }
  
  google.accounts.id.initialize({
    client_id: "70942273013-gfa27k4l90vr567srhdg978l7oip6jst.apps.googleusercontent.com",
    callback: handleGoogleCredentialResponse
  });
  
  google.accounts.id.renderButton(
    document.getElementById("google-login-btn-container"),
    { theme: "outline", size: "large", text: "signin_with" }
  );
}

// Google claims are accepted only after server-side signature/claim verification.
async function handleGoogleCredentialResponse(response) {
  const credential = response.credential;
  try {
    const res = await convex.action("authActions:googleLogin", { credential });
    if (res.success) {
      localStorage.setItem("caseking_session_token", res.sessionToken);
      await verifySession();
      closeAuthModal();
    } else if (res.needsRegistration) {
      googleRegisterTemp = { credential };
      toggleAuthPanel("register");
      document.getElementById("reg-email").value = res.email;
      document.getElementById("reg-email").disabled = true;
      document.getElementById("reg-name").value = res.name;
      document.getElementById("reg-pass-group").style.display = "none";
      document.getElementById("reg-pass").required = false;
      alert("Моля, попълнете вашия телефон и адрес за доставка, за да довършите профила си!");
    }
  } catch (err) {
    googleRegisterTemp = null;
    alert("Грешка при вход с Google: " + err.message);
  }
}

window.goToHome = function() {
  selectedBrand = null;
  selectedModel = null;
  selectedCategory = null;
  
  const input = document.getElementById("smart-search-input");
  if (input) {
    input.value = "";
  }
  searchQuery = "";
  const clearBtn = document.getElementById("search-clear-btn");
  if (clearBtn) {
    clearBtn.style.display = "none";
  }
  const box = document.getElementById("search-suggestions");
  if (box) {
    box.style.display = "none";
  }
  
  // Clear active classes in filters
  document.querySelectorAll(".brand-card").forEach(c => c.classList.remove("active"));
  document.querySelectorAll(".category-card").forEach(c => c.classList.remove("active"));
  document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
  
  // Reset Step 2 model list
  const modelsContainer = document.getElementById("models-list");
  if (modelsContainer) {
    modelsContainer.innerHTML = "";
    modelsContainer.style.display = "none";
  }
  const step2Title = document.getElementById("step2-title");
  if (step2Title) step2Title.style.display = "none";
  
  // Reset catalog title
  const catalogTitle = document.getElementById("catalog-main-title");
  if (catalogTitle) catalogTitle.textContent = "Препоръчани продукти";
  
  history.pushState(null, "", "/");
  handleRouting();
  
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 100);
};

function updateSEO(pageKey, dynamicTitle = null, dynamicDesc = null) {
  let title = dynamicTitle;
  let description = dynamicDesc;
  
  if (!title || !description) {
    const pageData = pageSeoMetadata.find(m => m.pageKey === pageKey);
    if (pageData) {
      if (!title) title = pageData.title;
      if (!description) description = pageData.description;
    }
  }
  
  // Set fallback defaults if still not found
  if (!title) {
    if (pageKey === "home") title = "CaseKing - Избери Марка и Модел за Телефон | Кейсове и Аксесоари";
    else if (pageKey === "za-nas") title = "За нас | CaseKing";
    else if (pageKey === "kontakti") title = "Контакти | CaseKing";
    else if (pageKey === "aksesoari") title = "Категории Аксесоари | CaseKing";
    else title = "CaseKing";
  }
  
  if (!description) {
    if (pageKey === "home") description = "Добре дошли в CaseKing - най-големият избор на премиум кейсове, протектори и аксесоари за мобилни телефони. Изберете марка, модел и поръчайте с доставка за 3-4 работни дни и преглед!";
    else if (pageKey === "za-nas") description = "Научете повече за CaseKing, нашата визия и мисията ни да осигурим безкомпромисно качество и доставка за 3-4 работни дни на премиум телефонни аксесоари.";
    else if (pageKey === "kontakti") description = "Свържете се с CaseKing. Изпратете ни запитване през нашата контактна форма или се обадете на 0878 202 823 за консултация.";
    else if (pageKey === "aksesoari") description = "Разгледайте нашите категории аксесоари за мобилни телефони - кейсове, калъфи, стъклени протектори, зарядни устройства и много други.";
    else description = "Най-добрите аксесоари за мобилни телефони на едно място. Професионално обслужване, качество и доставка за 3-4 работни дни с опция за преглед.";
  }
  
  // Apply to DOM
  document.title = title;
  
  let descMeta = document.querySelector('meta[name="description"]');
  if (!descMeta) {
    descMeta = document.createElement('meta');
    descMeta.name = "description";
    document.head.appendChild(descMeta);
  }
  descMeta.content = description;
  
  // Apply to OpenGraph for social shares
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.content = title;
  
  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.content = description;
}

// --- CLIENT-SIDE ROUTER ---
async function handleRouting() {
  let path = window.location.pathname;
  let hash = window.location.hash;
  
  // Legacy /category redirect support
  if (path === "/category") {
    history.replaceState(null, "", "/aksesoari");
    path = "/aksesoari";
  } else if (path.startsWith("/category/")) {
    const legacySlug = path.substring("/category/".length);
    const mapping = {
      "cases": "keysove-i-kalufi",
      "protectors": "protektori-za-ekran",
      "car_acc": "aksesoari-za-avtomobili",
      "wireless_chargers": "bezzhichni-zaryadni",
      "all_chargers": "zaryadni-ustroystva",
      "original_cables": "kabeli-za-zaryadane",
      "desk_holder": "postavki-za-byuro",
      "selfie_stick": "selfi-stikove",
      "pop_socket": "popsoket-i-vrazki",
      "power_banks": "vanshni-baterii"
    };
    const newSlug = mapping[legacySlug] || legacySlug;
    history.replaceState(null, "", "/" + newSlug);
    path = "/" + newSlug;
  }

  // Normalize path if we clicked a root link or hash link (e.g. #catalog, #checkout) from a /produkt/, /aksesoari/, or a flat category page
  const categoryIds = CATEGORIES.map(c => c.id);
  const isCategoryDetailPath = categoryIds.includes(path.substring(1));
  const isSpecialPath = path.startsWith("/produkt/") || isCategoryDetailPath || path === "/aksesoari";
  if (isSpecialPath && (hash === "#checkout" || hash === "#catalog" || hash === "#footer" || hash === "#")) {
    history.replaceState(null, "", "/" + hash);
    path = window.location.pathname;
    hash = window.location.hash;
  }
  
  const homeView = document.getElementById("storefront-home-view");
  const productView = document.getElementById("product-page-view");
  const checkoutView = document.getElementById("checkout-page-view");
  const categoriesListView = document.getElementById("categories-page-view");
  const categoryDetailView = document.getElementById("category-detail-view");
  const privacyView = document.getElementById("privacy-page-view");
  const termsView = document.getElementById("terms-page-view");
  const zaNasView = document.getElementById("za-nas-page-view");
  const kontaktiView = document.getElementById("kontakti-page-view");
  const cartPageView = document.getElementById("cart-page-view");
  if (!homeView || !productView || !checkoutView || !categoriesListView || !categoryDetailView) return;

  if (privacyView) privacyView.style.display = "none";
  if (termsView) termsView.style.display = "none";
  if (zaNasView) zaNasView.style.display = "none";
  if (kontaktiView) kontaktiView.style.display = "none";
  if (cartPageView) cartPageView.style.display = "none";

  // Full-page cart view (takes priority over product/category lookups)
  if (hash === "#cart") {
    homeView.style.display = "none";
    productView.style.display = "none";
    checkoutView.style.display = "none";
    categoriesListView.style.display = "none";
    categoryDetailView.style.display = "none";
    if (cartPageView) cartPageView.style.display = "block";
    renderCartPage();
    window.scrollTo(0, 0);
    updateSEO(null, "Количка | CaseKing", "Вашата пазарска количка в CaseKing. Прегледайте продуктите и завършете поръчката си.");
    return;
  }
  
  // Check if the route is a product detail path
  let product = null;
  if (path.startsWith("/produkt/")) {
    const slug = path.substring("/produkt/".length);
    try {
      product = await convex.query("products:getBySlug", { slug });
      if (product) cacheProducts([product]);
    } catch (err) {
      console.error("Could not look up product by slug:", err);
    }
    if (!product) {
      // Clean up invalid product URL
      history.replaceState(null, "", "/");
      path = "/";
    }
  }
  
  // Check if route is a flat category slug
  let activeCategoryDetailId = null;
  const pathSlug = path.substring(1);
  const category = CATEGORIES.find(c => c.id === pathSlug);
  if (category) {
    activeCategoryDetailId = category.id;
  } else if (isDataLoaded && path !== "/" && path !== "/aksesoari" && !path.startsWith("/produkt/") && path !== "/privacy" && path !== "/terms" && path !== "/za-nas" && path !== "/kontakti" && path !== "/blog") {
    // If route doesn't match any valid pages, redirect to home
    history.replaceState(null, "", "/");
    path = "/";
  }
  
  if (!activeCategoryDetailId) {
    categoryDetailSelectedBrand = null;
    categoryDetailSelectedModel = null;
  }
  
  if (product) {
    // Show Product Details View
    homeView.style.display = "none";
    checkoutView.style.display = "none";
    productView.style.display = "block";
    categoriesListView.style.display = "none";
    categoryDetailView.style.display = "none";
    
    renderProductPage(product);
    window.scrollTo(0, 0);
    updateSEO(null, product.name + " " + (product.model || ""), product.description);
  } else if (hash === "#checkout") {
    // Show Checkout funnel
    homeView.style.display = "none";
    productView.style.display = "none";
    checkoutView.style.display = "block";
    categoriesListView.style.display = "none";
    categoryDetailView.style.display = "none";
    
    renderCheckoutSummary();
    window.scrollTo(0, 0);
    updateSEO(null, "Количка | CaseKing", "Вашата пазарска количка в CaseKing. Прегледайте продуктите и завършете поръчката си бързо и сигурно.");
  } else if (path === "/aksesoari") {
    // Show Categories List View
    homeView.style.display = "none";
    productView.style.display = "none";
    checkoutView.style.display = "none";
    categoriesListView.style.display = "block";
    categoryDetailView.style.display = "none";
    
    renderCategoriesListPage();
    updateSEO("aksesoari");
    
    // Scroll down to the categories grid smoothly
    setTimeout(() => {
      const gridEl = document.getElementById("categories-list-page-grid");
      if (gridEl) {
        gridEl.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo(0, 0);
      }
    }, 200);
  } else if (activeCategoryDetailId) {
    // Show Category Detail View
    homeView.style.display = "none";
    productView.style.display = "none";
    checkoutView.style.display = "none";
    categoriesListView.style.display = "none";
    categoryDetailView.style.display = "block";
    
    renderCategoryDetailPage(activeCategoryDetailId);
    window.scrollTo(0, 0);
  } else if (path === "/privacy") {
    // Show Privacy Policy
    homeView.style.display = "none";
    productView.style.display = "none";
    checkoutView.style.display = "none";
    categoriesListView.style.display = "none";
    categoryDetailView.style.display = "none";
    if (privacyView) privacyView.style.display = "block";
    window.scrollTo(0, 0);
    updateSEO(null, "Политика за поверителност | CaseKing", "Политика за поверителност и защита на личните данни съгласно изискванията на GDPR в онлайн магазин CaseKing.");
  } else if (path === "/terms") {
    // Show Terms of Use
    homeView.style.display = "none";
    productView.style.display = "none";
    checkoutView.style.display = "none";
    categoriesListView.style.display = "none";
    categoryDetailView.style.display = "none";
    if (termsView) termsView.style.display = "block";
    window.scrollTo(0, 0);
    updateSEO(null, "Условия за ползване | CaseKing", "Общи условия за ползване, доставка, плащане и право на връщане на продукти в онлайн магазин CaseKing.");
  } else if (path === "/za-nas") {
    // Show About Us page
    homeView.style.display = "none";
    productView.style.display = "none";
    checkoutView.style.display = "none";
    categoriesListView.style.display = "none";
    categoryDetailView.style.display = "none";
    if (zaNasView) zaNasView.style.display = "block";
    window.scrollTo(0, 0);
    updateSEO("za-nas");
  } else if (path === "/kontakti") {
    // Show Contacts page
    homeView.style.display = "none";
    productView.style.display = "none";
    checkoutView.style.display = "none";
    categoriesListView.style.display = "none";
    categoryDetailView.style.display = "none";
    if (kontaktiView) kontaktiView.style.display = "block";
    window.scrollTo(0, 0);
    updateSEO("kontakti");
  } else {
    // Show Standard Home/Catalog view
    productView.style.display = "none";
    checkoutView.style.display = "none";
    categoriesListView.style.display = "none";
    categoryDetailView.style.display = "none";
    homeView.style.display = "block";
    
    renderCatalog();
    updateSEO("home");
  }
}

window.backToCatalog = function() {
  history.pushState("", document.title, "/" + window.location.search);
  handleRouting();
};

function renderCategoriesListPage() {
  const container = document.getElementById("categories-list-page-grid");
  if (!container) return;
  container.innerHTML = "";
  
  CATEGORIES.forEach(cat => {
    const card = document.createElement("div");
    card.className = "category-card";
    card.style.cursor = "pointer";
    card.onclick = () => {
      history.pushState(null, "", "/" + cat.id);
      handleRouting();
    };
    
    // Кеширан брой продукти (виж meta:countProductsByCategory) - не
    // изисква сваляне на целия каталог само за да преброим една плочка.
    const count = cat.productCount || 0;
    const countText = count === 1 ? "1 продукт" : `${count} продукта`;
    
    card.innerHTML = `
      <img src="${getCategoryImage(cat)}" alt="${cat.name}" class="category-card-img" loading="lazy">
      <div class="category-card-overlay">
        <div class="category-card-info">
          <span class="category-card-title">${cat.name}</span>
          <span class="category-card-count" style="display: block; font-size: 0.85rem; color: var(--gold); margin-top: 0.35rem; font-weight: 500; opacity: 0.9;">${countText}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderCategoryDetailBrands(catId) {
  const container = document.getElementById("cat-detail-brands-list");
  if (!container) return;
  container.innerHTML = "";
  
  const accessoryMode = isAccessoryCategory(catId);
  
  // В категорията с часовникови аксесоари показваме ЧАСОВНИКОВИТЕ марки
  // (Apple Watch, Garmin...); в аксесоарните категории - марките на
  // производителите на аксесоари, стеснени до тези с реални продукти в
  // конкретната категория; навсякъде другаде - телефонните.
  let brandsToShow;
  if (catId === WATCH_CATEGORY_ID) {
    brandsToShow = watchBrands();
  } else if (accessoryMode) {
    const present = accessoryBrandsByCategory.get(catId);
    brandsToShow = accessoryBrands();
    if (present && present.size > 0) {
      brandsToShow = brandsToShow.filter(b => present.has(b.name));
    }
    brandsToShow = brandsToShow
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  } else {
    brandsToShow = phoneBrands();
  }
  
  brandsToShow.forEach(brand => {
    const btn = document.createElement("button");
    btn.className = "brand-pill-btn";
    if (categoryDetailSelectedBrand === brand.name) btn.classList.add("active");
    btn.onclick = () => {
      if (categoryDetailSelectedBrand === brand.name) {
        categoryDetailSelectedBrand = null;
        categoryDetailSelectedModel = null;
      } else {
        categoryDetailSelectedBrand = brand.name;
        categoryDetailSelectedModel = null;
      }
      renderCategoryDetailPage(catId);
    };
    const logoSrc = resolveBrandLogo(brand, '/assets/');
    btn.innerHTML = `
      <img src="${logoSrc}" alt="${brand.name}" class="brand-card-img" onerror="this.onerror=null;this.src='/assets/logo.webp'">
      <span class="brand-card-text">${brand.name}</span>
    `;
    container.appendChild(btn);
  });
  
  const step2Title = document.getElementById("cat-detail-step2-title");
  const modelList = document.getElementById("cat-detail-models-list");
  if (step2Title && modelList) {
    // При аксесоарите няма втора стъпка - зарядно или кабел не се избира
    // по модел телефон.
    if (accessoryMode) {
      step2Title.style.display = "none";
      modelList.style.display = "none";
    } else if (categoryDetailSelectedBrand) {
      step2Title.style.display = "block";
      step2Title.textContent = `Избери модел за ${categoryDetailSelectedBrand.toUpperCase()}:`;
      modelList.style.display = "grid";
      modelList.innerHTML = "";
      
      const brandModels = MODELS.filter(m => m.brand === categoryDetailSelectedBrand);
      const seen = new Set();
      const uniqueModels = [];
      
      brandModels.forEach(model => {
        const cleanName = getCleanModelName(model.name);
        const norm = normalizeModel(cleanName);
        if (!seen.has(norm)) {
          seen.add(norm);
          uniqueModels.push({
            displayName: cleanName,
            original: model
          });
        }
      });

      uniqueModels.sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { numeric: true, sensitivity: 'base' }));
      
      uniqueModels.forEach(model => {
        const btn = document.createElement("button");
        btn.className = "model-pill-btn";
        if (categoryDetailSelectedModel === model.displayName) btn.classList.add("active");
        btn.onclick = () => {
          if (categoryDetailSelectedModel === model.displayName) {
            categoryDetailSelectedModel = null;
          } else {
            categoryDetailSelectedModel = model.displayName;
          }
          renderCategoryDetailPage(catId);
        };
        btn.innerHTML = `
          <div class="model-icon-box"><i class="fas fa-mobile-alt"></i></div>
          <span class="model-card-text">${model.displayName}</span>
        `;
        modelList.appendChild(btn);
      });
    } else {
      step2Title.style.display = "none";
      modelList.style.display = "none";
    }
  }
}

async function renderCategoryDetailPage(catId, loadMore = false) {
  const category = CATEGORIES.find(c => c.id === catId);
  const nameEl = document.getElementById("category-detail-name");
  if (nameEl && category) {
    nameEl.textContent = category.name;
  }
  
  const descEl = document.getElementById("category-detail-desc");
  if (descEl) {
    descEl.textContent = (category && category.description) ? category.description : "Премиум телефонни аксесоари от най-висок клас, подбрани специално за вашите нужди и изисквания.";
  }

  // Update category SEO metadata dynamically
  if (category) {
    let finalTitle = category.seoTitle ? category.seoTitle : `${category.name} | CaseKing`;
    let finalDesc = category.seoDescription ? category.seoDescription : (category.description ? category.description : `Висококачествени ${category.name.toLowerCase()} за вашия телефон от CaseKing. Бърза доставка, преглед и тест.`);

    // If a phone model filter is selected
    if (categoryDetailSelectedModel) {
      finalTitle = `${category.name} за ${categoryDetailSelectedBrand} ${categoryDetailSelectedModel} | Премиум Защита - CaseKing`;
      finalDesc = `Изберете премиум ${category.name.toLowerCase()} за ${categoryDetailSelectedBrand} ${categoryDetailSelectedModel} в онлайн магазин CaseKing. Изключителна защита, бърза доставка, преглед и тест!`;
    } else if (categoryDetailSelectedBrand) {
      finalTitle = `${category.name} за ${categoryDetailSelectedBrand} | Премиум Защита - CaseKing`;
      finalDesc = `Голямо разнообразие от ${category.name.toLowerCase()} за ${categoryDetailSelectedBrand} в онлайн магазин CaseKing. Поръчайте с бърза доставка и преглед!`;
    }

    updateSEO(null, finalTitle, finalDesc);
  }
  
  // Handle Category Filtering Panel
  // Категории с двустъпков филтър "марка -> модел". Часовниковите
  // аксесоари са тук: избираш Apple Watch -> Series 9 и виждаш всичко
  // за този модел. renderCategoryDetailBrands сама подава ЧАСОВНИКОВИТЕ
  // марки за WATCH_CATEGORY_ID.
  const isModelSpecific = [
    "keysove-i-kalufi",
    "protektori-za-ekran",
    "hydrogel_film",
    WATCH_CATEGORY_ID
  ].includes(catId);
  const accessoryMode = isAccessoryCategory(catId);
  const hasBrandFilter = isModelSpecific || accessoryMode;
  const filterPanel = document.getElementById("category-detail-filter-panel");
  if (filterPanel) {
    if (hasBrandFilter) {
      filterPanel.style.display = "block";
      renderCategoryDetailBrands(catId);
      if (accessoryMode && !accessoryBrandsByCategory.has(catId)) {
        // Списъкът с марки за тази категория още не е известен - зарежда
        // се на заден план и панелът се пречертава, щом е готов.
        loadAccessoryBrandsForCategory(catId).then(() => {
          renderCategoryDetailBrands(catId);
        });
      }
    } else {
      filterPanel.style.display = "none";
      categoryDetailSelectedBrand = null;
      categoryDetailSelectedModel = null;
    }
  }

  const grid = document.getElementById("category-detail-product-grid");
  if (!grid) return;

  const brandFilter = hasBrandFilter ? categoryDetailSelectedBrand : null;
  const modelFilter = isModelSpecific ? categoryDetailSelectedModel : null;

  if (!loadMore) {
    categoryDetailAccumulated = [];
    categoryDetailCursor = null;
    categoryDetailIsDone = true;
    grid.innerHTML = `<div class="no-products-message" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">Зареждане...</div>`;
  }
  if (categoryDetailLoading) return;
  categoryDetailLoading = true;

  try {
    const page = await convex.query("products:getByCategory", {
      category: catId,
      brand: brandFilter || undefined,
      model: modelFilter || undefined,
      cursor: loadMore ? categoryDetailCursor : null,
    });
    categoryDetailAccumulated = loadMore ? categoryDetailAccumulated.concat(page.page) : page.page;
    categoryDetailIsDone = page.isDone;
    categoryDetailCursor = page.continueCursor;
    cacheProducts(page.page);
  } catch (err) {
    console.error("Could not load category products:", err);
    grid.innerHTML = `<div class="no-products-message" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">Грешка при зареждане. Опитайте отново.</div>`;
    categoryDetailLoading = false;
    return;
  }
  categoryDetailLoading = false;

  let filteredProducts = categoryDetailAccumulated.filter(p => !p.isDeleted);

  // Update count in detail header - use the cached exact category count
  // when nothing is narrowed further (matches the "load everything" case),
  // otherwise the count of what's actually been loaded so far.
  const countEl = document.getElementById("category-detail-product-count");
  if (countEl) {
    let count;
    if (!brandFilter && !modelFilter && category) {
      count = category.productCount || filteredProducts.length;
    } else {
      count = filteredProducts.length;
    }
    const suffix = !categoryDetailIsDone && (brandFilter || modelFilter) ? "+" : "";
    countEl.textContent = count === 1 && !suffix ? "1 продукт" : `${count}${suffix} продукта`;
  }

  // Always sort by price (from cheapest to most expensive)
  const isB2B = currentUser && currentUser.clientType === "B2B";
  filteredProducts.sort((a, b) => {
    const priceA = isB2B ? (a.priceB2B ?? a.price ?? 0) : (a.priceB2C ?? a.price ?? 0);
    const priceB = isB2B ? (b.priceB2B ?? b.price ?? 0) : (b.priceB2C ?? b.price ?? 0);
    return priceA - priceB;
  });

  grid.innerHTML = "";

  if (filteredProducts.length === 0) {
    grid.innerHTML = `<div class="no-products-message" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">Няма намерени продукти в тази категория.</div>`;
    return;
  }

  filteredProducts.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.style.cursor = "pointer";
    card.onclick = (e) => {
      if (e.target.classList.contains("btn-card-buy") || e.target.closest(".btn-card-buy")) {
        return;
      }
      const slug = getProductSlug(product.name + " " + (product.model || ""));
      history.pushState(null, "", "/produkt/" + slug);
      handleRouting();
    };
    
    const tagHtml = product.tag ? `<span class="badge-tag sale">${product.tag}</span>` : "";
    const isB2B = currentUser && currentUser.clientType === "B2B";
    const price = isB2B ? (product.priceB2B ?? product.price) : (product.priceB2C ?? product.price);
    const oldPrice = isB2B ? product.oldPriceB2B : (product.oldPriceB2C ?? product.oldPrice);
    
    const priceHtml = oldPrice 
      ? `<span class="product-price old-price">${formatPrice(oldPrice)}</span>
         <span class="product-price" style="color: var(--accent);">${formatPrice(price)} ${isB2B ? '<span style="font-size:0.65rem; font-weight:600; color:var(--gold);">B2B</span>' : ''}</span>`
      : `<span class="product-price">${formatPrice(price)} ${isB2B ? '<span style="font-size:0.65rem; font-weight:600; color:var(--gold);">B2B</span>' : ''}</span>`;
      
    card.innerHTML = `
      ${tagHtml}
      <div class="product-image-container">
        <img class="product-img" src="${getProductImageUrl(product.image, product.name, product.model)}" alt="${product.name}" loading="lazy" onerror="this.src='/assets/logo.webp'">
      </div>
      <div class="product-info">
        <span class="product-category">${product.brand}</span>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-price-box">
          ${priceHtml}
        </div>
        <button class="btn-card-buy" onclick="addToCart('${product._id}', 1, event)">Добави в количката</button>
      </div>
    `;
    grid.appendChild(card);
  });

  if (!categoryDetailIsDone) {
    const loadMoreBtn = document.createElement("button");
    loadMoreBtn.className = "btn-card-buy";
    loadMoreBtn.style.cssText = "grid-column: 1/-1; max-width: 280px; margin: 1.5rem auto 0; display: block;";
    loadMoreBtn.textContent = "Зареди още продукти";
    loadMoreBtn.onclick = () => renderCategoryDetailPage(catId, true);
    grid.appendChild(loadMoreBtn);
  }
}

window.backToCategories = function() {
  categoryDetailSelectedBrand = null;
  categoryDetailSelectedModel = null;
  history.pushState(null, "", "/aksesoari");
  handleRouting();
};

// --- MOBILE HAMBURGER MENU ACTIONS ---
function openMobileMenu() {
  document.getElementById("mobile-menu-overlay").classList.add("active");
}

function closeMobileMenu() {
  document.getElementById("mobile-menu-overlay").classList.remove("active");
}

function selectMobileBrand(brandName, btn) {
  document.querySelectorAll(".menu-brand-item").forEach(item => item.classList.remove("active"));
  btn.classList.add("active");
  
  const modelSection = document.getElementById("menu-models-section");
  const modelTitle = document.getElementById("menu-models-title");
  const modelList = document.getElementById("menu-models-list");
  
  modelSection.style.display = "block";
  modelTitle.textContent = `Модели за ${brandName}`;
  modelList.innerHTML = "";
  
  const brandModels = MODELS.filter(m => m.brand === brandName);
  const seen = new Set();
  const uniqueModels = [];
  
  brandModels.forEach(model => {
    const cleanName = getCleanModelName(model.name);
    const norm = normalizeModel(cleanName);
    if (!seen.has(norm)) {
      seen.add(norm);
      uniqueModels.push({
        displayName: cleanName,
        original: model
      });
    }
  });

  uniqueModels.sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { numeric: true, sensitivity: 'base' }));

  uniqueModels.forEach(model => {
    const modelBtn = document.createElement("button");
    modelBtn.className = "menu-model-item";
    modelBtn.innerHTML = `
      <i class="fas fa-mobile-alt"></i>
      <span>${model.displayName}</span>
    `;
    modelBtn.onclick = () => {
      selectedBrand = brandName;
      selectedModel = model.displayName;
      selectedCategory = null;
      
      closeMobileMenu();
      
      // Sync desktop UI highlighting
      document.querySelectorAll(".category-card").forEach(c => c.classList.remove("active"));
      selectBrand(brandName);
      selectModel(model.displayName);
    };
    modelList.appendChild(modelBtn);
  });
}

// --- INITIALIZATION ---
async function initApp() {
  // Render views immediately with cached or static dataset (instant mount!)
  renderHeroSettings();
  renderBrands();
  populateFinderBrands();
  renderCategories();
  renderCatalog();
  updateCartCount();
  renderCartItems();
  isInitialLoad = false;

  // Check cookie consent banner
  checkCookieConsent();
  
  // Trigger router routing checks
  handleRouting();
  window.addEventListener("hashchange", handleRouting);
  window.addEventListener("popstate", handleRouting);
  
  loadData().then(() => {
    // Re-render views with fresh database values once loaded
    renderBrands();
    populateFinderBrands();
    renderCategories();
    renderCatalog();
    renderCartItems();
    handleRouting();
  });
  
  // Verify session login in background
  verifySession();
  
  // Background header transparency transitions on scroll
  window.addEventListener("scroll", () => {
    const header = document.querySelector("header");
    if (!header) return;
    
    if (window.scrollY > 30) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
  
  // Google sign in init
  initGoogleLoginButton();
  
  // Gallery navigation button event listeners
  const prevBtn = document.getElementById("product-page-prev-btn");
  const nextBtn = document.getElementById("product-page-next-btn");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentProductImagesList.length > 1) {
        const nextIndex = (currentProductImageIndex - 1 + currentProductImagesList.length) % currentProductImagesList.length;
        updateProductPageImage(nextIndex);
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentProductImagesList.length > 1) {
        const nextIndex = (currentProductImageIndex + 1) % currentProductImagesList.length;
        updateProductPageImage(nextIndex);
      }
    });
  }
}

async function applyPromoCode() {
  const inputEl = document.getElementById("checkout-promo-input");
  const msgEl = document.getElementById("checkout-promo-msg");
  if (!inputEl || !msgEl) return;
  
  const code = inputEl.value.trim();
  if (!code) {
    msgEl.textContent = "Моля, въведете промо код!";
    msgEl.style.color = "var(--danger)";
    msgEl.style.display = "block";
    return;
  }
  
  try {
    const res = await convex.query("promoCodes:verifyCode", { code });
    if (res.success) {
      appliedPromo = res;
      msgEl.textContent = `Успешно приложен код ${res.code}!`;
      msgEl.style.color = "#2ecc71";
      msgEl.style.display = "block";
      renderCheckoutSummary();
    } else {
      appliedPromo = null;
      msgEl.textContent = res.error || "Невалиден код!";
      msgEl.style.color = "var(--danger)";
      msgEl.style.display = "block";
      renderCheckoutSummary();
    }
  } catch (err) {
    console.error("Promo verification failed", err);
    msgEl.textContent = "Възникна грешка при проверка на кода.";
    msgEl.style.color = "var(--danger)";
    msgEl.style.display = "block";
  }
}

// --- COOKIE CONSENT BANNER LOGIC ---
function checkCookieConsent() {
  const consent = localStorage.getItem("caseking_cookie_consent");
  if (!consent) {
    const banner = document.getElementById("cookie-consent-banner");
    if (banner) {
      setTimeout(() => {
        banner.style.display = "block";
        // Force reflow
        banner.offsetHeight;
        banner.classList.add("show");
      }, 1000);
    }
  }
}

function acceptCookies() {
  localStorage.setItem("caseking_cookie_consent", "accepted");
  const banner = document.getElementById("cookie-consent-banner");
  if (banner) {
    banner.classList.remove("show");
    setTimeout(() => {
      banner.style.display = "none";
    }, 400);
  }
}

async function handleContactSubmit(event) {
  event.preventDefault();
  
  const name = document.getElementById("contact-name").value;
  const email = document.getElementById("contact-email").value;
  const phone = document.getElementById("contact-phone").value;
  const message = document.getElementById("contact-message").value;
  
  const submitBtn = event.target.querySelector("button[type='submit']");
  const successMsg = document.getElementById("contact-success-msg");
  
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Изпращане...';
  }
  
  try {
    const res = await convex.mutation("contacts:sendMessage", {
      name,
      email,
      phone: phone || "",
      message
    });
    
    if (res && res.success) {
      if (successMsg) {
        successMsg.style.display = "flex";
      }
      event.target.reset();
      setTimeout(() => {
        if (successMsg) successMsg.style.display = "none";
      }, 5000);
    } else {
      alert("Възникна грешка при изпращането на съобщението. Моля, опитайте отново.");
    }
  } catch (err) {
    console.error("Failed to send contact message:", err);
    alert("Грешка при изпращане: " + err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Изпрати съобщение';
    }
  }
}

// Global Exports
window.openMobileMenu = openMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.renderCartItems = renderCartItems;
window.applyPromoCode = applyPromoCode;
window.handleRouting = handleRouting;
window.acceptCookies = acceptCookies;
window.handleContactSubmit = handleContactSubmit;
window.onFinderBrandChange = onFinderBrandChange;
window.finderSearch = finderSearch;
window.populateFinderBrands = populateFinderBrands;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
