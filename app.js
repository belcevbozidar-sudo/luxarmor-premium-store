// --- PREMIUM PHONE ACCESSORIES DATASET ---
const PRODUCTS = [
  {
    id: 1,
    name: "Кожен Кейс с MagSafe (Premium)",
    category: "cases",
    categoryBg: "Кейсове",
    price: 69.00,
    oldPrice: 99.00,
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "БЕСТСЕЛЪР",
    description: "Луксозен калъф, ръчно изработен от естествена селектирана телешка кожа с вградена MagSafe технология. Осигурява перфектно магнитно прилепване с всички MagSafe аксесоари, надеждна защита от удари и изключително меко усещане в ръката. Развива красива индивидуална патина с течение на времето.",
    specs: {
      metal: "Естествена телешка кожа & Микрофибър",
      weight: "iPhone 13, 14, 15, 16 Pro / Pro Max серии",
      stone: "Вграден подсилен MagSafe магнитен пръстен",
      packaging: "Луксозна маркова кутия и безплатна експресна доставка"
    }
  },
  {
    id: 2,
    name: "Карбонов Кейс UltraSlim Kevlar",
    category: "cases",
    categoryBg: "Кейсове",
    price: 79.00,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1586953983027-d7508a64f4bb?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "ХИТ",
    description: "Изключително лек и невероятно здрав защитен калъф, направен от 100% истински арамидни влакна (Kevlar). С дебелина от едва 0.6 мм, той придава усещане за работа с телефон без калъф, като същевременно осигурява военен клас защита от надрасквания и изпускания. Матово нехлъзгащо покритие.",
    specs: {
      metal: "100% Арамидни влакна (Aerospace Carbon/Kevlar)",
      weight: "iPhone 14, 15, 16 Pro / Pro Max серии",
      stone: "Ултратънък профил 0.6 мм, тегло само 12г",
      packaging: "Премиум твърда LuxArmor кутия със сертификат"
    }
  },
  {
    id: 3,
    name: "3-в-1 Безжична Станция VoltDock",
    category: "chargers",
    categoryBg: "Зарядни",
    price: 119.00,
    oldPrice: 159.00,
    image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "ПРЕМИУМ",
    description: "Елегантна мултифункционална станция за безжично зареждане от авиационен алуминий и закалено стъкло. Зарежда едновременно Вашия iPhone (MagSafe), Apple Watch и безжични слушалки (AirPods). Снабдена с интелигентен чип за автоматично регулиране на напрежението и контрол на температурата.",
    specs: {
      metal: "Авиационен алуминий & Закалено стъкло с LED индиактор",
      weight: "Смартфони с MagSafe, Apple Watch 3-9/Ultra, AirPods Pro",
      stone: "Обща мощност 25W (15W MagSafe + 5W Watch + 5W AirPods)",
      packaging: "Луксозна кутия, 1м бърз USB-C кабел, инструкции"
    }
  },
  {
    id: 4,
    name: "Бързо Зарядно GaN 65W Turbo",
    category: "chargers",
    categoryBg: "Зарядни",
    price: 55.00,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "НОВО",
    description: "Супер компактно мрежово зарядно устройство, захранвано от иновативната GaN (галиев нитрид) технология от 3-то поколение. Снабдено с 2x USB Type-C порта и 1x USB-A порт, то е достатъчно мощно да зареди бързо Вашия смартфон, таблет и лаптоп (MacBook Air/Pro) едновременно.",
    specs: {
      metal: "Висококачествен огнеупорен поликарбонат (V0 клас)",
      weight: "Всички съвременни смартфони, таблети и лаптопи с USB-C",
      stone: "Max 65W Power Delivery 3.0 / Quick Charge 4+",
      packaging: "Предпазна кутия и 2 години гаранция"
    }
  },
  {
    id: 5,
    name: "Протектори Sapphire Shield",
    category: "protectors",
    categoryBg: "Протектори",
    price: 29.00,
    oldPrice: 39.00,
    image: "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "ХИТ",
    description: "Индивидуални предпазители за камерите на Вашия смартфон, изработени от истински синтетичен сапфирен кристал и алуминиеви рамки, съвпадащи точно с цвета на корпуса. Предлагат максимална твърдост 9H за защита от силни удари и надраскване, без да влияят на качеството на снимките и светкавицата.",
    specs: {
      metal: "Синтетичен сапфир с олеофобно покритие & Алуминиев обков",
      weight: "iPhone 13, 14, 15, 16 Pro / Pro Max серии",
      stone: "Максимална твърдост 9H, AR антирефлексна технология",
      packaging: "Комплект от 3 броя, професионален шаблон за лесно поставяне"
    }
  },
  {
    id: 6,
    name: "9D Темпериран Стъклен Протектор",
    category: "protectors",
    categoryBg: "Протектори",
    price: 35.00,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&q=80&w=800",
    rating: 4,
    tag: null,
    description: "Висококачествен стъклен протектор за екран с извити 9D омекотени ръбове за цялостно покритие. С Full Glue технологията лепилото е разпределено по цялата повърхност, предотвратявайки появата на балончета. Специален филтър против отблясъци и олеофобен слой против пръстови отпечатъци.",
    specs: {
      metal: "Японско закалено стъкло Asahi Glass (9H)",
      weight: "iPhone, Samsung Galaxy, Xiaomi най-нови модели",
      stone: "0.33 мм дебелина, 99.9% оптична прозрачност, Full Glue",
      packaging: "Защитен твърд плик, мокри и сухи кърпички, стикери за прах"
    }
  },
  {
    id: 7,
    name: "Магнитна Стойка за Кола MagHold",
    category: "accessories",
    categoryBg: "Аксесоари",
    price: 49.00,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "БЕСТСЕЛЪР",
    description: "Стилна и супер компактна магнитна стойка за кола за вентилационна решетка, изцяло съвместима с MagSafe стандарта. Оборудвана с 16 свръхсилни N52 неодимови магнита, които ще държат телефона Ви непоклатим дори при преминаване през големи дупки или неравности. 360-градусов ъгъл на въртене.",
    specs: {
      metal: "Анодиран алуминий & Противоплъзгащ софт силиконов фронт",
      weight: "Смартфони с вграден MagSafe или всякакви телефони с пластина",
      stone: "16x N52 неодимови магнита, усилена щипка за решетка",
      packaging: "Стойка MagHold, метална пластина за калъф, кутия"
    }
  },
  {
    id: 8,
    name: "MagSafe Power Bank 10000mAh",
    category: "chargers",
    categoryBg: "Зарядни",
    price: 89.00,
    oldPrice: 119.00,
    image: "https://images.unsplash.com/photo-1574920162043-b872873f19c8?auto=format&fit=crop&q=80&w=800",
    rating: 5,
    tag: "НАМАЛЕНИЕ",
    description: "Преносима батерия (Power Bank) от ново поколение с капацитет 10 000 mAh и бързо MagSafe безжично зареждане. С ултра компактен плосък дизайн и вградена метална сгъваема стойка, която Ви позволява да гледате видео, докато телефонът се зарежда. LED дисплей за оставащия капацитет.",
    specs: {
      metal: "Огнеупорен ABS & Софт-тъч покритие & Метална стойка",
      weight: "Съвместими устройства с безжично зареждане Qi / MagSafe",
      stone: "15W безжично MagSafe + 22.5W Power Delivery USB-C изход/вход",
      packaging: "MagSafe батерия, 0.5м USB-C бърз кабел, подаръчна опаковка"
    }
  }
];

