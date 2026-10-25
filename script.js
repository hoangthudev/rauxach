"use strict";

/**
 * Lá Lành — website bán rau sạch (frontend demo, không có máy chủ / cổng thanh toán).
 * Dữ liệu sản phẩm ở đây là dữ liệu minh hoạ, dễ chỉnh sửa khi học HTML/CSS/JS.
 */


const PRODUCTS = [
    {
        id: 1,
        name: "Xà lách",
        category: "rau-la",
        price: 15000,
        soluong: "250g",
        unit: "bó",
        image: "xalach.jpg",
        tint: "mint",
        badge: "Tươi mới",
        descripton: ""
    },
    {
        id: 2,
        name: "Cải kale",
        category: "rau-la",
        price: 22000,
        soluong: "250g",
        unit: "bó",
        image: "caikale.jpg",
        tint: "sage",
        badge: "Yêu thích",
        descripton: ""
    },
    {
        id: 3,
        name: "Cải ngọt",
        category: "rau-la",
        price: 19000,
        soluong: "500g",
        unit: "bó",
        image: "caingot.jpg",
        tint: "mint",
        badge: "Mới hái",
        descripton: ""
    },
    {
        id: 4,
        name: "Cải thìa",
        category: "rau-la",
        price: 22000,
        soluong: "500g",
        unit: "bó",
        image: "caithia.jpg",
        tint: "mint",
        badge: "Tươi mới",
        descripton: ""
    },
    {
        id: 5,
        name: "Cải xanh",
        category: "rau-la",
        price: 19000,
        soluong: "500g",
        unit: "bó",
        image: "caixanh.jpg",
        tint: "sage",
        badge: "Bán chạy",
        descripton: ""
    },
    {
        id: 6,
        name: "Combo Salad",
        category: "combo",
        price: 32000,
        soluong: "450g",
        unit: "bó",
        image: "combosalad.jpg",
        tint: "sage",
        badge: "Bán chạy",
        descripton: "200g Xà lách + 250g Kale"
    },
    {
        id: 7,
        name: "Combo rau hằng ngày",
        category: "combo",
        price: 59000,
        soluong: "1500g",
        unit: "bó",
        image: "comborauhangngay.jpg",
        tint: "sage",
        badge: "Bán chạy",
        descripton: "500g Cải thìa + 500g Cải ngọt + 500g Cải xanh"
    }
];

const CATEGORIES = [
    { id: "all", name: "Tất cả sản phẩm", icon: "✳" },
    { id: "rau-la", name: "Rau xanh", icon: "🥬" },
    { id: "combo", name: "Combo rau", icon: "🥬" },
];



const CART_KEY = "la-lanh-cart-v1";
const PREFS_KEY = "la-lanh-prefs-v1";
const SHIPPING_FREE_AT = 399000;
const PAGE_SIZE = 8;
const currency = amount => `${Math.round(amount).toLocaleString("vi-VN")}đ`;
const byId = id => PRODUCTS.find(product => product.id === Number(id));
const $ = selector => document.querySelector(selector);

function readStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch (_) {
        return fallback;
    }
}
function writeStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* Dùng trạng thái hiện tại nếu trình duyệt chặn storage. */ }
}
function loadCart() {
    const saved = readStorage(CART_KEY, []);
    if (!Array.isArray(saved)) return [];
    const items = new Map();
    saved.forEach(item => {
        const product = item && byId(item.id);
        if (!product) return;
        const qty = Math.min(99, Math.max(1, Math.floor(Number(item.quantity) || 1)));
        items.set(product.id, Math.min(99, (items.get(product.id) || 0) + qty));
    });
    return Array.from(items, ([id, quantity]) => ({ id, quantity }));
}
let cart = loadCart();
const savedPrefs = readStorage(PREFS_KEY, {});
let preferences = {
    coupon: ["GIAM10", "GIAM50", "FREESHIP"].includes(savedPrefs?.coupon) ? savedPrefs.coupon : "",
    shipping: savedPrefs?.shipping === "express" ? "express" : "standard"
};
let couponFeedback = "";
let toastTimer;

