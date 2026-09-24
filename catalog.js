<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Catálogo — Brechó da Sassá</title>
  <meta name="description" content="Garimpe o catálogo: filtre por categoria, tamanho, preço, cor e condição. Peças únicas com compra pelo WhatsApp.">
  <meta property="og:title" content="Catálogo — Brechó da Sassá">
  <link rel="icon" type="image/svg+xml" href="assets/img/favicon.svg">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
  <link href="css/style.css" rel="stylesheet">
  <link href="css/animations.css" rel="stylesheet">
  <link href="css/cart.css" rel="stylesheet">
</head>
<body data-page="catalogo">

<header class="site-header" id="siteHeader">
  <nav class="navbar navbar-expand-lg" aria-label="Navegação principal">
    <div class="container nav-layout">
      <a class="brand" href="index.html" aria-label="Brechó da Sassá, página inicial"><span class="brand-mark" aria-hidden="true">S</span><span class="brand-text">Brechó <em>da Sassá</em></span></a>
      <div class="collapse navbar-collapse justify-content-center" id="menuDesktop"><ul class="navbar-nav"><li class="nav-item"><a class="nav-link" data-nav="inicio" href="index.html">Início</a></li>
<li class="nav-item"><a class="nav-link" data-nav="catalogo" href="catalogo.html">Catálogo</a></li>
<li class="nav-item"><a class="nav-link" data-nav="colecoes" href="colecoes.html">Coleções</a></li>
<li class="nav-item"><a class="nav-link" data-nav="sobre" href="sobre.html">Sobre</a></li>
<li class="nav-item"><a class="nav-link" data-nav="como-comprar" href="como-comprar.html">Como comprar</a></li>
<li class="nav-item"><a class="nav-link" data-nav="contato" href="contato.html">Contato</a></li></ul></div>
      <div class="nav-actions">
        <a class="nav-search" href="catalogo.html#searchInput" aria-label="Buscar no catálogo"><i class="bi bi-search" aria-hidden="true"></i></a>
        <button class="btn-cart-icon" type="button" data-cart-toggle aria-label="Abrir carrinho"><i class="bi bi-bag" aria-hidden="true"></i><span class="cart-badge d-none" data-badge-count>0</span></button>
        <button class="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#menuMobile" aria-controls="menuMobile" aria-label="Abrir menu"><i class="bi bi-list" aria-hidden="true"></i></button>
      </div>
    </div>
  </nav>
</header>
<div class="offcanvas offcanvas-end menu-mobile" tabindex="-1" id="menuMobile" aria-labelledby="menuMobileLabel">
  <div class="offcanvas-header"><span class="brand" id="menuMobileLabel"><span class="brand-mark" aria-hidden="true">S</span><span class="brand-text">Brechó <em>da Sassá</em></span></span><button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Fechar menu"></button></div>
  <div class="offcanvas-body"><nav aria-label="Menu móvel"><a class="nav-link" data-nav="inicio" href="index.html">Início</a>
<a class="nav-link" data-nav="catalogo" href="catalogo.html">Catálogo</a>
<a class="nav-link" data-nav="colecoes" href="colecoes.html">Coleções</a>
<a class="nav-link" data-nav="sobre" href="sobre.html">Sobre</a>
<a class="nav-link" data-nav="como-comprar" href="como-comprar.html">Como comprar</a>
<a class="nav-link" data-nav="contato" href="contato.html">Contato</a></nav>
    <a class="btn-boutique btn-whats w-100 text-center mt-4" data-wa href="#"><i class="bi bi-whatsapp me-1"></i> Falar no WhatsApp</a>
  </div>
</div>

