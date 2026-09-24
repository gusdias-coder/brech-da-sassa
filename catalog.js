/* ============================================================
   catalog.js — render, busca, filtros combináveis, ordenação
   Fontes: data/products.json (+ data/collections.json nas coleções)
   Arquitetura preparada para trocar fetchJSON por API futura.
   ============================================================ */

// Estado dos filtros (combináveis)
const CatalogState = {
  all: [],
  q: "",
  categoria: "",
  tamanho: "",
  preco: "",
  cor: "",
  condicao: "",
  marca: "",
  destaqueApenas: false,
  colecao: "",
  ordenar: "recentes"
};

function norm(s) {
  return (s || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function matchesSearch(p, q) {
  if (!q) return true;
  const hay = norm(`${p.nome} ${p.categoria} ${p.subcategoria} ${p.marca} ${p.cor}`);
  return norm(q).split(/\s+/).every((t) => hay.includes(t));
}

function matchesFilters(p, s) {
  if (s.categoria && p.categoria !== s.categoria) return false;
  if (s.tamanho && p.tamanho !== s.tamanho) return false;
  if (s.cor && p.cor !== s.cor) return false;
  if (s.condicao && p.condicao !== s.condicao) return false;
  if (s.marca && p.marca !== s.marca) return false;
  if (s.destaqueApenas && !p.destaque) return false;
  if (s.colecao && !(p.colecao || []).includes(s.colecao)) return false;
  if (s.preco) {
    const [min, max] = s.preco.split("-").map(Number);
    if (p.preco < min) return false;
    if (max && p.preco > max) return false;
  }
  return matchesSearch(p, s.q);
}

function sortProducts(list, modo) {
  const arr = [...list];
  if (modo === "menor") arr.sort((a, b) => a.preco - b.preco);
  else if (modo === "maior") arr.sort((a, b) => b.preco - a.preco);
  else if (modo === "destaques") arr.sort((a, b) => (b.destaque - a.destaque) || (b.ordemEditorial - a.ordemEditorial));
  else arr.sort((a, b) => new Date(b.dataEntrada) - new Date(a.dataEntrada) || a.ordemEditorial - b.ordemEditorial);
  return arr;
}

function activeFilterChips(s) {
  const chips = [];
  const map = { categoria: "Categoria", tamanho: "Tam", preco: "Preço", cor: "Cor", condicao: "Condição", marca: "Marca", q: "Busca", colecao: "Coleção" };
  ["colecao", "categoria", "tamanho", "preco", "cor", "condicao", "marca", "q"].forEach((k) => {
    if (s[k]) chips.push({ key: k, label: `${map[k]}: ${s[k]}` });
  });
  if (s.destaqueApenas) chips.push({ key: "destaqueApenas", label: "Destaques" });
  return chips;
}

function fillSelect(select, values, placeholder) {
  if (!select) return;
  const current = select.value;
  select.innerHTML = `<option value="">${placeholder}</option>` +
    values.map((v) => `<option value="${v}">${v}</option>`).join("");
  if ([...select.options].some((o) => o.value === current)) select.value = current;
}

// ---- Render genérico ----
function renderGrid(gridEl, list, { emptyTitle = "Nenhuma peça encontrada", emptyText = "Tente ajustar os filtros ou a busca." } = {}) {
  if (!gridEl) return;
  const countEl = document.querySelector("[data-count]");
  const chipsEl = document.querySelector("[data-chips]");
  if (!list.length) {
    gridEl.innerHTML = `
      <div class="empty-state grid-empty" style="grid-column:1/-1" role="status">
        <p class="eyebrow">Nada por aqui (ainda)</p>
        <h3>${emptyTitle}</h3>
        <p class="text-muted">Que tal garimpar de outro jeito? ${emptyText}</p>
        <div class="d-flex gap-2 justify-content-center flex-wrap mt-3">
          <button class="btn-outline-b" data-clear>Limpar filtros</button>
          <a class="btn-boutique" data-wa href="#">Chamar no WhatsApp</a>
        </div>
      </div>`;
    applyConfig();
  } else {
    gridEl.innerHTML = list.map(productCard).join("");
  }
  if (countEl) {
    const n = list.length;
    countEl.textContent = n === 1 ? "1 peça" : `${n} peças`;
  }
  if (chipsEl) {
    const chips = activeFilterChips(CatalogState);
    chipsEl.innerHTML = chips.length
      ? `<span class="text-muted small me-1">Filtros ativos:</span>` + chips.map((c) =>
          `<span class="filter-chip">${c.label}<button data-unchip="${c.key}" aria-label="Remover filtro ${c.label}">×</button></span>`).join("")
      : "";
  }
  // Re-observa reveals + fade das imagens
  if (window.BrechoAnimations) window.BrechoAnimations.observe();
  const clear = gridEl.parentElement?.querySelector("[data-clear]") || document.querySelector("[data-clear]");
  clear?.addEventListener("click", () => clearAllFilters());
}

// ---- Página Catálogo ----
async function initCatalogPage() {
  const grid = document.getElementById("catalogGrid");
  if (!grid) return;
  const products = await fetchJSON("data/products.json");
  CatalogState.all = products;

  // Deep links: ?categoria= ?colecao= ?q= ?destaque=1 ?ordenar=
  CatalogState.categoria = getParam("categoria") || "";
  CatalogState.colecao = getParam("colecao") || "";
  CatalogState.q = getParam("q") || "";
  CatalogState.destaqueApenas = getParam("destaque") === "1";
  CatalogState.ordenar = getParam("ordenar") || "recentes";

  const cats = [...new Set(products.map((p) => p.categoria))].sort();
  const tams = [...new Set(products.map((p) => p.tamanho))].sort();
  const cores = [...new Set(products.map((p) => p.cor))].sort();
  const conds = [...new Set(products.map((p) => p.condicao))];
  const marcas = [...new Set(products.map((p) => p.marca))].sort();

  // Preenche selects (desktop + mobile usam mesmos name)
  $$('select[name="categoria"]').forEach((s) => fillSelect(s, cats, "Todas as categorias"));
  $$('select[name="tamanho"]').forEach((s) => fillSelect(s, tams, "Todos os tamanhos"));
  $$('select[name="cor"]').forEach((s) => fillSelect(s, cores, "Todas as cores"));
  $$('select[name="condicao"]').forEach((s) => fillSelect(s, conds, "Todas as condições"));
  $$('select[name="marca"]').forEach((s) => fillSelect(s, marcas, "Todas as marcas"));

  // Sincroniza controles com o estado inicial
  const sync = () => {
    $$('[name="categoria"]').forEach((el) => (el.value = CatalogState.categoria));
    $$('[name="tamanho"]').forEach((el) => (el.value = CatalogState.tamanho));
    $$('[name="preco"]').forEach((el) => (el.value = CatalogState.preco));
    $$('[name="cor"]').forEach((el) => (el.value = CatalogState.cor));
    $$('[name="condicao"]').forEach((el) => (el.value = CatalogState.condicao));
    $$('[name="marca"]').forEach((el) => (el.value = CatalogState.marca));
    $$('[name="ordenar"]').forEach((el) => (el.value = CatalogState.ordenar));
    const qb = document.getElementById("searchInput");
    if (qb) qb.value = CatalogState.q;
    const coll = document.getElementById("collectionTitle");
    if (coll && CatalogState.colecao) coll.textContent = `Coleção: ${CatalogState.colecao}`;
    if (coll && CatalogState.destaqueApenas) coll.textContent = "Peças em destaque";
  };

  const apply = () => {
    const list = sortProducts(CatalogState.all.filter((p) => matchesFilters(p, CatalogState)), CatalogState.ordenar);
    renderGrid(grid, list);
    syncUrl();
  };

  const syncUrl = () => {
    const params = new URLSearchParams();
    ["q", "categoria", "colecao", "ordenar"].forEach((k) => CatalogState[k] && params.set(k, CatalogState[k]));
    if (CatalogState.destaqueApenas) params.set("destaque", "1");
    history.replaceState(null, "", params.toString() ? `catalogo.html?${params}` : "catalogo.html");
  };

  // Eventos: qualquer controle [data-filter] atualiza o estado
  $$("[data-filter]").forEach((el) => {
    el.addEventListener("input", () => {
      CatalogState[el.dataset.filter] = el.type === "checkbox" ? (el.checked ? true : false) : el.value;
      // espelha desktop <-> offcanvas
      $$(`[data-filter="${el.dataset.filter}"]`).forEach((o) => { if (o !== el && o.type !== "checkbox") o.value = el.value; });
      apply();
    });
    el.addEventListener("change", () => {
      CatalogState[el.dataset.filter] = el.type === "checkbox" ? (el.checked ? true : false) : el.value;
      $$(`[data-filter="${el.dataset.filter}"]`).forEach((o) => { if (o !== el && o.type !== "checkbox") o.value = el.value; });
      apply();
    });
  });

  document.addEventListener("click", (e) => {
    const un = e.target.closest("[data-unchip]");
    if (un) {
      const k = un.dataset.unchip;
      CatalogState[k] = k === "destaqueApenas" ? false : "";
      sync(); apply();
    }
    if (e.target.closest("[data-clear]")) clearAllFilters();
  });

  window.clearAllFilters = () => {
    Object.assign(CatalogState, { q: "", categoria: "", tamanho: "", preco: "", cor: "", condicao: "", marca: "", destaqueApenas: false, colecao: "" });
    sync(); apply();
  };

  sync(); apply();
}

// ---- Home: novidades + destaques ----
async function initHome() {
  if (!document.getElementById("novidadesGrid") && !document.getElementById("destaquesGrid")) return;
  const products = await fetchJSON("data/products.json");
  const nov = document.getElementById("novidadesGrid");
  if (nov) {
    const list = sortProducts(products.filter((p) => p.status !== "Vendido"), "recentes").slice(0, 8);
    renderGrid(nov, list);
  }
  const dest = document.getElementById("destaquesGrid");
  if (dest) {
    const list = products.filter((p) => p.destaque).sort((a, b) => a.ordemEditorial - b.ordemEditorial).slice(0, 4);
    renderGrid(dest, list);
  }
}

// ---- Página Produto (?id=) ----
async function initProductPage() {
  const wrap = document.getElementById("productDetail");
  if (!wrap) return;
  const products = await fetchJSON("data/products.json");
  const id = getParam("id");
  const p = products.find((x) => x.id === id) || products[0];
  document.title = `${p.nome} · ${BRECHO_CONFIG.nome}`;

  const thumbs = p.fotos.map((f, i) =>
    `<button class="${i === 0 ? "active" : ""}" data-thumb="${i}" aria-label="Ver foto ${i + 1} de ${p.nome}"><img src="${f}" alt="${p.nome} foto ${i + 1}" loading="lazy"></button>`).join("");
  const slides = p.fotos.map((f, i) =>
    `<div class="carousel-item ${i === 0 ? "active" : ""}"><img src="${f}" class="d-block w-100" alt="${p.nome} — foto ${i + 1}" loading="${i ? "lazy" : "eager"}"></div>`).join("");

  wrap.innerHTML = `
    <div class="row g-4 g-lg-5">
      <div class="col-12 col-lg-7">
        <div class="gallery-main">
          <div id="galeria" class="carousel slide carousel-fade" data-bs-ride="false">
            <div class="carousel-inner">${slides}</div>
            ${p.fotos.length > 1 ? `
            <button class="carousel-control-prev" type="button" data-bs-target="#galeria" data-bs-slide="prev" aria-label="Foto anterior">
              <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#galeria" data-bs-slide="next" aria-label="Próxima foto">
              <span class="carousel-control-next-icon" aria-hidden="true"></span>
            </button>` : ""}
          </div>
        </div>
        <div class="thumbs" role="tablist" aria-label="Miniaturas">${thumbs}</div>
        ${p.fotoIlustrativa ? `<p class="small text-muted mt-2">Foto ilustrativa. Consulte as imagens reais da peça antes de comprar.</p>` : ""}
      </div>
      <div class="col-12 col-lg-5">
        <p class="eyebrow">${p.categoria} · ${p.subcategoria || ""}</p>
        <h1 class="mt-1">${p.nome}</h1>
        <p class="fs-3 fw-bold mt-2">${BRL(p.preco)}</p>
        <div class="d-flex gap-2 flex-wrap align-items-center">
          <span class="status-pill status-${p.status}">${p.status}</span>
          <span class="condition-pill"><i class="bi bi-patch-check"></i> Condição: ${p.condicao}</span>
        </div>
        <dl class="spec-table mt-4">
          <dt>Tamanho</dt><dd>${p.tamanho}</dd>
          <dt>Marca</dt><dd>${p.marca}</dd>
          <dt>Cor</dt><dd>${p.cor}</dd>
          <dt>Medidas</dt><dd>${p.medidas}</dd>
          <dt>Material</dt><dd>${p.material}</dd>
          <dt>Sobre a peça</dt><dd class="fw-normal text-secondary">${p.descricao}</dd>
        </dl>
        <div class="d-grid gap-2 mt-3">
          ${p.status === "Vendido"
            ? `<div class="availability-note sold"><i class="bi bi-check2-circle" aria-hidden="true"></i><span>Essa peça já encontrou um novo dono. Veja outros achados no catálogo.</span></div>`
            : p.status === "Reservado"
            ? `<div class="availability-note reserved"><i class="bi bi-clock-history" aria-hidden="true"></i><span>Esta peça está reservada e aguarda confirmação. Consulte a Sassá para saber se ela voltou a ficar disponível.</span></div>
               <a class="btn-outline-b text-center" href="${whatsappProdutoLink(p)}" target="_blank" rel="noopener">Consultar pelo WhatsApp</a>`
            : `<div class="product-add-actions">
                 <button type="button" class="btn-add-cart" id="btnAddCartDetail"><i class="bi bi-bag-plus me-1"></i> Adicionar ao carrinho</button>
                 <a class="btn-boutique text-center" href="checkout.html?item=${p.id}"><i class="bi bi-bag-check me-1"></i> Comprar agora</a>
               </div>
               <a class="btn-boutique btn-whats text-center" href="${whatsappProdutoLink(p)}" target="_blank" rel="noopener"><i class="bi bi-whatsapp me-1"></i> Quero essa peça no WhatsApp</a>`}
          <a class="btn-outline-b text-center" href="catalogo.html">Voltar ao catálogo</a>
        </div>
        <p class="small text-muted mt-3"><i class="bi bi-shield-check me-1"></i>Peça única · Higienizada · Reserva mediante confirmação no WhatsApp.</p>
      </div>
    </div>`;

  // Botão "Adicionar ao carrinho" (a peça já some do card quando vendida, mas confere de novo aqui)
  const btnAddCartDetail = document.getElementById("btnAddCartDetail");
  if (btnAddCartDetail && window.Cart) {
    btnAddCartDetail.addEventListener("click", () => {
      const res = Cart.add({
        id: p.id, nome: p.nome, preco: p.preco, foto: p.fotos[0],
        tamanho: p.tamanho, cor: p.cor, status: p.status,
      });
      if (res.ok) {
        CartToast(`"${p.nome}" adicionada ao carrinho! 🛍️`);
        btnAddCartDetail.classList.add("added");
        btnAddCartDetail.innerHTML = `<i class="bi bi-bag-check me-1"></i> Adicionada ao carrinho`;
      } else if (res.reason === "duplicado") {
        CartToast("Essa peça já está no seu carrinho.");
      } else {
        CartToast("Essa peça não está mais disponível.");
      }
    });
  }

  // Thumbs -> carousel
  const carouselEl = document.getElementById("galeria");
  const carousel = window.bootstrap ? new bootstrap.Carousel(carouselEl, { interval: false, touch: true }) : null;
  $$("[data-thumb]", wrap).forEach((btn) => {
    btn.addEventListener("click", () => {
      $$("[data-thumb]", wrap).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      carousel?.to(Number(btn.dataset.thumb));
    });
  });
  carouselEl?.addEventListener("slid.bs.carousel", (e) => {
    $$("[data-thumb]", wrap).forEach((b) => b.classList.toggle("active", Number(b.dataset.thumb) === e.to));
  });

  // Relacionados
  const rel = document.getElementById("relatedGrid");
  if (rel) {
    const list = products.filter((x) => x.id !== p.id && (x.categoria === p.categoria || (x.colecao || []).some((c) => (p.colecao || []).includes(c)))).slice(0, 4);
    renderGrid(rel, list.length ? list : products.filter((x) => x.id !== p.id).slice(0, 4));
  }
  if (window.BrechoAnimations) window.BrechoAnimations.observe();
}

// ---- Página Coleções (lista + detalhe ?colecao=) ----
async function initCollectionsPage() {
  const listEl = document.getElementById("collectionsList");
  const detailEl = document.getElementById("collectionDetail");
  if (!listEl && !detailEl) return;
  const [collections, products] = await Promise.all([fetchJSON("data/collections.json"), fetchJSON("data/products.json")]);
  const slug = getParam("colecao");

  if (listEl && !slug) {
    listEl.innerHTML = collections.map((c, i) => `
      <a href="colecoes.html?colecao=${c.slug}" class="campaign reveal ${i % 2 ? "reveal-d1" : ""}" style="min-height:300px">
        <img src="${c.imagem}" alt="${c.titulo}" loading="lazy">
        <div class="campaign-body"><p class="eyebrow text-white-50">${c.nome}</p><h3>${c.titulo}</h3><p class="mb-0">${c.subtitulo}</p></div>
      </a>`).join("");
  }
  if (detailEl && slug) {
    const c = collections.find((x) => x.slug === slug) || collections[0];
    document.title = `${c.nome} · ${BRECHO_CONFIG.nome}`;
    const items = products.filter((p) => (p.colecao || []).includes(c.slug)).sort((a, b) => a.ordemEditorial - b.ordemEditorial);
    detailEl.innerHTML = `
      <div class="campaign reveal in" style="min-height:min(60vh,440px)">
        <img src="${c.imagem}" alt="${c.titulo}">
        <div class="campaign-body"><p class="eyebrow text-white-50">Coleção · ${c.nome}</p><h1>${c.titulo}</h1><p class="lead mb-0">${c.subtitulo}</p></div>
      </div>
      <div class="row justify-content-center text-center mt-4"><div class="col-lg-8"><p class="fs-5 text-secondary reveal in">“${c.manifesto}”</p></div></div>
      <div class="section-head mt-5"><div><p class="eyebrow">Seleção</p><h2>Peças da coleção</h2></div>
        <a class="link-more" href="catalogo.html?colecao=${c.slug}">Ver catálogo completo</a></div>
      <div class="product-grid cols-3" id="colGrid">${items.map(productCard).join("") || `<div class="empty-state" style="grid-column:1/-1"><h3>Em breve</h3><p class="text-muted">Estamos fotografando as peças desta coleção.</p></div>`}</div>
      <div class="section-tight"><div class="section-head"><div><p class="eyebrow">Editorial</p><h2>Looks & inspiração</h2></div></div>
        <p class="text-secondary">${c.editorial.texto}</p>
        <div class="row g-3">${c.editorial.fotos.map((f, i) => `<div class="col-4"><div class="cat-tile" style="aspect-ratio:3/4"><img src="${f}" alt="Editorial ${c.nome} ${i + 1}" loading="lazy"></div></div>`).join("")}</div>
      </div>
      <div class="final-cta mt-4"><p class="eyebrow" style="color:#D8C6A8">Gostou de alguma peça?</p>
        <h2>Chama no WhatsApp antes que venda</h2>
        <div class="d-flex gap-2 justify-content-center flex-wrap mt-3">
          <a class="btn-boutique btn-whats" data-wa href="#"><i class="bi bi-whatsapp me-1"></i> Falar no WhatsApp</a>
          <a class="btn-outline-b" style="color:#FAF6EF!important;border-color:#FAF6EF" href="catalogo.html?colecao=${c.slug}">Ver catálogo</a>
        </div></div>`;
    applyConfig();
  }
  if (window.BrechoAnimations) window.BrechoAnimations.observe();
}

document.addEventListener("DOMContentLoaded", () => {
  initCatalogPage().catch(console.error);
  initHome().catch(console.error);
  initProductPage().catch(console.error);
  initCollectionsPage().catch(console.error);
});
