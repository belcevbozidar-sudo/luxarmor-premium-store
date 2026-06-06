// --- CaseKing PHONE ACCESSORIES DATASET ---
const PRODUCTS = [
  // cases
  {
    id: 1,
    name: "Премиум кожен кейс MagSafe Case",
    brand: "Apple",
    model: "iPhone 15 Pro Max",
    category: "cases",
    price: 69.00,
    oldPrice: 99.00,
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "БЕСТСЕЛЪР",
    description: "Луксозен калъф от естествена селектирана телешка кожа с вградена MagSafe технология. Изключително фино усещане и защита.",
    specs: { material: "Естествена кожа", weight: "30г", origin: "Германия", delivery: "Бърза доставка с преглед" }
  },
  {
    id: 2,
    name: "Карбонов кейс UltraSlim Kevlar",
    brand: "Apple",
    model: "iPhone 15 Pro",
    category: "cases",
    price: 79.00,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1586953983027-d7508a64f4bb?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "ХИТ",
    description: "Ултратънък и изключително здрав кейс от 100% арамидни влакна (Kevlar). Военен клас на защита, дебелина само 0.6 мм.",
    specs: { material: "Карбонов кевлар", weight: "12г", origin: "САЩ", delivery: "Бърза доставка с преглед" }
  },
  {
    id: 3,
    name: "Удароустойчив силиконов кейс Liquid Armor",
    brand: "Samsung",
    model: "Galaxy S24 Ultra",
    category: "cases",
    price: 39.00,
    oldPrice: 49.00,
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "НОВО",
    description: "Мек и удобен силиконов кейс с микрофибърна подплата отвътре за максимална защита от надраскване и падане.",
    specs: { material: "Премиум течен силикон", weight: "25г", origin: "Корея", delivery: "Бърза доставка с преглед" }
  },
  {
    id: 4,
    name: "Хибриден кейс с подсилени ръбове Crystal Clear",
    brand: "Samsung",
    model: "Galaxy S23 Ultra",
    category: "cases",
    price: 29.00,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1586953983027-d7508a64f4bb?auto=format&fit=crop&q=80&w=800",
    rating: 4,
    tag: null,
    description: "Напълно прозрачен кейс, който не пожълтява. Разкрива оригиналния дизайн на вашия телефон, защитавайки го перфектно.",
    specs: { material: "Поликарбонат и TPU", weight: "22г", origin: "Корея", delivery: "Бърза доставка с преглед" }
  },
  {
    id: 5,
    name: "Ултра здрав удароустойчив кейс Tough Guard",
    brand: "Xiaomi",
    model: "Redmi Note 13 Pro+",
    category: "cases",
    price: 34.00,
    oldPrice: 45.00,
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "ЗАЩИТА",
    description: "Двуслоен кейс с подсилени ъгли и вградена стойка за гледане на видео. Идеален за екстремни условия.",
    specs: { material: "Усилена пластмаса & TPU", weight: "45г", origin: "Китай", delivery: "Бърза доставка с преглед" }
  },
  // protectors
  {
    id: 6,
    name: "9D Темпериран стъклен протектор Full Glue",
    brand: "Apple",
    model: "iPhone 15 Pro Max",
    category: "protectors",
    price: 25.00,
    oldPrice: 35.00,
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "ЗАДЪЛЖИТЕЛНО",
    description: "Закалено стъкло с лепило по цялата повърхност. Перфектна чувствителност на допир и максимална защита от счупване.",
    specs: { material: "Закалено стъкло Asahi 9H", weight: "5г", origin: "Япония", delivery: "Бърза доставка" }
  },
  {
    id: 7,
    name: "Сапфирени протектори за задна камера Sapphire Shield",
    brand: "Apple",
    model: "iPhone 15 Pro",
    category: "protectors",
    price: 29.00,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "ПРЕМИУМ",
    description: "Индивидуални метални пръстени със сапфирени стъкла, предпазващи лещите на камерата без промяна в качеството на снимките.",
    specs: { material: "Синтетичен сапфир & Алуминий", weight: "2г", origin: "Германия", delivery: "Бърза доставка" }
  },
  {
    id: 8,
    name: "UV стъклен протектор Liquid Glass",
    brand: "Samsung",
    model: "Galaxy S24 Ultra",
    category: "protectors",
    price: 35.00,
    oldPrice: 45.00,
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "ХИТ",
    description: "Иновативен протектор с течно UV лепило, специално за извити екрани. Предотвратява белене и въздушни мехурчета.",
    specs: { material: "Оптично закалено стъкло", weight: "6г", origin: "Корея", delivery: "Бърза доставка" }
  },
  // accessories & chargers
  {
    id: 9,
    name: "Магнитна стойка за кола MagHold N52",
    brand: "Apple",
    model: "Всички модели",
    category: "car_acc",
    price: 49.00,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "БЕСТСЕЛЪР",
    description: "Стойка за кола за въздуховод с 16 супер силни N52 магнита. Съвместима с MagSafe технология.",
    specs: { material: "Алуминий & Силикон", weight: "60г", origin: "Китай", delivery: "Бърза доставка" }
  },
  {
    id: 10,
    name: "Мултифункционална безжична станция VoltDock 3-в-1",
    brand: "Apple",
    model: "Всички модели",
    category: "wireless_chargers",
    price: 119.00,
    oldPrice: 159.00,
    image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "ТОП ИЗБОР",
    description: "Бързо безжично зареждане едновременно за вашия телефон, смарт часовник и безжични слушалки.",
    specs: { material: "Авиационен алуминий", weight: "220г", origin: "Германия", delivery: "Бърза доставка" }
  },
  {
    id: 11,
    name: "Бързо мрежово зарядно GaN 65W Pro",
    brand: "Всички",
    model: "Всички модели",
    category: "all_chargers",
    price: 55.00,
    oldPrice: 69.00,
    image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "НОВО",
    description: "Иновативно GaN зарядно с три порта (2x USB-C + 1x USB-A) за супер бързо зареждане на телефон, таблет и лаптоп.",
    specs: { material: "Огнеупорен поликарбонат", weight: "95г", origin: "Китай", delivery: "Бърза доставка" }
  },
  {
    id: 12,
    name: "Оригинален кабел Type-C към Lightning Fast Charge",
    brand: "Apple",
    model: "Всички модели",
    category: "original_cables",
    price: 29.00,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "ОРИГИНАЛЕН",
    description: "Оригинален подсилен плетен кабел с дължина 1.2 метра, поддържащ бързо Power Delivery зареждане.",
    specs: { material: "Плетен найлон & Медни нишки", weight: "35г", origin: "САЩ", delivery: "Бърза доставка" }
  },
  {
    id: 13,
    name: "Алуминиева стойка за бюро AluStand",
    brand: "Всички",
    model: "Всички модели",
    category: "desk_holder",
    price: 35.00,
    oldPrice: 45.00,
    image: "assets/cat_desk_stand.png",
    rating: 5,
    tag: "ПРЕМИУМ",
    description: "Стабилна сгъваема алуминиева поставка за телефон или таблет. Силиконови подложки против плъзгане и регулиране на ъгъла.",
    specs: { material: "Алуминиева сплав", weight: "150г", origin: "Германия", delivery: "Бърза доставка с преглед" }
  },
  {
    id: 14,
    name: "Селфи стик с трипод TripodPro",
    brand: "Всички",
    model: "Всички модели",
    category: "selfie_stick",
    price: 39.00,
    oldPrice: null,
    image: "assets/cat_selfie_stick.png",
    rating: 4,
    tag: "ХИТ",
    description: "Разтегателен селфи стик с вграден трипод и безжично Bluetooth дистанционно. Въртене на 360 градуса.",
    specs: { material: "Неръждаема стомана & ABS", weight: "180г", origin: "Корея", delivery: "Бърза доставка с преглед" }
  },
  {
    id: 15,
    name: "Дизайнерски силиконов попсокет PopGrip",
    brand: "Всички",
    model: "Всички модели",
    category: "pop_socket",
    price: 15.00,
    oldPrice: 19.00,
    image: "assets/cat_pop_socket.png",
    rating: 5,
    tag: "ПОПУЛЯРНО",
    description: "Удобна и здрава стойка за пръст за задната страна на телефона. Сигурен захват и лесно сгъване.",
    specs: { material: "Премиум силикон", weight: "10г", origin: "Китай", delivery: "Бърза доставка с преглед" }
  },
  {
    id: 16,
    name: "Външна батерия MagSafe Power Bank 10000mAh",
    brand: "Apple",
    model: "Всички модели",
    category: "power_banks",
    price: 59.00,
    oldPrice: 89.00,
    image: "assets/cat_power_bank.png",
    rating: 5,
    tag: "БЕСТСЕЛЪР",
    description: "Ултратънка магнитна външна батерия с капацитет 10000mAh. Бързо зареждане и перфектно прилепване към MagSafe.",
    specs: { material: "Поликарбонат & Алуминий", weight: "190г", origin: "Япония", delivery: "Бърза доставка с преглед" }
  }
];