function saveCart() { writeStorage(CART_KEY, cart); updateCartBadges(); }
function savePreferences() { writeStorage(PREFS_KEY, preferences); }
function cartQuantity() { return cart.reduce((sum, item) => sum + item.quantity, 0); }
function subtotalPrice() { return cart.reduce((sum, item) => sum + (byId(item.id)?.price || 0) * item.quantity, 0); }
function normalize(text) {
    return String(text).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();
}

function calculateOrder() {
    const subtotal = subtotalPrice();
    let discount = 0;
    if (subtotal > 0 && preferences.coupon === "GIAM10") discount = Math.round(subtotal * 0.1);
    if (subtotal >= 500000 && preferences.coupon === "GIAM50") discount = 50000;
    let shipping = 0;
    if (subtotal > 0) {
        shipping = preferences.shipping === "express" ? 60000 : (subtotal >= SHIPPING_FREE_AT ? 0 : 30000);
        if (preferences.coupon === "FREESHIP") shipping = 0;
    }
    return { subtotal, discount: Math.min(discount, subtotal), shipping, total: Math.max(0, subtotal - discount + shipping) };
}

function renderShell() {
    const page = document.body.dataset.page;
    const navSelected = page === "home" ? "home" : page === "catalog" || page === "cart" || page === "checkout" ? "catalog" : "";
    const logo = `<span class="brand-symbol" aria-hidden="true"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="22" fill="#24613f"/><path d="M30.8 10.8c-10.5 1.4-17.7 5.7-18 14.2-.1 4.6 3.3 8.8 8.3 8.8 9.1 0 12.2-11.9 9.7-23Z" fill="#c5ec91"/><path d="M15.1 31c5.8-8.2 11-11.8 16.1-15.8" stroke="#24613f" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg></span><span class="brand-name"><strong>Lá Lành<span class="brand-dot">.</span></strong><small>FRESH & NATURAL</small></span>`;
    const links = `<a class="${navSelected === "home" ? "is-active" : ""}" href="index.html">Trang chủ</a><a class="${navSelected === "catalog" ? "is-active" : ""}" href="san-pham.html">Cửa hàng</a><a href="index.html#categories">Danh mục</a><a href="index.html#farm-story">Về Lá Lành</a>`;
    $("#siteHeader").innerHTML = `
    <div class="announcement"><div class="container announcement-inner"><span>🌱 Tươi lành từ khu vườn, tròn vị đến bàn ăn</span><span>Ưu đãi <strong>GIAM10</strong> cho giỏ hàng của bạn <span aria-hidden="true">✦</span></span></div></div>
    <header class="site-header"><div class="container nav-inner">
      <a class="brand" href="index.html" aria-label="Lá Lành - về trang chủ">${logo}</a>
      <nav class="desktop-nav" aria-label="Điều hướng chính">${links}</nav>
      <div class="nav-actions"><a class="nav-search" href="san-pham.html" aria-label="Tìm kiếm sản phẩm"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.7"></circle><path d="m16.2 16.2 5 5"></path></svg></a>
      <a class="nav-cart ${page === "cart" ? "nav-cart--active" : ""}" href="gio-hang.html" aria-label="Giỏ hàng"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2 11h11.5l2.5-8H6"></path><circle cx="9" cy="20" r="1"></circle><circle cx="18" cy="20" r="1"></circle></svg><span class="nav-cart-label">Giỏ hàng</span><span class="cart-badge" data-cart-count>0</span></a>
      <button class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="Mở menu" aria-controls="mobileNav" aria-expanded="false"><span></span><span></span><span></span></button></div>
    </div><nav id="mobileNav" class="mobile-nav" aria-label="Menu điện thoại" hidden>${links}<a href="gio-hang.html">🛒 Giỏ hàng (<span data-cart-count>0</span>)</a></nav></header>`;
    $("#siteFooter").innerHTML = `
    <footer class="site-footer" id="lien-he"><div class="container footer-main"><div class="footer-about"><a class="brand brand--footer" href="index.html">${logo}</a><p>Gom chút tươi xanh cho từng bữa ăn. Lá Lành là góc chợ nhỏ dành cho những ai yêu thực phẩm tươi ngon và cuộc sống giản dị.</p><div class="footer-mini-tags"><span>🌿 Tươi ngon</span><span>💚 Tận tâm</span></div></div>
    <div class="footer-links"><h3>Giới thiệu</h3><span>CÔNG TY TNHH MỘT THÀNH VIÊN LÁ LÀNH FARM</span><br><br><strong>Địa chỉ:</strong> Khu vực đất nông nghiệp thuộc xã Xuân Thới Sơn, TP.HCM <br> <br> <span><strong>Email:</strong> lalanhfarm2026@gmail.com </span></div>
    <div class="footer-links"><h3>Cùng Lá Lành</h3><a href="index.html#farm-story">Câu chuyện của chúng mình</a><a href="index.html#best-sellers">Rau được yêu thích</a><a href="gio-hang.html">Giỏ hàng</a><a href="thanh-toan.html">Thanh toán</a></div>
    <div class="footer-contact"><h3>Lời nhắn nhỏ</h3><p>Ăn một bữa thật lành, sống một ngày thật vui. Cảm ơn bạn đã ghé thăm khu vườn nhỏ!</p><div class="footer-card"><span>☀️</span><span><strong>Chúc bạn một ngày xanh!</strong><small>Mua sắm vui vẻ tại Lá Lành</small></span></div></div></div>
    <div class="footer-bottom"><div class="container footer-bottom-inner"><span>© <span id="footerYear"></span> Lá Lành. Thiết kế website mẫu.</span><span>Sản phẩm, ưu đãi & thanh toán chỉ mang tính minh hoạ.</span></div></div></footer>`;
    $("#footerYear").textContent = new Date().getFullYear();

    const toggle = $("#mobileMenuToggle");
    const nav = $("#mobileNav");
    toggle.addEventListener("click", () => {
        const isOpen = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!isOpen));
        toggle.setAttribute("aria-label", isOpen ? "Mở menu" : "Đóng menu");
        nav.hidden = isOpen;
        toggle.classList.toggle("menu-open", !isOpen);
    });
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
        nav.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        toggle.classList.remove("menu-open");
    }));
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !nav.hidden) toggle.click();
    });
}