<main>
  <div class="container page-hero">
    <p class="eyebrow">Garimpo online</p>
    <h1 id="collectionTitle">Catálogo</h1>
    <p class="text-secondary" style="max-width:46ch">Peças únicas para garimpar. Confira medidas e condição antes de escolher.</p>
    <div class="catalog-editorial" aria-label="Inspiração para o seu garimpo">
      <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=700&auto=format&fit=crop" alt="Look com peças de moda vintage" loading="lazy" width="700" height="400">
      <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=700&auto=format&fit=crop" alt="Seleção de roupas em arara" loading="lazy" width="700" height="400">
    </div>
  </div>

  <div class="container pb-5">
    <!-- Barra: busca + ordenar + botão filtros mobile -->
    <div class="row g-2 align-items-center mb-3">
      <div class="col-12 col-md-5">
        <div class="input-group">
          <span class="input-group-text bg-white" style="border-color:var(--line)"><i class="bi bi-search"></i></span>
          <input id="searchInput" class="form-control" type="search" placeholder="Buscar por nome, categoria, marca…" aria-label="Buscar peças" data-filter="q">
        </div>
      </div>
      <div class="col-8 col-md-5">
        <select class="form-select" name="ordenar" aria-label="Ordenar produtos" data-filter="ordenar">
          <option value="recentes">Mais recentes</option>
          <option value="menor">Menor preço</option>
          <option value="maior">Maior preço</option>
          <option value="destaques">Destaques</option>
        </select>
      </div>
      <div class="col-4 col-md-2 d-lg-none d-grid">
        <button class="btn btn-dark" data-bs-toggle="offcanvas" data-bs-target="#filtrosMobile" aria-controls="filtrosMobile"><i class="bi bi-sliders me-1"></i> Filtros</button>
      </div>
      <div class="col-12 d-flex align-items-center gap-2 flex-wrap">
        <span class="small text-muted" data-count aria-live="polite"></span>
        <span data-chips class="d-flex gap-1 flex-wrap"></span>
      </div>
    </div>

    <div class="row g-4">
      <!-- Painel desktop -->
      <aside class="col-lg-3 d-none d-lg-block" aria-label="Filtros">
        <div class="card p-3 position-sticky" style="top:90px;border-color:var(--line);border-radius:12px">
          <h2 class="h6 text-uppercase mb-3" style="letter-spacing:.15em">Filtrar</h2>
          <div class="mb-3"><label class="form-label" for="f-cat">Categoria</label><select id="f-cat" class="form-select" name="categoria" data-filter="categoria"></select></div>
          <div class="mb-3"><label class="form-label" for="f-tam">Tamanho</label><select id="f-tam" class="form-select" name="tamanho" data-filter="tamanho"></select></div>
          <div class="mb-3"><label class="form-label" for="f-pre">Faixa de preço</label>
            <select id="f-pre" class="form-select" name="preco" data-filter="preco">
              <option value="">Todos os preços</option>
              <option value="0-70">Até R$70</option>
              <option value="70-120">R$70 – R$120</option>
              <option value="120-200">R$120 – R$200</option>
              <option value="200-9999">Acima de R$200</option>
            </select></div>
          <div class="mb-3"><label class="form-label" for="f-cor">Cor</label><select id="f-cor" class="form-select" name="cor" data-filter="cor"></select></div>
          <div class="mb-3"><label class="form-label" for="f-con">Condição</label><select id="f-con" class="form-select" name="condicao" data-filter="condicao"></select></div>
          <div class="mb-3"><label class="form-label" for="f-mar">Marca</label><select id="f-mar" class="form-select" name="marca" data-filter="marca"></select></div>
          <div class="form-check mb-3"><input class="form-check-input" type="checkbox" id="f-des" data-filter="destaqueApenas"><label class="form-check-label small" for="f-des">Somente destaques</label></div>
          <button class="btn-outline-b w-100" data-clear>Limpar filtros</button>
        </div>
      </aside>
      <!-- Grade -->
      <div class="col-12 col-lg-9">
        <div class="product-grid cols-3" id="catalogGrid" aria-live="polite">
          <div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>
          <div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>
        </div>
      </div>
    </div>
  </div>
</main>

<!-- Filtros mobile: offcanvas -->
<div class="offcanvas offcanvas-bottom" tabindex="-1" id="filtrosMobile" aria-labelledby="filtrosMobileLabel" style="height:85vh;border-radius:16px 16px 0 0">
  <div class="offcanvas-header"><h2 class="h6 mb-0 text-uppercase" id="filtrosMobileLabel" style="letter-spacing:.15em">Filtros</h2>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Fechar filtros"></button></div>
  <div class="offcanvas-body">
    <div class="row g-3">
      <div class="col-6"><label class="form-label">Categoria</label><select class="form-select" name="categoria" data-filter="categoria"></select></div>
      <div class="col-6"><label class="form-label">Tamanho</label><select class="form-select" name="tamanho" data-filter="tamanho"></select></div>
      <div class="col-6"><label class="form-label">Preço</label>
        <select class="form-select" name="preco" data-filter="preco">
          <option value="">Todos</option><option value="0-70">Até R$70</option><option value="70-120">R$70–120</option>
          <option value="120-200">R$120–200</option><option value="200-9999">+R$200</option>
        </select></div>
      <div class="col-6"><label class="form-label">Cor</label><select class="form-select" name="cor" data-filter="cor"></select></div>
      <div class="col-6"><label class="form-label">Condição</label><select class="form-select" name="condicao" data-filter="condicao"></select></div>
      <div class="col-6"><label class="form-label">Marca</label><select class="form-select" name="marca" data-filter="marca"></select></div>
    </div>
    <div class="d-flex gap-2 mt-4">
      <button class="btn-outline-b flex-fill" data-clear>Limpar</button>
      <button class="btn-boutique flex-fill" data-bs-dismiss="offcanvas">Ver peças</button>
    </div>
  </div>
</div>

<footer class="site-footer" aria-label="Rodapé">
  <div class="container py-5"><div class="row g-4">
    <div class="col-12 col-md-4"><a class="brand" href="index.html">Brechó <em>da Sassá</em></a>
      <p class="small mt-2" style="color:#B9AE9C"><span data-config="cidade">Porto Alegre · RS</span> · <span data-config="horario">Seg a Sáb · 10h às 19h</span></p></div>
    <div class="col-6 col-md-4"><ul class="list-unstyled small d-grid gap-1">
      <li><a href="index.html">Início</a></li><li><a href="catalogo.html">Catálogo</a></li><li><a href="colecoes.html">Coleções</a></li><li><a href="contato.html">Contato</a></li></ul></div>
    <div class="col-6 col-md-4"><ul class="list-unstyled small d-grid gap-1">
      <li><a data-wa href="#"><i class="bi bi-whatsapp me-1"></i> WhatsApp</a></li>
      <li><a data-ig href="#"><i class="bi bi-instagram me-1"></i> Instagram</a></li></ul></div>
  </div></div>
  <div class="footer-bottom"><div class="container">© <span data-year>2026</span> <span data-config="nome">Brechó da Sassá</span></div></div>
</footer>
<a class="wa-float" data-wa href="#" aria-label="Conversar no WhatsApp"><i class="bi bi-whatsapp"></i></a>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="js/app.js"></script>
<script src="js/cart.js"></script>
<script src="js/catalog.js"></script>
<script src="js/animations.js"></script>
</body>
</html>
