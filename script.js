const WHATSAPP_NUMBER = "5491100000000";
const CURRENCY = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

const state = { products: [], cart: JSON.parse(localStorage.getItem("dulceCanelaCart") || "[]") };
const elements = {
  featured: document.querySelector("#featured-products"), grid: document.querySelector("#product-grid"), total: document.querySelector("#product-total"),
  empty: document.querySelector("#empty-state"), search: document.querySelector("#search-input"), category: document.querySelector("#category-filter"),
  cart: document.querySelector("#cart-drawer"), overlay: document.querySelector("#drawer-overlay"), cartItems: document.querySelector("#cart-items"),
  cartEmpty: document.querySelector("#cart-empty"), cartFooter: document.querySelector("#cart-footer"), cartCount: document.querySelector("#cart-count"), cartTotal: document.querySelector("#cart-total"),
  whatsapp: document.querySelector("#whatsapp-order"), dialog: document.querySelector("#product-dialog"), dialogContent: document.querySelector("#dialog-content"), toast: document.querySelector("#toast")
};

const formatPrice = (price) => CURRENCY.format(price);
const productById = (id) => state.products.find((product) => product.id === id);

function productCard(product) {
  const unavailable = product.disponibilidad.toLowerCase() !== "en stock";
  return `<article class="product-card">
    <img class="product-image" src="${product.foto}" alt="${product.nombre}" loading="lazy">
    <div class="product-info">
      <span class="product-category">${product.categoria}</span>
      <h3 class="product-name">${product.nombre}</h3>
      <p class="product-description">${product.descripcion}</p>
      <div class="product-bottom">
        <div><span class="product-price">${formatPrice(product.precio)}</span>${unavailable ? `<span class="stock-label">Agotado</span>` : ""}</div>
        <button class="add-button" type="button" data-add="${product.id}" aria-label="Agregar ${product.nombre}" ${unavailable ? "disabled" : ""}>+</button>
      </div>
    </div>
    <button class="card-detail" type="button" data-detail="${product.id}">Ver detalle</button>
  </article>`;
}

function renderProducts() {
  const term = elements.search.value.trim().toLowerCase();
  const category = elements.category.value;
  const filtered = state.products.filter((product) => product.nombre.toLowerCase().includes(term) && (category === "todos" || product.categoria === category));
  elements.grid.innerHTML = filtered.map(productCard).join("");
  elements.total.textContent = `${filtered.length} producto${filtered.length === 1 ? "" : "s"}`;
  elements.empty.hidden = filtered.length > 0;
  elements.featured.innerHTML = state.products.filter((product) => product.destacado).slice(0, 4).map(productCard).join("");
}

