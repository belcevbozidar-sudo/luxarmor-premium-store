import { ConvexHttpClient } from "https://cdn.jsdelivr.net/npm/convex@1.38.0/browser/+esm";

const convex = new ConvexHttpClient("https://trustworthy-possum-230.eu-west-1.convex.cloud");

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
    category: "cases",
    priceB2C: 69.00,
    oldPriceB2C: 99.00,
    priceB2B: 55.00,
    oldPriceB2B: 79.00,
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "БЕСТСЕЛЪР",
    description: "Луксозен калъф от естествена селектирана телешка кожа с вградена MagSafe технология. Изключително фино усещане и защита.",
    specs: { material: "Естествена кожа", weight: "30г", origin: "Германия", delivery: "Бърза доставка с преглед" }
  },
  {
    _id: "prod_2",
    name: "Карбонов кейс UltraSlim Kevlar",
    brand: "Apple",
    model: "iPhone 15 Pro",
    category: "cases",
    priceB2C: 79.00,
    oldPriceB2C: null,
    priceB2B: 63.00,
    oldPriceB2B: null,
    image: "https://images.unsplash.com/photo-1586953983027-d7508a64f4bb?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "ХИТ",
    description: "Ултратънък и изключително здрав кейс от 100% арамидни влакна (Kevlar). Военен клас на защита, дебелина само 0.6 мм.",
    specs: { material: "Карбонов кевлар", weight: "12г", origin: "САЩ", delivery: "Бърза доставка с преглед" }
  },
  {
    _id: "prod_3",
    name: "Удароустойчив силиконов кейс Liquid Armor",
    brand: "Samsung",
    model: "Galaxy S24 Ultra",
    category: "cases",
    priceB2C: 39.00,
    oldPriceB2C: 49.00,
    priceB2B: 31.20,
    oldPriceB2B: 39.00,
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "НОВО",
    description: "Мек и удобен силиконов кейс с микрофибърна подплата отвътре за максимална защита от надраскване и падане.",
    specs: { material: "Премиум течен силикон", weight: "25г", origin: "Корея", delivery: "Бърза доставка с преглед" }
  },
  {
    _id: "prod_4",
    name: "Хибриден кейс с подсилени ръбове Crystal Clear",
    brand: "Samsung",
    model: "Galaxy S23 Ultra",
    category: "cases",
    priceB2C: 29.00,
    oldPriceB2C: null,
    priceB2B: 23.20,
    oldPriceB2B: null,
    image: "https://images.unsplash.com/photo-1586953983027-d7508a64f4bb?auto=format&fit=crop&q=80&w=800",
    rating: 4,
    tag: null,
    description: "Напълно прозрачен кейс, който не пожълтява. Разкрива оригиналния дизайн на вашия телефон, защитавайки го перфектно.",
    specs: { material: "Поликарбонат и TPU", weight: "22г", origin: "Корея", delivery: "Бърза доставка с преглед" }
  },
  {
    _id: "prod_5",
    name: "Външна батерия MagSafe Power Bank 10000mAh",
    brand: "Apple",
    model: "Всички модели",
    category: "power_banks",
    priceB2C: 59.00,
    oldPriceB2C: 89.00,
    priceB2B: 47.00,
    oldPriceB2B: 71.00,
    image: "assets/cat_power_bank.webp",
    rating: 5,
    tag: "БЕСТСЕЛЪР",
    description: "Ултратънък магнитен външен акумулатор. Бързо безжично зареждане и перфектно сцепление с MagSafe.",
    specs: { material: "Поликарбонат & Алуминий", weight: "190г", origin: "Япония", delivery: "Бърза доставка с преглед" }
  }
];

const STATIC_CATEGORIES = [
  { id: "cases", name: "Кейсове / Калъфи", image: "assets/cat_cases.webp" },
  { id: "protectors", name: "Протектори за екран", image: "assets/cat_protectors.webp" },
  { id: "car_acc", name: "Аксесоари за автомобил", image: "assets/cat_car_holder.webp" },
  { id: "wireless_chargers", name: "Безжични зарядни", image: "assets/cat_wireless_charger.webp" },
  { id: "all_chargers", name: "Зарядни устройства", image: "assets/cat_car_charger.webp" },
  { id: "original_cables", name: "Кабели за зареждане", image: "assets/cat_cables.webp" },
  { id: "desk_holder", name: "Поставки за бюро", image: "assets/cat_desk_stand.webp" },
  { id: "selfie_stick", name: "Селфи стикове", image: "assets/cat_selfie_stick.webp" },
  { id: "pop_socket", name: "Попсокет / Връзки", image: "assets/cat_pop_socket.webp" },
  { id: "power_banks", name: "Външни батерии", image: "assets/cat_power_bank.webp" }
];

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
let selectedBrand = null;
let selectedModel = null;
let selectedCategory = null;
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

