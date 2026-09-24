/* ============================================================
   cart.js — Carrinho de compras (Brechó da Sassá)
   - Cada peça é ÚNICA (brechó): não existe "quantidade" por peça,
     cada peça só pode entrar 1x no carrinho. O cliente adiciona
     quantas peças DIFERENTES quiser.
   - Persistência: localStorage (sobrevive a refresh/fechar aba).
   - 3 formas de fechar pedido:
       1) "Comprar este item"                -> checkout.html?item=ID
       2) "Comprar todo o carrinho" (site)    -> checkout.html
       3) "Finalizar todo o carrinho" (Whats) -> wa.me com mensagem pronta
   Depende de app.js (BRECHO_CONFIG, $, $$, BRL, whatsappLink) — inclua
   <script src="js/app.js"> ANTES de <script src="js/cart.js">.
   ============================================================ */
(function () {
  const CART_KEY = "brecho_cart_v1";

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }
  function persist(items) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) { /* localStorage indisponível */ }
  }
  function fmt(v) {
    return typeof BRL === "function" ? BRL(v) : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  // ---------------- Estado / API do carrinho ----------------
  const Cart = {
    items: loadCart(),

    has(id) { return this.items.some((i) => i.id === id); },
    get(id) { return this.items.find((i) => i.id === id); },
    count() { return this.items.length; },
    total() { return this.items.reduce((s, i) => s + i.preco, 0); },

    // product: { id, nome, preco, foto, tamanho, cor, status }
    add(product) {
      if (!product || !product.id) return { ok: false, reason: "invalido" };
      if (product.status && product.status !== "Disponível") return { ok: false, reason: "indisponivel" };
      if (this.has(product.id)) return { ok: false, reason: "duplicado" };
      this.items.push({
        id: product.id,
        nome: product.nome,
        preco: Number(product.preco) || 0,
        foto: product.foto || "",
        tamanho: product.tamanho || "",
        cor: product.cor || "",
      });
      this._save();
      return { ok: true };
    },
    remove(id) {
      this.items = this.items.filter((i) => i.id !== id);
      this._save();
    },
    removeMany(ids) {
      this.items = this.items.filter((i) => !ids.includes(i.id));
      this._save();
    },
    clear() {
      this.items = [];
      this._save();
    },
    _save() {
      persist(this.items);
      document.dispatchEvent(new CustomEvent("cart:updated"));
    },
  };
  window.Cart = Cart;

  // ---------------- Mensagem de WhatsApp ----------------
  // Usada tanto pelo carrinho inteiro quanto pelo checkout.html
  function buildWhatsAppMessage(items, cliente) {
    let msg = "Olá! Gostaria de fazer um pedido:\n\nPEDIDO\n";
    items.forEach((it, idx) => {
      msg += `\n${idx + 1}. ${it.nome}\n`;
      if (it.tamanho) msg += `   Tamanho: ${it.tamanho}\n`;
      if (it.cor) msg += `   Cor: ${it.cor}\n`;
      msg += `   Preço: ${fmt(it.preco)}\n`;
    });
    const total = items.reduce((s, i) => s + i.preco, 0);
    msg += `\nTotal: ${fmt(total)}\n`;
    if (cliente && (cliente.nome || cliente.telefone || cliente.endereco)) {
      msg += `\nDADOS PARA ENTREGA/RETIRADA\n`;
      if (cliente.nome) msg += `Nome: ${cliente.nome}\n`;
      if (cliente.telefone) msg += `Telefone: ${cliente.telefone}\n`;
      if (cliente.endereco) msg += `Endereço: ${cliente.endereco}\n`;
      if (cliente.observacoes) msg += `Observações: ${cliente.observacoes}\n`;
    }
    msg += "\nGostaria de finalizar esse pedido. Obrigado!";
    return msg;
  }
  window.CartBuildWhatsAppMessage = buildWhatsAppMessage;

  function buyAllOnWhatsApp() {
    if (!Cart.items.length) {
      showToast("Seu carrinho está vazio.");
      return;
    }
    const msg = buildWhatsAppMessage(Cart.items);
    window.open(whatsappLink(msg), "_blank", "noopener");
  }
  window.CartBuyAllOnWhatsApp = buyAllOnWhatsApp;

  // ---------------- Toast simples ----------------
  function showToast(text) {
    let t = document.getElementById("cartToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "cartToast";
      t.className = "cart-toast";
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 2600);
  }
  window.CartToast = showToast;

  // ---------------- Drawer (offcanvas) do carrinho ----------------
  function buildDrawer() {
    if (document.getElementById("cartDrawer")) return;
    const holder = document.createElement("div");
    holder.innerHTML = `
    <div class="offcanvas offcanvas-end cart-drawer" tabindex="-1" id="cartDrawer" aria-labelledby="cartDrawerLabel">
      <div class="offcanvas-header">
        <h2 class="offcanvas-title" id="cartDrawerLabel"><i class="bi bi-bag me-2"></i>Seu carrinho</h2>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Fechar carrinho"></button>
      </div>
      <div class="offcanvas-body d-flex flex-column">
        <div id="cartItemsWrap" class="cart-items-wrap"></div>
        <div class="cart-summary">
          <div class="cart-total-row"><span>Total</span><strong id="cartTotalValue">R$ 0,00</strong></div>
          <button class="btn-boutique w-100 mt-3" id="btnBuyAllSite" type="button">
            <i class="bi bi-bag-check me-1"></i> Comprar todo o carrinho
          </button>
          <button class="btn-boutique btn-whats w-100 mt-2" id="btnBuyAllWhats" type="button">
            <i class="bi bi-whatsapp me-1"></i> Finalizar todo o carrinho pelo WhatsApp
          </button>
          <button class="btn-link-clear w-100 mt-2" id="btnClearCart" type="button">
            <i class="bi bi-trash3 me-1"></i> Limpar carrinho
          </button>
        </div>
      </div>
    </div>`;
    document.body.appendChild(holder.firstElementChild);

    document.getElementById("btnClearCart").addEventListener("click", () => {
      if (!Cart.items.length) return;
      if (confirm("Remover todas as peças do carrinho?")) Cart.clear();
    });
    document.getElementById("btnBuyAllWhats").addEventListener("click", buyAllOnWhatsApp);
    document.getElementById("btnBuyAllSite").addEventListener("click", () => {
      if (!Cart.items.length) { showToast("Seu carrinho está vazio."); return; }
      window.location.href = "checkout.html";
    });
  }

  function cartItemTemplate(item) {
    const metaBits = [];
    if (item.tamanho) metaBits.push(`Tam ${item.tamanho}`);
    if (item.cor) metaBits.push(item.cor);
    return `
    <div class="cart-item" data-cart-id="${item.id}">
      <img src="${item.foto}" alt="${item.nome}" loading="lazy">
      <div class="cart-item-info">
        <p class="cart-item-name">${item.nome}</p>
        <p class="cart-item-meta">${metaBits.join(" · ")}</p>
        <p class="cart-item-price">${fmt(item.preco)}</p>
        <div class="cart-item-actions">
          <button class="cart-btn-buy" data-buy-item="${item.id}" type="button">Comprar este item</button>
          <button class="cart-btn-remove" data-remove-item="${item.id}" type="button" aria-label="Remover peça"><i class="bi bi-trash3"></i></button>
        </div>
      </div>
    </div>`;
  }

  function renderCart() {
    buildDrawer();
    const wrap = document.getElementById("cartItemsWrap");
    const totalEl = document.getElementById("cartTotalValue");
    if (wrap) {
      wrap.innerHTML = Cart.items.length
        ? Cart.items.map(cartItemTemplate).join("")
        : `<div class="cart-empty">
             <i class="bi bi-bag-x"></i>
             <p>Seu carrinho está vazio.</p>
             <a href="catalogo.html" class="btn-outline-b">Ver catálogo</a>
           </div>`;
      wrap.querySelectorAll("[data-remove-item]").forEach((btn) => {
        btn.addEventListener("click", () => Cart.remove(btn.dataset.removeItem));
      });
      wrap.querySelectorAll("[data-buy-item]").forEach((btn) => {
        btn.addEventListener("click", () => {
          window.location.href = `checkout.html?item=${encodeURIComponent(btn.dataset.buyItem)}`;
        });
      });
    }
    if (totalEl) totalEl.textContent = fmt(Cart.total());

    document.querySelectorAll("[data-badge-count]").forEach((el) => {
      el.textContent = Cart.count();
      el.classList.toggle("d-none", Cart.count() === 0);
    });
  }

  // ---------------- Ligações globais ----------------
  function initCartUI() {
    buildDrawer();
    renderCart();
    document.addEventListener("cart:updated", renderCart);

    document.querySelectorAll("[data-cart-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const el = document.getElementById("cartDrawer");
        if (window.bootstrap && el) bootstrap.Offcanvas.getOrCreateInstance(el).show();
      });
    });

    // Delegação: qualquer botão [data-add-cart="<json>"] na página adiciona ao carrinho
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-add-cart]");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      let product;
      try { product = JSON.parse(btn.dataset.addCart); } catch (err) { return; }
      const res = Cart.add(product);
      if (res.ok) {
        showToast(`"${product.nome}" adicionada ao carrinho! 🛍️`);
        btn.classList.add("added");
        setTimeout(() => btn.classList.remove("added"), 1200);
      } else if (res.reason === "duplicado") {
        showToast("Essa peça já está no seu carrinho.");
      } else {
        showToast("Essa peça não está mais disponível.");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initCartUI);
})();