// --- PHONE MODELS MAPPING PER BRAND ---
const BRAND_MODELS = {
  "Apple": ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 13 Pro Max", "iPhone 13", "Всички модели"],
  "Samsung": ["Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy S23 Ultra", "Galaxy S23", "Galaxy A55", "Всички модели"],
  "Xiaomi": ["Xiaomi 14 Ultra", "Xiaomi 13T Pro", "Redmi Note 13 Pro+", "Redmi Note 12 Pro", "Всички модели"],
  "Huawei": ["Pura 70 Ultra", "Mate 60 Pro", "P60 Pro", "Всички модели"],
  "Honor": ["Magic 6 Pro", "Honor 90", "Всички модели"],
  "MOTO": ["Edge 50 Ultra", "Edge 40", "Всички модели"],
  "Nokia": ["Nokia G42", "Nokia XR21", "Всички модели"],
  "OnePlus": ["OnePlus 12", "OnePlus Nord 4", "Всички модели"],
  "Oppo": ["Reno 12 Pro", "Всички модели"],
  "Vivo": ["X100 Pro", "Всички модели"],
  "Google": ["Pixel 8 Pro", "Pixel 8", "Pixel 7a", "Всички модели"],
  "TCL": ["TCL 505", "Всички модели"],
  "Realme": ["Realme GT 6", "Всички модели"],
  "LG": ["Velvet", "Всички модели"],
  "Lenovo": ["Legion Y90", "Всички модели"],
  "Infinix": ["Note 40 Pro", "Всички модели"]
};

