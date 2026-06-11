import { ConvexHttpClient } from "https://cdn.jsdelivr.net/npm/convex@1.38.0/browser/+esm";

const convex = new ConvexHttpClient("https://trustworthy-possum-230.eu-west-1.convex.cloud");

// APP STATE
let ALL_POSTS = [];
let ACTIVE_CATEGORY = "all";
let SEARCH_QUERY = "";

// Category Mapping (internal ID to Bulgarian display name)
const CATEGORY_MAP = {
  all: "Всички",
  guides: "Ръководства",
  news: "Новини",
  reviews: "Ревюта"
};

// Transliterate function to match product image proxy logic if needed
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

// Slugify helper for product URLs
function getProductSlug(name) {
  if (!name) return "";
  const transliterated = transliterateBulgarian(name.toString().toLowerCase());
  return transliterated
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Format date helper (e.g. 2026-06-11T17:14:18 -> 11 юни 2026)
function formatDate(isoString) {
  try {
    const date = new Date(isoString);
    const months = [
      "януари", "февруари", "март", "април", "май", "юни",
      "юли", "август", "септември", "октомври", "ноември", "декември"
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} г.`;
  } catch (e) {
    return isoString;
  }
}

// --- CLIENT-SIDE ROUTER ---
async function handleBlogRouting() {
  const path = window.location.pathname;
  const blogListView = document.getElementById("blog-list-view");
  const blogPostView = document.getElementById("blog-post-view");
  
  if (!blogListView || !blogPostView) return;
  
  let slug = null;
  if (path.startsWith("/blog/")) {
    slug = path.substring("/blog/".length);
  }
  
  if (slug) {
    blogListView.style.display = "none";
    blogPostView.style.display = "block";
    await renderBlogPost(slug);
    window.scrollTo(0, 0);
  } else {
    blogPostView.style.display = "none";
    blogListView.style.display = "block";
    renderBlogList();
  }
}

// --- RENDER ARTICLE LIST ---
function renderBlogList() {
  const grid = document.getElementById("blog-grid");
  if (!grid) return;
  
  // Filter posts
  let filtered = ALL_POSTS;
  
  if (ACTIVE_CATEGORY !== "all") {
    filtered = filtered.filter(post => post.category === ACTIVE_CATEGORY);
  }
  
  if (SEARCH_QUERY) {
    const query = SEARCH_QUERY.toLowerCase();
    filtered = filtered.filter(post => 
      post.title.toLowerCase().includes(query) || 
      post.summary.toLowerCase().includes(query)
    );
  }
  
  // Update browser titles and SEO tags for blog homepage
  document.title = "Блог | CaseKing - Премиум Ръководства и Новини за Аксесоари";
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute("content", "Полезни съвети, ревюта на продукти и ръководства за избор на най-добрите кейсове и аксесоари за мобилни телефони от CaseKing.");
  }
  
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="text-align: center; grid-column: span 3; padding: 4rem 1rem; color: var(--text-muted);">
        <i class="fas fa-search" style="font-size: 2.5rem; color: var(--border-color); margin-bottom: 1rem; display: block;"></i>
        <p style="font-size: 1.1rem; font-weight: 500;">Няма намерени статии за избраните филтри.</p>
        <button class="btn-secondary" onclick="resetBlogFilters()" style="margin-top: 1rem; padding: 0.5rem 1rem;">Изчисти филтрите</button>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = "";
  
  filtered.forEach(post => {
    const card = document.createElement("article");
    card.className = "blog-card";
    card.style.cssText = "background: var(--bg-white); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; transition: transform 0.3s, box-shadow 0.3s; cursor: pointer;";
    
    // Hover animation
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-5px)";
      card.style.boxShadow = "var(--shadow-md)";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)";
      card.style.boxShadow = "var(--shadow-sm)";
    });
    
    card.addEventListener("click", () => {
      history.pushState(null, "", "/blog/" + post.slug);
      handleBlogRouting();
    });
    
    const catText = CATEGORY_MAP[post.category] || post.category;
    
    card.innerHTML = `
      <div style="width: 100%; aspect-ratio: 16/10; overflow: hidden; background: #000;">
        <img src="${post.coverImage}" alt="${post.title}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
      </div>
      <div style="padding: 1.5rem; display: flex; flex-direction: column; flex: 1;">
        <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem; font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">
          <span style="color: var(--gold); text-transform: uppercase;">${catText}</span>
          <span>•</span>
          <span>${formatDate(post.createdAt)}</span>
        </div>
        <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--primary); line-height: 1.3; margin-bottom: 0.75rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${post.title}</h3>
        <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; flex: 1;">${post.summary}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1rem; font-size: 0.8rem; color: var(--text-muted);">
          <span><i class="far fa-clock"></i> ${post.readTime} мин. четене</span>
          <span style="color: var(--gold); font-weight: 600; display: flex; align-items: center; gap: 0.25rem;">
            Още <i class="fas fa-arrow-right" style="font-size: 0.75rem;"></i>
          </span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// --- RENDER ARTICLE DETAIL ---
async function renderBlogPost(slug) {
  const container = document.getElementById("blog-post-view");
  if (!container) return;
  
  // Show loader while fetching
  const contentEl = document.getElementById("post-content");
  contentEl.innerHTML = `
    <div style="text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
      <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--gold); margin-bottom: 1rem;"></i>
      <p>Зареждане на статията...</p>
    </div>
  `;
  
  try {
    const post = await convex.query("blog:getBySlug", { slug });
    
    if (!post) {
      // Clean up route if not found
      history.replaceState(null, "", "/blog");
      handleBlogRouting();
      return;
    }
    
    // Set text elements
    document.getElementById("post-breadcrumb-title").textContent = post.title;
    document.getElementById("post-category-badge").textContent = CATEGORY_MAP[post.category] || post.category;
    document.getElementById("post-date").textContent = formatDate(post.createdAt);
    document.getElementById("post-readtime").innerHTML = `<i class="far fa-clock"></i> ${post.readTime} мин. четене`;
    document.getElementById("post-title").textContent = post.title;
    document.getElementById("post-summary").textContent = post.summary;
    document.getElementById("post-cover-image").src = post.coverImage;
    document.getElementById("post-author").textContent = post.author || "LuxArmor Team";
    
    // Set content safely (sanitized at database layer or trusted)
    contentEl.innerHTML = post.content;
    
    // Set dynamic browser titles and SEO tags
    document.title = `${post.title} | Блог CaseKing`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", post.summary);
    }
    
    // Render related products
    await renderRelatedProducts(post.relatedProducts);
    
  } catch (err) {
    console.error("Error fetching blog post details:", err);
    contentEl.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--danger);">
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
        <p>Грешка при зареждането на статията. Моля, опитайте отново по-късно.</p>
        <button class="btn-secondary" onclick="backToBlogList()" style="margin-top: 1.5rem;">Назад към блога</button>
      </div>
    `;
  }
}

// --- RENDER RELATED PRODUCTS ---
async function renderRelatedProducts(productIds) {
  const section = document.getElementById("post-related-products-section");
  const grid = document.getElementById("post-related-products-grid");
  
  if (!section || !grid) return;
  
  if (!productIds || productIds.length === 0) {
    section.style.display = "none";
    return;
  }
  
  try {
    const fetchPromises = productIds.map(id => 
      convex.query("products:getById", { id }).catch(() => null)
    );
    
    const products = await Promise.all(fetchPromises);
    const validProducts = products.filter(Boolean);
    
    if (validProducts.length === 0) {
      section.style.display = "none";
      return;
    }
    
    section.style.display = "block";
    grid.innerHTML = "";
    
    // Check user type for pricing
    const currentUser = JSON.parse(localStorage.getItem("caseking_current_user")) || null;
    const isB2B = currentUser && currentUser.clientType === "B2B";
    const BGN_RATE = 1.95583;
    
    function formatPrice(val) {
      const eurVal = parseFloat(val);
      if (isNaN(eurVal)) return "";
      const bgnVal = eurVal * BGN_RATE;
      return `${eurVal.toFixed(2)} € (${bgnVal.toFixed(2)} лв.)`;
    }
    
    validProducts.forEach(product => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.style.cursor = "pointer";
      
      card.onclick = (e) => {
        if (e.target.classList.contains("btn-card-buy") || e.target.closest(".btn-card-buy")) {
          return;
        }
        const slug = getProductSlug(product.name + " " + (product.model || ""));
        window.location.href = "/produkt/" + slug;
      };
      
      let ratingStars = "";
      for (let i = 1; i <= 5; i++) {
        ratingStars += `<i class="${i <= product.rating ? 'fas' : 'far'} fa-star"></i>`;
      }
      
      const tagHtml = product.tag ? `<span class="badge-tag sale">${product.tag}</span>` : "";
      
      const price = isB2B ? (product.priceB2B ?? product.price) : (product.priceB2C ?? product.price);
      const oldPrice = isB2B ? product.oldPriceB2B : (product.oldPriceB2C ?? product.oldPrice);
      
      const priceHtml = oldPrice 
        ? `<span class="product-price old-price">${formatPrice(oldPrice)}</span>
           <span class="product-price" style="color: var(--accent);">${formatPrice(price)} ${isB2B ? '<span style="font-size:0.65rem; font-weight:600; color:var(--gold);">B2B</span>' : ''}</span>`
        : `<span class="product-price">${formatPrice(price)} ${isB2B ? '<span style="font-size:0.65rem; font-weight:600; color:var(--gold);">B2B</span>' : ''}</span>`;
  
      card.innerHTML = `
        ${tagHtml}
        <div class="product-image-container">
          <img class="product-img" src="${product.image}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-details">
          <span class="product-category">${product.brand}</span>
          <h3 class="product-name">${product.name}</h3>
          <div class="product-rating">${ratingStars}</div>
          <div class="product-price-box">
            ${priceHtml}
          </div>
          <button class="btn-card-buy" onclick="window.addToCart('${product._id}', 1)">Добави в количката</button>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading related products:", err);
    section.style.display = "none";
  }
}