// --- SHOPPING CART STATE ---
let cart = JSON.parse(localStorage.getItem('luxarmor_cart')) || [];
let activeQuickViewProduct = null;

// --- DYNAMIC RENDER FUNCTIONS ---
function renderCatalog(filter = "all") {
  const grid = document.getElementById("product-grid");
  if (!grid) return;
  
  grid.innerHTML = "";
  const filteredProducts = filter === "all" ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);
  
  filteredProducts.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    
    // Star Rating HTML
    let ratingStars = "";
    for (let i = 1; i <= 5; i++) {
      ratingStars += `<i class="${i <= product.rating ? 'fas' : 'far'} fa-star"></i>`;
    }
    
    // Tag Badge HTML
    const tagHtml = product.tag ? `<span class="badge-tag ${product.tag === 'НАМАЛЕНИЕ' ? 'sale' : product.tag === 'БЕСТСЕЛЪР' ? 'sale' : ''}">${product.tag}</span>` : "";
    
    // Old price HTML
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
        <span class="product-category">${product.categoryBg}</span>
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

// --- SAVE CART ---
function saveCart() {
  localStorage.setItem('luxarmor_cart', JSON.stringify(cart));
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

// --- CART SIDEBAR VISIBILITY ---
function openCartSidebar() {
  document.getElementById("cart-overlay").classList.add("active");
}

function closeCartSidebar() {
  document.getElementById("cart-overlay").classList.remove("active");
}

// --- QUICK VIEW MODAL CONTROLS ---
function openQuickView(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  
  activeQuickViewProduct = product;
  
  document.getElementById("modal-cat").textContent = product.categoryBg;
  document.getElementById("modal-title").textContent = product.name;
  document.getElementById("modal-desc").textContent = product.description;
  document.getElementById("modal-image").src = product.image;
  document.getElementById("modal-image").alt = product.name;
  
  // Specs
  document.getElementById("spec-metal").textContent = product.specs.metal;
  document.getElementById("spec-weight").textContent = product.specs.weight;
  document.getElementById("spec-stone").textContent = product.specs.stone;
  document.getElementById("spec-packaging").textContent = product.specs.packaging;
  
  // Rating & Price
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
  
  // Reset Qty stepper in modal
  document.getElementById("modal-qty-val").textContent = "1";
  
  document.getElementById("quickview-overlay").classList.add("active");
}

function closeQuickView() {
  document.getElementById("quickview-overlay").classList.remove("active");
  activeQuickViewProduct = null;
}

// --- INTERACTIVE CHECKOUT SIMULATION ---
function handleCheckout(event) {
  event.preventDefault();
  
  const name = document.getElementById("checkout-name").value.trim();
  const phone = document.getElementById("checkout-phone").value.trim();
  const address = document.getElementById("checkout-address").value.trim();
  
  if (!name || !phone || !address) {
    alert("Моля попълнете всички задължителни полета за бърза поръчка!");
    return;
  }
  
  // Generate random order tracking number
  const orderNum = "LA-ACC-" + Math.floor(100000 + Math.random() * 900000);
  
  // Display the Success Screen Overlay
  document.getElementById("order-tracking-id").textContent = orderNum;
  document.getElementById("success-screen").classList.add("active");
  
  // Clear Shopping Cart state
  cart = [];
  saveCart();
  closeCartSidebar();
}

function closeSuccessScreen() {
  document.getElementById("success-screen").classList.remove("active");
  // Clean up input fields in form
  document.getElementById("checkout-form-id").reset();
}

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  // 1. Initial product rendering
  renderCatalog("all");
  updateCartCount();
  renderCartItems();
  
  // 2. Sticky header scroll transition
  window.addEventListener("scroll", () => {
    const header = document.querySelector("header");
    if (window.scrollY > 30) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
  
  // 3. Category Filter Tabs Event handlers
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      filterBtns.forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      const category = e.target.getAttribute("data-filter");
      renderCatalog(category);
    });
  });
  
  // 4. Modal Quantity Steppers
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
  
  // 5. Checkout submit event registration
  const formElement = document.getElementById("checkout-form-id");
  if (formElement) {
    formElement.addEventListener("submit", handleCheckout);
  }
});
