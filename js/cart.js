/* Peças únicas, carrinho local e reconciliação com o catálogo. */
(() => {
  "use strict";
  const CART_KEY = "outra_era_cart_v1";
  const escape = value => typeof escapeHTML === "function" ? escapeHTML(value) : String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const fmt = value => typeof BRL === "function" ? BRL(value) : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const text = value => typeof value === "string" ? value.trim().slice(0, 300) : "";

  function safePhoto(value) {
    if (typeof value !== "string") return "";
    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? value : "";
    } catch { return ""; }
  }

  function normalize(product) {
    if (!product || typeof product !== "object") return null;
    const id = text(product.id);
    const priceValue = product.preco;
    const price = typeof priceValue === "number" || (typeof priceValue === "string" && priceValue.trim()) ? Number(priceValue) : NaN;
    if (!id || !Number.isFinite(price) || price < 0 || price > 1000000) return null;
    return {
      id, nome: text(product.nome) || "Peça selecionada", preco: Math.round(price * 100) / 100,
      foto: safePhoto(product.fotos?.[0] || product.foto),
      tamanho: text(product.tamanho), cor: text(product.cor), marca: text(product.marca),
      condicao: text(product.condicao), status: "Disponível",
    };
  }

  function parseCart(raw) {
    try {
      const values = JSON.parse(raw || "[]");
      if (!Array.isArray(values)) return [];
      const seen = new Set();
      return values.slice(0, 200).map(normalize).filter(item => {
        if (!item || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    } catch { return []; }
  }

  function load() {
    try { return parseCart(localStorage.getItem(CART_KEY)); } catch { return []; }
  }

  let refreshPromise;
  const Cart = {
    items: load(),
    has(id) { return this.items.some(item => item.id === id); },
    get(id) { return this.items.find(item => item.id === id); },
    count() { return this.items.length; },
    total() { return this.items.reduce((sum, item) => sum + Math.round(item.preco * 100), 0) / 100; },
    add(product) {
      if (!product || product.status !== "Disponível") return { ok: false, reason: "indisponivel" };
      const item = normalize(product);
      if (!item) return { ok: false, reason: "invalido" };
      if (this.has(item.id)) return { ok: false, reason: "duplicado" };
      this.items.push(item);
      this._save();
      return { ok: true };
    },
    remove(id) {
      this.items = this.items.filter(item => item.id !== id);
      this._save();
    },
    removeMany(ids) {
      this.items = this.items.filter(item => !ids.includes(item.id));
      this._save();
    },
    clear() { this.items = []; this._save(); },
    _save() {
      try { localStorage.setItem(CART_KEY, JSON.stringify(this.items)); } catch { /* Navegação privada: a seleção continua nesta aba. */ }
      document.dispatchEvent(new CustomEvent("cart:updated"));
    },
    reconcile(products) {
      if (!Array.isArray(products)) throw new Error("Catálogo inválido");
      const available = new Map(products.filter(product => product.status === "Disponível").map(product => [product.id, normalize(product)]));
      const previous = JSON.stringify(this.items);
      const removed = this.items.filter(item => !available.get(item.id));
      this.items = this.items.map(item => available.get(item.id)).filter(Boolean);
      const changed = previous !== JSON.stringify(this.items);
      if (changed) this._save();
      return { products, items: this.items.slice(), removed, changed };
    },
    async refresh() {
      if (!refreshPromise) {
        refreshPromise = fetch("data/products.json", { cache: "no-store" })
          .then(response => {
            if (!response.ok) throw new Error("Não foi possível atualizar o catálogo.");
            return response.json();
          })
          .then(products => this.reconcile(products))
          .finally(() => { refreshPromise = undefined; });
      }
      return refreshPromise;
    },
    normalize,
  };
  window.Cart = Cart;

  let toastTimer;
  function showToast(message) {
    let toast = document.getElementById("cartToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "cartToast";
      toast.className = "cart-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 4200);
  }
  window.CartToast = showToast;

  function itemTemplate(item) {
    const details = [item.marca, item.tamanho && `Tam. ${item.tamanho}`, item.cor].filter(Boolean).join(" · ");
    return `<article class="cart-item" data-cart-id="${escape(item.id)}">
      <a href="produto.html?id=${encodeURIComponent(item.id)}" tabindex="-1" aria-hidden="true">${BrechoImages.tag(item.foto, "", { width: 88, height: 110 })}</a>
      <div class="cart-item-info">
        <a class="cart-item-name" href="produto.html?id=${encodeURIComponent(item.id)}">${escape(item.nome)}</a>
        <p class="cart-item-meta">${escape(details)}</p>
        <p class="cart-item-price">${fmt(item.preco)}</p>
        <div class="cart-item-actions"><a class="cart-btn-buy" href="checkout.html?item=${encodeURIComponent(item.id)}">Comprar só esta</a><button type="button" data-remove-item="${escape(item.id)}" aria-label="Remover ${escape(item.nome)} do carrinho">Remover</button></div>
      </div></article>`;
  }

  function buildDialog() {
    if (document.getElementById("cartDialog")) return;
    const dialog = document.createElement("dialog");
    dialog.id = "cartDialog";
    dialog.className = "cart-dialog";
    dialog.setAttribute("aria-labelledby", "cartTitle");
    dialog.innerHTML = `<div class="cart-panel">
      <div class="cart-header"><div><p class="eyebrow">Sua seleção</p><h2 id="cartTitle">Peças para uma nova história.</h2></div><button type="button" class="icon-button" data-cart-close aria-label="Fechar carrinho" autofocus>×</button></div>
      <p class="cart-note">Uma unidade de cada achado. Compre tudo junto ou escolha uma peça por vez.</p>
      <p class="cart-note" id="cartRefreshStatus" role="status" aria-live="polite"></p>
      <div id="cartItemsWrap" class="cart-items"></div>
      <div class="cart-total"><span>Subtotal</span><strong id="cartTotalValue"></strong></div>
      <div class="cart-actions"><a class="btn-boutique" id="cartCheckout" href="checkout.html">Comprar todas as peças</a><button type="button" class="btn-outline-b" data-cart-close>Continuar garimpando</button><button type="button" class="cart-clear" id="cartClear">Esvaziar carrinho</button></div>
      <p class="cart-note">Frete e pagamento combinados pelo WhatsApp. A reserva depende da confirmação da loja.</p>
    </div>`;
    document.body.appendChild(dialog);
    dialog.querySelectorAll("[data-cart-close]").forEach(button => button.addEventListener("click", () => dialog.close()));
    dialog.addEventListener("click", event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("cart-open");
      document.querySelectorAll("[data-cart-toggle]").forEach(button => button.setAttribute("aria-expanded", "false"));
    });
    dialog.querySelector("#cartClear").addEventListener("click", () => {
      Cart.clear();
      dialog.querySelector("[data-cart-close]").focus();
      showToast("Seu carrinho foi esvaziado.");
    });
    dialog.querySelector("#cartItemsWrap").addEventListener("click", event => {
      const button = event.target.closest("[data-remove-item]");
      if (!button) return;
      const buttons = [...dialog.querySelectorAll("[data-remove-item]")];
      const index = buttons.indexOf(button);
      Cart.remove(button.dataset.removeItem);
      const remaining = [...dialog.querySelectorAll("[data-remove-item]")];
      (remaining[Math.min(index, remaining.length - 1)] || dialog.querySelector("[data-cart-close]")).focus();
      showToast("Peça removida do carrinho.");
    });
  }

  function renderCart() {
    buildDialog();
    document.getElementById("cartItemsWrap").innerHTML = Cart.items.length ? Cart.items.map(itemTemplate).join("") : `<div class="cart-empty"><p>Uma nova história começa com um encontro.</p><p>Seu carrinho ainda está vazio.</p><a href="catalogo.html" class="btn-outline-b">Explorar as peças</a></div>`;
    document.getElementById("cartTotalValue").textContent = fmt(Cart.total());
    document.getElementById("cartCheckout").hidden = !Cart.items.length;
    document.getElementById("cartClear").hidden = !Cart.items.length;
    document.querySelectorAll("[data-badge-count]").forEach(badge => {
      badge.textContent = Cart.count();
      badge.classList.remove("d-none");
      badge.hidden = Cart.count() === 0;
    });
    document.querySelectorAll("[data-cart-toggle]").forEach(button => {
      button.setAttribute("aria-label", `Abrir carrinho, ${Cart.count()} ${Cart.count() === 1 ? "peça" : "peças"}`);
      button.setAttribute("aria-controls", "cartDialog");
      button.setAttribute("aria-haspopup", "dialog");
    });
  }

  async function openCart() {
    renderCart();
    const dialog = document.getElementById("cartDialog");
    if (!dialog.open) dialog.showModal();
    document.body.classList.add("cart-open");
    document.querySelectorAll("[data-cart-toggle]").forEach(button => button.setAttribute("aria-expanded", "true"));
    const status = document.getElementById("cartRefreshStatus");
    status.textContent = "Conferindo a disponibilidade das peças…";
    try {
      const result = await Cart.refresh();
      status.textContent = result.removed.length ? "Atualizamos sua seleção: peças vendidas, reservadas ou removidas saíram do carrinho." : result.changed ? "Sua seleção foi atualizada com as informações atuais do catálogo." : "Disponibilidade conferida. Uma unidade por peça.";
    } catch { status.textContent = "Não foi possível conferir a disponibilidade agora. Tentaremos novamente na revisão da seleção."; }
  }
  Cart.open = openCart;

  function init() {
    renderCart();
    document.addEventListener("cart:updated", renderCart);
    window.addEventListener("storage", event => {
      if (event.key !== CART_KEY && event.key !== null) return;
      Cart.items = event.key === null ? [] : parseCart(event.newValue);
      document.dispatchEvent(new CustomEvent("cart:updated"));
    });
    document.addEventListener("click", event => {
      if (!(event.target instanceof Element)) return;
      const toggle = event.target.closest("[data-cart-toggle]");
      if (toggle) { event.preventDefault(); openCart(); return; }
      const button = event.target.closest("[data-add-cart]");
      if (!button || button.disabled) return;
      event.preventDefault();
      let product;
      try { product = JSON.parse(button.dataset.addCart); } catch { showToast("Não foi possível adicionar esta peça."); return; }
      const result = Cart.add(product);
      showToast(result.ok ? `${product.nome} está no seu carrinho.` : result.reason === "duplicado" ? "Essa peça já está no seu carrinho. Cada peça é única." : "Essa peça não está disponível para adicionar.");
      if (result.ok) {
        button.classList.add("added");
        setTimeout(() => button.classList.remove("added"), 1200);
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
