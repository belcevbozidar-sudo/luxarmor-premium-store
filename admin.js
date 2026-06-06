import { ConvexHttpClient } from "https://cdn.jsdelivr.net/npm/convex@1.38.0/browser/+esm";

const convex = new ConvexHttpClient("https://trustworthy-possum-230.eu-west-1.convex.cloud");

let adminToken = localStorage.getItem("caseking_admin_token") || null;
let allProducts = [];
let allBrands = [];
let allModels = [];
let allPromotions = [];
let allOrders = [];

const STATIC_CATEGORIES = [
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

let allCategories = [...STATIC_CATEGORIES];
let uploadedImages = [];
let selectedBrandFilter = null;
let allUsers = [];
let allPromoCodes = [];
let parsedCSVProducts = [];

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
    
    renderProducts();
    renderBrandsAndModels();
    renderPromotions();
    renderOrders();
    renderDashboardStats();
    renderPromoCodes();
    renderB2BUsers();
    populateFormSelects();
  } catch (err) {
    console.error("Error loading dashboard data:", err);
    alert("Грешка при зареждане на данните!");
  }
}

// Populate dropdown lists in modals
function populateFormSelects() {
  const brandSelect = document.getElementById("product-brand");
  const metaBrandSelect = document.getElementById("model-brand-select");
  const giftSelect = document.getElementById("promo-gift-product");
  const categorySelect = document.getElementById("product-category");
  
  brandSelect.innerHTML = '<option value="">-- Избери марка --</option>';
  metaBrandSelect.innerHTML = '<option value="">-- Избери марка --</option>';
  giftSelect.innerHTML = '<option value="">-- Избери подарък --</option>';
  categorySelect.innerHTML = '<option value="">-- Избери категория --</option>';
  
  allBrands.forEach(b => {
    brandSelect.innerHTML += `<option value="${b.name}">${b.name}</option>`;
    metaBrandSelect.innerHTML += `<option value="${b.name}">${b.name}</option>`;
  });
  
  allProducts.forEach(p => {
    giftSelect.innerHTML += `<option value="${p._id}">${p.name} (${p.brand})</option>`;
  });
  
  allCategories.forEach(cat => {
    categorySelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
  });
}