function updateCartBadges() {
    document.querySelectorAll("[data-cart-count]").forEach(el => { el.textContent = cartQuantity(); });
    const cartLink = $(".nav-cart");
    if (cartLink) cartLink.setAttribute("aria-label", `Giỏ hàng, ${cartQuantity()} sản phẩm`);
}
function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.replaceChildren();
    const icon = document.createElement("span"); icon.className = "toast-check"; icon.textContent = "✓";
    const text = document.createElement("span"); text.textContent = message;
    const link = document.createElement("a"); link.href = "gio-hang.html"; link.textContent = "Xem giỏ →";
    toast.append(icon, text, link);
    toast.classList.add("toast--visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("toast--visible"), 3600);
}
function addToCart(id) {
    const product = byId(id);
    if (!product) return;
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        if (existing.quantity >= 99) { showToast("Tối đa 99 đơn vị cho mỗi sản phẩm."); return; }
        existing.quantity++;
    } else {
        cart.push({ id: product.id, quantity: 1 });
    }
    saveCart();
    showToast(`Đã thêm ${product.name} vào giỏ!`);
    if (document.body.dataset.page === "cart") renderCartPage();
    if (document.body.dataset.page === "checkout") renderCheckoutPage();
}
function changeCartItem(id, action) {
    const item = cart.find(entry => entry.id === Number(id));
    if (!item) return;
    if (action === "remove") cart = cart.filter(entry => entry.id !== item.id);
    if (action === "inc") item.quantity = Math.min(99, item.quantity + 1);
    if (action === "dec") item.quantity = Math.max(1, item.quantity - 1);
    if (cart.length === 0) { preferences.coupon = ""; couponFeedback = ""; savePreferences(); }
    saveCart();
    if (document.body.dataset.page === "cart") renderCartPage();
    if (document.body.dataset.page === "checkout") renderCheckoutPage();
}

