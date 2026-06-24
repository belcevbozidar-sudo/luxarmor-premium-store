import { ConvexHttpClient } from "https://cdn.jsdelivr.net/npm/convex@1.38.0/browser/+esm";

const convex = new ConvexHttpClient("https://trustworthy-possum-230.eu-west-1.convex.cloud");

let adminToken = localStorage.getItem("caseking_admin_token") || null;
let allProducts = [];
let allBrands = [];
let allModels = [];
let allPromotions = [];
let allOrders = [];
let allBlogPosts = [];
let blogPostCoverImage = "";
let allPageMetadata = [];

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

let allCategories = [...STATIC_CATEGORIES];
let uploadedImages = [];
let selectedBrandFilter = null;
let allUsers = [];
let allPromoCodes = [];
let parsedCSVProducts = [];

// --- PRICE FORMATTING HELPER ---
function formatAdminPrice(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return "0.00 €";
  return `${num.toFixed(2)} €`;
}

// --- PAGINATION & FILTER STATE ---
let productsPage = 1;
const productsPerPage = 50;
let searchQuery = "";
let selectedFilterBrand = "";
let selectedFilterCategory = "";

let ordersPage = 1;
const ordersPerPage = 50;
let orderSearchQuery = "";
let orderFilterStatus = "";
let orderFilterType = "";

let modelsPage = 1;
const modelsPerPage = 50;
let modelSearchQuery = "";

// --- CANVAS BROWSER FINGERPRINT ---
function getBrowserFingerprint() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return "standard_fingerprint_fallback";
  
  ctx.textBaseline = "top";
  ctx.font = "14px 'Arial'";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f60";
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = "#069";
  ctx.fillText("CaseKingAdminFingerprintVal", 2, 15);
  ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
  ctx.fillText("CaseKingAdminFingerprintVal", 4, 17);
  const result = canvas.toDataURL();
  
  const parts = [
    result,
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset()
  ];
  
  let hash = 0;
  const str = parts.join("||");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

const fingerprint = getBrowserFingerprint();

// --- INITIAL LOAD & AUTH CHECK ---
async function checkAuth() {
  // Check server-side lock first
  try {
    const lock = await convex.query("admin:getLockStatus", { fingerprint });
    if (lock.isLocked) {
      showLockoutScreen(lock.lockedUntil);
      return;
    }
  } catch (err) {
    console.error("Lock status check failed", err);
  }

  if (adminToken) {
    document.getElementById("login-overlay").classList.add("hidden");
    loadDashboardData();
  } else {
    document.getElementById("login-overlay").classList.remove("hidden");
  }
}

function showLockoutScreen(lockedUntil) {
  const overlay = document.getElementById("login-overlay");
  overlay.classList.remove("hidden");
  document.getElementById("admin-pass").disabled = true;
  document.getElementById("btn-login-submit").disabled = true;
  
  const errorBox = document.getElementById("login-error-msg");
  errorBox.style.display = "block";
  
  function updateCountdown() {
    const now = Date.now();
    const diff = lockedUntil - now;
    if (diff <= 0) {
      document.getElementById("admin-pass").disabled = false;
      document.getElementById("btn-login-submit").disabled = false;
      errorBox.style.display = "none";
      document.getElementById("login-subtitle").textContent = "Моля, въведете сигурната парола за достъп.";
    } else {
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      document.getElementById("login-subtitle").textContent = `Заключен достъп! Моля изчакайте ${mins}м ${secs}с.`;
      errorBox.textContent = `Твърде много грешни опити. Защитно заключване за 60 минути.`;
      setTimeout(updateCountdown, 1000);
    }
  }
  updateCountdown();
}

window.attemptAdminLogin = async function() {
  const password = document.getElementById("admin-pass").value;
  const remember = document.getElementById("remember-me").checked;
  const errorBox = document.getElementById("login-error-msg");
  
  errorBox.style.display = "none";
  
  try {
    const res = await convex.mutation("admin:verifyAdminPassword", { password, fingerprint });
    if (res.success) {
      adminToken = res.token;
      if (remember) {
        localStorage.setItem("caseking_admin_token", res.token);
      }
      document.getElementById("login-overlay").classList.add("hidden");
      loadDashboardData();
    } else {
      errorBox.textContent = res.error;
      errorBox.style.display = "block";
      if (res.lockedUntil) {
        showLockoutScreen(res.lockedUntil);
      }
    }
  } catch (err) {
    errorBox.textContent = "Възникна системна грешка при вход.";
    errorBox.style.display = "block";
  }
};

window.adminLogout = function() {
  adminToken = null;
  localStorage.removeItem("caseking_admin_token");
  window.location.href = "/";
};

window.redirectToHome = function() {
  window.location.href = "/";
};

window.toggleAdminMobileMenu = function() {
  const sidebar = document.getElementById("admin-sidebar");
  if (sidebar) {
    sidebar.classList.toggle("active");
  }
};

// --- DATA FETCHING & RENDERING ---
async function loadDashboardData() {
  try {
    allProducts = await convex.query("products:get");
    allBrands = await convex.query("meta:getBrands");
    allModels = await convex.query("meta:getModels");
    
    try {
      const dbCats = await convex.query("meta:getCategories");
      if (dbCats && dbCats.length > 0) {
        allCategories = dbCats;
      }
    } catch (catErr) {
      console.warn("Could not load categories from db, using static fallback", catErr);
    }
    
    allPromotions = await convex.query("promotions:getAll");
    allOrders = await convex.query("orders:get");
    
    try {
      allUsers = await convex.query("users:get");
    } catch (userErr) {
      console.warn("Could not load users from db:", userErr);
    }
    
    try {
      allPromoCodes = await convex.query("promoCodes:get");
    } catch (promoErr) {
      console.warn("Could not load promo codes from db:", promoErr);
    }
    
    try {
      allBlogPosts = await convex.query("blog:getAll");
    } catch (blogErr) {
      console.warn("Could not load blog posts from db:", blogErr);
    }
    
    renderProducts();
    renderBrandsAndModels();
    renderPromotions();
    renderOrders();
    renderDashboardStats();
    renderPromoCodes();
    renderB2BUsers();
    renderBlogPosts();
    
    try {
      const heroSettings = await convex.query("settings:getHero");
      if (heroSettings) {
        document.getElementById("hero-title-input").value = heroSettings.heroTitle;
        document.getElementById("hero-subtitle-input").value = heroSettings.heroSubtitle;
      }
    } catch (heroErr) {
      console.warn("Could not load hero settings from db:", heroErr);
    }

    try {
      allPageMetadata = await convex.query("settings:getAllPageMetadata");
      loadPageSeoValues();
    } catch (seoErr) {
      console.warn("Could not load SEO page metadata from db:", seoErr);
    }

    populateFormSelects();
  } catch (err) {
    console.error("Error loading dashboard data:", err);
    alert("Грешка при зареждане на данните!");
  }
}

// Populate dropdown lists in modals and search filters
function populateFormSelects() {
  const brandSelect = document.getElementById("product-brand");
  const metaBrandSelect = document.getElementById("model-brand-select");
  const giftSelect = document.getElementById("promo-gift-product");
  const categorySelect = document.getElementById("product-category");
  
  const filterBrandSelect = document.getElementById("admin-product-filter-brand");
  const filterCatSelect = document.getElementById("admin-product-filter-category");
  
  let brandHtml = '<option value="">-- Избери марка --</option>';
  let metaBrandHtml = '<option value="">-- Избери марка --</option>';
  let filterBrandHtml = '<option value="">Всички марки</option>';
  
  allBrands.forEach(b => {
    const opt = `<option value="${b.name}">${b.name}</option>`;
    brandHtml += opt;
    metaBrandHtml += opt;
    filterBrandHtml += opt;
  });
  
  brandSelect.innerHTML = brandHtml;
  metaBrandSelect.innerHTML = metaBrandHtml;
  if (filterBrandSelect) filterBrandSelect.innerHTML = filterBrandHtml;
  
  let giftHtml = '<option value="">-- Избери подарък --</option>';
  allProducts.forEach(p => {
    giftHtml += `<option value="${p._id}">${p.name} (${p.brand})</option>`;
  });
  giftSelect.innerHTML = giftHtml;
  
  let categoryHtml = '<option value="">-- Избери категория --</option>';
  let filterCatHtml = '<option value="">Всички категории</option>';
  allCategories.forEach(cat => {
    const opt = `<option value="${cat.id}">${cat.name}</option>`;
    categoryHtml += opt;
    filterCatHtml += opt;
  });
  categorySelect.innerHTML = categoryHtml;
  if (filterCatSelect) filterCatSelect.innerHTML = filterCatHtml;
}

// Update model choices based on selected brand
window.updateProductModelOptions = function() {
  const selectedBrand = document.getElementById("product-brand").value;
  const modelSelect = document.getElementById("product-model");
  
  let html = '<option value="Всички модели">Всички модели</option>';
  
  const filteredModels = allModels.filter(m => m.brand === selectedBrand);
  filteredModels.forEach(m => {
    html += `<option value="${m.name}">${m.name}</option>`;
  });
  
  modelSelect.innerHTML = html;
};

// Tab Switcher
window.switchTab = function(tabId, btn) {
  document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.remove("active"));
  document.querySelectorAll(".nav-tab-btn").forEach(button => button.classList.remove("active"));
  
  document.getElementById(tabId).classList.add("active");
  btn.classList.add("active");
  
  // Close sidebar drawer on mobile
  const sidebar = document.getElementById("admin-sidebar");
  if (sidebar) {
    sidebar.classList.remove("active");
  }
};