// --- BRANDS LIST ---
const BRANDS = Object.keys(BRAND_MODELS);

// --- CATEGORIES LIST ---
const CATEGORIES = [
  { id: "cases", name: "Кейсове / Калъфи", image: "assets/cat_cases.png" },
  { id: "protectors", name: "Протектори за екран", image: "assets/cat_protectors.png" },
  { id: "car_acc", name: "Аксесоари за автомобил", image: "assets/cat_car_holder.png" },
  { id: "wireless_chargers", name: "Безжични зарядни", image: "assets/cat_wireless_charger.png" },
  { id: "all_chargers", name: "Зарядни устройства", image: "assets/cat_car_charger.png" },
  { id: "original_cables", name: "Кабели за зареждане", image: "assets/cat_cables.png" },
  { id: "desk_holder", name: "Поставки за бюро", image: "assets/cat_desk_stand.png" },
  { id: "selfie_stick", name: "Селфи стикове", image: "assets/cat_selfie_stick.png" },
  { id: "pop_socket", name: "Попсокет / Връзки", image: "assets/cat_pop_socket.png" },
  { id: "power_banks", name: "Външни батерии", image: "assets/cat_power_bank.png" }
];

// --- SHOPPING CART STATE ---
let cart = JSON.parse(localStorage.getItem('caseking_cart')) || [];
let activeQuickViewProduct = null;
let selectedBrand = null;
let selectedModel = null;
let selectedCategory = null;

// --- BRANDS LOGO MAPPING ---
const BRANDS_WITH_LOGOS = {
  "Apple": "logo_apple.png",
  "Samsung": "logo_samsung.png",
  "Xiaomi": "logo_xiaomi.png",
  "Huawei": "logo_huawei.png",
  "Google": "logo_google.png",
  "MOTO": "logo_moto.png"
};