function productCard(product) {
    return `<article class="product-card"><div class="product-image-wrap tint-${product.tint}">
    ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
    <img src="assets/${product.image}" alt="${product.name}" loading="lazy" width="260" height="220"></div>
    <div class="product-details"><div class="product-category">${CATEGORIES.find(c => c.id === product.category)?.name || "Rau tươi"}</div><h3>${product.name}</h3>
    <p class="product-unit">Tươi ngon · ${product.unit}</p><div class="product-bottom"><div class="product-price"><strong>${currency(product.price)}/${product.soluong}</strong><small>${product.descripton}</small></div>
    <button class="add-to-cart" type="button" data-add="${product.id}" aria-label="Thêm ${product.name} vào giỏ hàng" title="Thêm vào giỏ"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></div></div></article>`;
}
function bindProductButtons(container) {
    container.addEventListener("click", event => {
        const button = event.target.closest("[data-add]");
        if (button && container.contains(button)) addToCart(button.dataset.add);
    });
}
function initHome() {
    const featured = $("#featuredProducts");
    const picks = [1, 4, 3, 5, 8, 7, 15, 17].map(byId).filter(Boolean);
    featured.innerHTML = picks.map(productCard).join("");
    bindProductButtons(featured);
}
function initCatalog() {
    const categoryRoot = $("#catalogCategories");
    const search = $("#searchInput");
    const min = $("#minPrice");
    const max = $("#maxPrice");
    const sort = $("#sortPrice");
    const grid = $("#productList");
    const pagination = $("#pagination");
    const searchParams = new URLSearchParams(window.location.search);
    let selectedCategory = CATEGORIES.some(c => c.id === searchParams.get("category")) ? searchParams.get("category") : "all";
    let page = 1;

    function renderCategories() {
        categoryRoot.innerHTML = CATEGORIES.map(cat => `<button type="button" class="category-filter ${selectedCategory === cat.id ? "is-selected" : ""}" data-category="${cat.id}" aria-pressed="${selectedCategory === cat.id}"><span>${cat.icon} &nbsp;${cat.name}</span><span aria-hidden="true">↗</span></button>`).join("");
    }
    function filteredProducts() {
        const keyword = normalize(search.value);
        const minValue = min.value === "" ? 0 : Math.max(0, Number(min.value) || 0);
        const maxValue = max.value === "" ? Infinity : Math.max(0, Number(max.value) || 0);
        const invalid = minValue > maxValue;
        $("#filterMessage").textContent = invalid ? "Giá tối thiểu không được cao hơn giá tối đa." : "";
        if (invalid) return [];
        const filtered = PRODUCTS.filter(p => (selectedCategory === "all" || p.category === selectedCategory)
            && normalize(p.name).includes(keyword) && p.price >= minValue && p.price <= maxValue);
        if (sort.value === "asc") filtered.sort((a, b) => a.price - b.price);
        if (sort.value === "desc") filtered.sort((a, b) => b.price - a.price);
        if (sort.value === "name") filtered.sort((a, b) => a.name.localeCompare(b.name, "vi"));
        return filtered;
    }
    function renderCatalog() {
        renderCategories();
        const filtered = filteredProducts();
        const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
        page = Math.min(page, Math.max(1, totalPages));
        const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
        $("#resultCount").textContent = filtered.length ? `Hiển thị ${Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–${Math.min(page * PAGE_SIZE, filtered.length)} trong ${filtered.length} sản phẩm` : "Tìm thấy 0 sản phẩm phù hợp";
        grid.innerHTML = visible.length ? visible.map(productCard).join("") : `<div class="catalog-empty"><span>🥬</span><h3>Chưa tìm thấy món rau phù hợp</h3><p>Thử tìm bằng từ khoá khác hoặc xoá các bộ lọc nhé.</p><button class="btn btn-outline" type="button" id="emptyReset">Đặt lại bộ lọc</button></div>`;
        pagination.innerHTML = totalPages <= 1 ? "" : `<button type="button" data-page="prev" ${page === 1 ? "disabled" : ""} aria-label="Trang trước">←</button>${Array.from({ length: totalPages }, (_, idx) => `<button type="button" data-page="${idx + 1}" class="${page === idx + 1 ? "is-current" : ""}" ${page === idx + 1 ? 'aria-current="page"' : ""} aria-label="Trang ${idx + 1}">${idx + 1}</button>`).join("")}<button type="button" data-page="next" ${page === totalPages ? "disabled" : ""} aria-label="Trang sau">→</button>`;
        const resetButton = $("#emptyReset");
        if (resetButton) resetButton.addEventListener("click", resetFilters);
    }
    function updateUrl() {
        try {
            const url = new URL(window.location.href);
            if (selectedCategory === "all") url.searchParams.delete("category");
            else url.searchParams.set("category", selectedCategory);
            history.replaceState(null, "", url.href);
        } catch (_) { /* Giữ lại bộ lọc khi mở website bằng file:// */ }
    }
    function resetFilters() {
        selectedCategory = "all";
        search.value = "";
        min.value = "";
        max.value = "";
        sort.value = "default";
        page = 1;
        updateUrl();
        renderCatalog();
    }
    categoryRoot.addEventListener("click", event => {
        const button = event.target.closest("[data-category]");
        if (!button) return;
        selectedCategory = button.dataset.category;
        page = 1;
        updateUrl();
        renderCatalog();
    });
    [search, min, max].forEach(input => input.addEventListener("input", () => { page = 1; renderCatalog(); }));
    sort.addEventListener("change", () => { page = 1; renderCatalog(); });
    $("#resetFilters").addEventListener("click", resetFilters);
    pagination.addEventListener("click", event => {
        const button = event.target.closest("[data-page]");
        if (!button || button.disabled) return;
        const value = button.dataset.page;
        const count = Math.ceil(filteredProducts().length / PAGE_SIZE);
        if (value === "prev") page = Math.max(1, page - 1);
        else if (value === "next") page = Math.min(count, page + 1);
        else page = Number(value);
        renderCatalog();
        $("#catalogTop").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    });
    bindProductButtons(grid);
    renderCatalog();
}

