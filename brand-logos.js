// ============================================================
//  BRAND LOGOS — автоматично попълване по име на марката
//  ------------------------------------------------------------
//  Марките се пазят в Convex (таблица `brands`) с поле `logo`.
//  Когато записът няма лого (празно поле или дефолтното
//  "logo.webp"), тук се търси файл по НОРМАЛИЗИРАНОТО име на
//  марката, за да не остава празно квадратче в интерфейса.
//
//  Ръчно каченото лого от админ панела ВИНАГИ има приоритет.
// ============================================================

export const DEFAULT_BRAND_LOGO = "logo.webp";

// нормализиран ключ -> файл в /assets
export const BRAND_LOGO_FILES = {
  // --- телефонни марки ---
  apple: "logo_apple.webp",
  iphone: "logo_apple.webp",
  samsung: "logo_samsung.webp",
  galaxy: "logo_samsung.webp",
  xiaomi: "logo_xiaomi.webp",
  redmi: "logo_xiaomi.webp",
  poco: "logo_xiaomi.webp",
  huawei: "logo_huawei.webp",
  honor: "logo_honor.webp",
  google: "logo_google.webp",
  pixel: "logo_google.webp",
  moto: "logo_moto.webp",
  motorola: "logo_moto.webp",
  oppo: "logo_oppo.webp",
  vivo: "logo_vivo.webp",
  realme: "logo_realme.webp",
  oneplus: "logo_oneplus.webp",
  infinix: "logo_infinix.webp",
  nokia: "logo_nokia.webp",
  lg: "logo_lg.webp",
  tcl: "logo_tcl.webp",
  lenovo: "logo_lenovo.webp",
  asus: "logo_asus.webp",
  asusrog: "logo_asus.webp",
  rog: "logo_asus.webp",
  tecno: "logo_tecno.webp",
  nothing: "logo_nothing.webp",
  nothingphone: "logo_nothing.webp",
  sony: "logo_sony.webp",
  sonyxperia: "logo_sony.webp",
  xperia: "logo_sony.webp",

  // --- часовникови марки ---
  applewatch: "logo_apple_watch.webp",
  watchapple: "logo_apple_watch.webp",
  samsungwatch: "logo_samsung_watch.webp",
  galaxywatch: "logo_samsung_watch.webp",
  samsunggalaxywatch: "logo_samsung_watch.webp",
  googlewatch: "logo_google_watch.webp",
  pixelwatch: "logo_google_watch.webp",
  googlepixelwatch: "logo_google_watch.webp",
  garmin: "logo_garmin.webp",
  amazfit: "logo_amazfit.webp",
  huaweiwatch: "logo_huawei.webp",
  xiaomiwatch: "logo_xiaomi.webp",

  // --- аксесоарни марки ---
  "3mk": "logo_3mk.webp",
  acefast: "logo_acefast.webp",
  ainope: "logo_ainope.webp",
  anker: "logo_anker.webp",
  baseus: "logo_baseus.webp",
  blueo: "logo_blueo.webp",
  bluo: "logo_blueo.webp",
  borofone: "logo_borofone.webp",
  dato: "logo_dato.webp",
  duxducis: "logo_dux_ducis.webp",
  esr: "logo_esr.webp",
  guess: "logo_guess.webp",
  havit: "logo_havit.webp",
  hellokitty: "logo_hello_kitty.webp",
  imou: "logo_imou.webp",
  karl: "logo_karl_lagerfeld.webp",
  karllagerfeld: "logo_karl_lagerfeld.webp",
  lagerfeld: "logo_karl_lagerfeld.webp",
  lisen: "logo_lisen.webp",
  lito: "logo_lito.webp",
  mcdodo: "logo_mcdodo.webp",
  proove: "logo_proove.webp",
  ringke: "logo_ringke.webp",
  spigen: "logo_spigen.webp",
  uag: "logo_uag.webp",
  urbanarmorgear: "logo_uag.webp",
  uniq: "logo_uniq.webp",
  yesido: "logo_yesido.webp",
};

// "Dux Ducis" -> "duxducis", "Apple Watch" -> "applewatch"
export function normalizeBrandKey(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[\s._\-+/&']/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Търси лого по име: първо точно съвпадение, после без думата "watch",
// накрая по първата дума (напр. "Baseus Bowie" -> "baseus").
export function findBrandLogoFile(name) {
  const key = normalizeBrandKey(name);
  if (!key) return null;
  if (BRAND_LOGO_FILES[key]) return BRAND_LOGO_FILES[key];

  const first = normalizeBrandKey(String(name).split(/[\s\-_/]+/)[0]);
  if (first && BRAND_LOGO_FILES[first]) return BRAND_LOGO_FILES[first];

  return null;
}

/**
 * Връща src за <img> на дадена марка.
 * @param {object|string} brand  запис от таблица `brands` или само име
 * @param {string} prefix        "assets/" или "/assets/" според страницата
 */
export function resolveBrandLogo(brand, prefix = "assets/") {
  const isObj = brand && typeof brand === "object";
  const name = isObj ? brand.name : brand;
  const stored = isObj ? brand.logo : null;

  // 1) качено от админа (base64) - най-висок приоритет
  if (stored && String(stored).startsWith("data:")) return stored;
  // 2) външен URL
  if (stored && /^https?:\/\//i.test(stored)) return stored;
  // 3) изрично зададен файл, различен от дефолтния
  if (stored && stored !== DEFAULT_BRAND_LOGO) return prefix + stored;
  // 4) автоматично попълване по име
  const auto = findBrandLogoFile(name);
  if (auto) return prefix + auto;
  // 5) дефолт
  return prefix + DEFAULT_BRAND_LOGO;
}

// Дали марката би останала без реално лого (за индикация в админа).
export function hasBrandLogo(brand) {
  const isObj = brand && typeof brand === "object";
  const stored = isObj ? brand.logo : null;
  if (stored && stored !== DEFAULT_BRAND_LOGO) return true;
  return Boolean(findBrandLogoFile(isObj ? brand.name : brand));
}