// Update model choices based on selected brand
window.updateProductModelOptions = function() {
  const selectedBrand = document.getElementById("product-brand").value;
  const modelSelect = document.getElementById("product-model");
  
  modelSelect.innerHTML = '<option value="Всички модели">Всички модели</option>';
  
  const filteredModels = allModels.filter(m => m.brand === selectedBrand);
  filteredModels.forEach(m => {
    modelSelect.innerHTML += `<option value="${m.name}">${m.name}</option>`;
  });
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
  tbody.innerHTML = "";
  
  allProducts.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img src="${p.image}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;"></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.brand}</td>
      <td>${p.model}</td>
      <td><span class="admin-badge" style="font-size:0.7rem;">${p.category}</span></td>
      <td>${p.priceB2C?.toFixed(2) || "0.00"} лв.</td>
      <td>${p.priceB2B?.toFixed(2) || "0.00"} лв.</td>
      <td>
        <div class="row-actions">
          <button class="btn-icon" onclick="openProductModal('${p._id}')" title="Редактирай"><i class="fas fa-edit"></i></button>
          <button class="btn-icon delete" onclick="deleteProduct('${p._id}')" title="Изтрий"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

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
          <img src="${cat.image.startsWith('assets/') ? cat.image : cat.image}" class="meta-logo-preview" onerror="this.style.display='none'">
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
        <img src="assets/${b.logo}" class="meta-logo-preview" onerror="this.style.display='none'">
        <strong>${b.name}</strong>
      </div>
      <button class="btn-icon delete" onclick="event.stopPropagation(); deleteBrand('${b._id}')" title="Изтрий марка"><i class="fas fa-trash"></i></button>
    `;
    
    div.addEventListener("click", () => {
      selectedBrandFilter = (selectedBrandFilter === b.name) ? null : b.name;
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
  } else {
    titleSpan.textContent = "Всички Модели";
  }
  
  const filteredModels = selectedBrandFilter 
    ? allModels.filter(m => m.brand === selectedBrandFilter)
    : allModels;
  
  filteredModels.forEach(m => {
    const div = document.createElement("div");
    div.className = "meta-item";
    div.innerHTML = `
      <span><strong>${m.brand}</strong> - ${m.name}</span>
      <button class="btn-icon delete" onclick="deleteModel('${m._id}')" title="Изтрий модел"><i class="fas fa-trash"></i></button>
    `;
    modelsContainer.appendChild(div);
  });
}

window.openBrandModal = function() {
  document.getElementById("brand-modal").classList.add("active");
};
window.closeBrandModal = function() {
  document.getElementById("brand-modal").classList.remove("active");
};
window.saveBrand = async function(event) {
  event.preventDefault();
  const name = document.getElementById("brand-name-input").value.trim();
  const logo = document.getElementById("brand-logo-input").value.trim();
  
  try {
    await convex.mutation("meta:addBrand", { name, logo });
    closeBrandModal();
    loadDashboardData();
  } catch (err) {
    alert(err.message);
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
  select.innerHTML = '<option value="">-- Избери марка --</option>';
  allBrands.forEach(b => {
    select.innerHTML += `<option value="${b.name}">${b.name}</option>`;
  });
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
      <td>над ${p.threshold.toFixed(2)} лв.</td>
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
  tbody.innerHTML = "";
  
  allOrders.forEach(o => {
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
      <td><strong>${o.total.toFixed(2)} лв.</strong></td>
      <td><span class="admin-badge" style="background:${o.clientType==='B2B'?'rgba(204,164,59,0.1)':'rgba(255,255,255,0.05)'}; color:${o.clientType==='B2B'?'var(--gold)':'var(--text)'};">${o.clientType}</span></td>
      <td>${dateStr}</td>
      <td><span class="badge-status ${o.status}">${o.status === 'pending' ? 'Чакаща' : o.status === 'completed' ? 'Завършена' : 'Анулирана'}</span></td>
      <td>
        <button class="btn-icon" onclick="viewOrderDetails('${o._id}')" title="Детайли"><i class="fas fa-eye"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

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
  document.getElementById("order-details-total").textContent = `${o.total.toFixed(2)} лв.`;
  
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
      <td>${item.price.toFixed(2)} лв.</td>
      <td>${item.quantity}</td>
      <td>${itemTotal.toFixed(2)} лв.</td>
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
});

function handleFiles(files) {
  const readers = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith("image/")) continue;
    readers.push(new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    }));
  }
  
  Promise.all(readers).then((results) => {
    uploadedImages = [...uploadedImages, ...results];
    renderImagePreviews();
  });
}

// --- CSV PARSING & PRODUCTS IMPORT ---
function handleCSVFile(file) {
  if (!file.name.endsWith(".csv")) {
    alert("Моля, изберете валиден CSV файл!");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const rows = parseCSVText(text);
    processCSVData(rows);
  };
  reader.readAsText(file, "UTF-8");
}

function parseCSVText(text) {
  // Auto-detect delimiter: comma (,) vs semicolon (;)
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
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === delimiter && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++; // skip next \n
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
    alert("CSV файлът трябва да съдържа поне един ред с хедъри и един ред с данни!");
    return;
  }
  
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const nameIdx = headers.indexOf("name");
  const brandIdx = headers.indexOf("brand");
  const modelIdx = headers.indexOf("model");
  const categoryIdx = headers.indexOf("category");
  const priceB2CIdx = headers.indexOf("priceb2c");
  const priceB2BIdx = headers.indexOf("priceb2b");
  const descIdx = headers.indexOf("description");
  const matIdx = headers.indexOf("material");
  const weightIdx = headers.indexOf("weight");
  const originIdx = headers.indexOf("origin");
  const delIdx = headers.indexOf("delivery");
  const imgIdx = headers.indexOf("image");
  
  if (nameIdx === -1 || brandIdx === -1 || categoryIdx === -1 || priceB2CIdx === -1) {
    alert("Липсват задължителни колони в CSV файла! Задължителни са: Name, Brand, Category, PriceB2C.");
    return;
  }
  
  parsedCSVProducts = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < headers.length) continue;
    if (!row[nameIdx]) continue;
    
    const priceB2C = parseFloat(row[priceB2CIdx]) || 0;
    const priceB2B = priceB2BIdx !== -1 ? (parseFloat(row[priceB2BIdx]) || Math.round(priceB2C * 0.8 * 100) / 100) : (Math.round(priceB2C * 0.8 * 100) / 100);
    
    const product = {
      name: row[nameIdx].trim(),
      brand: row[brandIdx].trim(),
      model: modelIdx !== -1 ? row[modelIdx].trim() : "Всички модели",
      category: row[categoryIdx].trim(),
      priceB2C,
      priceB2B,
      rating: 5,
      tag: null,
      description: descIdx !== -1 ? row[descIdx].trim() : "Премиум аксесоар за телефон",
      specs: {
        material: matIdx !== -1 ? row[matIdx].trim() : "Силикон",
        weight: weightIdx !== -1 ? row[weightIdx].trim() : "30г",
        origin: originIdx !== -1 ? row[originIdx].trim() : "Германия",
        delivery: delIdx !== -1 ? row[delIdx].trim() : "Бърза доставка"
      },
      image: imgIdx !== -1 ? row[imgIdx].trim() : "assets/logo.png"
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
    tr.innerHTML = `
      <td><strong>${p.name}</strong></td>
      <td>${p.brand}</td>
      <td>${p.model}</td>
      <td>${p.category}</td>
      <td>${p.priceB2C.toFixed(2)} лв.</td>
      <td>${p.priceB2B.toFixed(2)} лв.</td>
    `;
    tbody.appendChild(tr);
  });
  
  section.style.display = "block";
}

window.confirmCSVImport = async function() {
  if (parsedCSVProducts.length === 0) return;
  
  if (!confirm(`Сигурни ли сте, че искате да импортирате ${parsedCSVProducts.length} продукта?`)) return;
  
  try {
    let importedCount = 0;
    for (const p of parsedCSVProducts) {
      await convex.mutation("products:create", p);
      importedCount++;
    }
    alert(`Успешно импортирани ${importedCount} продукта!`);
    parsedCSVProducts = [];
    document.getElementById("csv-preview-section").style.display = "none";
    document.getElementById("csv-file-input").value = "";
    loadDashboardData();
  } catch (err) {
    alert("Грешка при импортиране: " + err.message);
  }
};

// --- CATEGORIES MANAGEMENT ---
window.openCategoryModal = function() {
  document.getElementById("category-id-input").value = "";
  document.getElementById("category-name-input").value = "";
  document.getElementById("category-image-input").value = "";
  document.getElementById("category-modal").classList.add("active");
};

window.closeCategoryModal = function() {
  document.getElementById("category-modal").classList.remove("active");
};

window.saveCategory = async function(event) {
  event.preventDefault();
  const id = document.getElementById("category-id-input").value.trim();
  const name = document.getElementById("category-name-input").value.trim();
  const image = document.getElementById("category-image-input").value.trim();
  
  try {
    await convex.mutation("meta:addCategory", { id, name, image });
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
      <td>${code.discountType === "percent" ? "Процентна (%)" : "Фиксирана (лв.)"}</td>
      <td>${code.discountValue}${code.discountType === "percent" ? "%" : " лв."}</td>
      <td>
        <span class="badge-status ${code.active ? 'completed' : 'cancelled'}">
          ${code.active ? 'Да' : 'Не'}
        </span>
      </td>
      <td><strong>${revenue.toFixed(2)} лв.</strong></td>
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
  monthRevenueEl.textContent = `${periodRevenue.toFixed(2)} лв.`;
  lifetimeRevenueEl.textContent = `${lifetimeRevenue.toFixed(2)} лв.`;
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
          <td>${o.total.toFixed(2)} лв.</td>
          <td><span class="admin-badge" style="background:${o.clientType==='B2B'?'rgba(204,164,59,0.1)':'rgba(255,255,255,0.05)'}; color:${o.clientType==='B2B'?'var(--gold)':'var(--text)'};">${o.clientType}</span></td>
          <td><span class="badge-status ${o.status}">${o.status === 'pending' ? 'Чакаща' : o.status === 'completed' ? 'Завършена' : 'Анулирана'}</span></td>
        `;
        recentTbody.appendChild(tr);
      });
    }
  }
}