// --- DYNAMIC RENDER FUNCTIONS ---
function renderBrands() {
  const container = document.getElementById("brands-list");
  if (!container) return;
  container.innerHTML = "";
  
  BRANDS.forEach(brand => {
    const btn = document.createElement("button");
    btn.className = "brand-pill-btn";
    if (selectedBrand === brand) {
      btn.classList.add("active");
    }
    btn.onclick = () => selectBrand(brand);
    
    if (BRANDS_WITH_LOGOS[brand]) {
      btn.innerHTML = `
        <img src="assets/${BRANDS_WITH_LOGOS[brand]}" alt="${brand}" class="brand-card-img" loading="lazy">
        <span class="brand-card-text">${brand}</span>
      `;
    } else {
      const firstLetter = brand.charAt(0);
      btn.innerHTML = `
        <div class="brand-placeholder-icon">${firstLetter}</div>
        <span class="brand-card-text">${brand}</span>
      `;
    }
    
    container.appendChild(btn);
  });
}

function selectBrand(brand) {
  selectedBrand = brand;
  selectedModel = null;
  selectedCategory = null;
  
  // Clear category card selections
  document.querySelectorAll(".category-card").forEach(card => card.classList.remove("active"));
  
  // Highlight selected brand pill
  const pills = document.querySelectorAll(".brand-pill-btn");
  pills.forEach(pill => {
    const textSpan = pill.querySelector(".brand-card-text");
    if ((textSpan && textSpan.textContent === brand) || pill.textContent === brand) {
      pill.classList.add("active");
    } else {
      pill.classList.remove("active");
    }
  });

  // Display Step 2 (Choose Model)
  const step2Title = document.getElementById("step2-title");
  const modelList = document.getElementById("models-list");
  if (step2Title && modelList) {
    step2Title.style.display = "block";
    step2Title.textContent = `СТЪПКА 2 - ИЗБЕРИ МОДЕЛ ЗА ${brand.toUpperCase()}:`;
    modelList.style.display = "grid";
    modelList.innerHTML = "";
    
    BRAND_MODELS[brand].forEach(model => {
      const btn = document.createElement("button");
      btn.className = "model-pill-btn";
      btn.onclick = () => selectModel(model);
      btn.innerHTML = `
        <div class="model-icon-box">
          <i class="fas fa-mobile-alt"></i>
        </div>
        <span class="model-card-text">${model}</span>
      `;
      modelList.appendChild(btn);
    });
    
    // Smooth scroll to models section
    step2Title.scrollIntoView({ behavior: "smooth" });
  }
}

