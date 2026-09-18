const WHATSAPP_NUMBER = "573001234567";
const CURRENCY = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const state = { products: [], cart: JSON.parse(localStorage.getItem("sportLineCart") || "[]") };
const elements = {
  featured: document.querySelector("#featured-products"), grid: document.querySelector("#product-grid"), total: document.querySelector("#product-total"),
  empty: document.querySelector("#empty-state"), search: document.querySelector("#search-input"), category: document.querySelector("#category-filter"),
  cart: document.querySelector("#cart-drawer"), overlay: document.querySelector("#drawer-overlay"), cartItems: document.querySelector("#cart-items"),
  cartEmpty: document.querySelector("#cart-empty"), cartFooter: document.querySelector("#cart-footer"), cartCount: document.querySelector("#cart-count"), cartTotal: document.querySelector("#cart-total"),
  whatsapp: document.querySelector("#whatsapp-order"), dialog: document.querySelector("#product-dialog"), dialogContent: document.querySelector("#dialog-content"), toast: document.querySelector("#toast")
};

const formatPrice = (price) => CURRENCY.format(price);
const productById = (id) => state.products.find((product) => product.id === id);
const productPhotos = (product) => {
  const photos = Array.isArray(product?.fotos) ? product.fotos.filter(Boolean) : [];
  return photos.length ? photos : (product?.foto ? [product.foto] : []);
};

function productCard(product) {
  const unavailable = product.disponibilidad.toLowerCase() !== "en stock";
  const requiresSize = Array.isArray(product.tallas) && product.tallas.length > 0;
  const primaryPhoto = productPhotos(product)[0] || "";
  const sizeOptions = requiresSize ? `
    <label class="size-picker">
      <span>Talla</span>
      <select class="size-select" data-size-select="${product.id}" aria-label="Selecciona la talla de ${product.nombre}" required>
        <option value="">Selecciona</option>
        ${product.tallas.map((talla) => `<option value="${talla}">${talla}</option>`).join("")}
      </select>
    </label>
  ` : "";

  return `<article class="product-card">
    <img class="product-image" src="${primaryPhoto}" alt="${product.nombre}" loading="lazy">
    <div class="product-info">
      <span class="product-category">${product.categoria}</span>
      <h3 class="product-name">${product.nombre}</h3>
      <p class="product-description">${product.descripcion}</p>
      ${sizeOptions}
      <div class="product-bottom">
        <div><span class="product-price">${formatPrice(product.precio)}</span>${unavailable ? `<span class="stock-label">Agotado</span>` : ""}</div>
        <button class="add-button" type="button" data-add="${product.id}" aria-label="Agregar ${product.nombre}" ${unavailable ? "disabled" : ""}>+</button>
      </div>
    </div>
    <button class="card-detail" type="button" data-detail="${product.id}">Ver detalle</button>
  </article>`;
}

function getSelectedSize(productId, sourceElement) {
  const container = sourceElement?.closest(".product-card, .dialog-copy");
  const select = container?.querySelector(`[data-size-select="${productId}"]`) || document.querySelector(`[data-size-select="${productId}"]`);
  return select ? select.value : "";
}

function renderProducts() {
  const term = elements.search.value.trim().toLowerCase();
  const category = elements.category.value;
  const filtered = state.products.filter((product) => product.nombre.toLowerCase().includes(term) && (category === "todos" || product.categoria === category));
  const featuredProducts = state.products
    .filter((product) => product.destacado)
    .sort((firstProduct, secondProduct) => {
      const firstIsBike = firstProduct.nombre.toLowerCase().includes("biciclet") ? 1 : 0;
      const secondIsBike = secondProduct.nombre.toLowerCase().includes("biciclet") ? 1 : 0;
      return secondIsBike - firstIsBike;
    });
  elements.grid.innerHTML = filtered.map(productCard).join("");
  elements.total.textContent = `${filtered.length} producto${filtered.length === 1 ? "" : "s"}`;
  elements.empty.hidden = filtered.length > 0;
  elements.featured.innerHTML = featuredProducts.slice(0, 4).map(productCard).join("");
}