// Image proxy URL helper
function getProductImageUrl(url, name, model) {
  if (!url) return "";
  // If running locally via file protocol, serverless functions are unavailable
  if (window.location.protocol === "file:") {
    return url;
  }
  if (url.includes("cdn.sellavi.com")) {
    const slug = getProductSlug(name + " " + (model || ""));
    return `/api/image/${slug}.webp?url=${encodeURIComponent(url)}&name=${encodeURIComponent(slug)}`;
  }
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
async function loadData() {
  try {
    const dbProducts = await convex.query("products:get");
    if (dbProducts && dbProducts.length > 0) {
      PRODUCTS = dbProducts;
      localStorage.setItem("caseking_cached_products", JSON.stringify(dbProducts));
    }
    
    const dbCats = await convex.query("meta:getCategories");
    if (dbCats && dbCats.length > 0) {
      CATEGORIES = dbCats;
      localStorage.setItem("caseking_cached_categories", JSON.stringify(dbCats));
    }
    
    const dbBrands = await convex.query("meta:getBrands");
    if (dbBrands && dbBrands.length > 0) {
      BRANDS = dbBrands;
      localStorage.setItem("caseking_cached_brands", JSON.stringify(dbBrands));
    }
    
    const dbModels = await convex.query("meta:getModels");
    if (dbModels && dbModels.length > 0) {
      MODELS = dbModels;
      localStorage.setItem("caseking_cached_models", JSON.stringify(dbModels));
    }
    
    const dbPromos = await convex.query("promotions:getActive");
    if (dbPromos) {
      PROMOTIONS = dbPromos;
      localStorage.setItem("caseking_cached_promotions", JSON.stringify(dbPromos));
    }
    console.log("Storefront data successfully loaded dynamically from Convex.");
  } catch (err) {
    console.warn("Could not load dynamic data from Convex, falling back to static dataset.", err);
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
        localStorage.removeItem("caseking_session_token");
      }
    } catch (err) {
      console.error("Session verification failed", err);
    }
  }
}