function renderCart() {
  const validItems = state.cart.filter((item) => productById(item.id));
  state.cart = validItems;
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = state.cart.reduce((sum, item) => sum + productById(item.id).precio * item.quantity, 0);
  elements.cartCount.textContent = count;
  elements.cartItems.innerHTML = state.cart.map((item) => { const product = productById(item.id); return `<div class="cart-item">
    <img src="${product.foto}" alt="${product.nombre}"><div class="cart-item-info"><span class="cart-item-name">${product.nombre}</span><span class="cart-item-price">${formatPrice(product.precio * item.quantity)}</span><div class="quantity-controls"><button type="button" data-minus="${product.id}" aria-label="Quitar una unidad">−</button><span>${item.quantity}</span><button type="button" data-plus="${product.id}" aria-label="Agregar una unidad">+</button><button class="remove-item" type="button" data-remove="${product.id}" aria-label="Eliminar ${product.nombre}">×</button></div></div></div>`; }).join("");
  elements.cartEmpty.hidden = count > 0; elements.cartFooter.hidden = count === 0; elements.cartTotal.textContent = formatPrice(total); elements.whatsapp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage())}`;
  localStorage.setItem("dulceCanelaCart", JSON.stringify(state.cart));
}

function whatsappMessage() {
  const lines = ["Hola, Dulce Canela. Quiero hacer este pedido:", ""];
  state.cart.forEach((item) => { const product = productById(item.id); lines.push(`• ${product.nombre} x${item.quantity} - ${formatPrice(product.precio * item.quantity)}`); });
  const total = state.cart.reduce((sum, item) => sum + productById(item.id).precio * item.quantity, 0);
  lines.push("", `Total: ${formatPrice(total)}`, "", "¿Me confirman disponibilidad y forma de entrega?"); return lines.join("\n");
}

function updateQuantity(id, change) { const item = state.cart.find((cartItem) => cartItem.id === id); if (!item) return; item.quantity += change; if (item.quantity <= 0) state.cart = state.cart.filter((cartItem) => cartItem.id !== id); renderCart(); }
function addToCart(id) { const item = state.cart.find((cartItem) => cartItem.id === id); if (item) item.quantity += 1; else state.cart.push({ id, quantity: 1 }); renderCart(); showToast("Agregado a tu carrito"); }
function openCart() { elements.cart.classList.add("is-open"); elements.overlay.classList.add("is-open"); document.body.classList.add("drawer-open"); elements.cart.setAttribute("aria-hidden", "false"); }
function closeCart() { elements.cart.classList.remove("is-open"); elements.overlay.classList.remove("is-open"); document.body.classList.remove("drawer-open"); elements.cart.setAttribute("aria-hidden", "true"); }
function showToast(message) { elements.toast.textContent = message; elements.toast.classList.add("show"); window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => elements.toast.classList.remove("show"), 2200); }
function showDetails(id) { const product = productById(id); elements.dialogContent.innerHTML = `<div class="dialog-content"><img src="${product.foto}" alt="${product.nombre}"><div class="dialog-copy"><span class="product-category">${product.categoria}</span><h2>${product.nombre}</h2><p>${product.descripcion}</p><ul class="detail-list"><li><strong>Beneficios:</strong> ${product.beneficios}</li><li><strong>Modo de uso:</strong> ${product.modo_uso}</li><li><strong>Presentación:</strong> ${product.presentacion}</li><li><strong>Precio:</strong> ${formatPrice(product.precio)}</li></ul></div></div>`; elements.dialog.showModal(); }

function setupEvents() {
  document.addEventListener("click", (event) => { const add = event.target.closest("[data-add]"); const detail = event.target.closest("[data-detail]"); const plus = event.target.closest("[data-plus]"); const minus = event.target.closest("[data-minus]"); const remove = event.target.closest("[data-remove]"); if (add) addToCart(add.dataset.add); if (detail) showDetails(detail.dataset.detail); if (plus) updateQuantity(plus.dataset.plus, 1); if (minus) updateQuantity(minus.dataset.minus, -1); if (remove) { state.cart = state.cart.filter((item) => item.id !== remove.dataset.remove); renderCart(); } });
  document.querySelector("#open-cart").addEventListener("click", openCart); document.querySelector("#close-cart").addEventListener("click", closeCart); elements.overlay.addEventListener("click", closeCart); document.querySelector("#browse-products").addEventListener("click", closeCart); document.querySelector("#close-dialog").addEventListener("click", () => elements.dialog.close());
  elements.search.addEventListener("input", renderProducts); elements.category.addEventListener("change", renderProducts);
}

async function init() { try { const response = await fetch("productos.json"); if (!response.ok) throw new Error("No se pudo cargar el catálogo"); state.products = await response.json(); [...new Set(state.products.map((product) => product.categoria))].sort().forEach((category) => elements.category.insertAdjacentHTML("beforeend", `<option value="${category}">${category}</option>`)); renderProducts(); renderCart(); setupEvents(); } catch (error) { elements.grid.innerHTML = `<p class="empty-state">No pudimos cargar el catálogo. Revisa que el archivo productos.json esté publicado junto a la página.</p>`; console.error(error); } }
init();