// --- FILTER & SEARCH ACTIONS ---
window.filterBlogCategory = function(catId) {
  ACTIVE_CATEGORY = catId;
  
  // Update active pill styling
  const pills = document.querySelectorAll("#blog-categories-pills button");
  pills.forEach(pill => {
    const onclickAttr = pill.getAttribute("onclick");
    if (onclickAttr && onclickAttr.includes(`'${catId}'`)) {
      pill.classList.add("active");
    } else {
      pill.classList.remove("active");
    }
  });
  
  renderBlogList();
};

window.handleBlogSearch = function() {
  const searchInput = document.getElementById("blog-search-input");
  if (searchInput) {
    SEARCH_QUERY = searchInput.value;
    renderBlogList();
  }
};

window.resetBlogFilters = function() {
  ACTIVE_CATEGORY = "all";
  SEARCH_QUERY = "";
  
  const searchInput = document.getElementById("blog-search-input");
  if (searchInput) searchInput.value = "";
  
  // Set first pill to active
  const pills = document.querySelectorAll("#blog-categories-pills button");
  pills.forEach((pill, idx) => {
    if (idx === 0) pill.classList.add("active");
    else pill.classList.remove("active");
  });
  
  renderBlogList();
};

window.backToBlogList = function() {
  history.pushState(null, "", "/blog");
  handleBlogRouting();
};