function selectModel(model) {
  selectedModel = model;
  
  // Highlight selected model pill
  const pills = document.querySelectorAll(".model-pill-btn");
  pills.forEach(pill => {
    const textSpan = pill.querySelector(".model-card-text");
    if ((textSpan && textSpan.textContent === model) || pill.textContent === model) {
      pill.classList.add("active");
    } else {
      pill.classList.remove("active");
    }
  });
  
  // Render filtered catalog
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

  // Clear active steps states visual cues
  document.querySelectorAll(".brand-pill-btn, .model-pill-btn").forEach(p => p.classList.remove("active"));
  const step2Title = document.getElementById("step2-title");
  const modelList = document.getElementById("models-list");
  if (step2Title && modelList) {
    step2Title.style.display = "none";
    modelList.style.display = "none";
  }

  // Highlight active category card
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

  // Apply Brand/Model filter or Category filter
  if (selectedModel) {
    if (selectedModel === "Всички модели") {
      filteredProducts = PRODUCTS.filter(p => p.brand === selectedBrand || p.brand === "Всички");
    } else {
      filteredProducts = PRODUCTS.filter(p => p.model === selectedModel || p.model === "Всички модели" || p.brand === "Всички");
    }
    if (catalogTitle) catalogTitle.textContent = `Аксесоари за ${selectedModel}`;
  } else if (selectedCategory) {
    filteredProducts = PRODUCTS.filter(p => p.category === selectedCategory);
    const catObj = CATEGORIES.find(c => c.id === selectedCategory);
    if (catalogTitle && catObj) catalogTitle.textContent = catObj.name;
  } else {
    if (catalogTitle) catalogTitle.textContent = "Всички Продукти";
  }
  
  if (filteredProducts.length === 0) {
    grid.innerHTML = `<div class="no-products-message">Няма намерени продукти за избрания филтър.</div>`;
    return;
  }
  
  filteredProducts.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    
    let ratingStars = "";
    for (let i = 1; i <= 5; i++) {
      ratingStars += `<i class="${i <= product.rating ? 'fas' : 'far'} fa-star"></i>`;
    }
    
    const tagHtml = product.tag ? `<span class="badge-tag sale">${product.tag}</span>` : "";
    
    const priceHtml = product.oldPrice 
      ? `<span class="product-price old-price">${product.oldPrice.toFixed(2)} лв.</span>
         <span class="product-price" style="color: var(--accent);">${product.price.toFixed(2)} лв.</span>`
      : `<span class="product-price">${product.price.toFixed(2)} лв.</span>`;

    card.innerHTML = `
      ${tagHtml}
      <div class="product-image-container">
        <img class="product-img" src="${product.image}" alt="${product.name}" loading="lazy">
        <div class="product-overlay-actions">
          <button class="action-icon-btn" onclick="openQuickView(${product.id})" title="Бърз преглед">
            <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </button>
        </div>
      </div>
      <div class="product-details">
        <span class="product-category">${product.brand}</span>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-rating">${ratingStars}</div>
        <div class="product-price-box">
          ${priceHtml}
        </div>
        <button class="btn-card-buy" onclick="addToCart(${product.id}, 1)">Добави в количката</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// --- CART STATE SYNC & RENDERING ---
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

function addToCart(productId, quantity = 1) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  
  const existingItemIndex = cart.findIndex(item => item.id === productId);
  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({ ...product, quantity });
  }
  
  saveCart();
  openCartSidebar();
}

function updateCartItemQty(productId, newQty) {
  const index = cart.findIndex(item => item.id === productId);
  if (index === -1) return;
  
  if (newQty <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index].quantity = newQty;
  }
  saveCart();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
}

function renderCartItems() {
  const itemsContainer = document.getElementById("cart-items");
  const subtotalEl = document.getElementById("cart-subtotal");
  const checkoutFormEl = document.getElementById("cart-checkout-form");
  
  if (!itemsContainer || !subtotalEl) return;
  
  if (cart.length === 0) {
    itemsContainer.innerHTML = `<div class="cart-empty-message">Вашата количка е празна.</div>`;
    subtotalEl.textContent = "0.00 лв.";
    if (checkoutFormEl) checkoutFormEl.classList.remove("active");
    return;
  }
  
  itemsContainer.innerHTML = "";
  let subtotal = 0;
  
  cart.forEach(item => {
    subtotal += item.price * item.quantity;
    
    const itemRow = document.createElement("div");
    itemRow.className = "cart-item";
    itemRow.innerHTML = `
      <img class="cart-item-img" src="${item.image}" alt="${item.name}">
      <div class="cart-item-details">
        <h4 class="cart-item-name">${item.name}</h4>
        <span class="cart-item-price">${item.price.toFixed(2)} лв.</span>
        <div class="cart-item-qty-row">
          <button class="cart-qty-btn" onclick="updateCartItemQty(${item.id}, ${item.quantity - 1})">-</button>
          <span class="cart-qty-val">${item.quantity}</span>
          <button class="cart-qty-btn" onclick="updateCartItemQty(${item.id}, ${item.quantity + 1})">+</button>
        </div>
      </div>
      <button class="cart-item-remove-btn" onclick="removeFromCart(${item.id})" title="Премахни">
        <svg style="width: 18px; height: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
      </button>
    `;
    itemsContainer.appendChild(itemRow);
  });
  
  subtotalEl.textContent = `${subtotal.toFixed(2)} лв.`;
  if (checkoutFormEl) checkoutFormEl.classList.add("active");
}

function openCartSidebar() {
  document.getElementById("cart-overlay").classList.add("active");
}

function closeCartSidebar() {
  document.getElementById("cart-overlay").classList.remove("active");
}

function openQuickView(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  
  activeQuickViewProduct = product;
  
  document.getElementById("modal-cat").textContent = product.brand;
  document.getElementById("modal-title").textContent = product.name;
  document.getElementById("modal-desc").textContent = product.description;
  document.getElementById("modal-image").src = product.image;
  document.getElementById("modal-image").alt = product.name;
  
  document.getElementById("spec-metal").textContent = product.specs.material;
  document.getElementById("spec-weight").textContent = product.specs.weight;
  document.getElementById("spec-stone").textContent = product.specs.origin;
  document.getElementById("spec-packaging").textContent = product.specs.delivery;
  
  let ratingStars = "";
  for (let i = 1; i <= 5; i++) {
    ratingStars += `<i class="${i <= product.rating ? 'fas' : 'far'} fa-star"></i>`;
  }
  document.getElementById("modal-stars").innerHTML = ratingStars;
  
  const priceBox = document.getElementById("modal-price");
  if (product.oldPrice) {
    priceBox.innerHTML = `
      <span style="font-size: 1.2rem; color: var(--text-muted); text-decoration: line-through; font-weight: 500;">${product.oldPrice.toFixed(2)} лв.</span>
      <span style="color: var(--accent);">${product.price.toFixed(2)} лв.</span>
    `;
  } else {
    priceBox.innerHTML = `<span>${product.price.toFixed(2)} лв.</span>`;
  }
  
  document.getElementById("modal-qty-val").textContent = "1";
  document.getElementById("quickview-overlay").classList.add("active");
}

function closeQuickView() {
  document.getElementById("quickview-overlay").classList.remove("active");
  activeQuickViewProduct = null;
}

function handleCheckout(event) {
  event.preventDefault();
  
  const name = document.getElementById("checkout-name").value.trim();
  const phone = document.getElementById("checkout-phone").value.trim();
  const address = document.getElementById("checkout-address").value.trim();
  
  if (!name || !phone || !address) {
    alert("Моля попълнете всички задължителни полета за бърза поръчка!");
    return;
  }
  
  const orderNum = "CK-" + Math.floor(100000 + Math.random() * 900000);
  document.getElementById("order-tracking-id").textContent = orderNum;
  document.getElementById("success-screen").classList.add("active");
  
  cart = [];
  saveCart();
  closeCartSidebar();
}

function closeSuccessScreen() {
  document.getElementById("success-screen").classList.remove("active");
  document.getElementById("checkout-form-id").reset();
}

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  renderBrands();
  renderCategories();
  renderCatalog();
  updateCartCount();
  renderCartItems();
  
  window.addEventListener("scroll", () => {
    const header = document.querySelector("header");
    if (window.scrollY > 30) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
  
  const qtyDecBtn = document.getElementById("modal-qty-dec");
  const qtyIncBtn = document.getElementById("modal-qty-inc");
  const qtyValEl = document.getElementById("modal-qty-val");
  
  if (qtyDecBtn && qtyIncBtn && qtyValEl) {
    qtyDecBtn.addEventListener("click", () => {
      let currentVal = parseInt(qtyValEl.textContent);
      if (currentVal > 1) {
        qtyValEl.textContent = (currentVal - 1).toString();
      }
    });
    
    qtyIncBtn.addEventListener("click", () => {
      let currentVal = parseInt(qtyValEl.textContent);
      qtyValEl.textContent = (currentVal + 1).toString();
    });
  }
  
  const modalAddBtn = document.getElementById("modal-add-to-cart");
  if (modalAddBtn) {
    modalAddBtn.addEventListener("click", () => {
      if (activeQuickViewProduct) {
        const qty = parseInt(qtyValEl.textContent);
        addToCart(activeQuickViewProduct.id, qty);
        closeQuickView();
      }
    });
  }
  
  const formElement = document.getElementById("checkout-form-id");
  if (formElement) {
    formElement.addEventListener("submit", handleCheckout);
  }
});