// --- TAB 1: PRODUCTS LOGIC ---
function renderProducts() {
  const tbody = document.getElementById("products-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  
  // Filter products
  let filtered = allProducts;
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.brand.toLowerCase().includes(query) || 
      p.model.toLowerCase().includes(query)
    );
  }
  if (selectedFilterBrand) {
    filtered = filtered.filter(p => p.brand === selectedFilterBrand);
  }
  if (selectedFilterCategory) {
    filtered = filtered.filter(p => p.category === selectedFilterCategory);
  }
  
  // Paginate products
  const limit = productsPage * productsPerPage;
  const sliced = filtered.slice(0, limit);
  
  sliced.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img src="${p.image}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;"></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.brand}</td>
      <td>${p.model}</td>
      <td><span class="admin-badge" style="font-size:0.7rem;">${p.category}</span></td>
      <td>${formatAdminPrice(p.priceB2C)}</td>
      <td>${formatAdminPrice(p.priceB2B)}</td>
      <td>
        <div class="row-actions">
          <button class="btn-icon" onclick="openProductModal('${p._id}')" title="Редактирай"><i class="fas fa-edit"></i></button>
          <button class="btn-icon delete" onclick="deleteProduct('${p._id}')" title="Изтрий"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  // Toggle load more button
  const loadMoreContainer = document.getElementById("products-load-more-container");
  if (loadMoreContainer) {
    if (filtered.length > limit) {
      loadMoreContainer.style.display = "block";
    } else {
      loadMoreContainer.style.display = "none";
    }
  }
}

// Search & Filter event handlers for products
window.handleProductSearch = function() {
  searchQuery = document.getElementById("admin-product-search").value || "";
  selectedFilterBrand = document.getElementById("admin-product-filter-brand").value || "";
  selectedFilterCategory = document.getElementById("admin-product-filter-category").value || "";
  productsPage = 1; // Reset to page 1 on search filter change
  renderProducts();
};

window.loadMoreProducts = function() {
  productsPage++;
  renderProducts();
};

window.openProductModal = function(productId = null) {
  const modal = document.getElementById("product-modal");
  const form = document.getElementById("product-form");
  form.reset();
  
  populateFormSelects();
  
  if (productId) {
    document.getElementById("product-modal-title").textContent = "Редактиране на Продукт";
    const p = allProducts.find(item => item._id === productId);
    if (p) {
      document.getElementById("product-id").value = p._id;
      document.getElementById("product-name").value = p.name;
      document.getElementById("product-brand").value = p.brand;
      
      // Update models dropdown and select the right model
      updateProductModelOptions();
      document.getElementById("product-model").value = p.model;
      
      document.getElementById("product-category").value = p.category;
      document.getElementById("product-tag").value = p.tag || "";
      document.getElementById("product-price-b2c").value = p.priceB2C || "";
      document.getElementById("product-old-price-b2c").value = p.oldPriceB2C || "";
      document.getElementById("product-price-b2b").value = p.priceB2B || "";
      document.getElementById("product-old-price-b2b").value = p.oldPriceB2B || "";
      
      uploadedImages = p.images || (p.image ? [p.image] : []);
      renderImagePreviews();
      
      document.getElementById("product-desc").value = p.description;
      document.getElementById("product-spec-material").value = p.specs.material;
      document.getElementById("product-spec-weight").value = p.specs.weight;
      document.getElementById("product-spec-origin").value = p.specs.origin;
      document.getElementById("product-spec-delivery").value = p.specs.delivery;
    }
  } else {
    document.getElementById("product-modal-title").textContent = "Добавяне на Нов Продукт";
    document.getElementById("product-id").value = "";
    document.getElementById("product-model").innerHTML = '<option value="Всички модели">Всички модели</option>';
    uploadedImages = [];
    renderImagePreviews();
  }
  
  modal.classList.add("active");
};

window.closeProductModal = function() {
  document.getElementById("product-modal").classList.remove("active");
};

function renderImagePreviews() {
  const container = document.getElementById("product-images-preview");
  if (!container) return;
  container.innerHTML = "";
  
  uploadedImages.forEach((imgSrc, idx) => {
    const card = document.createElement("div");
    card.className = "image-preview-card";
    card.setAttribute("draggable", "true");
    card.setAttribute("data-index", idx);
    card.style.cssText = "position: relative; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; overflow: hidden; aspect-ratio: 1/1; background: #000; cursor: grab; user-select: none;";
    
    card.innerHTML = `
      <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;">
      <div class="drag-handle-rect" style="position: absolute; bottom: 4px; left: 4px; right: 4px; height: 24px; background: rgba(0,0,0,0.85); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: var(--gold); border: 1px solid var(--gold); cursor: grab; user-select: none; pointer-events: none;">
        <i class="fas fa-arrows-alt" style="margin-right: 4px;"></i> Издърпай
      </div>
      <button type="button" class="btn-delete-image" style="position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border-radius: 50%; background: rgba(231,76,60,0.8); border: none; color: #fff; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;">&times;</button>
    `;
    
    // Add delete handler
    card.querySelector(".btn-delete-image").addEventListener("click", (e) => {
      e.stopPropagation();
      uploadedImages.splice(idx, 1);
      renderImagePreviews();
    });
    
    container.appendChild(card);
  });
  
  setupDragAndDrop();
}

function setupDragAndDrop() {
  const container = document.getElementById("product-images-preview");
  if (!container) return;
  const cards = container.querySelectorAll(".image-preview-card");
  
  let draggedCard = null;
  
  // Desktop Drag Events
  cards.forEach(card => {
    card.addEventListener("dragstart", (e) => {
      draggedCard = card;
      card.style.opacity = "0.5";
      e.dataTransfer.effectAllowed = "move";
    });
    
    card.addEventListener("dragend", () => {
      draggedCard = null;
      card.style.opacity = "1";
      // Update our array based on new DOM order
      const newImages = [];
      container.querySelectorAll(".image-preview-card").forEach(c => {
        const idx = parseInt(c.getAttribute("data-index"));
        newImages.push(uploadedImages[idx]);
      });
      uploadedImages = newImages;
      renderImagePreviews();
    });
    
    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      
      if (card === draggedCard) return;
      
      const rect = card.getBoundingClientRect();
      const next = (e.clientX - rect.left) > (rect.width / 2);
      
      if (next) {
        card.after(draggedCard);
      } else {
        card.before(draggedCard);
      }
    });
  });
  
  // Touch Devices Events support
  let activeTouchCard = null;
  
  cards.forEach(card => {
    card.addEventListener("touchstart", (e) => {
      activeTouchCard = card;
      card.style.opacity = "0.5";
      card.style.zIndex = "1000";
    }, { passive: true });
    
    card.addEventListener("touchmove", (e) => {
      if (!activeTouchCard) return;
      const touch = e.touches[0];
      
      // Prevent scrolling while dragging
      e.preventDefault();
      
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetCard = element ? element.closest(".image-preview-card") : null;
      
      if (targetCard && targetCard !== activeTouchCard && targetCard.parentNode === container) {
        const rect = targetCard.getBoundingClientRect();
        const next = (touch.clientX - rect.left) > (rect.width / 2);
        if (next) {
          targetCard.after(activeTouchCard);
        } else {
          targetCard.before(activeTouchCard);
        }
      }
    }, { passive: false });
    
    card.addEventListener("touchend", () => {
      if (!activeTouchCard) return;
      activeTouchCard.style.opacity = "1";
      activeTouchCard.style.zIndex = "";
      activeTouchCard = null;
      
      const newImages = [];
      container.querySelectorAll(".image-preview-card").forEach(c => {
        const idx = parseInt(c.getAttribute("data-index"));
        newImages.push(uploadedImages[idx]);
      });
      uploadedImages = newImages;
      renderImagePreviews();
    });
  });
}

window.saveProduct = async function(event) {
  event.preventDefault();
  
  const id = document.getElementById("product-id").value;
  const productData = {
    name: document.getElementById("product-name").value,
    brand: document.getElementById("product-brand").value,
    model: document.getElementById("product-model").value,
    category: document.getElementById("product-category").value,
    tag: document.getElementById("product-tag").value || null,
    priceB2C: parseFloat(document.getElementById("product-price-b2c").value),
    oldPriceB2C: document.getElementById("product-old-price-b2c").value ? parseFloat(document.getElementById("product-old-price-b2c").value) : null,
    priceB2B: parseFloat(document.getElementById("product-price-b2b").value),
    oldPriceB2B: document.getElementById("product-old-price-b2b").value ? parseFloat(document.getElementById("product-old-price-b2b").value) : null,
    image: uploadedImages[0] || "",
    images: uploadedImages,
    rating: 5,
    description: document.getElementById("product-desc").value,
    specs: {
      material: document.getElementById("product-spec-material").value,
      weight: document.getElementById("product-spec-weight").value,
      origin: document.getElementById("product-spec-origin").value,
      delivery: document.getElementById("product-spec-delivery").value
    }
  };
  
  try {
    if (id) {
      await convex.mutation("products:update", { id, ...productData });
    } else {
      await convex.mutation("products:create", productData);
    }
    closeProductModal();
    loadDashboardData();
  } catch (err) {
    alert("Грешка при запис на продукта: " + err.message);
  }
};

window.deleteProduct = async function(productId) {
  if (confirm("Наистина ли искате да изтриете този продукт?")) {
    try {
      await convex.mutation("products:remove", { id: productId });
      loadDashboardData();
    } catch (err) {
      alert("Грешка при изтриване: " + err.message);
    }
  }
};

