import { ConvexHttpClient } from "https://cdn.jsdelivr.net/npm/convex@1.38.0/browser/+esm";

const convex = new ConvexHttpClient("https://trustworthy-possum-230.eu-west-1.convex.cloud");

let adminToken = localStorage.getItem("caseking_admin_token") || null;
let allProducts = [];
let allBrands = [];
let allModels = [];
let allPromotions = [];
let allOrders = [];

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
  document.getElementById("admin-pass").value = "";
  document.getElementById("login-overlay").classList.remove("hidden");
};

window.toggleRememberCheckbox = function() {
  const cb = document.getElementById("remember-me");
  cb.checked = !cb.checked;
};

// --- DATA FETCHING & RENDERING ---
async function loadDashboardData() {
  try {
    allProducts = await convex.query("products:get");
    allBrands = await convex.query("meta:getBrands");
    allModels = await convex.query("meta:getModels");
    allPromotions = await convex.query("promotions:getAll");
    allOrders = await convex.query("orders:get");
    
    renderProducts();
    renderBrandsAndModels();
    renderPromotions();
    renderOrders();
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
  
  brandSelect.innerHTML = '<option value="">-- Избери марка --</option>';
  metaBrandSelect.innerHTML = '<option value="">-- Избери марка --</option>';
  giftSelect.innerHTML = '<option value="">-- Избери подарък --</option>';
  
  allBrands.forEach(b => {
    brandSelect.innerHTML += `<option value="${b.name}">${b.name}</option>`;
    metaBrandSelect.innerHTML += `<option value="${b.name}">${b.name}</option>`;
  });
  
  allProducts.forEach(p => {
    giftSelect.innerHTML += `<option value="${p._id}">${p.name} (${p.brand})</option>`;
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
      document.getElementById("product-image").value = p.image;
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
  }
  
  modal.classList.add("active");
};

window.closeProductModal = function() {
  document.getElementById("product-modal").classList.remove("active");
};

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
    image: document.getElementById("product-image").value,
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

// --- TAB 2: BRANDS & MODELS ---
function renderBrandsAndModels() {
  // Render Brands
  const brandsContainer = document.getElementById("brands-list");
  brandsContainer.innerHTML = "";
  
  allBrands.forEach(b => {
    const div = document.createElement("div");
    div.className = "meta-item";
    div.innerHTML = `
      <div class="meta-item-info">
        <img src="assets/${b.logo}" class="meta-logo-preview" onerror="this.style.display='none'">
        <strong>${b.name}</strong>
      </div>
      <button class="btn-icon delete" onclick="deleteBrand('${b._id}')" title="Изтрий марка"><i class="fas fa-trash"></i></button>
    `;
    brandsContainer.appendChild(div);
  });
  
  // Render Models
  const modelsContainer = document.getElementById("models-list");
  modelsContainer.innerHTML = "";
  
  allModels.forEach(m => {
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
document.addEventListener("DOMContentLoaded", checkAuth);
