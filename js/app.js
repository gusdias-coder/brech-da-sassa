/* ============================================================
   app.js — Configuração central + utilidades + header
   Único lugar para trocar dados da cliente.
   Preparado para futuro: auth, favoritos, pedidos (não implementar V1).
   ============================================================ */
window.BRECHO_CONFIG = {
  nome: "Brechó Essência",
  tagline: "Peças únicas com história",
  whatsapp: "5511999999999", // <-- TROCAR pelo número real (DDI+DDD+Número)
  whatsappTextoPadrao: "Olá! Vim pelo site e quero saber mais sobre as peças. 💛",
  instagram: "@brecho.essencia",
  instagramUrl: "https://instagram.com/brecho.essencia",
  cidade: "São Paulo · SP",
  horario: "Seg a Sáb · 10h às 19h",
  email: "oi@brechoessencia.com.br"
};

// ---- Utils ----
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
function productCard(p) {
  const statusClass = p.status === "Vendido" ? "is-sold" : p.status === "Reservado" ? "is-reserved" : "";
  const second = p.fotos[1] ? `<img class="second" src="${p.fotos[1]}" alt="${p.nome}" loading="lazy">` : "";
  return `
  <a href="produto.html?id=${p.id}" class="pcard ${statusClass} reveal" aria-label="Ver ${p.nome}">
    <div class="pcard-media">
      <div class="badges">
        ${p.novo ? `<span class="badge-b badge-novo">Novo</span>` : ""}
        ${p.destaque ? `<span class="badge-b badge-destaque">Destaque</span>` : ""}
      </div>
      <img class="main img-fade" src="${p.fotos[0]}" alt="${p.nome} — ${p.categoria}" loading="lazy" width="600" height="800" onload="this.classList.add('loaded')">
      ${second}
    </div>
    <div class="pcard-body">
      <h3 class="pcard-name">${p.nome}</h3>
      <span class="pcard-meta">${p.categoria} · Tam ${p.tamanho} · ${p.condicao}</span>
      <span class="pcard-price">${BRL(p.preco)}</span>
    </div>
  </a>`;
}

document.addEventListener("DOMContentLoaded", () => {
  applyConfig();
  initHeader();
});