function updateCouponUI() {
    const input = $("#couponInput");
    if (!input) return;
    const remove = $("#removeCoupon");
    const msg = $("#couponMessage");
    const currentCode = preferences.coupon;
    if (document.activeElement !== input || currentCode) input.value = currentCode;
    remove.hidden = !currentCode;
    if (couponFeedback) msg.textContent = couponFeedback;
    else if (currentCode === "GIAM50" && subtotalPrice() < 500000) msg.textContent = "GIAM50 cần đơn từ 500.000đ; chưa trừ giảm giá.";
    else if (currentCode) msg.textContent = `✓ Đang áp dụng mã ${currentCode}`;
    else msg.textContent = "GIAM50 giảm 50.000đ với đơn từ 500.000đ.";
    msg.classList.toggle("coupon-message--active", Boolean(currentCode) && !(currentCode === "GIAM50" && subtotalPrice() < 500000));
}
function updateTotals() {
    const totals = calculateOrder();
    const ids = { subtotalAmount: totals.subtotal, discountAmount: totals.discount, shippingAmount: totals.shipping, cartTotal: totals.total };
    Object.entries(ids).forEach(([id, amount]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = id === "discountAmount" && amount ? `−${currency(amount)}` : currency(amount);
    });
    const shippingSelect = $("#shippingMethod");
    if (shippingSelect) {
        shippingSelect.value = preferences.shipping;
        const standardIsFree = totals.subtotal >= SHIPPING_FREE_AT || (totals.subtotal > 0 && preferences.coupon === "FREESHIP");
        const expressIsFree = totals.subtotal > 0 && preferences.coupon === "FREESHIP";
        shippingSelect.querySelector('[value="standard"]').textContent = `Giao tiêu chuẩn · ${standardIsFree ? "Miễn phí" : "30.000đ"}`;
        shippingSelect.querySelector('[value="express"]').textContent = `Giao nhanh · ${expressIsFree ? "Miễn phí" : "60.000đ"}`;
    }
    updateCouponUI();
}
function initCouponAndShipping() {
    const shipping = $("#shippingMethod");
    if (!shipping) return;
    shipping.value = preferences.shipping;
    shipping.addEventListener("change", () => {
        preferences.shipping = shipping.value === "express" ? "express" : "standard";
        savePreferences();
        updateTotals();
    });
    $("#applyCoupon").addEventListener("click", () => {
        const code = $("#couponInput").value.trim().toUpperCase();
        const subtotal = subtotalPrice();
        if (!subtotal) couponFeedback = "Bạn cần chọn sản phẩm trước khi dùng mã.";
        else if (!["GIAM10", "GIAM50", "FREESHIP"].includes(code)) couponFeedback = "Mã chưa hợp lệ. Hãy thử GIAM10, GIAM50 hoặc FREESHIP.";
        else if (code === "GIAM50" && subtotal < 500000) couponFeedback = "GIAM50 dành cho đơn hàng từ 500.000đ.";
        else {
            preferences.coupon = code;
            couponFeedback = `✓ Đã áp dụng mã ${code} thành công!`;
            savePreferences();
        }
        // Nếu nhập sai, giữ mã đúng đang áp dụng trước đó.
        updateTotals();
    });
    $("#couponInput").addEventListener("keydown", event => {
        if (event.key === "Enter") { event.preventDefault(); $("#applyCoupon").click(); }
    });
    $("#removeCoupon").addEventListener("click", () => {
        preferences.coupon = "";
        couponFeedback = "Đã bỏ mã ưu đãi.";
        $("#couponInput").value = "";
        savePreferences();
        updateTotals();
    });
    updateTotals();
}