function renderCart() {
  const validItems = state.cart.filter((item) => productById(item.id));
  state.cart = validItems;
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = state.cart.reduce((sum, item) => sum + productById(item.id).precio * item.quantity, 0);
  elements.cartCount.textContent = count;
  elements.cartItems.innerHTML = state.cart.map((item) => { const product = productById(item.id); const productImage = productPhotos(product)[item.variante || 0] || productPhotos(product)[0] || product.foto || ""; const sizeLabel = item.talla ? `<span class="cart-item-size">Talla ${item.talla}</span>` : ""; const colorLabel = item.variante !== undefined && product.colores?.[item.variante] ? `<span class="cart-item-size">Color ${product.colores[item.variante]}</span>` : ""; return `<div class="cart-item">
    <img src="${productImage}" alt="${product.nombre}"><div class="cart-item-info"><span class="cart-item-name">${product.nombre}</span>${sizeLabel}${colorLabel}<span class="cart-item-price">${formatPrice(product.precio * item.quantity)}</span><div class="quantity-controls"><button type="button" data-minus="${product.id}" data-talla="${item.talla || ""}" data-variante="${item.variante ?? ""}" aria-label="Quitar una unidad">−</button><span>${item.quantity}</span><button type="button" data-plus="${product.id}" data-talla="${item.talla || ""}" data-variante="${item.variante ?? ""}" aria-label="Agregar una unidad">+</button><button class="remove-item" type="button" data-remove="${product.id}" data-talla="${item.talla || ""}" data-variante="${item.variante ?? ""}" aria-label="Eliminar ${product.nombre}">×</button></div></div></div>`; }).join("");
  elements.cartEmpty.hidden = count > 0; elements.cartFooter.hidden = count === 0; elements.cartTotal.textContent = formatPrice(total); elements.whatsapp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage())}`;
  localStorage.setItem("sportLineCart", JSON.stringify(state.cart));
}

function whatsappMessage() {
  const lines = ["Hola, Sport Line. Quiero hacer este pedido para retirar en la tienda o coordinar entrega:", ""];
  state.cart.forEach((item) => { const product = productById(item.id); const sizeText = item.talla ? `, talla ${item.talla}` : ""; const colorText = item.variante !== undefined && product.colores?.[item.variante] ? `, color ${product.colores[item.variante]}` : ""; lines.push(`• ${product.nombre}${sizeText}${colorText} x${item.quantity} - ${formatPrice(product.precio * item.quantity)}`); });
  const total = state.cart.reduce((sum, item) => sum + productById(item.id).precio * item.quantity, 0);
  lines.push("", `Total: ${formatPrice(total)}`, "", "¿Me confirman disponibilidad, horario y forma de entrega/retiro?"); return lines.join("\n");
}

function updateQuantity(id, change, talla = "", variante = "") { const item = state.cart.find((cartItem) => cartItem.id === id && (cartItem.talla || "") === talla && String(cartItem.variante ?? "") === variante); if (!item) return; item.quantity += change; if (item.quantity <= 0) state.cart = state.cart.filter((cartItem) => !(cartItem.id === id && (cartItem.talla || "") === talla && String(cartItem.variante ?? "") === variante)); renderCart(); }
function getSelectedVariant() { const addButton = elements.dialogContent.querySelector("[data-detail-add]"); return addButton?.dataset.variant ?? "0"; }
function addToCart(id, talla = "", variante = "") { const product = productById(id); if (!product) return; const requiresSize = Array.isArray(product.tallas) && product.tallas.length > 0; const selectedSize = talla || getSelectedSize(id); if (requiresSize && !selectedSize) { showToast("Selecciona una talla antes de agregarlo"); return; } const photos = productPhotos(product); const selectedVariant = photos.length > 1 ? Number(variante || 0) : undefined; const item = state.cart.find((cartItem) => cartItem.id === id && (cartItem.talla || "") === (selectedSize || "") && (cartItem.variante ?? undefined) === selectedVariant); if (item) item.quantity += 1; else state.cart.push({ id, talla: selectedSize || undefined, variante: selectedVariant, quantity: 1 }); renderCart(); showToast("Agregado al carrito"); }
function openCart() { elements.cart.classList.add("is-open"); elements.overlay.classList.add("is-open"); document.body.classList.add("drawer-open"); elements.cart.setAttribute("aria-hidden", "false"); }
function closeCart() { elements.cart.classList.remove("is-open"); elements.overlay.classList.remove("is-open"); document.body.classList.remove("drawer-open"); elements.cart.setAttribute("aria-hidden", "true"); }
function showToast(message) { elements.toast.textContent = message; elements.toast.classList.add("show"); window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => elements.toast.classList.remove("show"), 2200); }
function galleryMarkup(product) {
  const photos = productPhotos(product);
  if (!photos.length) return "";
  if (photos.length === 1) {
    return `<img class="gallery-main-image" src="${photos[0]}" alt="${product.nombre}">`;
  }

  return `<div class="product-gallery">
    <img class="gallery-main-image" src="${photos[0]}" alt="${product.nombre}" data-main-gallery-image="${product.id}">
    <div class="gallery-thumbs">
      ${photos.map((photo, index) => `
        <button type="button" class="gallery-thumb ${index === 0 ? "is-active" : ""}" data-gallery-thumb="${product.id}" data-gallery-index="${index}" aria-label="Seleccionar ${product.colores?.[index] || `variante ${index + 1}`}" aria-pressed="${index === 0}">
          <img src="${photo}" alt="${product.nombre} variante ${index + 1}">
        </button>
      `).join("")}
    </div>
  </div>`;
}
function showDetails(id) { const product = productById(id); const requiresSize = Array.isArray(product.tallas) && product.tallas.length > 0; const sizeMarkup = requiresSize ? `<label class="size-picker"><span>Talla</span><select class="size-select" data-size-select="${product.id}" aria-label="Selecciona la talla de ${product.nombre}"><option value="">Selecciona</option>${product.tallas.map((talla) => `<option value="${talla}">${talla}</option>`).join("")}</select></label>` : ""; const variantMarkup = productPhotos(product).length > 1 ? `<p class="selected-variant" data-selected-variant-label>Color: ${product.colores?.[0] || "Variante 1"}</p>` : ""; elements.dialogContent.innerHTML = `<div class="dialog-content">${galleryMarkup(product)}<div class="dialog-copy"><span class="product-category">${product.categoria}</span><h2>${product.nombre}</h2><p>${product.descripcion}</p>${variantMarkup}${sizeMarkup}<ul class="detail-list"><li><strong>Beneficios:</strong> ${product.beneficios}</li><li><strong>Modo de uso:</strong> ${product.modo_uso}</li><li><strong>Presentación:</strong> ${product.presentacion}</li><li><strong>Precio:</strong> ${formatPrice(product.precio)}</li></ul><button class="button button-primary" type="button" data-detail-add="${product.id}" data-variant="0">Agregar al carrito <span aria-hidden="true">+</span></button></div></div>`; elements.dialog.showModal(); }

function setupEvents() {
  document.addEventListener("click", (event) => { 
    const add = event.target.closest("[data-add]");
    const detail = event.target.closest("[data-detail]");
    const plus = event.target.closest("[data-plus]");
    const minus = event.target.closest("[data-minus]");
    const remove = event.target.closest("[data-remove]");
    const galleryThumb = event.target.closest("[data-gallery-thumb]");

    if (galleryThumb) {
      const product = productById(galleryThumb.dataset.galleryThumb);
      const photos = productPhotos(product);
      const index = Number(galleryThumb.dataset.galleryIndex || 0);
      const mainImage = document.querySelector(`[data-main-gallery-image="${product.id}"]`);
      if (mainImage && photos[index]) mainImage.src = photos[index];
      document.querySelectorAll(`[data-gallery-thumb="${product.id}"]`).forEach((button, buttonIndex) => { button.classList.toggle("is-active", buttonIndex === index); button.setAttribute("aria-pressed", buttonIndex === index); });
      const variantLabel = elements.dialogContent.querySelector("[data-selected-variant-label]");
      if (variantLabel) variantLabel.textContent = `Color: ${product.colores?.[index] || `Variante ${index + 1}`}`;
      const detailAdd = elements.dialogContent.querySelector("[data-detail-add]");
      if (detailAdd) detailAdd.dataset.variant = String(index);
      return;
    }

    const detailAdd = event.target.closest("[data-detail-add]");
    if (add) addToCart(add.dataset.add, getSelectedSize(add.dataset.add, add)); if (detail) showDetails(detail.dataset.detail); if (detailAdd) { addToCart(detailAdd.dataset.detailAdd, getSelectedSize(detailAdd.dataset.detailAdd, detailAdd), detailAdd.dataset.variant); elements.dialog.close(); } if (plus) updateQuantity(plus.dataset.plus, 1, plus.dataset.talla || "", plus.dataset.variante || ""); if (minus) updateQuantity(minus.dataset.minus, -1, minus.dataset.talla || "", minus.dataset.variante || ""); if (remove) { const talla = remove.dataset.talla || ""; const variante = remove.dataset.variante || ""; state.cart = state.cart.filter((item) => !(item.id === remove.dataset.remove && (item.talla || "") === talla && String(item.variante ?? "") === variante)); renderCart(); } 
  });
  document.querySelector("#open-cart").addEventListener("click", openCart); document.querySelector("#close-cart").addEventListener("click", closeCart); elements.overlay.addEventListener("click", closeCart); document.querySelector("#browse-products").addEventListener("click", closeCart); document.querySelector("#close-dialog").addEventListener("click", () => elements.dialog.close());
  elements.search.addEventListener("input", renderProducts); elements.category.addEventListener("change", renderProducts);
}

async function init() { try { const response = await fetch("productos.json"); if (!response.ok) throw new Error("No se pudo cargar el catálogo"); state.products = await response.json(); [...new Set(state.products.map((product) => product.categoria))].sort().forEach((category) => elements.category.insertAdjacentHTML("beforeend", `<option value="${category}">${category}</option>`)); renderProducts(); renderCart(); setupEvents(); } catch (error) { elements.grid.innerHTML = `<p class="empty-state">No pudimos cargar el catálogo. Revisa que el archivo productos.json esté publicado junto a la página.</p>`; console.error(error); } }
init();