function renderBrandsAndModels() {
  // Render Categories
  const categoriesContainer = document.getElementById("categories-list");
  if (categoriesContainer) {
    categoriesContainer.innerHTML = "";
    allCategories.forEach(cat => {
      const div = document.createElement("div");
      div.className = "meta-item";
      div.innerHTML = `
        <div class="meta-item-info" style="flex:1; display:flex; align-items:center; gap:0.75rem;">
          <img src="${cat.image.startsWith('data:') ? cat.image : (cat.image.startsWith('assets/') ? cat.image : `assets/${cat.image}`)}" class="meta-logo-preview" onerror="this.style.display='none'">
          <strong>${cat.name}</strong> <span style="font-size:0.75rem; color:var(--text-muted);">(${cat.id})</span>
        </div>
        <button class="btn-icon delete" onclick="deleteCategory('${cat._id}')" title="Изтрий категория"><i class="fas fa-trash"></i></button>
      `;
      categoriesContainer.appendChild(div);
    });
  }

  // Render Brands
  const brandsContainer = document.getElementById("brands-list");
  brandsContainer.innerHTML = "";
  
  allBrands.forEach(b => {
    const div = document.createElement("div");
    div.className = "meta-item" + (selectedBrandFilter === b.name ? " selected" : "");
    div.style.cursor = "pointer";
    div.innerHTML = `
      <div class="meta-item-info" style="flex:1; display:flex; align-items:center; gap:0.75rem;">
        <img src="${b.logo.startsWith('data:') ? b.logo : `assets/${b.logo}`}" class="meta-logo-preview" onerror="this.style.display='none'">
        <strong>${b.name}</strong>
      </div>
      <button class="btn-icon delete" onclick="event.stopPropagation(); deleteBrand('${b._id}')" title="Изтрий марка"><i class="fas fa-trash"></i></button>
    `;
    
    div.addEventListener("click", () => {
      if (selectedBrandFilter === b.name) {
        selectedBrandFilter = null;
      } else {
        selectedBrandFilter = b.name;
        // Reset search query when brand is clicked to avoid empty list confusion
        modelSearchQuery = "";
        const searchInput = document.getElementById("admin-model-search");
        if (searchInput) searchInput.value = "";
      }
      modelsPage = 1;
      renderBrandsAndModels();
    });
    
    brandsContainer.appendChild(div);
  });
  
  // Render Models
  const modelsContainer = document.getElementById("models-list");
  modelsContainer.innerHTML = "";
  
  const titleSpan = document.getElementById("models-panel-title");
  if (selectedBrandFilter) {
    titleSpan.innerHTML = `Модели за <span style="color:var(--gold); font-weight:700;">${selectedBrandFilter}</span>`;
  } else if (modelSearchQuery) {
    titleSpan.innerHTML = `Резултати за <span style="color:var(--gold); font-weight:700;">"${modelSearchQuery}"</span>`;
  } else {
    titleSpan.textContent = "Всички Модели";
  }
  
  let filteredModels = allModels;
  if (selectedBrandFilter) {
    filteredModels = filteredModels.filter(m => m.brand === selectedBrandFilter);
  }
  
  if (modelSearchQuery) {
    const query = modelSearchQuery.toLowerCase();
    filteredModels = filteredModels.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.brand.toLowerCase().includes(query)
    );
  }
  
  // Avoid freezing by rendering thousands of models on empty load
  if (!selectedBrandFilter && !modelSearchQuery) {
    modelsContainer.innerHTML = `
      <div style="text-align:center; padding:2.5rem 1rem; color:var(--text-muted); font-size:0.9rem; width:100%; box-sizing:border-box;">
        <i class="fas fa-mobile-alt" style="font-size:2rem; margin-bottom:0.75rem; display:block; color:var(--gold);"></i>
        Изберете марка отляво или въведете име на модел в търсачката по-горе.
      </div>
    `;
    const loadMoreContainer = document.getElementById("models-load-more-container");
    if (loadMoreContainer) loadMoreContainer.style.display = "none";
    return;
  }
  
  if (filteredModels.length === 0) {
    modelsContainer.innerHTML = `
      <div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); font-size:0.9rem; width:100%;">
        Няма намерени модели.
      </div>
    `;
    const loadMoreContainer = document.getElementById("models-load-more-container");
    if (loadMoreContainer) loadMoreContainer.style.display = "none";
    return;
  }
  
  const limit = modelsPage * modelsPerPage;
  const sliced = filteredModels.slice(0, limit);
  
  let html = "";
  sliced.forEach(m => {
    html += `
      <div class="meta-item">
        <span><strong>${m.brand}</strong> - ${m.name}</span>
        <button class="btn-icon delete" onclick="deleteModel('${m._id}')" title="Изтрий модел"><i class="fas fa-trash"></i></button>
      </div>
    `;
  });
  modelsContainer.innerHTML = html;
  
  const loadMoreContainer = document.getElementById("models-load-more-container");
  if (loadMoreContainer) {
    if (filteredModels.length > limit) {
      loadMoreContainer.style.display = "block";
    } else {
      loadMoreContainer.style.display = "none";
    }
  }
}

window.handleModelSearch = function() {
  modelSearchQuery = document.getElementById("admin-model-search").value || "";
  modelsPage = 1;
  renderBrandsAndModels();
};

window.loadMoreModels = function() {
  modelsPage++;
  renderBrandsAndModels();
};