function cartItemMarkup(item) {
    const product = byId(item.id);
    if (!product) return "";
    return `<article class="cart-item"><div class="cart-item-main"><div class="cart-item-image tint-${product.tint}"><img src="assets/${product.image}" alt="" loading="lazy"></div><div class="cart-item-info"><span class="cart-item-category">${CATEGORIES.find(c => c.id === product.category)?.name || "Rau tươi"}</span><h3>${product.name}</h3><p>${product.unit}</p><strong>${currency(product.price)}</strong></div></div><div class="cart-item-actions"><div class="quantity-control" aria-label="Số lượng ${product.name}"><button type="button" data-cart-action="dec" data-id="${product.id}" aria-label="Giảm số lượng ${product.name}" ${item.quantity <= 1 ? "disabled" : ""}>−</button><output>${item.quantity}</output><button type="button" data-cart-action="inc" data-id="${product.id}" aria-label="Tăng số lượng ${product.name}" ${item.quantity >= 99 ? "disabled" : ""}>+</button></div><strong class="cart-line-total">${currency(product.price * item.quantity)}</strong><button class="remove-item" type="button" data-cart-action="remove" data-id="${product.id}" aria-label="Xoá ${product.name} khỏi giỏ" title="Xoá sản phẩm">×</button></div></article>`;
}
function renderCartPage() {
    const isEmpty = cart.length === 0;
    $("#emptyCart").hidden = !isEmpty;
    $("#cartLayout").hidden = isEmpty;
    $("#cartCount").textContent = cartQuantity();
    if (isEmpty) return;
    $("#cartList").innerHTML = cart.map(cartItemMarkup).join("");
    updateTotals();
}
function initCart() {
    initCouponAndShipping();
    $("#cartList").addEventListener("click", event => {
        const button = event.target.closest("[data-cart-action]");
        if (button) changeCartItem(button.dataset.id, button.dataset.cartAction);
    });
    renderCartPage();
}
function renderCheckoutPage() {
    const isEmpty = cart.length === 0;
    $("#checkoutEmpty").hidden = !isEmpty;
    $("#checkoutLayout").hidden = isEmpty;
    if (isEmpty) return;
    $("#checkoutOrderItems").innerHTML = cart.map(item => {
        const product = byId(item.id);
        if (!product) return "";
        return `<div class="checkout-item"><div class="checkout-item-img tint-${product.tint}"><img src="assets/${product.image}" alt=""></div><span class="checkout-item-text"><strong>${product.name}</strong><small>${item.quantity} × ${currency(product.price)}</small></span><strong>${currency(product.price * item.quantity)}</strong></div>`;
    }).join("");
    updateTotals();
}
function initCheckout() {
    initCouponAndShipping();
    $("#checkoutForm").addEventListener("submit", event => {
        event.preventDefault();
        if (!cart.length) { renderCheckoutPage(); return; }
        const form = event.currentTarget;
        if (!form.reportValidity()) return;
        const data = new FormData(form);
        const phone = String(data.get("phone") || "").trim();
        if (!/^0\d{9,10}$/.test(phone)) {
            $("#phone").setCustomValidity("Số điện thoại cần có 10–11 chữ số, bắt đầu bằng số 0.");
            form.reportValidity();
            return;
        }
        const total = calculateOrder();
        const count = cartQuantity();
        const payment = data.get("payment") === "bank" ? "Chuyển khoản (mô phỏng)" : "Thanh toán khi nhận hàng";
        const orderId = `LL${Date.now().toString().slice(-9)}`;
        cart = [];
        preferences.coupon = "";
        saveCart();
        savePreferences();
        $("#checkoutLayout").hidden = true;
        $("#checkoutEmpty").hidden = true;
        document.querySelectorAll(".shopping-steps .step").forEach(el => el.classList.add("step--done"));
        $("#orderSuccess").hidden = false;
        $("#orderSuccess").innerHTML = `<div class="success-icon">✓</div><span class="section-kicker">CẢM ƠN BẠN!</span><h2>Đơn hàng mẫu đã được ghi nhận 🎉</h2><p>Cảm ơn bạn đã chọn Lá Lành. Đây là bản mô phỏng nên đơn hàng <strong>không được gửi đến cửa hàng</strong> và không có thanh toán thật.</p><div class="success-details"><div><span>Mã đơn mô phỏng</span><strong>${orderId}</strong></div><div><span>Số lượng</span><strong>${count} món</strong></div><div><span>Tổng giá trị</span><strong>${currency(total.total)}</strong></div><div><span>Thanh toán</span><strong>${payment}</strong></div></div><a href="san-pham.html" class="btn btn-primary btn-lg">Tiếp tục mua sắm <span>↗</span></a>`;
        $("#orderSuccess").scrollIntoView({ behavior: "smooth", block: "center" });
    });
    $("#phone").addEventListener("input", event => event.currentTarget.setCustomValidity(""));
    renderCheckoutPage();
}

function init() {
    renderShell();
    updateCartBadges();
    const page = document.body.dataset.page;
    if (page === "home") initHome();
    if (page === "catalog") initCatalog();
    if (page === "cart") initCart();
    if (page === "checkout") initCheckout();
    window.addEventListener("storage", event => {
        if (event.key === CART_KEY) {
            cart = loadCart();
            updateCartBadges();
            if (page === "cart") renderCartPage();
            if (page === "checkout") renderCheckoutPage();
        }
    });
}
init();