// --- SHARE BUTTONS IMPLEMENTATIONS ---
window.shareOnFacebook = function() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "width=600,height=400");
};

window.shareOnViber = function() {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.title);
  window.open(`viber://forward?text=${title}%20-%20${url}`, "_blank");
};

window.copyPostLink = function() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById("btn-copy-link");
    if (btn) {
      btn.innerHTML = `<i class="fas fa-check" style="color: #2ecc71;"></i>`;
      btn.title = "Копирано!";
      setTimeout(() => {
        btn.innerHTML = `<i class="fas fa-link"></i>`;
        btn.title = "Копирай линк";
      }, 2000);
    }
  }).catch(err => {
    console.error("Could not copy link:", err);
  });
};

// --- INITIAL LOAD ---
async function loadBlogData() {
  try {
    const posts = await convex.query("blog:getPublished");
    if (posts) {
      // Sort published articles by date desc
      ALL_POSTS = posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    await handleBlogRouting();
  } catch (err) {
    console.error("Error loading blog posts:", err);
    const grid = document.getElementById("blog-grid");
    if (grid) {
      grid.innerHTML = `
        <div style="text-align: center; grid-column: span 3; padding: 4rem 1rem; color: var(--danger);">
          <i class="fas fa-exclamation-circle" style="font-size: 2.5rem; margin-bottom: 1rem; display: block;"></i>
          <p style="font-size: 1.1rem; font-weight: 500;">Възникна системна грешка при зареждане на блога. Моля, опитайте по-късно.</p>
        </div>
      `;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadBlogData();
  
  // Routing listeners
  window.addEventListener("popstate", handleBlogRouting);
  window.addEventListener("hashchange", handleBlogRouting);
});