// Helper to read and compress file to base64 WebP
function getBase64Image(fileInput, maxWidth = 400, maxHeight = 400) {
  return new Promise((resolve, reject) => {
    const file = fileInput.files[0];
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      compressImage(e.target.result, maxWidth, maxHeight, 0.8)
        .then(resolve)
        .catch(reject);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

window.openBrandModal = function() {
  document.getElementById("brand-name-input").value = "";
  document.getElementById("brand-logo-input").value = "";
  const previewDiv = document.getElementById("brand-logo-preview");
  if (previewDiv) {
    previewDiv.style.display = "none";
    previewDiv.querySelector("img").src = "";
  }
  document.getElementById("brand-modal").classList.add("active");
};
window.closeBrandModal = function() {
  document.getElementById("brand-modal").classList.remove("active");
};
window.saveBrand = async function(event) {
  event.preventDefault();
  const name = document.getElementById("brand-name-input").value.trim();
  const logoInput = document.getElementById("brand-logo-input");
  
  try {
    const logoBase64 = await getBase64Image(logoInput, 300, 300);
    if (!logoBase64) {
      alert("Моля, изберете лого за марката!");
      return;
    }
    await convex.mutation("meta:addBrand", { name, logo: logoBase64 });
    closeBrandModal();
    loadDashboardData();
  } catch (err) {
    alert("Грешка при добавяне на марка: " + err.message);
  }
};
window.deleteBrand = async function(brandId) {
  if (confirm("Внимание: Това може да повлияе на филтрите за продукти. Изтриване?")) {
    try {
      await convex.mutation("meta:removeBrand", { id: brandId });
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    }
  }
};

window.openModelModal = function() {
  const select = document.getElementById("model-brand-select");
  let html = '<option value="">-- Избери марка --</option>';
  allBrands.forEach(b => {
    html += `<option value="${b.name}">${b.name}</option>`;
  });
  select.innerHTML = html;
  document.getElementById("model-modal").classList.add("active");
};
window.closeModelModal = function() {
  document.getElementById("model-modal").classList.remove("active");
};
window.saveModel = async function(event) {
  event.preventDefault();
  const brand = document.getElementById("model-brand-select").value;
  const name = document.getElementById("model-name-input").value.trim();
  
  try {
    await convex.mutation("meta:addModel", { brand, name });
    closeModelModal();
    loadDashboardData();
  } catch (err) {
    alert(err.message);
  }
};
window.deleteModel = async function(modelId) {
  if (confirm("Наистина ли искате да изтриете този модел?")) {
    try {
      await convex.mutation("meta:removeModel", { id: modelId });
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    }
  }
};

// --- TAB 3: PROMOTIONS LOGIC ---
function renderPromotions() {
  const tbody = document.getElementById("promotions-table-body");
  tbody.innerHTML = "";
  
  allPromotions.forEach(p => {
    let promoTypeStr = p.type === "free_shipping" ? "Безплатна доставка" : "Подарък продукт";
    let giftName = "Няма";
    if (p.type === "gift" && p.giftProductId) {
      const giftProd = allProducts.find(item => item._id === p.giftProductId);
      giftName = giftProd ? giftProd.name : "Неизвестен продукт";
    }
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${p.clientType}</strong></td>
      <td>${promoTypeStr}</td>
      <td>над ${formatAdminPrice(p.threshold)}</td>
      <td>${giftName}</td>
      <td>
        <span class="badge-status ${p.active ? 'completed' : 'cancelled'}">
          ${p.active ? 'Активна' : 'Неактивна'}
        </span>
      </td>
      <td>
        <div class="row-actions">
          <button class="btn-icon" onclick="openPromotionModal('${p._id}')" title="Редактирай"><i class="fas fa-edit"></i></button>
          <button class="btn-icon delete" onclick="deletePromotion('${p._id}')" title="Изтрий"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.openPromotionModal = function(promoId = null) {
  const modal = document.getElementById("promotion-modal");
  const form = document.getElementById("promotion-form");
  form.reset();
  
  populateFormSelects();
  
  if (promoId) {
    document.getElementById("promotion-modal-title").textContent = "Редактиране на Промоция";
    const p = allPromotions.find(item => item._id === promoId);
    if (p) {
      document.getElementById("promo-id").value = p._id;
      document.getElementById("promo-client-type").value = p.clientType;
      document.getElementById("promo-type").value = p.type;
      document.getElementById("promo-threshold").value = p.threshold;
      
      togglePromoGiftSelect();
      if (p.type === "gift") {
        document.getElementById("promo-gift-product").value = p.giftProductId || "";
      }
      document.getElementById("promo-active").checked = p.active;
    }
  } else {
    document.getElementById("promotion-modal-title").textContent = "Създаване на Промоция";
    document.getElementById("promo-id").value = "";
    document.getElementById("promo-gift-group").style.display = "none";
  }
  
  modal.classList.add("active");
};

window.closePromotionModal = function() {
  document.getElementById("promotion-modal").classList.remove("active");
};

window.togglePromoGiftSelect = function() {
  const type = document.getElementById("promo-type").value;
  const giftGroup = document.getElementById("promo-gift-group");
  if (type === "gift") {
    giftGroup.style.display = "block";
  } else {
    giftGroup.style.display = "none";
  }
};

window.togglePromoActiveCheckbox = function() {
  const cb = document.getElementById("promo-active");
  cb.checked = !cb.checked;
};

window.savePromotion = async function(event) {
  event.preventDefault();
  
  const id = document.getElementById("promo-id").value;
  const type = document.getElementById("promo-type").value;
  const promotionData = {
    clientType: document.getElementById("promo-client-type").value,
    type: type,
    threshold: parseFloat(document.getElementById("promo-threshold").value),
    giftProductId: type === "gift" ? document.getElementById("promo-gift-product").value : null,
    active: document.getElementById("promo-active").checked
  };
  
  try {
    if (id) {
      await convex.mutation("promotions:update", { id, ...promotionData });
    } else {
      await convex.mutation("promotions:create", promotionData);
    }
    closePromotionModal();
    loadDashboardData();
  } catch (err) {
    alert("Грешка при запис на промоция: " + err.message);
  }
};

window.deletePromotion = async function(promoId) {
  if (confirm("Наистина ли искате да изтриете тази промоция?")) {
    try {
      await convex.mutation("promotions:remove", { id: promoId });
      loadDashboardData();
    } catch (err) {
      alert("Грешка при изтриване: " + err.message);
    }
  }
};

// --- TAB 4: ORDERS LOGIC ---
function renderOrders() {
  const tbody = document.getElementById("orders-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  
  // Filter orders
  let filtered = allOrders;
  if (orderSearchQuery) {
    const query = orderSearchQuery.toLowerCase();
    filtered = filtered.filter(o => 
      o.name.toLowerCase().includes(query) || 
      o.phone.includes(query) || 
      (o.orderNumber && o.orderNumber.toLowerCase().includes(query))
    );
  }
  if (orderFilterStatus) {
    filtered = filtered.filter(o => o.status === orderFilterStatus);
  }
  if (orderFilterType) {
    filtered = filtered.filter(o => o.clientType === orderFilterType);
  }
  
  // Paginate orders
  const limit = ordersPage * ordersPerPage;
  const sliced = filtered.slice(0, limit);
  
  sliced.forEach(o => {
    const dateStr = new Date(o.createdAt).toLocaleDateString("bg-BG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${o.orderNumber}</strong></td>
      <td>${o.name}</td>
      <td>${o.phone}</td>
      <td><strong>${formatAdminPrice(o.total)}</strong></td>
      <td><span class="admin-badge" style="background:${o.clientType==='B2B'?'rgba(22,122,255,0.1)':'rgba(255,255,255,0.05)'}; color:${o.clientType==='B2B'?'var(--gold)':'var(--text)'};">${o.clientType}</span></td>
      <td>${dateStr}</td>
      <td><span class="badge-status ${o.status}">${o.status === 'pending' ? 'Чакаща' : o.status === 'completed' ? 'Завършена' : 'Анулирана'}</span></td>
      <td>
        <button class="btn-icon" onclick="viewOrderDetails('${o._id}')" title="Детайли"><i class="fas fa-eye"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  // Toggle load more button
  const loadMoreContainer = document.getElementById("orders-load-more-container");
  if (loadMoreContainer) {
    if (filtered.length > limit) {
      loadMoreContainer.style.display = "block";
    } else {
      loadMoreContainer.style.display = "none";
    }
  }
}

// Search & Filter event handlers for orders
window.handleOrderSearch = function() {
  orderSearchQuery = document.getElementById("admin-order-search").value || "";
  orderFilterStatus = document.getElementById("admin-order-filter-status").value || "";
  orderFilterType = document.getElementById("admin-order-filter-type").value || "";
  ordersPage = 1; // Reset to page 1 on search/filter change
  renderOrders();
};

window.loadMoreOrders = function() {
  ordersPage++;
  renderOrders();
};

let activeOrderId = null;
window.viewOrderDetails = function(orderId) {
  const o = allOrders.find(item => item._id === orderId);
  if (!o) return;
  
  activeOrderId = orderId;
  
  document.getElementById("order-details-num").textContent = o.orderNumber;
  document.getElementById("order-details-name").textContent = o.name;
  document.getElementById("order-details-phone").textContent = o.phone;
  document.getElementById("order-details-address").textContent = o.address;
  document.getElementById("order-details-client-type").textContent = o.clientType === "B2B" ? "Фирма (B2B)" : "Физическо лице (B2C)";
  
  const dateStr = new Date(o.createdAt).toLocaleString("bg-BG");
  document.getElementById("order-details-date").textContent = dateStr;
  document.getElementById("order-details-total").textContent = formatAdminPrice(o.total);
  
  const compBox = document.getElementById("order-details-company-box");
  if (o.clientType === "B2B") {
    document.getElementById("order-details-comp-name").textContent = o.companyName || "Няма данни";
    document.getElementById("order-details-comp-bulstat").textContent = o.companyBulstat || "Няма данни";
    compBox.style.display = "block";
  } else {
    compBox.style.display = "none";
  }
  
  // Render order items
  const tbody = document.getElementById("order-items-table-body");
  tbody.innerHTML = "";
  
  o.items.forEach(item => {
    const itemTotal = item.price * item.quantity;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name} ${item.isGift ? '<span class="admin-badge" style="background:#2ecc71; color:#000; border-color:#2ecc71; font-size:0.6rem;">ПОДАРЪК</span>' : ''}</td>
      <td>${formatAdminPrice(item.price)}</td>
      <td>${item.quantity}</td>
      <td>${formatAdminPrice(itemTotal)}</td>
    `;
    tbody.appendChild(tr);
  });
  
  document.getElementById("order-status-select").value = o.status;
  document.getElementById("order-modal").classList.add("active");
};

window.closeOrderModal = function() {
  document.getElementById("order-modal").classList.remove("active");
};

window.updateOrderStatus = async function() {
  const newStatus = document.getElementById("order-status-select").value;
  if (!activeOrderId) return;
  
  try {
    // We can write a quick update order status mutation in convex/orders.ts!
    // But since it doesn't exist, we can create/patch it directly using a new mutation
    // Let's create an update mutation in orders.ts to make it work!
    // Wait, let's write the updateStatus mutation in convex/orders.ts in the next steps, or we can patch it
    // Wait, let's make sure we have this mutation in orders.ts!
    await convex.mutation("orders:updateStatus", { id: activeOrderId, status: newStatus });
    closeOrderModal();
    loadDashboardData();
  } catch (err) {
    alert("Грешка при обновяване на статуса: " + err.message);
  }
};

// --- INITIALIZE PAGE ---
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  
  // File Uploader & Drag zone bindings
  const imageInput = document.getElementById("product-images-input");
  if (imageInput) {
    imageInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    });
    
    const dragZone = imageInput.parentElement;
    if (dragZone) {
      dragZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dragZone.style.borderColor = "#fff";
      });
      dragZone.addEventListener("dragleave", () => {
        dragZone.style.borderColor = "var(--gold)";
      });
      dragZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dragZone.style.borderColor = "var(--gold)";
        if (e.dataTransfer.files.length > 0) {
          handleFiles(e.dataTransfer.files);
        }
      });
    }
  }
  
  // CSV Importer bindings
  const csvInput = document.getElementById("csv-file-input");
  if (csvInput) {
    csvInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handleCSVFile(e.target.files[0]);
      }
    });
    
    const csvZone = document.getElementById("csv-dropzone");
    if (csvZone) {
      csvZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        csvZone.style.borderColor = "#fff";
      });
      csvZone.addEventListener("dragleave", () => {
        csvZone.style.borderColor = "var(--gold)";
      });
      csvZone.addEventListener("drop", (e) => {
        e.preventDefault();
        csvZone.style.borderColor = "var(--gold)";
        if (e.dataTransfer.files.length > 0) {
          handleCSVFile(e.dataTransfer.files[0]);
        }
      });
    }
  }
  
  // Document level click listener for closing mobile admin menu when clicking outside
  document.addEventListener("click", (e) => {
    const sidebar = document.getElementById("admin-sidebar");
    const toggleBtn = document.querySelector(".mobile-nav-toggle");
    if (sidebar && sidebar.classList.contains("active")) {
      if (!sidebar.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
        sidebar.classList.remove("active");
      }
    }
  });

  // Category Image Uploader bindings
  const catImageInput = document.getElementById("category-image-input");
  if (catImageInput) {
    catImageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const previewDiv = document.getElementById("category-image-preview");
      if (file && previewDiv) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          previewDiv.querySelector("img").src = ev.target.result;
          previewDiv.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    });
    const catDragZone = catImageInput.parentElement;
    if (catDragZone) {
      catDragZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        catDragZone.style.borderColor = "#fff";
      });
      catDragZone.addEventListener("dragleave", () => {
        catDragZone.style.borderColor = "var(--gold)";
      });
      catDragZone.addEventListener("drop", (e) => {
        e.preventDefault();
        catDragZone.style.borderColor = "var(--gold)";
        if (e.dataTransfer.files.length > 0) {
          catImageInput.files = e.dataTransfer.files;
          catImageInput.dispatchEvent(new Event('change'));
        }
      });
    }
  }

  // Brand Logo Uploader bindings
  const brandLogoInput = document.getElementById("brand-logo-input");
  if (brandLogoInput) {
    brandLogoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const previewDiv = document.getElementById("brand-logo-preview");
      if (file && previewDiv) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          previewDiv.querySelector("img").src = ev.target.result;
          previewDiv.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    });
    const brandDragZone = brandLogoInput.parentElement;
    if (brandDragZone) {
      brandDragZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        brandDragZone.style.borderColor = "#fff";
      });
      brandDragZone.addEventListener("dragleave", () => {
        brandDragZone.style.borderColor = "var(--gold)";
      });
      brandDragZone.addEventListener("drop", (e) => {
        e.preventDefault();
        brandDragZone.style.borderColor = "var(--gold)";
        if (e.dataTransfer.files.length > 0) {
          brandLogoInput.files = e.dataTransfer.files;
          brandLogoInput.dispatchEvent(new Event('change'));
        }
      });
    }
  }

  // Blog Post Cover Image Uploader
  const blogImageInput = document.getElementById("blog-post-image-input");
  if (blogImageInput) {
    blogImageInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handleBlogImageFile(e.target.files[0]);
      }
    });
    const blogDragZone = blogImageInput.parentElement;
    if (blogDragZone) {
      blogDragZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        blogDragZone.style.borderColor = "#fff";
      });
      blogDragZone.addEventListener("dragleave", () => {
        blogDragZone.style.borderColor = "var(--gold)";
      });
      blogDragZone.addEventListener("drop", (e) => {
        e.preventDefault();
        blogDragZone.style.borderColor = "var(--gold)";
        if (e.dataTransfer.files.length > 0) {
          handleBlogImageFile(e.dataTransfer.files[0]);
        }
      });
    }
  }
});

function compressImage(base64Str, maxWidth, maxHeight, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to webp with specified quality
      const compressedDataUrl = canvas.toDataURL("image/webp", quality);
      resolve(compressedDataUrl);
    };
    img.onerror = () => {
      resolve(base64Str); // Fallback to original on error
    };
  });
}

function handleFiles(files) {
  const readers = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith("image/")) continue;
    readers.push(new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        compressImage(e.target.result, 800, 800, 0.8).then(resolve);
      };
      reader.readAsDataURL(file);
    }));
  }
  
  Promise.all(readers).then((results) => {
    uploadedImages = [...uploadedImages, ...results];
    renderImagePreviews();
  });
}

// --- CSV PARSING & PRODUCTS IMPORT ---
const KNOWN_BRANDS = ["Apple", "Samsung", "Xiaomi", "Huawei", "Honor", "MOTO", "Nokia", "OnePlus", "Oppo", "Vivo", "TCL", "Realme", "LG", "Lenovo", "Infinix", "Tranyoo"];

function parseBrandAndModel(name, cat) {
  let nameClean = (name || "").toString().trim();
  let catClean = (cat || "").toString().trim();
  
  let brand = "Всички марки";
  let model = "Всички модели";
  
  if (catClean.includes('>')) {
    const paths = catClean.split(',');
    const lastPath = paths[paths.length - 1];
    const parts = lastPath.split('>').map(p => p.trim());
    
    if (parts.length >= 3) {
      const brandPart = parts[1];
      const modelPart = parts[2];
      
      if (brandPart.toLowerCase().includes("iphone")) {
        brand = "Apple";
      } else {
        for (const b of KNOWN_BRANDS) {
          if (brandPart.toLowerCase().includes(b.toLowerCase())) {
            brand = b;
            break;
          }
        }
      }
      model = modelPart;
    } else if (parts.length === 2) {
      const brandPart = parts[1];
      if (brandPart.toLowerCase().includes("iphone")) {
        brand = "Apple";
      } else {
        for (const b of KNOWN_BRANDS) {
          if (brandPart.toLowerCase().includes(b.toLowerCase())) {
            brand = b;
            break;
          }
        }
      }
      if (brand !== "Всички марки" && brandPart.toLowerCase() !== brand.toLowerCase()) {
        model = brandPart;
      }
    }
  }
  
  if (brand === "Всички марки") {
    const nameLower = nameClean.toLowerCase();
    if (nameLower.includes("iphone") || nameLower.includes("apple") || nameLower.includes("ipad")) {
      brand = "Apple";
    } else {
      for (const b of KNOWN_BRANDS) {
        if (nameLower.includes(b.toLowerCase())) {
          brand = b;
          break;
        }
      }
    }
  }
  
  if (brand) {
    if (brand.toLowerCase() === "iphone" || brand.toLowerCase() === "apple") {
      brand = "Apple";
    } else {
      for (const kb of KNOWN_BRANDS) {
        if (kb.toLowerCase() === brand.toLowerCase()) {
          brand = kb;
          break;
        }
      }
    }
  }
  
  if (model === "Всички модели" || model.toLowerCase() === brand.toLowerCase() || model === "iPhone") {
    const regex = /(?:\s|^)(?:за|зa|za)\s+([a-zA-Z0-9\s\-\.\+\(\)]+)/i;
    const match = nameClean.match(regex);
    if (match) {
      const candidate = match[1].trim();
      const stopWords = ["черен", "червен", "син", "бял", "розов", "златен", "лилав", "зелен", "сив", "тъмносин", "матиращ", "протектор", "калъф", "кейс", "гръб", "плетен", "удароустойчив", "с", "и", "в", "на"];
      const cleanedWords = [];
      for (const word of candidate.split(/\s+/)) {
        if (stopWords.includes(word.toLowerCase())) {
          break;
        }
        cleanedWords.push(word);
      }
      if (cleanedWords.length > 0) {
        model = cleanedWords.join(" ");
      }
    }
  }
  
  model = model.trim();
  if (brand !== "Всички марки" && model !== "Всички модели") {
    if (brand.toLowerCase() === "apple") {
      if (!model.toLowerCase().startsWith("iphone") && !model.toLowerCase().startsWith("ipad")) {
        model = "iPhone " + model;
      }
    } else {
      if (!model.toLowerCase().startsWith(brand.toLowerCase())) {
        model = brand + " " + model;
      }
    }
  }
  
  if (brand.toLowerCase() === "apple") {
    brand = "Apple";
    if (model.startsWith("Apple ")) {
      model = model.substring(6);
    }
    if (!model.startsWith("iPhone") && !model.startsWith("iPad")) {
      model = "iPhone " + model;
    }
  }
  
  const garbageList = ["червен", "черен", "син", "бял", "златен", "розов", "лилав", "зелен", "сив", "тъмносин", "матиращ", "протектор", "калъф", "кейс"];
  for (const garbage of garbageList) {
    if (model.toLowerCase().endsWith(" " + garbage)) {
      model = model.substring(0, model.length - garbage.length - 1).trim();
    }
  }
  
  return { brand, model };
}

function getCategoryIdAndName(catStr, nameStr) {
  const cStr = (catStr || "").toString().toLowerCase();
  const nStr = (nameStr || "").toString().toLowerCase();
  
  if (cStr.includes("стойка") || cStr.includes("стойки") || nStr.includes("стойка") || nStr.includes("стойки")) {
    return { id: "aksesoari-za-avtomobili", name: "Аксесоари за автомобил" };
  } else if (cStr.includes("батерия") || cStr.includes("батерии") || cStr.includes("power bank") || nStr.includes("външна батерия")) {
    return { id: "vanshni-baterii", name: "Външни батерии" };
  } else if (cStr.includes("слушалки") || nStr.includes("слушалки")) {
    return { id: "headphones", name: "Слушалки" };
  } else if (cStr.includes("памети") || cStr.includes("flash") || cStr.includes("micro sd") || cStr.includes("sd карти") || nStr.includes("sd") || nStr.includes("flash")) {
    return { id: "memory_cards", name: "Памети & Карти" };
  } else if (cStr.includes("фолио за машина") || nStr.includes("фолио за машина") || nStr.includes("хидравлично фолио") || nStr.includes("hydrogel film")) {
    return { id: "hydrogel_film", name: "Хидрогел фолио" };
  } else if (cStr.includes("зарядно") || cStr.includes("зарядни") || nStr.includes("зарядно") || nStr.includes("зарядни") || nStr.includes("адаптер")) {
    return { id: "zaryadni-ustroystva", name: "Зарядни устройства" };
  } else if (cStr.includes("кабели") || cStr.includes("кабел") || nStr.includes("кабел") || cStr.includes("адаптер")) {
    return { id: "kabeli-za-zaryadane", name: "Кабели за зареждане" };
  } else if (nStr.includes("протектор") || nStr.includes("стъкло") || nStr.includes("стъклен") || nStr.includes("glass")) {
    return { id: "protektori-za-ekran", name: "Протектори за екран" };
  } else if (nStr.includes("тефтер") || nStr.includes("калъф") || nStr.includes("кейс") || nStr.includes("гръб") || nStr.includes("силикон") || nStr.includes("кожен") || nStr.includes("case")) {
    return { id: "keysove-i-kalufi", name: "Кейсове / Калъфи" };
  } else {
    return { id: "popsoket-i-vrazki", name: "Попсокет / Връзки" };
  }
}

function cleanProductName(name) {
  if (!name) return "";
  let n = name.toString().trim();
  if (n.includes(',') && n.split(' ').length < 4) {
    n = n.replace(/,/g, ' ');
  }
  return n.replace(/\s+/g, ' ').trim();
}

function handleCSVFile(file) {
  const nameLower = file.name.toLowerCase();
  if (nameLower.endsWith(".xlsx") || nameLower.endsWith(".xls")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, {type: 'array'});
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, {header: 1, defval: ""});
      processCSVData(rows);
    };
    reader.readAsArrayBuffer(file);
  } else if (nameLower.endsWith(".csv")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const rows = parseCSVText(text);
      processCSVData(rows);
    };
    reader.readAsText(file, "UTF-8");
  } else {
    alert("Моля, изберете валиден CSV или Excel (.xlsx, .xls) файл!");
  }
}

function parseCSVText(text) {
  let firstLine = "";
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\r' || text[i] === '\n') {
      break;
    }
    firstLine += text[i];
  }
  
  let commas = 0;
  let semicolons = 0;
  let inQuotes = false;
  for (let i = 0; i < firstLine.length; i++) {
    if (firstLine[i] === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes) {
      if (firstLine[i] === ',') commas++;
      else if (firstLine[i] === ';') semicolons++;
    }
  }
  const delimiter = semicolons > commas ? ';' : ',';

  const lines = [];
  let row = [""];
  inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i+1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === delimiter && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      lines.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== '') {
    lines.push(row);
  }
  return lines;
}

function processCSVData(rows) {
  if (rows.length < 2) {
    alert("Таблицата трябва да съдържа поне един ред с хедъри и един ред с данни!");
    return;
  }
  
  const headers = rows[0].map(h => h.toString().trim().toLowerCase());
  const isSellaviFormat = headers.includes("име на продукта") && (headers.includes("цена") || headers.includes("цена b2c")) && headers.includes("категория");
  
  let nameIdx, brandIdx, modelIdx, categoryIdx, priceB2CIdx, priceB2BIdx, oldPriceB2CIdx, oldPriceB2BIdx, descIdx, matIdx, weightIdx, originIdx, delIdx, imgIdx, idIdx;
  
  if (isSellaviFormat) {
    nameIdx = headers.indexOf("име на продукта");
    categoryIdx = headers.indexOf("категория");
    priceB2CIdx = headers.indexOf("цена b2c") !== -1 ? headers.indexOf("цена b2c") : headers.indexOf("цена");
    priceB2BIdx = headers.indexOf("цена b2b");
    oldPriceB2CIdx = headers.indexOf("стара цена b2c") !== -1 ? headers.indexOf("стара цена b2c") : headers.indexOf("стара цена");
    oldPriceB2BIdx = headers.indexOf("стара цена b2b");
    imgIdx = headers.indexOf("снимка на продукт");
    modelIdx = headers.indexOf("модел");
    descIdx = headers.indexOf("описание");
    weightIdx = headers.indexOf("тегло");
    matIdx = headers.indexOf("материал");
    idIdx = headers.indexOf("id на продукта") !== -1 ? headers.indexOf("id на продукта") : headers.indexOf("sku");
    brandIdx = headers.indexOf("марка");
  } else {
    const findHeaderIdx = (variants) => {
      for (const variant of variants) {
        const idx = headers.indexOf(variant.toLowerCase());
        if (idx !== -1) return idx;
      }
      return -1;
    };
    nameIdx = findHeaderIdx(["name", "име", "мета заглавие"]);
    brandIdx = findHeaderIdx(["brand", "марка"]);
    modelIdx = findHeaderIdx(["model", "модел"]);
    categoryIdx = findHeaderIdx(["category", "категория"]);
    priceB2CIdx = findHeaderIdx(["priceb2c", "цена b2c", "цена", "b2c цена", "цени", "цените"]);
    priceB2BIdx = findHeaderIdx(["priceb2b", "цена b2b", "b2b цена"]);
    oldPriceB2CIdx = findHeaderIdx(["oldpriceb2c", "стара цена b2c", "стара цена", "old price b2c"]);
    oldPriceB2BIdx = findHeaderIdx(["oldpriceb2b", "стара цена b2b", "old price b2b"]);
    descIdx = findHeaderIdx(["description", "описание"]);
    matIdx = findHeaderIdx(["material", "материал"]);
    weightIdx = findHeaderIdx(["weight", "тегло", "грама"]);
    originIdx = findHeaderIdx(["origin", "произход", "държава"]);
    delIdx = findHeaderIdx(["delivery", "доставка"]);
    imgIdx = findHeaderIdx(["image", "снимка", "изображение", "снимки"]);
    idIdx = findHeaderIdx(["id на продукта", "id", "_id", "sku"]);
    
    if (nameIdx === -1 || brandIdx === -1 || priceB2CIdx === -1) {
      alert("Липсват задължителни колони в таблицата! Задължителни са: Мета заглавие, Марка, Цените.");
      return;
    }
  }
  
  parsedCSVProducts = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < headers.length) continue;
    if (!row[nameIdx]) continue;
    
    let name = cleanProductName(row[nameIdx].toString());
    let brand = "Всички марки";
    let model = "Всички модели";
    let category = "pop_socket";
    let priceB2C = parseFloat(row[priceB2CIdx]) || 0;
    let priceB2B = 0;
    let oldPriceB2C = oldPriceB2CIdx !== -1 && row[oldPriceB2CIdx] ? parseFloat(row[oldPriceB2CIdx]) : null;
    if (isNaN(oldPriceB2C)) oldPriceB2C = null;
    let oldPriceB2B = oldPriceB2BIdx !== -1 && row[oldPriceB2BIdx] ? parseFloat(row[oldPriceB2BIdx]) : null;
    if (isNaN(oldPriceB2B)) oldPriceB2B = null;
    
    let rawImage = imgIdx !== -1 && row[imgIdx] ? row[imgIdx].toString().trim() : "assets/logo.webp";
    let image = "assets/logo.webp";
    let images = [];
    if (rawImage && rawImage !== "assets/logo.webp") {
      const parts = rawImage.split(";").map(img => img.trim()).filter(Boolean);
      if (parts.length > 0) {
        image = parts[0];
        images = parts;
      }
    }
    let description = descIdx !== -1 && row[descIdx] ? row[descIdx].toString().trim() : "";
    let material = matIdx !== -1 && row[matIdx] ? row[matIdx].toString().trim() : "Премиум силикон / TPU / Кожа";
    let weight = weightIdx !== -1 && row[weightIdx] ? row[weightIdx].toString().trim() : "30г";
    if (weight && !weight.endsWith("г")) weight = weight + "г";
    let id = idIdx !== -1 && row[idIdx] ? row[idIdx].toString().trim() : null;
    if (id === "") id = null;
    
    if (isSellaviFormat) {
      const catVal = row[categoryIdx] ? row[categoryIdx].toString().trim() : "";
      const parsedMeta = parseBrandAndModel(name, catVal);
      brand = parsedMeta.brand;
      model = parsedMeta.model;
      
      const catMeta = getCategoryIdAndName(catVal, name);
      category = catMeta.id;
      
      priceB2B = priceB2BIdx !== -1 && row[priceB2BIdx] ? parseFloat(row[priceB2BIdx]) : Math.round(priceB2C * 0.8 * 100) / 100;
      if (isNaN(priceB2B)) priceB2B = Math.round(priceB2C * 0.8 * 100) / 100;
      
      if (!description) description = `${name}. Премиум телефонен аксесоар от най-висок клас.`;
    } else {
      brand = brandIdx !== -1 && row[brandIdx] ? row[brandIdx].toString().trim() : "Всички марки";
      model = modelIdx !== -1 && row[modelIdx] ? row[modelIdx].toString().trim() : "Всички модели";
      category = categoryIdx !== -1 && row[categoryIdx] ? row[categoryIdx].toString().trim() : "keysove-i-kalufi";
      priceB2B = priceB2BIdx !== -1 ? (parseFloat(row[priceB2BIdx]) || Math.round(priceB2C * 0.8 * 100) / 100) : (Math.round(priceB2C * 0.8 * 100) / 100);
      if (isNaN(priceB2B)) priceB2B = Math.round(priceB2C * 0.8 * 100) / 100;
      if (!description) description = "Премиум аксесоар за телефон";
    }
    
    const product = {
      id,
      name,
      brand,
      model,
      category,
      priceB2C,
      oldPriceB2C,
      priceB2B,
      oldPriceB2B,
      rating: 5,
      tag: null,
      description,
      specs: {
        material,
        weight,
        origin: originIdx !== -1 && row[originIdx] ? row[originIdx].toString().trim() : "Германия",
        delivery: delIdx !== -1 && row[delIdx] ? row[delIdx].toString().trim() : "Бърза доставка до 24 часа"
      },
      image,
      images
    };
    
    parsedCSVProducts.push(product);
  }
  
  renderCSVPreview();
}

function renderCSVPreview() {
  const section = document.getElementById("csv-preview-section");
  const countSpan = document.getElementById("csv-import-count");
  const tbody = document.getElementById("csv-preview-table-body");
  
  if (!section || !tbody || !countSpan) return;
  tbody.innerHTML = "";
  
  countSpan.textContent = parsedCSVProducts.length;
  
  parsedCSVProducts.forEach(p => {
    const tr = document.createElement("tr");
    const oldB2CStr = p.oldPriceB2C ? ` <del style="font-size:0.8rem; color:var(--text-muted);">${formatAdminPrice(p.oldPriceB2C)}</del>` : "";
    const oldB2BStr = p.oldPriceB2B ? ` <del style="font-size:0.8rem; color:var(--text-muted);">${formatAdminPrice(p.oldPriceB2B)}</del>` : "";
    const thumbUrl = p.image || 'assets/logo.webp';
    const imagesCount = p.images ? p.images.length : 1;
    
    tr.innerHTML = `
      <td>${p.brand}</td>
      <td>${p.model}</td>
      <td>
        <div style="font-size: 0.85rem;">B2C: <strong>${formatAdminPrice(p.priceB2C)}</strong>${oldB2CStr}</div>
        <div style="font-size: 0.85rem;">B2B: <strong>${formatAdminPrice(p.priceB2B)}</strong>${oldB2BStr}</div>
      </td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${p.description}">${p.description}</td>
      <td><strong>${p.name}</strong></td>
      <td>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <img src="${thumbUrl}" style="width: 36px; height: 36px; object-fit: contain; border: 1px solid var(--border-color); border-radius: 4px; background: #fafafa;" onerror="this.src='assets/logo.webp'">
          <span style="font-size: 0.8rem; color: var(--text-muted);">${imagesCount} бр.</span>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  section.style.display = "block";
}

window.confirmCSVImport = async function() {
  if (parsedCSVProducts.length === 0) return;
  
  if (!confirm(`Сигурни ли сте, че искате да импортирате ${parsedCSVProducts.length} продукта?`)) return;
  
  try {
    // Build metadata cache
    const existingCats = await convex.query("meta:getCategories");
    const existingBrands = await convex.query("meta:getBrands");
    const existingModels = await convex.query("meta:getModels");
    
    const catsCache = new Set(existingCats.map(c => c.id));
    const brandsCache = new Set(existingBrands.map(b => b.name.toLowerCase()));
    const modelsCache = new Set(existingModels.map(m => `${m.brand.toLowerCase()}:${m.name.toLowerCase()}`));
    
    const catNames = {
      "aksesoari-za-avtomobili": "Аксесоари за автомобил",
      "vanshni-baterii": "Външни батерии",
      "headphones": "Слушалки",
      "memory_cards": "Памети & Карти",
      "hydrogel_film": "Хидрогел фолио",
      "zaryadni-ustroystva": "Зарядни устройства",
      "kabeli-za-zaryadane": "Кабели за зареждане",
      "protektori-za-ekran": "Протектори за екран",
      "keysove-i-kalufi": "Кейве / Калъфи",
      "popsoket-i-vrazki": "Попсокет / Връзки"
    };

    // 1. Ensure all categories, brands, and models exist in metadata first
    for (const p of parsedCSVProducts) {
      if (!catsCache.has(p.category)) {
        const catName = catNames[p.category] || p.category;
        await convex.mutation("meta:addCategory", {
          id: p.category,
          name: catName,
          image: `assets/cat_${p.category}.webp`
        });
        catsCache.add(p.category);
      }
      
      const brandLower = p.brand.toLowerCase();
      if (p.brand !== "Всички марки" && !brandsCache.has(brandLower)) {
        const logoName = `logo_${brandLower}_clean.webp`;
        await convex.mutation("meta:addBrand", {
          name: p.brand,
          logo: logoName
        });
        brandsCache.add(brandLower);
      }
      
      const modelLower = p.model.toLowerCase();
      const modelKey = `${p.brand.toLowerCase()}:${modelLower}`;
      if (p.brand !== "Всички марки" && p.model !== "Всички модели" && !modelsCache.has(modelKey)) {
        await convex.mutation("meta:addModel", {
          brand: p.brand,
          name: p.model
        });
        modelsCache.add(modelKey);
      }
    }

    // 2. Upload products in batches of 100 to optimize performance
    let totalUpdated = 0;
    let totalCreated = 0;
    const chunkSize = 100;
    
    for (let i = 0; i < parsedCSVProducts.length; i += chunkSize) {
      const chunk = parsedCSVProducts.slice(i, i + chunkSize);
      const res = await convex.mutation("products:upsertBatch", { products: chunk });
      totalUpdated += res.updatedCount || 0;
      totalCreated += res.createdCount || 0;
    }
    
    alert(`Успешно импортиране! Добавени нови: ${totalCreated}, Обновени съществуващи: ${totalUpdated}.`);
    parsedCSVProducts = [];
    document.getElementById("csv-preview-section").style.display = "none";
    document.getElementById("csv-file-input").value = "";
    loadDashboardData();
  } catch (err) {
    alert("Грешка при импортиране: " + err.message);
  }
};

window.exportProductsToExcel = async function() {
  try {
    const products = await convex.query("products:get");
    if (products.length === 0) {
      alert("Няма налични продукти за експортиране!");
      return;
    }
    
    const rows = [];
    
    const transliterateBulgarian = (text) => {
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
    };

    const slugify = (text) => {
      const transliterated = transliterateBulgarian(text.toString().toLowerCase());
      return transliterated
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    };
    
    const categoryPaths = {
      "keysove-i-kalufi": (p) => `Аксесоари,Аксесоари>${p.brand},Аксесоари>${p.brand}>${p.model}`,
      "protektori-za-ekran": (p) => `Аксесоари,Аксесоари>${p.brand},Аксесоари>${p.brand}>${p.model}`,
      "aksesoari-za-avtomobili": (p) => `Аксесоари,Аксесоари>Автоаксесоари,Аксесоари>Автоаксесоари>Стойки за кола`,
      "vanshni-baterii": (p) => `Power Bank ( Външна батерия )`,
      "headphones": (p) => `Слушалки,Слушалки>Безжични слушалки`,
      "memory_cards": (p) => `Памети,Памети>USB Flash памети`,
      "hydrogel_film": (p) => `Фолио за машина`,
      "zaryadni-ustroystva": (p) => `Зарядни устройства,Зарядни устройства>Tranyoo`,
      "kabeli-za-zaryadane": (p) => `Кабели и Адаптери`,
      "popsoket-i-vrazki": (p) => `Аксесоари`
    };

    products.forEach(p => {
      const row = {
        "ID на продукта": p._id,
        "Марка": p.brand,
        "Модел": p.model,
        "Цена B2C": p.priceB2C,
        "Цена B2B": p.priceB2B,
        "Стара цена B2C": p.oldPriceB2C || "",
        "Стара цена B2B": p.oldPriceB2B || "",
        "Описание": p.description,
        "Мета заглавие": p.name,
        "Снимки": p.images && p.images.length > 0 ? p.images.join(";") : p.image,
        "Категория": p.category
      };
      rows.push(row);
    });
    
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Продукти");
    
    XLSX.writeFile(workbook, "product_export.xlsx");
  } catch (err) {
    alert("Грешка при експортиране: " + err.message);
  }
};

// --- CATEGORIES MANAGEMENT ---
window.openCategoryModal = function() {
  document.getElementById("category-id-input").value = "";
  document.getElementById("category-name-input").value = "";
  document.getElementById("category-image-input").value = "";
  const previewDiv = document.getElementById("category-image-preview");
  if (previewDiv) {
    previewDiv.style.display = "none";
    previewDiv.querySelector("img").src = "";
  }
  document.getElementById("category-modal").classList.add("active");
};

window.closeCategoryModal = function() {
  document.getElementById("category-modal").classList.remove("active");
};

window.saveCategory = async function(event) {
  event.preventDefault();
  const id = document.getElementById("category-id-input").value.trim();
  const name = document.getElementById("category-name-input").value.trim();
  const imageInput = document.getElementById("category-image-input");
  
  try {
    const imageBase64 = await getBase64Image(imageInput, 400, 400);
    if (!imageBase64) {
      alert("Моля, изберете снимка за категорията!");
      return;
    }
    await convex.mutation("meta:addCategory", { id, name, image: imageBase64 });
    closeCategoryModal();
    loadDashboardData();
  } catch (err) {
    alert("Грешка при добавяне на категория: " + err.message);
  }
};

window.deleteCategory = async function(catId) {
  if (confirm("Внимание: Изтриването на категорията ще премахне филтъра за нея. Продължаване?")) {
    try {
      await convex.mutation("meta:removeCategory", { id: catId });
      loadDashboardData();
    } catch (err) {
      alert("Грешка при изтриване: " + err.message);
    }
  }
};

// --- PROMO CODES MANAGEMENT ---
window.openPromoCodeModal = function() {
  document.getElementById("promo-code-input").value = "";
  document.getElementById("promo-code-type").value = "percent";
  document.getElementById("promo-code-value").value = "";
  document.getElementById("promo-code-modal").classList.add("active");
};

window.closePromoCodeModal = function() {
  document.getElementById("promo-code-modal").classList.remove("active");
};

window.savePromoCode = async function(event) {
  event.preventDefault();
  const code = document.getElementById("promo-code-input").value.trim();
  const discountType = document.getElementById("promo-code-type").value;
  const discountValue = parseFloat(document.getElementById("promo-code-value").value);
  
  try {
    await convex.mutation("promoCodes:create", { code, discountType, discountValue });
    closePromoCodeModal();
    loadDashboardData();
  } catch (err) {
    alert("Грешка при добавяне на промо код: " + err.message);
  }
};

window.deletePromoCode = async function(promoId) {
  if (confirm("Наистина ли искате да изтриете този промо код?")) {
    try {
      await convex.mutation("promoCodes:remove", { id: promoId });
      loadDashboardData();
    } catch (err) {
      alert("Грешка при изтриване: " + err.message);
    }
  }
};

function renderPromoCodes() {
  const tbody = document.getElementById("promocodes-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  
  allPromoCodes.forEach(code => {
    const linkedOrders = allOrders.filter(o => o.promoCode === code.code && o.status !== "cancelled");
    const revenue = linkedOrders.reduce((sum, o) => sum + o.total, 0);
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${code.code}</strong></td>
      <td>${code.discountType === "percent" ? "Процентна (%)" : "Фиксирана (€)"}</td>
      <td>${code.discountValue}${code.discountType === "percent" ? "%" : " €"}</td>
      <td>
        <span class="badge-status ${code.active ? 'completed' : 'cancelled'}">
          ${code.active ? 'Да' : 'Не'}
        </span>
      </td>
      <td><strong>${formatAdminPrice(revenue)}</strong></td>
      <td>
        <button class="btn-icon delete" onclick="deletePromoCode('${code._id}')" title="Изтрий промо код"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// --- B2B CLIENTS RENDERING ---
function renderB2BUsers() {
  const tbody = document.getElementById("b2b-clients-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  
  const b2bUsers = allUsers.filter(u => u.clientType === "B2B");
  
  b2bUsers.forEach(u => {
    const comp = u.companyDetails || {};
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${u.name}</strong></td>
      <td>${u.email}</td>
      <td>${u.phone}</td>
      <td>${comp.name || "Няма"}</td>
      <td>${comp.bulstat || "Няма"}</td>
      <td>${comp.mol || "Няма"}</td>
      <td>${comp.vatRegistered ? "Да" : "Не"}</td>
      <td>${comp.address || u.address}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- DASHBOARD STATISTICS ---
function isDateInPeriod(dateStr, period) {
  if (period === 'always') return true;
  if (!dateStr) return false;
  
  const date = new Date(dateStr);
  const now = new Date();
  
  // Start of today (00:00:00.000 local time)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Start of yesterday (00:00:00.000 local time)
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  
  switch (period) {
    case 'today':
      return date >= startOfToday;
      
    case 'yesterday':
      return date >= startOfYesterday && date < startOfToday;
      
    case '7days': {
      const boundary = new Date(now);
      boundary.setDate(boundary.getDate() - 7);
      return date >= boundary;
    }
    case '14days': {
      const boundary = new Date(now);
      boundary.setDate(boundary.getDate() - 14);
      return date >= boundary;
    }
    case '28days': {
      const boundary = new Date(now);
      boundary.setDate(boundary.getDate() - 28);
      return date >= boundary;
    }
    case '1month': {
      const boundary = new Date(now);
      boundary.setMonth(boundary.getMonth() - 1);
      return date >= boundary;
    }
    case '3months': {
      const boundary = new Date(now);
      boundary.setMonth(boundary.getMonth() - 3);
      return date >= boundary;
    }
    case '6months': {
      const boundary = new Date(now);
      boundary.setMonth(boundary.getMonth() - 6);
      return date >= boundary;
    }
    case '1year': {
      const boundary = new Date(now);
      boundary.setFullYear(boundary.getFullYear() - 1);
      return date >= boundary;
    }
    default:
      return true;
  }
}

window.renderDashboardStats = function() {
  const monthRevenueEl = document.getElementById("stat-month-revenue");
  const lifetimeRevenueEl = document.getElementById("stat-lifetime-revenue");
  const ordersCountEl = document.getElementById("stat-orders-count");
  const b2bCountEl = document.getElementById("stat-b2b-count");
  
  const revenueLabel = document.getElementById("stat-revenue-label");
  const ordersLabel = document.getElementById("stat-orders-label");
  const b2bLabel = document.getElementById("stat-b2b-label");
  
  if (!monthRevenueEl) return;
  
  const filterEl = document.getElementById("dashboard-time-filter");
  const period = filterEl ? filterEl.value : "1month";
  
  // Set labels
  let suffix = "за периода";
  if (period === "today") suffix = "за Днес";
  else if (period === "yesterday") suffix = "за Вчера";
  else if (period === "7days") suffix = "за последните 7 дни";
  else if (period === "14days") suffix = "за последните 14 дни";
  else if (period === "28days") suffix = "за последните 28 дни";
  else if (period === "1month") suffix = "за последния 1 месец";
  else if (period === "3months") suffix = "за последните 3 месеца";
  else if (period === "6months") suffix = "за последните 6 месеца";
  else if (period === "1year") suffix = "за последната 1 година";
  else if (period === "always") suffix = "(Винаги)";
  
  if (revenueLabel) revenueLabel.textContent = "Оборот " + suffix;
  if (ordersLabel) ordersLabel.textContent = "Поръчки " + suffix;
  if (b2bLabel) b2bLabel.textContent = "Нови B2B Партньори " + (period === "always" ? "(Винаги)" : suffix);
  
  // Calculate Lifetime Revenue
  const nonCancelledOrders = allOrders.filter(o => o.status !== "cancelled");
  const lifetimeRevenue = nonCancelledOrders.reduce((sum, o) => sum + o.total, 0);
  
  // Filter orders in period
  const periodOrders = allOrders.filter(o => isDateInPeriod(o.createdAt, period));
  const periodNonCancelledOrders = periodOrders.filter(o => o.status !== "cancelled");
  const periodRevenue = periodNonCancelledOrders.reduce((sum, o) => sum + o.total, 0);
  
  // Filter B2B partners in period
  const b2bUsers = allUsers.filter(u => u.clientType === "B2B");
  const periodB2bUsers = b2bUsers.filter(u => isDateInPeriod(u.createdAt, period));
  
  // Render stats
  monthRevenueEl.textContent = formatAdminPrice(periodRevenue);
  lifetimeRevenueEl.textContent = formatAdminPrice(lifetimeRevenue);
  ordersCountEl.textContent = periodOrders.length;
  b2bCountEl.textContent = period === "always" ? b2bUsers.length : periodB2bUsers.length;
  
  // Render filtered recent orders
  const recentTbody = document.getElementById("dashboard-recent-orders");
  if (recentTbody) {
    recentTbody.innerHTML = "";
    const recent = periodOrders.slice(0, 5);
    
    if (recent.length === 0) {
      recentTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">Няма поръчки за избрания период</td></tr>`;
    } else {
      recent.forEach(o => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${o.orderNumber}</strong></td>
          <td>${o.name}</td>
          <td>${formatAdminPrice(o.total)}</td>
          <td><span class="admin-badge" style="background:${o.clientType==='B2B'?'rgba(22,122,255,0.1)':'rgba(255,255,255,0.05)'}; color:${o.clientType==='B2B'?'var(--gold)':'var(--text)'};">${o.clientType}</span></td>
          <td><span class="badge-status ${o.status}">${o.status === 'pending' ? 'Чакаща' : o.status === 'completed' ? 'Завършена' : 'Анулирана'}</span></td>
        `;
        recentTbody.appendChild(tr);
      });
    }
  }
}

// --- BLOG MANAGEMENT LOGIC ---
function handleBlogImageFile(file) {
  if (!file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    compressImage(e.target.result, 1200, 675, 0.85).then((compressed) => {
      blogPostCoverImage = compressed;
      const previewBox = document.getElementById("blog-post-image-preview-box");
      const previewImg = document.getElementById("blog-post-image-preview");
      if (previewBox && previewImg) {
        previewImg.src = compressed;
        previewBox.style.display = "block";
      }
    });
  };
  reader.readAsDataURL(file);
}

const BLOG_CATEGORY_MAP = {
  guides: "Ръководства",
  news: "Новини",
  reviews: "Ревюта"
};

function renderBlogPosts() {
  const tbody = document.getElementById("blog-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const query = (document.getElementById("admin-blog-search").value || "").toLowerCase();
  const filterCat = document.getElementById("admin-blog-filter-category").value;

  let filtered = allBlogPosts;
  if (query) {
    filtered = filtered.filter(post => 
      post.title.toLowerCase().includes(query) || 
      post.summary.toLowerCase().includes(query)
    );
  }
  if (filterCat) {
    filtered = filtered.filter(post => post.category === filterCat);
  }

  // Sort by createdAt desc
  filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">Няма намерени статии</td></tr>`;
    return;
  }

  filtered.forEach(post => {
    const tr = document.createElement("tr");
    const formattedDate = new Date(post.createdAt).toLocaleDateString("bg-BG", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    const statusBadge = post.isPublished
      ? `<span class="badge-status completed">Публикувана</span>`
      : `<span class="badge-status pending">Чернова</span>`;

    tr.innerHTML = `
      <td><img src="${post.coverImage}" style="width:60px; height:34px; object-fit:cover; border-radius:4px;"></td>
      <td><strong>${post.title}</strong></td>
      <td><span class="admin-badge" style="font-size:0.7rem;">${BLOG_CATEGORY_MAP[post.category] || post.category}</span></td>
      <td>${statusBadge}</td>
      <td>${formattedDate}</td>
      <td>
        <div class="row-actions">
          <button class="btn-icon" onclick="openBlogModal('${post._id}')" title="Редактирай"><i class="fas fa-edit"></i></button>
          <button class="btn-icon delete" onclick="deleteBlogPost('${post._id}')" title="Изтрий"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.handleAdminBlogSearch = function() {
  renderBlogPosts();
};

window.openBlogModal = function(postId = null) {
  const modal = document.getElementById("blog-post-modal");
  const form = document.getElementById("blog-post-form");
  form.reset();

  // Populate related products dropdown
  const relatedSelect = document.getElementById("blog-post-related-products");
  relatedSelect.innerHTML = "";
  allProducts.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p._id;
    opt.textContent = `${p.brand} (${p.model}) - ${p.name}`;
    relatedSelect.appendChild(opt);
  });

  const previewBox = document.getElementById("blog-post-image-preview-box");
  const previewImg = document.getElementById("blog-post-image-preview");

  if (postId) {
    document.getElementById("blog-post-modal-title").textContent = "Редактиране на Статия";
    const post = allBlogPosts.find(item => item._id === postId);
    if (post) {
      document.getElementById("blog-post-id").value = post._id;
      document.getElementById("blog-post-title").value = post.title;
      document.getElementById("blog-post-category").value = post.category;
      document.getElementById("blog-post-author").value = post.author || "";
      document.getElementById("blog-post-summary").value = post.summary;
      document.getElementById("blog-post-content").value = post.content;
      document.getElementById("blog-post-published").checked = post.isPublished;

      // Select related products
      if (post.relatedProducts) {
        Array.from(relatedSelect.options).forEach(opt => {
          opt.selected = post.relatedProducts.includes(opt.value);
        });
      }

      blogPostCoverImage = post.coverImage;
      if (previewBox && previewImg) {
        previewImg.src = post.coverImage;
        previewBox.style.display = "block";
      }
    }
  } else {
    document.getElementById("blog-post-modal-title").textContent = "Добавяне на Нова Статия";
    document.getElementById("blog-post-id").value = "";
    blogPostCoverImage = "";
    if (previewBox) previewBox.style.display = "none";
  }

  modal.classList.add("active");
};

window.closeBlogModal = function() {
  document.getElementById("blog-post-modal").classList.remove("active");
};

// Helper to transliterate and slugify
function getBlogSlug(text) {
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
  const transliterated = text.split('').map(char => map[char] || char).join('');
  return transliterated
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

window.saveBlogPost = async function(event) {
  event.preventDefault();

  const id = document.getElementById("blog-post-id").value;
  const title = document.getElementById("blog-post-title").value.trim();
  const content = document.getElementById("blog-post-content").value;
  
  if (!blogPostCoverImage) {
    alert("Моля, изберете корица за статията!");
    return;
  }

  // Calculate read time: average of 200 words per minute
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  // Related products selection
  const relatedSelect = document.getElementById("blog-post-related-products");
  const relatedProducts = Array.from(relatedSelect.selectedOptions).map(opt => opt.value);

  const postData = {
    title,
    slug: getBlogSlug(title),
    summary: document.getElementById("blog-post-summary").value.trim(),
    content,
    coverImage: blogPostCoverImage,
    readTime,
    category: document.getElementById("blog-post-category").value,
    author: document.getElementById("blog-post-author").value.trim() || "LuxArmor Team",
    relatedProducts,
    isPublished: document.getElementById("blog-post-published").checked,
    createdAt: new Date().toISOString()
  };

  try {
    if (id) {
      // Fetch existing post to preserve original creation date
      const existing = allBlogPosts.find(p => p._id === id);
      if (existing) {
        postData.createdAt = existing.createdAt;
      }
      await convex.mutation("blog:update", { id, ...postData });
    } else {
      await convex.mutation("blog:create", postData);
    }
    closeBlogModal();
    loadDashboardData();
  } catch (err) {
    alert("Грешка при запис на статията: " + err.message);
  }
};

window.deleteBlogPost = async function(postId) {
  if (confirm("Наистина ли искате да изтриете тази статия?")) {
    try {
      await convex.mutation("blog:remove", { id: postId });
      loadDashboardData();
    } catch (err) {
      alert("Грешка при изтриване: " + err.message);
    }
  }
};

window.saveHeroSettings = async function(event) {
  event.preventDefault();
  const heroTitle = document.getElementById("hero-title-input").value.trim();
  const heroSubtitle = document.getElementById("hero-subtitle-input").value.trim();
  
  try {
    await convex.mutation("settings:updateHero", { heroTitle, heroSubtitle });
    alert("Настройките на Hero секцията са запазени успешно!");
  } catch (err) {
    alert("Грешка при запазване на настройките: " + err.message);
  }
};

window.loadPageSeoValues = function() {
  const pageKey = document.getElementById("seo-page-select").value;
  const pageData = allPageMetadata.find(m => m.pageKey === pageKey);
  
  const titleInput = document.getElementById("seo-title-input");
  const descInput = document.getElementById("seo-desc-input");
  
  if (titleInput && descInput) {
    titleInput.value = pageData ? pageData.title : "";
    descInput.value = pageData ? pageData.description : "";
    updateSeoCounters();
  }
};

window.updateSeoCounters = function() {
  const titleInput = document.getElementById("seo-title-input");
  const descInput = document.getElementById("seo-desc-input");
  
  const titleCounter = document.getElementById("seo-title-counter");
  const descCounter = document.getElementById("seo-desc-counter");
  
  if (titleInput && titleCounter) {
    const len = titleInput.value.length;
    titleCounter.textContent = `${len} / 60 знака`;
    titleCounter.style.color = len > 60 ? "var(--danger)" : "rgba(255,255,255,0.4)";
  }
  
  if (descInput && descCounter) {
    const len = descInput.value.length;
    descCounter.textContent = `${len} / 160 знака`;
    descCounter.style.color = len > 160 ? "var(--danger)" : "rgba(255,255,255,0.4)";
  }
};

window.savePageSeoSettings = async function(event) {
  event.preventDefault();
  const pageKey = document.getElementById("seo-page-select").value;
  const title = document.getElementById("seo-title-input").value.trim();
  const description = document.getElementById("seo-desc-input").value.trim();
  
  const submitBtn = event.target.querySelector("button[type='submit']");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Запазване...';
  }
  
  try {
    await convex.mutation("settings:updatePageMetadata", { pageKey, title, description });
    
    // Update local cache
    const existingIdx = allPageMetadata.findIndex(m => m.pageKey === pageKey);
    if (existingIdx !== -1) {
      allPageMetadata[existingIdx].title = title;
      allPageMetadata[existingIdx].description = description;
    } else {
      allPageMetadata.push({ pageKey, title, description });
    }
    
    alert("SEO настройките са запазени успешно!");
  } catch (err) {
    alert("Грешка при запазване: " + err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-save"></i> Запази SEO настройките';
    }
  }
};