// --- DYNAMIC RENDERING ---
function renderBrands() {
  const container = document.getElementById("brands-list");
  const mobileContainer = document.getElementById("menu-brands-list");
  if (!container) return;
  
  container.innerHTML = "";
  if (mobileContainer) mobileContainer.innerHTML = "";
  
  BRANDS.forEach(brand => {
    // Desktop Card
    const btn = document.createElement("button");
    btn.className = "brand-pill-btn";
    if (selectedBrand === brand.name) btn.classList.add("active");
    btn.onclick = () => selectBrand(brand.name);
    
    btn.innerHTML = `
      <img src="assets/${brand.logo}" alt="${brand.name}" class="brand-card-img" onerror="this.style.display='none'">
      <span class="brand-card-text">${brand.name}</span>
    `;
    container.appendChild(btn);

    // Mobile menu drawer card
    if (mobileContainer) {
      const mBtn = document.createElement("button");
      mBtn.className = "menu-brand-item";
      mBtn.onclick = () => selectMobileBrand(brand.name, mBtn);
      mBtn.innerHTML = `
        <img src="assets/${brand.logo}" class="menu-brand-img" onerror="this.style.display='none'">
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

function selectCategoryFilter(catId, element) {
  selectedCategory = catId;
  selectedBrand = null;
  selectedModel = null;

  document.querySelectorAll(".brand-pill-btn, .model-pill-btn").forEach(p => p.classList.remove("active"));
  const step2Title = document.getElementById("step2-title");
  const modelList = document.getElementById("models-list");
  if (step2Title && modelList) {
    step2Title.style.display = "none";
    modelList.style.display = "none";
  }

  document.querySelectorAll(".category-card").forEach(card => card.classList.remove("active"));
  if (element) element.classList.add("active");

  renderCatalog();
  
  const catalogSection = document.getElementById("catalog");
  if (catalogSection) {
    catalogSection.scrollIntoView({ behavior: "smooth" });
  }
}

function renderCategories() {
  const container = document.getElementById("categories-grid");
  if (!container) return;
  container.innerHTML = "";
  
  CATEGORIES.forEach(cat => {
    const card = document.createElement("div");
    card.className = "category-card";
    card.onclick = () => selectCategoryFilter(cat.id, card);
    card.innerHTML = `
      <img src="${cat.image}" alt="${cat.name}" class="category-card-img" loading="lazy">
      <div class="category-card-overlay">
        <span class="category-card-title">${cat.name}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderCatalog() {
  const grid = document.getElementById("product-grid");
  const catalogTitle = document.getElementById("catalog-main-title");
  if (!grid) return;
  
  grid.innerHTML = "";
  
  let filteredProducts = PRODUCTS;
  const isFiltered = !!(selectedBrand || selectedCategory);

  if (selectedBrand) {
    if (selectedModel) {
      const normSelected = normalizeModel(selectedModel);
      filteredProducts = PRODUCTS.filter(p => normalizeModel(p.model) === normSelected || p.brand === "Всички");
      if (catalogTitle) catalogTitle.textContent = `Аксесоари за ${selectedModel}`;
    } else {
      filteredProducts = PRODUCTS.filter(p => p.brand === selectedBrand || p.brand === "Всички");
      if (catalogTitle) catalogTitle.textContent = `Аксесоари за ${selectedBrand}`;
    }
  } else if (selectedCategory) {
    filteredProducts = PRODUCTS.filter(p => p.category === selectedCategory);
    const catObj = CATEGORIES.find(c => c.id === selectedCategory);
    if (catalogTitle && catObj) catalogTitle.textContent = catObj.name;
  } else {
    if (catalogTitle) catalogTitle.textContent = "Препоръчани продукти";
    filteredProducts = PRODUCTS.slice(0, 8);
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
      const slug = getProductSlug(product.name + " " + product.model);
      window.location.hash = `#product/${product._id}/${slug}`;
    };
    
    let ratingStars = "";
    for (let i = 1; i <= 5; i++) {
      ratingStars += `<i class="${i <= product.rating ? 'fas' : 'far'} fa-star"></i>`;
    }
    
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
        <img class="product-img" src="${getProductImageUrl(product.image, product.name, product.model)}" alt="${product.name}" loading="lazy">
      </div>
      <div class="product-details">
        <span class="product-category">${product.brand}</span>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-rating">${ratingStars}</div>
        <div class="product-price-box">
          ${priceHtml}
        </div>
        <button class="btn-card-buy" onclick="addToCart('${product._id}', 1)">Добави в количката</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Helper to update active image in details page gallery
function updateProductPageImage(index) {
  if (index < 0 || index >= currentProductImagesList.length) return;
  currentProductImageIndex = index;
  
  const mainImgUrl = currentProductImagesList[index];
  document.getElementById("product-page-image").src = getProductImageUrl(mainImgUrl, currentProductImageName, currentProductImageModel);
  document.getElementById("product-page-image").alt = currentProductImageName;
  
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
function renderProductPage(productId) {
  const p = PRODUCTS.find(item => item._id === productId);
  if (!p) {
    window.location.hash = "#";
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
  document.getElementById("product-page-spec-delivery").textContent = p.specs.delivery;
  
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
  document.getElementById("product-page-add-to-cart").onclick = () => {
    addToCart(p._id, activeProductPageQty);
  };
}

// --- CART CALCULATIONS & RENDERING ---
function updateCartCount() {
  const countElements = document.querySelectorAll(".cart-count");
  const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
  countElements.forEach(el => {
    el.textContent = totalQty;
    el.style.display = totalQty > 0 ? "flex" : "none";
  });
}

function saveCart() {
  localStorage.setItem('caseking_cart', JSON.stringify(cart));
  updateCartCount();
  renderCartItems();
}

window.addToCart = function(productId, quantity = 1) {
  // Find product details
  const product = PRODUCTS.find(p => p._id === productId);
  if (!product) return;
  
  // Determine pricing to store in cart (to lock B2B/B2C state)
  const isB2B = currentUser && currentUser.clientType === "B2B";
  const activePrice = isB2B ? (product.priceB2B ?? product.price) : (product.priceB2C ?? product.price);
  
  const existingItemIndex = cart.findIndex(item => item.id === productId && !item.isGift);
  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
    cart[existingItemIndex].price = activePrice; // update to latest login type rate
  } else {
    cart.push({
      id: product._id,
      name: product.name,
      image: product.image,
      price: activePrice,
      brand: product.brand,
      category: product.category,
      quantity
    });
  }
  
  saveCart();
  openCartSidebar();
};

window.updateCartItemQty = function(productId, newQty) {
  const index = cart.findIndex(item => item.id === productId && !item.isGift);
  if (index === -1) return;
  
  if (newQty <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index].quantity = newQty;
  }
  saveCart();
};

window.removeFromCart = function(productId) {
  cart = cart.filter(item => item.id !== productId || item.isGift);
  saveCart();
};

function renderCartItems() {
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
    } else {
      const diff = shippingPromo.threshold - subtotal;
      shippingPromoText = `Добавете още ${formatPrice(diff)} за БЕЗПЛАТНА доставка!`;
    }
  }

  // 2. Gift check
  const giftPromo = activePromos.find(p => p.type === "gift");
  let giftPromoText = "";
  
  if (giftPromo && giftPromo.giftProductId) {
    if (subtotal >= giftPromo.threshold) {
      const giftProduct = PRODUCTS.find(p => p._id === giftPromo.giftProductId);
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
      }
    } else {
      const diff = giftPromo.threshold - subtotal;
      const giftProduct = PRODUCTS.find(p => p._id === giftPromo.giftProductId);
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
  cart.forEach(item => {
    const itemRow = document.createElement("div");
    itemRow.className = "cart-item";
    
    const qtySelectHtml = item.isGift 
      ? `<span class="cart-qty-val" style="color:var(--success); font-weight:600;">Подарък</span>`
      : `<div class="cart-item-qty-row">
          <button class="cart-qty-btn" onclick="updateCartItemQty('${item.id}', ${item.quantity - 1})">-</button>
          <span class="cart-qty-val">${item.quantity}</span>
          <button class="cart-qty-btn" onclick="updateCartItemQty('${item.id}', ${item.quantity + 1})">+</button>
        </div>`;

    const removeBtnHtml = item.isGift
      ? ""
      : `<button class="cart-item-remove-btn" onclick="removeFromCart('${item.id}')" title="Премахни">
          <svg style="width: 18px; height: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>`;

    itemRow.innerHTML = `
      <img class="cart-item-img" src="${getProductImageUrl(item.image, item.name)}" alt="${item.name}">
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
}

window.openCartSidebar = function() {
  document.getElementById("cart-overlay").classList.add("active");
};

window.closeCartSidebar = function() {
  document.getElementById("cart-overlay").classList.remove("active");
};

// --- CHECKOUT FUNNEL ---
window.proceedToCheckout = function() {
  closeCartSidebar();
  window.location.hash = "#checkout";
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

function renderCheckoutSummary() {
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
    const giftProduct = PRODUCTS.find(p => p._id === giftPromo.giftProductId);
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
  
  const total = subtotal + shippingCost - discountAmount;
  
  subtotalEl.textContent = formatPrice(subtotal);
  shippingEl.textContent = shippingCost === 0 ? "Безплатна" : formatPrice(shippingCost);
  totalEl.textContent = formatPrice(total);
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
  
  // Prepare items payload
  const orderItems = cart.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    isGift: item.isGift || false
  }));
  
  // Calculate total
  let subtotal = 0;
  cart.forEach(item => {
    if (!item.isGift) subtotal += item.price * item.quantity;
  });
  
  const clientType = activeCheckoutType;
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
  
  const total = subtotal + shippingCost - discountAmount;
  const orderNum = "CK-" + Math.floor(100000 + Math.random() * 900000);
  
  const orderPayload = {
    orderNumber: orderNum,
    name,
    phone,
    address,
    items: orderItems,
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
    window.location.hash = "#";
  } catch (err) {
    alert("Грешка при изпращане на поръчката: " + err.message);
  }
};

window.closeSuccessScreen = function() {
  document.getElementById("success-screen").classList.remove("active");
  document.getElementById("checkout-form-main").reset();
  window.location.hash = "#";
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
    googleId: googleRegisterTemp ? googleRegisterTemp.googleId : null
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
    const res = await convex.mutation("users:register", regPayload);
    if (res.success) {
      localStorage.setItem("caseking_session_token", res.sessionToken);
      currentUser = {
        _id: res.userId,
        email,
        clientType: res.clientType,
        name: res.name,
        phone,
        address,
        companyDetails: regPayload.companyDetails
      };
      
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
    const res = await convex.mutation("users:login", { email, password });
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
    client_id: "25806833456-m8f2h90vm7r0dfbujef1s3pdr3hesqhr.apps.googleusercontent.com",
    callback: handleGoogleCredentialResponse
  });
  
  google.accounts.id.renderButton(
    document.getElementById("google-login-btn-container"),
    { theme: "outline", size: "large", text: "signin_with" }
  );
}

// JWT decoder helper
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

async function handleGoogleCredentialResponse(response) {
  const credential = response.credential;
  const payload = parseJwt(credential);
  if (!payload) {
    alert("Грешка при валидация на Google профил.");
    return;
  }
  
  const email = payload.email;
  const name = payload.name;
  const googleId = payload.sub;
  
  try {
    const res = await convex.mutation("users:googleLogin", { email, name, googleId });
    if (res.success) {
      // Logged in
      localStorage.setItem("caseking_session_token", res.sessionToken);
      await verifySession();
      closeAuthModal();
    } else if (res.needsRegistration) {
      // Google account needs details registration
      googleRegisterTemp = { email, name, googleId };
      
      toggleAuthPanel("register");
      
      // Fill email and name
      document.getElementById("reg-email").value = email;
      document.getElementById("reg-email").disabled = true;
      document.getElementById("reg-name").value = name;
      
      // Hide password input since they register with Google
      document.getElementById("reg-pass-group").style.display = "none";
      document.getElementById("reg-pass").required = false;
      
      alert("Моля, попълнете вашия телефон и адрес за доставка, за да довършите профила си!");
    }
  } catch (err) {
    alert("Грешка при вход с Google: " + err.message);
  }
}

// --- CLIENT-SIDE ROUTER ---
function handleRouting() {
  const hash = window.location.hash;
  
  const homeView = document.getElementById("storefront-home-view");
  const productView = document.getElementById("product-page-view");
  const checkoutView = document.getElementById("checkout-page-view");
  
  if (hash.startsWith("#product/")) {
    // Show Product Details View
    homeView.style.display = "none";
    checkoutView.style.display = "none";
    productView.style.display = "block";
    
    const pathParts = hash.substring(9).split("/");
    const productId = pathParts[0];
    renderProductPage(productId);
    window.scrollTo(0, 0);
  } else if (hash === "#checkout") {
    // Show Checkout funnel
    homeView.style.display = "none";
    productView.style.display = "none";
    checkoutView.style.display = "block";
    
    renderCheckoutSummary();
    window.scrollTo(0, 0);
  } else {
    // Show Standard Home/Catalog view
    productView.style.display = "none";
    checkoutView.style.display = "none";
    homeView.style.display = "block";
    
    renderCatalog();
  }
}

window.backToCatalog = function() {
  window.location.hash = "#";
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
  brandModels.forEach(model => {
    const modelBtn = document.createElement("button");
    modelBtn.className = "menu-model-item";
    modelBtn.innerHTML = `
      <i class="fas fa-mobile-alt"></i>
      <span>${model.name}</span>
    `;
    modelBtn.onclick = () => {
      selectedBrand = brandName;
      selectedModel = model.name;
      selectedCategory = null;
      
      closeMobileMenu();
      
      // Sync desktop UI highlighting
      document.querySelectorAll(".category-card").forEach(c => c.classList.remove("active"));
      selectBrand(brandName);
      selectModel(model.name);
    };
    modelList.appendChild(modelBtn);
  });
}

// --- INITIALIZATION ---
async function initApp() {
  // Render views immediately with cached or static dataset (instant mount!)
  renderBrands();
  renderCategories();
  renderCatalog();
  updateCartCount();
  renderCartItems();
  
  // Trigger router routing checks
  handleRouting();
  window.addEventListener("hashchange", handleRouting);
  
  // Load dynamic database variables in background
  loadData().then(() => {
    // Re-render views with fresh database values once loaded
    renderBrands();
    renderCategories();
    renderCatalog();
  });
  
  // Verify session login in background
  verifySession();
  
  // Background header transparency transitions on scroll
  window.addEventListener("scroll", () => {
    const header = document.querySelector("header");
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

// Global Exports
window.openMobileMenu = openMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.renderCartItems = renderCartItems;
window.applyPromoCode = applyPromoCode;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
