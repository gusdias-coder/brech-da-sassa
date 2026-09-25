/* ============================================================
   app.js — Configuração central + utilidades + header
   Único lugar para trocar dados da cliente.
   Preparado para futuro: auth, favoritos, pedidos (não implementar V1).
   ============================================================ */
window.BRECHO_CONFIG = {
  nome: "Brechó da Sassá",
  tagline: "Peças únicas com história",
  whatsapp: "5551998348428", // <-- TROCAR pelo número real (DDI+DDD+Número)
  whatsappTextoPadrao: "Olá! Vim pelo site e quero saber mais sobre as peças. 💛",
  instagram: "@brechodasassapoa",
  instagramUrl: "https://instagram.com/brecho.essencia",
  cidade: "São Paulo · SP",
  horario: "Seg a Sáb · 10h às 19h",
  email: "oi@brechoessencia.com.br"
};

// ---- Utils ----
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
window.BrechoImages = {
  fallbackPath: "assets/img/product-placeholder.svg",
  productAlt: (p, i = 0) => `${p.nome} — foto ${i + 1}`,
  tag(src, alt, options = {}) {
    let safe = this.fallbackPath;
    try { if (["https:", "http:"].includes(new URL(src, location.href).protocol)) safe = src || safe; } catch {}
    return `<img src="${escapeHTML(safe)}" alt="${escapeHTML(alt)}" class="${escapeHTML(options.className || '')}" loading="lazy"${options.width ? ` width="${Number(options.width)}"` : ''}${options.height ? ` height="${Number(options.height)}"` : ''}>`;
  }
};
document.addEventListener("error", event => {
  const img = event.target;
  if (img instanceof HTMLImageElement && !img.dataset.fallback) {
    img.dataset.fallback = "true";
    img.src = BrechoImages.fallbackPath;
    img.classList.add("loaded");
  }
}, true);
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const BRL = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function whatsappLink(mensagem) {
  const cfg = window.BRECHO_CONFIG;
  return `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}
function whatsappProdutoLink(produto) {
  return whatsappLink(`Olá! Tenho interesse na peça ${produto.nome} (${produto.tamanho} · ${BRL(produto.preco)}). Ela ainda está disponível?`);
}

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Falha ao carregar ${path}`);
  return res.json();
}
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Aplica dados da config em todos os [data-config] e links WhatsApp/Instagram
function applyConfig() {
  const cfg = window.BRECHO_CONFIG;
  $$("[data-config]").forEach((el) => {
    const key = el.getAttribute("data-config");
    if (cfg[key] != null) el.textContent = cfg[key];
  });
  $$("[data-wa]").forEach((a) => {
    const msg = a.getAttribute("data-wa-msg") || cfg.whatsappTextoPadrao;
    a.href = whatsappLink(msg);
    a.target = "_blank";
    a.rel = "noopener";
  });
  $$("[data-ig]").forEach((a) => { a.href = cfg.instagramUrl; a.target = "_blank"; a.rel = "noopener"; });
  const year = new Date().getFullYear();
  $$("[data-year]").forEach((el) => (el.textContent = year));
}

// Header fixo (sticky): compacta no scroll + marca link ativo + busca elegante
function initHeader() {
  const header = $("#siteHeader");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 24);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Menu mobile: ao fechar, o Bootstrap devolve o foco ao botão do menu (que agora fica fixo no topo) e o navegador
  // rola a página até a posição original dele. Guardamos a rolagem ao abrir e restauramos ao fechar.
  const menuMobile = $("#menuMobile");
  if (menuMobile) {
    let savedY = 0;
    menuMobile.addEventListener("show.bs.offcanvas", () => { savedY = window.scrollY; });
    menuMobile.addEventListener("hidden.bs.offcanvas", () => {
      setTimeout(() => window.scrollTo({ top: savedY, behavior: "instant" }), 0);
    });
  }

  const page = document.body.dataset.page || "";
  $$('.site-header .nav-link[data-nav]').forEach((a) => {
    if (a.dataset.nav === page) a.classList.add("active");
  });

  $$("form[data-search]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = new FormData(form).get("q")?.toString().trim() || "";
      window.location.href = q ? `catalogo.html?q=${encodeURIComponent(q)}` : "catalogo.html";
    });
  });
}

// Card de produto — usado na Home, Catálogo e Coleções
// Obs.: deixou de ser um único <a> por causa do botão "adicionar ao carrinho";
// agora um <a class="pcard-link"> cobre o card inteiro (stretched-link) e o
// botão de carrinho fica por cima dele (mesmo comportamento de clique de antes).
function productCard(p) {
  const statusClass = p.status === "Vendido" ? "is-sold" : p.status === "Reservado" ? "is-reserved" : "";
  const statusLabel = p.status === "Vendido" ? "Vendida" : p.status === "Reservado" ? "Reservada" : "";
  const photos = p.fotos || [];
  const second = photos[1] ? BrechoImages.tag(photos[1], BrechoImages.productAlt(p, 1), { className: 'second' }) : "";
  const podeComprar = p.status === "Disponível";
  const cartPayload = JSON.stringify({
    id: p.id, nome: p.nome, preco: p.preco, foto: photos[0] || BrechoImages.fallbackPath,
    tamanho: p.tamanho, cor: p.cor, status: p.status,
  });
  return `
  <div class="pcard ${statusClass} reveal">
    <a href="produto.html?id=${encodeURIComponent(p.id)}" class="pcard-link" aria-label="Ver ${escapeHTML(p.nome)}"></a>
    <div class="pcard-media">
      <div class="badges">
        ${p.novo ? `<span class="badge-b badge-novo">Novo</span>` : ""}
        ${p.destaque ? `<span class="badge-b badge-destaque">Destaque</span>` : ""}
      </div>
      ${BrechoImages.tag(photos[0], BrechoImages.productAlt(p), { className: 'main img-fade' })}
      ${second}
      ${statusLabel ? `<span class="product-status-overlay">${statusLabel}</span>` : ""}
      ${podeComprar ? `<button type="button" class="pcard-add" data-add-cart="${escapeHTML(cartPayload)}" aria-label="Adicionar ${escapeHTML(p.nome)} ao carrinho"><i class="bi bi-bag-plus"></i></button>` : ""}
    </div>
    <div class="pcard-body">
      <h3 class="pcard-name">${escapeHTML(p.nome)}</h3>
      <span class="pcard-meta">${escapeHTML(p.categoria)} · Tam ${escapeHTML(p.tamanho)} · ${escapeHTML(p.condicao)}</span>
      <span class="pcard-price">${BRL(p.preco)}</span>
    </div>
  </div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  applyConfig();
  initHeader();
  const hero = document.querySelector('.hero');
  const floatingWhatsApp = document.querySelector('.wa-float');
  if (hero && floatingWhatsApp && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { floatingWhatsApp.hidden = entry.isIntersecting; }).observe(hero);
  }
});
